"""Verify the generated brick FBX files against what the upstream game expects. Plain Python 3, no Blender.

  python altspace/tools/bricks/verify_bricks.py [--models DIR] [--assets DIR] [--json OUT]

Checks per file:
  * binary FBX, Y-up, UnitScaleFactor 100 (metres), exactly one mesh Model + Geometry, no node transform
  * Model name == catalogue mesh_name; Unity fileID (xxHash64 "Type:Mesh->name0") == every upstream reference,
    or the written .meta maps the upstream fileID to the name (internalIDToNameTable)
  * normals + UV0 present; triangle count
  * Unity-space bounds (x mirrored, times the .meta globalScale) vs. the catalogue footprint/height
Checks against upstream prefabs (Assets/Resources/<brick>.prefab, CombinedModel scale 7):
  * every male connector of a held prefab has a stud top (or side-stud tip) under it in the Complete mesh
  * every female connector sits just under the mesh's bottom face, inside the footprint
"""
import os, re, sys, json, math, struct, zlib, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from unity_fileid import mesh_file_id  # noqa: E402


# ------------------------------------------------------------------ FBX (binary) reader
class Node:
    def __init__(self, name, props, children):
        self.name, self.props, self.children = name, props, children

    def find(self, n):
        return [c for c in self.children if c.name == n]

    def first(self, n):
        r = self.find(n)
        return r[0] if r else None


def _prop(f):
    t = f.read(1)
    if t == b'Y': return struct.unpack('<h', f.read(2))[0]
    if t == b'C': return f.read(1) != b'\0'
    if t == b'I': return struct.unpack('<i', f.read(4))[0]
    if t == b'F': return struct.unpack('<f', f.read(4))[0]
    if t == b'D': return struct.unpack('<d', f.read(8))[0]
    if t == b'L': return struct.unpack('<q', f.read(8))[0]
    if t in b'fdlib':
        n, enc, clen = struct.unpack('<III', f.read(12))
        data = f.read(clen)
        if enc == 1:
            data = zlib.decompress(data)
        return list(struct.unpack('<%d%s' % (n, {'f': 'f', 'd': 'd', 'l': 'q', 'i': 'i', 'b': 'b'}[t.decode()]), data))
    if t in (b'S', b'R'):
        n = struct.unpack('<I', f.read(4))[0]
        d = f.read(n)
        return d.decode('utf-8', 'replace') if t == b'S' else d
    raise ValueError(t)


def _node(f, ver):
    end, nprops, _ = struct.unpack('<QQQ', f.read(24)) if ver >= 7500 else struct.unpack('<III', f.read(12))
    name = f.read(f.read(1)[0]).decode('ascii', 'replace')
    if end == 0:
        return None
    props = [_prop(f) for _ in range(nprops)]
    kids = []
    while f.tell() < end:
        c = _node(f, ver)
        if c is None:
            break
        kids.append(c)
    f.seek(end)
    return Node(name, props, kids)


def read_fbx(path):
    with open(path, 'rb') as f:
        head = f.read(27)
        assert head.startswith(b'Kaydara FBX Binary'), "not a binary FBX"
        ver = struct.unpack('<I', head[23:27])[0]
        top = []
        while True:
            n = _node(f, ver)
            if n is None:
                break
            top.append(n)
    root = Node('root', [ver], top)
    info = {"version": ver}
    for p in root.first('GlobalSettings').first('Properties70').children:
        info[p.props[0]] = p.props[-1]
    geoms, models = [], []
    for o in root.first('Objects').children:
        nm = o.props[1].split('\x00\x01')[0]
        if o.name == 'Geometry':
            v = o.first('Vertices').props[0]
            pvi = o.first('PolygonVertexIndex').props[0]
            tris, cnt = 0, 0
            for i in pvi:
                cnt += 1
                if i < 0:
                    tris += cnt - 2
                    cnt = 0
            geoms.append(dict(name=nm, verts=[tuple(v[i:i + 3]) for i in range(0, len(v), 3)], tris=tris,
                              layers=[c.name for c in o.children if c.name.startswith('LayerElement')]))
        elif o.name == 'Model':
            props = {}
            p70 = o.first('Properties70')
            for pp in (p70.children if p70 else []):
                if pp.props[0] in ('Lcl Translation', 'Lcl Rotation', 'Lcl Scaling', 'PreRotation', 'PostRotation'):
                    props[pp.props[0]] = tuple(pp.props[4:7])
            models.append(dict(name=nm, type=o.props[2], props=props))
    info["geometry"], info["models"] = geoms, models
    info["materials"] = [o.props[1].split('\x00\x01')[0] for o in root.first('Objects').children if o.name == 'Material']
    return info


# ------------------------------------------------------------------ upstream prefab connectors
DOC = re.compile(r"^--- !u!(\d+) &(-?\d+)(?: stripped)?\s*$", re.M)


def _vec(s):
    d = dict(re.findall(r"(\w+): (-?[\d.e+-]+)", s or ""))
    return tuple(float(d[k]) for k in ("x", "y", "z", "w") if k in d)


def _qrot(q, v):
    x, y, z, w = q
    tx, ty, tz = 2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])
    return (v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx))


def prefab_connectors(path):
    """-> (mesh guid, mesh fileID, scale, [(kind, pos, rot)]) in CombinedModel mesh space, or None."""
    txt = open(path, encoding="utf-8", errors="ignore").read()
    ms = list(DOC.finditer(txt))
    docs = {m.group(2): (int(m.group(1)), txt[m.end(): ms[i + 1].start() if i + 1 < len(ms) else len(txt)]) for i, m in enumerate(ms)}
    go_name, go_tag, tr = {}, {}, {}
    mf = {}
    for k, (t, b) in docs.items():
        if t == 1:
            n, tg = re.search(r"m_Name: ?(.*)", b), re.search(r"m_TagString: (\S+)", b)
            go_name[k] = n.group(1).strip() if n else ""
            go_tag[k] = tg.group(1) if tg else ""
        elif t == 4:
            g = re.search(r"m_GameObject: \{fileID: (-?\d+)\}", b)
            if not g:
                continue
            ch = re.findall(r"- \{fileID: (-?\d+)\}", b.split("m_Children:")[1].split("m_Father")[0])
            tr[k] = dict(go=g.group(1), pos=_vec(re.search(r"m_LocalPosition: (\{.*\})", b).group(1)),
                         rot=_vec(re.search(r"m_LocalRotation: (\{.*\})", b).group(1)),
                         scale=_vec(re.search(r"m_LocalScale: (\{.*\})", b).group(1)), children=ch,
                         father=re.search(r"m_Father: \{fileID: (-?\d+)\}", b).group(1))
        elif t == 33:
            g = re.search(r"m_GameObject: \{fileID: (-?\d+)\}", b).group(1)
            m = re.search(r"m_Mesh: \{fileID: (-?\d+), guid: ([0-9a-f]{32})", b)
            if m:
                mf[g] = (int(m.group(1)), m.group(2))
    roots = [t for t, d in tr.items() if d["father"] == "0"]
    if not roots:
        return None
    kids = {go_name[tr[c]["go"]]: c for c in tr[roots[0]]["children"] if c in tr}
    cm = kids.get("CombinedModel")
    if not cm or tr[cm]["go"] not in mf:
        return None
    cmd = tr[cm]
    inv = (-cmd["rot"][0], -cmd["rot"][1], -cmd["rot"][2], cmd["rot"][3])
    s = cmd["scale"][0]
    out = []
    for side in ("MaleConnectors", "FemaleConnectors"):
        par = kids.get(side)
        if not par:
            continue
        pd = tr[par]
        for c in pd["children"]:
            if c not in tr:
                continue
            cd = tr[c]
            wp = [pd["pos"][i] + _qrot(pd["rot"], cd["pos"])[i] - cmd["pos"][i] for i in range(3)]
            mp = tuple(v / s for v in _qrot(inv, wp))
            out.append(("male" if go_tag[cd["go"]] == "Connector-Male" else "female", mp, cd["rot"]))
    fid, guid = mf[cmd["go"]]
    down = _qrot(inv, (0.0, -1.0, 0.0))   # world 'down' expressed in mesh space (Bob.prefab flips its model)
    return guid, fid, s, out, down


# ------------------------------------------------------------------ checks
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", default=os.path.normpath(os.path.join(HERE, "..", "..", "GeneratedBrickModels")))
    ap.add_argument("--assets", default=os.path.normpath(os.path.join(HERE, "..", "..", "..", "Assets")))
    ap.add_argument("--catalog", default=os.path.join(HERE, "bricks.json"))
    ap.add_argument("--json", default=None)
    args = ap.parse_args()

    cat = json.load(open(args.catalog, encoding="utf-8"))
    recs = {r["file"]: (e, r) for e in cat["bricks"] for r in e["files"]}
    guid2rel = {r["guid"]: f for f, (e, r) in recs.items()}
    results, problems = {}, []
    unity_verts = {}

    for rel, (e, r) in sorted(recs.items()):
        path = os.path.join(args.models, rel.replace("/", os.sep))
        res = {"file": rel}
        if not os.path.exists(path):
            problems.append(f"{rel}: MISSING")
            continue
        info = read_fbx(path)
        meta_txt = open(path + ".meta", encoding="utf-8").read() if os.path.exists(path + ".meta") else ""
        gs = float(re.search(r"meshes:\s*\n(?:.*\n)*?\s*globalScale: ([\d.]+)", meta_txt).group(1)) if meta_txt else r["upstream_global_scale"]
        if info.get("UpAxis") != 1 or info.get("UnitScaleFactor") != 100.0:
            problems.append(f"{rel}: axis/unit settings {info.get('UpAxis')} {info.get('UnitScaleFactor')}")
        if len(info["geometry"]) != 1 or len(info["models"]) != 1:
            problems.append(f"{rel}: expected 1 geometry/model, got {len(info['geometry'])}/{len(info['models'])}")
        model = info["models"][0]
        for k, v in model["props"].items():
            ident = (1.0, 1.0, 1.0) if k == 'Lcl Scaling' else (0.0, 0.0, 0.0)
            if any(abs(a - b) > 1e-6 for a, b in zip(v, ident)):
                problems.append(f"{rel}: node {k}={v} (mesh would not be in Unity space)")
        if model["name"] != r["mesh_name"]:
            problems.append(f"{rel}: model name {model['name']} != {r['mesh_name']}")
        fid = mesh_file_id(model["name"])
        refs = r.get("upstream_mesh_file_ids", [])
        mapped = re.findall(r"43: (-?\d+)\n    second: (.+)", meta_txt)
        ok_ids = all(i == fid or (str(i), model["name"]) in mapped for i in refs)
        if not ok_ids:
            problems.append(f"{rel}: upstream fileID(s) {refs} not satisfied (ours {fid}, meta map {mapped})")
        g = info["geometry"][0]
        if "LayerElementNormal" not in g["layers"] or "LayerElementUV" not in g["layers"]:
            problems.append(f"{rel}: missing normals/UVs {g['layers']}")
        if len(info["materials"]) != 1:
            problems.append(f"{rel}: materials {info['materials']}")
        uv = [(-x * gs, y * gs, z * gs) for x, y, z in g["verts"]]   # Unity: mirror X, apply globalScale
        unity_verts[rel] = uv
        lo = [min(p[i] for p in uv) for i in range(3)]
        hi = [max(p[i] for p in uv) for i in range(3)]
        res.update(mesh_name=model["name"], mesh_file_id=fid, upstream_ids=refs, ids_ok=ok_ids, tris=g["tris"],
                   verts=len(g["verts"]), global_scale=gs, unity_min=[round(v, 5) for v in lo], unity_max=[round(v, 5) for v in hi])
        # footprint/height vs catalogue (brick-like shapes only)
        if "size" in e and e["shape"] not in ("stud", "stud_hollow", "tube", "tube_short", "tube_slope", "figure", "plant_flat", "plant_three_leaf"):
            sx, sz = e["size"]
            ex = (sx * 0.008 / 2 - 0.0001, sz * 0.008 / 2 - 0.0001)
            yb = e.get("bottom_plates", -1.5) * 0.0032
            yt = yb + e.get("height_plates", 3) * 0.0032
            side = 0.0017 if e.get("side_studs") else 0.0
            bad = []
            if e["shape"] != "round":
                if abs(hi[0] - ex[0]) > 2e-5 + (side if "+x" in str(e.get("side_studs")) else 0) or abs(-lo[0] - ex[0]) > 2e-5 + (side if "-x" in str(e.get("side_studs")) else 0):
                    bad.append(f"x {lo[0]:.5f}..{hi[0]:.5f} vs +-{ex[0]:.5f}")
                if hi[2] - ex[1] > 2e-5 + (side + 1e-4 if e.get("side_studs") else 0) or -lo[2] - ex[1] > 2e-5 + (side + 1e-4 if "-z" in str(e.get("side_studs")) else 0):
                    bad.append(f"z {lo[2]:.5f}..{hi[2]:.5f} vs +-{ex[1]:.5f}")
            if abs(lo[1] - yb) > 2e-5:
                bad.append(f"bottom {lo[1]:.5f} vs {yb:.5f}")
            top_expect = yt + (0.0017 if (r["variant"] == "complete" and e.get("studs") not in ([], None)) else 0.0)
            if e["shape"] == "pyramid":
                top_expect = e["pyramid"]["apex_y"]
            ridge = e["shape"] == "slope" and e["slope"].get("flat_cells", 1) == 0 and r["variant"] in ("complete", "hollow", "solid")
            if abs(hi[1] - top_expect) > (0.00025 if ridge else 3e-5):   # a bevelled knife-edge ridge sits ~0.1 mm lower
                bad.append(f"top {hi[1]:.5f} vs {top_expect:.5f}")
            if bad:
                problems.append(f"{rel}: bounds " + "; ".join(bad))
        results[rel] = res

    # ---- connectors from the upstream held prefabs
    conn_report = []
    res_dir = os.path.join(args.assets, "Resources")
    for f in sorted(os.listdir(res_dir)):
        if not f.endswith(".prefab") or "Placed" in f:
            continue
        pc = prefab_connectors(os.path.join(res_dir, f))
        if not pc:
            continue
        guid, fid, scale, conns, down = pc
        rel = guid2rel.get(guid)
        if not rel or rel not in unity_verts:
            continue
        vs = unity_verts[rel]
        dax = max(range(3), key=lambda i: abs(down[i]))          # mesh axis pointing 'down' in the prefab
        dsg = 1 if down[dax] > 0 else -1
        bottom = max(p[dax] * dsg for p in vs)                    # extreme of the mesh in the down direction
        bottom_pts = [p for p in vs if abs(p[dax] * dsg - bottom) < 1e-5]
        others = [i for i in range(3) if i != dax]
        bb = [(min(p[i] for p in bottom_pts), max(p[i] for p in bottom_pts)) for i in others]
        ok_m = ok_f = 0
        fails = []
        for kind, c, rot in conns:
            cx, cy, cz = c
            if kind == "male":
                axis_dir = _qrot(rot, (0.0, 1.0, 0.0))             # connector local +Y = stud axis
                ax = max(range(3), key=lambda i: abs(axis_dir[i]))
                sgn = 1 if axis_dir[ax] > 0 else -1
                # stud end expected ~0.0004..0.0006 short of the connector along the axis, rim radius 0.0024
                tip = c[ax] - sgn * (0.000414 if ax == 1 else 0.00064)
                o = [i for i in range(3) if i != ax]
                hit = [p for p in vs if abs(p[ax] - tip) < 0.0003 and
                       abs(math.hypot(p[o[0]] - c[o[0]], p[o[1]] - c[o[1]]) - 0.0024) < 0.0004]
                if len(hit) >= 6:
                    ok_m += 1
                else:
                    fails.append(f"male@({cx:.4f},{cy:.4f},{cz:.4f}) axis={'xyz'[ax]}")
            else:
                depth_ok = abs((c[dax] * dsg - 0.00037) - bottom) < 0.0003
                inside = all(lo - 1e-4 <= c[i] <= hi + 1e-4 for i, (lo, hi) in zip(others, bb))
                if depth_ok and inside:
                    ok_f += 1
                else:
                    fails.append(f"female@({cx:.4f},{cy:.4f},{cz:.4f}) bottom={bottom * dsg:.5f}")
        conn_report.append(dict(prefab=f, mesh=rel, male_ok=ok_m, female_ok=ok_f, fails=fails))
        for x in fails:
            problems.append(f"{f} -> {rel}: connector without matching geometry: {x}")

    tris = sorted(((r["tris"], k) for k, r in results.items()), reverse=True)
    print(f"files checked: {len(results)} / {len(recs)}")
    print(f"fileIDs: {sum(r['ids_ok'] for r in results.values())} ok; "
          f"{sum(1 for r in results.values() if r['upstream_ids'] and r['upstream_ids'] == [r['mesh_file_id']])} match by name hash, "
          f"{sum(1 for k, (e, rr) in recs.items() if rr['name_source'].startswith('unknown'))} via .meta internalIDToNameTable, "
          f"{sum(1 for r in results.values() if not r['upstream_ids'])} unreferenced upstream")
    print(f"triangles: max {tris[0][0]} ({tris[0][1]}), median {tris[len(tris) // 2][0]}, total {sum(t for t, _ in tris)}")
    print(f"prefab connector checks: {len(conn_report)} held prefabs, "
          f"{sum(c['male_ok'] for c in conn_report)} male + {sum(c['female_ok'] for c in conn_report)} female connectors matched, "
          f"{sum(len(c['fails']) for c in conn_report)} unmatched")
    print(f"problems: {len(problems)}")
    for p in problems:
        print("  - " + p)
    if args.json:
        json.dump(dict(files=results, connectors=conn_report, problems=problems), open(args.json, "w"), indent=1)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
