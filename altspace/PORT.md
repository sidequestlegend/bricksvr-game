# brick-builder: port notes for BricksVR (d12/bricksvr-game)

Analysis and the TypeScript port of the rules and data model. Everything here comes from reading the clone at
`C:\workspace\AltspaceGames\brick-builder` (upstream commit `990255b`), the port kit contract (`portkit/README.md`),
the approved plan and its amendments, and `C:\workspace\SideQuest.Ora\Protocol\RELAY.md`. The analysis (sections
1 to 10) was done without Unity: the prefab and scene YAML were read with plain Python
(`altspace/tools/bricks/extract_catalogue.py`); the snapping code was compiled and run with dotnet 8 against stubs
(section 9.1). The Unity phase (the kit, the rendering spike, rungs 2 to 4) is section 11, with its evidence in
`altspace/TESTS.md`; where it changed an earlier statement, the statement is updated and says so.

Path shorthand: `S/` = `Assets/Scripts/` (a bare `BrickAttach.cs:200` means `S/BrickAttach.cs` line 200), `R/` =
`Assets/Resources/`, `MS` = `Assets/Scenes/Main Scene.unity`.

Contents: 1 Upstream at a glance, 2 Feature checklist, 3 State and messages, 4 Platform-call census, 5 Object model,
6 Assets, 7 Translation map, 8 Snippet design, 9 Test plan and results, 10 Changed or left out, risks, trust, next steps,
11 The Unity kit (editor-verified).

---

## 1. Upstream at a glance

| Item | Value | Where |
|---|---|---|
| Repository | d12/bricksvr-game, "the open source mirror of the main BricksVR Unity game". The README says it **does not run**: paid services (GCP, Normcore) and premium assets were removed | `README.md:1-13` |
| Commit | `990255b`, 2021-12-05; 5 upstream commits, all by Nathaniel Woodthorpe. The port's branch `altspace` adds `2be683e` (regenerated brick models) | git |
| Unity | 2019.4.26f1, built-in render pipeline | `ProjectSettings/ProjectVersion.txt:1` |
| Packages | Normcore 2.1.8 (`com.normalvr.normcore`), XR Interaction Toolkit 0.9.2-preview, Oculus XR 1.8.1, TextMesh Pro 2.1.6; Oculus Integration and Facepunch Steamworks are vendored under `Assets/Oculus`, `Assets/Plugins`, `Assets/Steamworks` | `Packages/manifest.json:3-11` |
| Code | 144 C# files outside vendor folders, about 14,850 lines of the game's own (plus a vendored profanity filter, 2,600 lines) | `S/`, `Assets/Editor/` |
| Scene | One scene, `MS` (plain YAML, not lost): menu, carpet, picker, avatars, all scene singletons | |
| Bricks | 65 in the picker (`BrickData.cs:9-75`), 68 held prefabs and 67 placed prefabs in `R/` (`<name>.prefab`, `<name> - Placed.prefab`) | |
| Backend | Google Cloud Functions at `us-central1-bricksvr-unity.cloudfunctions.net`; most endpoint constants were stripped, so `BrickServerInterface.cs` does not compile as shipped (`:91,124,159,200,221,243,273,292,310` use undefined names) | `DownloadBricksOnLoad.cs:162` |
| Scale | A 1x1 brick is 0.056 world units wide: meshes are drawn at `localScale 7` under `CombinedModel` (`R/1x2.prefab:685`), floor grid 0.0560751 (`PositionFloorConnectorsUnderHand.cs:8`) | |

### Licences

| What | Licence | Evidence | Note |
|---|---|---|---|
| Scripts, materials, models, artwork | MIT, "Copyright 2021 BricksVR Studios Inc." | `LICENSE`, `README.md:17-19` | The README excepts **"the BricksVR name and logos"**: the port is called Brick Builder and credits BricksVR only as its source |
| Removed premium content | not in the repo | `README.md:21` | Some music and packages |
| Normcore SDK (`Assets/Normal`), Oculus Integration (`Assets/Oculus`), Steamworks (`Assets/Steamworks`, `Assets/Plugins/steam_api.bundle`) | their vendors' terms | folders | Not used by the port; nothing from them goes into the kit or the script |
| Profanity filter (`S/ProfanityDetector/`) | MIT (stephenhaunts) | its header | Not ported (section 10.2) |
| 269 brick FBX files, 10 sounds, textures, fonts, icons (634 Git LFS pointers) | MIT, but the **objects are gone** (HTTP 410) | `altspace/tools/bricks/README.md` | Brick models regenerated (section 6); the rest replaced or dropped |

The port's script (`pk-brick-builder.js`) is MIT: `altspace/ts/script-header.txt` carries the upstream notice and the
build adds portkit's own MIT banner. `altspace/THIRD-PARTY-NOTICES.md` (also in the bundles) lists the models, the
font (Liberation Sans, OFL 1.1, with its copyright lines) and the sounds; the full licence texts it refers to are in
`Assets/Kit/Licenses/` (BricksVR MIT, portkit MIT, CC0 1.0 legal code), `Assets/Kit/Sounds/LICENSE-*.txt` (Kenney)
and TextMesh Pro's `LiberationSans - OFL.txt`, all packed into the bundles.

---

## 2. Feature checklist

"Port" says where the TypeScript does it (all paths under `altspace/ts/src/`), or "Unity side" for what belongs to the
kit, its graphs and its renderer (not part of this job), or "left out" (section 10.2).

### 2.1 Bricks and the picker

| # | Statement | Upstream | Port |
|---|---|---|---|
| F1 | 65 bricks in six categories: bricks, plates, tiles, slopes, side_studs, misc. Each has a prefab name, display name, mesh, UI scale, spawn rotation and hand-spawner offset | `BrickData.cs:9-75,117-139`; categories `MS:54545,84842,115788,158139,184675,220277` | `BrickData.ts` from `catalogue.json` (66 types: the 65 plus `1x1_4FaceSideStud`, which has prefabs but is commented out of the picker, `BrickData.cs:78`) |
| F2 | Pulling either index trigger opens the brick menu in front of that hand; it closes when the trigger is let go | `BrickPickerManager.cs:100-145,243-297` | **Changed** (11): the picker is a standing panel beside the area, used with clicks (VR laser or desktop mouse); a snippet cannot take the triggers from the world |
| F3 | A category slider picks the tab; bricks of the tab are shown as tiles | `SelectedCategoryManager.cs:76-83`; `BrickPickerManager.cs:299-335` | Done: six tab buttons (`PickerTab`), `BuildArea.ShowCategory`; rung 3 |
| F4 | Gripping a tile while the menu is fully open spawns that brick at the hand with the menu's colour, scaled up from nothing | `BrickPickerBrick.cs:65-93`; `IsMenuFullyOpen` `BrickPickerManager.cs:71` | Changed: a click on a tile selects the brick (`PickerTile`, `BuildArea.TileClicked`; rung 3); in VR it also spawns it into the clicking hand (`Spawn` + `AttachToHand`; unverified: no controllers in Play mode). No scale-in |
| F5 | The tile closest to the hand is highlighted | `BrickPickerManager.cs:147-169` | Left out (no hand-proximity events; tiles are clicked) |
| F6 | `AllBricks` sorts by category name with `List.Sort` (not stable) | `BrickData.cs:82-115` | Stable sort by category then catalogue order (deterministic) |

### 2.2 Colours

| # | Statement | Upstream | Port |
|---|---|---|---|
| F7 | A colour is an ARGB int; bricks keep it in `BuildingBrickModel.color` with `usingNewColors` | `ColorInt.cs:19,53-76`; `BuildingBrickSync.cs:27-31` | `ColorInt.ts` (checked against the C#, 9.1); records keep RGB (alpha is always 255) |
| F8 | Three HSV sliders set the picker colour; every tile shows it | `BrickPickerManager.cs:176-184,201-207` | Done: three uGUI sliders (relayed `uiSlider`, `BuildArea.SetHsv`); every tile and the preview show the colour through the game's relay op `tint` (rung 3 checks the tint; the sliders were not moved in a test) |
| F9 | Colour save spots: touching one selects it; slider changes go into the selected spot; not saved between sessions | `ColorPickerSaveSpot.cs:21-46`; `BrickPickerManager.cs:186-199` | Changed: 12 fixed swatches (`Swatch`) set the colour; they do not store slider colours (rung 3) |
| F10 | Poking a slider with a held brick copies that brick's colour into the picker | `PalletteBrickCollider.cs:11-21` | Left out (no trigger events between a held brick and the panel in the kit) |
| F11 | Hover: a brick under a hand is drawn 20 lighter (or darker when r+g+b > 300); held bricks too | `BrickAttach.cs:27-41,167-198`; `BrickHover.cs:37-60` | `HoverColor` ported; drawing it left out (a placed brick is part of a merged chunk mesh) |
| F12 | Legacy palette of 15 colours (`matId`) for old data | `BrickColorMap.cs:32-49` | Left out: there is no old data |

### 2.3 Holding and placing

| # | Statement | Upstream | Port |
|---|---|---|---|
| F13 | A brick in the hand or falling is a networked physics object; it becomes a "placed" brick (no physics, no network object) when it snaps | `BrickSwapper.cs:138-178`; `PlacedBrickCreator.cs:281-341` | Held bricks are a pool of 12 synced kit objects per area (`HeldBrick.ts`); placed bricks are records (section 3) |
| F14 | Grabbing makes its colliders triggers and starts the snap preview | `BrickAttachDetector.cs:78-103` | `HeldBrick.OnPickup` |
| F15 | While held, a ghost shows where it would snap, every frame | `ShowSnappableBrickPositions.cs:44-62`; `BrickGhosts.cs:29` | `BuildArea.HeldMoved` keeps `ghost` every tick (0.08 to 0.15 ms beside 2,000 bricks); `ShowGhost` puts the kit's see-through `Ghost/<prefab>` there. Built; not observed in a test (a desktop grab does not move the brick) |
| F16 | On release the brick snaps if a connector of it touches a free connector of the other kind on a placed brick or the carpet | `BrickAttachDetector.cs:105-149,177-250`; `LegoConnectorScript.cs:49-85` | `CheckIfCanConnect` in `BrickAttachDetector.ts`; `BrickStore.touching` |
| F17 | Each held connector takes the closest touching partner; connectors competing for one partner keep the closest; the side with more pairs wins, sockets only when strictly more | `BrickAttachDetector.cs:182-192,281-335` | same, `ValidConnections` |
| F18 | The brick turns to the partner's frame plus the quarter turn about the stud axis nearest to how it is held (computed as "farthest, plus 180") | `:337-375,244` | `GetNewRot`, same tie order |
| F19 | It moves so the first connector sits on its partner, faces touching; the partner is asked again after the brick has been turned (so between two studs it can pick the other) | `:377-402` | same, including the re-ask (found by the golden vectors) |
| F20 | Side studs take bricks sideways: the partner brick is tilted until the stud points up, the maths is done, the tilt undone | `:212-226`; side studs `R/1x1_1FaceSideStud.prefab` | done in the connector's frame; the tilt's effect on other bricks' and the floor's connectors is reproduced (`untilting`) |
| F21 | Refused if any of its colliders would hit a brick ("lego" or "placed lego" layers) | `:231-241,263-279` | `BrickStore.collides` against placed bricks (only their enabled colliders: the disabled root boxes of arches, slopes and the pyramid are not solid), and `BuildArea.LooseBoxes` for bricks in hands or lying loose (the pool slots, "lego"); test `findings.test.ts` 9 |
| F22 | Refused when the room is locked and the user is not the owner | `:179`; `RoomOwnershipSync.cs:60-73` | `CanBuild()` |
| F23 | Not attaching: the brick falls with gravity | `:132-136,151-173` | The slot's object is left to Unity physics |
| F24 | A loose brick despawns after about 6 s still; at most 10 loose bricks per owner, oldest destroyed | `AutoDespawnPhysicsBricks.cs:25-48`; `OwnedPhysicsBricksStore.cs:19,31-69` | `HeldBrick` frees its slot 6 s after a drop; the pool of 12 is the cap |
| F25 | Snapping onto a loose brick freezes that one too | `BrickAttach.cs:220-241` | Left out: only placed bricks and the carpet are targets |
| F26 | Haptic tick on a successful snap | `BrickAttachDetector.cs:117-121` | Left out for the snap (the drop names no hand); the hand spawner's "set" buzzes (`Input.Haptic`) |
| F27 | Snap and carpet sounds (3 each), not while loading, switchable | `PlacedBrickCreator.cs:323-335`; `BrickSounds.cs:30-39` | Done for the player who places (`BuildArea.PlacedSound`, CC0 replacements, 6); not for remote placements; no switch |
| F28 | Bricks attached to a player's head follow that head | `BrickSwapper.cs:156-162`; `PlacedBrickCreator.cs:293-307` | Left out (no remote head transforms to parent to) |

### 2.4 The carpet, grid and limits

| # | Statement | Upstream | Port |
|---|---|---|---|
| F29 | The carpet has studs every 0.0560751 under each hand, so the first brick snaps anywhere on the world grid | `PositionFloorConnectorsUnderHand.cs:5-25` | `BrickStore.touching` makes floor studs every 80 u inside the area |
| F30 | A brick on the carpet draws its flat bottom | `BrickAttach.cs:371-374,333-344` | Done: `RenderBrick.bottomClosed` picks the solid-body mesh (11) |
| F31 | No limit on bricks per room or per player in the client | agent census | none either; the archive holds about 16,000 records per area (24 segments) |
| F32 | Bricks can hang below the carpet from the underside of another brick | follows from F21 (the carpet is not a collider layer) | Changed: nothing below the carpet or outside the build area (10.1 C3) |

### 2.5 Deleting and moving

| # | Statement | Upstream | Port |
|---|---|---|---|
| F33 | Gripping a placed brick turns it back into a held brick where it was (and removes it from the server) | `InteractablePlacedBrick.cs:7-12`; `BrickSwapper.cs:94-136`; `QuickInteractor.cs:57-84` | `BuildArea.PickUp` (tombstone + pool slot), wired to the grip button through `BrickAt` |
| F34 | The hammer: hitting placed bricks turns every placed brick within max(3, 1 x speed) world units into a physics brick and blows them apart | `Hammer.cs:20-49`; `MS:29588-29589` | `BuildArea.HammerAt(head, speed)`: the swung hammer removes every placed brick within max(3, speed) upstream units of the brick hit, at most 200 (upstream's overlap buffer), nearest first (no debris, 10.1 C10); the trigger while holding it is a blow at rest (3 units). Desktop hammer mode removes the one brick clicked (C14). Test `findings.test.ts` 6 |
| F35 | No undo, no redo, no clear-all | whole code base | Unchanged; `Clear()` added for loading a save (10.1 C7) |

### 2.6 Hand spawner

| # | Statement | Upstream | Port |
|---|---|---|---|
| F36 | Holding A/B/X/Y for 30 frames with the hand in a brick (or picker tile) "sets" that button to the brick's type and colour, with a haptic tick | `HandBrickSpawner.cs:53-130` | `BuildArea.UpdateSpawners`: after 0.4 s held, the first moment the hand is in a placed brick or on a tile of the shown tab (`TileAt`, the tile's brick in the picker's colour), Primary/Secondary per hand; test `findings.test.ts` 11 |
| F37 | A short press spawns the set brick at the hand, turned by the brick's spawn rotation and moved by its spawn offset | `:130-162`; `BrickData.cs:74` (1x6 arch) | `Spawn` with `spawnEuler` and `spawnOffset` (times the snippet's scale), only on a press shorter than 0.4 s and with nothing in that hand |

### 2.7 Rooms, saving, export

| # | Statement | Upstream | Port |
|---|---|---|---|
| F38 | Create room: name (max 15, profanity-checked), server creates it, shows a 6/8-digit code | `CreateKeyboardManager.cs:15-62`; `LoadingScreen.cs:27-64`; `RoomCodeScreen.cs:13-25` | Left out: a snippet is placed in a world; its `room` attribute names the area |
| F39 | Join by code with a keypad; version check; download the room's bricks; connect to Normcore | `NormalSessionManager.cs:284-425,456-470` | Joining the world is joining; the bricks come from room state (F42) |
| F40 | Recent rooms, up to 40, with names and brick counts | `RecentRoomsManager.cs:23,84-150`; `UserSettings.cs:264-275` | Left out |
| F41 | Every placement is POSTed at once; every pick-up sends a remove; more than 5 failures reloads the game | `BrickSwapper.cs:166-170`; `BrickServerInterface.cs:100-191` | Records in the player's own log; the referee archives them (section 3) |
| F42 | Late join downloads all bricks (`fetch-bricks`), builds them 8 per frame, then recalculates connectors and meshes | `DownloadBricksOnLoad.cs:48-178` | `BuildArea.Start` reads every segment and log in one pass (`BrickLedger` bulk) |
| F43 | Rooms persist on the server indefinitely | backend | Room state keeps a build 24 h after the last write; plus a save on the device (`Save` / `Load`) (10.1 C6) |
| F44 | Export: the server builds a file "openable in Blender" at `bricksvr.com/exports/<code>`, at most every 5 minutes | `ExportManager.cs:20-78`; `BrickServerInterface.cs:238-266` | Left out (no backend) |
| F45 | `BrickObjs/*.pobj`: OBJ-style vertex dumps of 65 bricks, written by an editor tool, presumably for the export service | `Assets/Editor/GenerateObjs.cs:50` | Not an in-game feature (export is left out). Used as source data: the plant and pyramid models are rebuilt from them (section 6) |

### 2.8 Ownership and settings

| # | Statement | Upstream | Port |
|---|---|---|---|
| F46 | The room's owner is whoever created it (device id prefix) | `RoomOwnershipSync.cs:60-73`; `UserId.cs:7-15` | The world's owner and moderators (`Protected.CanWrite`) |
| F47 | Lock: anyone can lock, only the owner unlocks; locked, non-owners can neither place nor grab placed bricks | `RoomOwnershipSync.cs:34-38,147-158` | `SetLocked` through protected state: only owner and moderators can lock or unlock (10.1 C8); `CanBuild` gates every action |
| F48 | Low gravity, "prevent moving through bricks" (owner only) | `RoomOwnershipSync.cs:91-102,160-182` | Left out: world-wide physics and movement belong to the world, and a snippet must not call `SetSettings` |
| F49 | 23 user settings in PlayerPrefs (voice, music, turn, speed, vignette, nickname, avatar, render distance, player scale, shininess, performance mode, ...) | `UserSettings.cs:63-366` | Only "super ultra performance mode" maps (snippet setting `performance`, `RenderBrick`); the rest are the app's own settings or left out |
| F50 | Render distance in chunks of 1 world unit; connector colliders only near the player | `ChunkedRenderer.cs:42-122` | Chunks of 16 x 16 studs x 48 plates, one merged mesh each (11); no render distance (Unity's frustum culling per chunk) |

### 2.9 Everything else

| # | Statement | Upstream | Port |
|---|---|---|---|
| F51 | Tutorial: 10 steps in a private room (attach, carpet, move, fly, turn, menu, 3 bricks, copy colour, set spawner, spawn) | `TutorialManager.cs:156-498` | Left out (10.2) |
| F52 | Avatars: brick heads, eyes and mouth sprites, colours, nickname tag, voice meter | `AvatarNicknameSync.cs:30-252`; `AvatarEditorMenu.cs` | Left out: Altspace avatars |
| F53 | Voice: mute self, mute others, push to talk, per-player local mute | `SyncVoiceWithSettings.cs:17-99`; `PlayerListItem.cs:20-43` | Left out: the app's voice |
| F54 | Locomotion: stick move, vertical fly, snap/smooth turn, player scale 0.15-5x, vignette, keep out of walls | `JoystickLocomotion.cs:44-85`; `AdjustPlayerScale.cs:61-120`; `KeepPlayerOutOfWalls.cs:29-68` | Left out: the app moves the player; no flying, no scaling (10.3 R2) |
| F55 | Music player, shuffled | `MusicPlayer.cs:40-72` | Left out (tracks were removed upstream) |
| F56 | Player list with owner crown | `PlayerMenuManager.cs:44-60` | Left out (the app has one) |
| F57 | Entitlement checks (Oculus, Steam), analytics, exception reporting | `EntitlementChecks/*`; `ExceptionManager.cs:7-43` | Left out |
| F58 | Nickname and room-name keyboards with a profanity filter | `NameKeyboardManager.cs:56,70`; `CreateKeyboardManager.cs:24-41` | Left out: no free text remains in the port, so no filter is needed |

58 features, after the Unity phase: 35 done (F1, F3, F6-F8, F13-F24, F27, F29-F34, F36, F37, F41-F43, F46, F47, F50;
F15's ghost built but not observed in a test), 4 changed on purpose (F2 panel instead of a trigger menu, F4 click to
select, F9 fixed swatches, F11 hover colour without drawing), 1 with nothing to port (F35), 18 left out or replaced by
the platform as before (F12, F25, F28, F38-F40, F44, F45, F48, F49 except performance mode, F51-F58), and 3 more left
out in the Unity phase (F5, F10, F26 for the snap). Changes are in 10.1, omissions in 10.2.

---

## 3. State and messages

### 3.1 Upstream (Normcore)

| Model | Fields (property id) | Owner | Where |
|---|---|---|---|
| `BuildingBrickModel` | 1 `attached`, 5 `uuid`, 6 `bricksAbove`, 7 `bricksBelow`, 8 `matId`, 9 `color`, 10 `usingNewColors` | whoever grabs (ownership requested on grab) | `S/BuildingBrickModel.cs:7-39`, on 68 held prefabs |
| `RoomOwnershipModel` | 2 `locked`, 3 `lowGravity`, 4 `blockedFromMovingThroughBricks` | unowned | `S/RoomOwnershipModel.cs:7-21` |
| `AvatarNicknameModel` | nickname, shortId, two colours, eyes, mouth | local avatar | `S/AvatarNicknameModel.cs:7-27` |
| `HandGestureModel` | pose, flex, point, thumbsUp, pinch (unreliable) | local avatar | `S/HandGestureModel.cs:7-22` |
| `HandColorModel`, `InitialTransformModel`, `BrickIdStoreModel`, `BrickStorePlayerModel` | | unused | |

Messages: one reliable Normcore RPC, `"<len>@" + JsonUtility.ToJson({type:"create", brick})` with `brick = {uuid,
matId, color, type, pos, rot, usingNewColor, headClientId, usingHeadStuff}` (`BrickSwapper.cs:180-210`,
`NormcoreRPC.cs:231-271`); "destroy" is sent nowhere and handled as a no-op. Placed bricks are not Normcore objects:
they are the RPC plus the server's copy. A pick-up only tells the server, so **other players keep seeing a picked-up
brick until they reload** (the held copy appears beside it: `BrickSwapper.cs:104-111`, the destroy RPC is commented
out). The port fixes this with tombstones.

### 3.2 The port

Bricks are data. Nothing per brick is a networked object.

| Where | Key (under `pk1.brick-builder.<inst>.`) | Holds | Written by |
|---|---|---|---|
| user state, per player | `p0` (the per-player behaviour `log`, type `BrickLog`) | that player's records not archived yet, packed (`BrickRecords.ts`) | only that player (the room ties user state to its sender: no lost writes, no compare-and-set) |
| space state | `v.s00` .. `v.s23` (+ `o.sNN`), behaviours `BrickSegment` | the archive: every record, about 690 per 14.5 KB segment | only the referee |
| space state | `v.h00` .. `v.h11` (+ `o.hNN`), behaviours `HeldBrick` | pool slot: `t` type (-1 free), `c` colour, `d` loose | the slot's owner (who spawned or grabbed it) |
| protected state | the runtime's protected value `locked` | the lock | the world's owner and moderators |
| device | `localStorage` `pk1.brick-builder.<inst>.<uid>.save.<name>`, `.saves` | saved builds | the player |

**Records** (`BrickRecords.ts`): a place record is 21 characters (`P` + 15 bytes base64url: author index, seq u24,
type u8, orientation u8, x, y, z i16 in lattice units, RGB u24); a tombstone is 16 (`T` + author, seq, target author,
seq from, to: one brick or a whole range). A packed list is `{a: [author keys], r: "<records>"}`; an author key is
`<uid>~<session id>`, so a returning player is a new author and seq numbers never collide. A brick's id is
`<author>#<seq>`.

**Placed bricks** = every place record seen minus those a tombstone covers (`BrickLedger.ts`). The set only grows
and the result does not depend on order (a tombstone that arrives first still removes its brick), so clients that
have seen the same records show the same bricks. Two players who place overlapping bricks in the same moment both
keep them (both passed their own check), as upstream; everyone sees both.

**Flow of one brick**: the author checks it, applies it locally, appends it to their own log (written at most once a
tick, sent by the app every 0.2 s); everyone reads the log, and takes from it only records under that log's own
player's key; the referee copies records into the last segment with room once a second; the author drops archived
records from the log. A log has 12,000 bytes; if it is full, new records wait in memory and go in as the archive
catches up. A record the store cannot hold (unknown brick type, orientation 24 or more, bad numbers) is refused on
ingest by every client, so it never reaches the archive.

**A full area**: every client counts what the archive would keep (all records but what garbage collection may drop
now) against the 24 segments; a new brick is refused once that passes 97 % (the rest is for tombstones, so removing
bricks always works, and packing slack), and the status line says "AREA FULL: remove bricks to build more". If the
referee still finds records that do not fit, it keeps what the archive holds, takes what fits and logs a warning once;
the rest stays in its authors' logs. Upstream had no limit (a cloud database).

**A player leaves**: their user state goes 30 s later (RELAY.md section 3), but every client keeps every record it
saw, and the referee has archived them within a second of seeing them. If the referee leaves, the next referee
archives what the old one had not (it knows those records too).

**Garbage collection**: when a quarter of the archive is deleted bricks (and at least 64 records), the referee
rewrites the segments without each deleted brick and its tombstone, once no present player's log holds them and the
tombstone's target author has gone (`BrickLedger.gcable`). Late joiners then never see them; clients that saw them
saw both halves. A tombstone that outlives its brick still counts toward its target author's last number, so an
author who returns under the same key never reuses a number it covers.

### 3.3 What the referee does, and when

| Every | What | Cost |
|---|---|---|
| 1 s, only if something is new | `Archive()`: append new records, or repack | one space-state batch (the changed segments; the runtime hands a repack of up to 24 x 14.5 KB over in parts under the relay's 256 KiB message cap, test `repack.test.ts`: 19 segments, largest message 87,681 bytes) |
| tick | nothing else; there is no per-tick state | clients decode only the segments that changed (`BuildArea.Poll`) |

The game's behaviours sync no other state; `BuildArea` (the manager) has no synced fields.

---

## 4. Platform-call census

| Upstream | Where | Port |
|---|---|---|
| Normcore `Realtime.Connect`, room names `v0.2-<code>`, tutorial room | `NormalSessionManager.cs:118,361`; `TutorialManager.cs:184` | The world's room; the snippet's instance key |
| `Realtime.Instantiate` / `Destroy` (bricks, spawners, warm-up) | `BrickPickerBrick.cs:73-85`; `HandBrickSpawner.cs:124-138`; `BrickSwapper.cs:113-120`; `BrickDestroyer.cs:55`; `AutoDespawnPhysicsBricks.cs:30` | Pool slots (`HeldBrick`), claimed with `SetOwner` |
| `RealtimeTransform.RequestOwnership`, drop when ownership lost | `NetworkedInteractor.cs:26-39`; `XRDropWhenNotOwned.cs:40-58` | `Networking.SetOwner` on pickup; the slot's transform is synced by the kit object (`sync: transform`) |
| `BuildingBrickModel` and its change events | `BuildingBrickSync.cs:51-141` | `HeldBrick` synced fields |
| `room.SendRPCMessage` (create) | `BrickSwapper.cs:202-210`; `NormcoreRPC.cs:13-38` | Records in user state |
| `RoomOwnershipModel` | `RoomOwnershipSync.cs` | Protected value `locked` |
| `RealtimeAvatarManager`, `RealtimeAvatarVoice` | `PlayerMenuManager.cs:26-27`; `SyncVoiceWithSettings.cs:17-98` | The app (gap: no voice control, no remote hands) |
| OVRInput: triggers (menu), A/B/X/Y (spawner), grip (grab), sticks (move, PTT), Start (menu) | `BrickPickerManager.cs:107-139`; `HandBrickSpawner.cs:35-39`; `QuickInteractor.cs:29-69`; `JoystickLocomotion.cs:46-47`; `NormalSessionManager.cs:196` | `OnButtonPressed/Released` (grip, primary, secondary); BS Grababble grabs; the triggers and menu are the kit's |
| OVRInput haptics | `HapticsManager.cs:26-48` | `Input.Haptic` |
| OVRManager / OVRPlugin (focus, headset type, fixed timestep) | `Hand.cs:108-141`; `UpdateFixedTimestep.cs:8-44` | Gap: not needed |
| Oculus Platform entitlement | `EntitlementChecks/OculusEntitlementCheck.cs:15-33` | Left out |
| Steamworks (Facepunch) | `SteamManager.cs:25-64`; `SteamEntitlementCheck.cs:11-23` | Left out |
| XR Interaction Toolkit 0.9: `XRGrabInteractable` on bricks, `XRDirectInteractor` hands, ray interactors for menus, `XRRig`, `SnapTurnProvider`, `ForceSelect` | census in `S/` (BrickAttachDetector, Hand, EnableTeleportRayOnSelect, SmoothTurn, ...) | BS Grababble (grab/drop events), the app's rig and rays. Gap: no `ForceSelect`, so a picked-up placed brick appears in place and must be grabbed (10.3 R3) |
| PlayerPrefs (23 keys) | `UserSettings.cs:124-366` | `Storage` (localStorage) for saves; the settings themselves left out |
| Cloud backend: fetch-bricks, SendBrick, RemoveBrick, CreateRoom, RoomInfo, SetLocked, SetNickname, StartExport, IsVersionSupported, exceptions | `BrickServerInterface.cs:76-318`; `DownloadBricksOnLoad.cs:160-171` | None: room state (24 h) + the device save. Export left out |
| `Application.OpenURL` (export page), `Application.Quit`, Unity Analytics | `ExportManager.cs:77`; `EntitlementCheckManager.cs:74,123` | Left out |
| `Physics.CheckBox`, `OverlapBoxNonAlloc`, `OverlapSphereNonAlloc`, trigger callbacks on connectors | `BrickAttachDetector.cs:272`; `LegoConnectorScript.cs:49-66,137`; `BrickAttach.cs:406` | `BrickStore`: integer lattice, spatial hash, exact oriented-box tests (no Unity physics for placed bricks) |
| `Mesh.CombineMeshes` per brick, `BrickMeshCache`, `MaterialPropertyBlock` colour and `_TexOffset` | `BrickAttach.cs:268-364,189-198`; `PerInstanceColor.shader:32-34` | `RenderBrick` gives the cache key, covered studs, body variant, colour, tex offset; meshing per chunk is Unity side |
| `RenderSettings.reflectionIntensity`, quality levels | `ReflectivityManager.cs:7-30`; `SetQualityLevel.cs:9-14` | Left out |
| `Physics.gravity` (low gravity) | `RoomOwnershipSync.cs:91-96` | Left out (world-wide) |

---

## 5. Object model

Upstream, per brick type: a held prefab (`R/<name>.prefab`: root on layer 12 "lego" with `Rigidbody`,
`XRGrabInteractable`, `RealtimeView`, `RealtimeTransform`, `BuildingBrickSync`, `BrickAttach`, `BrickAttachDetector`
(`colliders`, `tile`, `window`, `heightOverride`), `ShowSnappableBrickPositions`; children `CombinedModel` (scale 7),
`MaleConnectors` / `FemaleConnectors` (each connector: tag `Connector-Male/Female`, layer 15, scale 0.04, trigger
`BoxCollider`, `LegoConnectorScript`), extra colliders) and a placed prefab (`R/<name> - Placed.prefab`: layer 17
"placed lego", the same connectors on layer 16 as solid boxes, the solid colliders, `BrickAttach`,
`InteractablePlacedBrick`). The scene's `MetaObjects/ModularBrickObjects` holds per-type `Body`, `FlatBody`, `Studs`
and `Tubes` meshes that `BrickAttach.RecalculateRenderedGeometry` combines.

The port's catalogue keeps, per type: footprint and height (bricks.json), every connector of the held prefab (pose,
kind), the held prefab's `colliders` and the placed prefab's layer-17 colliders, and derives:

| Derived | Rule | Where |
|---|---|---|
| Lattice unit | 1 u = 0.1 mm of mesh: stud 80, plate 32, brick 96 | `Lattice.ts` |
| Orientation | one of 24 cube rotations, index = 4 x up + yaw (0..3 = upright) | `Lattice.ts` `ORIS` |
| Mate point | a stud: centre of the top face under it; a socket: centre of the bottom face; a side stud: the side face. Lateral position snapped to the half-stud grid (side-stud height 6 u kept) | `BrickData.ts` |
| Trigger and cover probes | the prefab connector's position (u, unrounded), cubes of half 28.6 u (trigger) and 14.3 u (cover) | `BrickData.ts`, `BrickStore.ts` |

Kit objects the TypeScript expects (`bindings.json`, hand-written until the kit builder writes it): `area` (path
`Area`, the build area's origin and the manager's object), `ghost` (`Ghost`, with one child per brick prefab), and
`held0` .. `held11` (`Pool/Held<n>`, transform-synced, grabbable, each with one child per brick prefab; the script
switches the right one on with the relay op `active` on `@Pool/Held<n>/<prefab>`).

---

## 6. Assets

| What | State | Replacement |
|---|---|---|
| 269 brick FBX (`R/BrickModels/**`) | Git LFS objects gone | **Regenerated** in `altspace/GeneratedBrickModels/` by `altspace/tools/bricks/generate_bricks.py` (headless Blender) from `bricks.json` (92 bricks, 269 files), same GUIDs and fileIDs; verified against all 548 connectors of the 68 held prefabs (`verify_bricks.py`). The two plants and the pyramid (4 files) are upstream's own meshes, rebuilt vertex for vertex from `BrickObjs/FlatPlant.pobj`, `ThreeLeafedPlant.pobj` and `1x1Pyramid.pobj` (checked within 1 um); the other 61 dumps match the generated bricks within about 0.5 mm. Variants: `*_Complete` (held, picker, ghost), `*_HollowBody[_NoBevel]` (placed body, open underside), `*_SolidBody[_NoBevel]` (placed body when every socket is covered or on the carpet), `z_Extras/Stud.fbx` (one uncovered stud). See `altspace/tools/bricks/README.md` |
| 10 sounds (`Resources/Sounds`) | lost | **Replaced** by 9 Kenney CC0 sounds (Casino Audio: `chips-collide-1..3` for the snaps, `chip-lay-1..3` for the carpet; Interface Sounds: `click_001`, `pluck_001`, `confirmation_001`), downloaded from OpenGameArt (Kenney's account), licence texts beside them in `Assets/Kit/Sounds`; `THIRD-PARTY-NOTICES.md`. `spawnset.wav` was unreferenced: not replaced |
| `Textures/unknown.png` (scratch overlay of every brick) | lost | **Dropped**: the port's brick shader has no scratch texture (upstream's `_ScratchWeighting` 0) |
| Carpet textures, floor night mode, skybox, reflection probes | lost | URP defaults / the world's own floor |
| Brick-category icons (6 of 19 used), UI icons | lost | renders of the generated models, or the kit's own UI |
| Avatar faces (27), Bob | lost | not needed |
| Fonts (8 TTF) | lost; the TMP SDF assets survive | the kit's TextMesh Pro font |
| `Prefabs/BrickComponents/*` and `Prefabs/Hammer.prefab` reference model GUIDs that exist nowhere | broken upstream | **Rebuilt**: the kit builder makes the placed-brick meshes (body + `z_Extras/Stud.fbx` per stud) from `ts/render.json` (from `catalogue.json`); the hammer is two primitives |
| The import | 634 LFS pointers | `altspace/tools/import_upstream_bricks.py`: portkit's importer (which skips LFS pointers: 73 reached by the start prefabs) and `GeneratedBrickModels/**` laid in with the upstream `.meta` files |

`altspace/ts/src/catalogue.json` (66 bricks, 543 connectors) is generated by `altspace/tools/bricks/extract_catalogue.py`
from `BrickData.cs`, the prefabs and `bricks.json`; its order is the wire format's type number (append only). Each
brick's connectors are in Unity's child order (`m_Children`), which is what `BrickAttachDetector.OnValidate` serializes
into `_maleConnectors` / `_femaleConnectors` and so decides `connectorsToUse[0]`; the extractor checks it against the
serialized lists (132 of 132 agree; the first catalogue had YAML document order, and 81 lists differed). The placed
colliders are the enabled ones only (10 disabled root boxes left out).

---

## 7. Translation map

| Upstream | Port (`altspace/ts/src/`) | Notes |
|---|---|---|
| `BrickData.cs` | `BrickData.ts`, `catalogue.json` | catalogue from the prefabs |
| `BrickAttachDetector.cs`, `LegoConnectorScript.ClosestConnector` | `BrickAttachDetector.ts` | snapping; golden-tested |
| `LegoConnectorScript.RecalculateEnabled/BrickCollidingWith`, `BrickAttach.IsOnCarpet`, `BrickStore.cs`, physics queries | `BrickStore.ts` | spatial hash, overlap, cover flags, chunks |
| `BrickAttach.RecalculateRenderedGeometry`, `BrickMeshCache.cs`, `ChunkedRenderer.cs`, `PlacedBrickRenderer*.cs` | `ChunkedRenderer.ts` | renderer input only |
| `ColorInt.cs`, `BrickAttach.HoverColor`, Unity HSV | `ColorInt.ts` | golden-tested |
| `NormcoreRPC.cs`, `BrickServerInterface.cs` (brick rows) | `BrickRecords.ts` | records |
| `DownloadBricksOnLoad.cs`, `BrickSwapper.cs` (server half) | `BrickLedger.ts` | set of records, archive planning, GC |
| `BuildingBrickSync.cs`, `BuildingBrickModel.cs`, `AutoDespawnPhysicsBricks.cs`, grab/release of `BrickAttachDetector.cs` | `HeldBrick.ts` | pool slot |
| `BrickSwapper.cs`, `Hammer.cs`, `HandBrickSpawner.cs`, `InteractablePlacedBrick.cs`, `RoomOwnershipSync.cs` (lock) | `BuildArea.ts` | the manager |
| (new) | `BrickLog.ts`, `BrickSegment.ts`, `Lattice.ts`, `index.ts` | log, archive, lattice, game definition |
| Everything in 2.9, menus, settings, avatars | none | Unity side or left out |

---

## 8. Snippet design

```html
<bs-snippet name="brick-builder" room="" width="64" depth="64" height="480" performance="false"
            position="0 0 0" rotation="0 0 0">
  <bs-gizmo type="position" attribute="position"/>
  <bs-gizmo type="box" attribute="position" size="3.584 0.2 3.584"/>   <!-- the build area at the default 64 x 64 studs (BrickKitBuilder.GizmoSize; a gizmo cannot follow width / depth) -->
</bs-snippet>
```

| Setting | Default | Meaning |
|---|---|---|
| `room` | "" | instance key: two elements with different `room` values are two separate build areas (tested) |
| `width`, `depth` | 64 studs (max 800) | the area's footprint, centred on the element; the carpet's studs and every brick stay inside |
| `height` | 480 plates (max 1000) | how high bricks may go |
| `scale` | (none) | **Changed in the Unity phase**: `scale` is portkit's holder scale (the snippet's own attribute), so it cannot also be a game setting. The kit is built at upstream's size (meshes at 7x, a stud 5.6 cm), and `BuildArea` multiplies its 7 by the attribute (default 1). Lattice positions are independent of it |
| `performance` | false | upstream's "super ultra performance mode": flat bodies, no studs (per client) |

`single`: false (a build area does not take over a world; several fit). Space-state keys per area: one `v.` and one
`o.` key per segment in use (at most 24 each), the same per pool slot in use (at most 12 each) and the runtime's
own few: at most about 80 of the room's 2,048, 7 measured with 2,000 bricks. User state per player per area: one log
leaf (plus the runtime's announcement leaf). Networked objects: 12 per area (the pool), far under 1,024.

---

## 9. Test plan and results

`cd altspace/ts && npm test` (typecheck, lint, 38 tests), run on portkit `c971100` (re-synced 2026-11-25; 11.6). The game sends no
network events and no commands (all its state is fields), so it declares no `networkCallable` methods; its only relay
op is the standard `active` on `@` paths, so it needs no `Host.op` or `defineRelayOp`. `npm run golden` regenerates the vectors with dotnet 8.
`npm run build` writes `../Assets/WebRoot/pk-brick-builder.js`; this job built it to a scratch folder instead:
676 KB unminified, parses.

### 9.1 Golden vectors (upstream C# compiled unchanged with dotnet 8)

`ts/golden/Golden.csproj` compiles `S/BrickAttachDetector.cs`, `S/LegoConnectorScript.cs` and `S/ColorInt.cs`
**unchanged** against `ts/golden/BrickStubs.cs` (Transform hierarchy with Unity's Euler conventions, quaternions,
`Physics.CheckBox` / `OverlapBoxNonAlloc` as exact oriented-box tests over enabled colliders on active objects, inert
XR and Normcore stubs). `Harness.cs` builds every brick **from its upstream prefab** (`golden/PrefabYaml.cs` reads the
held and placed prefab YAML: transforms in child order, BoxColliders with `m_Enabled` and `m_IsTrigger`, the
serialized `_maleConnectors` / `_femaleConnectors` / `colliders` / `tile` / `window` / `heightOverride`), so the vectors
do not share the port's catalogue (the catalogue only chooses the situations). It fills each connector's
`connectorsCollidingWith` the way the trigger callbacks would, calls `RecalculateEnabled` and `CheckIfCanConnect`, and
writes `ts/vectors/upstream.json` (650 situations, 503 attach; 64 colours; cover flags keyed by connector position).
`test/golden.test.ts` plays them through the TypeScript; `test/catalogue.test.ts` checks the catalogue's connector
order and obstacles against the prefabs with its own YAML reading. With the first catalogue (document order, disabled
boxes solid) the new vectors give 163 disagreements and the catalogue tests fail; with the fixed one all agree.

| Set | Cases | Result |
|---|---|---|
| let go above the carpet | 150 | all agree; worst position difference 0.86 u (0.09 mm of mesh) |
| onto a placed brick (40 % with a second brick stacked on it) | 220 | all agree (attach or not, rotation, direction, position within 1.18 u, every cover flag) |
| up into the sockets of a brick | 80 | all agree, worst 0.57 u |
| onto a side stud | 80 | all agree except the deliberate refusals below, worst 2.13 u |
| anywhere, any rotation, near a small build | 120 | all agree except as below |
| deliberate: port refuses because the brick would reach below the carpet | 13 | checked to agree (position, rotation, direction) when the floor rule is switched off |
| deliberate: a held brick's own side stud into a socket | 0 | exempt only when the harness reports upstream went by that side stud (10.1 C4); none in this set |
| ColorInt | 64 | all agree |

The vectors found two real bugs in the first TypeScript, both fixed: upstream asks for the closest partner again
after turning the brick (`BrickAttachDetector.cs:392-397`), and the spatial index did not file a brick under its studs'
trigger cubes.

### 9.2 Node scenarios on the fake room

| # | Scenario | Result (measured on this machine) |
|---|---|---|
| N1 | 3 players place 2,000 bricks (20/s each, 33.6 s virtual) | all 2,000 on every client, identical, exactly as planned; logs drain to 0 |
| N1 budget | writes | space state: 34 batches (peak **1/s**, mean 1.0/s, limit 20/s); user state: 505 writes room-wide (peak 16/s across 3 players, about 5/s each, limit 20/s per player); `rate_limited` 0 |
| N1 leaves | sizes | 7 space-state keys, 42,540 bytes, largest leaf **14,525 bytes** (limit 16,384); largest log leaf while building 558 bytes |
| N1 late join | rebuild | a joiner shows all 2,000 bricks 1.72 s (virtual) after opening the page, including the fake room's join and kit delays; the rebuild itself (decode 3 segments, place 2,000 bricks, all cover flags) takes **20 to 29 ms** (median of 5, across runs) in Node |
| N1 ghost | snap test cost | 0.08 to 0.15 ms per `CheckIfCanConnect` beside 2,000 bricks (across runs) |
| N1 renderer | chunks | 8 chunks, largest 384 bricks |
| N2 | concurrent: delete a brick while another player builds on it; two players place in the same spot at once; two players delete the same brick | all clients converge on the same set (both overlapping bricks kept, as upstream) |
| N3 | tombstone before its brick, in four orders | same result every order |
| N4 | the referee places 300 and leaves 1 s later; 35 s on (her user state gone) a newcomer joins | all 300 kept and rebuilt |
| N5 | the referee leaves mid-build; another player leaves 0.3 s after placing 150 | all 450 kept, also for a later joiner |
| N6 | two build areas (`room` north and south, south 48 studs wide) | no key crosses over; bounds apply per area |
| N7 | save 150 bricks, another player clears, reload; leave, come back on the same device, reload; another device has no save | identical bricks each time |
| N8 | spawn from the pool, grab, drop near the carpet: snaps at y = 48; pick it up from the build, drop it in the air: loose 6 s, then the slot is free | as stated |
| N9 | the owner locks: a member cannot place or unlock | as stated |
| N10 | hammer 75 of 400, author leaves | the 75 deleted bricks leave the archive (repacked by the referee while the author was still there); the 75 tombstones stay until they are a quarter of the archive; a joiner rebuilds the 325 |
| N11 | a non-referee loads a 2,000-brick save at once | the other player has all 2,000 after 2.7 s (virtual; 2.8 s before portkit `c971100`): **3 space-state batches and 4 user-state writes**, largest log leaf 11,708 bytes, no rate limiting (plan's spike: at most 100 batches) |
| N12 | the review's findings 3-15 (`findings.test.ts`, `repack.test.ts`; each fails on the code before its fix) | a full archive refuses with a notice and loses nothing; bad records refused; the hammer's blast; pick-up needs a slot, a leaver's slot is freed; logs speak only for their player; loose bricks block; one segment decoded per write; the hand spawner; a 19-segment repack in parts; tombstone numbers not reused |

### 9.3 Unity (rungs 2 to 4)

Run in the Unity phase: `altspace/TESTS.md` (rung 2 PASS, rendering spike PASS with option (b), rung 3 17/0, rung 4 14/0);
again after the review on the rebuilt bundles (2026-11-25): rung 2 PASS, rung 3 20/0 twice (3 new checks: an arch over a
plate, a full area and its notice, room again after removing), rung 4 14/0 twice; and again after the re-sync to portkit
`c971100` (11.6): rung 2 PASS, rung 3 20/0 twice, rung 4 14/0 twice.

Fixed in the re-sync to portkit `c971100` (11.6): the kit's description and in-world credits said every brick model was
"regenerated plain shapes", though the two plants and the pyramid are upstream's own meshes (section 6). They now say
the bricks are regenerated as plain shapes and the plants and pyramid rebuilt from upstream's meshes
(`BrickKitBuilder.cs` Description, `CreditsText`; THIRD-PARTY-NOTICES.md already said so).

---

## 10. Changed or left out, risks, questions

### 10.1 Changed

| # | Change | Reason |
|---|---|---|
| C1 | Placed bricks are records on an integer lattice with cube rotations, not GameObjects in world space | at most 1,024 networked objects per room; exact, identical results on every client |
| C2 | Positions land on exact faces and the 8 mm lattice instead of upstream's tuned constants (0.0560751 pitch, `Height()`): at most 1.4 u (0.14 mm of mesh, 1 mm in the world at scale 7) apart, measured | one lattice for snapping, overlap and rendering |
| C3 | Nothing below the carpet or outside the build area | a build area has bounds; upstream let bricks hang under the floor |
| C4 | A held brick's own side stud is matched in its own frame (upstream treats it as a top stud and places the brick oddly) | geometric correctness; 1 golden case |
| C5 | Picking up a placed brick removes it for everyone (tombstone) | upstream only told the server (3.1) |
| C6 | Builds last 24 h after the last write in room state, plus a save on the device (per world, area and player, not per account); no cloud | coordinator decision; no backend |
| C7 | `Clear()` (range tombstones) added, used by loading a save | loading replaces the build |
| C8 | Lock and unlock by the world's owner and moderators (protected state); upstream let anyone lock | a public key could be written by anyone |
| C9 | Held and loose bricks are a pool of 12 per area; snapping onto a loose brick is gone | pool instead of instantiating network objects |
| C10 | Hammer deletes (the same radius and 200-brick cap as upstream) instead of exploding into physics bricks | no physics bricks to spare |
| C11 | `texOffset` from the brick id (same on every client) instead of `Random` per client | deterministic look (unused while there is no scratch texture) |
| C12 | Placed bricks are drawn as one merged mesh per chunk, built by the kit's relay graph from brick records (`bricks` op); colour per brick in UV1 | the relay cannot carry meshes, MaterialPropertyBlock is not on the allow list; 8 draws for 2,000 bricks (11, TESTS.md) |
| C13 | Studs are all or nothing per brick (4 meshes per type), not one per uncovered stud | a mesh per look without a mesh cache; covered studs are hidden inside the brick above |
| C14 | Desktop: click a tile to select, click the carpet or a brick's top to place (snapped as a brick let go there), hammer mode to remove; Rotate turns what a click places | the desktop grab cannot carry a brick far (it follows the mouse, not a pointer), and placing must work without controllers |
| C15 | The picker is a standing panel with tabs, 12 swatches and HSV sliders, not a menu opened with the trigger | a snippet cannot take the triggers from the world's own controls |
| C16 | The snippet's `scale` is portkit's holder scale; the kit is built at upstream's size | portkit already reads `scale` for the holder (8) |
| C17 | A build survives an empty room (runtime option `whenEmpty: "keep"`) | found in Play mode: the default resets an instance nobody is in (TESTS.md, rung 1 test 18) |

### 10.2 Left out

Cloud saves, rooms by code, recent rooms and room names (the snippet's `room` replaces them); export to Blender
(no backend; a future option is a local OBJ download from `catalogue.json` meshes); the tutorial (a static help panel
could replace it); Oculus avatars, entitlement, haptics manager details; voice controls, push to talk, mute (the app's
voice); Steam; music; locomotion, flying, player scale, low gravity, keeping players out of bricks (world-wide or the
app's); analytics and exception reporting; the profanity filter (no free text remains); bricks on players' heads;
the legacy 15-colour palette. In the Unity phase: the nearest-tile highlight (F5), copying a held brick's colour by
poking the sliders (F10), the snap haptic (F26), the hover colour drawn on placed bricks (F11), sounds of other players'
placements, render distance.

### 10.3 Open risks

| # | Risk |
|---|---|
| R1 | Resolved in the Unity phase: a game relay op `bricks` carries records, the graph merges (11). Left: its speed on the Quest (IL2CPP visual scripting; the first build of a 384-brick chunk took 23-46 ms in the editor, a frame hitch at late join) |
| R2 | Scale: upstream players shrink or grow (0.15-5x) and fly; Altspace players do neither, so `scale` decides what is reachable. 7 keeps upstream's brick size |
| R3 | No `ForceSelect`. `GameObject.AttachToHand` was tried in Play mode (TESTS.md, rung 3): the slot moved to the desktop player's hand anchor and was let go again. The kit uses it for a brick gripped from the build and a tile clicked in VR, released on grip up; with controllers it is unverified |
| R4 | A record queued but not yet sent when its author's page closes (under 0.2 s) is lost; the archive catches everything sent |
| R5 | Two players placing overlapping bricks at once both keep them (upstream did the same) |
| R6 | 24 segments hold about 16,000 records per area (bricks plus tombstones not yet collected). Past 97 % new bricks are refused with "AREA FULL" on the status line; removing still works and garbage collection makes room once the deleted bricks' authors have left (3.2) |
| R7 | Page timer rates and bridge latency in the app are unproven until rung 5 |

### 10.4 Trust: what a modified client can still do

Upstream trusted every client too (Normcore RPCs, a backend that took any brick). Closed in the port: a record in a
player's log counts only under that player's own key (the relay ties user state to its sender), so nobody can place
or delete in someone else's name or pre-empt someone's record number with a copy of their own (finding 8,
`findings.test.ts` 8); records the store cannot hold are refused on ingest (finding 4); the lock is protected state,
so only the world's owner and moderators can lock or unlock (C8). What a modified client can still do, compared with
upstream:

| What | Why it stays open | Compared with upstream |
|---|---|---|
| Build or remove while the area is locked | `CanBuild` is checked by the builder's own client; a reader cannot tell when a record was made, so it cannot drop records made while locked without dropping honest ones made just before the lock | the same (upstream's lock was client-side too, and anyone could lock) |
| Remove any brick, or every brick (`Clear` range tombstones under its own key) | deleting is open to every builder by design, as upstream | the same; tombstones name their author, so it is visible who removed what |
| Write records into the archive segments (public space state) under any author's key | space state is writable by any client (portkit README, Trust), and the archive holds every author's records, so its records cannot be checked against a sender | upstream's backend took any brick from any client. A wiped or shortened archive is repaired: clients that saw a record keep it (the ledger only grows) and the referee writes back, within a second, every record it knows that the segments lack |
| Flood its own log or the archive to fill the area | per-player limits would refuse honest large builds | upstream had no limit at all; here a full area refuses new bricks for everyone until bricks are removed |
| Hold every pool slot | slots are claimed by ownership like any synced object | upstream let a client instantiate without limit |

### 10.5 Next steps

Rung 5 (app and Quest) once Shane opens the world: Quest frame time with a big build, the late-join merge on IL2CPP, the
VR paths (grip pick-up into the hand, hand spawner, laser tile, swinging the hammer, the ghost), and the snippet's
gizmo. Possible improvements: spread a late join's chunk merges over frames; cook chunk colliders only when idle.

---

## 11. The Unity kit (editor-verified)

Unity project `altspace/` (portkit template, Creator SDK 4.0.29, Play-mode port 43400). Builder
`Assets/Kit/Editor/BrickKitBuilder.cs`; checks and test commands `Assets/Kit/Editor/BrickChecks.cs`; shader
`Assets/Kit/Shaders/BrickColor.shader`; sounds `Assets/Kit/Sounds`; page tests `Assets/WebRoot/playtest/`.
Evidence: `altspace/TESTS.md`.

### 11.1 Import

`python altspace/tools/import_upstream_bricks.py` runs portkit's importer with `upstream_import.json` (start files: the
66 types' held and placed prefabs, `Prefabs/BrickComponents/*`, `Prefabs/Hammer.prefab`; 170 data-only stand-ins from
`Assets/Scripts`, which compile; the importer skips the 73 LFS pointers it meets), then lays `GeneratedBrickModels/**` in at
`Assets/Upstream/Assets/Resources/BrickModels` with the upstream `.meta` files. In Unity (`PortKit/Bricks/Check Models`):
269 of 269 models import, the 18 `internalIDToNameTable` meshes resolve to their upstream fileIDs, every upstream
fileID resolves, and every slope faces the way its studs (or wall collider) say. The kit itself is built from
`ts/render.json` (written from the catalogue by `npm run render-info`) and the imported meshes, not from the upstream
prefabs, which are Normcore and XR Interaction Toolkit objects.

### 11.2 The kit

| Object | What it is | Script side |
|---|---|---|
| `Area` (`area`) | the build area's origin; `BuildArea`, `BrickLog`, 24 `BrickSegment`; the area's AudioSource with the 9 sounds | |
| `Area/Carpet` (`carpet`, click) | the floor, scaled to `width` x `depth` by the script (relay `scale`); a click places | `SurfaceClicked` |
| `Area/Chunks` (`chunks`, click) | the chunk renderer: `Template` (MeshFilter, MeshRenderer with `BrickChunk`), spawned per chunk; the chunks' MeshColliders live on `Chunks` itself, so a click on the build reaches the page | `BrickRenderer`, `SurfaceClicked` |
| `Ghost` (`ghost`) | one see-through child per brick type | `ShowGhost` |
| `Pool/Held0..11` (`held0..11`, grab, transform-synced) | the 12 held-brick slots: Rigidbody, BS Grababble, one child per type (Complete mesh, the held prefab's box colliders on the Grabbable layer) | `HeldBrick` (colour by relay `color`) |
| `Picker` | panel: 6 tabs, 65 tiles in 6 groups (`tile_<prefab>`), 12 swatches, preview, 3 HSV sliders (uGUI), status line | `PickerTab`, `PickerTile`, `Swatch`, `BuildArea.SetHsv` |
| `Tools` | Hammer (mode), Rotate, Lock, Save, Load buttons | `ToolButton` |
| `Hammer` (`hammer`, grab, transform-synced, kinematic) | handle and head; trigger while held removes the brick under the head; swung (0.6 m/s) it removes what it hits | `Hammer` |
| `Area/Spike` | the spike's option (a) templates (kept for re-running the spike; off) | |

Game relay ops (portkit README op table extension): `bricks` (records to a chunk, 11.3), `tint` (the picker's colour on
one material of this kit copy's own), `bspawn` (spike only).

### 11.3 Rendering (the spike's result)

Option (b) was chosen: chunks of 16 x 16 studs x 48 plates, one merged mesh each, built by the relay graph from brick
records. 2,000 bricks: 8 draw batches, merge after a placement median about 1 ms (worst 1.6 ms) plus 3 to 5 ms for the
chunk's collider, a late join drawn 0.21 s after the instance starts, no lost bricks. One object per brick (option (a))
needed 1,004 to 1,133 batches. Numbers, method and the rejected options: TESTS.md.

### 11.4 Controls

| | VR (unverified: no controllers in Play mode) | Desktop (rung 3, real input) |
|---|---|---|
| Choose a brick | laser click on a tile: selected, and spawned into that hand (AttachToHand), released when the grip is let go | click a tile |
| Colour | click a swatch, drag the sliders | the same |
| Place | let go of a held brick near studs (snap, ghost while held) | click the carpet or a brick's top; Rotate turns it |
| Take a brick off the build | grip with the hand inside it: it comes into the hand | Hammer mode and click it (removes it) |
| Remove | swing the hammer into the build (every brick within its blast, at most 200), or pull the trigger while holding it (the smallest blast) | Hammer mode and click (one brick) |
| Hand spawner | hold A/B/X/Y 0.4 s inside a brick or on a picker tile to set, press to spawn | (none) |
| Lock, save, load | buttons | buttons |

### 11.5 Kit gaps found (portkit, not edited here)

All six were closed by the kit pass (portkit `d8f370d`, `f3eaaa1`; GAPS.md) and this port now uses the fixes: the
importer skips LFS pointers, `remote.sh compile` reports compile errors (no log grep), `GraphWriter.NewStruct` /
`SetChained` / `SetListItem` / `NewList` replace the builder's own graph code, the README documents `whenEmpty`, and
the builder sets `GizmoSize` and `PhotoRoot`.

| Gap | Where | Proposed fix |
|---|---|---|
| The importer copies Git LFS pointer files as if they were assets (Unity then fails to import them) | `portkit/tools/importer/import_upstream.py` (`main`, the copy loop) | skip a file whose first bytes are `version https://git-lfs.github.com/spec/v1` (and its `.meta`) and report the count; this game works around it in `altspace/tools/import_upstream_bricks.py` |
| `remote.sh compile` said "no compile errors" while the editor log had `error CS0102` (the menu then was missing) | `portkit/tools/remote.sh` / `unity/Editor/Remote/PortKitRemote.cs` compile command | read the compiler messages of the last compilation (`CompilationPipeline.assemblyCompilationFinished`) rather than the console; this game's `tools/rebuild_kit.sh` greps the editor log |
| No graph helpers for struct values: `CreateStruct`, Set Member on a struct with `chainable` (its `targetOutput`), Set List Item, Create List with no inputs | `portkit/unity/Editor/Graphs/GraphWriterExtras.cs` | add `Struct(type)`, `SetField(owner, name, target, value)` (chainable), `SetListItem(list, index, item)`, `NewList()`; this game has them as private helpers in `BrickKitBuilder.cs` |
| The runtime resets an empty room's instance by default (`whenEmpty: "reset"`); a game whose state should outlive the visitors must know to opt out | `portkit/README.md` (Runtime shape) | say it in the README next to `GameDefinition.options`; this game sets `whenEmpty: "keep"` |
| The snippet markup's box gizmo is the kit's footprint; a game whose size is a setting (width, depth) cannot make it follow | `portkit/unity/Editor/Kit/KitArtifacts.cs` `Markup` | let a builder override the gizmo size (or skip the box) |
| The kit photo frames the whole footprint from far away; for a flat kit it shows mostly floor | `KitArtifacts.Photos` | let a builder give the photo's camera |

### 11.6 Re-sync to portkit `c971100` (2026-11-25)

`portkit/tools/sync.sh brick-builder` (unity/ and ts/ mirrored; no game source change needed: the game uses no draws,
deals, commands, attachments, head readings or reach checks, and had no workaround for any third-pass row). Nothing to
remove. `npm test` 38/38 (the kit's own 110/110 from the game's copy). Evidence: `altspace/TESTS.md` (sections marked
"re-synced to portkit `c971100`").

- Rebuilt (Build Prefabs, script, Build Bundles, Check: rung 2 PASS). From the kit: the relay graph gains `pkHead` and
  per-target launches (857 -> 912 units, all allowed); the 13 grabbables (12 pool slots, the hammer) carry a
  `BSPlayerEvents` with its events made, the kit's workaround for the SDK's null `onClick` in `BSScene.Click` (26 more
  behaviours in the bundle); `dist/licenses/brick-builder/` holds the six licence texts; the photo and footprint count
  the picker's world-space uGUI. `GizmoSize` and `PhotoRoot` stay (they are not uGUI make-up: the area's size is a
  setting, and the whole kit's photo would be mostly carpet).
- Description and credits wording fixed (9.3). The longer credits line lost its last line on the panel in the first
  build (seen in the photo), so the credits text now shrinks to fit (TextMesh Pro auto size 0.26-0.32).
- Bundles (`dist/`): Android 3,021,299 -> 3,032,666 bytes, Windows 3,487,447 -> 3,500,078; script 763,355 -> 776,174.
- Rung 3 20/0 and rung 4 14/0, each twice in a row, after one fix to the Play-mode test: its wait before reading
  `renderstats` could pass before the page's next `Update` had sent the change (TESTS.md rung 3); now it waits until every
  brick holds a chunk slot as well. The game's renderer did not change.
- Newly verified: nothing the game relies on; the `BSPlayerEvents` on the pool slots and the hammer did not change the
  held-brick and hammer checks (grab, let go, snap, trigger), which pass as before.
