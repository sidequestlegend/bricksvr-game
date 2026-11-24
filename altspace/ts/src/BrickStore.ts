// BrickStore.cs (uuid -> placed brick) together with what upstream asks Unity's physics about placed bricks:
//   - which placed connectors a held connector's trigger touches (LegoConnectorScript.cs:49-85),
//   - whether a brick at a pose would hit a placed brick (BrickAttachDetector.CollidesWithBricks, :263-279),
//   - which connectors another brick covers (LegoConnectorScript.RecalculateEnabled / BrickCollidingWith, :94-157),
//   - whether a brick sits on the carpet (BrickAttach.IsOnCarpet, BrickAttach.cs:371-374),
// and the chunks the renderer merges (ChunkedRenderer.cs, see ChunkedRenderer.ts).
//
// Pure: no runtime, no time. Positions are integer lattice units in the build area's space (Lattice.ts).

import { BRICKS, type Brick, CONNECTOR_COVER_HALF, CONNECTOR_TRIGGER_HALF } from "./BrickData.ts";
import { chunkOf, type ChunkKey } from "./ChunkedRenderer.ts";
import { isUpright, nearestOri, type Obb, obbBounds, obbOverlap, ORIS, oriApply, oriMul, placeObb, type Q, qrot, U_PER_PLATE, U_PER_STUD, type V3 } from "./Lattice.ts";

export interface Placement {
  /** Globally unique: "<author>#<seq>" (see BrickRecords.ts). */
  id: string;
  type: number;
  ori: number;
  pos: V3;
  /** ARGB int (ColorInt). */
  color: number;
}

export interface WorldConnector {
  brick: string;
  index: number;
  male: boolean;
  /** Mate point in area space (integer). */
  mate: V3;
  /** Trigger and cover centre in area space. */
  probe: V3;
  /** Connector frame (cube rotation) in area space. */
  ori: number;
  q: Q;
}

/** A box with its bounds worked out once; `aligned` when its axes are the area's (then bounds overlap is exact). */
export interface BoxInfo {
  box: Obb;
  min: V3;
  max: V3;
  aligned: boolean;
}

function isAligned(q: Q): boolean {
  const o = ORIS[nearestOri(q)]!.q;
  return Math.abs(o[0] * q[0] + o[1] * q[1] + o[2] * q[2] + o[3] * q[3]) > 1 - 1e-9;
}

export function boxInfo(box: Obb): BoxInfo {
  const bb = obbBounds(box);
  return { box, min: bb.min, max: bb.max, aligned: isAligned(box.q) };
}

/** obbOverlap, with the exact shortcut for two boxes on the area's axes (touching does not count either way). */
export function infoOverlap(a: BoxInfo, b: BoxInfo, eps = 1e-6): boolean {
  for (let i = 0; i < 3; i++) if (a.min[i]! > b.max[i]! - eps || b.min[i]! > a.max[i]! - eps) return false;
  if (a.aligned && b.aligned) return true;
  return obbOverlap(a.box, b.box, eps);
}

export interface PlacedBrick extends Placement {
  def: Brick;
  boxes: Obb[];
  infos: BoxInfo[];
  /** Bounds of the boxes. */
  min: V3;
  max: V3;
  /** Bounds of the boxes and of every connector's trigger cube (what the spatial index files the brick under). */
  reachMin: V3;
  reachMax: V3;
  connectors: WorldConnector[];
  /** Per connector: something else is in front of it (LegoConnectorScript.covered). */
  covered: boolean[];
  onFloor: boolean;
  chunk: ChunkKey;
  /** 0..1, the scratch-texture offset (BrickAttach.texOffset): random per client upstream, from the id here. */
  texOffset: number;
  /** @internal last query that returned this brick (de-duplication without a set). */
  mark: number;
}

/** The floor's own studs: a male connector every stud, `probe` 0.0148 upstream units above the carpet (the floor connectors sit at y = 0 and the carpet at -0.0148: BrickAttach.cs:373). */
export const FLOOR_PROBE_Y = 0.0148 / 7e-4;

export interface AreaBounds {
  /** Half the build area's width along X and Z, and its height, in u. */
  halfX: number;
  halfZ: number;
  height: number;
  /** Lowest y a box may reach (u). Default -4: nothing below the carpet but 0.4 mm of slack. */
  floor?: number;
}

const CELL = 4 * U_PER_STUD;

function cellKey(x: number, y: number, z: number): number {
  return ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);
}

function hashUnit(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function aabbOverlap(aMin: V3, aMax: V3, bMin: V3, bMax: V3): boolean {
  return aMin[0] < bMax[0] && bMin[0] < aMax[0] && aMin[1] < bMax[1] && bMin[1] < aMax[1] && aMin[2] < bMax[2] && bMin[2] < aMax[2];
}

export class BrickStore {
  readonly bricks = new Map<string, PlacedBrick>();
  bounds: AreaBounds;
  private readonly cells = new Map<number, PlacedBrick[]>();
  private stamp = 0;
  private readonly chunks = new Map<ChunkKey, Set<string>>();
  private readonly dirty = new Set<ChunkKey>();
  /** Work done, for the tests' budget checks. */
  readonly stats = { boxTests: 0, coverUpdates: 0 };

  constructor(bounds: AreaBounds) {
    this.bounds = bounds;
  }

  get count(): number {
    return this.bricks.size;
  }

  // ---- building ---------------------------------------------------------------------------------------------------

  /** Where a brick of a type would be: its boxes, bounds and connectors (nothing is stored). */
  static shape(p: Placement): Omit<PlacedBrick, keyof Placement | "covered" | "onFloor" | "chunk" | "texOffset" | "mark"> {
    const def = BRICKS[p.type];
    if (!def) throw new Error(`no brick type ${p.type}`);
    const q = ORIS[p.ori]!.q;
    const boxes = def.placedBoxes.map((b) => placeObb(b, p.pos, q));
    const min: V3 = [Infinity, Infinity, Infinity];
    const max: V3 = [-Infinity, -Infinity, -Infinity];
    for (const b of boxes) {
      const bb = obbBounds(b);
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i]!, bb.min[i]!);
        max[i] = Math.max(max[i]!, bb.max[i]!);
      }
    }
    const connectors = def.connectors.map((c): WorldConnector => {
      const m = oriApply(p.ori, c.mate);
      const pr = qrot(q, c.probe);
      const ori = oriMul(p.ori, c.ori);
      return {
        brick: p.id,
        index: c.index,
        male: c.male,
        mate: [m[0] + p.pos[0], m[1] + p.pos[1], m[2] + p.pos[2]],
        probe: [pr[0] + p.pos[0], pr[1] + p.pos[1], pr[2] + p.pos[2]],
        ori,
        q: ORIS[ori]!.q,
      };
    });
    // The index bounds also hold every connector's trigger cube: a stud's trigger reaches above the brick's boxes.
    const r = CONNECTOR_TRIGGER_HALF * Math.sqrt(3);
    const reachMin: V3 = [min[0], min[1], min[2]];
    const reachMax: V3 = [max[0], max[1], max[2]];
    for (const c of connectors) {
      for (let i = 0; i < 3; i++) {
        reachMin[i] = Math.min(reachMin[i]!, c.probe[i]! - r);
        reachMax[i] = Math.max(reachMax[i]!, c.probe[i]! + r);
      }
    }
    return { def, boxes, infos: boxes.map(boxInfo), min, max, reachMin, reachMax, connectors };
  }

  /** Adds a placed brick (replacing one with the same id). `recalc` false defers cover updates to `recalculateAll`. */
  add(p: Placement, recalc = true): PlacedBrick {
    if (this.bricks.has(p.id)) this.remove(p.id, recalc);
    const shape = BrickStore.shape(p);
    const brick: PlacedBrick = {
      ...p,
      pos: [p.pos[0], p.pos[1], p.pos[2]],
      ...shape,
      covered: shape.connectors.map(() => false),
      onFloor: isUpright(p.ori) && p.pos[1] + shape.def.bottomPlates * U_PER_PLATE === 0,
      chunk: chunkOf(p.pos),
      texOffset: hashUnit(p.id),
      mark: 0,
    };
    this.bricks.set(p.id, brick);
    this.forCells(brick.reachMin, brick.reachMax, (k) => {
      let list = this.cells.get(k);
      if (!list) this.cells.set(k, (list = []));
      list.push(brick);
    });
    let members = this.chunks.get(brick.chunk);
    if (!members) this.chunks.set(brick.chunk, (members = new Set()));
    members.add(p.id);
    this.dirty.add(brick.chunk);
    if (recalc) this.recalculateAround(brick.min, brick.max);
    return brick;
  }

  remove(id: string, recalc = true): PlacedBrick | null {
    const brick = this.bricks.get(id);
    if (!brick) return null;
    this.bricks.delete(id);
    this.forCells(brick.reachMin, brick.reachMax, (k) => {
      const list = this.cells.get(k);
      if (list) {
        const at = list.indexOf(brick);
        if (at >= 0) list.splice(at, 1);
        if (!list.length) this.cells.delete(k);
      }
    });
    const members = this.chunks.get(brick.chunk);
    if (members) {
      members.delete(id);
      if (!members.size) this.chunks.delete(brick.chunk);
    }
    this.dirty.add(brick.chunk);
    if (recalc) this.recalculateAround(brick.min, brick.max);
    return brick;
  }

  clear(): void {
    for (const b of this.bricks.values()) this.dirty.add(b.chunk);
    this.bricks.clear();
    this.cells.clear();
    this.chunks.clear();
  }

  /** Every cover flag from scratch (after a bulk load). */
  recalculateAll(): void {
    for (const b of this.bricks.values()) this.recalculate(b);
  }

  // ---- queries ----------------------------------------------------------------------------------------------------

  /** Bricks whose box bounds (or, with `reach`, connector-trigger bounds) meet the box [min, max]. */
  near(min: V3, max: V3, reach = false): PlacedBrick[] {
    const stamp = ++this.stamp;
    const list: PlacedBrick[] = [];
    const x0 = Math.floor(min[0] / CELL);
    const x1 = Math.floor(max[0] / CELL);
    const y0 = Math.floor(min[1] / CELL);
    const y1 = Math.floor(max[1] / CELL);
    const z0 = Math.floor(min[2] / CELL);
    const z1 = Math.floor(max[2] / CELL);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          const cell = this.cells.get(cellKey(x, y, z));
          if (!cell) continue;
          for (const b of cell) {
            if (b.mark === stamp) continue;
            b.mark = stamp;
            if (reach ? aabbOverlap(min, max, b.reachMin, b.reachMax) : aabbOverlap(min, max, b.min, b.max)) list.push(b);
          }
        }
      }
    }
    return list;
  }

  /** BrickAttachDetector.CollidesWithBricks against placed bricks: does any box overlap a placed brick's colliders? */
  collides(boxes: readonly Obb[], ignore: string | null = null): boolean {
    for (const box of boxes) {
      const info = boxInfo(box);
      for (const other of this.near(info.min, info.max)) {
        if (other.id === ignore) continue;
        for (const ob of other.infos) {
          this.stats.boxTests++;
          if (infoOverlap(info, ob)) return true;
        }
      }
    }
    return false;
  }

  /** Whether boxes stay inside the build area: within its footprint and height, and not below the carpet (4 u = 0.4 mm of slack). */
  inside(boxes: readonly Obb[]): boolean {
    const { halfX, halfZ, height } = this.bounds;
    for (const box of boxes) {
      const bb = obbBounds(box);
      if (bb.min[0] < -halfX - 1e-6 || bb.max[0] > halfX + 1e-6 || bb.min[2] < -halfZ - 1e-6 || bb.max[2] > halfZ + 1e-6) return false;
      if (bb.min[1] < (this.bounds.floor ?? -4) || bb.max[1] > height + 1e-6) return false;
    }
    return true;
  }

  /**
   * Connectors of placed bricks (and the floor's studs) whose trigger cube meets a cube of the same size around
   * `probe` turned by `q`: what LegoConnectorScript.connectorsCollidingWith would hold. Covered connectors are left
   * out: upstream switches their colliders off (LegoConnectorScript.cs:121-124).
   */
  touching(probe: V3, q: Q, wantMale: boolean): WorldConnector[] {
    const h = CONNECTOR_TRIGGER_HALF;
    const cube: Obb = { c: probe, h: [h, h, h], q };
    const reach = 2 * h * Math.SQRT2 + 1;
    const min: V3 = [probe[0] - reach, probe[1] - reach, probe[2] - reach];
    const max: V3 = [probe[0] + reach, probe[1] + reach, probe[2] + reach];
    const out: WorldConnector[] = [];
    for (const b of this.near(min, max, true)) {
      for (const c of b.connectors) {
        if (c.male !== wantMale || b.covered[c.index]) continue;
        if (Math.abs(c.probe[0] - probe[0]) > reach || Math.abs(c.probe[1] - probe[1]) > reach || Math.abs(c.probe[2] - probe[2]) > reach) continue;
        if (obbOverlap(cube, { c: c.probe, h: [h, h, h], q: c.q })) out.push(c);
      }
    }
    if (wantMale) {
      // The floor: a stud every 80 u (PositionFloorConnectorsUnderHand.cs keeps a patch of them under each hand).
      const fx = Math.round(probe[0] / U_PER_STUD);
      const fz = Math.round(probe[2] / U_PER_STUD);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const x = (fx + dx) * U_PER_STUD;
          const z = (fz + dz) * U_PER_STUD;
          if (Math.abs(x) > this.bounds.halfX - U_PER_STUD / 2 || Math.abs(z) > this.bounds.halfZ - U_PER_STUD / 2) continue;
          const c: WorldConnector = { brick: "", index: -1, male: true, mate: [x, 0, z], probe: [x, FLOOR_PROBE_Y, z], ori: 0, q: [0, 0, 0, 1] };
          if (obbOverlap(cube, { c: c.probe, h: [h, h, h], q: c.q })) out.push(c);
        }
      }
    }
    return out;
  }

  // ---- the renderer's side --------------------------------------------------------------------------------------

  /** Chunks whose bricks or brick looks changed since the last call. */
  get chunkCount(): number {
    return this.chunks.size;
  }

  takeDirtyChunks(): ChunkKey[] {
    const out = [...this.dirty];
    this.dirty.clear();
    return out;
  }

  inChunk(key: ChunkKey): PlacedBrick[] {
    return [...(this.chunks.get(key) ?? [])].map((id) => this.bricks.get(id)!);
  }

  // ---- internals --------------------------------------------------------------------------------------------------

  private forCells(min: V3, max: V3, fn: (key: number) => void): void {
    const x0 = Math.floor(min[0] / CELL);
    const x1 = Math.floor(max[0] / CELL);
    const y0 = Math.floor(min[1] / CELL);
    const y1 = Math.floor(max[1] / CELL);
    const z0 = Math.floor(min[2] / CELL);
    const z1 = Math.floor(max[2] / CELL);
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) fn(cellKey(x, y, z));
  }

  private recalculateAround(min: V3, max: V3): void {
    const pad = 2 * CONNECTOR_COVER_HALF + 40;
    for (const b of this.near([min[0] - pad, min[1] - pad, min[2] - pad], [max[0] + pad, max[1] + pad, max[2] + pad])) this.recalculate(b);
  }

  /** BrickAttach.RecalculateEnabledConnectors for one brick: LegoConnectorScript.RecalculateEnabled per connector. */
  private recalculate(b: PlacedBrick): void {
    let changed = false;
    const h = CONNECTOR_COVER_HALF;
    // One index query per brick: every cover box lies within its connector-trigger bounds.
    const neighbours = this.near(b.reachMin, b.reachMax).filter((o) => o.id !== b.id);
    for (const c of b.connectors) {
      const info = boxInfo({ c: c.probe, h: [h, h, h], q: c.q });
      let hit = false;
      for (const other of neighbours) {
        if (!aabbOverlap(info.min, info.max, other.min, other.max)) continue;
        for (const ob of other.infos) {
          this.stats.boxTests++;
          if (infoOverlap(info, ob)) {
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
      if (b.covered[c.index] !== hit) {
        b.covered[c.index] = hit;
        changed = true;
      }
    }
    if (changed) {
      this.stats.coverUpdates++;
      this.dirty.add(b.chunk);
    }
  }
}
