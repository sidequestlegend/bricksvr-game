// The game's definition: its slug and the classes bindings.json names by `type`. The build reads the default export.

import type { GameDefinition } from "../portkit/src/index.ts";
import { BrickLog } from "./BrickLog.ts";
import { BrickSegment } from "./BrickSegment.ts";
import { BuildArea } from "./BuildArea.ts";
import { HeldBrick } from "./HeldBrick.ts";

const game: GameDefinition = {
  slug: "brick-builder",
  behaviours: { BuildArea, BrickLog, BrickSegment, HeldBrick },
  debug: (instance) => ({
    bricks: () => instance.behaviour<BuildArea>("area").ledger.store.count,
    digest: () => instance.behaviour<BuildArea>("area").ledger.digest(),
  }),
};

export default game;
