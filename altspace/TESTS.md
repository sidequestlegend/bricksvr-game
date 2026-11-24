# brick-builder: test evidence

Everything here ran on 2026-11-24 on Windows, Unity 6000.3.21f1, Creator SDK 4.0.29, in the Unity editor. Nothing ran
in the Altspace app, on a Quest, or with controllers (rung 5: not run; worlds stay Private).

How to run each rung again:

```
cd altspace/ts && npm test                                                     rungs 0 and 1
cd altspace/ts && npm run golden                                               remake vectors/upstream.json (dotnet 8)
python altspace/tools/import_upstream_bricks.py                                the upstream import (LFS pointers skipped, generated models laid in)
altspace/tools/rebuild_kit.sh                                                  compile, Build Prefabs, script, bundles, Check (rung 2)
portkit/tools/remote.sh altspace menu "PortKit/Bricks/Check Models"           the regenerated models in Unity (Logs/brick_models.txt)
portkit/tools/playtest.sh altspace altspace/playtest/spike.json brick-builder   the rendering spike, option (b) (and spikeA.json, spikeA2.json: option (a))
portkit/tools/playtest.sh altspace altspace/playtest/single.json brick-builder  rung 3
portkit/tools/remote.sh altspace menu "PortKit/Multiplayer/Activate Player 2"
portkit/tools/playtest.sh altspace altspace/playtest/multi.json brick-builder   rung 4
```

The page side of the Play-mode tests is `Assets/WebRoot/playtest/brick-playtest.js` (spike, helpers) and
`brick-rungs.js` (rungs 3 and 4); the editor side adds the test commands `renderstats` (UnityStats and what the chunk
renderer holds) and `framems` (`Assets/Kit/Editor/BrickChecks.cs`). Full logs: `playtest/evidence_*.txt`.

## Rung 0: static

`npm run typecheck` (tsc, strict) and `npm run lint`: clean (`lint: src, portkit/src clean (page and clock rules)`).

## Rung 1: Node (no Unity)

`npm test` in `altspace/ts`: **25 tests, 25 pass, 0 fail** (portkit `1118ef0`, re-synced). The golden vectors (upstream
`BrickAttachDetector.cs`, `LegoConnectorScript.cs`, `ColorInt.cs` compiled unchanged with dotnet 8: 650 snapping situations,
64 colours) and the scenarios are described in PORT.md 9.1 and 9.2. New since the analysis:

```
ok 12 - records: new bricks append, removed ones empty their slot, a freed slot is reused
ok 13 - records: a build cleared and put back in one pass (Load) keeps every brick drawn
ok 18 - the room empties: the build stays for the next visitor (whenEmpty keep), also after a reload of the only page
# MEASURE renderer after the rebuild: 8 chunks, largest 384 bricks; 8 ops, 2000 records, 63786 bytes sent; idle true
```

Test 18 was written after Play mode showed a reload of the only page losing the build: the runtime's default
`whenEmpty: "reset"` starts an empty room's instance afresh. The game now declares `options: { whenEmpty: "keep" }`
(`src/index.ts`); the test fails with "reset" and passes with "keep". Test 13 was written after rung 3 showed a Load
(clear and place again in one pass) leaving the chunk's slots empty; fixed in `BrickRenderer.update`.

## Rung 2: the kit in edit mode (`PortKit/Kit/Check`)

```
PASS graphs: the SDK's check found 0 nodes the app will not run
PASS brick-builder bindings: 114 objects resolve by path; hash matches (c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9)
PASS brick-builder android bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 243/11088, behaviours 232, scripts 11, ...
PASS brick-builder windows bundle: PASS Kind=Pass Reasons=[] Reports=[] ...
DONE
```

The relay graph has 798 units and uses 68 distinct members, all on the SDK allow list of 29,061 (it carries the game's
ops `bricks`, `bspawn` (spike only) and `tint`). The kit: 3,393 objects, 114 bound (13 synced, 13 grabbable, 90 clickable),
7 refs, 127 behaviours, 6 events. Bundles: Android 2,939 KiB, Windows 3,394 KiB, each with the third-party notices; no
textures (the brick shader has no scratch texture; the UI is flat colours and TextMesh Pro).

### The regenerated brick models in Unity (`PortKit/Bricks/Check Models`, `Logs/brick_models.txt`)

The generator could not check two things without Unity; both hold:

```
PASS regenerated models import: 269 of 269 FBX give a mesh
PASS the 18 meshes mapped through internalIDToNameTable resolve to their upstream fileIDs
PASS every upstream fileID of every regenerated model resolves
PASS mesh references in the imported upstream prefabs: 149 of 459 resolve; 310 point at GUIDs no file of the upstream repository has (in 1x4BrickBody.prefab, 2x2BrickBody.prefab, 4x2BrickBody.prefab, BrickStud.prefab, BrickTube.prefab, Hammer.prefab: the kit rebuilds those from bricks.json); broken references to upstream files: 0
PASS slope 1x2Slope faces the way its studs say after import: top centre (0.004, 0), studs at x 0.004
PASS slope 1x3Slope ... top centre (0.008, 0), studs at x 0.008
PASS slope 1x4Slope ... top centre (0.012, 0), studs at x 0.012
PASS slope 2x2Slope ... top centre (0.004, 0), studs at x 0.004 0.004
PASS slope 2x2CornerSlope ... top centre (0.004, 0.004), studs at x 0.004
PASS slope 3x3CornerSlope ... top centre (0.008, 0.008), studs at x 0.008
PASS slope 4x4CornerSlope ... top centre (0.012, 0.012), studs at x 0.012
PASS slope 1x2SlopeInverted ... underside centre x 0.004, studs x 0
PASS slope 1x1-2_3Slope ... top centre (0.004, 0), the held prefab's upright wall collider at x 0.025
PASS slope 1x4-2_3Slope ... top centre (0.004, 0), the held prefab's upright wall collider at x 0.025 (runs along Z)
DONE
```

The slope check compares two independent sources: where the imported mesh is high (the vertices in its top 15 %)
against where the held prefab's male connectors (studs) or its upright wall collider are. So Unity's X mirror on FBX
import is as the generator assumed, and the 18 fileIDs kept through `internalIDToNameTable` resolve to the upstream ids.
The 18 are Complete meshes, tile bodies and the unused figure `Bob` (list in `playtest/evidence_models.txt`).

## The rendering spike (`playtest/spike.json`, `spikeA.json`, `spikeA2.json`)

The question: how to draw 2,000 placed bricks in one build area. Pass rule from the plan: at most 100 draw batches
for the bricks, chunk rebuild within 8 ms after a placement, late-join build within 5 s, no lost bricks. Measured in
Play mode on this machine (Windows, DX12, editor Game view), with `UnityEditor.UnityStats` read by the test command
`renderstats` a few frames after each step (batches with the bricks minus batches before them), and timings taken in
Unity by the graph itself (`Time.realtimeSinceStartup` around the merge, reported to the page with each chunk).
The build is the Node tests' plan: 2,000 2x2 bricks and plates in 167 columns, every brick a colour of its own.

| | (a) one object per brick | (a2) the same, one shared material | **(b) chunks merged by the relay graph** |
|---|---|---|---|
| How | relay op `bspawn`: `GameObject.Instantiate` of a per-type template, `SetLocalPositionAndRotation`, colour by `renderer.material.SetColor` | the same without a colour of its own (GPU instancing on the material) | records to op `bricks`; the graph keeps one `CombineInstance` per brick slot per chunk and runs `Mesh.CombineMeshes`; colour per brick through `lightmapScaleOffset` into UV1 |
| Draw batches for 2,000 bricks | **1,133** | **1,004** (instanced batches 0: URP's SRP Batcher takes precedence, and MaterialPropertyBlock is not on the allow list) | **8** (one per chunk; 6 to 8 across runs) |
| Building 2,000 | 2,764 ms | 2,229 ms | 358-526 ms on the page from the first Place to the last chunk drawn; merge 126-200 ms in all, worst chunk (384 bricks) 23-46 ms |
| Rebuild after one placement | (n/a: one object) | | **merge median 0.90-1.04 ms, worst 1.40-1.64 ms** over 10 placements; plus the chunk's collider (for clicks on the build) median 2.6-3.0 ms, worst 2.8-4.8 ms; page to drawn 52-54 ms median (a tick and a frame) |
| Late join (reload) | would need its own records and a second channel: not built | | **208-229 ms from the instance's start to every chunk drawn** (merge 121-122 ms, worst chunk 23 ms); the page and the kit take 5.07 s to load before the instance starts, with or without bricks |
| Frame time with 2,000 (editor) | mean 9.1 ms, worst 31 ms | mean 7.0 ms, worst 13.5 ms | mean 5.1-7.8 ms, worst 7.5-21.8 ms |
| Lost bricks | | | none: 2,000 of 2,000 drawn, then 2,010 of 2,010, and 2,010 after the reload |
| Triangles drawn | 358,864 | 343,904 | 55,936 (bodies and studs per look: a brick whose studs are all covered draws none, a covered underside draws the flat body) |

**Chosen: (b).** It passes every part of the rule; (a) fails the batch rule tenfold, and its colours cost a material each.

(c) **`BS.AOBaking`** (on the allow list, documented in the SDK's `Docs/components/special.md`) was ruled out on reading:
it merges a parent's children *per material*, so per-brick colours would need a material per colour (as (a)), it
needs every brick as a child object first (as (a)), and a bake raycasts every vertex for ambient occlusion, which is
far from an 8 ms rebuild. `ParticleSystem.SetParticles` with mesh particles (also on the list) was not tried: (b)
already passes. `Graphics.DrawMeshInstanced` and `MaterialPropertyBlock` are not on the allow list.

How (b) works (README op table of this game, `Assets/Kit/Editor/BrickKitBuilder.cs` `RelayOps`, `ts/src/BrickRenderer.ts`):
- The page (`BrickRenderer`) gets the changed chunks from `BuildArea.RenderChunks()` every tick and sends one op per
  chunk: `bricks | @Area/Chunks/<chunk> | "<slot>,<mesh>,<x>,<y>,<z>,<ori>,<rgb>;..." | <collider 1/0>`. Slots are stable
  per brick id; a freed slot is reused; only slots whose look changed are sent (a placement sends the new brick and the
  bricks whose covered studs or underside changed). 2,000 bricks are 63,786 bytes in 8 ops.
- The graph spawns `Area/Chunks/<chunk>` from a template (relay op `spawn`), keeps the chunk's `CombineInstance` list in
  an Object variable, sets or appends the changed slots (mesh from the kit's list `PkMeshes`: 1 + 4 x type + variant,
  orientation from `PkOris`, the 24 cube rotations), and runs `Mesh.CombineMeshes(list, true, true, true)` into the
  chunk's mesh (UInt32 indices).
- Colour per brick without a MaterialPropertyBlock: each CombineInstance gets `lightmapScaleOffset = (0, 0, rgb, 0)`.
  With `hasLightmapData` the merge writes UV1 = uv1 x scale + offset, and a zero scale makes every vertex of that brick
  carry its colour exactly. `Assets/Kit/Shaders/BrickColor.shader` (upstream's PerInstanceColor remade for URP and the
  Quest: single-pass instanced stereo, main light plus ambient, no shadows) unpacks it.
- Four meshes per type, made by the kit builder from the regenerated models (`Assets/Kit/Meshes`): hollow body + studs,
  solid body + studs, hollow body, solid body. Upstream combined a body with one stud per *uncovered* stud
  (BrickAttach.RecalculateRenderedGeometry); here studs are all or nothing (a partly covered brick keeps its covered studs,
  hidden inside the brick above): 4 meshes per type instead of a mesh cache per stud mask.
- The chunk's collider is a MeshCollider on the one clickable object `Area/Chunks` (one per chunk, made by the graph),
  so a click on the build reaches the page with its point and normal (desktop placing and the desktop hammer).

## Rung 3: Play mode, one player (`playtest/single.json`)

A hand-written `<bs-snippet name="brick-builder" ...>` with the built script and both bundles from the test's local server.
Everything below is the SDK's desktop player driven by portkit's InputSim (real clicks and grabs), checked in Unity
with `probe` and `renderstats`. **RESULT 17 passed, 0 failed** (`playtest/evidence_single.txt`, picture
`playtest/evidence_single_built.jpg`). Console: one error line, Unity's own `UnityEditor.Search.SearchDatabase`
indexing (`ArgumentOutOfRangeException` in `SearchInit.IndexationOnStartup`), at every Play start, not the kit's.

```
PASS the kit loads from a hand-written bs-snippet and the instance starts: at 5666 ms after the page opened
PASS a category tab shows its bricks: category 1; Cat1 active True, Cat0 active False
PASS a click on a picker tile selects that brick: {"type":7,"prefab":"2x2",...}
PASS a swatch sets the colour; the picker's bricks show it (relay op tint): colour 55bf, tile 0.000 0.333 0.749 1.000
PASS clicks on the carpet place the selected brick in the selected colour, snapped to the studs: [["2x2",[-360,48,-840],"55bf"],["2x2",[40,48,-840],"55bf"],["2x2",[440,48,-840],"55bf"]]
PASS a click on a brick's top puts the next brick on its studs (the build is clickable): ["2x2",[-360,144,-840],"f2cd37"]
PASS every placed brick is drawn by the chunk renderer: 4 drawn of 4; ...
PASS a held brick grabbed and let go above the carpet snaps, and its pool slot is free again: slot 2 at 0.560 0.031 -0.280; bricks 4 -> 5; slot {"t":-1,...}
PASS the hammer removes the brick it hits, for the renderer too: hammer true, marker True; 5 -> 4 bricks; drawn 4
PASS the hammer's trigger away from the build removes nothing: ok; 4 bricks
PASS the owner locks the area (protected state); the status line says so: locked true; status '2x2 Brick   4 bricks   locked (you may build)'
PASS and unlocks it again: false
PASS the kit loads ... (after the reload) at 5655 ms after the page opened
PASS after a reload the build is there again (late join from room state): 5 of 5 bricks, digest 5:c7274e1f
PASS and every brick of it is drawn: 5 drawn; ...
PASS Load puts back the build saved on this device: 4 bricks, saved 4
PASS the loaded build is drawn: 4 drawn
```

**AttachToHand in Play mode** (portkit lists it as unverified): a pool slot attached to the right hand moved from where
it lay (`0.000 0.032 -0.840`) to the desktop player's hand anchor (`0.000 1.600 0.000`, the camera's position) and stayed
there when the camera turned; letting go detached it (it then lay loose and went back to the pool after 6 s). So in Play
mode `BS.AttachedObject` does take the object to the local player; whether it follows a real controller is unverified.
The kit uses it for a brick taken from the build with the grip and for a picker tile clicked in VR (both VR only).

What a person at the editor would see differently: the desktop grab does not follow InputSim's pointer (portkit
RESULTS.md), so the held-brick test lets go in place (the brick was put just above the carpet); the first grab of a
Play session lets go by itself, so the test spends it on the hammer first.

## Rung 4: two Local Multiplayer players (`playtest/multi.json`)

`PortKit/Multiplayer/Activate Player 2`, then the test on both pages. **RESULT 14 passed, 0 failed**
(`playtest/evidence_multi.txt`).

```
[main]  PASS two players in the room: Main Editor, Player 2
[vp-..] PASS this player placed three bricks by clicking the carpet: 3          (both players click at the same time)
[main]  PASS this player placed three bricks by clicking the carpet: 3
[main]  PASS both players' bricks arrive on this page and are drawn: 6 bricks, 6 drawn
[vp-..] PASS both players' bricks arrive on this page and are drawn: 6 bricks, 6 drawn
[main]  PASS both pages show identical builds (digests): 6:64229b95 / 6:64229b95
[vp-..] PASS both pages show identical builds (digests): 6:64229b95 / 6:64229b95
[main]  INFO B reloads its page                                                  (A places one more brick while B is away)
[main]  PASS late join by reload: the build is rebuilt and drawn: 7 bricks (had 6), drawn 7
[vp-..] PASS the reloaded page rebuilds everything, the brick placed while it was away too (digests): 7 bricks, 7:1a27ca4 / 7 bricks, 7:1a27ca4
```

## Artifacts

`PortKit/Kit/Take Photos`, `PortKit/Kit/Export Artifacts` -> `altspace/dist/` (not committed): `android/brick-builder`
(3,009,783 bytes), `windows/brick-builder` (3,478,107 bytes), `pk-brick-builder.js` (730,330 bytes, MIT header),
`brick-builder.jpg`, `brick-builder.snippet.html` (settings room, width, depth, height, performance; box gizmo 3.6 x 4.6 m),
`manifest.json` (checks android PASS, windows PASS, bindings `c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9`).

## Not verified (needs the app, a headset or controllers)

Everything in the app and on a Quest (rung 5): Quest frame time with 2,000 bricks (55,936 triangles, 8 draws), the
Android shader variant, VS speed on IL2CPP (the late-join merge took 121 ms in the editor), bridge latency. The VR
paths, because controller events do not fire in Play mode: the grip on a placed brick (pick up into the hand with
AttachToHand), the hand spawner (A/B/X/Y held and pressed), a picker tile clicked with a laser putting the brick in
the hand, the grabbable hammer swung into the build, the ghost while a brick is held, haptics. The HSV sliders (uGUI,
relayed as `uiSlider`) were not moved in the test (the swatches were). The left hand.
