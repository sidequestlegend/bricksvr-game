// The page half of the chunk renderer (PORT.md 6 and TESTS.md, rendering spike). Upstream gives every placed brick a
// GameObject with a combined mesh (BrickAttach.RecalculateRenderedGeometry, BrickMeshCache). The relay cannot carry
// mesh data, so the page sends brick records and the kit's relay graph builds the geometry: one object per chunk
// (spawned from `Area/Chunks/Template`), whose mesh is Mesh.CombineMeshes over one CombineInstance per brick slot.
//
// The graph keeps the chunk's CombineInstance list between calls (an Object variable on the chunk), so after a
// placement only the bricks whose look changed are sent and parsed; the merge itself is native. Slots are stable per
// brick id; a freed slot is reused; a slot past the end is always the next one (records go in slot order), so the
// graph only ever sets an item or appends one.
//
// Relay op (Assets/Kit/Editor/BrickKitBuilder.cs, README op table of this game):
//   bricks | @Area/Chunks/<chunk> | "<slot>,<mesh>,<x>,<y>,<z>,<ori>,<rgb>;..."
// mesh: index into the kit's mesh list: 0 the empty mesh, else 1 + 4 * type + variant (MESH_VARIANTS);
// x, y, z: lattice units (0.1 mm of mesh); ori: Lattice.ORIS index; rgb: 0xRRGGBB as a whole number (the shader reads
// it from UV1, see Assets/Kit/Shaders/BrickColor.shader).

import type { HostActions } from "../portkit/src/index.ts";
import { BRICKS } from "./BrickData.ts";
import type { RenderBrick, RenderChunk } from "./ChunkedRenderer.ts";

/** Mesh variants per type, in mesh-index order (the kit builder makes them in this order). */
export const MESH_VARIANTS = ["hollow+studs", "solid+studs", "hollow", "solid"] as const;

export const CHUNK_TEMPLATE = "@Area/Chunks/Template";

/** The mesh a placed brick is drawn with: 1 + 4 * type + variant. */
export function meshIndex(b: RenderBrick): number {
  const males = BRICKS[b.type]!.males.length;
  const allStudsCovered = males === 0 || b.studsCovered === (1 << males) - 1;
  return 1 + 4 * b.type + (allStudsCovered ? 2 : 0) + (b.bottomClosed ? 1 : 0);
}

/** A record's text without its slot. */
export function itemOf(b: RenderBrick): string {
  return `${meshIndex(b)},${Math.round(b.pos[0])},${Math.round(b.pos[1])},${Math.round(b.pos[2])},${b.ori},${b.rgb & 0xffffff}`;
}

export const EMPTY_ITEM = "0,0,0,0,0,0";

/** A chunk key "cx,cy,cz" as an object name (path-safe). */
export function chunkName(key: string): string {
  return "C" + key.split(",").join("_");
}

interface ChunkSlots {
  name: string;
  items: string[];
  slotOf: Map<string, number>;
  free: number[];
}

export class BrickRenderer {
  private readonly chunks = new Map<string, ChunkSlots>();
  /** What the graph reported: chunk builds and their times (ms, Time.realtimeSinceStartup in Unity). */
  readonly built = { ops: 0, records: 0, lastMs: 0, maxMs: 0, totalMs: 0, lastColliderMs: 0, maxColliderMs: 0, totalColliderMs: 0, lastRecords: 0, lastAt: 0 };
  readonly sent = { ops: 0, records: 0, bytes: 0 };
  /** Records sent and not yet reported built, per chunk name. */
  private readonly waiting = new Map<string, number>();

  private readonly host: HostActions;

  constructor(host: HostActions) {
    this.host = host;
  }

  /** Sends what changed in these chunks (BuildArea.RenderChunks). */
  update(chunks: RenderChunk[]): void {
    for (const chunk of chunks) {
      let slots = this.chunks.get(chunk.key);
      if (!slots) {
        slots = { name: chunkName(chunk.key), items: [], slotOf: new Map(), free: [] };
        this.chunks.set(chunk.key, slots);
        this.host.spawn(CHUNK_TEMPLATE, slots.name);
      }
      const want = new Map<string, string>();
      for (const b of chunk.bricks) want.set(b.id, itemOf(b));
      const changed = new Map<number, string>();
      for (const [id, slot] of [...slots.slotOf]) {
        if (want.has(id)) continue;
        slots.slotOf.delete(id);
        slots.free.push(slot);
        if (slots.items[slot] !== EMPTY_ITEM) changed.set(slot, EMPTY_ITEM);
      }
      slots.free.sort((a, b) => b - a); // pop() takes the lowest
      for (const [id, item] of want) {
        let slot = slots.slotOf.get(id);
        if (slot === undefined) {
          slot = slots.free.length ? slots.free.pop()! : slots.items.length + [...changed.keys()].filter((s) => s >= slots.items.length).length;
          slots.slotOf.set(id, slot);
        }
        if (slots.items[slot] !== item) changed.set(slot, item);
      }
      if (!changed.size) continue;
      const order = [...changed.keys()].sort((a, b) => a - b);
      const records: string[] = [];
      for (const slot of order) {
        slots.items[slot] = changed.get(slot)!;
        records.push(`${slot},${slots.items[slot]}`);
      }
      const text = records.join(";");
      this.host.op("bricks", `@Area/Chunks/${slots.name}`, [text]);
      this.sent.ops++;
      this.sent.records += records.length;
      this.sent.bytes += text.length;
      this.waiting.set(slots.name, (this.waiting.get(slots.name) ?? 0) + records.length);
    }
  }

  /** The graph's report of one `bricks` op: chunk name, milliseconds, records. */
  reported(name: string, ms: number, records: number, now: number, colliderMs = 0): void {
    this.built.ops++;
    this.built.records += records;
    this.built.lastRecords = records;
    this.built.lastColliderMs = colliderMs;
    this.built.maxColliderMs = Math.max(this.built.maxColliderMs, colliderMs);
    this.built.totalColliderMs += colliderMs;
    this.built.lastMs = ms;
    this.built.maxMs = Math.max(this.built.maxMs, ms);
    this.built.totalMs += ms;
    this.built.lastAt = now;
    const left = (this.waiting.get(name) ?? 0) - records;
    if (left > 0) this.waiting.set(name, left);
    else this.waiting.delete(name);
  }

  /** True when every record sent has been reported built. */
  get idle(): boolean {
    return this.waiting.size === 0;
  }

  /** Bricks drawn (slots with a mesh) per chunk name. */
  counts(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const c of this.chunks.values()) out[c.name] = c.slotOf.size;
    return out;
  }

  get chunkCount(): number {
    return this.chunks.size;
  }
}
