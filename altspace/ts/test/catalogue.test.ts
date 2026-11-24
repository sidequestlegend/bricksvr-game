// The catalogue against the upstream prefabs, read here with a few lines of YAML parsing of its own (not
// tools/bricks/extract_catalogue.py, which writes the catalogue):
//   - connector order: BrickAttachDetector reads _maleConnectors / _femaleConnectors as serialized in the held prefab,
//     and connectorsToUse[0] (BrickAttachDetector.cs:188-221, :392-397) decides where a brick lands;
//   - obstacles: only enabled, non-trigger BoxColliders of a placed prefab's "placed lego" layer are hit by
//     Physics.CheckBox / OverlapBoxNonAlloc (a disabled root box under an arch is not).
// The golden vectors (golden.test.ts) check the same from the other side: golden/PrefabYaml.cs builds the bricks from
// these prefabs for the upstream C#.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { heldBoxesAt } from "../src/BrickAttachDetector.ts";
import { BRICKS, BrickByPrefabName } from "../src/BrickData.ts";
import { BrickStore } from "../src/BrickStore.ts";

const RES = fileURLToPath(new URL("../../../Assets/Resources/", import.meta.url));

interface Doc {
  type: number;
  id: string;
  body: string;
}

function docs(file: string): Doc[] {
  const txt = readFileSync(RES + file, "utf8");
  const out: Doc[] = [];
  const re = /^--- !u!(\d+) &(-?\d+)(?: stripped)?\s*$/gm;
  const heads = [...txt.matchAll(re)];
  heads.forEach((m, i) => out.push({ type: Number(m[1]), id: m[2]!, body: txt.slice(m.index! + m[0].length, i + 1 < heads.length ? heads[i + 1]!.index : txt.length) }));
  return out;
}

const field = (body: string, name: string) => new RegExp(`\\n  ${name}: ?(.*)`).exec(body)?.[1]?.trim() ?? "";
const ref = (s: string) => /fileID: (-?\d+)/.exec(s)?.[1] ?? "0";

function refList(body: string, name: string): string[] {
  const at = body.indexOf(`\n  ${name}:`);
  if (at < 0) return [];
  const out: string[] = [];
  for (const line of body.slice(at + 1).split("\n").slice(1)) {
    if (!line.startsWith("  - ")) break;
    out.push(ref(line));
  }
  return out;
}

test("connectors are in the order of the held prefabs' serialized _maleConnectors / _femaleConnectors", () => {
  const problems: string[] = [];
  let lists = 0;
  for (const b of BRICKS) {
    const d = docs(`${b.prefab}.prefab`);
    const names = new Map(d.filter((x) => x.type === 1).map((x) => [x.id, field(x.body, "m_Name")]));
    const det = d.find((x) => x.type === 114 && x.body.includes("\n  _maleConnectors:"));
    assert.ok(det, `${b.prefab}: no BrickAttachDetector`);
    const want = { male: refList(det.body, "_maleConnectors").map((id) => names.get(id)), female: refList(det.body, "_femaleConnectors").map((id) => names.get(id)) };
    const got = { male: b.males.map((c) => c.name), female: b.females.map((c) => c.name) };
    for (const k of ["male", "female"] as const) {
      lists++;
      if (JSON.stringify(got[k]) !== JSON.stringify(want[k])) problems.push(`${b.prefab} ${k}: catalogue ${got[k].join(",")} upstream ${want[k].join(",")}`);
    }
  }
  assert.equal(lists, 132);
  assert.deepEqual(problems, []);
});

test("placed obstacles are exactly the placed prefabs' enabled solid colliders on the placed lego layer", () => {
  const problems: string[] = [];
  let disabled = 0;
  for (const b of BRICKS) {
    const d = docs(`${b.prefab} - Placed.prefab`);
    const gos = new Map(d.filter((x) => x.type === 1).map((x) => [x.id, x.body]));
    let enabled = 0;
    for (const x of d.filter((y) => y.type === 65)) {
      const go = gos.get(ref(field(x.body, "m_GameObject")))!;
      if (field(go, "m_Layer") !== "17" || field(x.body, "m_IsTrigger") === "1" || field(go, "m_IsActive") !== "1") continue;
      if (field(x.body, "m_Enabled") === "1") enabled++;
      else disabled++;
    }
    if (enabled !== b.placedBoxes.length) problems.push(`${b.prefab}: catalogue ${b.placedBoxes.length} boxes, upstream ${enabled} enabled`);
  }
  assert.deepEqual(problems, []);
  assert.equal(disabled, 10, "the disabled root boxes of 6 slopes, 3 arches and the pyramid");
});

test("a 1x1 plate fits under an arch, and an arch over a 1x1 plate (the arch's disabled root box is not solid)", () => {
  const A = BrickByPrefabName("1x3Arch")!;
  for (const small of ["1x1Plate", "1x1Tile", "1x1"]) {
    const P = BrickByPrefabName(small)!;
    const py = -P.bottomPlates * 32;
    const s1 = new BrickStore({ halfX: 4000, halfZ: 4000, height: 30000 });
    s1.add({ id: "a", type: A.type, ori: 0, pos: [0, -A.bottomPlates * 32, 0], color: -1 });
    assert.equal(s1.collides(heldBoxesAt(P.type, [0, py, 0], 0)), small === "1x1", `${small} under the arch`);
    const s2 = new BrickStore({ halfX: 4000, halfZ: 4000, height: 30000 });
    s2.add({ id: "p", type: P.type, ori: 0, pos: [0, py, 0], color: -1 });
    assert.equal(s2.collides(heldBoxesAt(A.type, [0, -A.bottomPlates * 32, 0], 0)), small === "1x1", `the arch over ${small}`);
  }
});
