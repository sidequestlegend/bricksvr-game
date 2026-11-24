"""Builds the port's brick catalogue (altspace/ts/src/catalogue.json) from the upstream game itself.

Plain Python 3, no Unity, no Blender. Reads, read-only:
  Assets/Scripts/BrickData.cs                      the in-game picker: prefab name, display name, category, mesh path,
                                                   UI scale, spawn rotation, hand-spawner offset (BrickData.cs:9-80)
  Assets/Resources/<prefab>.prefab                 the held brick: connectors, BrickAttachDetector.colliders, tile,
                                                   window, heightOverride (BrickAttachDetector.cs:12-43)
  Assets/Resources/<prefab> - Placed.prefab        the placed brick: its solid colliders (what CheckBox hits)
  altspace/tools/bricks/bricks.json                footprint, height, studs and the generated mesh files

Every pose is written in the brick root's space, in upstream world units (1 world unit = 1/7 mesh metre: the
prefabs show the mesh through CombinedModel at localScale 7). The TypeScript converts to its lattice unit.

  python altspace/tools/bricks/extract_catalogue.py            (from the repository root)

The order of `bricks` is the wire format's type number: append only, never reorder.
"""
import json
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
RES = os.path.join(REPO, "Assets", "Resources")
OUT = os.path.join(REPO, "altspace", "ts", "src", "catalogue.json")

# Prefabs with a held and a placed version that the picker does not offer (still loadable from saved data upstream).
EXTRA = [("1x1_4FaceSideStud", "1x1 (4 side studs)", "side_studs", "SideStudBricks/Brick_1x1_4FaceSideStud/Brick_1x1_4FaceSideStud_Complete")]

# ProjectSettings/TagManager.asset: 12 "lego" (held bricks), 15 "connector", 16 "placed connector", 17 "placed lego".
# BrickAttachDetector.CollidesWithBricks (BrickAttachDetector.cs:265) and LegoConnectorScript.BrickCollidingWith
# (LegoConnectorScript.cs:134-136) only test "lego" and "placed lego", so a placed brick's solid connector boxes
# (layer 16) are not obstacles.
PLACED_LEGO = 17

DOC = re.compile(r"^--- !u!(\d+) &(-?\d+)(?: stripped)?\s*$", re.M)
BRICK = re.compile(r'new Brick\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"(.*?)\),?\s*$', re.M)


def vec(s):
    d = dict(re.findall(r"(\w+): (-?[\d.eE+-]+)", s or ""))
    return [float(d[k]) for k in ("x", "y", "z", "w") if k in d]


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz]


def qrot(q, v):
    x, y, z, w = q
    tx, ty, tz = 2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])
    return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)]


def rnd(v, n=7):
    return [round(x, n) + 0.0 for x in v]


def parse_prefab(path):
    txt = open(path, encoding="utf-8", errors="ignore").read()
    ms = list(DOC.finditer(txt))
    docs = {m.group(2): (int(m.group(1)), txt[m.end(): ms[i + 1].start() if i + 1 < len(ms) else len(txt)]) for i, m in enumerate(ms)}
    gos, trs, go_tr, comps = {}, {}, {}, {}
    for k, (t, b) in docs.items():
        if t == 1:
            gos[k] = dict(name=(re.search(r"m_Name: ?(.*)", b).group(1).strip()), tag=re.search(r"m_TagString: (\S+)", b).group(1),
                          layer=int(re.search(r"m_Layer: (\d+)", b).group(1)), active=re.search(r"m_IsActive: (\d)", b).group(1) == "1")
        elif t == 4:
            g = re.search(r"m_GameObject: \{fileID: (-?\d+)\}", b).group(1)
            trs[k] = dict(go=g, p=vec(re.search(r"m_LocalPosition: (\{.*\})", b).group(1)), q=vec(re.search(r"m_LocalRotation: (\{.*\})", b).group(1)),
                          s=vec(re.search(r"m_LocalScale: (\{.*\})", b).group(1)), father=re.search(r"m_Father: \{fileID: (-?\d+)\}", b).group(1))
            go_tr[g] = k
        else:
            g = re.search(r"m_GameObject: \{fileID: (-?\d+)\}", b)
            if g:
                comps.setdefault(g.group(1), []).append((k, t, b))

    def root_space(tk):
        """(position, rotation, scale) of transform tk in its root's space (the root's own transform excluded)."""
        chain = []
        while tk in trs and trs[tk]["father"] != "0":
            chain.append(trs[tk])
            tk = trs[tk]["father"]
        p, q, s = [0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 1.0], [1.0, 1.0, 1.0]
        for t in reversed(chain):
            lp = [t["p"][i] * s[i] for i in range(3)]
            rp = qrot(q, lp)
            p = [p[i] + rp[i] for i in range(3)]
            q = qmul(q, t["q"])
            s = [s[i] * t["s"][i] for i in range(3)]
        return p, q, s

    def parent_name(g):
        f = trs[go_tr[g]]["father"]
        return gos[trs[f]["go"]]["name"] if f != "0" else None

    root_go = next(trs[k]["go"] for k in trs if trs[k]["father"] == "0")
    connectors = []
    for g, info in gos.items():
        if info["tag"] not in ("Connector-Male", "Connector-Female"):
            continue
        p, q, s = root_space(go_tr[g])
        connectors.append(dict(kind="male" if info["tag"] == "Connector-Male" else "female", name=info["name"], parent=parent_name(g),
                               p=rnd(p), q=rnd(q), scale=round(s[0], 6)))

    def box(ck, b):
        g = re.search(r"m_GameObject: \{fileID: (-?\d+)\}", b).group(1)
        p, q, s = root_space(go_tr[g])
        c = vec(re.search(r"m_Center: (\{.*\})", b).group(1))
        size = vec(re.search(r"m_Size: (\{.*\})", b).group(1))
        cw = qrot(q, [c[i] * s[i] for i in range(3)])
        return dict(object=gos[g]["name"], c=rnd([p[i] + cw[i] for i in range(3)]), size=rnd([size[i] * s[i] for i in range(3)]), q=rnd(q),
                    trigger=re.search(r"m_IsTrigger: (\d)", b).group(1) == "1", layer=gos[g]["layer"])

    boxes = {ck: box(ck, b) for g, lst in comps.items() for (ck, t, b) in lst if t == 65}
    detector = None
    attach = None
    for g, lst in comps.items():
        for ck, t, b in lst:
            if t != 114:
                continue
            if "maleConnectorParent" in b and "_maleConnectors" in b:
                cols = re.findall(r"- \{fileID: (-?\d+)\}", b.split("colliders:")[1].split("heightOverride")[0]) if "colliders:" in b else []
                detector = dict(tile=re.search(r"\n  tile: (\d)", b).group(1) == "1", window=re.search(r"\n  window: (\d)", b).group(1) == "1",
                                heightOverride=float(re.search(r"heightOverride: (-?[\d.eE+-]+)", b).group(1)),
                                colliders=[boxes[c] for c in cols if c in boxes],
                                rootBox=next((boxes[c2] for (c2, t2, _b) in comps.get(root_go, []) if t2 == 65 and c2 in boxes), None))
            if "swapPrefab:" in b and "normalPrefabName:" in b:
                attach = dict(swapPrefab=re.search(r"swapPrefab: ?(.*)", b).group(1).strip(), normalPrefabName=re.search(r"normalPrefabName: ?(.*)", b).group(1).strip())
    solid = [bx for bx in boxes.values() if not bx["trigger"]]
    return dict(connectors=connectors, detector=detector, attach=attach, solidBoxes=solid)


def parse_brickdata():
    src = open(os.path.join(REPO, "Assets", "Scripts", "BrickData.cs"), encoding="utf-8-sig").read()
    body = src.split("Bricks = new List<Brick>()")[1].split("};")[0]
    out = []
    for ln, line in enumerate(body.splitlines()):
        s = line.strip()
        if s.startswith("//") or not s.startswith("new Brick("):
            continue
        m = BRICK.search(s)
        rest = m.group(5)
        nums = re.findall(r"(-?[\d.]+)f", rest)
        ui = float(nums[0]) if nums else 1.0
        rot = [0.0, 0.0, 0.0]
        off = [0.0, 0.0, 0.0]
        vecs = re.findall(r"new Vector3\(([^)]*)\)", rest)
        if "Vector3.zero" in rest and vecs:
            off = [float(x.strip().rstrip("f")) for x in vecs[0].split(",")]
        elif vecs:
            rot = [float(x.strip().rstrip("f")) for x in vecs[0].split(",")]
            if len(vecs) > 1:
                off = [float(x.strip().rstrip("f")) for x in vecs[1].split(",")]
        out.append(dict(prefab=m.group(1), display=m.group(2), category=m.group(3), mesh=m.group(4), uiScale=ui, spawnEuler=rot, spawnOffset=off, picker=True))
    return out


def line_of(path, needle):
    for i, l in enumerate(open(path, encoding="utf-8-sig", errors="ignore"), 1):
        if needle in l:
            return i
    return 0


def main():
    cat = json.load(open(os.path.join(HERE, "bricks.json"), encoding="utf-8"))
    by_folder = {b["folder"]: b for b in cat["bricks"]}
    by_name = {b["name"]: b for b in cat["bricks"]}
    entries = parse_brickdata() + [dict(prefab=p, display=d, category=c, mesh=m, uiScale=1.0, spawnEuler=[0.0, 0.0, 0.0], spawnOffset=[0.0, 0.0, 0.0], picker=False) for p, d, c, m in EXTRA]
    bd_path = os.path.join(REPO, "Assets", "Scripts", "BrickData.cs")
    bricks = []
    placed_connectors = []
    for e in entries:
        held = parse_prefab(os.path.join(RES, e["prefab"] + ".prefab"))
        placed = parse_prefab(os.path.join(RES, e["prefab"] + " - Placed.prefab"))
        folder = "/".join(e["mesh"].split("/")[:2])
        g = by_folder.get(folder) or by_name[e["mesh"].split("/")[-1]]   # plants sit directly in Plants/
        files = {}
        for f in g["files"]:
            files.setdefault(f["variant"], []).append(f["file"])
        det = held["detector"]
        bricks.append(dict(
            prefab=e["prefab"], display=e["display"], category=e["category"], picker=e["picker"], uiScale=e["uiScale"],
            spawnEuler=e["spawnEuler"], spawnOffset=e["spawnOffset"],
            source=f"Assets/Scripts/BrickData.cs:{line_of(bd_path, chr(34) + e['prefab'] + chr(34))}" if e["picker"] else f"Assets/Resources/{e['prefab']}.prefab",
            model=dict(folder=folder, name=g["name"], shape=g["shape"], size=g["size"], heightPlates=g.get("height_plates"), bottomPlates=g.get("bottom_plates"),
                       studs=g.get("studs"), complete="BrickModels/" + e["mesh"], files=files),
            tile=det["tile"], window=det["window"], heightOverride=det["heightOverride"],
            connectors=[dict(kind=c["kind"], name=c["name"], p=c["p"], q=c["q"], scale=c["scale"]) for c in held["connectors"]],
            heldBoxes=[dict(c=b["c"], size=b["size"], q=b["q"]) for b in det["colliders"]],
            rootBox=dict(c=det["rootBox"]["c"], size=det["rootBox"]["size"], q=det["rootBox"]["q"]) if det["rootBox"] else None,
            placedBoxes=[dict(c=b["c"], size=b["size"], q=b["q"]) for b in placed["solidBoxes"] if b["layer"] == PLACED_LEGO],
        ))
        placed_connectors.append(placed["connectors"])
    doc = {
        "_doc": "Generated by altspace/tools/bricks/extract_catalogue.py from BrickData.cs, the held and placed prefabs in "
                "Assets/Resources and bricks.json. Poses are in the brick root's space in upstream world units (1 unit = 1/7 "
                "mesh metre). The index in `bricks` is the type number on the wire: append only, never reorder.",
        "bricks": bricks,
    }
    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(doc, fh, indent=1)
        fh.write("\n")
    n_conn = sum(len(b["connectors"]) for b in bricks)
    print(f"{len(bricks)} bricks ({sum(b['picker'] for b in bricks)} in the picker), {n_conn} connectors -> {os.path.relpath(OUT, REPO)}")
    for b, pc in zip(bricks, placed_connectors):
        diffs = [c["name"] for c, d in zip(sorted(b["connectors"], key=lambda c: (c["kind"], c["name"])), sorted(pc, key=lambda c: (c["kind"], c["name"]))) if c["p"] != d["p"]]
        if len(b["connectors"]) != len(pc) or diffs:
            print(f"  note: {b['prefab']}: placed prefab's connectors differ from the held one's ({len(b['connectors'])} vs {len(pc)}) {diffs}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
