// What replaces DownloadBricksOnLoad.cs (late join), BrickSwapper.cs's server calls and the "create" RPC handler
// (NormcoreRPC.cs:231-249): every client keeps every record it has seen, from the archive segments and from the logs
// of the players present, and the placed bricks are a pure function of that set:
//
//   placed = { place records } minus { places some tombstone covers }
//
// Order does not matter (a tombstone that arrives before its brick still removes it), so two clients that have seen
// the same records show the same bricks. The referee archives every record into the segments; an author drops a
// record from its log once it is archived; the archive drops a deleted brick and its tombstone together once no
// present player's log holds them (garbage collection, see `gcable`).

import { BRICKS } from "./BrickData.ts";
import { BrickStore, type AreaBounds, type Placement } from "./BrickStore.ts";
import { argbOf } from "./ColorInt.ts";
import { type BrickRecord, encode, MAX_SEQ, type Packed, PLACE_CHARS, type PlaceRecord, recordId, TOMB_CHARS, type TombRecord } from "./BrickRecords.ts";

/** The JSON size of a packed list, kept as records are added (`{"a":[...],"r":"..."}` is 15 bytes empty). */
class SegmentSize {
  private readonly authors = new Set<string>();
  private authorBytes = 0;
  private chars = 0;

  constructor(records: readonly BrickRecord[] = []) {
    for (const r of records) this.add(r);
  }

  get bytes(): number {
    return 15 + this.authorBytes + Math.max(0, this.authors.size - 1) + this.chars;
  }

  private grow(r: BrickRecord): { authors: string[]; chars: number } {
    const authors = [r.author];
    if (r.kind === "T") authors.push(r.target);
    return { authors: [...new Set(authors)].filter((a) => !this.authors.has(a)), chars: r.kind === "P" ? PLACE_CHARS : TOMB_CHARS };
  }

  /** The size with `r` added. */
  with(r: BrickRecord): number {
    const g = this.grow(r);
    const extra = g.authors.reduce((n, a) => n + JSON.stringify(a).length + 1, 0);
    return this.bytes + extra + g.chars;
  }

  add(r: BrickRecord): void {
    const g = this.grow(r);
    for (const a of g.authors) {
      this.authors.add(a);
      this.authorBytes += JSON.stringify(a).length;
    }
    this.chars += g.chars;
  }
}

export interface ArchivePlan {
  /** New content per segment index (every segment, in order). */
  segments: Packed[];
  /** The same, decoded (so nobody decodes them again). */
  records: BrickRecord[][];
  /** Indices whose content changed. */
  changed: number[];
  repacked: boolean;
  added: number;
  dropped: number;
  /** Records that should be archived but did not fit: the archive is full (they stay in their authors' logs). */
  leftOut: number;
}

/** Whether a record can be one at all: a known brick type and orientation, sane numbers (BrickRecords.decode reads any byte). */
export function validRecord(r: BrickRecord): boolean {
  if (!Number.isInteger(r.seq) || r.seq < 1 || r.seq > MAX_SEQ || !r.author) return false;
  if (r.kind === "P") return !!BRICKS[r.type] && Number.isInteger(r.ori) && r.ori >= 0 && r.ori < 24 && r.pos.every((v) => Number.isInteger(v));
  return !!r.target && Number.isInteger(r.from) && Number.isInteger(r.to) && r.from >= 1 && r.from <= r.to && r.to <= MAX_SEQ;
}

/** JSON bytes the archive needs for some records spread over segments: the records plus each segment's envelope and author list. */
export function archiveBytes(records: Iterable<BrickRecord>, capacity: number, segments: number): number {
  const authors = new Set<string>();
  let chars = 0;
  for (const r of records) {
    chars += r.kind === "P" ? PLACE_CHARS : TOMB_CHARS;
    authors.add(r.author);
    if (r.kind === "T") authors.add(r.target);
  }
  let authorBytes = 0;
  for (const a of authors) authorBytes += JSON.stringify(a).length + 1;
  // Every segment in use may repeat every author key.
  const used = Math.min(segments, Math.max(1, Math.ceil(chars / Math.max(1, capacity - 15 - authorBytes))));
  return chars + used * (15 + authorBytes);
}

export interface ArchiveOptions {
  /** Most JSON bytes one segment may hold. */
  capacity: number;
  /** Author keys of the players present now. */
  presentAuthors: ReadonlySet<string>;
  /** Ids of records in the logs of the players present now. */
  inLogs: ReadonlySet<string>;
}

function bySeq(a: BrickRecord, b: BrickRecord): number {
  return a.author < b.author ? -1 : a.author > b.author ? 1 : a.seq - b.seq;
}

export class BrickLedger {
  readonly store: BrickStore;
  /** Every record seen, by id. */
  readonly records = new Map<string, BrickRecord>();
  /** Ids of the records in each archive segment as last read. */
  private segmentIds: Array<Set<string>> = [];
  /** Records the ledger refused (unknown type or orientation, bad numbers). */
  rejected = 0;
  private readonly placesByAuthor = new Map<string, Map<number, PlaceRecord>>();
  private readonly tombsByTarget = new Map<string, TombRecord[]>();
  private readonly maxSeq = new Map<string, number>();
  /** Bumped whenever the placed bricks change. */
  version = 0;

  constructor(bounds: AreaBounds) {
    this.store = new BrickStore(bounds);
  }

  /** Whether the archive as last read holds a record. */
  readonly archived = { has: (id: string): boolean => this.segmentIds.some((ids) => ids.has(id)) };

  /** Highest seq seen from an author, or covered by a tombstone aimed at it (0 for none): the next record must be above. */
  lastSeq(author: string): number {
    return this.maxSeq.get(author) ?? 0;
  }

  isDead(p: PlaceRecord): boolean {
    const list = this.tombsByTarget.get(p.author);
    if (!list) return false;
    for (const t of list) if (p.seq >= t.from && p.seq <= t.to) return true;
    return false;
  }

  static placement(p: PlaceRecord): Placement {
    return { id: recordId(p), type: p.type, ori: p.ori, pos: [p.pos[0], p.pos[1], p.pos[2]], color: argbOf(p.rgb) };
  }

  /**
   * Takes records in. `bulk` (late join, loading a save) defers the cover updates to one pass at the end.
   * Returns how many were new.
   */
  ingest(recs: Iterable<BrickRecord>, bulk = false): number {
    let fresh = 0;
    const touched: string[] = [];
    for (const r of recs) {
      const id = recordId(r);
      if (this.records.has(id)) continue;
      // Checked before anything is stored: a record the store cannot place must not reach the archive, where every
      // later joiner would read it (the area would be dead for them).
      if (!validRecord(r)) {
        this.rejected++;
        continue;
      }
      fresh++;
      this.records.set(id, r);
      if (r.seq > (this.maxSeq.get(r.author) ?? 0)) this.maxSeq.set(r.author, r.seq);
      // A tombstone outlives the brick it removed (garbage collection drops the brick first): an author who comes
      // back under the same key must not reuse a number it covers, or the tombstone would hide the new brick.
      if (r.kind === "T" && r.to > (this.maxSeq.get(r.target) ?? 0)) this.maxSeq.set(r.target, r.to);
      if (r.kind === "P") {
        let m = this.placesByAuthor.get(r.author);
        if (!m) this.placesByAuthor.set(r.author, (m = new Map()));
        m.set(r.seq, r);
        if (!this.isDead(r)) {
          this.store.add(BrickLedger.placement(r), !bulk);
          touched.push(id);
        }
      } else {
        let list = this.tombsByTarget.get(r.target);
        if (!list) this.tombsByTarget.set(r.target, (list = []));
        list.push(r);
        const places = this.placesByAuthor.get(r.target);
        if (places) {
          if (r.to - r.from < places.size) {
            for (let s = r.from; s <= r.to; s++) if (places.has(s) && this.store.remove(`${r.target}#${s}`, !bulk)) touched.push(id);
          } else {
            for (const s of places.keys()) if (s >= r.from && s <= r.to && this.store.remove(`${r.target}#${s}`, !bulk)) touched.push(id);
          }
        }
      }
    }
    if (bulk && fresh) this.store.recalculateAll();
    if (touched.length) this.version++;
    return fresh;
  }

  /** One archive segment as just read: its records join the set, and their ids are what authors may drop from their logs. */
  setSegment(index: number, records: readonly BrickRecord[], bulk = false): void {
    while (this.segmentIds.length <= index) this.segmentIds.push(new Set());
    this.segmentIds[index] = new Set(records.map(recordId));
    this.ingest(records, bulk);
  }

  /** Every segment at once. */
  setArchive(segments: readonly BrickRecord[][], bulk = false): void {
    this.segmentIds = segments.map((seg) => new Set(seg.map(recordId)));
    this.ingest(segments.flat(), bulk);
  }

  /**
   * Whether a record can leave the archive for good: a deleted brick that no present log holds, or a tombstone that
   * no present log holds, whose target author has gone (so nothing it covers can come back) and every brick of
   * which is itself collectable.
   */
  gcable(r: BrickRecord, o: ArchiveOptions): boolean {
    const id = recordId(r);
    if (o.inLogs.has(id)) return false;
    if (r.kind === "P") return this.isDead(r);
    if (o.presentAuthors.has(r.target)) return false;
    const places = this.placesByAuthor.get(r.target);
    if (places) for (const [s, p] of places) if (s >= r.from && s <= r.to && o.inLogs.has(recordId(p))) return false;
    return true;
  }

  /**
   * The referee's archive step. Appends every record not archived yet (in author, seq order) to the last segment
   * with room; when the segments run out, or a quarter of the archive is collectable, rewrites them all without the
   * collectable records. A full archive keeps what it holds and takes what still fits (`leftOut` counts the rest).
   * Null when nothing needs writing. `decoded` is `current` already decoded (nothing is decoded here).
   */
  planArchive(current: readonly Packed[], decoded: readonly BrickRecord[][], o: ArchiveOptions): ArchivePlan | null {
    const inArchive = new Set<string>();
    let collectable = 0;
    let total = 0;
    for (const seg of decoded) {
      for (const r of seg) {
        inArchive.add(recordId(r));
        total++;
        if (this.gcable(r, o)) collectable++;
      }
    }
    const missing: BrickRecord[] = [];
    for (const [id, r] of this.records) if (!inArchive.has(id) && !this.gcable(r, o)) missing.push(r);
    missing.sort(bySeq);
    const repackWanted = collectable >= 64 && collectable * 4 >= total;
    if (!missing.length && !repackWanted) return null;

    if (!repackWanted) {
      const segs = decoded.map((s) => s.slice());
      const sizes = segs.map((s) => new SegmentSize(s));
      const changed = new Set<number>();
      let at = 0;
      for (let i = segs.length - 1; i >= 0; i--) {
        if (segs[i]!.length) {
          at = i;
          break;
        }
      }
      let ok = true;
      let added = 0;
      for (const r of missing) {
        while (at < segs.length && sizes[at]!.with(r) > o.capacity) at++;
        if (at >= segs.length) {
          ok = false;
          break;
        }
        segs[at]!.push(r);
        sizes[at]!.add(r);
        changed.add(at);
        added++;
      }
      if (ok) {
        const segments = segs.map((s, i) => (changed.has(i) ? encode(s) : current[i]!));
        return { segments, records: segs, changed: [...changed].sort((a, b) => a - b), repacked: false, added, dropped: 0, leftOut: 0 };
      }
    }

    // Rewrite everything without the collectable records.
    const keep: BrickRecord[] = [];
    let dropped = 0;
    for (const r of this.records.values()) {
      if (this.gcable(r, o)) {
        if (inArchive.has(recordId(r))) dropped++;
      } else keep.push(r);
    }
    // What the archive holds goes first, so a full archive never drops a record it had for one it never had.
    const had = (r: BrickRecord) => (inArchive.has(recordId(r)) ? 0 : 1);
    keep.sort((a, b) => had(a) - had(b) || bySeq(a, b));
    const segs: BrickRecord[][] = current.map(() => []);
    const sizes = segs.map(() => new SegmentSize());
    let at = 0;
    let leftOut = 0;
    for (const r of keep) {
      while (at < segs.length && segs[at]!.length && sizes[at]!.with(r) > o.capacity) at++;
      if (at >= segs.length) {
        leftOut++;
        continue;
      }
      segs[at]!.push(r);
      sizes[at]!.add(r);
    }
    const segments = segs.map((s) => encode(s));
    const changed = segments.map((s, i) => (s.r !== (current[i]?.r ?? "") || JSON.stringify(s.a) !== JSON.stringify(current[i]?.a ?? []) ? i : -1)).filter((i) => i >= 0);
    const added = segs.reduce((n, seg) => n + seg.filter((r) => !inArchive.has(recordId(r))).length, 0);
    if (!changed.length) return leftOut ? { segments: [...current], records: decoded.map((d) => d.slice()), changed, repacked: false, added: 0, dropped: 0, leftOut } : null;
    return { segments, records: segs, changed, repacked: true, added, dropped, leftOut };
  }

  /** A text that is equal on two clients exactly when they show the same bricks. */
  digest(): string {
    const ids = [...this.store.bricks.keys()].sort();
    let h = 2166136261;
    const mix = (s: string) => {
      for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    };
    for (const id of ids) {
      const b = this.store.bricks.get(id)!;
      mix(`${id}:${b.type}:${b.ori}:${b.pos.join(",")}:${b.color};`);
    }
    return `${ids.length}:${(h >>> 0).toString(16)}`;
  }
}
