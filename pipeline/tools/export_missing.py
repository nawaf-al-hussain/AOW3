#!/usr/bin/env python3
"""Export map-referenced meshes missing from the decor GLB library.

Ground tiles, roads, paths, underbrush, stones + the map's own land chunks.
Convention matches fix_decor.py: vertices/normals @B.T (B=diag(-1,1,-1)),
original UVs, materials named, index entries carry mats->atlas mapping.
"""
import os, sys, json, collections
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PIPE = "/home/z/my-project/scripts/AOW3-repo/pipeline"
sys.path.insert(0, PIPE)
from extract_v3 import unpack_mesh

import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

BASE = "/home/z/my-project/scripts"
BUNDLES = f"{BASE}/bundles_all"
OUT_DECOR = f"{BASE}/AOW3-repo/docs/assets/models/decor"
os.makedirs(OUT_DECOR, exist_ok=True)

B = np.diag([-1.0, 1.0, -1.0]).astype(np.float64)
B4 = np.eye(4); B4[:3, :3] = B

TEX2ATLAS = {
    "tex_objects_jungle": "jungle", "tex_objects_jungle_alpha": "jungle",
    "tex_objects_jungle_2": "jungle2", "tex_objects_jungle_2_alpha": "jungle2",
    "tex_ground_jungle": "jungleground", "tex_ground_jungle_02": "jungleground2",
    "tex_terrain_jungle": "jungleterrain",
    "tex_objects_desert": "desert", "tex_objects_desert_alpha": "desert",
    "tex_ground_desert": "desertground", "tex_terrain_desert": "desertterrain",
    "tex_war_objects": "war", "tex_war_objects_alpha": "war",
    "tex_interface_box": "interface", "tex_cloud": "cloud",
}
SAFE = __import__("re").compile(r"[^A-Za-z0-9._-]")

def quat_to_mat(q):
    x, y, z, w = q
    n = x*x + y*y + z*z + w*w
    if n == 0: return np.eye(3)
    s = 2.0 / n
    return np.array([
        [1 - s*(y*y+z*z), s*(x*y - z*w),   s*(x*z + y*w)],
        [s*(x*y + z*w),   1 - s*(x*x+z*z), s*(y*z - x*w)],
        [s*(x*z - y*w),   s*(y*z + x*w),   1 - s*(x*x+y*y)]], np.float64)

def local_mat(p, q, s):
    M = np.eye(4)
    M[:3, :3] = quat_to_mat(q) @ np.diag(s)
    M[:3, 3] = p
    return M

def categorize(n):
    ln = n.lower()
    if "palm" in ln: return "palm"
    if "tree" in ln or "bent" in ln: return "tree"
    if "bush" in ln or "underbrush" in ln: return "bush"
    if "rock" in ln or "stone" in ln: return "rock"
    if "gras" in ln or "under" in ln: return "grass"
    if "ground" in ln or "land_chunk" in ln or "road" in ln or "path" in ln or "plane" in ln: return "ground"
    return "prop"

# ---------------- minimal GLB writer ----------------
class MiniGLB:
    def __init__(self):
        self.bin = bytearray(); self.views = []; self.accs = []
        self.meshes = []; self.nodes = []; self.materials = []; self.images = []; self.textures = []

    def _view(self, data):
        off = (len(self.bin) + 3) // 4 * 4
        self.bin.extend(b"\x00" * (off - len(self.bin)))
        self.bin.extend(data)
        self.views.append({"buffer": 0, "byteOffset": off, "byteLength": len(data)})
        return len(self.views) - 1

    def accessor(self, view, ctype, atype, count, mnmx=None):
        a = {"bufferView": view, "componentType": ctype, "type": atype, "count": count}
        if mnmx:
            a["min"] = mnmx[0]; a["max"] = mnmx[1]
        self.accs.append(a)
        return len(self.accs) - 1

    def add_material(self, name):
        self.materials.append({"name": name[:50], "pbrMetallicRoughness": {"metallicFactor": 0.0, "roughnessFactor": 0.95}, "doubleSided": True})
        return len(self.materials) - 1

    def save(self, path):
        gltf = {
            "asset": {"version": "2.0", "generator": "aow3-map-export"},
            "scene": 0, "scenes": [{"nodes": [0]}],
            "nodes": self.nodes, "meshes": self.meshes, "materials": self.materials,
            "accessors": self.accs, "bufferViews": self.views,
            "buffers": [{"byteLength": len(self.bin)}],
        }
        js = json.dumps(gltf).encode()
        pad_js = (4 - len(js) % 4) % 4
        js += b" " * pad_js
        bin_data = bytes(self.bin)
        pad_bin = (4 - len(bin_data) % 4) % 4
        bin_data += b"\x00" * pad_bin
        total = 12 + 8 + len(js) + 8 + len(bin_data)
        with open(path, "wb") as f:
            f.write(b"glTF", )
            f.write(struct.pack("<I", 2))
            f.write(struct.pack("<I", total))
            f.write(struct.pack("<I", len(js)))
            f.write(b"JSON")
            f.write(js)
            f.write(struct.pack("<I", len(bin_data)))
            f.write(b"BIN\x00")
            f.write(bin_data)

import struct

def main():
    env = UnityPy.Environment()
    for f in ["map.prefab.bundle", "decorations_jungle_assets_all", "decorations_common_assets_all", "decorations_desert_assets_all"]:
        env.load_files([f"{BUNDLES}/{f}"])

    index = json.load(open(f"{OUT_DECOR}/index.json"))
    have = {e["n"] for e in index}
    mp = json.load(open(f"{BASE}/map_export/map.json"))
    need = collections.Counter(e["m"] for e in mp if e["m"] and e["m"] not in have)
    print(f"need export: {len(need)} names, {sum(need.values())} instances")

    # map instances: meshName -> local matrix of first instance + material names
    go_name = {}
    go_local = {}     # gpid -> (M_local 4x4, parent chain negligible: bake LOCAL)
    mf_mesh = {}      # gpid -> mesh ptr
    mr_mats = {}      # gpid -> [material objs]
    for o in env.objects:
        tn = o.type.name
        try:
            if tn == "GameObject":
                go_name[(o.assets_file, o.path_id)] = o.read().m_Name
            elif tn == "MeshFilter":
                d = o.read()
                mf_mesh[(o.assets_file, d.m_GameObject.path_id)] = d.m_Mesh
            elif tn == "MeshRenderer":
                d = o.read()
                mr_mats[(o.assets_file, d.m_GameObject.path_id)] = d.m_Materials
        except Exception:
            pass
    # transforms in map sf only
    cnt = collections.Counter()
    for o in env.objects:
        if o.type.name == "Transform":
            cnt[o.assets_file] += 1
    mapsf = cnt.most_common(1)[0][0]
    name_mat = collections.defaultdict(collections.Counter)   # meshname -> Counter(matname)
    name_local = {}                                           # meshname -> first local matrix
    name_cab = collections.defaultdict(collections.Counter)   # meshname -> Counter(cab)
    for o in env.objects:
        if o.type.name != "Transform" or o.assets_file is not mapsf:
            continue
        try:
            t = o.read()
            gpid = t.m_GameObject.path_id
            mptr = mf_mesh.get((mapsf, gpid))
            if mptr is None or mptr.path_id == 0:
                continue
            mobj = mptr.deref()
            mn = mobj.read().m_Name
            cab = getattr(mobj.assets_file, "name", "") or "map"
            name_cab[mn][cab] += 1
            mats = mr_mats.get((mapsf, gpid), [])
            for mp2 in mats:
                if mp2 and mp2.path_id != 0:
                    try:
                        name_mat[mn][mp2.deref().read().m_Name] += 1
                    except Exception:
                        pass
            if mn not in name_local:
                p, q, s = t.m_LocalPosition, t.m_LocalRotation, t.m_LocalScale
                name_local[mn] = local_mat([p.x, p.y, p.z], [q.x, q.y, q.z, q.w], [s.x, s.y, s.z])
        except Exception:
            pass

    # texture registry: texname -> atlas  (from materials found)
    # resolve material -> _MainTex texture name via env-wide scan of materials
    matobj_by_name = {}
    for o in env.objects:
        if o.type.name == "Material":
            try:
                m = o.read()
                matobj_by_name[m.m_Name] = m
            except Exception:
                pass

    def atlas_of_mat(matname):
        m = matobj_by_name.get(matname)
        if m is None:
            return None
        try:
            for pp in m.m_SavedProperties.m_TexEnvs:
                key, sec = pp if isinstance(pp, tuple) else (pp.first, pp.second)
                if str(key) == "_MainTex" and sec.m_Texture is not None:
                    try:
                        tn = sec.m_Texture.deref().read().m_Name
                        if tn in TEX2ATLAS:
                            return TEX2ATLAS[tn]
                        k2 = "x_" + SAFE.sub("_", tn)[:30].lower()
                        print(f"  !! unknown texture {tn} -> {k2}")
                        return k2
                    except Exception:
                        pass
        except Exception:
            pass
        return None

    # mesh objects by name (prefer CAB the map references)
    mesh_by_name = collections.defaultdict(list)
    for o in env.objects:
        if o.type.name == "Mesh":
            try:
                mesh_by_name[o.read().m_Name].append(o)
            except Exception:
                pass

    extra_index = []
    exported = 0
    for mn, insts in need.most_common():
        try:
            cands = mesh_by_name.get(mn)
            if not cands:
                print("  !! mesh not found:", mn)
                continue
            pref = name_cab.get(mn)
            if pref:
                cands = sorted(cands, key=lambda o: -pref.get(getattr(o.assets_file, "name", ""), 0))
            mobj = cands[0]
            d = mobj.read()
            mc = unpack_mesh(d)
            v = mc["v"]; n = mc["n"]; uv = mc["uv"]; idx = mc["idx"]
            if v is None or len(v) == 0:
                print("  !! unpack fail:", mn)
                continue
            M = name_local.get(mn, np.eye(4))
            # mesh vertices stay in GO space; instance transform = GO world transform
            v = v @ B.T
            if n is not None and n.size:
                n = n @ B.T
            # material
            mats = list(name_mat.get(mn, {}).items())
            matname = mats[0][0] if mats else f"{mn}_mat"
            akey = atlas_of_mat(matname) or ("jungleground" if "land_chunk" in mn or "Ground" in mn else "jungle")
            glb = MiniGLB()
            mid = glb.add_material(matname)
            pv = glb._view(v.astype("<f4").tobytes())
            pa = glb.accessor(pv, 5126, "VEC3", len(v), (v.min(0).tolist(), v.max(0).tolist()))
            na = glb.accessor(glb._view(n.astype("<f4").tobytes()), 5126, "VEC3", len(n)) if n is not None and n.size else None
            ta = None
            if uv is not None and uv.size:
                ta = glb.accessor(glb._view(uv.astype("<f4").tobytes()), 5126, "VEC2", len(uv))
            subs = mc["sub"] or [[0, len(idx)]]
            prims = []
            for first, cnt2 in subs:
                si = idx[first:first+cnt2].astype("<u4")
                if len(si) < 3: continue
                iv = glb._view(si.tobytes())
                ia = glb.accessor(iv, 5125, "SCALAR", len(si))
                prims.append({"attributes": {"POSITION": pa, **({"NORMAL": na} if na else {}), **({"TEXCOORD_0": ta} if ta else {})},
                              "indices": ia, "material": mid})
            glb.meshes.append({"name": mn[:50], "primitives": prims})
            glb.nodes.append({"name": mn[:50], "mesh": 0})
            fn = f"dec_{SAFE.sub('_', mn)[:44]}_{(hash(mn) % 99999)}.glb".replace("-", "0")
            path = os.path.join(OUT_DECOR, fn)
            glb.save(path)
            h = float(v[:, 1].max() - v[:, 1].min()); w = float(v[:, 0].max() - v[:, 0].min()); l = float(v[:, 2].max() - v[:, 2].min())
            extra_index.append({"n": mn, "f": f"decor/{fn}", "cat": categorize(mn), "g": "map_real",
                                "vc": int(len(v)), "h": h, "w": w, "l": l,
                                "kb": os.path.getsize(path) // 1024,
                                "atlas": akey, "mats": {matname: akey}})
            exported += 1
            print(f"  + {mn}: {insts} inst, {len(v)} v, atlas={akey}, mat={matname}")
        except Exception as e:
            import traceback; traceback.print_exc()
    json.dump(extra_index, open(f"{BASE}/map_export/map_extra_index.json", "w"), indent=1)
    print("exported:", exported, "entries ->", f"{BASE}/map_export/map_extra_index.json")

if __name__ == "__main__":
    main()
