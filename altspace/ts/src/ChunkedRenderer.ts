// ChunkedRenderer.cs and BrickAttach.RecalculateRenderedGeometry (BrickAttach.cs:268-364): what the Unity side needs to
// draw placed bricks. Upstream keeps one GameObject per placed brick, groups them in 1 x 1 world-unit columns
// (`chunkSize: 1`, Main Scene.unity:33518) to switch renderers and connector colliders by distance, and builds one
// combined mesh per brick from its body and its uncovered studs. Here placed bricks are data: the renderer receives
// chunks and merges every brick of a chunk into one mesh (out of scope of the TypeScript; this is its input).
//
// A chunk is 16 x 16 studs by 48 plates (1280 x 1536 x 1280 u), keyed "cx,cy,cz".

import { BRICKS } from "./BrickData.ts";
import { ORIS, type Q, U_PER_PLATE, U_PER_STUD, type V3 } from "./Lattice.ts";

export type ChunkKey = string;

export const CHUNK_X = 16 * U_PER_STUD;
export const CHUNK_Y = 48 * U_PER_PLATE;
export const CHUNK_Z = 16 * U_PER_STUD;

export function chunkOf(pos: readonly number[]): ChunkKey {
  return `${Math.floor(pos[0]! / CHUNK_X)},${Math.floor(pos[1]! / CHUNK_Y)},${Math.floor(pos[2]! / CHUNK_Z)}`;
}

/** What one placed brick looks like, for the chunk mesher. */
export interface RenderBrick {
  id: string;
  /** Brick type (BrickData.ts). */
  type: number;
  /** Position (u) and rotation in the build area's space. */
  pos: V3;
  rot: Q;
  /** 0xRRGGBB. */
  rgb: number;
  /** `_TexOffset` of PerInstanceColor.shader (BrickAttach.cs:194). */
  texOffset: number;
  /** One bit per male connector in catalogue order: 1 = covered, draw no stud there ("Studs" when covered). */
  studsCovered: number;
  /** Every socket is covered or the brick sits on the carpet: draw the solid body ("FlatBody"), no tubes. */
  bottomClosed: boolean;
  /** Every socket is covered: no tubes ("Tubes" when allFemalePegsCovered). */
  tubesHidden: boolean;
  /** The mesh-cache key upstream would build (BrickAttach.cs:287-306), for a renderer that caches per look. */
  cacheKey: string;
}

export interface RenderChunk {
  key: ChunkKey;
  bricks: RenderBrick[];
}

/** The subset of a placed brick that decides its looks (see BrickStore.PlacedBrick). */
export interface Lookable {
  id: string;
  type: number;
  ori: number;
  pos: V3;
  color: number;
  covered: boolean[];
  onFloor: boolean;
  texOffset: number;
}

/**
 * BrickAttach.RecalculateRenderedGeometry, as data. `performanceMode` is upstream's "super ultra performance mode"
 * (UserSettings.SuperUltraPerformanceMode): flat body, no studs, one cache key per brick type.
 */
export function renderBrick(b: Lookable, performanceMode = false): RenderBrick {
  const def = BRICKS[b.type]!;
  let studs = 0;
  let key = def.prefab;
  def.males.forEach((c, i) => {
    if (b.covered[c.index]) studs |= 1 << i;
  });
  const allFemaleCovered = def.females.every((c) => b.covered[c.index]);
  if (performanceMode) {
    key += "perfmode";
  } else {
    for (const c of def.males) key += b.covered[c.index] ? "Y" : "N";
    if (allFemaleCovered || b.onFloor) key += "-bottomcovered";
  }
  return {
    id: b.id,
    type: b.type,
    pos: [b.pos[0], b.pos[1], b.pos[2]],
    rot: ORIS[b.ori]!.q,
    rgb: b.color & 0xffffff,
    texOffset: b.texOffset,
    studsCovered: performanceMode ? (1 << def.males.length) - 1 : studs,
    bottomClosed: performanceMode || allFemaleCovered || b.onFloor,
    tubesHidden: performanceMode || allFemaleCovered,
    cacheKey: key,
  };
}

/** The renderer's input for one chunk: its bricks in id order, so every client meshes them the same way. */
export function renderChunk(key: ChunkKey, bricks: Lookable[], performanceMode = false): RenderChunk {
  const sorted = bricks.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { key, bricks: sorted.map((b) => renderBrick(b, performanceMode)) };
}
