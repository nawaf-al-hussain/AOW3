#!/usr/bin/env python3.13
"""
AOW3 unit assembler: prefab bundle -> GLB (hierarchy + meshes + embedded PNG textures).
Unity(left-handed, +z fwd) -> glTF(right-handed): conjugate every local matrix
with B = 180deg rotation about Y, det=+1 so no winding flip needed.
Output: /home/z/my-project/scripts/glb/<name>.glb + units_meta.json
"""
import os, sys, json, struct, time, traceback
import numpy as np

BUNDLES = "/home/z/my-project/scripts/bundles_all"
GRAPHS = "/home/z/my-project/scripts/exv3/graphs"
OUT = "/home/z/my-project/scripts/glb"
os.makedirs(OUT, exist_ok=True)
ERRLOG = open(os.path.join(OUT, "err.log"), "a")
sys.stderr = ERRLOG

import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

ROSTER = {
    # f1 (blue)
    "f1_inf_light":        "b1a125dab42e9d",
    "f1_inf_heavy":        "b375d6096c5254",
    "f1_veh_torrent":      "6859c6599e9d5d",
    "f1_veh_hammer":       "75fe9c0eeb438f",
    "f1_veh_shield":       "43fe5cd8b57878",
    "f1_veh_fortress":     "8b95a0c6cc607a",
    "f1_veh_zeus":         "1b584ac3d6fc64",
    "f1_veh_typhoon":      "e97972db0c3f98",
    "f1_avia_helicopter":  "1b6a17d25edb04",
    "f1_bld_hq":           "b78b98185178e0",
    "f1_bld_barracks":     "029e3b7a9739f6",
    "f1_bld_factory_light":"99823abad0b801",
    "f1_bld_factory_heavy":"d94e9d9b17c0f1",
    "f1_bld_supply":       "3aab04a06ebdd3",
    "f1_bld_power":        "e6effa82257beb",
    "f1_bld_tower":        "08035cfc08ce6d",
    "f1_bld_bunker":       "d3d7cc6e59171c",
    # f2 (red)
    "f2_inf_light":        "19d4d9fc404834",
    "f2_inf_heavy":        "8a3461da3418ec",
    "f2_inf_sniper":       "afb02b8329fd93",
    "f2_veh_armadillo":    "db6305c33ead05",
    "f2_veh_coyote":       "d8a1c78043eea9",
    "f2_veh_chameleon":    "f2090bbdc0c908",
    "f2_veh_jaguar":       "3e71a1090a4f26",
    "f2_veh_mammoth":      "f97b67ca001f79",
    "f2_veh_porcupine":    "a5caae7f6dcd26",
    "f2_avia_helicopter":  "1f21485a3b38f6",
}

# ---------------- small math lib ----------------
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

B = np.diag([-1.0, 1.0, -1.0]).astype(np.float64)
B4 = np.eye(4); B4[:3, :3] = B

def conv(M):
    """Unity local matrix -> glTF local matrix."""
    return B4 @ M @ B4

def mat_to_trs(M):
    """4x4 -> (translation, quaternion xyzw, scale)"""
    p = M[:3, 3].copy()
    sx = np.linalg.norm(M[:3, 0]); sy = np.linalg.norm(M[:3, 1]); sz = np.linalg.norm(M[:3, 2])
    R = M[:3, :3].copy()
    R[:, 0] = R[:, 0] / (sx if sx > 1e-12 else 1.0)
    R[:, 1] = R[:, 1] / (sy if sy > 1e-12 else 1.0)
    R[:, 2] = R[:, 2] / (sz if sz > 1e-12 else 1.0)
    # matrix -> quaternion (shepperd)
    tr = R[0, 0] + R[1, 1] + R[2, 2]
    if tr > 0:
        S = np.sqrt(tr + 1.0) * 2
        w = 0.25 * S; x = (R[2, 1] - R[1, 2]) / S; y = (R[0, 2] - R[2, 0]) / S; z = (R[1, 0] - R[0, 1]) / S
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]:
        S = np.sqrt(1.0 + R[0, 0] - R[1, 1] - R[2, 2]) * 2
        w = (R[2, 1] - R[1, 2]) / S; x = 0.25 * S; y = (R[0, 1] + R[1, 0]) / S; z = (R[0, 2] + R[2, 0]) / S
    elif R[1, 1] > R[2, 2]:
        S = np.sqrt(1.0 + R[1, 1] - R[0, 0] - R[2, 2]) * 2
        w = (R[0, 2] - R[2, 0]) / S; x = (R[0, 1] + R[1, 0]) / S; y = 0.25 * S; z = (R[1, 2] + R[2, 1]) / S
    else:
        S = np.sqrt(1.0 + R[2, 2] - R[0, 0] - R[1, 1]) * 2
        w = (R[1, 0] - R[0, 1]) / S; x = (R[0, 2] + R[2, 0]) / S; y = (R[1, 2] + R[2, 1]) / S; z = 0.25 * S
    q = [float(x), float(y), float(z), float(w)]
    n = np.sqrt(sum(c * c for c in q))
    q = [c / (n or 1) for c in q]
    return p.tolist(), q, [float(sx), float(sy), float(sz)]

# ---------------- GLB builder ----------------
class GLB:
    def __init__(self):
        self.bin = bytearray()
        self.views = []   # {buffer, byteOffset, byteLength, target?}
        self.accs = []
        self.images = []
        self.textures = []
        self.materials = []
        self.meshes = []
        self.nodes = []

    def _view(self, data, align=4):
        while len(self.bin) % align:
            self.bin.append(0)
        off = len(self.bin)
        self.bin.extend(data)
        self.views.append({"buffer": 0, "byteOffset": off, "byteLength": len(data)})
        return len(self.views) - 1

    def accessor(self, view, ctype, comp, count, mn=None, mx=None):
        CT = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
        self.accs.append({"bufferView": view, "componentType": ctype, "count": count,
                          "type": comp, **({"min": mn, "max": mx} if mn is not None else {})})
        return len(self.accs) - 1

    def add_image_png(self, png_bytes):
        v = self._view(png_bytes)
        self.images.append({"bufferView": v, "mimeType": "image/png"})
        self.textures.append({"source": len(self.images) - 1, "sampler": 0})
        return len(self.textures) - 1

    def add_material(self, name, tex_idx=None, color=None, alpha=False):
        m = {"name": name[:60], "pbrMetallicRoughness": {"metallicFactor": 0.0, "roughnessFactor": 0.9}}
        if tex_idx is not None:
            m["pbrMetallicRoughness"]["baseColorTexture"] = {"index": tex_idx}
        if color is not None:
            m["pbrMetallicRoughness"]["baseColorFactor"] = color
        if alpha:
            m["alphaMode"] = "MASK"
            m["doubleSided"] = True
        self.materials.append(m)
        return len(self.materials) - 1

    def add_mesh(self, name, v, n, uv, idx, subs, mat_ids):
        pv = self._view(v.astype('<f4').tobytes())
        nv = self._view(n.astype('<f4').tobytes()) if n.size else None
        tv = self._view(uv.astype('<f4').tobytes()) if uv.size else None
        mn, mx = v.min(0).tolist(), v.max(0).tolist()
        pa = self.accessor(pv, 5126, "VEC3", len(v), mn, mx)
        na = self.accessor(nv, 5126, "VEC3", len(n)) if n.size else None
        ta = self.accessor(tv, 5126, "VEC2", len(uv)) if uv.size else None
        prims = []
        for si, (first, cnt) in enumerate(subs or [[0, len(idx)]]):
            sub_idx = idx[first:first+cnt]
            if len(sub_idx) < 3:
                continue
            iv = self._view(sub_idx.astype('<u4').tobytes())
            ia = self.accessor(iv, 5125, "SCALAR", len(sub_idx))
            mat = None
            if mat_ids:
                mat = mat_ids[si % len(mat_ids)] if si < len(mat_ids) else mat_ids[-1]
            prims.append({"attributes": {"POSITION": pa, **({"NORMAL": na} if na is not None else {}),
                                         **({"TEXCOORD_0": ta} if ta is not None else {})},
                          "indices": ia, **({"material": mat} if mat is not None else {})})
        if not prims:
            return None
        self.meshes.append({"name": name[:50], "primitives": prims})
        return len(self.meshes) - 1

    def add_node(self, name, children=None, mesh=None, trs=None):
        nd = {"name": name[:50]}
        if children: nd["children"] = children
        if mesh is not None: nd["mesh"] = mesh
        if trs:
            p, r, s = trs
            nd["translation"] = p; nd["rotation"] = r; nd["scale"] = s
        self.nodes.append(nd)
        return len(self.nodes) - 1

    def save(self, path, roots):
        gltf = {
            "asset": {"version": "2.0", "generator": "aow3-assembler"},
            "scene": 0, "scenes": [{"nodes": roots}],
            "nodes": self.nodes, "meshes": self.meshes,
            "materials": self.materials or [{}],
            "textures": self.textures, "images": self.images,
            "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
            "accessors": self.accs, "bufferViews": self.views,
            "buffers": [{"byteLength": len(self.bin)}]}
        js = json.dumps(gltf, separators=(',', ':')).encode()
        while len(js) % 4: js += b' '
        while len(self.bin) % 4: self.bin.append(0)
        total = 12 + 8 + len(js) + 8 + len(self.bin)
        with open(path, "wb") as f:
            f.write(struct.pack('<III', 0x46546C67, 2, total))
            f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
            f.write(struct.pack('<II', len(self.bin), 0x004E4942)); f.write(bytes(self.bin))

# ---------------- prefab loading ----------------
def find_bundle(prefix):
    for f in os.listdir(BUNDLES):
        if f.startswith(prefix):
            return os.path.join(BUNDLES, f)
    return None

def load_env_with_deps(path, depth=2):
    files = [path]
    seen = {os.path.basename(path)}
    for _ in range(depth):
        added = []
        env = UnityPy.load(*files)
        exts = set()
        for f in env.files.values():
            for e in getattr(f, "externals", []) or []:
                nm = os.path.basename(str(getattr(e, "path", "") or getattr(e, "name", "")))
                nm = nm.replace(".resS", "")
                if nm and nm not in seen and not nm.startswith("globalgamemanagers") and "unity_default" not in nm and "unity_builtin" not in nm:
                    p = os.path.join(BUNDLES, nm)
                    if os.path.exists(p):
                        exts.add(p)
        for p in exts:
            seen.add(os.path.basename(p))
            added.append(p)
        if not added:
            break
        files.extend(added)
    return UnityPy.load(*files)

def texture_png_bytes(t):
    try:
        img = t.image
        if img is None: return None
        import io
        from PIL import Image
        b = io.BytesIO()
        img.save(b, "PNG")
        return b.getvalue()
    except Exception:
        return None

def assemble(name, hash_prefix):
    path = find_bundle(hash_prefix)
    if not path:
        return f"[{name}] bundle not found"
    env = load_env_with_deps(path)
    objs = list(env.objects)
    gos = {o.path_id: o.read().m_Name for o in objs if o.type.name == "GameObject"}
    trs = {}
    for o in objs:
        if o.type.name == "Transform":
            d = o.read()
            gp = d.m_Father
            fid = getattr(gp, "file_id", None) if not hasattr(gp, "m_FileID") else gp.m_FileID
            fpid = getattr(gp, "path_id", None) if not hasattr(gp, "m_PathID") else gp.m_PathID
            t, p, s = d.m_LocalRotation, d.m_LocalPosition, d.m_LocalScale
            ch = [getattr(c, "path_id", None) if not hasattr(c, "m_PathID") else c.m_PathID for c in d.m_Children]
            trs[o.path_id] = {
                "ch": ch,
                "go": getattr(d.m_GameObject, "path_id", None) if not hasattr(d.m_GameObject, "m_PathID") else d.m_GameObject.m_PathID,
                "fa": (None if fid != 0 else fpid),
                "M": local_mat([float(p.x), float(p.y), float(p.z)],
                               [float(t.x), float(t.y), float(t.z), float(t.w)],
                               [float(s.x), float(s.y), float(s.z)])}
    # components per gameobject
    mf_by_go, rend_by_go = {}, {}
    for o in objs:
        tn = o.type.name
        if tn in ("MeshFilter", "SkinnedMeshRenderer", "MeshRenderer"):
            d = o.read()
            gp = d.m_GameObject
            gpid = gp.path_id if not hasattr(gp, "m_PathID") else gp.m_PathID
            if tn == "MeshFilter":
                mf_by_go[gpid] = d.m_Mesh
            else:
                rend_by_go.setdefault(gpid, []).append((tn, d))
    # texture cache
    tex_cache = {}
    def mat_info(mat_obj):
        """return (png_bytes or None, name)"""
        try:
            m = mat_obj.read()
            props = m.m_SavedProperties
            tex_pid = None
            for pp in props.m_TexEnvs:
                key, sec = pp if isinstance(pp, tuple) else (pp.first, pp.second)
                if str(key) == "_MainTex":
                    tex = sec.m_Texture
                    if tex is not None and getattr(tex, "path_id", None):
                        tex_pid = tex
            if tex_pid is None:
                for pp in props.m_TexEnvs:
                    key, sec = pp if isinstance(pp, tuple) else (pp.first, pp.second)
                    tex = sec.m_Texture
                    if tex is not None and getattr(tex, "path_id", None):
                        tex_pid = tex
                        break
            if tex_pid is None:
                return None, m.m_Name
            tid = tex_pid.path_id
            if tid not in tex_cache:
                tex_cache[tid] = texture_png_bytes(tex_pid.read())
            return tex_cache[tid], m.m_Name
        except Exception as e:
            print("MAT_INFO FAIL:", type(e).__name__, str(e)[:150], flush=True)
            return None, "mat"

    glb = GLB()
    mesh_cache = {}
    mat_cache = {}

    def bone_world(bone_pid, depth=0):
        """world matrix (Unity space) of a transform by walking the hierarchy"""
        if depth > 32 or bone_pid not in trs:
            return np.eye(4)
        tr = trs[bone_pid]
        fa = tr["fa"]
        if fa in (None, 0) or fa not in trs:
            return tr["M"]
        return bone_world(fa, depth + 1) @ tr["M"]

    def get_mesh(mesh_ptr):
        pid = mesh_ptr.path_id if not hasattr(mesh_ptr, "m_PathID") else mesh_ptr.m_PathID
        if pid in mesh_cache: return mesh_cache[pid]
        try:
            d = mesh_ptr.read()
        except Exception:
            mesh_cache[pid] = None
            return None
        try:
            sysv = __import__("extract_v3", fromlist=["unpack_mesh"]).unpack_mesh(d)
            v, n, uv, idx, subs = sysv["v"], sysv["n"], sysv["uv"], sysv["idx"], sysv["sub"]
            if v is None or len(v) < 12:
                mesh_cache[pid] = None
                return None
            mesh_cache[pid] = {"v": v.astype(np.float32), "n": (n.astype(np.float32) if n is not None and n.size else np.zeros(0, np.float32)),
                               "uv": (uv.astype(np.float32) if uv is not None and uv.size else np.zeros(0, np.float32)),
                               "idx": idx.astype(np.uint32), "sub": subs, "name": d.m_Name,
                               "bidx": sysv.get("bidx", np.zeros(0, np.uint32)),
                               "w": sysv.get("w", np.zeros(0, np.float32)),
                               "bi4": sysv.get("bi4", np.zeros(0, np.uint32)),
                               "bind": getattr(d, "m_BindPose", None)}
            return mesh_cache[pid]
        except Exception:
            traceback.print_exc(file=ERRLOG)
            mesh_cache[pid] = None
            return None

    def bake_skin(mc, bones_ptrs):
        """hard-skin bake: v' = boneWorld x bindPose^-1 x v per rigid bone index"""
        bidx = mc.get("bidx")
        bp = mc.get("bind")
        if bidx is None or not bidx.size or not bp or len(bp) == 0:
            return mc
        try:
            v, n = mc["v"].astype(np.float64), mc["n"].astype(np.float64) if mc["n"].size else None
            bind = []
            for m4 in bp:
                M = np.eye(4)
                for r, c in ((0,0),(0,1),(0,2),(0,3),(1,0),(1,1),(1,2),(1,3),
                             (2,0),(2,1),(2,2),(2,3),(3,0),(3,1),(3,2),(3,3)):
                    M[r, c] = float(getattr(m4, f"e{r}{c}"))
                bind.append(M)  # bindPose = worldToLocal at bind
            nbones = len(bones_ptrs)
            skins = []
            for i in range(min(nbones, len(bind))):
                bp_ptr = bones_ptrs[i]
                bpid = bp_ptr.path_id if not hasattr(bp_ptr, "m_PathID") else bp_ptr.m_PathID
                fid = bp_ptr.file_id if not hasattr(bp_ptr, "m_FileID") else bp_ptr.m_FileID
                if fid in (0, None) and bpid in trs:
                    bw = bone_world(bpid)
                else:
                    bw = np.eye(4)
                skins.append(bind[i])  # vertices are bone-local at bind
            w4, i4 = mc.get("w"), mc.get("bi4")
            if w4 is not None and w4.size and i4 is not None and i4.size:
                # weighted skinning
                for i in range(v.shape[0]):
                    acc_v = np.zeros(3); acc_n = np.zeros(3) if n is not None else None
                    for k in range(4):
                        wgt = float(w4[i][k])
                        if wgt <= 0: continue
                        bi = int(i4[i][k])
                        if bi >= len(skins): continue
                        S = skins[bi]
                        acc_v += wgt * (S[:3, :3] @ v[i] + S[:3, 3])
                        if acc_n is not None:
                            acc_n += wgt * (S[:3, :3] @ n[i])
                    v[i] = acc_v
                    if acc_n is not None:
                        n[i] = acc_n
            else:
                for i in range(v.shape[0]):
                    bi = int(bidx[i])
                    if bi >= len(skins):
                        continue
                    S = skins[bi]
                    v[i] = (S @ np.append(v[i], 1.0))[:3]
                    if n is not None:
                        n[i] = S[:3, :3] @ n[i]
            if n is not None:
                ln = np.linalg.norm(n, axis=1, keepdims=True)
                n = n / np.maximum(ln, 1e-9)
            mc["v"] = v.astype(np.float32)
            mc["n"] = n.astype(np.float32) if n is not None else mc["n"]
        except Exception:
            traceback.print_exc(file=ERRLOG)
        return mc

    def build_node(tid, depth=0):
        """recursively create glTF nodes for transform subtree"""
        if tid not in trs or depth > 24:
            return None
        tr = trs[tid]
        gpid = tr["go"]
        gname = gos.get(gpid, "node")
        M = conv(tr["M"])
        trs_out = mat_to_trs(M)
        # child transforms
        kids = []
        for c in tr["ch"]:
            r = build_node(c, depth + 1)
            if r is not None: kids.append(r)
        # attach rendered meshes at this node
        mesh_node_ids = []
        mesh_ptr = mf_by_go.get(gpid)
        if mesh_ptr is None and gpid in rend_by_go:
            for tn, rd in rend_by_go[gpid]:
                if tn == "SkinnedMeshRenderer" and getattr(rd, "m_Mesh", None) is not None:
                    mesh_ptr = rd.m_Mesh
                    break
        if mesh_ptr is not None and gpid in rend_by_go:
            mc = get_mesh(mesh_ptr)
            if mc:
                # skinned: bake rigid bone transforms into vertices (bind pose assembly)
                for tn, rd in rend_by_go[gpid]:
                    if tn == "SkinnedMeshRenderer":
                        bones = getattr(rd, "m_Bones", None) or []
                        if bones:
                            mc = bake_skin(mc, bones)
                # Unity->glTF: conjugate baked vertex data with B
                v = mc["v"] @ B.T
                n = mc["n"] @ B.T if mc["n"].size else mc["n"]
                uv, idx, subs, mname = mc["uv"], mc["idx"], mc["sub"], mc["name"]
                mat_ids = []
                for tn, rd in rend_by_go[gpid]:
                    mats = getattr(rd, "m_Materials", []) or []
                    for mp in mats:
                        mpid = mp.path_id if not hasattr(mp, "m_PathID") else mp.m_PathID
                        if mpid not in mat_cache:
                            png, mn2 = None, "mat"
                            try:
                                png, mn2 = mat_info(mp)
                            except Exception as e:
                                print("MAT LOOP FAIL:", type(e).__name__, str(e)[:120], flush=True)
                            ti = glb.add_image_png(png) if png else None
                            mat_cache[mpid] = glb.add_material(mn2, ti, alpha=True)
                        if mat_cache[mpid] not in mat_ids:
                            mat_ids.append(mat_cache[mpid])
                mi = glb.add_mesh(mname or gname, v, n, uv, idx, subs, mat_ids or [None])
                if mi is not None:
                    mesh_node_ids.append(glb.add_node(gname + "_mesh", mesh=mi))
        # record muzzle points
        if gname.startswith("muzzle"):
            MUNIZLES.setdefault(name, []).append({"n": gname, "p": tr["M"][:3, 3].tolist()})
        if not kids and not mesh_node_ids and not gname.startswith("muzzle"):
            return None
        me = glb.add_node(gname, children=kids + mesh_node_ids, trs=trs_out)
        return me

    MUNIZLES = {}
    # roots = transforms with fa None
    roots = [t for t, d in trs.items() if d["fa"] in (None, 0)]
    root_nodes = []
    for r in roots:
        # skip root transform of prefab whose GO is the unit name -> keep it
        nid = build_node(r)
        if nid is not None:
            root_nodes.append(nid)
    if not root_nodes:
        return f"[{name}] no nodes"
    out = os.path.join(OUT, f"{name}.glb")
    glb.save(out, root_nodes)
    meta = {"vc": sum(len(m["primitives"]) and 1 for m in glb.meshes), "muzzles": MUNIZLES.get(name, [])}
    return f"[{name}] OK {os.path.getsize(out)//1024}KB meshes={len(glb.meshes)} mats={len(glb.materials)}"

def main():
    t0 = time.time()
    results = {}
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    for name, h in ROSTER.items():
        if only and name not in only:
            continue
        try:
            r = assemble(name, h)
        except Exception as e:
            r = f"[{name}] FAIL {type(e).__name__} {e}"
            traceback.print_exc(file=ERRLOG)
        print(r, flush=True)
        results[name] = r
    json.dump(results, open(os.path.join(OUT, "build_log.json"), "w"), indent=1)
    print(f"done in {time.time()-t0:.0f}s", flush=True)

if __name__ == "__main__":
    main()
