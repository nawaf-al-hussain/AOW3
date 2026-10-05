#!/usr/bin/env python3
"""Rasterize land_chunk terrain meshes into a heightmap PNG + metadata JSON."""
import os, sys, json
import numpy as np
sys.path.insert(0, "/home/z/my-project/scripts/AOW3-repo/pipeline")
from extract_v3 import unpack_mesh
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"
from PIL import Image

BASE = "/home/z/my-project/scripts"
B = np.diag([-1.0, 1.0, -1.0]).astype(np.float64)

env = UnityPy.Environment()
env.load_files([f"{BASE}/bundles_all/map.prefab.bundle"])

# land chunk meshes live in the map serialized file
cnt = collections = None
import collections
cnt = collections.Counter()
for o in env.objects:
    if o.type.name == "Mesh":
        cnt[o.assets_file] += 1
mapsf = cnt.most_common(1)[0][0]

RES = 256
# real map extents (from map.json analysis, with margin)
X0, X1 = -84.0, 86.0
Z0, Z1 = -85.0, 55.0

acc = np.full((RES, RES), -100.0, np.float32)  # max-y accumulator
tris_total = 0
for o in env.objects:
    if o.type.name != "Mesh" or o.assets_file is not mapsf:
        continue
    d = o.read()
    name = d.m_Name
    if not name.startswith("land_chunk"):
        continue
    mc = unpack_mesh(d)
    v = mc["v"] @ B.T  # to glTF-ish world coords (x,z negated like our GLBs)
    idx = mc["idx"]
    subs = mc["sub"] or [[0, len(idx)]]
    tris = []
    for first, c in subs:
        si = idx[first:first+c].reshape(-1, 3)
        tris.append(si)
    if not tris:
        continue
    si = np.concatenate(tris)
    tris_total += len(si)
    p0 = v[si[:, 0]]; p1 = v[si[:, 1]]; p2 = v[si[:, 2]]
    # bbox per triangle -> grid cells
    gx0 = np.clip(((p0[:,0].clip(X0,X1)-X0)/(X1-X0)*RES).astype(int), 0, RES-1)
    gx1 = np.clip(((np.maximum(p0[:,0],np.maximum(p1[:,0],p2[:,0])).clip(X0,X1)-X0)/(X1-X0)*RES).astype(int)+1, 0, RES-1)
    gz0 = np.clip(((p0[:,2].clip(Z0,Z1)-Z0)/(Z1-Z0)*RES).astype(int), 0, RES-1)
    gz1 = np.clip(((np.maximum(p0[:,2],np.maximum(p1[:,2],p2[:,2])).clip(Z0,Z1)-Z0)/(Z1-Z0)*RES).astype(int)+1, 0, RES-1)
    for t in range(len(si)):
        xs0, xs1 = gx0[t], gx1[t]
        zs0, zs1 = gz0[t], gz1[t]
        if xs1 < xs0 or zs1 < zs0:
            continue
        # coarse: max y of triangle verts over covered cells
        ymax = max(p0[t,1], p1[t,1], p2[t,1])
        acc[zs0:zs1+1, xs0:xs1+1] = np.maximum(acc[zs0:zs1+1, xs0:xs1+1], ymax)

print("triangles rasterized:", tris_total)
valid = acc > -50
print("covered cells:", valid.sum(), "/", RES*RES)
ymax_all = acc[valid].max() if valid.any() else 0
print("max terrain y:", ymax_all)

HSCALE = max(1.0, float(np.ceil(ymax_all)))  # meters at 255
img = np.zeros((RES, RES), np.uint8)
img[valid] = np.clip(acc[valid] / HSCALE * 255, 0, 255).astype(np.uint8)
Image.fromarray(img, "L").save(f"{BASE}/map_export/heightmap.png")
meta = {"x0": X0, "x1": X1, "z0": Z0, "z1": Z1, "res": RES, "hscale": HSCALE}
json.dump(meta, open(f"{BASE}/map_export/heightmap.json", "w"))
print("heightmap written, hscale:", HSCALE)
