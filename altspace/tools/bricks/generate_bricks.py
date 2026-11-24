"""Generate replacement brick FBX models with headless Blender.

Run (from anywhere):
  "C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe" --background --factory-startup \
      --python altspace/tools/bricks/generate_bricks.py -- [--only REGEX] [--out DIR] [--upstream DIR] [--catalog FILE]

Defaults (paths relative to this file):
  --catalog  bricks.json
  --upstream ../../../Assets/Resources/BrickModels   (only the .meta files are read: globalScale + guid)
  --out      ../../GeneratedBrickModels              (mirrors Assets/Resources/BrickModels/...)

Geometry is authored in *Unity mesh space after import* (metres, Y up, X = long axis,
pivot = centre of the footprint at mid-height of the base brick/plate), then converted to
Blender space so that Unity's importer (FBX Y-up, X mirrored for handedness, Convert Units
on, the upstream .meta globalScale) gives back exactly those coordinates:
    blender = (-x_unity, -z_unity, y_unity) / globalScale
See README.md for where every dimension comes from.
"""
import bpy, bmesh, sys, os, re, json, math, argparse
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from unity_fileid import mesh_file_id  # noqa: E402

# ---------------------------------------------------------------- dimensions (Unity metres)
P = 0.008          # stud pitch            (ModularBrickObjects stud offsets 0.004/0.008; old 1x4Plate.asset)
PLATE = 0.0032     # plate height; brick = 3 plates = 0.0096 (BrickAttachDetector stack step 0.067136/7)
GAP = 0.0001       # per-side clearance    (1x4Plate.asset extents 0.0159 x 0.0039)
WALL = 0.0012      # side wall of the hollow underside            (GUESS, standard-ish 1.2 mm)
TOPW = 0.0010      # top thickness above the cavity               (GUESS)
STUD_R = 0.0024    # stud radius (4.8 mm dia)                     (1x4Plate.asset: studs reach y=0.00331)
STUD_H = 0.0017    # stud height above the top face               (1x4Plate.asset: 0.00331 - 0.0016)
STUD_SEG = 12
TUBE_RO, TUBE_RI, TUBE_SEG = 0.003255, 0.0024, 10   # underside tubes for 2-wide parts (GUESS: standard 6.51/4.8 mm)
PIN_R, PIN_SEG = 0.0016, 8                          # underside pins for 1-wide parts (GUESS)
BEVEL = 0.0002     # chamfer on the outer edges of the *bevel* variants (GUESS)
ROUND_SEG = 16
UV_TILE = 0.032    # one texture repeat per 4 studs (shader samples _MainTex at uv + _TexOffset)
SIDE_STUD_Y = 0.0006  # side-stud axis height (connector y 0.000624 in 1x1_1FaceSideStud.prefab)
EPS = 0.001

MATERIAL_NAME = "BrickMaterial"


# ================================================================ small geometry helpers
class Part:
    """Accumulates closed solids in a bmesh (construction space == Unity mesh space)."""

    def __init__(self):
        self.bm = bmesh.new()

    def add_bm(self, other):
        me = bpy.data.meshes.new("_tmp")
        other.to_mesh(me)
        self.bm.from_mesh(me)
        bpy.data.meshes.remove(me)


def prism_xz(bm, poly, y0, y1):
    """Closed prism: polygon in the X/Z plane (list of (x,z)), extruded from y0 to y1."""
    n = len(poly)
    bot = [bm.verts.new((x, y0, z)) for x, z in poly]
    top = [bm.verts.new((x, y1, z)) for x, z in poly]
    faces = [bm.faces.new(bot[::-1]), bm.faces.new(top)]
    for i in range(n):
        j = (i + 1) % n
        faces.append(bm.faces.new((bot[i], bot[j], top[j], top[i])))
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return faces


def prism_xy(bm, poly, z0, z1):
    """Closed prism: polygon in the X/Y plane (list of (x,y)), extruded from z0 to z1."""
    n = len(poly)
    a = [bm.verts.new((x, y, z0)) for x, y in poly]
    b = [bm.verts.new((x, y, z1)) for x, y in poly]
    faces = [bm.faces.new(a[::-1]), bm.faces.new(b)]
    for i in range(n):
        j = (i + 1) % n
        faces.append(bm.faces.new((a[i], a[j], b[j], b[i])))
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    return faces


def box(bm, x0, x1, y0, y1, z0, z1):
    return prism_xz(bm, [(x0, z0), (x1, z0), (x1, z1), (x0, z1)], y0, y1)


def circle(cx, cz, r, seg, phase=0.0):
    return [(cx + r * math.cos(phase + 2 * math.pi * i / seg), cz + r * math.sin(phase + 2 * math.pi * i / seg)) for i in range(seg)]


def cylinder(bm, cx, cz, r, y0, y1, seg, drop_bottom=False, drop_top=False):
    faces = prism_xz(bm, circle(cx, cz, r, seg, math.pi / seg), y0, y1)
    caps = [faces[0]] if drop_bottom else []
    caps += [faces[1]] if drop_top else []
    for f in faces[2:]:
        f.smooth = True
    if caps:
        bmesh.ops.delete(bm, geom=caps, context='FACES_ONLY')
    return faces


def ring(bm, cx, cz, ro, ri, y0, y1, seg, drop_top=False):
    """Closed annulus (tube) along Y."""
    oc, ic = circle(cx, cz, ro, seg, math.pi / seg), circle(cx, cz, ri, seg, math.pi / seg)
    ob = [bm.verts.new((x, y0, z)) for x, z in oc]
    ot = [bm.verts.new((x, y1, z)) for x, z in oc]
    ib = [bm.verts.new((x, y0, z)) for x, z in ic]
    it = [bm.verts.new((x, y1, z)) for x, z in ic]
    faces, tops = [], []
    for i in range(seg):
        j = (i + 1) % seg
        f = bm.faces.new((ob[i], ob[j], ot[j], ot[i])); f.smooth = True; faces.append(f)   # outer wall
        f = bm.faces.new((ib[j], ib[i], it[i], it[j])); f.smooth = True; faces.append(f)   # inner wall
        faces.append(bm.faces.new((ob[j], ob[i], ib[i], ib[j])))                         # bottom ring
        t = bm.faces.new((ot[i], ot[j], it[j], it[i])); faces.append(t); tops.append(t)  # top ring
    bmesh.ops.recalc_face_normals(bm, faces=faces)
    if drop_top:
        bmesh.ops.delete(bm, geom=tops, context='FACES_ONLY')


def hull(bm, points):
    vs = [bm.verts.new(p) for p in points]
    res = bmesh.ops.convex_hull(bm, input=vs)
    junk = list(dict.fromkeys(g for g in res['geom_interior'] + res['geom_unused']
                              if isinstance(g, bmesh.types.BMVert) and g.is_valid))
    if junk:
        bmesh.ops.delete(bm, geom=junk, context='VERTS')
    faces = [g for g in res['geom'] if isinstance(g, bmesh.types.BMFace) and g.is_valid]
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(0.5), verts=[v for v in bm.verts], edges=[e for e in bm.edges])
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    return faces


def bevel_all(bm, width=BEVEL):
    bmesh.ops.bevel(bm, geom=list(bm.edges) + list(bm.verts), offset=width, offset_type='OFFSET',
                    segments=1, profile=0.5, affect='EDGES', clamp_overlap=True)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))


def transform(bm, mat):
    bmesh.ops.transform(bm, matrix=mat, verts=list(bm.verts))


# ---------------------------------------------------------------- rectilinear footprints
def outline_loops(cells):
    """Boundary loops (CCW seen from +Y... interior on the left in (x,z)) of a set of unit grid cells."""
    cs = set(map(tuple, cells))
    edges = {}
    for (i, k) in cs:
        # edges with interior on the left, walking counter-clockwise in (x, z)
        if (i, k - 1) not in cs: edges[(i, k)] = (i + 1, k)
        if (i + 1, k) not in cs: edges[(i + 1, k)] = (i + 1, k + 1)
        if (i, k + 1) not in cs: edges[(i + 1, k + 1)] = (i, k + 1)
        if (i - 1, k) not in cs: edges[(i, k + 1)] = (i, k)
    loops = []
    while edges:
        start = next(iter(edges))
        loop, cur = [start], edges.pop(start)
        while cur != start:
            loop.append(cur)
            cur = edges.pop(cur)
        # merge collinear points
        out = []
        n = len(loop)
        for idx in range(n):
            a, b, c = loop[idx - 1], loop[idx], loop[(idx + 1) % n]
            if (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) != 0:
                out.append(b)
        loops.append(out)
    return loops


def inset_loop(loop, sx, sz, d):
    """Grid loop -> metric polygon (x,z), each edge pushed inwards by d (exact for rectilinear loops)."""
    pts = [((gx - sx / 2) * P, (gz - sz / 2) * P) for gx, gz in loop]
    n = len(pts)
    out = []
    for idx in range(n):
        a, b, c = pts[idx - 1], pts[idx], pts[(idx + 1) % n]
        e1 = (b[0] - a[0], b[1] - a[1]); e2 = (c[0] - b[0], c[1] - b[1])
        l1 = math.hypot(*e1); l2 = math.hypot(*e2)
        n1 = (-e1[1] / l1, e1[0] / l1); n2 = (-e2[1] / l2, e2[0] / l2)   # left normals = inward
        out.append((b[0] + d * (n1[0] + n2[0]), b[1] + d * (n1[1] + n2[1])))
    return out


# ================================================================ the brick builder
class Brick:
    def __init__(self, e):
        self.e = e
        self.sx, self.sz = e["size"]
        self.hx = self.sx * P / 2 - GAP
        self.hz = self.sz * P / 2 - GAP
        self.yb = e.get("bottom_plates", -1.5) * PLATE
        self.yt = self.yb + e.get("height_plates", 3) * PLATE
        self.cells = [tuple(c) for c in e.get("cells", [[i, k] for i in range(self.sx) for k in range(self.sz)])]
        self.hollow_cells = [tuple(c) for c in e.get("hollow_cells", self.cells)]
        self.slope_cfg = None
        if e["shape"] in ("slope", "slope_inverted", "corner_slope"):
            self._init_slope()

    def cell_center(self, i, k):
        return ((i - (self.sx - 1) / 2) * P, (k - (self.sz - 1) / 2) * P)

    # ------------------------------------------------ slope profiles
    def _init_slope(self):
        s = self.e["slope"]
        H = self.yt - self.yb
        flat = s.get("flat_cells", 1)
        x_hi = (self.sx / 2 - flat) * P if flat else self.hx
        run = x_hi + self.hx
        if s.get("lip") is not None:
            lip = s["lip"]
        else:
            lip = max(s.get("min_lip", 0.0016), H - math.tan(math.radians(s["angle_deg"])) * run)
        lip = min(lip, H)
        self.slope_cfg = dict(x_hi=x_hi, run=run, lip=lip, angle=math.degrees(math.atan2(H - lip, run)))
        # corner slopes: same profile along Z
        z_hi = (self.sz / 2 - flat) * P if flat else self.hz
        self.slope_cfg["z_hi"] = z_hi

    def top_x(self, x):
        c = self.slope_cfg
        if x >= c["x_hi"]:
            return self.yt
        t = (x + self.hx) / c["run"]
        return self.yb + c["lip"] + t * (self.yt - self.yb - c["lip"])

    def top_z(self, z):
        c = self.slope_cfg
        if z >= c["z_hi"]:
            return self.yt
        t = (z + self.hz) / c["run"]
        return self.yb + c["lip"] + t * (self.yt - self.yb - c["lip"])

    def top_at(self, x, z):
        sh = self.e["shape"]
        if sh == "slope":
            return self.top_x(x)
        if sh == "corner_slope":
            return min(self.top_x(x), self.top_z(z))
        return self.yt

    def _slope_shift(self):
        return TOPW / math.cos(math.radians(self.slope_cfg["angle"]))

    # ------------------------------------------------ outer solids
    def outer(self, bevel):
        sh = self.e["shape"]
        bm = bmesh.new()
        if sh in ("box", "masonry", "arch", "window"):
            zin = 0.0003 if sh == "masonry" else 0.0
            for loop in outline_loops(self.cells):
                poly = inset_loop(loop, self.sx, self.sz, GAP)
                if zin:
                    poly = [(x, max(-self.hz + zin, min(self.hz - zin, z))) for x, z in poly]
                prism_xz(bm, poly, self.yb, self.yt)
        elif sh == "round":
            prism_xz(bm, circle(0, 0, P / 2 - GAP, ROUND_SEG), self.yb, self.yt)
        elif sh == "slope":
            c = self.slope_cfg
            xs = [-self.hx, c["x_hi"], self.hx] if c["x_hi"] < self.hx - 1e-9 else [-self.hx, self.hx]
            pts = []
            for x in xs:
                for z in (-self.hz, self.hz):
                    pts += [(x, self.yb, z), (x, self.top_x(x), z)]
            hull(bm, pts)
        elif sh == "slope_inverted":
            c = self.slope_cfg
            # underside rises from (x_hi, yb) to (-hx, yt - lip); top is flat
            pts = []
            for z in (-self.hz, self.hz):
                pts += [(self.hx, self.yb, z), (c["x_hi"], self.yb, z), (-self.hx, self.yt - c["lip"], z),
                        (-self.hx, self.yt, z), (self.hx, self.yt, z)]
            hull(bm, pts)
        elif sh == "corner_slope":
            c = self.slope_cfg
            xs = [-self.hx, c["x_hi"], self.hx]
            zs = [-self.hz, c["z_hi"], self.hz]
            pts = []
            for x in xs:
                for z in zs:
                    pts += [(x, self.yb, z), (x, min(self.top_x(x), self.top_z(z)), z)]
            hull(bm, pts)
        elif sh == "pyramid":
            p = self.e["pyramid"]
            yb2 = self.yb + p["base_thickness"]
            box(bm, -self.hx, self.hx, self.yb, yb2, -self.hz, self.hz)
            hb = bmesh.new()
            hull(hb, [(sx * self.hx, yb2 - 0.0001, sz * self.hz) for sx in (-1, 1) for sz in (-1, 1)] + [(0, p["apex_y"], 0)])
            if bevel:
                bevel_all(bm)
            _merge(bm, hb)
            return bm
        else:
            raise ValueError(sh)
        if bevel:
            bevel_all(bm)
        return bm

    # ------------------------------------------------ cutters
    def cavity(self):
        """Closed solid(s) to subtract for the hollow underside."""
        sh = self.e["shape"]
        bm = bmesh.new()
        if sh in ("box", "masonry", "arch", "window"):
            ceil = self.yt - TOPW
            if sh == "window":
                ceil = self.yb + self.e["window"]["sill_plates"] * PLATE - TOPW
            if self.e.get("height_plates", 3) == 1 and sh == "box":
                ceil = self.yt - TOPW
            for loop in outline_loops(self.hollow_cells):
                prism_xz(bm, inset_loop(loop, self.sx, self.sz, GAP + WALL), self.yb - EPS, ceil)
        elif sh == "round":
            prism_xz(bm, circle(0, 0, P / 2 - GAP - WALL, ROUND_SEG), self.yb - EPS, self.yt - TOPW)
        elif sh in ("slope", "corner_slope"):
            c = self.slope_cfg
            shift = self._slope_shift()
            x0, x1 = -self.hx + WALL, self.hx - WALL
            z0, z1 = -self.hz + WALL, self.hz - WALL
            ybot = self.yb - EPS
            floor_ok = self.yb + 0.0004   # never let the cavity ceiling come closer than this to the bottom

            def ceil_fn(x, z):
                return self.top_at(x, z) - shift

            xs = sorted({x0, x1, max(x0, min(x1, c["x_hi"]))})
            zs = sorted({z0, z1, max(z0, min(z1, c["z_hi"]))}) if sh == "corner_slope" else [z0, z1]
            # add the x (and z) where the ceiling meets floor_ok so the clipped hull is exact
            pts = []
            fine = 24
            for a in range(fine + 1):
                x = x0 + (x1 - x0) * a / fine
                for b in range(fine + 1 if sh == "corner_slope" else 2):
                    z = z0 + (z1 - z0) * b / (fine if sh == "corner_slope" else 1)
                    cy = ceil_fn(x, z)
                    if cy > floor_ok:
                        pts += [(x, ybot, z), (x, cy, z)]
            if len(pts) >= 8:
                hull(bm, pts)
        elif sh == "slope_inverted":
            c = self.slope_cfg
            box(bm, c["x_hi"] + WALL, self.hx - WALL, self.yb - EPS, self.yt - TOPW, -self.hz + WALL, self.hz - WALL)
        elif sh == "pyramid":
            p = self.e["pyramid"]
            box(bm, -self.hx + WALL, self.hx - WALL, self.yb - EPS, self.yb + p["base_thickness"] - 0.0004,
                -self.hz + WALL, self.hz - WALL)
        return bm

    def openings(self):
        """Through-openings present in every variant (arch, window)."""
        sh = self.e["shape"]
        if sh == "arch":
            a = self.e["arch"]
            hw, crown, rise = a["half_width"], a["crown_y"], a["rise"]
            ys = crown - rise
            poly = [(-hw, self.yb - EPS), (hw, self.yb - EPS)]
            seg = 12
            for i in range(seg + 1):
                t = math.pi * i / seg
                poly.append((hw * math.cos(t), ys + rise * math.sin(t)))
            poly.append((-hw, self.yb - EPS))
            poly = _dedupe(poly)
            bm = bmesh.new()
            prism_xy(bm, poly, -self.hz - EPS, self.hz + EPS)
            return bm
        if sh == "window":
            w = self.e["window"]
            fr = w["frame"]
            bm = bmesh.new()
            box(bm, -self.hx + fr, self.hx - fr, self.yb + w["sill_plates"] * PLATE, self.yt - fr, -self.hz - EPS, self.hz + EPS)
            return bm
        return None

    # ------------------------------------------------ additive details
    def studs(self, bm):
        st = self.e.get("studs", "all")
        if st == "all":
            pos = [self.cell_center(i, k) for i, k in self.cells]
        elif self.e.get("studs_are_positions"):
            pos = [(a * P, b * P) for a, b in st]
        else:
            pos = [self.cell_center(i, k) for i, k in st]
        for x, z in pos:
            y = self.top_at(x, z)
            cylinder(bm, x, z, STUD_R, y - 0.0003, y + STUD_H, STUD_SEG, drop_bottom=True)

    def side_studs(self, bm):
        ss = self.e.get("side_studs")
        if not ss:
            return
        y = ss["y"]
        for face in ss["faces"]:
            axis, sign = face[1], (1 if face[0] == "+" else -1)
            if axis == "z":
                along = [self.cell_center(i, 0)[0] for i in range(self.sx)]
                half = self.hz
            else:
                along = [self.cell_center(0, k)[1] for k in range(self.sz)]
                half = self.hx
            for a in along:
                tmp = bmesh.new()
                # build along +Y then rotate onto the face normal
                cylinder(tmp, 0, 0, STUD_R, -0.0003, STUD_H, STUD_SEG, drop_bottom=True)
                if axis == "z":
                    rot = Matrix.Rotation(sign * math.pi / 2, 4, 'X')          # +Y -> +Z (sign=+1)
                    m = Matrix.Translation((a, y, sign * half)) @ rot
                else:
                    rot = Matrix.Rotation(-sign * math.pi / 2, 4, 'Z')         # +Y -> +X (sign=+1)
                    m = Matrix.Translation((sign * half, y, a)) @ rot
                transform(tmp, m)
                _merge(bm, tmp)

    def tubes(self, bm):
        hc = set(self.hollow_cells)
        sh = self.e["shape"]
        if sh in ("round", "pyramid", "slope_inverted"):
            return
        ceil_base = self.yt - TOPW
        if sh == "window":
            ceil_base = self.yb + self.e["window"]["sill_plates"] * PLATE - TOPW
        shift = self._slope_shift() if self.slope_cfg else 0.0

        def ceiling(x, z, r=TUBE_RO):
            if sh in ("slope", "corner_slope"):
                # lowest cavity ceiling over the tube's footprint, so it never pokes through the slope
                return min(self.top_at(x + dx, z + dz) - shift for dx in (-r, 0, r) for dz in (-r, 0, r))
            return ceil_base

        two_wide = self.sx >= 2 and self.sz >= 2
        if two_wide:
            for gx in range(1, self.sx):
                for gz in range(1, self.sz):
                    around = sum((gx - di, gz - dk) in hc for di in (0, 1) for dk in (0, 1))
                    if around == 4:   # (an L corner's inner point has 3 cells; a tube there would stick out)
                        x, z = (gx - self.sx / 2) * P, (gz - self.sz / 2) * P
                        top = ceiling(x, z)
                        if top - self.yb > 0.0015:
                            ring(bm, x, z, TUBE_RO, TUBE_RI, self.yb, top + 0.0002, TUBE_SEG, drop_top=True)
        else:
            along_x = self.sx >= self.sz
            n = max(self.sx, self.sz)
            for g in range(1, n):
                a, b = ((g - 1, 0), (g, 0)) if along_x else ((0, g - 1), (0, g))
                if a in hc and b in hc:
                    x, z = (((g - n / 2) * P, 0.0) if along_x else (0.0, (g - n / 2) * P))
                    top = ceiling(x, z, PIN_R)
                    if top - self.yb > 0.0015:
                        cylinder(bm, x, z, PIN_R, self.yb, top + 0.0002, PIN_SEG, drop_top=True)

    def masonry(self, bm):
        if self.e["shape"] != "masonry":
            return
        jg = 0.0004
        rows = 3
        hgt = (self.yt - self.yb) / rows
        for side in (-1, 1):
            zf = side * self.hz
            zb = side * (self.hz - 0.0005)
            for r in range(rows):
                y0, y1 = self.yb + r * hgt + jg / 2, self.yb + (r + 1) * hgt - jg / 2
                off = (P / 2) if r % 2 else 0.0
                x = -self.hx - off
                while x < self.hx - 1e-6:
                    x0, x1 = max(-self.hx, x) + jg / 2, min(self.hx, x + P) - jg / 2
                    if x1 - x0 > 0.0008:
                        box(bm, x0, x1, y0, y1, min(zf, zb), max(zf, zb))
                    x += P

    # ------------------------------------------------ assemble one variant
    def build(self, variant):
        bevel = variant in ("complete", "hollow", "solid")
        hollow = variant in ("complete", "hollow", "hollow_nobevel")
        with_studs = variant == "complete"
        body = self.outer(bevel)
        cutters = []
        op = self.openings()
        if op:
            cutters.append(op)
        if hollow:
            cav = self.cavity()
            if len(cav.verts):
                cutters.append(cav)
        if cutters:
            body = boolean_difference(body, cutters)
        extra = bmesh.new()
        if hollow:
            self.tubes(extra)
        if with_studs:
            self.studs(extra)
            self.side_studs(extra)
        self.masonry(extra)
        _merge(body, extra)
        return body


# ================================================================ special (non-brick) shapes
def build_special(e):
    sh = e["shape"]
    bm = bmesh.new()
    if sh == "stud":
        cylinder(bm, 0, 0, STUD_R, -0.0004, 0.0015, STUD_SEG)
    elif sh == "stud_hollow":
        ring(bm, 0, 0, STUD_R, 0.0015, -0.0004, 0.0015, STUD_SEG)
    elif sh in ("tube", "tube_short", "tube_slope"):
        h = {"tube": 0.0086, "tube_short": 0.0022, "tube_slope": 0.0060}[sh]
        ring(bm, 0, 0, TUBE_RO, TUBE_RI, -h, 0.0, TUBE_SEG)
    elif sh in ("plant_flat", "plant_three_leaf"):
        yb, yt = -PLATE / 2, PLATE / 2
        cylinder(bm, 0, 0, STUD_R, yb, yt, STUD_SEG)
        if sh == "plant_flat":
            leaves = [(i * 72.0, 12.0, 0.0115, 0.0055, 0.0012, 0.0010) for i in range(5)]
        else:
            cylinder(bm, 0, 0, 0.0007, yt - 0.0002, 0.0140, 8)
            leaves = [(i * 120.0 + 30.0, 35.0, 0.0095, 0.0055, 0.0135, 0.0004) for i in range(3)]
        for yaw, tilt, length, width, y, r0 in leaves:
            leaf = bmesh.new()
            poly = []
            seg = 10
            for i in range(seg):
                t = 2 * math.pi * i / seg
                # leaf outline along +X, pointed tip
                xx = length / 2 * (1 + math.cos(t))
                zz = width / 2 * math.sin(t) * (0.35 + 0.65 * math.sin(math.pi * xx / length))
                poly.append((xx, zz))
            prism_xz(leaf, poly, -0.0003, 0.0003)
            m = (Matrix.Translation((0, y, 0)) @ Matrix.Rotation(math.radians(yaw), 4, 'Y') @
                 Matrix.Translation((r0, 0, 0)) @ Matrix.Rotation(math.radians(tilt), 4, 'Z'))
            transform(leaf, m)
            _merge(bm, leaf)
    elif sh == "figure":
        # Placeholder for the upstream 'Bob' model (unused; commented out of BrickData). Built upright with
        # its feet on the female connectors of Bob.prefab, then flipped 180 deg about X like the prefab expects.
        cx = 0.0258
        fy = -0.0603
        for zc in (-0.0122, 0.0122):
            box(bm, cx - 0.0039, cx + 0.0039, fy, fy + 0.0200, zc - 0.0059, zc + 0.0059)       # legs
        box(bm, cx - 0.0060, cx + 0.0060, fy + 0.0200, fy + 0.0440, -0.0185, 0.0185)            # torso
        for zc in (-0.0215, 0.0215):
            box(bm, cx - 0.0035, cx + 0.0035, fy + 0.0250, fy + 0.0430, zc - 0.0030, zc + 0.0030)  # arms
        cylinder(bm, cx, 0.0, 0.0085, fy + 0.0440, fy + 0.0590, 16)                              # head
        transform(bm, Matrix.Rotation(math.pi, 4, 'X'))
    else:
        raise ValueError(sh)
    return bm


# ================================================================ mesh plumbing
def _merge(dst, src):
    me = bpy.data.meshes.new("_merge")
    src.to_mesh(me)
    dst.from_mesh(me)
    bpy.data.meshes.remove(me)
    src.free()


def _dedupe(poly):
    out = []
    for p in poly:
        if not out or (abs(out[-1][0] - p[0]) > 1e-9 or abs(out[-1][1] - p[1]) > 1e-9):
            out.append(p)
    if len(out) > 1 and abs(out[0][0] - out[-1][0]) < 1e-9 and abs(out[0][1] - out[-1][1]) < 1e-9:
        out.pop()
    return out


def _obj_from_bm(bm, name):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def boolean_difference(body_bm, cutter_bms):
    body = _obj_from_bm(body_bm, "_body")
    body_bm.free()
    cut_objs = []
    for i, c in enumerate(cutter_bms):
        co = _obj_from_bm(c, f"_cut{i}")
        c.free()
        co.hide_render = True
        cut_objs.append(co)
        mod = body.modifiers.new(f"bool{i}", 'BOOLEAN')
        mod.operation = 'DIFFERENCE'
        mod.solver = 'EXACT'
        mod.object = co
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    out = bmesh.new()
    out.from_mesh(me)
    bpy.data.meshes.remove(me)
    for o in cut_objs + [body]:
        m = o.data
        bpy.data.objects.remove(o)
        bpy.data.meshes.remove(m)
    return out


def finalize(bm, global_scale):
    """Clean, triangulate, set normals/UVs, and convert Unity mesh space -> Blender space."""
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-7)
    bmesh.ops.dissolve_degenerate(bm, dist=1e-8, edges=list(bm.edges))
    bmesh.ops.triangulate(bm, faces=list(bm.faces), quad_method='BEAUTY', ngon_method='EAR_CLIP')
    # smooth shading only across shallow angles (cylinders); everything else sharp
    bm.normal_update()
    for e in bm.edges:
        if len(e.link_faces) == 2:
            e.smooth = e.calc_face_angle(0) < math.radians(35)
        else:
            e.smooth = False
    for f in bm.faces:
        f.smooth = True
    # box-projected UVs in Unity space
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            co = l.vert.co
            a, b = {0: (co.z, co.y), 1: (co.x, co.z), 2: (co.x, co.y)}[ax]
            l[uv].uv = (a / UV_TILE, b / UV_TILE)
    # Unity (x,y,z) -> Blender (-x, -z, y), divided by the importer's globalScale. det = -1 -> flip winding.
    m = Matrix(((-1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
    transform(bm, Matrix.Scale(1.0 / global_scale, 4) @ m)
    bmesh.ops.reverse_faces(bm, faces=list(bm.faces), flip_multires=False)
    bm.normal_update()


def export_fbx(bm, mesh_name, path):
    me = bpy.data.meshes.new(mesh_name)
    bm.to_mesh(me)
    me.validate()
    mat = bpy.data.materials.get(MATERIAL_NAME) or bpy.data.materials.new(MATERIAL_NAME)
    me.materials.append(mat)
    ob = bpy.data.objects.new(mesh_name, me)
    bpy.context.scene.collection.objects.link(ob)
    for o in bpy.context.scene.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.fbx(filepath=path, use_selection=True, object_types={'MESH'},
                             apply_scale_options='FBX_SCALE_ALL', global_scale=1.0, apply_unit_scale=True,
                             axis_forward='-Z', axis_up='Y', bake_space_transform=True,
                             mesh_smooth_type='EDGE', use_mesh_modifiers=False, use_tspace=False,
                             add_leaf_bones=False, bake_anim=False, path_mode='STRIP', embed_textures=False)
    stats = dict(verts=len(me.vertices), tris=len(me.polygons))
    bpy.data.objects.remove(ob)
    bpy.data.meshes.remove(me)
    return stats


# ================================================================ meta handling
def patched_meta(meta_text, mesh_name, upstream_ids):
    """Upstream .meta (same guid). If an upstream reference uses a fileID our mesh name would not hash to,
    record it in internalIDToNameTable so Unity keeps that fileID for our mesh (43 = Mesh class id)."""
    ours = mesh_file_id(mesh_name)
    keep = [i for i in upstream_ids if i != ours]
    if not keep:
        return meta_text, False
    entries = "".join(f"  - first:\n      43: {i}\n    second: {mesh_name}\n" for i in keep[:1])
    new, n = re.subn(r"  internalIDToNameTable: \[\]\n", "  internalIDToNameTable:\n" + entries, meta_text, count=1)
    if n != 1:
        raise RuntimeError("could not patch internalIDToNameTable")
    return new, True


# ================================================================ main
def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default=os.path.join(HERE, "bricks.json"))
    ap.add_argument("--upstream", default=os.path.normpath(os.path.join(HERE, "..", "..", "..", "Assets", "Resources", "BrickModels")))
    ap.add_argument("--out", default=os.path.normpath(os.path.join(HERE, "..", "..", "GeneratedBrickModels")))
    ap.add_argument("--only", default=None, help="regex on the relative file path")
    ap.add_argument("--no-meta", action="store_true", help="do not write .meta files next to the FBX")
    args = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0

    cat = json.load(open(args.catalog, encoding="utf-8"))
    manifest = []
    rx = re.compile(args.only) if args.only else None
    for e in cat["bricks"]:
        for rec in e["files"]:
            rel = rec["file"]
            if rx and not rx.search(rel):
                continue
            meta_path = os.path.join(args.upstream, rel.replace("/", os.sep) + ".meta")
            meta = open(meta_path, encoding="utf-8").read() if os.path.exists(meta_path) else None
            gs = rec["upstream_global_scale"]
            if meta:
                m = re.search(r"meshes:\s*\n(?:.*\n)*?\s*globalScale: ([\d.]+)", meta)
                gs = float(m.group(1)) if m else gs
            if e["shape"] in ("stud", "stud_hollow", "tube", "tube_short", "tube_slope", "plant_flat", "plant_three_leaf", "figure"):
                bm = build_special(e)
            else:
                bm = Brick(e).build(rec["variant"])
            # bounds in Unity space before conversion
            xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]; zs = [v.co.z for v in bm.verts]
            bounds = [[round(min(xs), 6), round(min(ys), 6), round(min(zs), 6)], [round(max(xs), 6), round(max(ys), 6), round(max(zs), 6)]]
            finalize(bm, gs)
            out_path = os.path.join(args.out, rel.replace("/", os.sep))
            stats = export_fbx(bm, rec["mesh_name"], out_path)
            bm.free()
            patched = False
            if meta and not args.no_meta:
                text, patched = patched_meta(meta, rec["mesh_name"], rec.get("upstream_mesh_file_ids", []))
                with open(out_path + ".meta", "w", encoding="utf-8", newline="\n") as fh:
                    fh.write(text)
            manifest.append(dict(file=rel, variant=rec["variant"], mesh_name=rec["mesh_name"],
                                 mesh_file_id=mesh_file_id(rec["mesh_name"]),
                                 upstream_mesh_file_ids=rec.get("upstream_mesh_file_ids", []),
                                 meta_patched=patched, global_scale=gs, unity_bounds=bounds, **stats))
            print(f"[brick] {rel}  tris={stats['tris']}  verts={stats['verts']}  gs={gs}  patched_meta={patched}", flush=True)
    if not rx:
        with open(os.path.join(args.out, "manifest.json"), "w", encoding="utf-8", newline="\n") as fh:
            json.dump(manifest, fh, indent=1)
    print(f"[brick] done: {len(manifest)} files -> {args.out}", flush=True)


if __name__ == "__main__":
    main(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])
