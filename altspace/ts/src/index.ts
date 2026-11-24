// The game's definition: its slug and the classes bindings.json names by `type`. The build reads the default export.

import type { GameDefinition } from "../portkit/src/index.ts";
import { BrickByPrefabName, BRICKS } from "./BrickData.ts";
import { BrickLog } from "./BrickLog.ts";
import { BrickSegment } from "./BrickSegment.ts";
import { BuildArea } from "./BuildArea.ts";
import { Hammer, PickerTab, PickerTile, Swatch, ToolButton } from "./Controls.ts";
import { HeldBrick } from "./HeldBrick.ts";

/**
 * A deterministic build of `count` bricks that never overlap (the Node tests' plannedBuild and the Play-mode spike):
 * columns on a 2-stud grid, 24 to a row, each a stack of 2x2 bricks and 2x2 plates.
 */
export function plannedBuild(count: number): Array<{ type: number; ori: number; pos: [number, number, number]; rgb: number }> {
  const brick = BrickByPrefabName("2x2")!.type;
  const plate = BrickByPrefabName("2x2Plate")!.type;
  const out: Array<{ type: number; ori: number; pos: [number, number, number]; rgb: number }> = [];
  for (let column = 0; out.length < count; column++) {
    const cx = (column % 24) - 12;
    const cz = Math.floor(column / 24) - 12;
    let y = 0;
    for (let k = 0; k < 12 && out.length < count; k++) {
      const isPlate = (column + k) % 3 === 0;
      const h = isPlate ? 32 : 96;
      const rgb = (((column * 37) & 255) << 16) | (((k * 61) & 255) << 8) | ((column * k * 13) & 255);
      out.push({ type: isPlate ? plate : brick, ori: (column + k) % 4, pos: [cx * 160 + 80, y + h / 2, cz * 160 + 80], rgb });
      y += h;
    }
  }
  return out;
}

const game: GameDefinition = {
  slug: "brick-builder",
  behaviours: { BuildArea, BrickLog, BrickSegment, HeldBrick, PickerTile, PickerTab, Swatch, ToolButton, Hammer },
  debug: (instance) => {
    const area = () => instance.behaviour<BuildArea>("area");
    return {
      bricks: () => area().ledger.store.count,
      digest: () => area().ledger.digest(),
      /** What the renderer sent and what the graph reported built. */
      render: () => {
        const r = area().renderer;
        return r ? { built: { ...r.built }, sent: { ...r.sent }, idle: r.idle, chunks: r.chunkCount, counts: r.counts() } : null;
      },
      /** The picker's local state. */
      picker: () => ({ type: area().selectedType, prefab: BRICKS[area().selectedType]?.prefab, color: area().color & 0xffffff, hammer: area().hammerMode, category: area().category, yaw: area().yaw }),
      /** Places the planned build straight onto the lattice (the spike's 2,000 bricks). Returns how many went in. */
      build: (count: number) => {
        let n = 0;
        for (const p of plannedBuild(count)) if (area().Place(p.type, p.ori, p.pos, (0xff << 24) | p.rgb)) n++;
        return n;
      },
      /** Spike option (a): the same build as one object per brick, spawned from per-type templates (no records). */
      spikeObjects: (count: number, colour: boolean) => {
        for (const p of plannedBuild(count)) {
          instance.host.op("bspawn", `@Area/Spike/Templates/${BRICKS[p.type]!.prefab}`, [p.pos[0], p.pos[1], p.pos[2], p.ori, colour ? p.rgb : -1]);
        }
        return count;
      },
      /** Ids and lattice positions of the placed bricks (tests: where to click). */
      placed: () => [...area().ledger.store.bricks.values()].map((b) => ({ id: b.id, type: b.type, prefab: BRICKS[b.type]!.prefab, ori: b.ori, pos: b.pos, color: b.color & 0xffffff })),
      /** One brick straight onto the lattice (the spike's single placements). Returns its id or null. */
      placeOne: (prefab: string, ori: number, x: number, y: number, z: number, rgb: number) => {
        const def = BrickByPrefabName(prefab);
        return def ? area().Place(def.type, ori, [x, y, z], (0xff << 24) | rgb) : null;
      },
      /** A lattice point (u) in the world (tests: where to point). */
      toWorld: (x: number, y: number, z: number) => {
        const w = area().ToWorld([x, y, z], [0, 0, 0, 1]).position;
        return [w.x, w.y, w.z];
      },
      locked: () => area().Protected.Get("locked", false),
    };
  },
};

export default game;
