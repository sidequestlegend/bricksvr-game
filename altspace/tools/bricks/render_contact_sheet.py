"""Render contact sheets of the generated brick FBX files (headless Blender, Workbench engine).

  blender.exe --background --factory-startup --python altspace/tools/bricks/render_contact_sheet.py -- \
      [--models ../../GeneratedBrickModels] [--out preview] [--cols 8] [--rows 6] [--only REGEX] [--res 2400]

The FBX files are *re-imported* (so the sheet also checks the export round trip), scaled by the
globalScale of their .meta (the in-game size) and turned 180 deg about Z, which shows them the way
Unity does: +X to the right, +Y up, viewer on the -Z side. Two images per page: from above-front-right
and from below (to show the hollow undersides). Colour = variant:
  complete orange | hollow blue | hollow_nobevel cyan | solid green | solid_nobevel olive | other grey
"""
import bpy, sys, os, re, json, math, argparse
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
COLORS = {"complete": (0.95, 0.55, 0.15, 1), "hollow": (0.25, 0.45, 0.9, 1), "hollow_nobevel": (0.3, 0.8, 0.9, 1),
          "solid": (0.3, 0.75, 0.3, 1), "solid_nobevel": (0.6, 0.65, 0.2, 1), "other": (0.6, 0.6, 0.6, 1)}


def variant_of(stem):
    for suf, v in (("_Complete+HollowBody_NoBevel", "hollow_nobevel"), ("_Complete-HollowBody", "complete"),
                   ("_HollowBody_NoBevel", "hollow_nobevel"), ("_SolidBody_NoBevel", "solid_nobevel"),
                   ("_HollowBody", "hollow"), ("_SolidBody", "solid"), ("_Complete", "complete")):
        if stem.endswith(suf):
            return v
    return "other"


def global_scale(path):
    meta = path + ".meta"
    if os.path.exists(meta):
        m = re.search(r"meshes:\s*\n(?:.*\n)*?\s*globalScale: ([\d.]+)", open(meta, encoding="utf-8").read())
        if m:
            return float(m.group(1))
    return 1.0


def look_rotation(d):
    """Camera rotation looking along d (Blender camera looks down its local -Z, up = local +Y)."""
    d = Vector(d).normalized()
    return d.to_track_quat('-Z', 'Z').to_matrix().to_4x4()


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default=os.path.normpath(os.path.join(HERE, "..", "..", "GeneratedBrickModels")))
    ap.add_argument("--out", default=os.path.join(HERE, "preview"))
    ap.add_argument("--cols", type=int, default=8)
    ap.add_argument("--rows", type=int, default=6)
    ap.add_argument("--cell", type=float, default=0.105)
    ap.add_argument("--res", type=int, default=2400)
    ap.add_argument("--only", default=None)
    ap.add_argument("--prefix", default="contact_sheet")
    args = ap.parse_args(argv)

    files = []
    for dp, dn, fn in os.walk(args.models):
        dn.sort()
        for f in sorted(fn):
            if f.lower().endswith(".fbx"):
                rel = os.path.relpath(os.path.join(dp, f), args.models).replace("\\", "/")
                if not args.only or re.search(args.only, rel):
                    files.append(rel)
    per_page = args.cols * args.rows
    os.makedirs(args.out, exist_ok=True)
    pages = [files[i:i + per_page] for i in range(0, len(files), per_page)]
    print(f"[sheet] {len(files)} models, {len(pages)} pages", flush=True)

    for pi, page in enumerate(pages):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        sc = bpy.context.scene
        sc.render.engine = 'BLENDER_WORKBENCH'
        sh = sc.display.shading
        sh.light = 'STUDIO'
        sh.color_type = 'OBJECT'
        sh.show_cavity = True
        sh.cavity_type = 'BOTH'
        sh.show_object_outline = True
        sh.show_backface_culling = False
        sc.render.resolution_x = args.res
        sc.render.resolution_y = int(args.res * args.rows / args.cols * 1.0)
        sc.render.film_transparent = False
        sc.render.image_settings.file_format = 'PNG'
        sc.render.image_settings.color_mode = 'RGB'
        sc.render.image_settings.color_depth = '8'
        sc.render.image_settings.compression = 100
        world = bpy.data.worlds.new("w"); sc.world = world; world.color = (0.97, 0.97, 0.97)
        sc.view_settings.view_transform = 'Standard'

        for view_name, view_dir in (("top", (-0.55, 1.0, -0.7)), ("bottom", (-0.55, 1.0, 0.8))):
            # clear previous objects
            for o in list(bpy.data.objects):
                bpy.data.objects.remove(o, do_unlink=True)
            rot = look_rotation(view_dir)
            right = (rot.to_3x3() @ Vector((1, 0, 0))).normalized()
            up = (rot.to_3x3() @ Vector((0, 1, 0))).normalized()
            for idx, rel in enumerate(page):
                r, c = divmod(idx, args.cols)
                center = right * ((c - (args.cols - 1) / 2) * args.cell) + up * (((args.rows - 1) / 2 - r) * args.cell)
                path = os.path.join(args.models, rel.replace("/", os.sep))
                before = set(bpy.data.objects)
                bpy.ops.import_scene.fbx(filepath=path)
                new = [o for o in bpy.data.objects if o not in before]
                gs = global_scale(path)
                var = variant_of(os.path.splitext(os.path.basename(rel))[0])
                meshes = [o for o in new if o.type == 'MESH']
                for o in meshes:
                    # imported space == generator's Blender space; 180 deg about Z gives Unity's view
                    o.matrix_world = Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(gs, 4) @ o.matrix_world
                    o.color = COLORS.get(var, COLORS["other"])
                bpy.context.view_layer.update()
                pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
                lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
                hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
                size = max(hi - lo)
                fit = min(1.0, 0.75 * args.cell / size) if size > 0 else 1.0
                mid = (lo + hi) / 2
                for o in meshes:
                    o.matrix_world = (Matrix.Translation(center + up * 0.1 * args.cell) @ Matrix.Scale(fit, 4) @
                                      Matrix.Translation(-mid) @ o.matrix_world)
                # label
                label = rel.split("/")[-1][:-4] + ("" if fit >= 0.999 else f"  (shown x{fit:.2f})")
                folder = "/".join(rel.split("/")[:-1])
                for li, text in enumerate((label, folder)):
                    cu = bpy.data.curves.new(f"t{idx}_{li}", 'FONT')
                    cu.body = text
                    k = args.cell / 0.105
                    cu.size = (0.0042 if li == 0 else 0.0034) * k
                    cu.align_x = 'CENTER'
                    to = bpy.data.objects.new(f"t{idx}_{li}", cu)
                    sc.collection.objects.link(to)
                    to.matrix_world = Matrix.Translation(center - up * (0.40 * args.cell + 0.0055 * k * li) - Vector(view_dir).normalized() * 0.05) @ rot
                    to.color = (0.05, 0.05, 0.05, 1) if li == 0 else (0.35, 0.35, 0.35, 1)
            cam_data = bpy.data.cameras.new("cam")
            cam_data.type = 'ORTHO'
            cam_data.ortho_scale = args.cell * args.cols * 1.0
            cam_data.clip_start = 0.001
            cam_data.clip_end = 10
            cam = bpy.data.objects.new("cam", cam_data)
            sc.collection.objects.link(cam)
            cam.matrix_world = Matrix.Translation(-Vector(view_dir).normalized() * 2.0) @ rot
            sc.camera = cam
            out = os.path.join(args.out, f"{args.prefix}_{pi + 1:02d}_{view_name}.png")
            sc.render.filepath = out
            bpy.ops.render.render(write_still=True)
            print(f"[sheet] wrote {out}", flush=True)


if __name__ == "__main__":
    main(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
