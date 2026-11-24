// BuildingBrickSync.cs + BuildingBrickModel.cs (the synced "real" brick: type, colour, uuid, attached), the grab and
// release half of BrickAttachDetector.cs (:78-149), XRDropWhenNotOwned.cs and AutoDespawnPhysicsBricks.cs.
//
// Upstream every brick in a hand or falling is a Normcore object made with Realtime.Instantiate and destroyed when it
// snaps. Here a build area has a fixed pool of grabbable kit objects (`Pool/Held<n>`, transform-synced, BS Grababble);
// one slot is one brick that is held or lying loose. The slot's type and colour are synced; which mesh it shows is the
// child `<prefab>` of the slot switched on (relay op `active` on `@Pool/Held<n>/<prefab>`).
//
// On release the owner asks BuildArea where the brick would snap; if it snaps, the brick becomes a record and the slot
// is free again. If not, the brick lies where physics leaves it and the slot frees itself after 6 s untouched
// (AutoDespawnPhysicsBricks.cs:25-48: "6 s stationary"), or when someone grabs it again.

import { Behaviour, Color, type DeserializationResult, type HandSide, Quaternion, Vector3 } from "../portkit/src/index.ts";
import { BRICKS } from "./BrickData.ts";
import type { BuildArea } from "./BuildArea.ts";

/** AutoDespawnPhysicsBricks: seconds a loose brick waits before it goes back to the pool. */
export const DESPAWN_SECONDS = 6;

export class HeldBrick extends Behaviour {
  static override synced = ["t", "c", "d"];

  /** Slot number (bindings field). */
  index = 0;
  /** Brick type, -1 when the slot is free. */
  t = -1;
  /** ARGB colour (BuildingBrickModel.color). */
  c = 0;
  /** 1 while it lies loose (dropped without snapping). */
  d = 0;

  /** True on the client whose hand holds it. */
  held = false;
  private looseSince = -1;
  private shown = -1;
  private shownColor = -1;
  /** The hand this client attached it to (AttachToHand), or -1. */
  private attachedSide = -1;

  private get area(): BuildArea {
    return this.FindBehavioursOfType<BuildArea>("BuildArea")[0]!;
  }

  get free(): boolean {
    return this.t < 0;
  }

  /** BrickPickerBrick.Interact / HandBrickSpawner.HandleButtonPress: this slot becomes a new brick at a pose. */
  Claim(type: number, color: number, position: Vector3, rotation: Quaternion): void {
    this.Networking.SetOwner(this.Networking.LocalPlayer, this.gameObject);
    this.t = type;
    this.c = color;
    this.d = 1;
    this.looseSince = this.Time.time;
    this.RequestSerialization();
    this.transform.SetPositionAndRotation(position, rotation);
    this.Show();
  }

  /** Back to the pool. */
  Free(): void {
    if (this.t < 0) return;
    if (!this.Networking.IsOwner(this.gameObject)) this.Networking.SetOwner(this.Networking.LocalPlayer, this.gameObject);
    this.t = -1;
    this.d = 0;
    this.held = false;
    this.looseSince = -1;
    this.RequestSerialization();
    this.Show();
  }

  override OnPickup(): void {
    if (this.t < 0) return;
    this.Networking.SetOwner(this.Networking.LocalPlayer, this.gameObject);
    this.held = true;
    this.d = 0;
    this.looseSince = -1;
    this.RequestSerialization();
  }

  /**
   * The local hand holds it through AttachToHand (BS.AttachedObject: the brick follows the hand, no grab), as upstream
   * puts a brick taken from the build or the picker straight into the gripping hand (XR ForceSelect).
   */
  AttachTo(side: HandSide): void {
    if (this.t < 0) return;
    this.OnPickup();
    this.attachedSide = side;
    this.gameObject.AttachToHand(side as 0 | 1);
  }

  /** The grip that holds an attached brick was let go: it is released where it is (snaps, or lies loose). */
  LetGoOfHand(): void {
    if (this.attachedSide < 0) return;
    this.attachedSide = -1;
    this.gameObject.Detach();
    void this.transform.Refresh().then(() => this.OnDrop());
  }

  /** BrickAttachDetector.BrickReleased. */
  override OnDrop(): void {
    if (!this.held || this.t < 0) return;
    this.held = false;
    this.area.HeldGone();
    const snapped = this.area.Release(this.t, this.c, this.transform.position, this.transform.rotation);
    if (snapped) {
      this.Free();
    } else {
      this.d = 1;
      this.looseSince = this.Time.time;
      this.RequestSerialization();
    }
  }

  override OnDeserialization(result: DeserializationResult): void {
    if (result.isRollback) this.area.SpawnLost(this);
    if (this.d === 1 && this.looseSince < 0) this.looseSince = this.Time.time;
    if (this.d === 0) this.looseSince = -1;
    this.Show();
  }

  override Update(): void {
    if (this.t >= 0 && this.d === 1 && !this.held && this.looseSince >= 0 && this.Time.time - this.looseSince >= DESPAWN_SECONDS && this.Networking.IsOwner(this.gameObject)) {
      this.Free();
    }
    if (this.held && this.t >= 0) this.area.HeldMoved(this);
  }

  /** The slot's object is on while it is a brick, and shows that brick's mesh. */
  private Show(): void {
    const path = this.gameObject.key ? `@Pool/Held${this.index}` : "";
    if (this.t >= 0 && path && (this.shown !== this.t || this.shownColor !== this.c)) {
      const rgb = this.c & 0xffffff;
      this.Host.setColor(`${path}/${BRICKS[this.t]!.prefab}`, "_BaseColor", new Color(((rgb >> 16) & 255) / 255, ((rgb >> 8) & 255) / 255, (rgb & 255) / 255, 1));
      this.shownColor = this.c;
    }
    if (this.shown === this.t) return;
    if (this.shown >= 0 && path) this.Host.setActive(`${path}/${BRICKS[this.shown]!.prefab}`, false);
    if (this.t >= 0 && path) this.Host.setActive(`${path}/${BRICKS[this.t]!.prefab}`, true);
    this.gameObject.SetActive(this.t >= 0);
    this.shown = this.t;
  }
}

