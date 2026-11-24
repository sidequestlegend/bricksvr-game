"""The upstream import for brick-builder: portkit's importer, then the regenerated brick models laid in.

    python altspace/tools/import_upstream_bricks.py            (from anywhere)

1. The start files are every held and placed brick prefab the catalogue names (altspace/ts/src/catalogue.json),
   the five Assets/Prefabs/BrickComponents prefabs and the hammer; portkit's importer copies what they reach.
2. 634 files in the upstream are Git LFS pointers whose objects are gone (HTTP 410). portkit's importer skips them
   (portkit d8f370d) and lists them in its report. altspace/GeneratedBrickModels/** (the regenerated brick models
   with the upstream .meta files, so the upstream GUIDs resolve) is then copied over
   Assets/Upstream/Assets/Resources/BrickModels/.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = HERE.parent                      # altspace/
REPO = PROJECT.parent
IMPORTER = REPO.parent / "portkit" / "tools" / "importer" / "import_upstream.py"


def main() -> None:
    config = json.loads((PROJECT / "upstream_import.json").read_text(encoding="utf-8"))
    catalogue = json.loads((PROJECT / "ts" / "src" / "catalogue.json").read_text(encoding="utf-8"))
    start = []
    for brick in catalogue["bricks"]:
        for name in (f"{brick['prefab']}.prefab", f"{brick['prefab']} - Placed.prefab"):
            if (REPO / "Assets" / "Resources" / name).is_file():
                start.append(f"Assets/Resources/{name}")
    start += [f"Assets/Prefabs/BrickComponents/{p.name}" for p in sorted((REPO / "Assets/Prefabs/BrickComponents").glob("*.prefab"))]
    start.append("Assets/Prefabs/Hammer.prefab")
    config["start"] = start
    config["source"] = str(REPO)
    destination = (PROJECT / config["destination"]).resolve()
    config["destination"] = str(destination)
    derived = PROJECT / "Library" / "PortKit" / "upstream_import.derived.json"
    derived.parent.mkdir(parents=True, exist_ok=True)
    derived.write_text(json.dumps(config, indent=1), encoding="utf-8")
    subprocess.run([sys.executable, str(IMPORTER), str(derived)], check=True)

    generated = PROJECT / "GeneratedBrickModels"
    target = destination / "Assets" / "Resources" / "BrickModels"
    copied = 0
    for src in sorted(generated.rglob("*")):
        if src.is_file() and src.name != "manifest.json":
            out = target / src.relative_to(generated)
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, out)
            copied += src.suffix.lower() == ".fbx"
    # folder .meta files of the generated tree (Unity makes them if missing; the upstream ones keep folder GUIDs)
    for folder in sorted(p for p in generated.rglob("*") if p.is_dir()):
        meta = REPO / "Assets" / "Resources" / "BrickModels" / (str(folder.relative_to(generated)) + ".meta")
        if meta.exists():
            shutil.copy2(meta, target / (str(folder.relative_to(generated)) + ".meta"))

    lines = [f"generated brick models copied in: {copied} FBX with their .meta files -> {target.relative_to(PROJECT)}"]
    print("\n".join(lines))
    with (destination / "IMPORT_REPORT.txt").open("a", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
