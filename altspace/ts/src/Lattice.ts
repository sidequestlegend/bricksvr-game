// The port's own coordinate system (new; upstream has none: it snaps in Unity world space with physics triggers).
//
// Every placed brick sits on an integer lattice in the build area's local space:
//   1 u = 0.1 mm of mesh space (the generated models: stud pitch 8 mm, plate 3.2 mm, X long axis, Y up, Z short)
//   1 stud = 80 u, half a stud = 40 u, 1 plate = 32 u, 1 brick = 96 u
//   upstream world = mesh x 7 (CombinedModel's localScale 7, Assets/Resources/1x2.prefab:685), so 1 u = 7e-4 upstream
//   world units; the snippet's `scale` setting says how many metres one mesh metre is shown at (default 7).
// and is turned by one of the 24 rotations of a cube (`Ori`), so every brick box stays axis-aligned and every
// connector lands exactly on another. Unity's conventions throughout: left-handed, Y up, quaternions (x, y, z, w)
// with Unity's multiplication and Euler order (Z, then X, then Y).

export type V3 = [number, number, number];
export type Q = [number, number, number, number];
/** Row-major 3x3. */
export type M3 = [number, number, number, number, number, number, number, number, number];

export const U_PER_STUD = 80;
export const U_PER_PLATE = 32;
/** Upstream world units in one lattice unit. */
export const UPSTREAM_WORLD_PER_U = 7e-4;
/** Mesh metres in one lattice unit. */
export const MESH_M_PER_U = 1e-4;

export function upstreamToU(v: readonly number[]): V3 {
  return [v[0]! / UPSTREAM_WORLD_PER_U, v[1]! / UPSTREAM_WORLD_PER_U, v[2]! / UPSTREAM_WORLD_PER_U];
}

// ---- quaternions (Unity's algebra) --------------------------------------------------------------------------------

export function qmul(a: Q, b: Q): Q {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] + a[1] * b[3] + a[2] * b[0] - a[0] * b[2],
    a[3] * b[2] + a[2] * b[3] + a[0] * b[1] - a[1] * b[0],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

export function qinv(q: Q): Q {
  return [-q[0], -q[1], -q[2], q[3]];
}

export function qrot(q: Q, v: readonly number[]): V3 {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2]! - z * v[1]!);
  const ty = 2 * (z * v[0]! - x * v[2]!);
  const tz = 2 * (x * v[1]! - y * v[0]!);
  return [v[0]! + w * tx + (y * tz - z * ty), v[1]! + w * ty + (z * tx - x * tz), v[2]! + w * tz + (x * ty - y * tx)];
}

export function qnorm(q: Q): Q {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

/** Quaternion.Euler: degrees, applied Z, then X, then Y. */
export function qeuler(x: number, y: number, z: number): Q {
  const r = Math.PI / 360;
  const qx: Q = [Math.sin(x * r), 0, 0, Math.cos(x * r)];
  const qy: Q = [0, Math.sin(y * r), 0, Math.cos(y * r)];
  const qz: Q = [0, 0, Math.sin(z * r), Math.cos(z * r)];
  return qmul(qmul(qy, qx), qz);
}

/** Quaternion.Angle: degrees between two rotations (Unity: 0 when the dot is within 1e-6 of 1). */
export function qangle(a: Q, b: Q): number {
  const dot = Math.min(Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]), 1);
  return dot > 1 - 1e-6 ? 0 : (Math.acos(dot) * 2 * 180) / Math.PI;
}

/** Quaternion.eulerAngles: degrees in [0, 360), Unity's Z-X-Y decomposition. */
export function qeulerAngles(q: Q): V3 {
  const [x, y, z, w] = q;
  const sinX = 2 * (w * x - y * z);
  let ex: number;
  let ey: number;
  let ez: number;
  if (Math.abs(sinX) > 0.9999995) {
    ex = (Math.sign(sinX) * Math.PI) / 2;
    ey = 2 * Math.atan2(y, w);
    ez = 0;
  } else {
    ex = Math.asin(sinX);
    ey = Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y));
    ez = Math.atan2(2 * (w * z + x * y), 1 - 2 * (x * x + z * z));
  }
  const wrap = (r: number) => {
    const d = ((r * 180) / Math.PI) % 360;
    return d < 0 ? d + 360 : d;
  };
  return [wrap(ex), wrap(ey), wrap(ez)];
}

export function qmatrix(q: Q): M3 {
  const [x, y, z, w] = q;
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y),
  ];
}

export function mapply(m: M3, v: readonly number[]): V3 {
  return [m[0] * v[0]! + m[1] * v[1]! + m[2] * v[2]!, m[3] * v[0]! + m[4] * v[1]! + m[5] * v[2]!, m[6] * v[0]! + m[7] * v[1]! + m[8] * v[2]!];
}

function mmul(a: M3, b: M3): M3 {
  const out = new Array(9).fill(0) as M3;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out[r * 3 + c] = a[r * 3]! * b[c]! + a[r * 3 + 1]! * b[3 + c]! + a[r * 3 + 2]! * b[6 + c]!;
  return out;
}

// ---- the 24 orientations -------------------------------------------------------------------------------------------

export interface Ori {
  readonly index: number;
  /** Integer rotation matrix (entries -1, 0, 1). */
  readonly m: M3;
  /** The same rotation as a unit quaternion, w >= 0 (or x >= 0 when w is 0). */
  readonly q: Q;
}

/**
 * Orientation numbers are part of the wire format: index = 4 * up + yaw, where `up` says where the brick's own +Y
 * points (0 +Y, 1 +Z, 2 -Y, 3 -Z, 4 +X, 5 -X) and `yaw` is the number of quarter turns about its own Y first.
 * 0..3 are the upright bricks every ordinary build is made of.
 */
const UPS: Q[] = [qeuler(0, 0, 0), qeuler(90, 0, 0), qeuler(180, 0, 0), qeuler(-90, 0, 0), qeuler(0, 0, -90), qeuler(0, 0, 90)];

function canonical(q: Q): Q {
  const flip = q[3] < -1e-9 || (Math.abs(q[3]) <= 1e-9 && (q[0] < -1e-9 || (Math.abs(q[0]) <= 1e-9 && (q[1] < -1e-9 || (Math.abs(q[1]) <= 1e-9 && q[2] < 0)))));
  const r = (n: number) => (Math.abs(n) < 1e-12 ? 0 : n);
  return flip ? [r(-q[0]), r(-q[1]), r(-q[2]), r(-q[3])] : [r(q[0]), r(q[1]), r(q[2]), r(q[3])];
}

export const ORIS: readonly Ori[] = (() => {
  const out: Ori[] = [];
  for (let up = 0; up < 6; up++) {
    for (let yaw = 0; yaw < 4; yaw++) {
      const q = canonical(qnorm(qmul(UPS[up]!, qeuler(0, 90 * yaw, 0))));
      const m = qmatrix(q).map((v) => Math.round(v)) as M3;
      out.push({ index: out.length, m, q });
    }
  }
  return out;
})();

const BY_MATRIX = new Map<string, number>(ORIS.map((o) => [o.m.join(","), o.index]));

function oriOfMatrix(m: M3): number {
  const i = BY_MATRIX.get(m.map((v) => Math.round(v)).join(","));
  if (i === undefined) throw new Error("not a cube rotation: " + m.join(","));
  return i;
}

/** a then b, as Unity's `qa * qb`. */
export function oriMul(a: number, b: number): number {
  return oriOfMatrix(mmul(ORIS[a]!.m, ORIS[b]!.m));
}

export function oriInv(a: number): number {
  const m = ORIS[a]!.m;
  return oriOfMatrix([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
}

/** The cube rotation nearest to a rotation (largest |dot|; the first such on ties). */
export function nearestOri(q: Q): number {
  let best = 0;
  let bestDot = -1;
  for (const o of ORIS) {
    const d = Math.abs(o.q[0] * q[0] + o.q[1] * q[1] + o.q[2] * q[2] + o.q[3] * q[3]);
    if (d > bestDot + 1e-9) {
      bestDot = d;
      best = o.index;
    }
  }
  return best;
}

export const ORI_YAW: readonly number[] = [0, 1, 2, 3];
export const ORI_Y180 = 2;

export function oriApply(o: number, v: readonly number[]): V3 {
  return mapply(ORIS[o]!.m, v);
}

/** True for the four orientations that keep +Y up. */
export function isUpright(o: number): boolean {
  return o < 4;
}

// ---- boxes ------------------------------------------------------------------------------------------------------

/** An oriented box: centre, half extents and a rotation, all in the same space. */
export interface Obb {
  c: V3;
  h: V3;
  q: Q;
}

/** Axis-aligned bounds of a box. */
export function obbBounds(b: Obb): { min: V3; max: V3 } {
  const m = qmatrix(b.q);
  const e: V3 = [0, 0, 0];
  for (let r = 0; r < 3; r++) e[r] = Math.abs(m[r * 3]!) * b.h[0] + Math.abs(m[r * 3 + 1]!) * b.h[1] + Math.abs(m[r * 3 + 2]!) * b.h[2];
  return { min: [b.c[0] - e[0], b.c[1] - e[1], b.c[2] - e[2]], max: [b.c[0] + e[0], b.c[1] + e[1], b.c[2] + e[2]] };
}

/**
 * Whether two oriented boxes overlap (separating axis test, 15 axes). Touching faces do not count: Unity's
 * Physics.CheckBox and trigger overlaps report contact only beyond a small tolerance, and every upstream collider
 * is shrunk by a few millimetres so that neighbours never touch.
 */
export function obbOverlap(a: Obb, b: Obb, eps = 1e-6): boolean {
  const A = qmatrix(a.q);
  const B = qmatrix(b.q);
  const ax: V3[] = [[A[0], A[3], A[6]], [A[1], A[4], A[7]], [A[2], A[5], A[8]]];
  const bx: V3[] = [[B[0], B[3], B[6]], [B[1], B[4], B[7]], [B[2], B[5], B[8]]];
  const t: V3 = [b.c[0] - a.c[0], b.c[1] - a.c[1], b.c[2] - a.c[2]];
  const dot = (u: V3, v: V3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const R: number[][] = [];
  const AbsR: number[][] = [];
  for (let i = 0; i < 3; i++) {
    R.push([]);
    AbsR.push([]);
    for (let j = 0; j < 3; j++) {
      R[i]!.push(dot(ax[i]!, bx[j]!));
      AbsR[i]!.push(Math.abs(R[i]![j]!) + 1e-9);
    }
  }
  const T: V3 = [dot(t, ax[0]!), dot(t, ax[1]!), dot(t, ax[2]!)];
  for (let i = 0; i < 3; i++) {
    const ra = a.h[i]!;
    const rb = b.h[0] * AbsR[i]![0]! + b.h[1] * AbsR[i]![1]! + b.h[2] * AbsR[i]![2]!;
    if (Math.abs(T[i]!) >= ra + rb - eps) return false;
  }
  for (let j = 0; j < 3; j++) {
    const ra = a.h[0] * AbsR[0]![j]! + a.h[1] * AbsR[1]![j]! + a.h[2] * AbsR[2]![j]!;
    const rb = b.h[j]!;
    const tj = T[0] * R[0]![j]! + T[1] * R[1]![j]! + T[2] * R[2]![j]!;
    if (Math.abs(tj) >= ra + rb - eps) return false;
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const i1 = (i + 1) % 3;
      const i2 = (i + 2) % 3;
      const j1 = (j + 1) % 3;
      const j2 = (j + 2) % 3;
      const ra = a.h[i1]! * AbsR[i2]![j]! + a.h[i2]! * AbsR[i1]![j]!;
      const rb = b.h[j1]! * AbsR[i]![j2]! + b.h[j2]! * AbsR[i]![j1]!;
      const tv = T[i2]! * R[i1]![j]! - T[i1]! * R[i2]![j]!;
      // No tolerance on the edge-edge axes: for parallel edges they degenerate to 0 >= 0 (Ericson, 4.4.1).
      if (Math.abs(tv) > ra + rb) return false;
    }
  }
  return true;
}

/** A box given in a brick's own space, moved to where the brick is. */
export function placeObb(local: Obb, pos: readonly number[], q: Q): Obb {
  const c = qrot(q, local.c);
  return { c: [c[0] + pos[0]!, c[1] + pos[1]!, c[2] + pos[2]!], h: local.h, q: qmul(q, local.q) };
}
