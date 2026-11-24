// The kit's controls, each a small behaviour on its own clickable object (the kit builder binds them):
//  - PickerTile: a brick of the picker (BrickPickerBrick.cs: gripping a tile spawns that brick; here a click selects
//    it, and in VR also puts it in the clicking hand);
//  - PickerTab: a category tab (SelectedCategoryManager.cs, a slider upstream);
//  - Swatch: a palette colour (ColorPickerSaveSpot.cs; upstream's spots hold slider colours, here they are presets
//    beside the three HSV sliders);
//  - ToolButton: the desktop hammer mode, rotate, lock (RoomOwnershipSync), save and load on the device;
//  - Hammer: the grabbable hammer (Hammer.cs): its head removes the placed brick it is swung into; on desktop, the
//    trigger while holding it removes the brick under its head.

import { Behaviour, type HostEventDetail, Vector3 } from "../portkit/src/index.ts";
import type { BuildArea } from "./BuildArea.ts";

function areaOf(b: Behaviour): BuildArea | null {
  return b.FindBehavioursOfType<BuildArea>("BuildArea")[0] ?? null;
}

export class PickerTile extends Behaviour {
  /** Brick type number (bindings field). */
  type = 0;

  override Interact(): void {
    areaOf(this)?.TileClicked(this.type);
  }
}

export class PickerTab extends Behaviour {
  index = 0;

  override Interact(): void {
    areaOf(this)?.ShowCategory(this.index);
  }
}

export class Swatch extends Behaviour {
  /** 0xRRGGBB (bindings field). */
  rgb = 0;

  override Interact(): void {
    areaOf(this)?.SetColorRgb(this.rgb);
  }
}

export class ToolButton extends Behaviour {
  /** "hammer", "rotate", "lock", "save" or "load" (bindings field). */
  tool = "";

  override Interact(): void {
    areaOf(this)?.Tool(this.tool);
  }
}

/** Speed (m/s) the hammer's head must move at for a swing to count (Hammer.cs scales its blast by the speed). */
export const HAMMER_SWING_SPEED = 0.6;

export class Hammer extends Behaviour {
  /** The head's centre in the hammer's own space (bindings field, metres). */
  head: Vector3 = new Vector3(0, 0.3, 0);

  held = false;
  private last: Vector3 | null = null;
  private lastTime = 0;

  override OnPickup(): void {
    this.held = true;
    this.last = null;
  }

  override OnDrop(): void {
    this.held = false;
  }

  /** The head in the world. */
  HeadPosition(): Vector3 {
    return this.transform.position.add(this.transform.rotation.rotate(this.head));
  }

  override Update(): void {
    if (!this.held) return;
    const p = this.HeadPosition();
    const now = this.Time.time;
    if (this.last && now > this.lastTime) {
      const speed = p.sub(this.last).magnitude / (now - this.lastTime);
      if (speed >= HAMMER_SWING_SPEED) areaOf(this)?.HammerAt(p);
    }
    this.last = p;
    this.lastTime = now;
  }

  /** The trigger of the hand holding it (bindings: heldTrigger): the brick under the head goes, swung or not. */
  Smash(_detail?: HostEventDetail): void {
    void this.transform.Refresh().then(() => areaOf(this)?.HammerAt(this.HeadPosition(), 60));
  }
}
