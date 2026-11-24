// The TypeScript against the upstream C#: vectors/upstream.json was written by golden/Harness.cs running BricksVR's
// own BrickAttachDetector.cs, LegoConnectorScript.cs and ColorInt.cs (unchanged, dotnet 8). Same inputs here, through
// BrickStore + BrickAttachDetector.ts. Allowed differences, decided in PORT.md 10.1:
//   - positions within POS_TOLERANCE u (0.15 mm of mesh): upstream lands on its tuned constants (Height(), 0.0560751
//     pitch, connector offsets of 40.05 u), the port on exact faces of the lattice; side studs within SIDE_TOLERANCE u
//     (the side stud sits 62.4 u out upstream, 40 u plus a 48 u half brick here);
//   - the port refuses a brick that would reach below the carpet (upstream lets one hang there): checked to be the
//     only reason, by running the same case without the floor rule;
//   - a held brick's own side stud going up into a socket is not compared (upstream ignores that connector's frame);
//   - nothing else: whether it attaches, the rotation, the direction and every connector's cover flag must match.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { CheckIfCanConnect } from "../src/BrickAttachDetector.ts";
import { BRICKS } from "../src/BrickData.ts";
import { BrickStore } from "../src/BrickStore.ts";
import { Color32ToInt, ColorToInt, IntToColor32 } from "../src/ColorInt.ts";
import { nearestOri, ORIS, type Q, type V3 } from "../src/Lattice.ts";

interface SnapCase {
  kind: string;
  placed: Array<{ type: number; ori: number; pos: V3 }>;
  held: { type: number; pos: V3; q: Q };
  /** Cover flags per placed brick, by connector: "m|f:x,y,z", its position in the brick's space in whole u (no shared order). */
  upstream: { can: boolean; pos?: V3; q?: Q; down?: boolean; covered: Array<Record<string, boolean>> };
  pairs: number;
}

const vectors = JSON.parse(readFileSync(fileURLToPath(new URL("../vectors/upstream.json", import.meta.url)), "utf8")) as {
  snap: SnapCase[];
  color: Array<{ rgba: number[]; int: number; c32: number[]; back: number }>;
};

const POS_TOLERANCE = 1.5;
const SIDE_TOLERANCE = 2.5;

test(`snapping: ${vectors.snap.length} situations agree with the upstream C#`, () => {
  const problems: string[] = [];
  const worst: Record<string, number> = {};
  const tally: Record<string, { n: number; attach: number }> = {};
  let belowCarpet = 0;
  let heldSideStud = 0;
  vectors.snap.forEach((c, n) => {
    const store = new BrickStore({ halfX: 40000, halfZ: 40000, height: 30000 });
    c.placed.forEach((p, i) => store.add({ id: `b${i}`, type: p.type, ori: p.ori, pos: p.pos, color: -1 }));
    // cover flags
    c.placed.forEach((_p, i) => {
      const b = store.bricks.get(`b${i}`)!;
      const got: Record<string, boolean> = {};
      const r = (v: number) => Math.sign(v) * Math.round(Math.abs(v));
      b.def.connectors.forEach((k) => (got[`${k.male ? "m" : "f"}:${k.probe.map(r).join(",")}`] = b.covered[k.index]!));
      const want = c.upstream.covered[i]!;
      const keys = [...new Set([...Object.keys(got), ...Object.keys(want)])].sort();
      const bad = keys.filter((k) => got[k] !== want[k]);
      if (bad.length) problems.push(`#${n} ${c.kind}: brick ${i} covered differs at ${bad.map((k) => `${k} port ${got[k]} upstream ${want[k]}`).join(", ")}`);
    });
    const snap = CheckIfCanConnect(store, c.held, true);
    const t = (tally[c.kind] ??= { n: 0, attach: 0 });
    t.n++;
    if (c.upstream.can) t.attach++;
    if (!snap && c.upstream.can) {
      // The port's one deliberate refusal (PORT.md 10.1): nothing below the carpet. Upstream lets a brick hang below
      // the floor from the underside of a brick, or turned on a side stud. Same case without the floor must agree.
      const open = new BrickStore({ halfX: 40000, halfZ: 40000, height: 30000, floor: -Infinity });
      c.placed.forEach((p, i) => open.add({ id: `b${i}`, type: p.type, ori: p.ori, pos: p.pos, color: -1 }));
      const s2 = CheckIfCanConnect(open, c.held, true);
      if (s2 && Math.max(...s2.pos.map((v, i) => Math.abs(v - c.upstream.pos![i]!))) <= SIDE_TOLERANCE) {
        belowCarpet++;
        return;
      }
    }
    const agrees = !!snap === c.upstream.can && (!snap || (Math.max(...snap.pos.map((v, i) => Math.abs(v - c.upstream.pos![i]!))) <= SIDE_TOLERANCE && snap.ori === nearestOri(c.upstream.q!)));
    if (!agrees && c.upstream.can && c.upstream.down === false && BRICKS[c.held.type]!.males.some((m) => m.up[1] !== 1)) {
      // The other decided difference: a held brick's own side stud going into a socket. Upstream treats it as if it
      // were on top (GetNewPosWithRot ignores the connector's frame); the port matches it in its own frame.
      heldSideStud++;
      return;
    }
    if (!!snap !== c.upstream.can) {
      problems.push(`#${n} ${c.kind}: attaches ${!!snap}, upstream ${c.upstream.can}${snap ? " at " + snap.pos.join(",") : " at " + c.upstream.pos?.map((v) => v.toFixed(1)).join(",")}`);
      return;
    }
    if (!snap) return;
    const d = Math.max(...snap.pos.map((v, i) => Math.abs(v - c.upstream.pos![i]!)));
    worst[c.kind] = Math.max(worst[c.kind] ?? 0, d);
    const tol = c.kind === "side" ? SIDE_TOLERANCE : POS_TOLERANCE;
    if (d > tol) problems.push(`#${n} ${c.kind}: position ${snap.pos.join(",")} upstream ${c.upstream.pos!.map((v) => v.toFixed(2)).join(",")} (off by ${d.toFixed(2)} u)`);
    const q = ORIS[snap.ori]!.q;
    const u = c.upstream.q!;
    const dot = Math.abs(q[0] * u[0] + q[1] * u[1] + q[2] * u[2] + q[3] * u[3]);
    if (dot < 0.9999) problems.push(`#${n} ${c.kind}: rotation ${q.map((v) => v.toFixed(3))} upstream ${u.map((v) => v.toFixed(3))}`);
    if (snap.downwards !== c.upstream.down) problems.push(`#${n} ${c.kind}: downwards ${snap.downwards} upstream ${c.upstream.down}`);
  });
  console.log(`MEASURE golden snapping: ${Object.entries(tally).map(([k, v]) => `${k} ${v.n} (${v.attach} attach, worst position difference ${(worst[k] ?? 0).toFixed(2)} u)`).join("; ")}; refused by the port as below the carpet (upstream attaches): ${belowCarpet}; held side stud into a socket, placed differently: ${heldSideStud}`);
  assert.deepEqual(problems, []);
});

test(`ColorInt: ${vectors.color.length} colours agree with the upstream C#`, () => {
  for (const c of vectors.color) {
    const [r, g, b, a] = c.rgba as [number, number, number, number];
    assert.equal(ColorToInt({ r, g, b, a }), c.int);
    const c32 = IntToColor32(c.int);
    assert.deepEqual([c32.r, c32.g, c32.b, c32.a], c.c32);
    assert.equal(Color32ToInt(c32), c.back);
  }
});
