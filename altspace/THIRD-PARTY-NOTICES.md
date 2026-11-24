# Third-party notices: Brick Builder (the Altspace port of BricksVR)

## The game

Brick Builder is a port of BricksVR (https://github.com/d12/bricksvr-game), MIT licence,
Copyright 2021 BricksVR Studios Inc. The BricksVR name and logos are excluded from that licence and are not used.
The port's script also holds the portkit runtime (MIT).

## Brick models

Regenerated for this port from the brick catalogue in the upstream code (`altspace/tools/bricks/`): plain geometric
shapes, no lettering or logos. Same licence as the port (MIT). The upstream FBX files are lost (Git LFS objects gone).

## Sounds (replacing the 9 lost upstream sounds)

All by Kenney (www.kenney.nl), CC0 1.0 (http://creativecommons.org/publicdomain/zero/1.0/). Licence texts are kept
beside the files in `Assets/Kit/Sounds/`.

| File in the kit | Replaces upstream | Source file | Pack, where downloaded |
|---|---|---|---|
| `snap1.ogg`, `snap2.ogg`, `snap3.ogg` | `Resources/Sounds/brick-place1..3.wav` | `chips-collide-1..3.ogg` | Casino Audio 1.1, https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips (`kenney_casino-audio.zip`) |
| `carpet1.ogg`, `carpet2.ogg`, `carpet3.ogg` | `Resources/Sounds/brickcarpet1..3.wav` | `chip-lay-1..3.ogg` | Casino Audio 1.1 (as above) |
| `menuclick.ogg` | `Resources/Sounds/menuclick.wav` | `click_001.ogg` | Interface Sounds 1.0, https://opengameart.org/content/interface-sounds (`kenney_interfaceSounds.zip`) |
| `spawnset.ogg` | `Resources/Sounds/spawnset2.wav` | `pluck_001.ogg` | Interface Sounds 1.0 (as above) |
| `success.ogg` | `Resources/Sounds/success.wav` | `confirmation_001.ogg` | Interface Sounds 1.0 (as above) |

Upstream `spawnset.wav` is unreferenced and is not replaced.

## Textures

The upstream scratch overlay `Textures/unknown.png` (lost) is not replaced: the port's brick shader has no scratch
texture (upstream's `_ScratchWeighting` 0). The carpet is a plain colour.
