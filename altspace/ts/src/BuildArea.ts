// One build area: the placed bricks, who may build, and every action on them. It stands where upstream's scene
// singletons stand: BrickStore (via BrickLedger), BrickSwapper (place = SwapToFakeBrick, pick up = SwapToRealBrick,
// BrickSwapper.cs:5-89), DownloadBricksOnLoad (late join), RoomOwnershipSync (lock, :147-158), Hammer (:20-49),
// HandBrickSpawner (:53-130), the QuickInteractor grip on a placed brick (InteractablePlacedBrick.cs:7-12), and the
// cloud backend's save, which becomes room state (24 h) plus a save on the device.
//
// State (see PORT.md 3): each player's records in their own BrickLog (user state), the archive in BrickSegment
// leaves (space state, referee-written), the lock in protected state. This behaviour itself syncs nothing.

import { type AudioClipRef, type AudioSourceRef, Behaviour, Button, type ButtonName, Color, type GameObject, type HandSide, type HostEventDetail, Quaternion, type TextRef, Vector3 } from "../portkit/src/index.ts";
import { CheckIfCanConnect, type HeldPose, heldBoxesAt, type Snap } from "./BrickAttachDetector.ts";
import { BRICKS, BricksForCategory, CATEGORIES } from "./BrickData.ts";
import { BrickLedger } from "./BrickLedger.ts";
import type { BrickLog } from "./BrickLog.ts";
import { type BrickRecord, decode, encode, MAX_SEQ, type Packed, PLACE_CHARS, placeable, type PlaceRecord, recordId, seqOf, TOMB_CHARS } from "./BrickRecords.ts";
import type { BrickSegment } from "./BrickSegment.ts";
import { BrickRenderer } from "./BrickRenderer.ts";
import { type RenderChunk, renderChunk } from "./ChunkedRenderer.ts";
import { argbOf, rgbOf } from "./ColorInt.ts";
import type { HeldBrick } from "./HeldBrick.ts";
import { MESH_M_PER_U, ORIS, type Q, qinv, qmul, qrot, U_PER_PLATE, U_PER_STUD, type V3 } from "./Lattice.ts";

/** JSON bytes a log may hold before new records wait for the archive (a user-state leaf takes 16,384). */
export const LOG_CAPACITY = 12000;
/** JSON bytes per archive segment (a space-state leaf takes 16,384 with the runtime's envelope). */
export const SEGMENT_CAPACITY = 14500;
/** How often the referee archives. */
export const ARCHIVE_SECONDS = 1;
/** HandBrickSpawner: a button held this long over a brick "sets" it (30 frames upstream, about 0.4 s). */
export const SPAWNER_HOLD_SECONDS = 0.4;
/** Hammer.cs:30: the blast radius never goes below 3 world units: 3 / 7e-4 u. */
export const HAMMER_MIN_RADIUS = 3 / 7e-4;

export interface SavedBuild {
  v: 1;
  /** Packed place records (author "save", seq = order). */
  b: Packed;
}

interface SpawnerSlot {
  downAt: number;
  saved: { type: number; color: number } | null;
}

export class BuildArea extends Behaviour {
  ledger!: BrickLedger;
  /** Mesh metres -> metres in the world (upstream shows meshes at 7x). */
  scale = 7;
  /** Upstream's "super ultra performance mode" (UserSettings.SuperUltraPerformanceMode), per client. */
  performanceMode = false;
  /** The ghost the held brick would snap to (ShowSnappableBrickPositions.cs), local only. */
  ghost: Snap | null = null;
  /** The type of the brick the ghost is for. */
  ghostType = -1;

  readonly stats = { placed: 0, deleted: 0, refused: 0, archiveWrites: 0, logWrites: 0, repacks: 0, rebuildRecords: 0 };

  // ---- kit objects (bindings fields; null in a bench without a kit) ----
  /** The ghost: one child per brick prefab (Complete mesh, see-through), shown where a held brick would snap. */
  ghostObject: GameObject | null = null;
  /** The area's sound source and its clips (Assets/Kit/Sounds, CC0, replacing upstream's lost Resources/Sounds). */
  audio: AudioSourceRef | null = null;
  snapClips: AudioClipRef[] = [];
  carpetClips: AudioClipRef[] = [];
  clickClip: AudioClipRef | null = null;
  spawnClip: AudioClipRef | null = null;
  successClip: AudioClipRef | null = null;
  /** The picker's status line. */
  status: TextRef | null = null;

  // ---- the local player's picker (upstream BrickPickerManager: per player, nothing synced) ----
  /** The brick type the picker has selected (desktop: what a click on the build places). */
  selectedType = 0;
  /** ARGB colour of the picker (BrickPickerManager's HSV sliders and save spots). */
  color = argbOf(0xc91a09);
  /** Quarter turns about Y for what a click places (desktop). */
  yaw = 0;
  /** Desktop hammer: while on, a click on a placed brick removes it (the VR hammer is the grabbable one). */
  hammerMode = false;
  category = 0;
  readonly hsv = { h: 0, s: 0.95, v: 0.79 };

  renderer: BrickRenderer | null = null;
  private shownGhost = -1;
  private statusText = "";
  /** Slots this player holds through AttachToHand (VR: a brick put straight into the hand), by hand side. */
  private readonly attached = new Map<number, HeldBrick>();

  private areaPos = Vector3.zero;
  private areaRot = Quaternion.identity;
  private segments: BrickSegment[] = [];
  private segSeen: string[] = [];
  private readonly logSeen = new Map<BrickLog, string>();
  private readonly logIds = new Map<string, Set<string>>();
  private myLog: BrickRecord[] = [];
  private queue: BrickRecord[] = [];
  private nextSeq = 0;
  private lastArchive = -1;
  private started = false;
  private readonly spawners = new Map<string, SpawnerSlot>();

  // ---- start ------------------------------------------------------------------------------------------------------

  override Start(): void {
    const num = (name: string, fallback: number) => {
      const v = Number(this.Settings.get(name));
      return Number.isFinite(v) && v > 0 ? v : fallback;
    };
    const width = Math.min(800, Math.round(num("width", 64)));
    const depth = Math.min(800, Math.round(num("depth", 64)));
    const height = Math.min(1000, Math.round(num("height", 480)));
    // The snippet's `scale` attribute scales the holder (portkit: position / rotation / scale), so it multiplies the
    // kit's own size: the kit is built at upstream's size (meshes at 7x, a stud 5.6 cm).
    this.scale = 7 * num("scale", 1);
    this.performanceMode = this.Settings.get("performance") === "true";
    this.ledger = new BrickLedger({ halfX: (width * U_PER_STUD) / 2, halfZ: (depth * U_PER_STUD) / 2, height: height * U_PER_PLATE });
    this.segments = this.FindBehavioursOfType<BrickSegment>("BrickSegment").sort((a, b) => a.index - b.index);
    void this.transform.Refresh().then(() => {
      this.areaPos = this.transform.position;
      this.areaRot = this.transform.rotation;
    });
    this.Poll(true);
    const mine = this.myLogBehaviour();
    if (mine) this.myLog = decode({ a: mine.a, r: mine.r }).filter((r) => r.author === this.author);
    this.renderer = new BrickRenderer(this.Host);
    this.RegisterGraphEvent("chunk", "ChunkBuilt");
    const k = (7 * 80 * 1e-4);
    this.Host.scale("@Area/Carpet", new Vector3(width * k, 0.02, depth * k));
    this.selectedType = BricksForCategory(CATEGORIES[0]!)[0]?.type ?? 0;
    this.ShowCategory(0);
    this.ShowColor();
    this.started = true;
    this.UpdateStatus();
  }

  /** The relay graph built a chunk: "<chunk name>|<ms merging>|<records>|<ms cooking its collider>". */
  ChunkBuilt(name: string, ms: string, records: string, colliderMs?: string): void {
    this.renderer?.reported(name, Number(ms), Number(records), this.Time.time, Number(colliderMs ?? 0));
  }

  get author(): string {
    const me = this.Networking.LocalPlayer;
    return `${me.uid}~${me.sid}`;
  }

  /** RoomOwnershipSync.IsUserAllowedToMakeChanges: unlocked, or the local player may write protected state. */
  CanBuild(): boolean {
    return !this.Protected.Get("locked", false) || this.Protected.CanWrite;
  }

  /** RoomOwnershipSync lock toggle: only the space's owner and moderators can (the room refuses anyone else). */
  SetLocked(locked: boolean): void {
    this.Protected.Set("locked", locked);
  }

  // ---- reading the room -------------------------------------------------------------------------------------------

  LogChanged(): void {
    if (this.started) this.Poll(false);
  }

  SegmentChanged(): void {
    if (this.started) this.Poll(false);
  }

  /** Takes in whatever changed in the archive and in the logs of the players present. */
  private Poll(bulk: boolean): void {
    let segChanged = bulk;
    for (let i = 0; i < this.segments.length; i++) if (this.segments[i]!.r !== this.segSeen[i]) segChanged = true;
    if (segChanged) {
      this.segSeen = this.segments.map((s) => s.r);
      const decoded = this.segments.map((s) => decode({ a: s.a, r: s.r }));
      this.stats.rebuildRecords += decoded.reduce((n, s) => n + s.length, 0);
      this.ledger.setArchive(decoded, bulk);
    }
    const present = new Set<string>();
    const fresh: BrickRecord[] = [];
    for (const log of this.PlayerBehaviours<BrickLog>("BrickLog")) {
      const p = log.Player;
      if (!p) continue;
      const author = `${p.uid}~${p.sid}`;
      present.add(author);
      if (this.logSeen.get(log) === log.r) continue;
      this.logSeen.set(log, log.r);
      const recs = decode({ a: log.a, r: log.r });
      this.logIds.set(author, new Set(recs.map(recordId)));
      fresh.push(...recs);
    }
    for (const log of [...this.logSeen.keys()]) if (!log.Player || !present.has(`${log.Player.uid}~${log.Player.sid}`)) this.logSeen.delete(log);
    for (const author of [...this.logIds.keys()]) if (!present.has(author)) this.logIds.delete(author);
    if (fresh.length) this.ledger.ingest(fresh, bulk);
  }

  override Update(): void {
    if (!this.started) return;
    this.Poll(false);
    this.renderer?.update(this.RenderChunks());
    this.ShowGhost();
    this.UpdateStatus();
    if (this.Networking.IsReferee && (this.lastArchive < 0 || this.Time.time - this.lastArchive >= ARCHIVE_SECONDS)) {
      this.lastArchive = this.Time.time;
      this.Archive();
    }
    this.FlushLog();
  }

  // ---- the referee: archive ---------------------------------------------------------------------------------------

  /** Copies every record not archived yet into the segments (and collects dead bricks when it pays). */
  Archive(): void {
    const presentAuthors = new Set(this.Networking.GetPlayers().map((p) => `${p.uid}~${p.sid}`));
    const inLogs = new Set<string>();
    for (const ids of this.logIds.values()) for (const id of ids) inLogs.add(id);
    for (const r of this.myLog) inLogs.add(recordId(r));
    for (const r of this.queue) inLogs.add(recordId(r));
    const current = this.segments.map((s) => ({ a: s.a, r: s.r }));
    const plan = this.ledger.planArchive(current, { capacity: SEGMENT_CAPACITY, presentAuthors, inLogs });
    if (!plan) return;
    for (const i of plan.changed) {
      const seg = this.segments[i]!;
      if (!this.Networking.IsOwner(seg.gameObject)) this.Networking.SetOwner(this.Networking.LocalPlayer, seg.gameObject);
      seg.a = plan.segments[i]!.a;
      seg.r = plan.segments[i]!.r;
      seg.RequestSerialization();
    }
    if (plan.repacked) this.stats.repacks++;
    this.stats.archiveWrites += plan.changed.length;
    this.segSeen = this.segments.map((s) => s.r);
    this.ledger.setArchive(plan.segments.map((p) => decode(p)));
  }

  // ---- the author: own log ----------------------------------------------------------------------------------------

  private myLogBehaviour(): BrickLog | null {
    return this.PlayerBehaviour<BrickLog>(this.Networking.LocalPlayer, "BrickLog");
  }

  /** Records not archived yet: waiting for room in the log, or in it. */
  get pending(): number {
    return this.queue.length + this.myLog.length;
  }

  /** Drops what the archive holds from the log, moves queued records in while they fit, and writes it if it changed. */
  FlushLog(): void {
    const archived = this.ledger.archived;
    const before = this.myLog.length;
    this.myLog = this.myLog.filter((r) => !archived.has(recordId(r)));
    this.queue = this.queue.filter((r) => !archived.has(recordId(r)));
    let changed = this.myLog.length !== before;
    // Room for four author keys of up to 80 bytes besides the records.
    let bytes = 15 + 4 * 80 + this.myLog.reduce((n, r) => n + (r.kind === "P" ? PLACE_CHARS : TOMB_CHARS), 0);
    while (this.queue.length) {
      const r = this.queue[0]!;
      const size = r.kind === "P" ? PLACE_CHARS : TOMB_CHARS + 80;
      if (bytes + size > LOG_CAPACITY) break;
      bytes += size;
      this.myLog.push(this.queue.shift()!);
      changed = true;
    }
    if (!changed) return;
    const log = this.myLogBehaviour();
    if (!log) return;
    // Every record here is this author's own, so encode() gives this author index 0.
    const packed = encode(this.myLog);
    log.a = packed.a;
    log.r = packed.r;
    this.logSeen.set(log, log.r);
    this.logIds.set(this.author, new Set(this.myLog.map(recordId)));
    log.RequestSerialization();
    this.stats.logWrites++;
  }

  private nextRecordSeq(): number {
    if (this.nextSeq === 0) this.nextSeq = this.ledger.lastSeq(this.author) + 1;
    if (this.nextSeq > MAX_SEQ) throw new Error("this session has written 16 million records");
    return this.nextSeq++;
  }

  private publish(recs: BrickRecord[]): void {
    this.ledger.ingest(recs);
    this.queue.push(...recs);
  }

  // ---- actions ----------------------------------------------------------------------------------------------------

  /** A brick straight onto the lattice (loading a save, tests, a future click-to-place). Null when refused. */
  Place(type: number, ori: number, pos: V3, color: number, check = true): string | null {
    if (!this.CanBuild() || !BRICKS[type] || !placeable(type, ori, pos)) {
      this.stats.refused++;
      return null;
    }
    if (check) {
      const boxes = heldBoxesAt(type, pos, ori);
      if (!this.ledger.store.inside(boxes) || this.ledger.store.collides(boxes)) {
        this.stats.refused++;
        return null;
      }
    }
    const rec: PlaceRecord = { kind: "P", author: this.author, seq: this.nextRecordSeq(), type, ori, pos: [pos[0], pos[1], pos[2]], rgb: rgbOf(color) };
    this.publish([rec]);
    this.stats.placed++;
    return recordId(rec);
  }

  /** A held brick let go at a pose in the build area's space: snap and place it, as BrickAttachDetector.BrickReleased. */
  ReleaseLocal(held: HeldPose, color: number): Snap | null {
    const snap = CheckIfCanConnect(this.ledger.store, held, this.CanBuild());
    if (!snap) return null;
    if (!this.Place(held.type, snap.ori, snap.pos, color, false)) return null;
    this.PlacedSound(snap.pos[1] + BRICKS[held.type]!.bottomPlates * U_PER_PLATE <= 1);
    return snap;
  }

  /** The same from a world pose (HeldBrick.OnDrop). */
  Release(type: number, color: number, position: Vector3, rotation: Quaternion): Snap | null {
    return this.ReleaseLocal(this.ToLocal(type, position, rotation), color);
  }

  /** Where the brick in the hand would go (the ghost), recomputed while it is held. */
  /** Nothing is held here any more: no ghost. */
  HeldGone(): void {
    this.ghost = null;
  }

  HeldMoved(slot: HeldBrick): void {
    this.ghostType = slot.t;
    this.ghost = CheckIfCanConnect(this.ledger.store, this.ToLocal(slot.t, slot.transform.position, slot.transform.rotation), this.CanBuild());
  }

  /** Removes placed bricks (anyone may, unless the area is locked). Returns how many went. */
  Delete(ids: readonly string[]): number {
    if (!this.CanBuild()) return 0;
    const recs: BrickRecord[] = [];
    for (const id of ids) {
      if (!this.ledger.store.bricks.has(id)) continue;
      const seq = seqOf(id);
      recs.push({ kind: "T", author: this.author, seq: this.nextRecordSeq(), target: id.slice(0, id.lastIndexOf("#")), from: seq, to: seq });
    }
    this.publish(recs);
    this.stats.deleted += recs.length;
    return recs.length;
  }

  /** Empties the area: one range tombstone per author (new; upstream had no such button). */
  Clear(): number {
    if (!this.CanBuild()) return 0;
    const ranges = new Map<string, [number, number]>();
    for (const id of this.ledger.store.bricks.keys()) {
      const author = id.slice(0, id.lastIndexOf("#"));
      const seq = seqOf(id);
      const r = ranges.get(author);
      if (!r) ranges.set(author, [seq, seq]);
      else {
        r[0] = Math.min(r[0], seq);
        r[1] = Math.max(r[1], seq);
      }
    }
    const count = this.ledger.store.count;
    const recs: BrickRecord[] = [...ranges].map(([target, [from, to]]) => ({ kind: "T", author: this.author, seq: this.nextRecordSeq(), target, from, to }));
    this.publish(recs);
    this.stats.deleted += count;
    return count;
  }

  /** Hammer.OnCollisionEnter: every placed brick within the radius of a point (area space, u) goes. */
  Hammer(center: V3, radius: number): number {
    const r = Math.max(radius, 0);
    const hits = this.ledger.store
      .near([center[0] - r, center[1] - r, center[2] - r], [center[0] + r, center[1] + r, center[2] + r])
      .filter((b) => Math.hypot(b.pos[0] - center[0], b.pos[1] - center[1], b.pos[2] - center[2]) <= r)
      .map((b) => b.id);
    return this.Delete(hits);
  }

  /** The placed brick a point is in (a hand reaching into it), nearest centre first; null if none. */
  BrickAt(point: V3, margin = 20): string | null {
    let best: string | null = null;
    let bestD = Infinity;
    for (const b of this.ledger.store.near([point[0] - margin, point[1] - margin, point[2] - margin], [point[0] + margin, point[1] + margin, point[2] + margin])) {
      const d = Math.hypot(b.pos[0] - point[0], b.pos[1] - point[1], b.pos[2] - point[2]);
      if (d < bestD) {
        bestD = d;
        best = b.id;
      }
    }
    return best;
  }

  /** BrickSwapper.SwapToRealBrick: a placed brick becomes a held one where it was. Returns the slot, or null. */
  PickUp(id: string): HeldBrick | null {
    const b = this.ledger.store.bricks.get(id);
    if (!b || !this.CanBuild()) return null;
    if (!this.Delete([id])) return null;
    const { position, rotation } = this.ToWorld(b.pos, ORIS[b.ori]!.q);
    return this.Spawn(b.type, b.color, position, rotation);
  }

  /** A new brick in a free pool slot (BrickPickerBrick.Interact, HandBrickSpawner.HandleButtonPress). */
  Spawn(type: number, color: number, position: Vector3, rotation: Quaternion): HeldBrick | null {
    const slots = this.FindBehavioursOfType<HeldBrick>("HeldBrick").sort((a, b) => a.index - b.index);
    if (!slots.length || !BRICKS[type]) return null;
    let h = 0;
    for (let i = 0; i < this.author.length; i++) h = (h * 31 + this.author.charCodeAt(i)) >>> 0;
    for (let k = 0; k < slots.length; k++) {
      const slot = slots[(h + k) % slots.length]!;
      if (slot.free) {
        slot.Claim(type, color, position, rotation);
        return slot;
      }
    }
    return null;
  }

  /** Another client claimed the same slot in the same moment and won: that brick is gone (logged). */
  SpawnLost(slot: HeldBrick): void {
    this.Debug.LogWarning(`pool slot ${slot.index} was taken by another player`);
  }

  // ---- input: grip a placed brick, the hand spawner -------------------------------------------------------------

  override OnButtonPressed(button: ButtonName, side: HandSide): void {
    const hand = this.HandLocal(side);
    if (!hand) return;
    if (button === Button.Grip) {
      const id = this.BrickAt(hand);
      const slot = id ? this.PickUp(id) : null;
      // XR ForceSelect upstream (BrickSwapper.SwapToRealBrick): the brick goes straight into the gripping hand
      if (slot) this.IntoHand(slot, side);
      return;
    }
    if (button === Button.Primary || button === Button.Secondary) this.spawner(button, side).downAt = this.Time.time;
  }

  override OnButtonReleased(button: ButtonName, side: HandSide): void {
    if (button === Button.Grip) {
      const slot = this.attached.get(side);
      if (slot) {
        this.attached.delete(side);
        slot.LetGoOfHand();
      }
      return;
    }
    if (button !== Button.Primary && button !== Button.Secondary) return;
    const slot = this.spawner(button, side);
    if (slot.downAt < 0) return;
    const held = this.Time.time - slot.downAt;
    slot.downAt = -1;
    const hand = this.HandLocal(side);
    const poses = this.Input.Poses;
    if (!hand || !poses) return;
    if (held >= SPAWNER_HOLD_SECONDS) {
      // "Set" the spawner from the brick the hand is in (HandleButtonHold).
      const id = this.BrickAt(hand);
      const b = id ? this.ledger.store.bricks.get(id) : null;
      if (b) {
        slot.saved = { type: b.type, color: b.color };
        this.Input.Haptic(side, 0.5, 0.1);
      }
    } else if (slot.saved) {
      const pose = side === 0 ? poses.leftHand : poses.rightHand;
      const def = BRICKS[slot.saved.type]!;
      const rot = pose.rotation.mul(Quaternion.Euler(def.spawnEuler[0], def.spawnEuler[1], def.spawnEuler[2]));
      this.Spawn(slot.saved.type, slot.saved.color, pose.position, rot);
    }
  }

  private spawner(button: ButtonName, side: HandSide): SpawnerSlot {
    const key = `${side}/${button}`;
    let s = this.spawners.get(key);
    if (!s) this.spawners.set(key, (s = { downAt: -1, saved: null }));
    return s;
  }

  private HandLocal(side: HandSide): V3 | null {
    const poses = this.Input.Poses;
    if (!poses) return null;
    const p = side === 0 ? poses.leftHand.position : poses.rightHand.position;
    return this.ToLocal(0, p, Quaternion.identity).pos;
  }

  // ---- space ------------------------------------------------------------------------------------------------------

  /** World pose -> area space (u). */
  ToLocal(type: number, position: Vector3, rotation: Quaternion): HeldPose {
    const inv = qinv([this.areaRot.x, this.areaRot.y, this.areaRot.z, this.areaRot.w]);
    const d = qrot(inv, [position.x - this.areaPos.x, position.y - this.areaPos.y, position.z - this.areaPos.z]);
    const k = 1 / (this.scale * MESH_M_PER_U);
    const q = qmul(inv, [rotation.x, rotation.y, rotation.z, rotation.w]);
    return { type, pos: [d[0] * k, d[1] * k, d[2] * k], q };
  }

  /** Area space (u) -> world pose. */
  ToWorld(pos: V3, q: Q): { position: Vector3; rotation: Quaternion } {
    const ar: Q = [this.areaRot.x, this.areaRot.y, this.areaRot.z, this.areaRot.w];
    const k = this.scale * MESH_M_PER_U;
    const w = qrot(ar, [pos[0] * k, pos[1] * k, pos[2] * k]);
    const r = qmul(ar, q);
    return { position: new Vector3(w[0] + this.areaPos.x, w[1] + this.areaPos.y, w[2] + this.areaPos.z), rotation: new Quaternion(r[0], r[1], r[2], r[3]) };
  }

  // ---- the renderer -----------------------------------------------------------------------------------------------

  /** Chunks to re-mesh since the last call (ChunkedRenderer.ts). An empty chunk means: remove its mesh. */
  RenderChunks(): RenderChunk[] {
    return this.ledger.store.takeDirtyChunks().map((key) => renderChunk(key, this.ledger.store.inChunk(key), this.performanceMode));
  }

  // ---- the picker, the palette, the tools (BrickPickerManager, ColorPickerSaveSpot, Hammer, RoomOwnershipSync) ------

  /** A picker tile was clicked: select that brick; in VR it also comes to the hand (BrickPickerBrick.Interact). */
  TileClicked(type: number): void {
    if (!BRICKS[type]) return;
    this.selectedType = type;
    this.Play(this.clickClip);
    const side = this.Input.LastClickSide;
    const poses = this.Input.Poses;
    if (this.Input.IsVR && side !== null && poses) {
      const pose = side === 0 ? poses.leftHand : poses.rightHand;
      const def = BRICKS[type]!;
      const slot = this.Spawn(type, this.color, pose.position, pose.rotation.mul(Quaternion.Euler(def.spawnEuler[0], def.spawnEuler[1], def.spawnEuler[2])));
      if (slot) {
        this.Play(this.spawnClip);
        this.IntoHand(slot, side);
      }
    }
    this.UpdateStatus();
  }

  /** A category tab (SelectedCategoryManager): one group of tiles is shown. */
  ShowCategory(index: number): void {
    if (index < 0 || index >= CATEGORIES.length) return;
    this.category = index;
    for (let k = 0; k < CATEGORIES.length; k++) {
      this.Host.setActive(`@Picker/Cat${k}`, k === index);
      this.Host.setActive(`@Picker/Tabs/Tab${k}/Marker`, k === index);
    }
  }

  /** A palette swatch (upstream's colour save spots): the picker's colour. */
  SetColorRgb(rgb: number): void {
    this.color = argbOf(rgb & 0xffffff);
    const hsv = Color.RGBToHSV(this.rgbColor(rgb));
    this.hsv.h = hsv[0];
    this.hsv.s = hsv[1];
    this.hsv.v = hsv[2];
    this.Play(this.clickClip);
    this.ShowColor();
  }

  /** BrickPickerManager's HSV sliders: one of them moved (0 hue, 1 saturation, 2 value). */
  SetHsv(which: number, value: number): void {
    const v = Math.min(1, Math.max(0, value));
    if (which === 0) this.hsv.h = v;
    else if (which === 1) this.hsv.s = v;
    else this.hsv.v = v;
    const c = Color.HSVToRGB(this.hsv.h, this.hsv.s, this.hsv.v, false);
    this.color = argbOf((Math.round(c.r * 255) << 16) | (Math.round(c.g * 255) << 8) | Math.round(c.b * 255));
    this.ShowColor(false);
  }

  private rgbColor(rgb: number): Color {
    return new Color(((rgb >> 16) & 255) / 255, ((rgb >> 8) & 255) / 255, (rgb & 255) / 255, 1);
  }

  /** The preview swatch and every picker tile show the colour (BrickPickerManager.UpdateBrickColors). */
  private ShowColor(sliders = true): void {
    const c = this.rgbColor(this.color);
    this.Host.op("tint", "@Picker/Preview", [c.r.toFixed(4), c.g.toFixed(4), c.b.toFixed(4)], "tint");
    if (sliders) {
      this.Host.uiSetSlider("@Picker/Sliders/Hue", this.hsv.h);
      this.Host.uiSetSlider("@Picker/Sliders/Saturation", this.hsv.s);
      this.Host.uiSetSlider("@Picker/Sliders/Value", this.hsv.v);
    }
  }

  HueChanged(value: number): void {
    this.SetHsv(0, value);
  }
  SaturationChanged(value: number): void {
    this.SetHsv(1, value);
  }
  ValueChanged(value: number): void {
    this.SetHsv(2, value);
  }

  /** A tool button: "hammer" (desktop hammer mode), "rotate", "lock", "save", "load". */
  Tool(name: string): void {
    this.Play(this.clickClip);
    if (name === "hammer") this.hammerMode = !this.hammerMode;
    else if (name === "rotate") this.yaw = (this.yaw + 1) % 4;
    else if (name === "lock" && this.Protected.CanWrite) this.SetLocked(!this.Protected.Get("locked", false));
    else if (name === "save") this.Save();
    else if (name === "load" && this.Load() >= 0) this.Play(this.successClip);
    this.Host.setActive("@Tools/HammerButton/On", this.hammerMode);
    this.UpdateStatus();
  }

  /**
   * A click on the carpet or on the build (desktop, or a VR laser): with the hammer on, the placed brick clicked goes;
   * else the selected brick goes on the face clicked, snapped as a brick let go just above it would be.
   */
  SurfaceClicked(detail: HostEventDetail): void {
    if (!detail || !detail.point) return;
    const p = this.ToLocal(0, detail.point, Quaternion.identity).pos;
    const nWorld = detail.normal ?? Vector3.up;
    const inv = qinv([this.areaRot.x, this.areaRot.y, this.areaRot.z, this.areaRot.w]);
    const n = qrot(inv, [nWorld.x, nWorld.y, nWorld.z]);
    if (this.hammerMode) {
      const id = this.BrickAt([p[0] - n[0] * 12, p[1] - n[1] * 12, p[2] - n[2] * 12], 12);
      if (id && this.Delete([id])) this.Play(this.carpetClips[0] ?? null);
      return;
    }
    if (n[1] < 0.5) return;
    this.PlaceAt(this.selectedType, p, this.yaw, this.color);
  }

  /** A brick on a horizontal face at `p` (u): tried at the half-stud alignments nearest the point. */
  PlaceAt(type: number, p: V3, yaw: number, color: number): Snap | null {
    const def = BRICKS[type];
    if (!def) return null;
    const rootY = p[1] - def.bottomPlates * U_PER_PLATE + 4;
    const q = ORIS[yaw & 3]!.q;
    const half = U_PER_STUD / 2;
    const bx = Math.round(p[0] / half) * half;
    const bz = Math.round(p[2] / half) * half;
    const tries: V3[] = [];
    for (const dx of [0, half, -half]) for (const dz of [0, half, -half]) tries.push([bx + dx, rootY, bz + dz]);
    tries.sort((a, b) => Math.hypot(a[0] - p[0], a[2] - p[2]) - Math.hypot(b[0] - p[0], b[2] - p[2]));
    for (const pos of tries) {
      const snap = this.ReleaseLocal({ type, pos, q }, color);
      if (snap) return snap;
    }
    return null;
  }

  /** The grabbable hammer's head hit the build (Hammer.OnCollisionEnter): the brick it is in goes. */
  HammerAt(world: Vector3, radiusU = 30): number {
    const p = this.ToLocal(0, world, Quaternion.identity).pos;
    const id = this.BrickAt(p, radiusU);
    if (!id) return 0;
    const n = this.Delete([id]);
    if (n) this.Play(this.carpetClips[1] ?? null);
    return n;
  }

  /** AttachToHand: the slot follows the hand until the grip is let go (XR's ForceSelect upstream). */
  IntoHand(slot: HeldBrick, side: HandSide): void {
    this.attached.set(side, slot);
    slot.AttachTo(side);
  }

  private Play(clip: AudioClipRef | null): void {
    if (clip && this.audio) this.audio.PlayOneShot(clip);
  }

  /** A placement made by this player: upstream's snap sound (PlacedBrickCreator.cs:323-335), carpet or brick. */
  PlacedSound(onFloor: boolean): void {
    const list = onFloor ? this.carpetClips : this.snapClips;
    if (list.length) this.Play(list[Math.floor(this.Random.value * list.length) % list.length]!);
  }

  /** The ghost (ShowSnappableBrickPositions): where the held brick would snap, drawn see-through. */
  private ShowGhost(): void {
    const g = this.ghost;
    const want = g && this.ghostObject && BRICKS[this.ghostType] ? this.ghostType : -1;
    if (want !== this.shownGhost) {
      if (this.shownGhost >= 0) this.Host.setActive(`@Ghost/${BRICKS[this.shownGhost]!.prefab}`, false);
      if (want >= 0) this.Host.setActive(`@Ghost/${BRICKS[want]!.prefab}`, true);
      this.shownGhost = want;
    }
    if (g && want >= 0 && this.ghostObject) {
      const { position, rotation } = this.ToWorld(g.pos, ORIS[g.ori]!.q);
      this.ghostObject.transform.SetPositionAndRotation(position, rotation);
    }
  }

  private UpdateStatus(): void {
    if (!this.status) return;
    const def = BRICKS[this.selectedType];
    const locked = this.Protected.Get("locked", false);
    const text =
      `${def ? def.display : ""}   ${this.ledger ? this.ledger.store.count : 0} bricks` +
      (this.hammerMode ? "   HAMMER" : "") +
      (locked ? (this.Protected.CanWrite ? "   locked (you may build)" : "   locked by the owner") : "");
    if (text !== this.statusText) {
      this.statusText = text;
      this.status.text = text;
    }
  }

  // ---- saving on the device ---------------------------------------------------------------------------------------

  /** The area's bricks, on this device (localStorage, per world, area and player). Returns the count, -1 on failure. */
  Save(name = "default"): number {
    const bricks = [...this.ledger.store.bricks.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const recs: PlaceRecord[] = bricks.map((b, i) => ({ kind: "P", author: "save", seq: i + 1, type: b.type, ori: b.ori, pos: b.pos, rgb: rgbOf(b.color) }));
    const saved: SavedBuild = { v: 1, b: encode(recs) };
    if (!this.Storage.set(`save.${name}`, saved)) return -1;
    const names = this.SaveNames();
    if (names.indexOf(name) < 0) this.Storage.set("saves", [...names, name]);
    return recs.length;
  }

  SaveNames(): string[] {
    return this.Storage.get<string[]>("saves", []);
  }

  /** Puts a saved build back: by default empties the area first. Returns how many bricks were placed, -1 if none saved. */
  Load(name = "default", replace = true): number {
    const saved = this.Storage.get<SavedBuild | null>(`save.${name}`, null);
    if (!saved || saved.v !== 1) return -1;
    if (replace) this.Clear();
    let n = 0;
    for (const r of decode(saved.b)) if (r.kind === "P" && this.Place(r.type, r.ori, r.pos, (0xff << 24) | r.rgb)) n++;
    return n;
  }
}
