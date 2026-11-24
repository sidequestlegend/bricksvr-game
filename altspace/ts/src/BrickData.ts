// BrickData.cs: the brick catalogue. Upstream lists the 65 picker bricks in code (BrickData.cs:9-80) and keeps each
// brick's connectors and colliders in its prefabs; here everything comes from catalogue.json, which
// altspace/tools/bricks/extract_catalogue.py writes from BrickData.cs, the held and placed prefabs and bricks.json.
//
// A brick type's number is its index in catalogue.json: it travels in every record, so the list is append only.

import catalogueJson from "./catalogue.json" with { type: "json" };
import { nearestOri, type Obb, type Q, U_PER_PLATE, U_PER_STUD, upstreamToU, type V3, oriApply } from "./Lattice.ts";

interface RawBox {
  c: number[];
  size: number[];
  q: number[];
}

interface RawConnector {
  kind: "male" | "female";
  name: string;
  p: number[];
  q: number[];
}

interface RawBrick {
  prefab: string;
  display: string;
  category: string;
  picker: boolean;
  uiScale: number;
  spawnEuler: number[];
  spawnOffset: number[];
  source: string;
  model: {
    folder: string;
    name: string;
    shape: string;
    size: number[];
    heightPlates: number;
    bottomPlates: number;
    complete: string;
    files: Record<string, string[]>;
  };
  tile: boolean;
  window: boolean;
  heightOverride: number;
  connectors: RawConnector[];
  heldBoxes: RawBox[];
  rootBox: RawBox | null;
  placedBoxes: RawBox[];
}

export interface Connector {
  /** Index among the brick's connectors (prefab order). */
  index: number;
  male: boolean;
  /** The prefab child's name: the stud meshes of a placed brick are named after their male connectors. */
  name: string;
  /** Connector frame in brick space (a cube rotation). Its +Y is the stud's axis, pointing out of the brick for a male. */
  ori: number;
  /** Where the stud's axis points in brick space (unit, integer). */
  up: V3;
  /** The point that meets the partner's: the top of the face under a stud, the bottom face under a socket (u). */
  mate: V3;
  /** The prefab connector's position (u): centre of its trigger cube and of the cover test. */
  probe: V3;
  /** Its frame as a quaternion (the prefab's own rotation). */
  q: Q;
}

export interface Brick {
  type: number;
  prefab: string;
  display: string;
  category: string;
  picker: boolean;
  uiScale: number;
  /** BrickData.Brick.Rotation and HandSpawnerPositionOffset (upstream world units): how the hand spawner turns and shifts a new brick. */
  spawnEuler: V3;
  spawnOffset: V3;
  source: string;
  /** Studs along X and Z. */
  size: [number, number];
  heightPlates: number;
  bottomPlates: number;
  tile: boolean;
  window: boolean;
  /** Meshes for the renderer, paths under Assets/Resources (see altspace/tools/bricks/README.md, variants). */
  meshes: { complete: string; files: Record<string, string[]> };
  connectors: Connector[];
  males: Connector[];
  females: Connector[];
  /** BrickAttachDetector.colliders of the held prefab: what must not overlap a placed brick (u). */
  heldBoxes: Obb[];
  /** The placed prefab's solid colliders on the "placed lego" layer: what a held brick and a cover test hit (u). */
  placedBoxes: Obb[];
  /** Bounds of the placed boxes in brick space (u), for the spatial index. */
  boundsMin: V3;
  boundsMax: V3;
}

/** Half the side of a connector's trigger cube: localScale 0.04 x box size 1 (Assets/Resources/1x2.prefab:32,112) / 2. */
export const CONNECTOR_TRIGGER_HALF = 0.02 / 7e-4;
/** LegoConnectorScript.BrickCollidingWith: OverlapBox half extents localScale / 4 = 0.01 (LegoConnectorScript.cs:137). */
export const CONNECTOR_COVER_HALF = 0.01 / 7e-4;

function snapLateral(v: number): number {
  const half = U_PER_STUD / 2;
  const r = Math.round(v / half) * half;
  return Math.abs(r - v) <= 1 ? r : Math.round(v);
}

function toObb(b: RawBox): Obb {
  return { c: upstreamToU(b.c), h: [b.size[0]! / 7e-4 / 2, b.size[1]! / 7e-4 / 2, b.size[2]! / 7e-4 / 2], q: [b.q[0]!, b.q[1]!, b.q[2]!, b.q[3]!] };
}

function build(raw: RawBrick, type: number): Brick {
  const size: [number, number] = [raw.model.size[0]!, raw.model.size[1]!];
  const top = (raw.model.bottomPlates + raw.model.heightPlates) * U_PER_PLATE;
  const bottom = raw.model.bottomPlates * U_PER_PLATE;
  const half: V3 = [(size[0] * U_PER_STUD) / 2, 0, (size[1] * U_PER_STUD) / 2];
  const connectors = raw.connectors.map((c, index): Connector => {
    const q: Q = [c.q[0]!, c.q[1]!, c.q[2]!, c.q[3]!];
    const ori = nearestOri(q);
    const up = oriApply(ori, [0, 1, 0]).map((v) => Math.round(v)) as V3;
    const probe = upstreamToU(c.p).map((v) => Math.round(v * 100) / 100) as V3;
    const male = c.kind === "male";
    let mate: V3;
    if (up[1] === 1 || up[1] === -1) {
      // A stud on top or a socket underneath: the face is the brick's top or bottom (bricks.json heights).
      mate = [snapLateral(probe[0]), male ? top : bottom, snapLateral(probe[2])];
    } else {
      // A side stud: the face is the side of the footprint it points out of.
      mate = [0, 0, 0];
      for (let i = 0; i < 3; i++) mate[i] = up[i] !== 0 ? up[i]! * half[i]! : snapLateral(probe[i]!);
    }
    return { index, male, name: c.name, ori, up, mate, probe, q };
  });
  const placedBoxes = raw.placedBoxes.map(toObb);
  const heldBoxes = raw.heldBoxes.map(toObb);
  const boundsMin: V3 = [Infinity, Infinity, Infinity];
  const boundsMax: V3 = [-Infinity, -Infinity, -Infinity];
  for (const b of placedBoxes.length ? placedBoxes : heldBoxes) {
    const r = Math.hypot(b.h[0], b.h[1], b.h[2]);
    for (let i = 0; i < 3; i++) {
      boundsMin[i] = Math.min(boundsMin[i]!, b.c[i]! - r);
      boundsMax[i] = Math.max(boundsMax[i]!, b.c[i]! + r);
    }
  }
  return {
    type,
    prefab: raw.prefab,
    display: raw.display,
    category: raw.category,
    picker: raw.picker,
    uiScale: raw.uiScale,
    spawnEuler: [raw.spawnEuler[0]!, raw.spawnEuler[1]!, raw.spawnEuler[2]!],
    spawnOffset: [raw.spawnOffset[0]!, raw.spawnOffset[1]!, raw.spawnOffset[2]!],
    source: raw.source,
    size,
    heightPlates: raw.model.heightPlates,
    bottomPlates: raw.model.bottomPlates,
    tile: raw.tile,
    window: raw.window,
    meshes: { complete: raw.model.complete, files: raw.model.files },
    connectors,
    males: connectors.filter((c) => c.male),
    females: connectors.filter((c) => !c.male),
    heldBoxes,
    placedBoxes,
    boundsMin,
    boundsMax,
  };
}

const RAW = (catalogueJson as unknown as { bricks: RawBrick[] }).bricks;

/** Every brick type, by type number. */
export const BRICKS: readonly Brick[] = RAW.map(build);

const BY_PREFAB = new Map(BRICKS.map((b) => [b.prefab, b]));

/** BrickData.BrickByPrefabName. */
export function BrickByPrefabName(prefabName: string): Brick | null {
  return BY_PREFAB.get(prefabName) ?? null;
}

/** BrickData.AllBricks: the picker's bricks, sorted by category name (a stable sort, as List.Sort is not, see PORT.md). */
export function AllBricks(): Brick[] {
  return BRICKS.filter((b) => b.picker).sort((a, b) => (a.category < b.category ? -1 : a.category > b.category ? 1 : a.type - b.type));
}

/** BrickData.BricksForCategory, in catalogue order. */
export function BricksForCategory(category: string): Brick[] {
  return BRICKS.filter((b) => b.picker && b.category === category);
}

/** The picker's categories, in the order the upstream menu shows its tabs. */
export const CATEGORIES: readonly string[] = ["bricks", "plates", "tiles", "slopes", "side_studs", "misc"];
