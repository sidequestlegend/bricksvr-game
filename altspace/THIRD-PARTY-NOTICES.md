# Third-party notices: Brick Builder (the Altspace port of BricksVR)

Full licence texts travel with the kit (`Assets/Kit/Licenses/`, `Assets/Kit/Sounds/LICENSE-*.txt`, and TextMesh Pro's
`LiberationSans - OFL.txt`, which the kit's bundles carry because the kit uses that font).

## The game

Brick Builder is a port of BricksVR (https://github.com/d12/bricksvr-game), MIT licence,
Copyright 2021 BricksVR Studios Inc. (full text: `Licenses/BricksVR-LICENSE-MIT.txt`). The BricksVR name and logos
are excluded from that licence and are not used.
The port's script also holds the portkit runtime: MIT licence, Copyright (c) 2026 the portkit authors (full text:
`Licenses/portkit-LICENSE-MIT.txt`). Both notices are also at the top of the script `pk-brick-builder.js`.

## Brick models

Regenerated for this port (`altspace/tools/bricks/`), same licence as the port (MIT, above): 265 as plain geometric
shapes from the brick catalogue in the upstream code, no lettering or logos; the two plants and the pyramid rebuilt
from upstream's own vertex dumps (`BrickObjs/*.pobj`, part of the MIT repository). The upstream FBX files are lost
(Git LFS objects gone).

## Font

Liberation Sans (TextMesh Pro's default font asset, used for every label): SIL Open Font License 1.1.
Digitized data copyright (c) 2010 Google Corporation with Reserved Font Arimo, Tinos and Cousine.
Copyright (c) 2012 Red Hat, Inc. with Reserved Font Name Liberation.
Full text: `LiberationSans - OFL.txt` (in the bundles beside this file).

## Sounds (replacing the 9 lost upstream sounds)

All by Kenney (www.kenney.nl), CC0 1.0 Universal (http://creativecommons.org/publicdomain/zero/1.0/; full legal code:
`Licenses/CC0-1.0-legalcode.txt`). Kenney's own licence notes are kept beside the files in `Assets/Kit/Sounds/`.

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
