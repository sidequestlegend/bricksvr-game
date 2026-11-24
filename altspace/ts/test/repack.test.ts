// Finding 5: a full repack rewrites most of the archive's 24 segments (about 14.5 KB each) in one tick. The relay
// closes the socket on a message over 256 KiB (RELAY.md 1); the runtime hands space-state writes over in parts
// (portkit 9b7c447). Here the game's own repack, with real records, through the fake relay that closes the socket
// like the real one.

import assert from "node:assert/strict";
import { test } from "node:test";
import { BrickByPrefabName } from "../src/BrickData.ts";
import { area, converge, newWorld, SLUG } from "./helpers.ts";

test("5: a repack of 18+ segments (over 256 KiB) arrives in parts: no oversize message, everyone converges", async () => {
  const world = newWorld(40);
  const els = [{ width: "240", depth: "240" }];
  const [a, b] = [world.join({ name: "Ann", elements: els }), world.join({ name: "Bob", elements: els })];
  await world.settle();
  const plate = BrickByPrefabName("1x1Plate")!.type;
  // Bob builds 13,000 one-stud plates (19 segments); Ann (the referee) archives them
  let n = 0;
  for (let x = -110; x < 110 && n < 13000; x++) {
    for (let z = -110; z < 110 && n < 13000; z++, n++) assert.ok(area(world, b).Place(plate, 0, [x * 80 + 40, 16, z * 80 + 40], -1));
    if (x % 10 === 0) await world.run(1200);
  }
  assert.ok(await converge(world, 13000, 120000));
  assert.ok(await world.room.runUntil(() => area(world, b).pending === 0, 60000, 200));
  const segs = world.room.stateKeys(`pk1.${SLUG}.0.v.s`).length;
  // Bob removes a third and leaves: the referee may collect them all and rewrites the archive
  const ids = [...area(world, b).ledger.store.bricks.keys()].filter((_id, i) => i % 3 === 0);
  area(world, b).Delete(ids);
  assert.ok(await world.room.runUntil(() => area(world, b).pending === 0, 60000, 200), "Bob's tombstones were not archived");
  world.leave(b);
  const before = area(world, a).stats.repacks;
  await world.run(40000);
  assert.ok(area(world, a).stats.repacks > before, "no repack");
  const c = world.join({ name: "Cy", elements: els });
  await world.settle();
  assert.ok(await converge(world, 13000 - ids.length, 60000), `Cy has ${area(world, c).ledger.store.count}`);
  console.log(`MEASURE repack: ${segs} segments before, largest state message ${world.room.stats.largestBatch} bytes, sockets closed ${world.room.stats.socketsClosed}`);
  assert.ok(segs >= 18, `only ${segs} segments`);
  assert.equal(world.room.stats.socketsClosed, 0);
  assert.ok(world.room.stats.largestBatch < 256 * 1024);
  assert.deepEqual(world.problems(), []);
});
