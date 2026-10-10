#!/usr/bin/env python3
"""R6 phase 2 — scan map.prefab.bundle for the serialized BattleMap cell data.

The geometry export (export_map.py) took only Transforms/Meshes. The per-cell
pass-mask source (BattleCell -> ClientBattleCell.m_passMask) must live in a
MonoBehaviour / TextAsset inside the map prefab bundle. This scan inventories
every object and dumps candidate payload blobs.
"""
import os, sys, json, collections

import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

BUNDLE = "/home/z/my-project/scripts/bundles_all/map.prefab.bundle"
OUTDIR = "/home/z/my-project/aow3/reverse/evidence/combat"
os.makedirs(OUTDIR, exist_ok=True)

env = UnityPy.Environment()
env.load_files([BUNDLE])

counts = collections.Counter()
report = []
mono_named = []
textassets = []

for obj in env.objects:
    t = obj.type.name
    counts[t] += 1
    if t == "MonoBehaviour":
        try:
            d = obj.read()
            name = getattr(d, "m_Name", "") or ""
            script = getattr(d, "m_Script", None)
            spid = None
            try:
                spid = script.path_id if script else None
            except Exception:
                pass
            # raw size heuristic
            raw = b""
            try:
                raw = obj.get_raw_data()
            except Exception:
                pass
            mono_named.append((name, obj.path_id, spid, len(raw)))
        except Exception as e:
            mono_named.append(("<read-fail %s>" % e, obj.path_id, None, 0))
    elif t == "TextAsset":
        try:
            d = obj.read()
            textassets.append((d.m_Name, obj.path_id, len(d.m_Script)))
        except Exception as e:
            textassets.append(("<fail>", obj.path_id, 0))

report.append("map.prefab.bundle object census:")
for t, c in counts.most_common():
    report.append("  %-24s %d" % (t, c))

report.append("")
report.append("MonoBehaviours (name, path_id, script_pid, raw_bytes):")
for name, pid, spid, sz in sorted(mono_named, key=lambda x: -x[3])[:40]:
    report.append("  %-40s pid=%s script=%s raw=%d" % (name or "<noname>", pid, spid, sz))

report.append("")
report.append("TextAssets:")
for name, pid, sz in textassets:
    report.append("  %-40s pid=%s bytes=%d" % (name, pid, sz))

out = "\n".join(report)
open(os.path.join(OUTDIR, "r6-map-prefab-scan.txt"), "w").write(out + "\n")
print(out)
