// Several players at a build area in the fake room (portkit's model of the real room's limits), on virtual time.
// Measurements are printed as "MEASURE ..." lines (PORT.md 9 quotes them).

import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { test } from "node:test";
import { Quaternion, Vector3 } from "../portkit/src/index.ts";
import { CheckIfCanConnect } from "../src/BrickAttachDetector.ts";
import { BrickByPrefabName } from "../src/BrickData.ts";
import { BrickLedger } from "../src/BrickLedger.ts";
import { decode, type Packed } from "../src/BrickRecords.ts";
import type { HeldBrick } from "../src/HeldBrick.ts";
import { area, converge, counters, leafSizes, newWorld, plannedBuild, type Plan, SLUG, userLeafMax } from "./helpers.ts";

const measure = (text: string) => console.log("MEASURE " + text);
const T = (name: string) => BrickByPrefabName(name)!.type;

/** Each player places its share at `perSecond` bricks a second; samples the room's write counters every second. */
async function build(world: ReturnType<typeof newWorld>, plans: Plan[][], perSecond = 20) {
  const players = world.clients.slice(0, plans.length);
  const cursor = plans.map(() => 0);
  const samples: Array<{ state: number; user: number; userLeaf: number }> = [];
  let last = counters(world);
  let ms = 0;
  const step = 100;
  const per = Math.max(1, Math.round((perSecond * step) / 1000));
  while (cursor.some((c, i) => c < plans[i]!.length)) {
    players.forEach((p, i) => {
      for (let k = 0; k < per && cursor[i]! < plans[i]!.length; k++) {
        const b = plans[i]![cursor[i]!++]!;
        assert.ok(area(world, p).Place(b.type, b.ori, b.pos, b.color), `${p.name} could not place ${JSON.stringify(b)}`);
      }
    });
    await world.run(step);
    ms += step;
    if (ms % 1000 === 0) {
      const now = counters(world);
      samples.push({ state: now.stateBatches - last.stateBatches, user: now.userWrites - last.userWrites, userLeaf: userLeafMax(world) });
      last = now;
    }
  }
  return { ms, samples };
}

function multiset(world: ReturnType<typeof newWorld>, c: (typeof world.clients)[number], inst = "0"): string[] {
  return [...area(world, c, inst).ledger.store.bricks.values()].map((b) => `${b.type}/${b.ori}/${b.pos.join(",")}/${b.color}`).sort();
}

test("three players place 2,000 bricks: nothing lost, every client the same, within the room's budgets", async () => {
  const world = newWorld(11);
  const [a, b, c] = [world.join({ name: "Ann" }), world.join({ name: "Bob" }), world.join({ name: "Cy" })];
  await world.settle();
  const before = counters(world);
  const plans = plannedBuild(2000, 3);
  const { ms, samples } = await build(world, plans, 20);
  assert.ok(await converge(world, 2000, 30000), "clients did not converge on 2,000 bricks");
  for (const p of [a, b, c]) assert.equal(area(world, p).ledger.store.count, 2000);
  assert.deepEqual(multiset(world, b), multiset(world, a));
  assert.deepEqual(multiset(world, c), multiset(world, a));
  // every planned brick is there, as planned
  const want = plans.flat().map((p) => `${p.type}/${p.ori}/${p.pos.join(",")}/${p.color}`).sort();
  assert.deepEqual(multiset(world, a), want);
  // logs drain into the archive
  assert.ok(await world.room.runUntil(() => [a, b, c].every((p) => area(world, p).pending === 0), 20000), "logs did not drain");
  const after = counters(world);
  const sizes = leafSizes(world, `pk1.${SLUG}.0.`);
  const peakState = Math.max(...samples.map((s) => s.state));
  const peakUser = Math.max(...samples.map((s) => s.user));
  measure(`build 2000 bricks by 3 players over ${(ms / 1000).toFixed(1)} s virtual: space-state batches ${after.stateBatches - before.stateBatches} (peak ${peakState}/s, mean ${((after.stateBatches - before.stateBatches) / (ms / 1000)).toFixed(2)}/s), user-state writes ${after.userWrites - before.userWrites} (peak ${peakUser}/s room-wide), rate_limited ${after.rateLimited}`);
  measure(`space state for the area: ${sizes.keys} keys, ${sizes.totalBytes} bytes, largest leaf ${sizes.maxBytes} bytes; largest user-state leaf while building ${Math.max(...samples.map((s) => s.userLeaf))} bytes; archive writes by referee ${area(world, a).stats.archiveWrites}`);
  assert.equal(after.rateLimited, 0);
  assert.ok(sizes.maxBytes <= 16384, `leaf of ${sizes.maxBytes} bytes`);
  assert.ok(peakState <= 20, `peak ${peakState} state batches a second`);
  assert.deepEqual(world.problems(), []);

  // a late joiner: how long until it shows the same 2,000 bricks, and what the rebuild costs
  const joinAt = world.room.now;
  const d = world.join({ name: "Dee" });
  await world.settle();
  assert.ok(await converge(world, 2000, 30000));
  measure(`late joiner sees all 2000 bricks ${world.room.now - joinAt} ms (virtual) after opening the page (includes the fake room's join and kit delays)`);
  assert.deepEqual(multiset(world, d), multiset(world, a));

  // the rebuild itself, timed for real: decode every segment and log in the room and rebuild placed bricks + covers
  const snapshot = world.room.stateSnapshot();
  const segs: Packed[] = [];
  for (const [k, v] of Object.entries(snapshot)) if (/\.v\.s\d\d$/.test(k)) segs.push((JSON.parse(String(v)) as { d: Packed }).d);
  const runs: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    const ledger = new BrickLedger({ halfX: 2560, halfZ: 2560, height: 15360 });
    ledger.setArchive(segs.map((s) => decode(s)), true);
    runs.push(performance.now() - t0);
    assert.equal(ledger.digest(), area(world, a).ledger.digest());
  }
  runs.sort((x, y) => x - y);
  measure(`rebuild of 2000 bricks from ${segs.filter((s) => s.r).length} segments: median ${runs[2]!.toFixed(1)} ms, min ${runs[0]!.toFixed(1)} ms (Node, this machine)`);
  // the ghost: CheckIfCanConnect runs every tick while a brick is held, so time it beside the 2,000 bricks
  const store = area(world, a).ledger.store;
  const top = [...store.bricks.values()].sort((x, y) => y.pos[1] - x.pos[1])[0]!;
  const t1 = performance.now();
  let snaps = 0;
  for (let i = 0; i < 1000; i++) {
    const s = CheckIfCanConnect(store, { type: T("4x2"), pos: [top.pos[0] + ((i % 7) - 3) * 9, top.pos[1] + 100, top.pos[2] + ((i % 5) - 2) * 9], q: [0, Math.sin(i), 0, Math.cos(i)] }, true);
    if (s) snaps++;
  }
  measure(`snap test (the ghost) beside 2000 bricks: ${((performance.now() - t1) / 1000).toFixed(3)} ms per call (${snaps} of 1000 attach)`);
  const chunks = area(world, d).RenderChunks();
  measure(`renderer input after the rebuild: ${chunks.length} chunks, largest ${Math.max(...chunks.map((ch) => ch.bricks.length))} bricks`);
  assert.equal(chunks.reduce((n, ch) => n + ch.bricks.length, 0), 2000);
});

test("concurrent place and delete converge to the same bricks everywhere", async () => {
  const world = newWorld(12);
  const [a, b, c] = [world.join({ name: "Ann" }), world.join({ name: "Bob" }), world.join({ name: "Cy" })];
  await world.settle();
  const brick = T("2x2");
  const base = area(world, a).Place(brick, 0, [40, 48, 40], -1)!;
  await world.run(1500);
  // same tick: Bob deletes the base, Cy puts a brick on it, Ann puts one beside it
  area(world, b).Delete([base]);
  const top = area(world, c).Place(brick, 0, [40, 144, 40], -1);
  const side = area(world, a).Place(brick, 0, [200, 48, 40], -1);
  assert.ok(top && side);
  // and two players put a brick in the same spot at once: both checks pass locally, both records stand
  const p1 = area(world, a).Place(brick, 0, [520, 48, 40], -1);
  const p2 = area(world, b).Place(brick, 1, [520, 48, 40], -1);
  assert.ok(p1 && p2);
  assert.ok(await converge(world, 4, 10000));
  for (const p of [a, b, c]) {
    const ids = [...area(world, p).ledger.store.bricks.keys()].sort();
    assert.deepEqual(ids, [top, side, p1, p2].sort());
  }
  // a delete of a brick another player is deleting at the same moment: one tombstone each, same result
  area(world, a).Delete([side!]);
  area(world, c).Delete([side!]);
  assert.ok(await converge(world, 3, 10000));
});

test("a tombstone that arrives before its brick still removes it (any order, same result)", () => {
  const recs = [
    { kind: "P" as const, author: "a~1", seq: 1, type: 0, ori: 0, pos: [40, 48, 0] as [number, number, number], rgb: 1 },
    { kind: "P" as const, author: "a~1", seq: 2, type: 0, ori: 0, pos: [200, 48, 0] as [number, number, number], rgb: 2 },
    { kind: "T" as const, author: "b~1", seq: 1, target: "a~1", from: 1, to: 1 },
  ];
  const digests = new Set<string>();
  for (const order of [[0, 1, 2], [2, 0, 1], [1, 2, 0], [2, 1, 0]]) {
    const l = new BrickLedger({ halfX: 2560, halfZ: 2560, height: 15360 });
    for (const i of order) l.ingest([recs[i]!]);
    digests.add(l.digest());
    assert.equal(l.store.count, 1);
  }
  assert.equal(digests.size, 1);
});

test("a player who leaves keeps their bricks: archived, and there for a late joiner after their user state is gone", async () => {
  const world = newWorld(13);
  const [a, b] = [world.join({ name: "Ann" }), world.join({ name: "Bob" })];
  assert.ok(b);
  await world.settle();
  const plans = plannedBuild(300, 1)[0]!;
  // Ann (the referee: she joined first) places 300 and leaves 1 s later
  for (const p of plans) assert.ok(area(world, a).Place(p.type, p.ori, p.pos, p.color));
  await world.run(1000);
  const pendingAtLeave = area(world, a).pending;
  world.leave(a);
  assert.ok(await converge(world, 300, 20000), "Bob lost bricks");
  await world.run(35000); // past the room's 30 s session grace: Ann's user state is gone
  assert.deepEqual(world.room.userStateOf(a.sid), {});
  const c = world.join({ name: "Cy" });
  await world.settle();
  assert.ok(await converge(world, 300, 20000), "the late joiner did not get all 300");
  measure(`leaver: 300 bricks placed, ${pendingAtLeave} still in her log when she left 1 s later; all 300 kept by Bob and rebuilt by a joiner after her user state expired`);
  assert.equal(area(world, c).ledger.store.count, 300);
});

test("two build areas in one room stay separate", async () => {
  const world = newWorld(14);
  const els: Array<Record<string, string>> = [{ room: "north" }, { room: "south", width: "48" }];
  const [a, b] = [world.join({ name: "Ann", elements: els }), world.join({ name: "Bob", elements: els })];
  await world.settle("north");
  await world.settle("south");
  const plans = plannedBuild(120, 1)[0]!;
  plans.slice(0, 80).forEach((p) => assert.ok(area(world, a, "north").Place(p.type, p.ori, p.pos, p.color)));
  plans.slice(0, 40).forEach((p) => assert.ok(area(world, b, "south").Place(p.type, p.ori, p.pos, p.color)));
  assert.ok(await converge(world, 80, 20000, "north"));
  assert.ok(await converge(world, 40, 20000, "south"));
  const keys = world.room.stateKeys(`pk1.${SLUG}.`);
  assert.ok(keys.some((k) => k.startsWith(`pk1.${SLUG}.north.`)) && keys.some((k) => k.startsWith(`pk1.${SLUG}.south.`)));
  assert.ok(keys.every((k) => k.startsWith(`pk1.${SLUG}.north.`) || k.startsWith(`pk1.${SLUG}.south.`)));
  // the south area is 48 studs wide: a brick at x = 2000 u (25 studs out) is outside it, and inside the north one
  assert.equal(area(world, a, "south").Place(T("2x2"), 0, [2000, 48, 0], -1), null);
  assert.ok(area(world, a, "north").Place(T("2x2"), 0, [2000, 48, 0], -1));
});

test("local save and reload, also after leaving and coming back on the same device", async () => {
  const world = newWorld(15);
  const [a, b] = [world.join({ name: "Ann", uid: "ann", device: "ann-quest" }), world.join({ name: "Bob", uid: "bob" })];
  await world.settle();
  const plans = plannedBuild(150, 1)[0]!;
  for (const p of plans) area(world, a).Place(p.type, p.ori, p.pos, p.color);
  assert.ok(await converge(world, 150, 20000));
  const saved = multiset(world, a);
  assert.equal(area(world, a).Save("castle"), 150);
  assert.deepEqual(area(world, a).SaveNames(), ["castle"]);
  // Bob wrecks it
  area(world, b).Clear();
  assert.ok(await converge(world, 0, 20000));
  // Ann reloads: the same bricks come back, for everyone
  assert.equal(area(world, a).Load("castle"), 150);
  assert.ok(await converge(world, 150, 20000));
  assert.deepEqual(multiset(world, b), saved);
  // next visit on the same device, after Bob cleared again
  world.leave(a);
  area(world, b).Clear();
  await world.run(3000);
  const a2 = world.join({ name: "Ann", uid: "ann", device: "ann-quest" });
  await world.settle();
  assert.equal(area(world, a2).Load("castle"), 150);
  assert.ok(await converge(world, 150, 20000));
  assert.deepEqual(multiset(world, b), saved);
  // a different device has no save
  const c = world.join({ name: "Ann's friend", uid: "fay", device: "fay-pc" });
  await world.settle();
  assert.equal(area(world, c).Load("castle"), -1);
});

test("a held brick from the pool snaps on release; one that does not snap goes back to the pool after 6 s", async () => {
  const world = newWorld(16);
  const [a, b] = [world.join({ name: "Ann" }), world.join({ name: "Bob" })];
  await world.settle();
  const k = 7e-4; // metres per u at the default scale 7
  const slot = area(world, a).Spawn(T("4x2"), -1, new Vector3(0, 0.5, 0), Quaternion.identity) as HeldBrick;
  assert.ok(slot);
  await world.run(1000);
  const key = slot.gameObject.key;
  assert.equal(world.behaviour<HeldBrick>(b, `h${String(slot.index).padStart(2, "0")}`).t, T("4x2"));
  assert.ok(a.grab(SLUG, "0", key));
  await world.run(200);
  a.move(SLUG, "0", key, new Vector3(13 * k, 60 * k, -7 * k), Quaternion.Euler(3, 80, -2));
  a.drop(SLUG, "0", key);
  await world.run(1500);
  assert.ok(await converge(world, 1, 5000));
  const placed = [...area(world, b).ledger.store.bricks.values()][0]!;
  assert.equal(placed.pos[1], 48);
  assert.equal(world.behaviour<HeldBrick>(b, `h${String(slot.index).padStart(2, "0")}`).t, -1);
  // pick it up again from the build (BrickSwapper.SwapToRealBrick) and drop it in mid-air
  const again = area(world, b).PickUp(placed.id)!;
  assert.ok(again);
  await world.run(500);
  assert.ok(b.grab(SLUG, "0", again.gameObject.key));
  await world.run(200);
  b.move(SLUG, "0", again.gameObject.key, new Vector3(0, 2, 0));
  b.drop(SLUG, "0", again.gameObject.key);
  await world.run(1000);
  assert.ok(await converge(world, 0, 5000));
  assert.ok(again.t >= 0, "a loose brick stays a while");
  await world.run(6500);
  assert.equal(again.t, -1);
});

test("a locked area: only the world's owner builds", async () => {
  const world = newWorld(17, { owner: "boss" });
  const [o, m] = [world.join({ name: "Owner", uid: "boss" }), world.join({ name: "Member" })];
  await world.settle();
  area(world, o).SetLocked(true);
  await world.run(1500);
  assert.equal(area(world, m).CanBuild(), false);
  assert.equal(area(world, m).Place(T("2x2"), 0, [40, 48, 40], -1), null);
  assert.ok(area(world, o).Place(T("2x2"), 0, [40, 48, 40], -1));
  area(world, m).SetLocked(false); // refused by the room
  await world.run(1500);
  assert.equal(area(world, m).CanBuild(), false);
  assert.ok(await converge(world, 1, 5000));
});

test("deleted bricks leave the archive (garbage collection) and the hammer clears a radius", async () => {
  const world = newWorld(18);
  const [a, b] = [world.join({ name: "Ann" }), world.join({ name: "Bob" })];
  await world.settle();
  const plans = plannedBuild(400, 1)[0]!;
  for (const p of plans) area(world, a).Place(p.type, p.ori, p.pos, p.color);
  assert.ok(await converge(world, 400, 20000));
  const first = plans[40]!.pos;
  const gone = area(world, b).Hammer([first[0], first[1], first[2]], 400);
  assert.ok(gone > 50, `hammer took ${gone}`);
  assert.ok(await converge(world, 400 - gone, 20000));
  world.leave(a); // the bricks' author leaves: what was deleted can go for good
  await world.run(5000);
  const sizes = leafSizes(world, `pk1.${SLUG}.0.v.s`);
  const archive = world.room.stateKeys(`pk1.${SLUG}.0.v.s`).flatMap((k) => decode((JSON.parse(String(world.room.stateSnapshot()[k])) as { d: Packed }).d));
  const places = archive.filter((r) => r.kind === "P").length;
  measure(`after hammering ${gone} of 400 and the author leaving: archive holds ${places} place records and ${archive.length - places} tombstones in ${sizes.totalBytes} bytes; repacks by the remaining referee ${area(world, b).stats.repacks}`);
  // every deleted brick has left the archive; their tombstones go once they are a quarter of it (BrickLedger.planArchive)
  assert.equal(places, 400 - gone);
  assert.ok(archive.length <= 400, `archive holds ${archive.length} records`);
  const c = world.join({ name: "Cy" });
  await world.settle();
  assert.ok(await converge(world, 400 - gone, 20000));
  assert.equal(area(world, c).ledger.store.count, 400 - gone);
});

test("the referee leaves in the middle of a build; a player leaves 0.3 s after placing: nothing is lost", async () => {
  const world = newWorld(19);
  const [a, b, c] = [world.join({ name: "Ann" }), world.join({ name: "Bob" }), world.join({ name: "Cy" })];
  await world.settle();
  const plans = plannedBuild(900, 3);
  for (const p of plans[0]!.slice(0, 150)) assert.ok(area(world, a).Place(p.type, p.ori, p.pos, p.color));
  for (const p of plans[1]!.slice(0, 150)) assert.ok(area(world, b).Place(p.type, p.ori, p.pos, p.color));
  await world.run(300);
  world.leave(a); // the referee
  for (const p of plans[2]!.slice(0, 150)) assert.ok(area(world, c).Place(p.type, p.ori, p.pos, p.color));
  await world.run(300);
  const bobPending = area(world, b).pending;
  world.leave(b);
  assert.ok(await converge(world, 450, 30000));
  await world.run(35000);
  const d = world.join({ name: "Dee" });
  await world.settle();
  assert.ok(await converge(world, 450, 30000), `late joiner has ${area(world, d).ledger.store.count}`);
  measure(`referee left mid-build and a player left 0.3 s after placing 150 (${bobPending} of them not yet archived): all 450 kept`);
});

test("one player loads 2,000 bricks at once: how many writes and how long until everyone has them", async () => {
  const world = newWorld(20);
  // Bob loads (not the referee: his records go through his log and wait for the archive); Ann watches.
  const [b, a] = [world.join({ name: "Ann" }), world.join({ name: "Bob", device: "bob" })];
  await world.settle();
  for (const p of plannedBuild(2000, 1)[0]!) area(world, a).Place(p.type, p.ori, p.pos, p.color);
  assert.ok(await converge(world, 2000, 60000));
  assert.equal(area(world, a).Save("big"), 2000);
  area(world, a).Clear();
  assert.ok(await converge(world, 0, 30000));
  await world.run(3000);
  const before = counters(world);
  const t0 = world.room.now;
  let peakLog = 0;
  assert.equal(area(world, a).Load("big", false), 2000);
  const ok = await world.room.runUntil(() => {
    peakLog = Math.max(peakLog, userLeafMax(world));
    return area(world, b).ledger.store.count === 2000;
  }, 60000, 100);
  assert.ok(ok);
  const after = counters(world);
  measure(`load of 2000 saved bricks by a player who is not the referee: the other player has them all after ${world.room.now - t0} ms (virtual); ${after.stateBatches - before.stateBatches} space-state batches, ${after.userWrites - before.userWrites} user-state writes, largest log leaf ${peakLog} bytes, rate_limited ${after.rateLimited}`);
  assert.ok(after.stateBatches - before.stateBatches + (after.userWrites - before.userWrites) <= 100, "more than 100 writes");
  assert.ok(peakLog <= 16384);
  assert.equal(after.rateLimited, 0);
});
