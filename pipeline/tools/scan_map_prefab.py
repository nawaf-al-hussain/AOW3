#!/usr/bin/env python3
"""Scan map.prefab.bundle + count object types across all bundles."""
import sys, os, json, collections

import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

BASE = "/home/z/my-project/scripts"
MAP_BUNDLE = f"{BASE}/bundles_all/map.prefab.bundle"
BUNDLES = f"{BASE}/bundles_all"

def summarize(env, name, max_gos=200):
    counts = collections.Counter()
    gos = []
    for obj in env.objects:
        t = obj.type.name
        counts[t] += 1
        if t == "GameObject" and len(gos) < max_gos:
            try:
                d = obj.read()
                gos.append(d.m_Name)
            except Exception:
                pass
    print(f"== {name} ==")
    for t, c in counts.most_common(20):
        print(f"  {t}: {c}")
    print(f"  first GameObject names: {gos[:40]}")
    return counts

if os.path.exists(MAP_BUNDLE):
    env = UnityPy.load(MAP_BUNDLE)
    summarize(env, "map.prefab.bundle", 400)
else:
    print("map bundle missing:", MAP_BUNDLE)

# quick type census of every bundle
print("\n=== all bundles census ===")
tot = collections.Counter()
for fn in sorted(os.listdir(BUNDLES)):
    p = os.path.join(BUNDLES, fn)
    try:
        env = UnityPy.load(p)
        c = collections.Counter(o.type.name for o in env.objects)
        tot.update(c)
        interesting = {k: v for k, v in c.items() if k in
                       ("AudioClip", "Mesh", "AnimationClip", "Texture2D", "GameObject", "Material", "Shader", "MonoBehaviour", "TextAsset")}
        print(f"{fn}: {interesting}")
    except Exception as e:
        print(f"{fn}: ERR {e}")
print("\nTOTAL:", dict(tot))
