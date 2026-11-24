// New (replaces the cloud backend's room store: fetch-bricks, DownloadBricksOnLoad.cs:160-178): one leaf of the
// build area's archive in space state, written only by the referee (the default owner of a behaviour nobody took),
// kept by the room for 24 hours after its last write. A late joiner reads every segment plus the logs of the
// players present, and has every brick.

import { Behaviour } from "../portkit/src/index.ts";
import type { BuildArea } from "./BuildArea.ts";

export class BrickSegment extends Behaviour {
  static override synced = ["a", "r"];

  /** Position in the archive (bindings field). */
  index = 0;
  a: string[] = [];
  r = "";

  override OnDeserialization(): void {
    this.FindBehavioursOfType<BuildArea>("BuildArea")[0]?.SegmentChanged();
  }
}
