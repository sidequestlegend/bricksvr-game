// BrickAttachDetector.cs (and LegoConnectorScript.ClosestConnector): where a held brick goes when it is let go.
//
// Upstream (BrickAttachDetector.CheckIfCanConnect, :177-250), run on release and every frame while held (the ghost,
// ShowSnappableBrickPositions.cs:44-62):
//   1. every held connector whose trigger touches a connector of the other kind picks the closest one (:281-290,
//      LegoConnectorScript.cs:68-85);
//   2. connectors that compete for the same partner keep only the closest (ValidConnections, :293-335);
//   3. the side with more such pairs wins, sockets only when strictly more (:188-192);
//   4. the first pair decides: the brick turns to the partner's frame plus the quarter turn about the stud axis that
//      is farthest from how it is held, then half a turn more (GetNewRot :337-375, then :244), which is the quarter
//      turn nearest to how it is held;
//   5. it moves so that the first connector sits on its partner (GetNewPosWithRot :377-402);
//   6. it is refused if its colliders would hit a brick (CollidesWithBricks :263-279) or the user may not build
//      (RoomOwnershipSync.IsUserAllowedToMakeChanges, :179).
// Upstream does step 4 and 5 in the partner's frame by tilting the partner brick until that connector points up
// (:212-226), which is why side studs work. The port does the same thing in the connector's frame directly, on the
// integer lattice: rotations are cube rotations and step 5 puts the two mate points (the faces) on each other, where
// upstream adds tuned height constants (:385, `Height()` :419-424) that amount to the same contact. PORT.md 10.1
// lists the differences this makes (a held side stud is matched in its own frame; nothing below the carpet).

import { BRICKS, type Connector } from "./BrickData.ts";
import type { BrickStore, WorldConnector } from "./BrickStore.ts";
import { nearestOri, type Obb, ORI_Y180, ORIS, oriApply, oriInv, oriMul, placeObb, type Q, qangle, qeuler, qeulerAngles, qmul, qrot, type V3 } from "./Lattice.ts";

export interface HeldPose {
  type: number;
  /** Area space, u (fractions allowed: the hand is anywhere). */
  pos: V3;
  q: Q;
}

export interface Snap {
  pos: V3;
  ori: number;
  /** True when the brick's sockets went onto studs below (upstream's Vector3.down), false when its studs went up into sockets. */
  downwards: boolean;
  /** The pair that decided: the held connector and its partner. */
  connector: number;
  partner: WorldConnector;
}

interface Pair {
  connector: Connector;
  partner: WorldConnector;
  distance: number;
  /** Everything the connector's trigger touched (LegoConnectorScript.connectorsCollidingWith). */
  touching: WorldConnector[];
}

function probeAt(pos: V3, q: Q, c: Connector): V3 {
  const p = qrot(q, c.probe);
  return [p[0] + pos[0], p[1] + pos[1], p[2] + pos[2]];
}

/** LegoConnectorScript.ClosestConnector: the nearest of `touching` to `probe` (first on ties; `closestDistance = 100f` world units). */
function closest(probe: V3, touching: readonly WorldConnector[]): { partner: WorldConnector | null; distance: number } {
  let partner: WorldConnector | null = null;
  let distance = 100 / 7e-4;
  for (const t of touching) {
    const d = dist(probe, t.probe);
    if (d < distance) {
      partner = t;
      distance = d;
    }
  }
  return { partner, distance };
}

function dist(a: V3, b: V3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function partnerKey(c: WorldConnector): string {
  return c.brick ? `${c.brick}/${c.index}` : `floor/${c.mate[0]},${c.mate[2]}`;
}

/** LegoConnectorScript.ClosestConnector for every connector of one kind of the held brick (GetFemale/MaleConnectorsWithConnections). */
function withConnections(store: BrickStore, held: HeldPose, connectors: readonly Connector[]): Pair[] {
  const out: Pair[] = [];
  for (const c of connectors) {
    const probe = probeAt(held.pos, held.q, c);
    const touching = store.touching(probe, qmul(held.q, c.q), !c.male);
    const { partner, distance } = closest(probe, touching);
    if (partner) out.push({ connector: c, partner, distance, touching });
  }
  return out;
}

/** ValidConnections: one connector per partner, the closest; in the order partners were first met. */
export function ValidConnections(pairs: Pair[]): Pair[] {
  if (pairs.length <= 1) return pairs;
  const map = new Map<string, Pair>();
  for (const pair of pairs) {
    const key = partnerKey(pair.partner);
    const seen = map.get(key);
    if (!seen || pair.distance < seen.distance) map.set(key, pair);
  }
  return [...map.values()];
}

/**
 * GetNewRot then the final half turn (:244): the partner's frame turned by the quarter turn about its axis whose
 * angle to `heldFrame` is largest (identity, 90, 180, 270 tried in that order, the first largest wins), then by 180.
 * Returns a cube rotation index for the held connector's frame.
 */
export function GetNewRot(partnerOri: number, heldFrame: Q): number {
  const candidates = [0, 1, 2, 3].map((k) => oriMul(partnerOri, k));
  const diffs = candidates.map((o) => qangle(ORIS[o]!.q, heldFrame));
  const maxDiff = Math.max(...diffs);
  const k = diffs.indexOf(maxDiff);
  return oriMul(candidates[k]!, 2);
}

/** The held brick's boxes at a pose, in area space. */
export function heldBoxesAt(type: number, pos: V3, ori: number): Obb[] {
  const q = ORIS[ori]!.q;
  return BRICKS[type]!.heldBoxes.map((b) => placeObb(b, pos, q));
}

/**
 * The tilt of :218 (`otherBrick.eulerAngles += (-x - connector.localEuler.x, 0, -z - connector.localEuler.z)`) as a
 * map that moves a connector of anything else the opposite way about the partner brick's pivot. Identity for an
 * upright stud on an upright brick (every ordinary build).
 */
function untilting(store: BrickStore, partner: WorldConnector): (t: WorldConnector) => WorldConnector {
  const b = partner.brick ? store.bricks.get(partner.brick) : undefined;
  if (!b) return (t) => t;
  const be = qeulerAngles(ORIS[b.ori]!.q);
  const ce = qeulerAngles(b.def.connectors[partner.index]!.q);
  const tilted = nearestOri(qeuler(-ce[0], be[1], -ce[2]));
  const back = oriInv(oriMul(tilted, oriInv(b.ori)));
  if (back === 0) return (t) => t;
  const P = b.pos;
  const move = (v: V3): V3 => {
    const r = oriApply(back, [v[0] - P[0], v[1] - P[1], v[2] - P[2]]);
    return [r[0] + P[0], r[1] + P[1], r[2] + P[2]];
  };
  return (t) => ({ ...t, mate: move(t.mate), probe: move(t.probe), ori: oriMul(back, t.ori), q: ORIS[oriMul(back, t.ori)]!.q });
}

/** CheckIfCanConnect. Null when the brick would not attach (it falls instead). */
export function CheckIfCanConnect(store: BrickStore, held: HeldPose, allowed = true): Snap | null {
  if (!allowed) return null;
  const def = BRICKS[held.type];
  if (!def) return null;
  const validFemale = ValidConnections(withConnections(store, held, def.females));
  const validMale = ValidConnections(withConnections(store, held, def.males));
  const downwards = validFemale.length > validMale.length;
  const use = downwards ? validFemale : validMale;
  if (use.length === 0) return null;
  const first = use[0]!;
  const c = first.connector;
  // The held connector's frame lines up with its partner's; the brick follows (brick = frame * connector^-1).
  const frame = GetNewRot(first.partner.ori, qmul(held.q, c.q));
  const ori = oriMul(frame, oriInv(c.ori));
  // GetNewPosWithRot (:377-402) turns the held brick to the rotation before the final half turn and only then asks
  // the connector for its closest partner again (:392-397), out of what its trigger had collected: when the hand
  // was between two studs, that can be the other one. Kept, so a brick lands where upstream puts it.
  // Upstream asks while the partner's brick is tilted so that the partner points up (:212-218); connectors of other
  // bricks and of the floor do not tilt with it, so they are seen turned back by that tilt about its pivot.
  const midOri = oriMul(oriMul(frame, ORI_Y180), oriInv(c.ori));
  const untilt = untilting(store, first.partner);
  const seen = first.touching.map((t) => (t.brick === first.partner.brick ? t : untilt(t)));
  const partner = closest(probeAt(held.pos, ORIS[midOri]!.q, c), seen).partner ?? first.partner;
  const m = oriApply(ori, c.mate);
  const pos: V3 = [partner.mate[0] - m[0], partner.mate[1] - m[1], partner.mate[2] - m[2]];
  const boxes = heldBoxesAt(held.type, pos, ori);
  if (!store.inside(boxes) || store.collides(boxes)) return null;
  return { pos, ori, downwards, connector: c.index, partner };
}
