# Replacement brick models (generated)

The upstream brick models (`Assets/Resources/BrickModels/**/*.fbx`, 269 files) are Git LFS pointers whose
objects no longer exist on GitHub. This folder regenerates **all 269** of them as plain geometric primitives
(boxes, cylinders, wedges, booleans) from dimensions recovered from the game's code, prefabs and scene.
The studs have no lettering or logo, and nothing is named after a toy brand.

| Path | What |
|---|---|
| `bricks.json` | The catalogue: every brick, its shape parameters and every file with its variant, mesh name, upstream GUID, upstream `globalScale` and the upstream fileIDs that reference it. **This is the source of truth.** |
| `generate_bricks.py` | Headless-Blender generator, which writes the FBX and `.meta` files. |
| `render_contact_sheet.py` | Headless-Blender contact sheets. Re-imports the FBX files, so it also tests the round trip. |
| `verify_bricks.py` | Plain Python 3 checker that compares the FBX files against what the game expects. No Blender needed. |
| `unity_fileid.py` | Unity's model-importer fileID hash, which the generator and the verifier both use. |
| `preview/contact_sheet_NN_{top,bottom}.png` | 6 pages x 2 views (from above, and from below to show the hollow undersides). |
| `../../GeneratedBrickModels/` | The output. It mirrors `Assets/Resources/BrickModels/...` file for file, with a `.meta` next to each FBX and a `manifest.json`. |

## Regenerate

```powershell
$bl = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
cd C:\workspace\AltspaceGames\brick-builder
& $bl --background --factory-startup --python altspace\tools\bricks\generate_bricks.py            # ~10 s, 269 files
python altspace\tools\bricks\verify_bricks.py                                                       # expect "problems: 0"
& $bl --background --factory-startup --python altspace\tools\bricks\render_contact_sheet.py -- --cell 0.06 --res 2000
```

`generate_bricks.py` takes `--only REGEX` (e.g. `--only "Slope_Corner"`), `--out DIR`, `--upstream DIR`
(only the upstream `.meta` files are read) and `--no-meta`. Tested with Blender 5.2.0 LTS.

### Importing into Unity

Copy `GeneratedBrickModels/**` over `Assets/Resources/BrickModels/**`, **including the `.meta` files**.
They are the upstream metas, so the GUIDs and `globalScale` are unchanged. 18 of them get one extra
`internalIDToNameTable` entry (see "Mesh names and fileIDs"). With those in place, every prefab and scene
reference (`{fileID, guid}`) resolves to the new meshes.

## What the variants are for (from the code)

| Variant | Used for | Content |
|---|---|---|
| `*_Complete` | Held brick: `CombinedModel` mesh in `Assets/Resources/<brick>.prefab`. Picker / ghost / hand spawner: `BrickData.Brick.Mesh = Resources.Load<Mesh>("BrickModels/" + CompleteMeshPath)` (`Assets/Scripts/BrickData.cs:126`, catalogue at `BrickData.cs:9-80`; ghosts at `BrickGhosts.cs:29`) | Body + studs + hollow underside with tubes/pins, bevelled edges |
| `*_HollowBody[_NoBevel]` | Placed bricks. `ModularBrickObjects` (`ModularBrickObjects.cs:16-22`) looks up the child **`Body`** of the per-brick object under `MetaObjects/ModularBrickObjects` in `Main Scene.unity`. `BrickAttach.RecalculateRenderedGeometry` (`BrickAttach.cs:268-364`) combines `Body` with one `Stud` mesh per *uncovered* stud (children of **`Studs`**, named after the male connectors) | Body **without studs**, open underside with tubes/pins |
| `*_SolidBody[_NoBevel]` | The **`FlatBody`** child, rendered instead of `Body` when every female connector is covered, the brick sits on the carpet, or "super ultra performance mode" is on (`BrickAttach.cs:333-344`, `:371-374`) | Body without studs, closed flat bottom |
| `_NoBevel` | The scene's modular objects mostly reference the NoBevel versions (cheapest for the many placed bricks) | Same as above, no chamfers |
| Tile oddities | `Tile_*_Complete-HollowBody` is the held mesh of the 1x8/2x3/2x6/2x8 tiles (a tile's Complete *is* its hollow body). `Tile_*_Complete+HollowBody_NoBevel` is the modular `Body` of the 2x2/2x4/2x8 tiles. `Tile_1x6_HollowBody` is the 1x6 tile's held mesh | Treated as Complete (bevelled hollow) and HollowBody_NoBevel respectively |
| `z_Extras/Stud.fbx` | The per-stud mesh in every `Studs` group in the scene (38 references) | Lone stud, pivot 0.2 mm above the brick top (see below) |
| `z_OldModels/*` | Old meshes (all named `Body_1`) still used by `BrickGhost.prefab`, `Hammer.prefab`, `Screen.prefab`, `BrickCityscape.prefab` and the scene | Same shapes as the Complete bricks at importer scale 1 |

The LODs are not variants: there are no LOD groups. Collision uses separate `BoxCollider`s in the prefabs,
not these meshes, so collision does not depend on them.

Colour: `BrickAttach.UpdateBrickColor` (`BrickAttach.cs:189-198`) sets `_Color` and `_TexOffset` through a
`MaterialPropertyBlock`. `PerInstanceColor.shader:32-34` computes
`_Color * (1 + tex2D(_MainTex, uv + (_TexOffset, -_TexOffset)) * _ScratchWeighting)`. So the meshes need
**UV0**. Vertex colours are not used, and one material / one submesh is enough (one slot,
`BrickMaterial`, which the prefabs override anyway). UVs are box-projected at one texture repeat per 4 studs.
Normals are exported (the importer has `normalImportMode: 0` = Import): hard edges everywhere except across
the cylinder sides.

## Coordinate system, scale and pivot

All dimensions are authored in **Unity mesh space after import**: metres, Y up, **X = long axis**, Z = short
axis. The pivot is the centre of the footprint at **mid-height of the base brick/plate**. The prefabs show
the mesh through `CombinedModel` with `localScale 7` (`Assets/Resources/1x2.prefab:685`), so 1 mesh unit =
7 world units. The generator then converts to Blender space so that Unity's importer returns exactly those
numbers:

* Blender's FBX export uses `axis_forward=-Z, axis_up=Y, bake_space_transform=True, apply_scale_options=FBX_SCALE_ALL`,
  which gives Y-up, `UnitScaleFactor 100` (metres), and no node transform (verified by reading the FBX back).
* Unity's importer mirrors X when it converts the right-handed FBX to its left-handed space. So
  `blender = (-x, -z, y)`, and the faces are re-wound to stay outward.
* Each file is divided by its own upstream `.meta` `globalScale`. The upstream files use **1.065** (92 files),
  **1.07** (154) or **1.0** (23: the old models, `Plate_3x3`, and `Plate_1x3_Hollow/SolidBody`). Both 1.065 and
  1.07 are about 8/7.5, so the originals were modelled at a 7.5 mm pitch and scaled up on import.
  Dividing per file means every mesh imports at exactly the same size.

## Dimensions and where they come from

| Quantity | Value (mesh units, m) | Source |
|---|---|---|
| Stud pitch P | 0.008 | `Main Scene.unity:14945` (modular stud offsets of 0.004, i.e. +/-P/2) and `1x4Plate.asset:21` (extent 0.0159 = 2P - 0.0001). Connectors at x = +/-0.02803757 world (`1x2.prefab:31,142`) / 7 = 0.004005, about P/2 |
| Clearance per side | 0.0001 (a 1x1 is 7.8 mm wide) | `1x4Plate.asset:21` (`m_Extent` x 0.0159, z 0.0039) |
| Plate height | 0.0032 | `1x4Plate.asset:20-21` (y from -0.0016 to 0.00331 = 3.2 mm body + 1.7 mm stud, pivot at body centre). Plate stack step: `BrickAttachDetector.cs:385,423` (`Height()` tile = 0.0565, so 0.0565 - 0.060 + 0.026 = 0.0225 world = 0.0032) |
| Brick height | 0.0096 (3 plates), pivot at mid-height | Stack step `0.078736 - 0.060 + 0.0484 = 0.067136` world / 7 = 0.00959 (`BrickAttachDetector.cs:385,423`, male connector y 0.0484 at `1x2.prefab:31`). Male/female connectors sit about 2.1 mm above the top / 0.4 mm below the bottom for both plates and bricks (`1x2.prefab:31,281`, `1x2Plate.prefab:396,432`), and the brick collider is centred at y = 0 |
| Window 1x2 height | 0.0192 (6 plates), centred | Window connectors at +/-0.0116/-0.0099 mesh units, `Height()` window = 0.113 (`BrickAttachDetector.cs:423`); modular `Studs` group at y = 0.01 |
| Stud radius / height | 0.0024 / 0.0017 above the top face | `1x4Plate.asset:20-21` (top at 0.00331 = 0.0016 + 0.0017). The radius is the standard 4.8 mm (**guess**, consistent with the connector boxes) |
| Modular stud pivot | `Stud.fbx` spans y -0.0004 .. +0.0015 about its pivot | `Studs` group y = 0.005 for bricks (`Main Scene.unity:1657`) and 0.002 for plates (`:15022`). Placed brick studs end at the same height as the Complete mesh; placed plate studs are 0.2 mm taller (one mesh cannot match both; the upstream offsets disagree by 0.2 mm) |
| Side-stud axis | y = 0.0006, on the +Z face (and +/-X, +/-Z for the 4-face part) | `1x1_1FaceSideStud.prefab:1982-1983`: connector at (0, 0.0043681, 0.043689) world / 7, rotated 90 deg about X |
| Asymmetric parts | Slopes: studs and the high side at **+X**, descending to -X. L-corners: the missing cell is **(-X, +Z)**. Corner slopes: stud at (+X, +Z). Inverted slope: full depth under +X. 2/3 slopes: high side +X (the 1x4 one runs along Z). Arches: connected only at the end pillars | Male/female connector layout of each held prefab, plus the physics colliders (e.g. `1x2Slope.prefab:31` and its `Collider` at x = +0.0266) |
| Importer | `globalScale` per file, `useFileUnits: 1`, `fileIdsGeneration: 2` | e.g. `Brick_1x2_Complete.fbx.meta:37,46,49` |

Everything above is checked automatically: `verify_bricks.py` reads every FBX back, applies Unity's X mirror and
the `.meta` scale, and confirms that **all 548 connectors of the 68 held prefabs** (220 male, 328 female) sit on
matching geometry (a stud rim under each male connector, the bottom face just above each female one). It also
checks the footprint, the bottom and top heights, the node transforms, the axes and units, the names, the fileIDs,
and the UV, normal and material layers.

## Mesh names and fileIDs

Prefabs and the scene reference each mesh by `{fileID, guid}`. With `fileIdsGeneration: 2`, Unity computes the fileID
of an imported FBX mesh as `xxHash64("Type:Mesh->" + <FBX node name> + "0")`, read as int64. I confirmed this
against 5 known pairs from Unity 6000.3's own packages (`unity_fileid.py`). Using it, the original mesh names
were recovered by brute force for every upstream reference that could be matched:

* **167 files**: the original name was recovered and is reproduced exactly. It is the file stem, except
  `Slope_Corner_NxN_*` (mesh `Corner_NxN_*`), `Tile_1x2_HollowBody_NoBevel` (mesh `Tile_1x2_HollowBody`) and
  all `z_OldModels/*` (mesh `Body_1`).
* **18 files**: these are referenced, but their original names could not be recovered. They use the file
  stem, and their generated `.meta` maps the upstream fileID to that name
  (`internalIDToNameTable: - first: {43: <id>} second: <name>`). The files: `Misc/Bob`,
  `Plate_2x2_Corner_Complete`, `Brick_1x1_Pyramid_Complete`, the 4 `SideStudBricks/*_Complete`,
  `Slope_1x1x2-3_Complete`, `Slope_1x4x2-3_Complete`, `Tile_1x8/2x3/2x6/2x8_Complete-HollowBody`,
  `Tile_2x2/2x4/2x8_Complete+HollowBody_NoBevel`, `Tile_2x2_Corner_Complete`, `Tile_Round_1x1_Complete`.
* **84 files**: unreferenced upstream, so the file stem is used.

The stem names also satisfy `BrickData.BrickByCompleteMeshName` (`ReplaceAllBricksWithNoBevels.cs:20`), which matches a
mesh name against `CompleteMeshPath`.

## Guesses (not recoverable from the repository)

* **Underside detail:** wall 1.2 mm, top thickness 1.0 mm. Tubes have a 6.51 mm outer / 4.8 mm inner diameter
  under 2-wide parts, and solid 3.2 mm pins under 1-wide parts; no tube at an L-corner's inner point. The bevel
  is a 0.2 mm chamfer.
* **Slope angles:** taken from the display names (45/33/18, 73 for the unused 1x2x3). Each slope spans the
  whole non-stud run, with a lip of at least 1.6 mm, so the "33 deg" pieces come out at about 29 deg. The 2/3
  wedges are 2 plates tall with a 0.8 mm lip (matching their colliders).
* **Arches:** the opening width is the inner face of 1-stud pillars. The crown heights (1.3 / 2.4 / 1.3 mm
  above centre) are read from the arch colliders, and the elliptical curve is a guess. The 1x6 arch is one
  brick tall because its collider says so.
* **Window 1x2x2:** 1.5 mm frame, 1-plate sill, open (no glass).
* **Masonry:** 3 courses of raised panels with 0.4 mm joints and a half-stud stagger, on both long faces.
* **Pyramid:** a 1.3 mm base slab plus a pyramid with its apex at y = +0.4 mm (from its colliders).
* **Plants:** a stud-sized hub plus 5 flat leaves (`Plant_Green_Flat`), or a stem plus 3 leaves
  (`Plant_Green_MediumHeight`). Plain shapes sized to sit on one stud (female connector y = -0.002).
* **`Misc/Bob.fbx`:** a rough blocky placeholder figure, built so its feet land on `Bob.prefab`'s two female
  connectors (the prefab flips the model 180 deg about X). Bob is commented out of `BrickData`.
* **`z_Extras/Round_Stud`, `Tube`, `Tube_Short`, `Slope_Tube`:** unreferenced. Their pivot is at the top of
  the tube, with heights 8.6 / 2.2 / 6.0 mm.
* **The X mirror:** Unity mirroring X on FBX import is standard Unity behaviour, but it was not tested in an
  editor here. If slopes ever show up facing backwards relative to their studs, flip the matrix in
  `generate_bricks.py: finalize()`. The verifier would then need the same change.
* **The 18 `internalIDToNameTable` entries:** this is how Unity keeps fileIDs stable across renames, but it
  was not tested in an editor here. Fallback: re-point those references in the prefabs/scene to
  `unity_fileid.mesh_file_id(<stem>)`.

## Triangle budget

Total 44,804 triangles across 269 files; median 104; maximum 1,024 (`Plate_2x8_Complete`, which has 16 studs
and 7 tubes). Placed bricks use HollowBody_NoBevel (28 to 448 tris) or SolidBody_NoBevel (12 tris) plus 44-tri
studs. Studs are 12-sided, tubes 10-sided, pins 8-sided.

## Catalogue

C = Complete, H = HollowBody, Hn = HollowBody_NoBevel, S = SolidBody, Sn = SolidBody_NoBevel. "In BrickData" means
the part is one of the 65 pieces in the in-game picker.

| Brick (folder) | Shape | Size X x Z (studs) | Height (plates) | Files (variant: tris) | In BrickData |
|---|---|---|---|---|---|
| Arches/Brick_1x3_Arch | arch | 3x1 | 3 | Complete: 246, HollowBody: 144, SolidBody: 112 | yes |
| Arches/Brick_1x4_Arch | arch | 4x1 | 3 | Complete: 280, HollowBody: 144, SolidBody: 112 | yes |
| Arches/Brick_1x6_Arch | arch | 6x1 | 3 | Complete: 348, HollowBody: 144, SolidBody: 112 | yes |
| Bricks/Brick_1x1 | box | 1x1 | 3 | Complete: 94, HollowBody: 60, HollowBody_NoBevel: 28, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Bricks/Brick_1x10 | box | 10x1 | 3 | Complete: 598, HollowBody: 258, HollowBody_NoBevel: 226, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Bricks/Brick_1x2 | box | 2x1 | 3 | Complete: 150, HollowBody: 82, HollowBody_NoBevel: 50, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Bricks/Brick_1x3 | box | 3x1 | 3 | Complete: 206, HollowBody: 104, HollowBody_NoBevel: 72, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Bricks/Brick_1x4 | box | 4x1 | 3 | Complete: 262, HollowBody: 126, HollowBody_NoBevel: 94, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Bricks/Brick_1x6 | box | 6x1 | 3 | Complete: 374, HollowBody: 170, SolidBody: 44 | yes |
| Bricks/Brick_1x8 | box | 8x1 | 3 | Complete: 486, HollowBody: 214, SolidBody: 44 | yes |
| Bricks/Brick_2x2 | box | 2x2 | 3 | Complete: 256, HollowBody: 120, HollowBody_NoBevel: 88, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Bricks/Brick_2x2_Corner | box (L) | 2x2 | 3 | Complete: 196, HollowBody: 94, SolidBody: 68 | yes |
| Bricks/Brick_2x3 | box | 3x2 | 3 | Complete: 384, HollowBody: 180, SolidBody: 44 | yes |
| Bricks/Brick_2x4 | box | 4x2 | 3 | Complete: 512, HollowBody: 240, HollowBody_NoBevel: 208, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Bricks/Brick_2x6 | box | 6x2 | 3 | Complete: 768, HollowBody: 360, SolidBody: 44 | yes |
| Bricks/Brick_2x8 | box | 8x2 | 3 | Complete: 1024, HollowBody: 480, HollowBody_NoBevel: 448, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Bricks_Masonry/Brick_1x2_Masonry | masonry | 2x1 | 3 | Complete: 318, HollowBody: 250, SolidBody: 212 | yes |
| Bricks_Masonry/Brick_1x4_Masonry | masonry | 4x1 | 3 | Complete: 574, HollowBody: 438, SolidBody: 356 | yes |
| Misc/Bob | figure (placeholder) | - | - | Bob: 120 |  |
| Plants/Plant_Green_Flat | plant_flat | 1x1 | 1 | Plant_Green_Flat: 224 | yes |
| Plants/Plant_Green_MediumHeight | plant_three_leaf | 1x1 | 1 | Plant_Green_MediumHeight: 180 | yes |
| Plates/Plate_1x1 | box | 1x1 | 1 | Complete: 94, HollowBody: 60, HollowBody_NoBevel: 28, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Plates/Plate_1x10 | box | 10x1 | 1 | Complete: 598, HollowBody: 258, HollowBody_NoBevel: 226, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Plates/Plate_1x2 | box | 2x1 | 1 | Complete: 150, HollowBody: 82, HollowBody_NoBevel: 50, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Plates/Plate_1x2_1Stud | box, 1 centred stud | 2x1 | 1 | Complete: 116, HollowBody: 82, SolidBody: 44 | yes |
| Plates/Plate_1x3 | box | 3x1 | 1 | Complete: 206, HollowBody: 104, HollowBody_NoBevel: 72, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Plates/Plate_1x4 | box | 4x1 | 1 | Complete: 262, HollowBody: 126, HollowBody_NoBevel: 94, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Plates/Plate_1x6 | box | 6x1 | 1 | Complete: 374, HollowBody: 170, SolidBody: 44 | yes |
| Plates/Plate_1x8 | box | 8x1 | 1 | Complete: 486, HollowBody: 214, SolidBody: 44 | yes |
| Plates/Plate_2x2 | box | 2x2 | 1 | Complete: 256, HollowBody: 120, HollowBody_NoBevel: 88, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Plates/Plate_2x2_1Stud | box, 1 centred stud | 2x2 | 1 | Complete: 154, HollowBody: 120, SolidBody: 44 | yes |
| Plates/Plate_2x2_Corner | box (L) | 2x2 | 1 | Complete: 194, HollowBody: 92, SolidBody: 68 | yes |
| Plates/Plate_2x3 | box | 3x2 | 1 | Complete: 384, HollowBody: 180, SolidBody: 44 | yes |
| Plates/Plate_2x4 | box | 4x2 | 1 | Complete: 512, HollowBody: 240, HollowBody_NoBevel: 208, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Plates/Plate_2x6 | box | 6x2 | 1 | Complete: 768, HollowBody: 360, SolidBody: 44 | yes |
| Plates/Plate_2x8 | box | 8x2 | 1 | Complete: 1024, HollowBody: 480, HollowBody_NoBevel: 448, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Plates/Plate_3x3 | box | 3x3 | 1 | Complete: 606, HollowBody: 300, SolidBody: 44 |  |
| Plates/Plate_Round_1x1 | round | 1x1 | 1 | Complete: 286, HollowBody: 252, SolidBody: 188 | yes |
| Pyramids/Brick_1x1_Pyramid | pyramid | 1x1 | 3 | Complete: 66, SolidBody: 50 | yes |
| SideStudBricks/Brick_1x1_1FaceSideStud | box + side studs (+Z) | 1x1 | 3 | Complete: 128 | yes |
| SideStudBricks/Brick_1x1_4FaceSideStud | box + side studs (4 faces) | 1x1 | 3 | Complete: 230 |  |
| SideStudBricks/Brick_1x2_1FaceSideStud | box + side studs (+Z) | 2x1 | 3 | Complete: 218 | yes |
| SideStudBricks/Brick_1x4_1FaceSideStud | box + side studs (+Z) | 4x1 | 3 | Complete: 398 | yes |
| Slopes/Slope_1x1x2-3 | slope (2/3 wedge) | 1x1 | 2 | Complete: 60, SolidBody: 44 | yes |
| Slopes/Slope_1x2 | slope 45 | 2x1 | 3 | Complete: 132, HollowBody: 98, HollowBody_NoBevel: 58, SolidBody: 56, SolidBody_NoBevel: 16 | yes |
| Slopes/Slope_1x2_Inverted | slope_inverted 45 | 2x1 | 3 | Complete: 140, HollowBody: 72, SolidBody: 56 | yes |
| Slopes/Slope_1x2x3 | slope 73 | 2x1 | 9 | Complete: 132, HollowBody: 98, SolidBody: 56 |  |
| Slopes/Slope_1x3 | slope 33 | 3x1 | 3 | Complete: 158, HollowBody: 124, HollowBody_NoBevel: 84, SolidBody: 56, SolidBody_NoBevel: 16 | yes |
| Slopes/Slope_1x4 | slope 18 | 4x1 | 3 | Complete: 180, HollowBody: 146, HollowBody_NoBevel: 106, SolidBody: 56, SolidBody_NoBevel: 16 | yes |
| Slopes/Slope_1x4x2-3 | slope (2/3 wedge, along Z) | 1x4 | 2 | Complete: 60, SolidBody: 44 | yes |
| Slopes/Slope_2x2 | slope 45 | 2x2 | 3 | Complete: 204, HollowBody: 136, HollowBody_NoBevel: 96, SolidBody: 56, SolidBody_NoBevel: 16 | yes |
| Slopes/Slope_Corner_2x2 | corner_slope 45 | 2x2 | 3 | Complete: 180, HollowBody: 146, SolidBody: 64 | yes |
| Slopes/Slope_Corner_3x3 | corner_slope 33 | 3x3 | 3 | Complete: 366, HollowBody: 332, SolidBody: 64 | yes |
| Slopes/Slope_Corner_4x4 | corner_slope 18 | 4x4 | 3 | Complete: 666, HollowBody: 632, SolidBody: 64 | yes |
| Tiles/Tile_1x1 | box, no studs | 1x1 | 1 | Complete: 60, HollowBody: 60, HollowBody_NoBevel: 28, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Tiles/Tile_1x10 | box, no studs | 10x1 | 1 | Complete: 258, HollowBody: 258, HollowBody_NoBevel: 226, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Tiles/Tile_1x2 | box, no studs | 2x1 | 1 | Complete: 82, HollowBody: 82, HollowBody_NoBevel: 50, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Tiles/Tile_1x3 | box, no studs | 3x1 | 1 | Complete: 104, HollowBody: 104, HollowBody_NoBevel: 72, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Tiles/Tile_1x4 | box, no studs | 4x1 | 1 | Complete: 126, HollowBody: 126, HollowBody_NoBevel: 94, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Tiles/Tile_1x6 | box, no studs | 6x1 | 1 | Complete: 170, HollowBody: 170, SolidBody: 44 | yes |
| Tiles/Tile_1x8 | box, no studs | 8x1 | 1 | Complete-HollowBody: 214, Complete: 214, SolidBody: 44 | yes |
| Tiles/Tile_2x2 | box, no studs | 2x2 | 1 | Complete+HollowBody_NoBevel: 88, Complete: 120, HollowBody: 120, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Tiles/Tile_2x2_Corner | box (L), no studs | 2x2 | 1 | Complete: 92, SolidBody: 68 | yes |
| Tiles/Tile_2x3 | box, no studs | 3x2 | 1 | Complete-HollowBody: 180, Complete: 180, SolidBody: 44 | yes |
| Tiles/Tile_2x4 | box, no studs | 4x2 | 1 | Complete+HollowBody_NoBevel: 208, Complete: 240, HollowBody: 240, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Tiles/Tile_2x6 | box, no studs | 6x2 | 1 | Complete-HollowBody: 360, Complete: 360, SolidBody: 44 | yes |
| Tiles/Tile_2x8 | box, no studs | 8x2 | 1 | Complete+HollowBody_NoBevel: 448, Complete-HollowBody: 480, Complete: 480, SolidBody: 44, SolidBody_NoBevel: 12 | yes |
| Tiles/Tile_Round_1x1 | round, no stud | 1x1 | 1 | Complete: 252, SolidBody: 188 | yes |
| Windows/Window_1x2 | window (1x2x2 frame) | 2x1 | 6 | Complete: 170, HollowBody: 102, HollowBody_NoBevel: 70, SolidBody: 64, SolidBody_NoBevel: 32 | yes |
| z_Extras/Stud | stud | - | - | Stud: 44 |  |
| z_Extras/Round_Stud | hollow stud | - | - | Round_Stud: 96 |  |
| z_Extras/Tube, Tube_Short, Slope_Tube | tubes | - | - | 80 each |  |
| z_OldModels/1x1, 1x2, 1x4, 1x10, 2x2, 4x2 (+Plate/Tile versions: 1x1/1x2/1x4/1x10/2x2/2x4) | box (Complete) | as named, long axis X | 3 or 1 | 60 to 598 |  |

## Other LFS-lost files the port has to deal with (634 LFS pointers in `Assets/`, all lost)

`Assets/Scenes/Main Scene.unity` itself is **not** lost (it is plain YAML). Lost, besides the 269 brick models:

| Files | Needed? |
|---|---|
| `Resources/Sounds/*.wav` (10 files, 241 KB) | **Yes, replace:** `brick-place1..3` (placed-plate prefabs + scene), `brickcarpet1..3`, `menuclick` (7 UI prefabs), `spawnset2`, `success` (scene + code). `spawnset.wav` is unreferenced and can be dropped. |
| `Textures/unknown.png` | **Yes, or neutralise:** it is `_MainTex` of `Materials/BrickPerInstanceMaterial.mat`, the scratch overlay of every brick (`PerInstanceColor.shader:33-34`). While missing it reads as white and bricks render `(1 + _ScratchWeighting)` too bright; use a black/neutral texture or set `_ScratchWeighting` to 0. |
| `Textures/Carpet012_1K_{Color,Normal,AmbientOcclusion,Displacement}.png` (17 MB) | Only if the old carpet floor (`Materials/NewFloor.mat`) is kept; `_Roughness` is unreferenced. |
| `Textures/FloorNightMode.png` | `Materials/Floor.mat`. The other floor/scratch PNGs, `ColorPickerHues.png` and `DarkFloor.png` are unreferenced: drop them. |
| `Textures/Bob_Diffuse_512.png`, `Images/Bob.png` | Only for Bob, which is disabled: drop. |
| `Images/Avatar/Eyes*.png`, `Mouth*.png`, `eyes.png`, `mouth.png` (27) | Upstream avatar faces (scene + `Custom VR Player.prefab`). Drop if Altspace provides avatars. |
| `Images/BrickScreenshots/*-Gray2.png` (6 used of 19) | Brick-category icons in the scene menu. Replace with renders, or drop with the old menu. |
| UI icons (`back/create/join/options-icon`, `checkmark-rounded`, `crown-filled`, `rounded-square (1)`, `volume-*`, `Logo Color`, `Label_Highlight_iconFull2`) | Only if the upstream menus are ported. The other `Label_*`, `crown-*`, `rounded-square.png`, `BricksVR Avatar 512.png` and `bricksvr-logo-cropped-compressed.png` are unreferenced. |
| `Images/ReflectionSkyboxImages/invertedsky4.png` (used), plus 7 unused; `Scenes/Main Scene/ReflectionProbe-*.exr` (26, baked) | Re-bake or use URP defaults; drop the rest. |
| `Fonts/*.ttf` (8) | The TMP SDF `.asset` files survive and render without the TTFs; only needed to regenerate atlases. |
| `Oculus/**` (171: SampleFramework 80 fbx, LipSync, Avatar, VR meshes/textures/audio) and `Packages/Fantasy Skybox FREE` (50 png), `Packages/TextMesh Pro` (2) | Vendor content; replaced by the Altspace / URP / XR stack. Drop. |

Also note: `Assets/Prefabs/BrickComponents/{BrickStud,BrickTube,1x4BrickBody,2x2BrickBody,4x2BrickBody}.prefab`
reference model GUIDs that do not exist anywhere in the repository. They are nested in many of the scene's
`ModularBrickObjects` entries, so the port should re-point them to `z_Extras/Stud.fbx` / `Tube.fbx` (or rebuild
`ModularBrickObjects` from `bricks.json`).
