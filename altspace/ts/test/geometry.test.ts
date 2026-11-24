// The lattice, the catalogue, snapping, overlap and cover rules on their own (no room).

import assert from "node:assert/strict";
import { test } from "node:test";
import { CheckIfCanConnect, GetNewRot } from "../src/BrickAttachDetector.ts";
import { BRICKS, BrickByPrefabName, AllBricks } from "../src/BrickData.ts";
import { BrickStore } from "../src/BrickStore.ts";
import { renderBrick } from "../src/ChunkedRenderer.ts";
import { Color32ToInt, ColorToInt, HoverColor, HSVToRGB, IntToColor32, RGBToHSV } from "../src/ColorInt.ts";
import { decode, encode, type BrickRecord } from "../src/BrickRecords.ts";
import { nearestOri, oriInv, oriMul, ORIS, qeuler, qangle } from "../src/Lattice.ts";

const T = (name: string) => BrickByPrefabName(name)!.type;
const bounds = { halfX: 64 * 40, halfZ: 64 * 40, height: 480 * 32 };
const RED = Color32ToInt({ r: 200, g: 30, b: 30, a: 255 });

test("the 24 orientations form a group and match Unity's quaternions", () => {
  assert.equal(ORIS.length, 24);
  assert.equal(new Set(ORIS.map((o) => o.m.join())).size, 24);
  for (const a of ORIS) {
    assert.equal(oriMul(a.index, oriInv(a.index)), 0);
    assert.equal(nearestOri(a.q), a.index);
  }
  // Unity: Quaternion.Euler(0, 90, 0) * right = back (left-handed)
  assert.deepEqual(ORIS[1]!.m.slice(0, 3), [0, 0, 1]);
  assert.deepEqual([ORIS[1]!.m[6], ORIS[1]!.m[7], ORIS[1]!.m[8]], [-1, 0, 0]);
  assert.ok(qangle(ORIS[1]!.q, qeuler(0, 90, 0)) < 1e-6);
});

test("catalogue: 66 bricks, 65 in the picker, mate points on the lattice", () => {
  assert.equal(BRICKS.length, 66);
  assert.equal(AllBricks().length, 65);
  const b = BRICKS[T("1x2")]!;
  assert.deepEqual(b.males.map((c) => c.mate).sort(), [[-40, 48, 0], [40, 48, 0]]);
  assert.deepEqual(b.females.map((c) => c.mate).sort(), [[-40, -48, 0], [40, -48, 0]]);
  const plate = BRICKS[T("2x4Plate")]!;
  assert.equal(plate.males.length, 8);
  assert.ok(plate.males.every((c) => c.mate[1] === 16));
  const side = BRICKS[T("1x1_1FaceSideStud")]!;
  const s = side.males.find((c) => c.up[2] === 1)!;
  assert.deepEqual(s.mate, [0, 6, 40]);
  for (const brick of BRICKS) {
    for (const c of brick.connectors) for (const v of c.mate) assert.ok(Number.isInteger(v), `${brick.prefab} ${c.name}`);
    assert.ok(brick.heldBoxes.length > 0 && brick.placedBoxes.length > 0, brick.prefab);
  }
});

test("a brick let go above the carpet lands on it, on the stud grid, turned to the nearest quarter", () => {
  const store = new BrickStore(bounds);
  const type = T("4x2");
  const snap = CheckIfCanConnect(store, { type, pos: [13, 60, -7], q: qeuler(3, 80, -2) }, true)!;
  assert.ok(snap);
  assert.equal(snap.downwards, true);
  assert.equal(snap.pos[1], 48);
  assert.equal(snap.ori, 1);
  // A 4x2 turned a quarter: its sockets sit on floor studs (multiples of 80).
  for (const f of BRICKS[type]!.females) {
    const m: readonly number[] = ORIS[snap.ori]!.m;
    const x: number = m[0]! * f.mate[0] + m[1]! * f.mate[1] + m[2]! * f.mate[2] + snap.pos[0];
    const z: number = m[6]! * f.mate[0] + m[7]! * f.mate[1] + m[8]! * f.mate[2] + snap.pos[2];
    assert.equal(Math.abs(x % 80), 0);
    assert.equal(Math.abs(z % 80), 0);
  }
});

test("stacking, overlap and covered studs", () => {
  const store = new BrickStore(bounds);
  const type = T("2x2");
  store.add({ id: "a#1", type, ori: 0, pos: [40, 48, 40], color: RED });
  const up = CheckIfCanConnect(store, { type, pos: [50, 150, 30], q: qeuler(0, 10, 0) })!;
  assert.deepEqual(up.pos, [40, 144, 40]);
  // the same place again: refused by the overlap test
  store.add({ id: "a#2", type, ori: up.ori, pos: up.pos, color: RED });
  assert.equal(CheckIfCanConnect(store, { type, pos: [40, 150, 40], q: qeuler(0, 0, 0) }), null); // covered studs take nothing
  assert.equal(CheckIfCanConnect(store, { type, pos: [40, 250, 40], q: qeuler(0, 0, 0) })?.pos[1] ?? -1, 240);
  assert.equal(store.collides(BrickStore.shape({ id: "x#1", type, ori: 0, pos: [40, 144, 40], color: 0 }).boxes), true);
  assert.equal(store.collides(BrickStore.shape({ id: "x#1", type, ori: 0, pos: [200, 48, 40], color: 0 }).boxes), false);
  // a's studs are covered by b; b's are not; a is on the carpet
  const a = store.bricks.get("a#1")!;
  const b = store.bricks.get("a#2")!;
  assert.ok(a.def.males.every((c) => a.covered[c.index]));
  assert.ok(b.def.males.every((c) => !b.covered[c.index]));
  assert.ok(b.def.females.every((c) => b.covered[c.index]));
  assert.equal(a.onFloor, true);
  const ra = renderBrick(a);
  assert.equal(ra.studsCovered, 0b1111);
  assert.equal(ra.bottomClosed, true);
  assert.equal(renderBrick(b).cacheKey, "2x2NNNN-bottomcovered");
  store.remove("a#2");
  assert.ok(a.def.males.every((c) => !a.covered[c.index]));
});

test("a brick held under a placed one goes up into its sockets", () => {
  const store = new BrickStore(bounds);
  const type = T("1x2");
  store.add({ id: "a#1", type, ori: 0, pos: [40, 48 + 96 * 2, 0], color: RED });
  // hold a plate under it, studs up, away from the carpet
  const plate = T("1x2Plate");
  const snap = CheckIfCanConnect(store, { type: plate, pos: [45, 48 + 96 * 2 - 70, 5], q: qeuler(0, 175, 0) })!;
  assert.equal(snap.downwards, false);
  assert.deepEqual(snap.pos, [40, 48 + 96 * 2 - 48 - 16, 0]);
});

test("a side stud takes a brick sideways", () => {
  const store = new BrickStore(bounds);
  store.add({ id: "a#1", type: T("1x1_1FaceSideStud"), ori: 0, pos: [40, 48, 40], color: RED });
  // hold a 1x1 brick out along +Z, its sockets facing the side stud (turned -90 about X: its -Y faces -Z)
  const snap = CheckIfCanConnect(store, { type: T("1x1"), pos: [40, 54, 40 + 88 + 6], q: qeuler(90, 0, 0) })!;
  assert.ok(snap, "no snap");
  assert.deepEqual(snap.pos, [40, 48 + 6, 40 + 40 + 48]);
  assert.equal(ORIS[snap.ori]!.m[5], -1); // brick +Z now points... its up (+Y) is world +Z
});

test("GetNewRot picks the quarter turn nearest the hand", () => {
  for (let yaw = -180; yaw < 180; yaw += 7) {
    const o = GetNewRot(0, qeuler(0, yaw, 0));
    const want = (((Math.round(yaw / 90) % 4) + 4) % 4);
    if (Math.abs(Math.abs(yaw % 90) - 45) < 1) continue;
    assert.equal(o, want, `yaw ${yaw}`);
  }
});

test("records round-trip", () => {
  const recs: BrickRecord[] = [
    { kind: "P", author: "u1~s1", seq: 1, type: 65, ori: 23, pos: [-32767, 0, 32767], rgb: 0xff00aa },
    { kind: "T", author: "u2~s9", seq: 16777215, target: "u1~s1", from: 1, to: 9000 },
    { kind: "P", author: "u2~s9", seq: 2, type: 0, ori: 0, pos: [40, 48, -40], rgb: 0 },
  ];
  const p = encode(recs);
  assert.equal(p.r.length, 21 + 16 + 21);
  assert.deepEqual(decode(p), recs);
  assert.deepEqual(decode({ a: p.a, r: p.r.slice(0, 30) }), recs.slice(0, 1));
});

test("colours: ColorInt and Unity's HSV conversions", () => {
  assert.deepEqual(IntToColor32(Color32ToInt({ r: 1, g: 2, b: 3, a: 255 })), { r: 1, g: 2, b: 3, a: 255 });
  assert.equal(ColorToInt({ r: 1, g: 0.5, b: 0, a: 1 }) >>> 0, 0xffff7f00);
  assert.deepEqual(HoverColor({ r: 250, g: 250, b: 10, a: 255 }), { r: 230, g: 230, b: 0, a: 255 });
  const c = HSVToRGB(0.25, 0.5, 0.8);
  const back = RGBToHSV(c);
  assert.ok(Math.abs(back.h - 0.25) < 1e-6 && Math.abs(back.s - 0.5) < 1e-6 && Math.abs(back.v - 0.8) < 1e-6);
});
