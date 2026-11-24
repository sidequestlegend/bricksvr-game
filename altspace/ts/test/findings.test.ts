// The independent review's findings (REVIEW-FINDINGS.md, brick-builder 3-15), one test each, written to fail on the
// code before the fix. Numbers in the test names are the findings' numbers.

import assert from "node:assert/strict";
import { test } from "node:test";
import { Button, Quaternion, Vector3 } from "../portkit/src/index.ts";
import { BrickByPrefabName, BRICKS, CATEGORIES } from "../src/BrickData.ts";
import { BrickLedger } from "../src/BrickLedger.ts";
import type { BrickLog } from "../src/BrickLog.ts";
import { type BrickRecord, decode, encode, type Packed, recordId } from "../src/BrickRecords.ts";
import type { BuildArea } from "../src/BuildArea.ts";
import type { PickerTile } from "../src/Controls.ts";
import type { HeldBrick } from "../src/HeldBrick.ts";
import { area, converge, newWorld, plannedBuild, SLUG } from "./helpers.ts";

const T = (name: string) => BrickByPrefabName(name)!.type;

function myLog(a: BuildArea): BrickLog {
  return (a as unknown as { myLogBehaviour(): BrickLog }).myLogBehaviour();
}

function archiveRecords(world: ReturnType<typeof newWorld>): BrickRecord[] {
  return world.room.stateKeys(`pk1.${SLUG}.0.v.s`).flatMap((k) => decode((JSON.parse(String(world.room.stateSnapshot()[k])) as { d: Packed }).d));
}

test("3: a full archive refuses new bricks with a notice; nothing placed is lost and the referee does not throw", async () => {
  const world = newWorld(30);
  const [a, b] = [world.join({ name: "Ann" }), world.join({ name: "Bob" })];
  await world.settle();
  // A small archive (24 segments of 400 bytes, about 300 records) so that the test fills it quickly.
  for (const c of [a, b]) Object.assign(area(world, c), { segmentCapacity: 400 });
  let placed = 0;
  let refused = 0;
  for (const p of plannedBuild(600, 1)[0]!) {
    if (area(world, b).Place(p.type, p.ori, p.pos, p.color)) placed++;
    else refused++;
    if (placed % 20 === 0) await world.run(300);
  }
  await world.run(5000);
  assert.ok(refused > 0 && placed > 100, `placed ${placed}, refused ${refused}`);
  assert.equal(area(world, b).stats.refusedFull, refused);
  assert.match(String(area(world, b).status?.text ?? (area(world, b) as unknown as { statusText: string }).statusText), /FULL/);
  assert.deepEqual(world.problems(), []);
  // everything that was placed is archived (nothing waits in a log to be lost when Bob leaves)
  assert.equal(area(world, b).pending, 0);
  world.leave(b);
  await world.run(35000);
  const c = world.join({ name: "Cy" });
  await world.settle();
  assert.ok(await converge(world, placed, 20000), `the late joiner has ${area(world, c).ledger.store.count} of ${placed}`);
  // removing still works on a full area, and makes room again
  assert.equal(area(world, c).Delete([...area(world, c).ledger.store.bricks.keys()].slice(0, 5)), 5);
});

test("4: a record of an unknown brick type or orientation is ignored on ingest, never archived, never fatal", async () => {
  const world = newWorld(31);
  const [a, b] = [world.join({ name: "Ann" }), world.join({ name: "Bob" })];
  await world.settle();
  const bob = area(world, b);
  assert.ok(bob.Place(T("2x2"), 0, [80, 48, 80], -1));
  await world.run(2000);
  // a modified client writes two bad records under its own key into its log
  const log = myLog(bob);
  const recs = decode({ a: log.a, r: log.r });
  recs.push({ kind: "P", author: bob.author, seq: 900, type: 200, ori: 0, pos: [0, 48, 0], rgb: 0 });
  recs.push({ kind: "P", author: bob.author, seq: 901, type: T("2x2"), ori: 30, pos: [400, 48, 0], rgb: 0 });
  const packed = encode(recs);
  log.a = packed.a;
  log.r = packed.r;
  log.RequestSerialization();
  await world.run(3000);
  assert.ok(!archiveRecords(world).some((r) => r.seq >= 900), "a bad record reached the archive");
  const c = world.join({ name: "Cy" });
  await world.settle();
  assert.ok(await converge(world, 1, 10000));
  assert.equal(area(world, c).ledger.store.count, 1);
  assert.ok(area(world, a).ledger.rejected >= 2);
  assert.deepEqual(world.problems(), []);
});

test("6: the swung hammer blasts every brick within max(3, speed) units, at most 200, nearest first", async () => {
  const world = newWorld(32);
  const [a] = [world.join({ name: "Ann" })];
  await world.settle();
  const plans = plannedBuild(400, 1)[0]!;
  for (const p of plans) area(world, a).Place(p.type, p.ori, p.pos, p.color);
  assert.ok(await converge(world, 400, 20000));
  const hit = plans[40]!.pos;
  const at = area(world, a).ToWorld(hit, [0, 0, 0, 1]).position;
  const before = new Map([...area(world, a).ledger.store.bricks.values()].map((b) => [b.id, b.pos] as const));
  const n = area(world, a).HammerAt(at, 0.7);
  assert.equal(n, 200, `one blow took ${n}`);
  // the 200 that went are the nearest to the brick hit
  const d = (p: readonly number[]) => Math.hypot(p[0]! - hit[0], p[1]! - hit[1], p[2]! - hit[2]);
  const gone = [...before].filter(([id]) => !area(world, a).ledger.store.bricks.has(id)).map(([, p]) => d(p));
  const left = [...area(world, a).ledger.store.bricks.values()].map((b) => d(b.pos));
  assert.ok(Math.min(...left) >= Math.max(...gone) - 1e-9, "a nearer brick was left standing");
  // a blow at rest is still 3 units (4,286 u, about 54 studs): the rest of this build is within it
  assert.equal(area(world, a).HammerAt(area(world, a).ToWorld([...area(world, a).ledger.store.bricks.values()][0]!.pos, [0, 0, 0, 1]).position, 0), 200);
});

test("7: picking up with every pool slot in use leaves the brick where it is; a leaver's slot is freed", async () => {
  const world = newWorld(33);
  const [a, b] = [world.join({ name: "Ann" }), world.join({ name: "Bob" })];
  await world.settle();
  const ann = area(world, a);
  const id = ann.Place(T("2x2"), 0, [80, 48, 80], -1)!;
  await world.run(1000);
  const taken: HeldBrick[] = [];
  for (let i = 0; i < 12; i++) taken.push(ann.Spawn(T("1x1"), -1, new Vector3(i * 0.2, 1, 0), Quaternion.identity)!);
  assert.ok(taken.every(Boolean));
  assert.equal(ann.PickUp(id), null);
  assert.ok(ann.ledger.store.bricks.has(id), "the brick was deleted without a slot to hold it");
  for (const s of taken) s.Free();
  await world.run(1000);
  // Bob takes a slot into his hand and leaves while holding it
  const slot = area(world, b).Spawn(T("4x2"), -1, new Vector3(0, 1, 0), Quaternion.identity)!;
  await world.run(500);
  assert.ok(b.grab(SLUG, "0", slot.gameObject.key));
  await world.run(500);
  world.leave(b);
  await world.run(15000);
  const seen = world.behaviour<HeldBrick>(a, `h${String(slot.index).padStart(2, "0")}`);
  assert.equal(seen.t, -1, "the leaver's slot is still taken");
});

test("8: a log's records count only under its own player's key", async () => {
  const world = newWorld(34);
  const [a, b] = [world.join({ name: "Ann" }), world.join({ name: "Bob" })];
  await world.settle();
  const ann = area(world, a);
  const bob = area(world, b);
  const log = myLog(bob);
  const forged: BrickRecord[] = [{ kind: "P", author: ann.author, seq: 77, type: T("2x2"), ori: 0, pos: [80, 48, 80], rgb: 0xff0000 }];
  const packed = encode(forged);
  log.a = packed.a;
  log.r = packed.r;
  log.RequestSerialization();
  await world.run(3000);
  assert.equal(ann.ledger.store.count, 0, "Bob's log placed a brick in Ann's name");
  assert.ok(!ann.ledger.records.has(recordId(forged[0]!)));
  // and Ann's own record with that number is still hers
  assert.ok(ann.Place(T("2x2"), 0, [80, 48, 80], -1));
});

test("9: a brick lying loose where a brick would snap blocks it, as upstream's lego layer does", async () => {
  const world = newWorld(35);
  const [a] = [world.join({ name: "Ann" })];
  await world.settle();
  const ann = area(world, a);
  const { position } = ann.ToWorld([0, 48, 0], [0, 0, 0, 1]);
  const loose = ann.Spawn(T("2x2"), -1, position, Quaternion.identity)!;
  await world.run(200);
  assert.equal(ann.ReleaseLocal({ type: T("2x2"), pos: [0, 70, 0], q: [0, 0, 0, 1] }, -1), null, "snapped into a loose brick");
  loose.Free();
  await world.run(200);
  assert.ok(ann.ReleaseLocal({ type: T("2x2"), pos: [0, 70, 0], q: [0, 0, 0, 1] }, -1));
});

test("10: an archive write decodes only the segments that changed", async () => {
  const world = newWorld(36);
  const [a, b] = [world.join({ name: "Ann" }), world.join({ name: "Bob" })];
  await world.settle();
  for (const p of plannedBuild(1500, 1)[0]!) area(world, a).Place(p.type, p.ori, p.pos, p.color);
  assert.ok(await converge(world, 1500, 30000));
  await world.run(3000);
  const before = area(world, b).stats.rebuildRecords;
  area(world, a).Place(T("2x2"), 0, [2000, 48, 2000], -1);
  await world.run(3000);
  const decoded = area(world, b).stats.rebuildRecords - before;
  assert.ok(decoded <= 700, `Bob decoded ${decoded} records for one new brick`);
});

test("11: the hand spawner sets while the button is held (from a brick or a picker tile) and spawns with the offset", async () => {
  const world = newWorld(37);
  const [a] = [world.join({ name: "Ann" })];
  await world.settle();
  const ann = area(world, a);
  const id = ann.Place(T("4x2"), 0, [80, 48, 80], argb(0x00ff00))!;
  assert.ok(id);
  const inBrick = ann.ToWorld([80, 48, 80], [0, 0, 0, 1]).position;
  const hand = (p: Vector3) => a.pose({ head: { position: new Vector3(0, 1.6, 0), rotation: new Quaternion() }, leftHand: { position: p, rotation: new Quaternion() }, rightHand: { position: p, rotation: new Quaternion() } });
  hand(inBrick);
  await world.run(200);
  a.input({ type: "button", button: Button.Primary, side: 1, pressed: true });
  await world.run(700);
  assert.deepEqual(ann.SpawnerSaved(1, Button.Primary), { type: T("4x2"), color: argb(0x00ff00) }, "not set while held");
  assert.equal(a.haptics.length, 1);
  a.input({ type: "button", button: Button.Primary, side: 1, pressed: false });
  await world.run(200);
  // from a picker tile of the shown category: the tile's brick in the picker's colour
  const tile = ann.FindBehavioursOfType<PickerTile>("PickerTile").find((t) => CATEGORIES.indexOf(BRICKS[t.type]!.category) === ann.category)!;
  tile.transform.SetPositionAndRotation(new Vector3(1, 1.2, -1), Quaternion.identity);
  hand(new Vector3(1.02, 1.2, -1));
  await world.run(200);
  a.input({ type: "button", button: Button.Secondary, side: 0, pressed: true });
  await world.run(700);
  a.input({ type: "button", button: Button.Secondary, side: 0, pressed: false });
  assert.deepEqual(ann.SpawnerSaved(0, Button.Secondary), { type: tile.type, color: ann.color });
  // the 1x6 arch spawns 0.03 below the hand (BrickData.cs:74)
  (ann as unknown as { spawners: Map<string, { saved: unknown }> }).spawners.get(`1/${Button.Primary}`)!.saved = { type: T("1x6Arch"), color: -1 };
  hand(new Vector3(0, 1.5, 0));
  await world.run(200);
  a.input({ type: "button", button: Button.Primary, side: 1, pressed: true });
  await world.run(100);
  a.input({ type: "button", button: Button.Primary, side: 1, pressed: false });
  await world.run(100);
  const arch = ann.FindBehavioursOfType<HeldBrick>("HeldBrick").find((s) => s.t === T("1x6Arch"))!;
  assert.ok(arch, "no arch spawned");
  assert.ok(Math.abs(arch.transform.position.y - (1.5 - 0.03)) < 1e-6, `arch at y ${arch.transform.position.y}`);
});

function argb(rgb: number): number {
  return ((0xff << 24) | rgb) | 0;
}

test("15: a brick number covered by a surviving tombstone is never used again by its author", () => {
  const l = new BrickLedger({ halfX: 4000, halfZ: 4000, height: 4000 });
  const ann = "ann~s1";
  l.ingest([
    { kind: "P", author: ann, seq: 1, type: T("2x2"), ori: 0, pos: [0, 48, 0], rgb: 0 },
    { kind: "P", author: ann, seq: 2, type: T("2x2"), ori: 0, pos: [200, 48, 0], rgb: 0 },
    { kind: "T", author: "bob~s2", seq: 1, target: ann, from: 2, to: 2 },
  ]);
  // what a client reloading under Ann's key reads after garbage collection dropped her brick 2 but not the tombstone
  const later = new BrickLedger({ halfX: 4000, halfZ: 4000, height: 4000 });
  later.setArchive([[{ kind: "P", author: ann, seq: 1, type: T("2x2"), ori: 0, pos: [0, 48, 0], rgb: 0 }, { kind: "T", author: "bob~s2", seq: 1, target: ann, from: 2, to: 2 }]]);
  assert.equal(later.lastSeq(ann), 2);
  assert.equal(l.lastSeq(ann), 2);
});
