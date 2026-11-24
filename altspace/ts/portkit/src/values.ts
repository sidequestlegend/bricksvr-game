// Value types that translated code uses where the C# used UnityEngine structs, and the tagged JSON form they
// take in bindings.json and in synced variables ({"$v3":[x,y,z]} and so on, as the README lists).
//
// C# structs copy on assignment and these are classes: where the upstream code relies on a copy
// (`var p = a; p.x = 1;`), write `a.clone()`.

export class Vector2 {
  x: number;
  y: number;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  static get zero(): Vector2 { return new Vector2(0, 0); }
  static get one(): Vector2 { return new Vector2(1, 1); }
  static get up(): Vector2 { return new Vector2(0, 1); }
  static get down(): Vector2 { return new Vector2(0, -1); }
  static get left(): Vector2 { return new Vector2(-1, 0); }
  static get right(): Vector2 { return new Vector2(1, 0); }
  clone(): Vector2 { return new Vector2(this.x, this.y); }
  add(o: Vector2): Vector2 { return new Vector2(this.x + o.x, this.y + o.y); }
  sub(o: Vector2): Vector2 { return new Vector2(this.x - o.x, this.y - o.y); }
  scale(k: number): Vector2 { return new Vector2(this.x * k, this.y * k); }
  /** C# `==` on Vector2 is an approximate comparison; this is the same test. */
  equals(o: Vector2 | null | undefined): boolean {
    if (!o) return false;
    const dx = this.x - o.x;
    const dy = this.y - o.y;
    return dx * dx + dy * dy < 9.99999944e-11;
  }
  get magnitude(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
  get sqrMagnitude(): number { return this.x * this.x + this.y * this.y; }
  get normalized(): Vector2 {
    const m = this.magnitude;
    return m > 1e-5 ? this.scale(1 / m) : Vector2.zero;
  }
  static Distance(a: Vector2, b: Vector2): number { return a.sub(b).magnitude; }
  static Dot(a: Vector2, b: Vector2): number { return a.x * b.x + a.y * b.y; }
  static Lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    const k = Mathf.Clamp01(t);
    return new Vector2(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
  }
  toString(): string { return `(${this.x}, ${this.y})`; }
}

export class Vector3 {
  x: number;
  y: number;
  z: number;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  static get zero(): Vector3 { return new Vector3(0, 0, 0); }
  static get one(): Vector3 { return new Vector3(1, 1, 1); }
  static get up(): Vector3 { return new Vector3(0, 1, 0); }
  static get down(): Vector3 { return new Vector3(0, -1, 0); }
  static get left(): Vector3 { return new Vector3(-1, 0, 0); }
  static get right(): Vector3 { return new Vector3(1, 0, 0); }
  static get forward(): Vector3 { return new Vector3(0, 0, 1); }
  static get back(): Vector3 { return new Vector3(0, 0, -1); }
  clone(): Vector3 { return new Vector3(this.x, this.y, this.z); }
  add(o: Vector3): Vector3 { return new Vector3(this.x + o.x, this.y + o.y, this.z + o.z); }
  sub(o: Vector3): Vector3 { return new Vector3(this.x - o.x, this.y - o.y, this.z - o.z); }
  scale(k: number): Vector3 { return new Vector3(this.x * k, this.y * k, this.z * k); }
  equals(o: Vector3 | null | undefined): boolean {
    if (!o) return false;
    const dx = this.x - o.x;
    const dy = this.y - o.y;
    const dz = this.z - o.z;
    return dx * dx + dy * dy + dz * dz < 9.99999944e-11;
  }
  get magnitude(): number { return Math.sqrt(this.sqrMagnitude); }
  get sqrMagnitude(): number { return this.x * this.x + this.y * this.y + this.z * this.z; }
  get normalized(): Vector3 {
    const m = this.magnitude;
    return m > 1e-5 ? this.scale(1 / m) : Vector3.zero;
  }
  static Distance(a: Vector3, b: Vector3): number { return a.sub(b).magnitude; }
  static Dot(a: Vector3, b: Vector3): number { return a.x * b.x + a.y * b.y + a.z * b.z; }
  static Cross(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  }
  static Lerp(a: Vector3, b: Vector3, t: number): Vector3 {
    const k = Mathf.Clamp01(t);
    return new Vector3(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k);
  }
  static MoveTowards(current: Vector3, target: Vector3, maxDelta: number): Vector3 {
    const d = target.sub(current);
    const m = d.magnitude;
    return m <= maxDelta || m === 0 ? target.clone() : current.add(d.scale(maxDelta / m));
  }
  toString(): string { return `(${this.x}, ${this.y}, ${this.z})`; }
}

export class Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  static get identity(): Quaternion { return new Quaternion(0, 0, 0, 1); }
  clone(): Quaternion { return new Quaternion(this.x, this.y, this.z, this.w); }
  /** Unity's Quaternion.Euler: degrees, applied in Z, X, Y order. */
  static Euler(x: number, y: number, z: number): Quaternion {
    const hx = (x * Mathf.Deg2Rad) / 2;
    const hy = (y * Mathf.Deg2Rad) / 2;
    const hz = (z * Mathf.Deg2Rad) / 2;
    const sx = Math.sin(hx), cx = Math.cos(hx);
    const sy = Math.sin(hy), cy = Math.cos(hy);
    const sz = Math.sin(hz), cz = Math.cos(hz);
    return new Quaternion(
      cy * sx * cz + sy * cx * sz,
      sy * cx * cz - cy * sx * sz,
      cy * cx * sz - sy * sx * cz,
      cy * cx * cz + sy * sx * sz,
    );
  }
  static AngleAxis(degrees: number, axis: Vector3): Quaternion {
    const n = axis.normalized;
    const h = (degrees * Mathf.Deg2Rad) / 2;
    const s = Math.sin(h);
    return new Quaternion(n.x * s, n.y * s, n.z * s, Math.cos(h));
  }
  /** this * o: rotate by o first, then by this (Unity's operator order). */
  mul(o: Quaternion): Quaternion {
    return new Quaternion(
      this.w * o.x + this.x * o.w + this.y * o.z - this.z * o.y,
      this.w * o.y + this.y * o.w + this.z * o.x - this.x * o.z,
      this.w * o.z + this.z * o.w + this.x * o.y - this.y * o.x,
      this.w * o.w - this.x * o.x - this.y * o.y - this.z * o.z,
    );
  }
  /** this * v: the vector rotated by this quaternion. */
  rotate(v: Vector3): Vector3 {
    const { x, y, z, w } = this;
    const tx = 2 * (y * v.z - z * v.y);
    const ty = 2 * (z * v.x - x * v.z);
    const tz = 2 * (x * v.y - y * v.x);
    return new Vector3(v.x + w * tx + (y * tz - z * ty), v.y + w * ty + (z * tx - x * tz), v.z + w * tz + (x * ty - y * tx));
  }
  get inverse(): Quaternion {
    const n = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w || 1;
    return new Quaternion(-this.x / n, -this.y / n, -this.z / n, this.w / n);
  }
  /** Degrees, each in [0, 360), in Unity's convention. */
  get eulerAngles(): Vector3 {
    const { x, y, z, w } = this;
    const sinX = 2 * (w * x - y * z);
    let ex: number, ey: number, ez: number;
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
      const d = (r * Mathf.Rad2Deg) % 360;
      return d < 0 ? d + 360 : d;
    };
    return new Vector3(wrap(ex), wrap(ey), wrap(ez));
  }
  static Slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    const k = Mathf.Clamp01(t);
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    const s = dot < 0 ? -1 : 1;
    dot = Math.abs(dot);
    let wa: number, wb: number;
    if (dot > 0.9995) {
      wa = 1 - k;
      wb = k;
    } else {
      const theta = Math.acos(dot);
      const sin = Math.sin(theta);
      wa = Math.sin((1 - k) * theta) / sin;
      wb = Math.sin(k * theta) / sin;
    }
    wb *= s;
    const q = new Quaternion(a.x * wa + b.x * wb, a.y * wa + b.y * wb, a.z * wa + b.z * wb, a.w * wa + b.w * wb);
    const n = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w) || 1;
    return new Quaternion(q.x / n, q.y / n, q.z / n, q.w / n);
  }
  equals(o: Quaternion | null | undefined): boolean {
    if (!o) return false;
    return Math.abs(this.x * o.x + this.y * o.y + this.z * o.z + this.w * o.w) > 0.999999;
  }
  toString(): string { return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`; }
}

/** A plain four-component vector (bindings write `{"$v4":[x,y,z,w]}` for one). */
export class Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
  clone(): Vector4 { return new Vector4(this.x, this.y, this.z, this.w); }
  equals(o: Vector4 | null | undefined): boolean {
    return !!o && this.x === o.x && this.y === o.y && this.z === o.z && this.w === o.w;
  }
}

export class Color {
  r: number;
  g: number;
  b: number;
  a: number;
  constructor(r = 0, g = 0, b = 0, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  static get white(): Color { return new Color(1, 1, 1, 1); }
  static get black(): Color { return new Color(0, 0, 0, 1); }
  static get red(): Color { return new Color(1, 0, 0, 1); }
  static get green(): Color { return new Color(0, 1, 0, 1); }
  static get blue(): Color { return new Color(0, 0, 1, 1); }
  static get yellow(): Color { return new Color(1, 0.92156863, 0.015686275, 1); }
  static get clear(): Color { return new Color(0, 0, 0, 0); }
  clone(): Color { return new Color(this.r, this.g, this.b, this.a); }
  static Lerp(a: Color, b: Color, t: number): Color {
    const k = Mathf.Clamp01(t);
    return new Color(a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k, a.a + (b.a - a.a) * k);
  }
  equals(o: Color | null | undefined): boolean {
    return !!o && this.r === o.r && this.g === o.g && this.b === o.b && this.a === o.a;
  }
}

/** A sampled AnimationCurve: `[[t, v], ...]` in time order, linear between samples, clamped at the ends. */
export class Curve {
  readonly keys: ReadonlyArray<readonly [number, number]>;
  constructor(keys: ReadonlyArray<readonly [number, number]>) {
    this.keys = keys;
  }
  Evaluate(t: number): number {
    const k = this.keys;
    if (k.length === 0) return 0;
    if (t <= k[0]![0]) return k[0]![1];
    for (let i = 1; i < k.length; i++) {
      if (t <= k[i]![0]) {
        const [t0, v0] = k[i - 1]!;
        const [t1, v1] = k[i]!;
        return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
      }
    }
    return k[k.length - 1]![1];
  }
}

export const Mathf = {
  PI: Math.PI,
  Deg2Rad: Math.PI / 180,
  Rad2Deg: 180 / Math.PI,
  Epsilon: 1.401298e-45,
  Infinity: Number.POSITIVE_INFINITY,
  Abs: Math.abs,
  Min: Math.min,
  Max: Math.max,
  Sqrt: Math.sqrt,
  Pow: Math.pow,
  Sin: Math.sin,
  Cos: Math.cos,
  Atan2: Math.atan2,
  Floor: Math.floor,
  Ceil: Math.ceil,
  FloorToInt: (v: number) => Math.floor(v),
  CeilToInt: (v: number) => Math.ceil(v),
  /** C# rounds halves to the even neighbour; Math.round does not. */
  Round: (v: number) => {
    const f = Math.floor(v);
    const d = v - f;
    if (d < 0.5) return f;
    if (d > 0.5) return f + 1;
    return f % 2 === 0 ? f : f + 1;
  },
  RoundToInt: (v: number) => Mathf.Round(v),
  Sign: (v: number) => (v >= 0 ? 1 : -1),
  Clamp: (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v),
  Clamp01: (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v),
  Lerp: (a: number, b: number, t: number) => a + (b - a) * Mathf.Clamp01(t),
  LerpUnclamped: (a: number, b: number, t: number) => a + (b - a) * t,
  InverseLerp: (a: number, b: number, v: number) => (a === b ? 0 : Mathf.Clamp01((v - a) / (b - a))),
  MoveTowards: (current: number, target: number, maxDelta: number) =>
    Math.abs(target - current) <= maxDelta ? target : current + Math.sign(target - current) * maxDelta,
  Repeat: (t: number, length: number) => Mathf.Clamp(t - Math.floor(t / length) * length, 0, length),
  Approximately: (a: number, b: number) => Math.abs(b - a) < Math.max(1e-6 * Math.max(Math.abs(a), Math.abs(b)), 1.121039e-44),
};

/** C# integer division truncates toward zero; `/` in TypeScript does not. */
export function intDiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

// ---- tagged JSON ----------------------------------------------------------------------------------------------

/** Turns a value into plain JSON, tagging the value types so `decodeValue` can rebuild them. */
export function encodeValue(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "object") return value;
  if (value instanceof Vector2) return { $v2: [value.x, value.y] };
  if (value instanceof Vector3) return { $v3: [value.x, value.y, value.z] };
  if (value instanceof Quaternion) return { $q: [value.x, value.y, value.z, value.w] };
  if (value instanceof Vector4) return { $v4: [value.x, value.y, value.z, value.w] };
  if (value instanceof Color) return { $color: [value.r, value.g, value.b, value.a] };
  if (value instanceof Curve) return { $curve: value.keys };
  if (Array.isArray(value)) return value.map(encodeValue);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value)) out[key] = encodeValue((value as Record<string, unknown>)[key]);
  return out;
}

/** The reverse of `encodeValue`. Unknown `$` tags are left as plain objects for the caller to resolve. */
export function decodeValue(json: unknown): unknown {
  if (json === null || typeof json !== "object") return json;
  if (Array.isArray(json)) return json.map(decodeValue);
  const o = json as Record<string, unknown>;
  const n = (key: string, len: number): number[] | null => {
    const a = o[key];
    return Array.isArray(a) && a.length === len && a.every((v) => typeof v === "number") ? (a as number[]) : null;
  };
  let a: number[] | null;
  if ((a = n("$v2", 2))) return new Vector2(a[0], a[1]);
  if ((a = n("$v3", 3))) return new Vector3(a[0], a[1], a[2]);
  if ((a = n("$q", 4))) return new Quaternion(a[0], a[1], a[2], a[3]);
  if ((a = n("$v4", 4))) return new Vector4(a[0], a[1], a[2], a[3]);
  if ((a = n("$color", 4))) return new Color(a[0], a[1], a[2], a[3]);
  if (Array.isArray(o.$curve)) return new Curve(o.$curve as [number, number][]);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(o)) out[key] = decodeValue(o[key]);
  return out;
}
