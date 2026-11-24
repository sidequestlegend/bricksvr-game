// Test helpers: players at a build area in the fake room, a deterministic build of many bricks, and the room's
// write counters.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { FakeClient } from "../portkit/src/platform/fake.ts";
import { TestWorld } from "../portkit/src/testing.ts";
import { BrickByPrefabName } from "../src/BrickData.ts";
import type { BuildArea } from "../src/BuildArea.ts";
import { Color32ToInt } from "../src/ColorInt.ts";
import type { V3 } from "../src/Lattice.ts";
import game from "../src/index.ts";

export const bindings = JSON.parse(readFileSync(fileURLToPath(new URL("../bindings.json", import.meta.url)), "utf8"));
export const SLUG = game.slug;

export function newWorld(seed = 1, options: Record<string, unknown> = {}): TestWorld {
  return new TestWorld(game, bindings, { seed, ...options });
}

export const area = (world: TestWorld, c: FakeClient, inst = "0") => world.behaviour<BuildArea>(c, "area", inst);

export interface Plan {
  type: number;
  ori: number;
  pos: V3;
  color: number;
}

/**
 * `count` bricks that never overlap: columns on a 2-stud grid, each a stack of 2x2 bricks and 2x2 plates (and a few
 * 1x2 slopes on top), so every brick also sits on the one below. Column c belongs to player c % players.
 */
export function plannedBuild(count: number, players: number): Plan[][] {
  const brick = BrickByPrefabName("2x2")!.type;
  const plate = BrickByPrefabName("2x2Plate")!.type;
  const out: Plan[][] = Array.from({ length: players }, () => []);
  let made = 0;
  let column = 0;
  while (made < count) {
    const cx = (column % 24) - 12;
    const cz = Math.floor(column / 24) - 12;
    let y = 0;
    for (let k = 0; k < 12 && made < count; k++) {
      const isPlate = (column + k) % 3 === 0;
      const h = isPlate ? 32 : 96;
      const color = Color32ToInt({ r: (column * 37) & 255, g: (k * 61) & 255, b: (column * k * 13) & 255, a: 255 });
      out[column % players]!.push({ type: isPlate ? plate : brick, ori: (column + k) % 4, pos: [cx * 160 + 80, y + h / 2, cz * 160 + 80], color });
      y += h;
      made++;
    }
    column++;
  }
  return out;
}

/** The room's counters, for budgets. */
export function counters(world: TestWorld): { stateBatches: number; userWrites: number; rateLimited: number; refused: number } {
  const s = world.room.stats;
  return { stateBatches: s.stateBatches, userWrites: s.userWrites, rateLimited: s.rateLimited, refused: s.refusedWrites };
}

/** Largest stored leaf in bytes (space state) and every key under a prefix. */
export function leafSizes(world: TestWorld, prefix = "pk1."): { keys: number; maxBytes: number; totalBytes: number } {
  let maxBytes = 0;
  let totalBytes = 0;
  let keys = 0;
  for (const [k, v] of Object.entries(world.room.stateSnapshot())) {
    if (!k.startsWith(prefix)) continue;
    const n = Buffer.byteLength(typeof v === "string" ? v : JSON.stringify(v), "utf8");
    keys++;
    totalBytes += n;
    maxBytes = Math.max(maxBytes, n);
  }
  return { keys, maxBytes, totalBytes };
}

/** Largest user-state leaf of any player present, in bytes. */
export function userLeafMax(world: TestWorld): number {
  let max = 0;
  for (const c of world.clients) {
    for (const v of Object.values(world.room.userStateOf(c.sid))) {
      max = Math.max(max, Buffer.byteLength(typeof v === "string" ? v : JSON.stringify(v), "utf8"));
    }
  }
  return max;
}

/** Runs until every client's area shows `count` bricks and they all agree (or the time runs out). */
export async function converge(world: TestWorld, count: number | null, maxMs = 60000, inst = "0"): Promise<boolean> {
  return world.room.runUntil(() => {
    const ds = world.clients.map((c) => area(world, c, inst).ledger.digest());
    return ds.every((d) => d === ds[0]) && (count === null || ds[0]!.startsWith(`${count}:`));
  }, maxMs, 100);
}
