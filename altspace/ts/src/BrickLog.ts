// New (replaces BrickSwapper.SendMessageOverRPC and BrickServerInterface.SendBrick / RemoveBrick, BrickSwapper.cs:
// 180-210, BrickServerInterface.cs:100-191): one player's own log of records, in that player's user state.
//
// Only its player can write it (the room ties user state to its sender), so no write is ever lost to another
// writer and no compare-and-set is needed. It holds only what the archive does not have yet: the referee copies
// records into BrickSegment leaves, and the author then drops them (BuildArea.FlushLog). Everyone reads it.

import { Behaviour } from "../portkit/src/index.ts";
import type { BuildArea } from "./BuildArea.ts";

export class BrickLog extends Behaviour {
  static override perPlayer = true;
  static override synced = ["a", "r"];

  /** Author keys the records point at (index 0 is this log's author). */
  a: string[] = [];
  /** Records (BrickRecords.ts). */
  r = "";

  override OnDeserialization(): void {
    this.FindBehavioursOfType<BuildArea>("BuildArea")[0]?.LogChanged();
  }
}
