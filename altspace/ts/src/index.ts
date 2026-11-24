// The game's definition: its slug and the classes bindings.json names by `type`. The build reads the default export.

import { Button, type GameDefinition } from "../portkit/src/index.ts";
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
  // A build stays in room state (24 h) when everybody has left: the next visitor sees it (PORT.md C6). The runtime's
  // default, "reset", starts an empty room's instance afresh, as a VRChat instance would.
  options: { whenEmpty: "keep" },
  behaviours: { BuildArea, BrickLog, BrickSegment, HeldBrick, PickerTile, PickerTab, Swatch, ToolButton, Hammer },
  debug: (instance) => {
    const area = () => instance.behaviour<BuildArea>("area");
    return {
      bricks: () => area().ledger.store.count,
      /** The placed bricks' digest (BrickLedger: equal on clients that show the same bricks). */
      bricksDigest: () => area().ledger.digest(),
      me: () => area().Networking.LocalPlayer.sid,
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
      /** Empties the area (range tombstones, as loading a save does): a test's clean start. */
      clear: () => area().Clear(),
      lastClick: () => area().lastSurfaceClick,
      canWrite: () => area().Protected.CanWrite,
      /** A held brick from the pool at a lattice point (tests: something to grab). Returns its slot index or -1. */
      spawn: (prefab: string, x: number, y: number, z: number) => {
        const def = BrickByPrefabName(prefab);
        if (!def) return -1;
        const w = area().ToWorld([x, y, z], [0, 0, 0, 1]);
        const slot = area().Spawn(def.type, area().color, w.position, w.rotation);
        return slot ? slot.index : -1;
      },
      /** AttachToHand on a pool slot (tests: does it follow the hand in Play mode), and let go again. */
      attach: (index: number, side: number) => {
        const slot = area().FindBehavioursOfType<HeldBrick>("HeldBrick").find((h) => h.index === index);
        if (slot) area().IntoHand(slot, side as 0 | 1);
        return !!slot;
      },
      letGo: (side: number) => area().OnButtonReleased(Button.Grip, side as 0 | 1),
      /** The archive's segment size in bytes (tests: a small archive fills quickly); returns the one before. */
      capacity: (bytes: number) => {
        const before = area().segmentCapacity;
        if (bytes > 0) area().segmentCapacity = bytes;
        return before;
      },
      /** Removes placed bricks by id (tests). Returns how many went. */
      remove: (ids: string[]) => area().Delete(ids),
      slot: (index: number) => {
        const h = area().FindBehavioursOfType<HeldBrick>("HeldBrick").find((x) => x.index === index);
        return h ? { t: h.t, c: h.c & 0xffffff, d: h.d, held: h.held } : null;
      },
    };
  },
};

export default game;
