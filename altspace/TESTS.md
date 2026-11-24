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

RESULTS_PLACEHOLDER
