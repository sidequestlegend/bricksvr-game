# brick-builder: test evidence

Everything here ran on 2026-11-24 (first Unity phase) and 2026-11-25 (after the review, and again after the re-sync to portkit `c971100`; sections say which) on Windows, Unity 6000.3.21f1, Creator SDK 4.0.29, in the Unity editor. Nothing ran
in the Altspace app, on a Quest, or with controllers (rung 5: not run; worlds stay Private).

How to run each rung again:

```
cd altspace/ts && npm test                                                     rungs 0 and 1
cd altspace/ts && npm run golden                                               remake vectors/upstream.json (dotnet 8)
python altspace/tools/import_upstream_bricks.py                                the upstream import (LFS pointers skipped, generated models laid in)
altspace/tools/rebuild_kit.sh                                                  compile, Build Prefabs, script, bundles, Check (rung 2)
portkit/tools/remote.sh altspace menu "PortKit/Bricks/Check Models"           the regenerated models in Unity (Logs/brick_models.txt)
portkit/tools/playtest.sh altspace altspace/playtest/spike.json brick-builder   the rendering spike, option (b) (and spikeA.json, spikeA2.json: option (a))
portkit/tools/playtest.sh altspace altspace/playtest/single.json brick-builder  rung 3 (playtest.sh deactivates leftover players)
portkit/tools/playtest.sh altspace altspace/playtest/multi.json brick-builder   rung 4 (playtest.sh activates Player 2 and waits for it)
```

The page side of the Play-mode tests is `Assets/WebRoot/playtest/brick-playtest.js` (spike, helpers) and
`brick-rungs.js` (rungs 3 and 4); the editor side adds the test commands `renderstats` (UnityStats and what the chunk
renderer holds) and `framems` (`Assets/Kit/Editor/BrickChecks.cs`). Full logs: `playtest/evidence_*.txt`.

## Page script on portkit 552622c, 2026-11-25 evening

Re-synced `ts/portkit` and the package to portkit `552622c`. That commit includes `425bd55`: the page loads kit
items one at a time, because overlapping loads lost relay graphs and Variables in the app. It also includes
`0880bf5`: a referee claimant starts only once its claim has stood for 1.5 s, which fixes the equal-term double
claim, and user-state flushes go one at a time. The bundles are unchanged from the rebuild below. `npm test`:
**38 of 38** (0 failed). `npm run build`: 778991 bytes. Export Artifacts -> `dist/`: 11 files (6 licence texts), footprint 3.58 x 1.7 x 4.09 m, bindings c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9.

## Canvas colliders, 2026-11-25 evening (portkit 16be5ff: 476075d and 425bd55)

In world 9d7311 the SDK's `BSKitItem` gave every world-space canvas without a BoxCollider a solid one when the kit
loaded: rect x scale, on the canvas's layer. rp-toolkit's head-label canvas then pushed its wearer about (measured in
the hub's Play mode, portkit GAPS.md "Fourth pass"). Re-synced to portkit `16be5ff`. Its builder (`476075d`) gives every
world-space canvas a trigger box of its own first, and whose `PortKit/Kit/Check` fails a canvas that would end up
solid; `425bd55` also makes the page load kit items one at a time (overlapping loads lost relay graphs in the app). Rebuilt:

- Build Prefabs: 1 trigger boxes added to world-space canvases, 0 canvas boxes made triggers.
- rung 0/1: `npm test` **38 of 38** (0 failed). `npm run build`: 777441 bytes.
- rung 2: Check all PASS (bindings `c3c20bbb`, the new "canvas colliders" line, both bundles). Android 2960 KiB, Windows 3421 KiB.
- rung 3 (`playtest/single.json`, brick-single): **20 passed, 0 failed**, 1 console error lines (`playtest/evidence_single.txt`).
- rung 4 (`playtest/multi.json`, brick-multi): **14 passed, 0 failed**, 0 console error lines (`playtest/evidence_multi.txt`).
- `dist/` exported: 11 files (6 licence texts), footprint 3.58 x 1.7 x 4.09 m, bindings c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9.

## Rung 0: static

`npm run typecheck` (tsc, strict) and `npm run lint`: clean (`lint: src, portkit/src clean (page and clock rules)`).

## Rung 1: Node (no Unity)

**2026-11-25, re-synced to portkit `c971100`:** `npm test` in `altspace/ts`: typecheck and lint clean, **38 tests, 38
pass, 0 fail**; the kit's own suite run from the game's copy (`node --test portkit/test/*.test.ts`): 110 of 110. Every
measured number is unchanged but two: the 2,000-brick load reaches the other player after 2,700 ms virtual (was 2,800;
the same 3 space-state batches and 4 user-state writes), and the rebuild of 2,000 bricks took a median 29.8 ms (was
20.2 ms; wall-clock, with ten games' editors and tests on the machine). The game needed no source change: it uses none
of the APIs the kit changed (no draws or deals, commands, attachments, `findpos`, reach).

`npm test` in `altspace/ts`: **38 tests, 38 pass, 0 fail** (portkit `812f285`, re-synced 2026-11-25). The golden vectors
(upstream `BrickAttachDetector.cs`, `LegoConnectorScript.cs`, `ColorInt.cs` compiled unchanged with dotnet 8: 650
snapping situations, 64 colours) and the scenarios are described in PORT.md 9.1 and 9.2.

After the independent review (2026-11-25, `REVIEW-FINDINGS.md`): the golden harness builds every brick from the upstream
prefab YAML (`golden/PrefabYaml.cs`), so the vectors no longer share the port's catalogue; `test/catalogue.test.ts`
checks the catalogue's connector order against the prefabs' serialized `_maleConnectors` / `_femaleConnectors` and its
obstacles against their enabled colliders; `test/findings.test.ts` has one test per finding 3-15 (each fails on the code
before its fix: 9 of 9 checked by running them against the previous commit's sources) and `test/repack.test.ts` the
repack through the fake relay's message cap. With the first catalogue the new vectors give 163 disagreements.

```
ok 1 - connectors are in the order of the held prefabs' serialized _maleConnectors / _femaleConnectors
ok 2 - placed obstacles are exactly the placed prefabs' enabled solid colliders on the placed lego layer
ok 3 - a 1x1 plate fits under an arch, and an arch over a 1x1 plate (the arch's disabled root box is not solid)
ok 4 - 3: a full archive refuses new bricks with a notice; nothing placed is lost and the referee does not throw
ok 5 - 4: a record of an unknown brick type or orientation is ignored on ingest, never archived, never fatal
ok 6 - 6: the swung hammer blasts every brick within max(3, speed) units, at most 200, nearest first
ok 7 - 7: picking up with every pool slot in use leaves the brick where it is; a leaver's slot is freed
ok 8 - 8: a log's records count only under its own player's key
ok 9 - 9: a brick lying loose where a brick would snap blocks it, as upstream's lego layer does
ok 10 - 10: an archive write decodes only the segments that changed
ok 11 - 11: the hand spawner sets while the button is held (from a brick or a picker tile) and spawns with the offset
ok 12 - 15: a brick number covered by a surviving tombstone is never used again by its author
# MEASURE golden snapping: floor 150 (150 attach, worst position difference 0.86 u); brick 220 (161 attach, worst position difference 1.18 u); under 80 (79 attach, worst position difference 0.57 u); side 80 (51 attach, worst position difference 2.13 u); random 120 (62 attach, worst position difference 0.43 u); refused by the port as below the carpet (upstream attaches): 13; held side stud into a socket, placed differently: 0
ok 22 - snapping: 650 situations agree with the upstream C\#
# MEASURE repack: 19 segments before, largest state message 87681 bytes, sockets closed 0
ok 26 - 5: a repack of 18+ segments (over 256 KiB) arrives in parts: no oversize message, everyone converges
# MEASURE build 2000 bricks by 3 players over 33.6 s virtual: space-state batches 34 (peak 1/s, mean 1.01/s), user-state writes 508 (peak 16/s room-wide), rate_limited 0
# MEASURE rebuild of 2000 bricks from 3 segments: median 20.2 ms, min 19.6 ms (Node, this machine)
```

The models: `tools/bricks/verify_bricks.py` prints `problems: 0` for all 269 files (548 connectors matched); the plant
and pyramid files, now rebuilt from `BrickObjs/*.pobj`, match the dumps within 0.4 nm.

From the first Unity phase:

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

**2026-11-25, re-synced to portkit `c971100`** (`altspace/tools/rebuild_kit.sh`): PASS.

```
brick-builder_relay: 912 units, 319 control and 921 value connections, 72 distinct members, all on the allow list of 29061
   relay ops: clock, pkHead, text, active, ... rbLaunch, spawn, despawn, bricks, bspawn, tint; relayed events: 4
ok brick-builder: 3395 objects, 114 bound (13 synced, 13 grabbable, 90 clickable), 7 refs, 127 behaviours, 6 events; bindings c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9 -> ts/bindings.json
android brick-builder: 2962 KiB, with notices, licence texts: (the same six)
windows brick-builder: 3418 KiB, with notices, licence texts: (the same six)
PASS graphs: the SDK's check found 0 nodes the app will not run
PASS brick-builder bindings: 114 objects resolve by path; hash matches (c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9)
PASS brick-builder android bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 271/11129, behaviours 259, scripts 12, ...
PASS brick-builder windows bundle: PASS Kind=Pass Reasons=[] Reports=[] ...
DONE
```

What the kit changed: the relay graph gains `pkHead` and the per-target launch list (857 -> 912 units, 69 -> 72
members, still all allowed); the 13 grabbables each gain a `BSPlayerEvents` with its events made (the kit's workaround
for the SDK's null `onClick` in `BSScene.Click`), so the bundle holds 26 more behaviours (233 -> 259) and one more script
type. Bindings unchanged. The description and the in-world credits no longer say all brick models are "regenerated plain
shapes" (the plants and pyramid are upstream's own meshes); the longer credits line set to shrink to fit its panel
(TextMesh Pro auto size 0.26-0.32) instead of losing its last line, which the first build of this pass did (seen in the
photo). Bundle sizes (`dist/`, bytes): Android 3,021,299 -> 3,032,666, Windows 3,487,447 -> 3,500,078.

**2026-11-25, after the review** (portkit `812f285`; `altspace/tools/rebuild_kit.sh`): PASS.

```
brick-builder_relay: 857 units, 305 control and 863 value connections, 69 distinct members, all on the allow list of 29061
ok brick-builder: 3395 objects, 114 bound (13 synced, 13 grabbable, 90 clickable), 7 refs, 127 behaviours, 6 events; bindings c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9 -> ts/bindings.json
android brick-builder: 2950 KiB, with notices, licence texts: BricksVR-LICENSE-MIT.txt, CC0-1.0-legalcode.txt, portkit-LICENSE-MIT.txt, LICENSE-kenney-casino-audio.txt, LICENSE-kenney-interface-sounds.txt, LiberationSans - OFL.txt
windows brick-builder: 3406 KiB, with notices, licence texts: (the same six)
PASS graphs: the SDK's check found 0 nodes the app will not run
PASS brick-builder bindings: 114 objects resolve by path; hash matches (c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9)
PASS brick-builder android bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 244/11102, behaviours 233, scripts 11, ...
PASS brick-builder windows bundle: PASS Kind=Pass Reasons=[] Reports=[] ...
DONE
```

The relay graph now uses the kit's `NewStruct` / `SetChained` / `SetListItem` / `NewList` (857 units, was 798 with the
builder's own helpers: `NewStruct` is a step of its own). Bundles grew 11 KiB each (2,939 -> 2,950 KiB Android,
3,396 -> 3,406 KiB Windows): the six licence texts. `PortKit/Bricks/Check Models` (`Logs/brick_models.txt`) passes as
before and adds the models rebuilt from upstream's dumps, as Unity imports them:

```
PASS Plants/Plant_Green_Flat.fbx as imported matches upstream's BrickObjs/FlatPlant.pobj: worst vertex 0 um; bounds (-0.00524, -0.00165, -0.00605) .. (0.00524, 0.00262, 0.00605)
PASS Plants/Plant_Green_MediumHeight.fbx as imported matches upstream's BrickObjs/ThreeLeafedPlant.pobj: worst vertex 0 um; bounds (-0.00556, -0.00165, -0.00642) .. (0.00556, 0.00689, 0.00392)
PASS Pyramids/Brick_1x1_Pyramid/Brick_1x1_Pyramid_Complete.fbx as imported matches upstream's BrickObjs/1x1Pyramid.pobj: worst vertex 0 um; ...
PASS Pyramids/Brick_1x1_Pyramid/Brick_1x1_Pyramid_SolidBody.fbx as imported matches upstream's BrickObjs/1x1Pyramid.pobj: worst vertex 0 um; ...
```

The dumps are the meshes as upstream's Unity loaded them, so this also confirms, on asymmetric parts, the X mirror the
generator assumes for Unity's FBX import.

First Unity phase (2026-11-24):

```
PASS graphs: the SDK's check found 0 nodes the app will not run
PASS brick-builder bindings: 114 objects resolve by path; hash matches (c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9)
PASS brick-builder android bundle: PASS Kind=Pass Reasons=[] Reports=[] Stats=files 1 (format 22), scenes 0, objects 243/11088, behaviours 232, scripts 11, ...
PASS brick-builder windows bundle: PASS Kind=Pass Reasons=[] Reports=[] ...
DONE
```

The relay graph has 798 units and uses 68 distinct members, all on the SDK allow list of 29,061 (it carries the game's
ops `bricks`, `bspawn` (spike only) and `tint`). The kit: 3,395 objects, 114 bound (13 synced, 13 grabbable, 90 clickable),
7 refs, 127 behaviours, 6 events. Bundles: Android 2,939 KiB, Windows 3,396 KiB, each with the third-party notices; no
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

**2026-11-25, re-synced to portkit `c971100`, on the rebuilt bundles: RESULT 20 passed, 0 failed, twice in a row**
(`playtest.sh --keep-play`; `playtest/evidence_single_run1.txt`, `playtest/evidence_single.txt`). Console: the same one
SDK line per run (`Failed to load after 25 seconds ... no component is still loading (1 registered)`; the instance
started at 5,512 ms and every check passed).

The first two runs on these bundles failed renderer counts: run 1 19/1 (the hammer removed the brick, 5 -> 4 bricks,
but `renderstats` said 5 drawn), run 2 18/2 (that, and "3 drawn of 4" after the stacked brick;
`playtest/evidence_single_race.txt`). Every later check in both runs saw the renderer complete (the arch check "6 drawn
of 6", the reload "7 drawn"), so the build was drawn, only read too early. Cause, in the test: the renderer sends a
change in the page's next `Update`, and its `idle` ("every record sent has been reported built") is already true in
between, so `until(idle)` returned before anything was sent and `renderstats` read Unity before the change. It passed
before because the round trip happened to outlast a frame; with ten editors on the machine it did not. The test now
waits for `settled`: `idle` and every brick of the ledger holding a chunk slot (the renderer has seen the change), at
each of the seven places that read `renderstats` after a change (`Assets/WebRoot/playtest/brick-rungs.js`). The checks
themselves are unchanged (drawn equals bricks); the wait only got stricter. The game's renderer is unchanged.

**2026-11-25, after the review, on the rebuilt bundles: RESULT 20 passed, 0 failed, twice in a row**
(`playtest/evidence_single_run1.txt`, `playtest/evidence_single.txt`; picture of the new arch check
`playtest/evidence_single_arch.jpg`). Three checks are new, for what the fixes changed that Play mode can show:

```
[main] PASS an arch goes over a 1x1 plate on the carpet, and both are drawn: plate true, arch ...#8; 6 drawn of 6
[main] PASS a full area refuses new bricks and the status line says so: 222 placed before the refusal; status '2x2 Brick   228 bricks   AREA FULL: remove bricks to build more'
[main] PASS removing bricks makes room again: 222 removed; status '2x2 Brick   6 bricks'
```

(the full-area check makes the archive's segments 300 bytes through a test hook, so 24 segments fill at about 230
records). The other 17 checks are the earlier ones, all passing (placing by clicks, stacking, the held brick from the
pool, the desktop hammer, the lock, save, reload, Load). Console: one error line per run, the SDK's
`Failed to load after 25 seconds: http://localhost:43400 (state SCENE_START): no component is still loading (1 registered)`
(the page and the kit had loaded: the instance started at 5,691 ms and every check passed); the first phase's line was
Unity's SearchDatabase indexing instead. `playtest.sh` deactivated no leftover players (none running).

First Unity phase (2026-11-24):

A hand-written `<bs-snippet name="brick-builder" ...>` with the built script and both bundles from the test's local server.
Everything below is the SDK's desktop player driven by portkit's InputSim (real clicks and grabs), checked in Unity
with `probe` and `renderstats`. **RESULT 17 passed, 0 failed** (`playtest/evidence_single.txt`, picture
`playtest/evidence_single_built.jpg`). Console: one error line, Unity's own `UnityEditor.Search.SearchDatabase`
indexing (`ArgumentOutOfRangeException` in `SearchInit.IndexationOnStartup`), at every Play start, not the kit's.

```
PASS the kit loads from a hand-written bs-snippet and the instance starts: at 5453 ms after the page opened
PASS a category tab shows its bricks: category 1; Cat1 active True, Cat0 active False
PASS a click on a picker tile selects that brick: {"type":7,"prefab":"2x2",...}
PASS a swatch sets the colour; the picker's bricks show it (relay op tint): colour 55bf, tile 0.000 0.333 0.749 1.000
PASS clicks on the carpet place the selected brick in the selected colour, snapped to the studs: [["2x2",[-360,48,-840],"55bf"],["2x2",[40,48,-840],"55bf"],["2x2",[440,48,-840],"55bf"]]
PASS a click on a brick's top puts the next brick on its studs (the build is clickable): ["2x2",[-360,144,-840],"f2cd37"]
PASS every placed brick is drawn by the chunk renderer: 4 drawn of 4; ...
PASS a held brick grabbed and let go above the carpet snaps, and its pool slot is free again: slot 8 at 0.560 0.031 -0.280; bricks 4 -> 5; slot {"t":-1,...}
PASS the hammer removes the brick it hits, for the renderer too: hammer true, marker True; 5 -> 4 bricks; drawn 4
PASS the hammer's trigger away from the build removes nothing: ok; 4 bricks
PASS the owner locks the area (protected state); the status line says so: locked true; status '2x2 Brick   4 bricks   locked (you may build)'
PASS and unlocks it again: false
PASS the kit loads ... (after the reload) at 5033 ms after the page opened
PASS after a reload the build is there again (late join from room state): 5 of 5 bricks, digest 5:92ee23d4
PASS and every brick of it is drawn: 5 drawn; ...
PASS Load puts back the build saved on this device: 4 bricks, saved 4
PASS the loaded build is drawn: 4 drawn
```

**AttachToHand in Play mode** (portkit lists it as unverified): a pool slot attached to the right hand moved from where
it lay (`0.000 0.032 -0.840`) to the desktop player's hand anchor (`0.000 1.600 0.000`, the camera's position) and stayed
there when the camera turned; letting go detached it (it then lay loose and went back to the pool after 6 s). So in Play
mode `BS.AttachedObject` does take the object to the local player; whether it follows a real controller is unverified.
The kit uses it for a brick taken from the build with the grip and for a picker tile clicked in VR (both VR only).

(First Unity phase: rung 3 had to run with Player 2 deactivated by hand, since a clone left running from rung 4
loaded the same test page; `playtest.sh` now deactivates leftover players itself, portkit `d8f370d`.)

What a person at the editor would see differently: the desktop grab does not follow InputSim's pointer (portkit
RESULTS.md), so the held-brick test lets go in place (the brick was put just above the carpet); the first grab of a
Play session lets go by itself, so the test spends it on the hammer first.

## Rung 4: two Local Multiplayer players (`playtest/multi.json`)

**2026-11-25, re-synced to portkit `c971100`, on the rebuilt bundles: RESULT 14 passed, 0 failed, twice in a row**
(`playtest/evidence_multi_run1.txt`, `playtest/evidence_multi.txt`; "Player 2: Launched (Clone)"; console 0 error lines;
with the `settled` wait above). Digests at equal state: run 1 `6:8c3b9317` on both pages, `7:9cf18dc6` on both after the
reload (this time the main editor's page was the one that reloaded); run 2 `6:60a4b93c`, then `7:208ee080` on both.

**2026-11-25, after the review, on the rebuilt bundles: RESULT 14 passed, 0 failed, twice in a row**
(`playtest/evidence_multi_run1.txt`, `playtest/evidence_multi.txt`; `playtest.sh` activated Player 2 and waited for
it, "Player 2: Launched (Clone)"; console 0 error lines). Digests at equal state on both pages:

```
[main] PASS both pages show identical builds (digests): 6:2cb9aa36 / 6:2cb9aa36
[main] PASS the reloaded page rebuilds everything, the brick placed while it was away too (digests): 7 bricks, 7:c2dc067c / 7 bricks, 7:c2dc067c
[vp-mppm3fdcd393] PASS late join by reload: the build is rebuilt and drawn: 7 bricks (had 6), drawn 7
```

(run 1: `6:42ba2f89` on both pages, then `7:3970bf84` on both after the reload).

First Unity phase (2026-11-24):

`PortKit/Multiplayer/Activate Player 2`, then the test on both pages. **RESULT 14 passed, 0 failed**
(`playtest/evidence_multi.txt`).

```
[main] PASS the kit loads from a hand-written bs-snippet and the instance starts: at 5652 ms after the page opened
[main] PASS two players in the room: [{"id":1,"name":"Main Editor","sid":"rsess_7a0f5070-c04e-4e07-a8d2-9f8d27226a7c"},{"id":2,"name":"Player 2","sid":"rsess_c4557961-d6cf-48e1-af95-50d159e9c21c"}]
[main] INFO A is rsess_7a0f5070-c04e-4e07-a8d2-9f8d27226a7c
[main] PASS this player placed three bricks by clicking the carpet: 3
[main] PASS both players' bricks arrive on this page and are drawn: 6 bricks, 6 drawn
[main] PASS both pages show identical builds (digests): 6:4443baf8 / 6:4443baf8
[main] PASS the reloaded page rebuilds everything, the brick placed while it was away too (digests): 7 bricks, 7:45be76f7 / 7 bricks, 7:45be76f7
[vp-..] PASS the kit loads from a hand-written bs-snippet and the instance starts: at 5040 ms after the page opened
[vp-..] PASS two players in the room: [{"id":1,"name":"Main Editor","sid":"rsess_7a0f5070-c04e-4e07-a8d2-9f8d27226a7c"},{"id":2,"name":"Player 2","sid":"rsess_c4557961-d6cf-48e1-af95-50d159e9c21c"}]
[vp-..] INFO B is rsess_c4557961-d6cf-48e1-af95-50d159e9c21c
[vp-..] PASS this player placed three bricks by clicking the carpet: 3
[vp-..] PASS both players' bricks arrive on this page and are drawn: 6 bricks, 6 drawn
[vp-..] PASS both pages show identical builds (digests): 6:4443baf8 / 6:4443baf8
[vp-..] INFO B reloads its page
[vp-..] PASS the kit loads from a hand-written bs-snippet and the instance starts: at 4835 ms after the page opened
[vp-..] PASS two players in the room: [{"id":1,"name":"Main Editor","sid":"rsess_7a0f5070-c04e-4e07-a8d2-9f8d27226a7c"},{"id":3,"name":"Player 2","sid":"rsess_9d0671be-c313-4176-8f34-f9d798f62b04"}]
[vp-..] PASS late join by reload: the build is rebuilt and drawn: 7 bricks (had 6), drawn 7
```

## Artifacts

**2026-11-25, re-synced to portkit `c971100`**: `PortKit/Kit/Take Photos` ("'Picker' only, 78 renderers (5 bound
objects off)": the count now includes the picker's world-space uGUI), `PortKit/Kit/Export Artifacts` ("11 files (6
licence texts), footprint 3.58 x 1.7 x 4.09 m") -> `altspace/dist/` (not committed): `android/brick-builder` (3,032,666
bytes), `windows/brick-builder` (3,500,078 bytes), `pk-brick-builder.js` (776,174 bytes), `brick-builder.jpg` (the picker,
credits line complete), `brick-builder.snippet.html` (unchanged: box gizmo 3.584 x 0.2 x 3.584 m from `GizmoSize`),
`licenses/brick-builder/` (new: the six licence texts the bundles carry, each with its sha1 in the manifest),
`manifest.json`. `GizmoSize` and `PhotoRoot` stay: the build area's size is a setting, not the footprint, and the
whole kit's photo would be mostly carpet.

**2026-11-25**: `PortKit/Kit/Take Photos` ("'Picker' only, 69 renderers", `PhotoRoot`), `PortKit/Kit/Export Artifacts`
-> `altspace/dist/` (not committed): `android/brick-builder` (3,021,299 bytes, was 3,009,968), `windows/brick-builder`
(3,487,447 bytes, was 3,477,263), `pk-brick-builder.js` (763,355 bytes, BricksVR MIT header then portkit's MIT banner),
`brick-builder.jpg` (the picker), `brick-builder.snippet.html` (box gizmo 3.584 x 0.2 x 3.584 m from `GizmoSize`, the
build area at the default 64 x 64 studs), `manifest.json` (checks android PASS, windows PASS, bindings
`c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9`).

First Unity phase (2026-11-24):

`PortKit/Kit/Take Photos`, `PortKit/Kit/Export Artifacts` -> `altspace/dist/` (not committed): `android/brick-builder`
(3,009,968 bytes), `windows/brick-builder` (3,477,263 bytes), `pk-brick-builder.js` (730,330 bytes, MIT header),
`brick-builder.jpg`, `brick-builder.snippet.html` (settings room, width, depth, height, performance; box gizmo 3.6 x 4.6 m),
`manifest.json` (checks android PASS, windows PASS, bindings `c3c20bbbc4a96e83bdb0e5952d06da4038cde1d9`).

## Not verified (needs the app, a headset or controllers)

Everything in the app and on a Quest (rung 5): Quest frame time with 2,000 bricks (55,936 triangles, 8 draws), the
Android shader variant, VS speed on IL2CPP (the late-join merge took 121 ms in the editor), bridge latency. The VR
paths, because controller events do not fire in Play mode: the grip on a placed brick (pick up into the hand with
AttachToHand), the hand spawner (A/B/X/Y held and pressed), a picker tile clicked with a laser putting the brick in
the hand, the grabbable hammer swung into the build, the ghost while a brick is held, haptics. The HSV sliders (uGUI,
relayed as `uiSlider`) were not moved in the test (the swatches were). The left hand.

After the review, checked in Node only (no Play-mode path drives them): the swung hammer's blast radius and its
200-brick cap, the hand spawner's set during the hold (from a brick or a picker tile) and the 1x6 arch's spawn offset,
a loose or held brick blocking a snap, a leaver's pool slot freed by the referee, a repack of 18+ segments handed to
the relay in parts (the fake relay's 256 KiB cap; the real SDK's pacing is portkit's, unverified in the app).
