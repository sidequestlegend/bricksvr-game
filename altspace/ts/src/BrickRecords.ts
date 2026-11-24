// What replaces NormcoreRPC.Brick (NormcoreRPC.cs:251-271) and the cloud backend's brick rows (BrickServerInterface.cs:
// 100-191): records, appended by one author, never edited.
//
//   place      "P" + 20 base64url characters (15 bytes): author index u8, seq u24, type u8, orientation u8,
//              x, y, z i16 (u), colour u24 (0xRRGGBB)
//   tombstone  "T" + 15 base64url characters (11 bytes): author index u8, seq u24, target author index u8,
//              target seq from u24, to u24 (inclusive: one brick, or a whole range for "clear")
//
// A packed list is `{a: [author keys], r: "<records>"}`; author indices point into `a`. An author key is
// "<uid>~<session id>", so a returning player writes as a new author and nobody's seq numbers ever collide.
// A record's id is "<author>#<seq>"; a placed brick's id is its place record's id.

import type { V3 } from "./Lattice.ts";

export interface PlaceRecord {
  kind: "P";
  author: string;
  seq: number;
  type: number;
  ori: number;
  pos: V3;
  /** 0xRRGGBB */
  rgb: number;
}

export interface TombRecord {
  kind: "T";
  author: string;
  seq: number;
  target: string;
  from: number;
  to: number;
}

export type BrickRecord = PlaceRecord | TombRecord;

export interface Packed {
  a: string[];
  r: string;
}

export const PLACE_CHARS = 21;
export const TOMB_CHARS = 16;
export const MAX_SEQ = 0xffffff;
export const MAX_COORD = 32767;

export function recordId(r: { author: string; seq: number }): string {
  return `${r.author}#${r.seq}`;
}

export function authorOf(id: string): string {
  return id.slice(0, id.lastIndexOf("#"));
}

export function seqOf(id: string): number {
  return Number(id.slice(id.lastIndexOf("#") + 1));
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const DECODE = new Map<string, number>([...ALPHABET].map((c, i) => [c, i]));

function b64(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const left = bytes.length - i;
    out += ALPHABET[(n >> 18) & 63]! + ALPHABET[(n >> 12) & 63]!;
    if (left > 1) out += ALPHABET[(n >> 6) & 63]!;
    if (left > 2) out += ALPHABET[n & 63]!;
  }
  return out;
}

function unb64(text: string, count: number): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i += 4) {
    let n = 0;
    for (let j = 0; j < 4; j++) {
      const v = i + j < text.length ? DECODE.get(text[i + j]!) : 0;
      if (v === undefined) throw new Error("bad record character");
      n = (n << 6) | v;
    }
    bytes.push((n >> 16) & 255, (n >> 8) & 255, n & 255);
  }
  return bytes.slice(0, count);
}

const u24 = (v: number) => [(v >> 16) & 255, (v >> 8) & 255, v & 255];
const i16 = (v: number) => [((v + 32768) >> 8) & 255, (v + 32768) & 255];
const rd24 = (b: number[], i: number) => (b[i]! << 16) | (b[i + 1]! << 8) | b[i + 2]!;
const rd16s = (b: number[], i: number) => ((b[i]! << 8) | b[i + 1]!) - 32768;

/** Whether a placement fits the wire format. */
export function placeable(type: number, ori: number, pos: readonly number[]): boolean {
  return type >= 0 && type < 256 && ori >= 0 && ori < 24 && pos.every((v) => Number.isInteger(v) && Math.abs(v) <= MAX_COORD);
}

export function encode(records: readonly BrickRecord[]): Packed {
  const authors: string[] = [];
  const index = new Map<string, number>();
  const ix = (a: string) => {
    let i = index.get(a);
    if (i === undefined) {
      if (authors.length >= 256) throw new Error("more than 256 authors in one packed list");
      index.set(a, (i = authors.length));
      authors.push(a);
    }
    return i;
  };
  let r = "";
  for (const rec of records) {
    if (rec.kind === "P") {
      r += "P" + b64([ix(rec.author), ...u24(rec.seq), rec.type, rec.ori, ...i16(rec.pos[0]), ...i16(rec.pos[1]), ...i16(rec.pos[2]), ...u24(rec.rgb)]);
    } else {
      r += "T" + b64([ix(rec.author), ...u24(rec.seq), ix(rec.target), ...u24(rec.from), ...u24(rec.to)]);
    }
  }
  return { a: authors, r };
}

/** Reads a packed list; a malformed record ends the list (what came before it is kept). */
export function decode(packed: Packed | null | undefined): BrickRecord[] {
  const out: BrickRecord[] = [];
  if (!packed || typeof packed.r !== "string" || !Array.isArray(packed.a)) return out;
  const a = packed.a;
  const r = packed.r;
  let i = 0;
  try {
    while (i < r.length) {
      const k = r[i];
      if (k === "P") {
        if (i + PLACE_CHARS > r.length) break;
        const b = unb64(r.slice(i + 1, i + PLACE_CHARS), 15);
        const author = a[b[0]!];
        if (typeof author !== "string") break;
        out.push({ kind: "P", author, seq: rd24(b, 1), type: b[4]!, ori: b[5]!, pos: [rd16s(b, 6), rd16s(b, 8), rd16s(b, 10)], rgb: rd24(b, 12) });
        i += PLACE_CHARS;
      } else if (k === "T") {
        if (i + TOMB_CHARS > r.length) break;
        const b = unb64(r.slice(i + 1, i + TOMB_CHARS), 11);
        const author = a[b[0]!];
        const target = a[b[4]!];
        if (typeof author !== "string" || typeof target !== "string") break;
        out.push({ kind: "T", author, seq: rd24(b, 1), target, from: rd24(b, 5), to: rd24(b, 8) });
        i += TOMB_CHARS;
      } else break;
    }
  } catch {
    // keep what was read
  }
  return out;
}

/** JSON bytes of a packed list as a leaf field (ASCII only). */
export function packedBytes(p: Packed): number {
  return JSON.stringify(p).length;
}
