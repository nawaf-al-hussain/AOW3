#!/usr/bin/env python3
"""Explore decoration bundles: Texture2D inventory, materials, mesh counts."""
import sys, os
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

B = "/home/z/my-project/scripts/bundles_all"
for name in sys.argv[1:] or ["decorations_jungle_assets_all"]:
    path = os.path.join(B, name)
    if not os.path.exists(path):
        path += ".bundle"
    env = UnityPy.load(path)
    texs, mats, meshes, gos, others = [], [], [], 0, {}
    for o in env.objects:
        tn = o.type.name
        if tn == "Texture2D":
            try:
                d = o.read()
                texs.append((d.m_Name, d.m_Width, d.m_Height, d.m_TextureFormat.name, getattr(d, "m_CompleteImageSize", 0)))
            except Exception as e:
                texs.append((f"ERR {e}", 0, 0, "", 0))
        elif tn == "Material":
            try:
                mats.append(o.read().m_Name)
            except Exception:
                pass
        elif tn == "Mesh":
            meshes.append(o)
        elif tn == "GameObject":
            gos += 1
        else:
            others[tn] = others.get(tn, 0) + 1
    print(f"=== {name}")
    print("  Texture2D:")
    for t in texs:
        print("   ", t)
    print("  Materials:", mats[:20])
    print("  Meshes:", len(meshes), " GameObjects:", gos)
    print("  Other types:", others)
