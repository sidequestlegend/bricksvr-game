// The page half of the chunk renderer (BrickRenderer.ts): what it sends the kit's relay graph.

import assert from "node:assert/strict";
import { test } from "node:test";
import type { HostActions } from "../portkit/src/index.ts";
import { BrickByPrefabName } from "../src/BrickData.ts";
import { BrickRenderer, EMPTY_ITEM } from "../src/BrickRenderer.ts";
import { type Lookable, renderChunk } from "../src/ChunkedRenderer.ts";

function recorder() {
  const ops: Array<{ name: string; target: string; args: unknown[] }> = [];
  const host = {
    spawn: (target: string, name: string) => ops.push({ name: "spawn", target, args: [name] }),
    op: (name: string, target: string, args: unknown[]) => ops.push({ name, target, args }),
  } as unknown as HostActions;
  return { ops, host };
}

const T = BrickByPrefabName("2x2")!.type;
const brick = (id: string, x: number): Lookable => ({ id, type: T, ori: 0, pos: [x, 48, 40], color: 0xff0055bf, covered: [], onFloor: true, texOffset: 0 });

/** Plays the records of every `bricks` op into slot arrays, as the graph keeps its CombineInstance list. */
function slotsAfter(ops: Array<{ name: string; args: unknown[] }>): string[] {
  const slots: string[] = [];
  for (const op of ops) {
    if (op.name !== "bricks") continue;
    for (const record of String(op.args[0]).split(";")) {
      const [slot, ...item] = record.split(",");
      const i = Number(slot);
      assert.ok(i <= slots.length, "a record never skips past the end of the list");
      slots[i] = item.join(",");
    }
  }
  return slots;
}

test("records: new bricks append, removed ones empty their slot, a freed slot is reused", () => {
  const { ops, host } = recorder();
  const r = new BrickRenderer(host);
  r.update([renderChunk("0,0,0", [brick("a#1", 40), brick("a#2", 200), brick("a#3", 360)])]);
  assert.equal(ops[0]!.name, "spawn");
  assert.deepEqual(ops[1]!.args[1], 1);
  r.update([renderChunk("0,0,0", [brick("a#1", 40), brick("a#3", 360)])]);
  let slots = slotsAfter(ops);
  assert.equal(slots[1], EMPTY_ITEM);
  r.update([renderChunk("0,0,0", [brick("a#1", 40), brick("a#3", 360), brick("a#4", 520)])]);
  slots = slotsAfter(ops);
  assert.equal(slots.length, 3);
  assert.notEqual(slots[1], EMPTY_ITEM);
  r.update([renderChunk("0,0,0", [])]);
  assert.deepEqual(ops[ops.length - 1]!.args[1], 0, "an empty chunk asks for no collider");
});

test("records: a build cleared and put back in one pass (Load) keeps every brick drawn", () => {
  const { ops, host } = recorder();
  const r = new BrickRenderer(host);
  r.update([renderChunk("0,0,0", [brick("a#1", 40), brick("a#2", 200)])]);
  // the same looks under new ids (a save loaded over itself): the slots are taken again and nothing goes empty
  r.update([renderChunk("0,0,0", [brick("b#1", 40), brick("b#2", 200)])]);
  const slots = slotsAfter(ops);
  assert.equal(slots.length, 2);
  assert.ok(slots.every((s) => s !== EMPTY_ITEM), JSON.stringify(slots));
  assert.deepEqual(r.counts(), { C0_0_0: 2 });
});
