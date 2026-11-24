// Hidden information. Everything a page writes to the room can be read by everybody, and public space state can
// be written by anybody, so:
//
//   commit / reveal   A player publishes SHA-256(nonce, value) now and the value with its nonce later. Nobody can
//                     change what they committed to, and nobody learns it before the reveal. Synchronous (the
//                     hash is plain TypeScript). Commitments are published in the player's own user state, which
//                     the room ties to its sender.
//   fair draws        A player's own random draw is never trusted alone. The player commits to a secret; the
//                     referee then publishes a number for that commitment; the draw is SHA-256(secret, number).
//                     The player knows the draw at once, everyone else when the secret is revealed, and everyone
//                     checks the secret against the commitment the referee recorded. A changed secret is
//                     rejected; a player who does not reveal by the referee's deadline forfeits. The player's part
//                     lives in the player's user state and the referee's part in the referee's user state, so no
//                     other client can change either. The secret is saved on the device, so a page reload during
//                     a round gets the same draw back.
//   seal / open       One player encrypts a value for another: ECDH P-256 between the two key pairs, then
//                     AES-GCM (WebCrypto, so asynchronous). Public keys travel in the announcement leaf.
//                     The trust is the upstream games' own: whoever deals knows what they dealt.

import type { Core } from "./core.ts";
import type { Presence } from "./presence.ts";
import type { Referee } from "./referee.ts";
import { sha256, sha256Text, toHex } from "./sha256.ts";
import type { CryptoLike, KeyValueStore } from "./types.ts";
import { asciiJson, canonicalJson, fromBase64, isRecord, safeParse, toBase64, utf8Decode, utf8Encode } from "./util.ts";
import { RefereeTable } from "./refrecord.ts";
import { decodeValue, encodeValue } from "./values.ts";

/** What stays private until the reveal. */
export interface Opening {
  /** The value, in the tagged JSON form of values.ts. */
  v: unknown;
  /** The nonce. */
  s: string;
}

export interface Commitment {
  /** Publish this. */
  readonly hash: string;
  /** Keep this, and publish it when the time comes. */
  reveal(): Opening;
}

export type DrawState =
  /** No draw under that label. */
  | "none"
  /** The player has committed; the referee has not answered yet. */
  | "committed"
  /** The referee's number is in: the player knows the draw, nobody else does. */
  | "numbered"
  /** The secret is public and matches: everybody knows the draw. */
  | "revealed"
  /** The commitment or the secret was changed after the referee's number. */
  | "rejected"
  /** The referee's deadline passed without a valid reveal. */
  | "forfeit";

/** The outcome of a fair draw: as many independent numbers as the game asks for. */
export class Draw {
  private readonly seed: string;
  constructor(seed: string) {
    this.seed = seed;
  }
  /** An integer in [0, maxExclusive). `index` picks which of the draw's numbers: die 0, die 1, ... */
  Int(maxExclusive: number, index = 0): number {
    const h = sha256(utf8Encode(`${this.seed}\n${index}`));
    // 48 bits is far more than any game range needs, and stays exact in a double.
    const n = h[0]! * 2 ** 40 + h[1]! * 2 ** 32 + h[2]! * 2 ** 24 + h[3]! * 2 ** 16 + h[4]! * 2 ** 8 + h[5]!;
    return n % Math.max(1, Math.floor(maxExclusive));
  }
  Ints(count: number, maxExclusive: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < count; i++) out.push(this.Int(maxExclusive, i));
    return out;
  }
  /** In [0, 1). */
  Float(index = 0): number {
    return this.Int(2 ** 32, index) / 2 ** 32;
  }
  toString(): string {
    return this.seed;
  }
}

export interface DrawStatus {
  state: DrawState;
  /** Present for the local player once numbered, and for everyone once revealed. */
  draw: Draw | null;
}

/** [label, hash, number, deadline in synced seconds or 0, forfeit 0 | 1, the player's user id] */
type DrawEntry = [string, string, string, number, number, string];

/** How long the referee keeps the entry of a player who left, for a page reload to pick it up again. */
const DRAW_KEEP_MS = 120000;

function parseDrawEntry(e: unknown): DrawEntry | null {
  if (!Array.isArray(e) || typeof e[0] !== "string" || typeof e[1] !== "string" || typeof e[2] !== "string") return null;
  return [e[0], e[1], e[2], typeof e[3] === "number" ? e[3] : 0, e[4] === 1 ? 1 : 0, typeof e[5] === "string" ? e[5] : ""];
}

const CURVE = { name: "ECDH", namedCurve: "P-256" };

export class Secrets {
  private readonly core: Core;
  private readonly presence: Presence;
  private readonly referee: Referee;
  private readonly crypto: CryptoLike;
  private readonly nowSeconds: () => number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private privateKey: any = null;
  private publicKeyText = "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly derived = new Map<string, Promise<any>>();
  private mySecret: { label: string; secret: string } | null = null;
  private readonly lastStates = new Map<string, string>();
  /** The referee's numbers and judgements, read from the referee's own user state. */
  private readonly numbers: RefereeTable<DrawEntry>;
  private readonly pins = new Map<string, [string, string]>();
  private pinsEpoch = -1;
  private readonly warnedPins = new Set<string>();
  private readonly goneSince = new Map<string, number>();
  private drawStore: KeyValueStore | null = null;
  private drawKey = "";
  private restoring: { e: number; l: string; s: string; r: number } | null = null;
  /** Told when a player's draw changes state. */
  onDrawChanged: (sid: string, label: string, status: DrawStatus) => void = () => {};

  constructor(core: Core, presence: Presence, referee: Referee, nowSeconds: () => number) {
    this.core = core;
    this.presence = presence;
    this.referee = referee;
    this.crypto = core.platform.crypto;
    this.nowSeconds = nowSeconds;
    this.numbers = new RefereeTable(presence, referee, "fn", parseDrawEntry);
  }

  /** Starts following commitments, the referee's numbers and reveals. */
  listen(): void {
    this.presence.onExtra(() => this.review());
    this.presence.on(() => this.review());
    this.referee.on(() => this.review());
  }

  // ---- commit / reveal ----------------------------------------------------------------------------------------

  commit(value: unknown): Commitment {
    const nonce = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
    const opening: Opening = { v: encodeValue(value), s: nonce };
    const hash = hashOpening(opening);
    return { hash, reveal: () => ({ v: opening.v, s: opening.s }) };
  }

  /** True when `opening` is what `hash` committed to. */
  verify(hash: string | null | undefined, opening: Opening | null | undefined): boolean {
    if (!opening || typeof opening.s !== "string" || typeof hash !== "string") return false;
    return hashOpening(opening) === hash;
  }

  /** The value inside an opening, with value types rebuilt. Check it with `verify` first. */
  valueOf<T = unknown>(opening: Opening): T {
    return decodeValue(opening.v) as T;
  }

  /** Publishes one of the local player's commitments under `label`, in their own user state. */
  publish(label: string, hash: string): void {
    const all = { ...this.own("c") };
    all[label] = hash;
    this.presence.setExtra("c", all);
  }

  /** Takes a published commitment back (when its round is over). */
  retract(label: string): void {
    const all = { ...this.own("c") };
    delete all[label];
    this.presence.setExtra("c", Object.keys(all).length ? all : undefined);
  }

  /** The commitment a participant published under `label`, or null. Only that player can have written it. */
  published(sid: string, label: string): string | null {
    const all = this.presence.extra(sid, "c");
    return isRecord(all) && typeof all[label] === "string" ? (all[label] as string) : null;
  }

  private own(name: string): Record<string, unknown> {
    const value = this.presence.extra(this.core.me.sid, name);
    return isRecord(value) ? value : {};
  }

  // ---- fair draws ---------------------------------------------------------------------------------------------
  //
  // Where each part lives, so that nobody can change another player's part:
  //   x.fd  [label, hash]          the player's commitment, in the player's own user state
  //   x.fr  [label, secret]        the player's reveal, in the player's own user state
  //   x.fn  {e, m: {sid: entry}}   the referee's numbers and judgements, in the referee's own user state
  //                                (refrecord.ts); entry = [label, hash, number, deadline, forfeit, uid]
  // Each client also keeps the first hash and number it saw for a player's label in this epoch (`pins`): a later
  // table that changes them (a referee seat taken over by a modified client) is not believed.

  /** Starts a draw for the local player under `label` (a round name). It replaces their previous draw. */
  beginDraw(label: string): void {
    const secret = toBase64(this.crypto.getRandomValues(new Uint8Array(16)));
    this.mySecret = { label, secret };
    this.restoring = null;
    this.saveDraw(false);
    this.presence.setExtra("fr", undefined);
    this.presence.setExtra("fd", [label, sha256Text(secret)]);
  }

  /** Publishes the local player's secret for `label`, so everyone can compute and check the draw. */
  revealDraw(label: string): void {
    if (!this.mySecret || this.mySecret.label !== label) return;
    this.saveDraw(true);
    this.presence.setExtra("fr", [label, this.mySecret.secret]);
  }

  /** The referee starts the clock: draws under `label` not revealed within `seconds` are forfeit. */
  demandReveal(label: string, seconds: number): void {
    if (!this.referee.isMe()) return;
    const table = this.numbers.working();
    const deadline = this.nowSeconds() + seconds;
    let changed = false;
    for (const sid of Object.keys(table)) {
      const entry = table[sid]!;
      if (entry[0] === label && entry[3] === 0 && entry[4] === 0) {
        entry[3] = deadline;
        changed = true;
      }
    }
    if (changed) this.numbers.write(table);
  }

  /** Where a participant's draw under `label` stands, and the draw itself once this client may know it. */
  drawOf(sid: string, label: string): DrawStatus {
    const entry = this.entryOf(sid);
    const committed = this.presence.extra(sid, "fd");
    const hasCommit = Array.isArray(committed) && committed[0] === label && typeof committed[1] === "string";
    if (!entry || entry[0] !== label) return { state: hasCommit ? "committed" : "none", draw: null };
    const [, hash, number, , forfeit] = entry;
    if (hasCommit && committed[1] !== hash) return { state: "rejected", draw: null };
    const revealed = this.presence.extra(sid, "fr");
    if (Array.isArray(revealed) && revealed[0] === label && typeof revealed[1] === "string") {
      if (sha256Text(revealed[1]) !== hash) return { state: "rejected", draw: null };
      if (forfeit) return { state: "forfeit", draw: null };
      return { state: "revealed", draw: new Draw(drawSeed(revealed[1], number, label)) };
    }
    if (forfeit) return { state: "forfeit", draw: null };
    if (sid === this.core.me.sid && this.mySecret && this.mySecret.label === label && sha256Text(this.mySecret.secret) === hash) {
      return { state: "numbered", draw: new Draw(drawSeed(this.mySecret.secret, number, label)) };
    }
    return { state: "numbered", draw: null };
  }

  /** The local player's own draw under `label`, as soon as the referee's number is in. */
  myDraw(label: string): Draw | null {
    return this.drawOf(this.core.me.sid, label).draw;
  }

  /** A participant's entry in the referee's table, with the hash and number this client saw first. */
  private entryOf(sid: string): DrawEntry | null {
    const entry = this.numbers.read()[sid];
    if (!entry) return null;
    const epoch = this.referee.epoch;
    if (this.pinsEpoch !== epoch) {
      this.pins.clear();
      this.pinsEpoch = epoch;
    }
    const key = `${entry[5]}\n${entry[0]}`;
    const pin = this.pins.get(key);
    if (!pin) {
      this.pins.set(key, [entry[1], entry[2]]);
      return entry;
    }
    if (pin[0] !== entry[1] || pin[1] !== entry[2]) {
      if (!this.warnedPins.has(key)) {
        this.warnedPins.add(key);
        this.core.log("warn", `the referee's table changed the pinned commitment or number of a draw (${entry[0]}); keeping the first one seen`);
      }
      return [entry[0], pin[0], pin[1], entry[3], entry[4], entry[5]];
    }
    return entry;
  }

  /** Looks at every participant's draw: the referee answers and judges, and everyone reports changes. */
  review(): void {
    if (this.core.disposed) return;
    this.restoreDraw();
    if (this.referee.isMe()) this.officiate();
    for (const who of this.presence.list()) {
      const committed = this.presence.extra(who.sid, "fd");
      const entry = this.entryOf(who.sid);
      const label = entry ? entry[0] : Array.isArray(committed) && typeof committed[0] === "string" ? committed[0] : null;
      if (label === null) continue;
      const status = this.drawOf(who.sid, label);
      const mark = `${label}\n${status.state}`;
      if (this.lastStates.get(who.sid) === mark) continue;
      this.lastStates.set(who.sid, mark);
      this.core.guard("draw handler", () => this.onDrawChanged(who.sid, label, status));
    }
  }

  private officiate(): void {
    const table = this.numbers.working();
    let changed = false;
    const now = this.nowSeconds();
    const clock = this.core.platform.clock.now();
    // A player who left keeps their entry for a while: a page reload comes back as a new session of the same
    // user, republishes the same commitment (the secret is saved on the device) and gets the entry back.
    for (const sid of Object.keys(table)) {
      if (this.presence.has(sid)) {
        this.goneSince.delete(sid);
        continue;
      }
      const since = this.goneSince.get(sid) ?? clock;
      this.goneSince.set(sid, since);
      if (clock - since >= DRAW_KEEP_MS) {
        delete table[sid];
        this.goneSince.delete(sid);
        changed = true;
      }
    }
    for (const who of this.presence.list()) {
      const committed = this.presence.extra(who.sid, "fd");
      const entry = table[who.sid];
      if (Array.isArray(committed) && typeof committed[0] === "string" && typeof committed[1] === "string") {
        // A new label is a new draw. The same label keeps the commitment that was answered first: a player
        // who swaps it after seeing the number gets no second number, and their reveal will not match.
        if (!entry || entry[0] !== committed[0]) {
          const before = Object.keys(table).find((sid) => {
            const e = table[sid]!;
            return !this.presence.has(sid) && e[5] === who.uid && e[0] === committed[0] && e[1] === committed[1];
          });
          if (before !== undefined) {
            table[who.sid] = table[before]!;
            delete table[before];
            this.goneSince.delete(before);
          } else table[who.sid] = [committed[0], committed[1], toBase64(this.crypto.getRandomValues(new Uint8Array(16))), 0, 0, who.uid];
          changed = true;
          continue;
        }
      }
      if (entry && entry[3] > 0 && entry[4] === 0 && now >= entry[3]) {
        const revealed = this.presence.extra(who.sid, "fr");
        const ok = Array.isArray(revealed) && revealed[0] === entry[0] && typeof revealed[1] === "string" && sha256Text(revealed[1]) === entry[1];
        if (!ok) {
          entry[4] = 1;
          changed = true;
        }
      }
    }
    if (changed) this.numbers.write(table);
  }

  private saveDraw(revealed: boolean): void {
    if (!this.drawStore || !this.mySecret) return;
    try {
      this.drawStore.set(this.drawKey, JSON.stringify({ e: this.referee.epoch, l: this.mySecret.label, s: this.mySecret.secret, r: revealed ? 1 : 0 }));
    } catch {
      /* not saved: a reload loses the draw */
    }
  }

  /**
   * After a page reload: the secret this device saved comes back once the referee's table (as last mirrored)
   * still holds this user's entry for it; the commitment (and the reveal, if it was made) is published again and
   * the referee moves the entry to the new session.
   */
  private restoreDraw(): void {
    const saved = this.restoring;
    if (!saved || this.mySecret) return;
    const epoch = this.referee.epoch;
    if (epoch === 0) return;
    if (saved.e !== 0 && saved.e !== epoch) {
      this.restoring = null;
      return;
    }
    const hash = sha256Text(saved.s);
    const table = this.numbers.read();
    const mine = Object.keys(table)
      .map((sid) => table[sid]!)
      .filter((e) => e[5] === this.core.me.uid);
    if (mine.some((e) => e[0] === saved.l && e[1] === hash)) {
      this.restoring = null;
      this.mySecret = { label: saved.l, secret: saved.s };
      this.presence.setExtra("fd", [saved.l, hash]);
      if (saved.r) this.presence.setExtra("fr", [saved.l, saved.s]);
      this.core.log("info", `the draw '${saved.l}' came back after a reload`);
    } else if (mine.length) {
      this.restoring = null; // the table has moved on to another round
    }
  }

  // ---- seal / open --------------------------------------------------------------------------------------------

  /** The local public key (raw point, base64url). Empty before `init`. */
  get publicKey(): string {
    return this.publicKeyText;
  }

  /**
   * Makes the local key pair, or loads the one this device saved for this player and instance, so that a page
   * reload can still open what was sealed before it.
   */
  async init(store: KeyValueStore | null, storeKey: string, drawKey = ""): Promise<string> {
    const subtle = this.crypto.subtle;
    if (store && drawKey) {
      this.drawStore = store;
      this.drawKey = drawKey;
      try {
        const saved = safeParse(store.get(drawKey));
        if (isRecord(saved) && typeof saved.l === "string" && typeof saved.s === "string") {
          this.restoring = { e: typeof saved.e === "number" ? saved.e : 0, l: saved.l, s: saved.s, r: saved.r === 1 ? 1 : 0 };
        }
      } catch {
        /* nothing to restore */
      }
    }
    if (store) {
      try {
        const saved = safeParse(store.get(storeKey));
        if (isRecord(saved) && isRecord(saved.d) && typeof saved.p === "string") {
          this.privateKey = await subtle.importKey("jwk", saved.d, CURVE, false, ["deriveKey"]);
          this.publicKeyText = saved.p;
          return this.publicKeyText;
        }
      } catch {
        /* unreadable: make a new pair */
      }
    }
    const pair = await subtle.generateKey(CURVE, true, ["deriveKey"]);
    this.privateKey = pair.privateKey;
    this.publicKeyText = toBase64(new Uint8Array(await subtle.exportKey("raw", pair.publicKey)));
    if (store) {
      try {
        store.set(storeKey, JSON.stringify({ p: this.publicKeyText, d: await subtle.exportKey("jwk", pair.privateKey) }));
      } catch {
        /* the pair lives for this page only */
      }
    }
    return this.publicKeyText;
  }

  /** True once the player's public key is known, so `seal` for them can work. */
  canSealFor(sid: string): boolean {
    return !!this.presence.get(sid)?.publicKey;
  }

  /**
   * Encrypts `value` for one participant. The result is text that can go anywhere (a synced field, a network
   * event): only that player's key opens it.
   */
  async seal(forSid: string, value: unknown): Promise<string> {
    if (!this.privateKey) throw new Error("secrets are not ready");
    const target = this.presence.get(forSid);
    if (!target || !target.publicKey) throw new Error(`no public key known for player session ${forSid}`);
    const key = await this.sharedKey(target.publicKey);
    const iv = this.crypto.getRandomValues(new Uint8Array(12));
    const me = this.core.me;
    const aad = utf8Encode(`${this.core.prefix}\n${me.sid}\n${forSid}`);
    const plain = utf8Encode(canonicalJson(encodeValue(value)));
    const cipher = new Uint8Array(await this.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, plain));
    return JSON.stringify({ f: me.sid, t: forSid, u: target.uid, p: this.publicKeyText, i: toBase64(iv), c: toBase64(cipher) });
  }

  /**
   * Opens a box sealed for the local player. Throws when it is for someone else, was changed on the way, or
   * claims a sender whose announced key is not the one it was sealed with.
   */
  async open<T = unknown>(box: string): Promise<T> {
    if (!this.privateKey) throw new Error("secrets are not ready");
    const b = safeParse(box);
    if (!isRecord(b) || typeof b.f !== "string" || typeof b.t !== "string" || typeof b.p !== "string" || typeof b.i !== "string" || typeof b.c !== "string") {
      throw new Error("not a sealed box");
    }
    const me = this.core.me;
    if (b.t !== me.sid && b.u !== me.uid) throw new Error("this box is sealed for another player");
    const sender = this.presence.get(b.f);
    if (sender && sender.publicKey && sender.publicKey !== b.p) throw new Error("the box does not come from the player it names");
    const key = await this.sharedKey(b.p);
    const aad = utf8Encode(`${this.core.prefix}\n${b.f}\n${b.t}`);
    let plain: ArrayBuffer;
    try {
      plain = await this.crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(b.i), additionalData: aad }, key, fromBase64(b.c));
    } catch {
      throw new Error("the box could not be opened (wrong key or changed contents)");
    }
    return decodeValue(JSON.parse(utf8Decode(new Uint8Array(plain)))) as T;
  }

  /**
   * Seals one value per participant into a single text, for one synced field that is rewritten as a whole.
   *
   * A box written for one player at a telling moment names its reader even though nobody else can open it. Here
   * every participant gets an entry every time, each padded to `slotBytes` before encryption, in session-id
   * order: the text has the same size and shape whoever it really concerns. `valueFor` returns undefined for a
   * participant who gets nothing; their entry is filled with padding.
   */
  async sealAll(valueFor: (sid: string) => unknown, slotBytes = 256): Promise<string> {
    if (!this.privateKey) throw new Error("secrets are not ready");
    const me = this.core.me;
    const entries: Record<string, [string, string]> = {};
    const everyone = this.presence
      .list()
      .map((p) => p.sid)
      .sort();
    for (const sid of everyone) {
      const target = this.presence.get(sid);
      if (!target || !target.publicKey) continue;
      const value = valueFor(sid);
      const text = value === undefined ? "{}" : canonicalJson({ v: encodeValue(value) });
      const bytes = utf8Encode(text);
      if (bytes.length > slotBytes) throw new Error(`sealAll: the value for one player needs ${bytes.length} bytes, more than the slot of ${slotBytes}`);
      const padded = new Uint8Array(slotBytes).fill(0x20);
      padded.set(bytes);
      const key = await this.sharedKey(target.publicKey);
      const iv = this.crypto.getRandomValues(new Uint8Array(12));
      const aad = utf8Encode(`${this.core.prefix}\n${me.sid}\n${sid}\nall`);
      const cipher = new Uint8Array(await this.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad }, key, padded));
      entries[sid] = [toBase64(iv), toBase64(cipher)];
    }
    return asciiJson({ f: me.sid, p: this.publicKeyText, n: slotBytes, m: entries });
  }

  /**
   * Opens the local player's entry of a `sealAll` text. Resolves null when the entry holds nothing for them,
   * or there is none (they arrived after it was written).
   */
  async openMine<T = unknown>(bundle: string): Promise<T | null> {
    if (!this.privateKey) throw new Error("secrets are not ready");
    const b = safeParse(bundle);
    if (!isRecord(b) || typeof b.f !== "string" || typeof b.p !== "string" || !isRecord(b.m)) throw new Error("not a sealed bundle");
    const me = this.core.me;
    const entry = b.m[me.sid];
    if (!Array.isArray(entry) || typeof entry[0] !== "string" || typeof entry[1] !== "string") return null;
    const sender = this.presence.get(b.f);
    if (sender && sender.publicKey && sender.publicKey !== b.p) throw new Error("the bundle does not come from the player it names");
    const key = await this.sharedKey(b.p);
    const aad = utf8Encode(`${this.core.prefix}\n${b.f}\n${me.sid}\nall`);
    let plain: ArrayBuffer;
    try {
      plain = await this.crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(entry[0]), additionalData: aad }, key, fromBase64(entry[1]));
    } catch {
      throw new Error("the entry could not be opened (wrong key or changed contents)");
    }
    const parsed = safeParse(utf8Decode(new Uint8Array(plain)).trimEnd());
    return isRecord(parsed) && "v" in parsed ? (decodeValue(parsed.v) as T) : null;
  }

  /** True when `box` names the local player as its reader. */
  isForMe(box: string): boolean {
    const b = safeParse(box);
    return isRecord(b) && (b.t === this.core.me.sid || b.u === this.core.me.uid);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sharedKey(theirPublic: string): Promise<any> {
    let key = this.derived.get(theirPublic);
    if (!key) {
      const subtle = this.crypto.subtle;
      key = (async () => {
        const pub = await subtle.importKey("raw", fromBase64(theirPublic), CURVE, false, []);
        return subtle.deriveKey({ name: "ECDH", public: pub }, this.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      })();
      this.derived.set(theirPublic, key);
      key.catch(() => this.derived.delete(theirPublic));
    }
    return key;
  }
}

function hashOpening(opening: Opening): string {
  return sha256Text(opening.s + "\n" + canonicalJson(opening.v));
}

function drawSeed(secret: string, number: string, label: string): string {
  return toHex(sha256(utf8Encode(`${secret}\n${number}\n${label}`)));
}
