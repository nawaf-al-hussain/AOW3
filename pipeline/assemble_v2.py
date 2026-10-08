#!/usr/bin/env python3.13
"""
AOW3 exporter v2:
 1) Units with SKELETON + SKIN + ANIMATION CLIPS (real walk/fire/idle/die
    clips from the game's AnimationClips, Unity -> glTF curve conversion).
 2) Decoration props from decorations_jungle/desert bundles -> GLBs + index.json.

Reuses math + GLB writer from assemble_glb.py. Run: python3.13 assemble_v2.py
Outputs: glb/*.glb (v2 units overwrite), glb/decor/*.glb, glb/decor/index.json,
         glb/units_meta.json
"""
import os, sys, json, time, traceback
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import assemble_glb as A
from assemble_glb import (GLB, B, B4, conv, mat_to_trs, local_mat,
                          find_bundle, load_env_with_deps, texture_png_bytes)
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

from extract_v3 import unpack_mesh

OUT = A.OUT                       # scripts/glb
DECOR_OUT = os.path.join(OUT, "decor")
os.makedirs(DECOR_OUT, exist_ok=True)
ERRLOG = open(os.path.join(OUT, "err_v2.log"), "a")
sys.stderr = ERRLOG

BUNDLES = A.BUNDLES

CLIP_PRIORITY = ["idle1", "move", "rotate_cw", "w1_round", "w2_round",
                 "move_shoot", "die_bullet", "idle2", "die_explosion"]
MAX_CLIPS = 8
TOWER_FREE = ("f1_veh", "f2_veh")   # vehicles: turret is gameplay-driven, strip from clips

ROSTER = A.ROSTER

# ---------------- quat helpers ----------------
QB = (0.0, 1.0, 0.0, 0.0)  # 180deg about Y

def qmul(a, b):
    x1, y1, z1, w1 = a; x2, y2, z2, w2 = b
    return [w1*x2 + x1*w2 + y1*z2 - z1*y2,
            w1*y2 - x1*z2 + y1*w2 + z1*x2,
            w1*z2 + x1*y2 - y1*x2 + z1*w2,
            w1*w2 - x1*x2 - y1*y2 - z1*z2]

def qconv(q):
    """Unity local rotation -> glTF local rotation (B conjugation)."""
    x, y, z, w = q
    r = qmul(QB, [x, y, z, w])
    r = qmul(r, QB)
    n = np.sqrt(sum(c*c for c in r)) or 1.0
    return [c / n for c in r]

def pconv(p):
    return [-p[0], p[1], -p[2]]

# ---------------- extended GLB ----------------
class GLB2(GLB):
    def __init__(self):
        super().__init__()
        self.skins = []

    def add_skin(self, joint_node_ids, ibms):
        # glTF mat4 = column-major -> transpose each Unity row-major 4x4
        ib = np.concatenate([m.T.reshape(1, 16) for m in ibms]).astype('<f4').tobytes() if ibms else b''
        v = self._view(ib) if ib else None
        acc = self.accessor(v, 5126, "MAT4", len(ibms)) if v is not None else None
        self.skins.append({"joints": joint_node_ids,
                           **({"inverseBindMatrices": acc, "skeleton": joint_node_ids[0]} if acc is not None else {})})
        return len(self.skins) - 1

    def save2(self, path, roots, animations):
        gltf = {
            "asset": {"version": "2.0", "generator": "aow3-assembler-v2"},
            "scene": 0, "scenes": [{"nodes": roots}],
            "nodes": self.nodes, "meshes": self.meshes,
            "materials": self.materials or [{}],
            "textures": self.textures, "images": self.images,
            "samplers": [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}],
            "accessors": self.accs, "bufferViews": self.views,
            "animations": animations,
            "buffers": [{"byteLength": len(self.bin)}]}
        if self.skins:
            gltf["skins"] = self.skins
        js = json.dumps(gltf, separators=(',', ':')).encode()
        while len(js) % 4: js += b' '
        while len(self.bin) % 4: self.bin.append(0)
        total = 12 + 8 + len(js) + 8 + len(self.bin)
        with open(path, "wb") as f:
            f.write(A.struct.pack('<III', 0x46546C67, 2, total))
            f.write(A.struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
            f.write(A.struct.pack('<II', len(self.bin), 0x004E4942)); f.write(bytes(self.bin))

# ---------------- clip extraction ----------------
def clip_channels(clip, anim_root_pid, trs_by_pid, node_of_transform, strip_tower, strip_re=None):
    """Convert one AnimationClip to glTF channels. Returns (channels, duration)."""
    import re as _re
    channels = []
    max_t = 0.0
    def resolve(path):
        cur = anim_root_pid
        for seg in path.split('/'):
            found = None
            for c in trs_by_pid.get(cur, {}).get("_ch", []):
                nm = trs_by_pid.get(c, {}).get("_nm")
                if nm == seg:
                    found = c; break
            if found is None:
                return None
            cur = found
        return cur

    def keys_of(curve):
        try:
            return curve.m_Curve or curve.keys or []
        except Exception:
            try:
                return curve.keys or []
            except Exception:
                return []

    def want(path):
        pl = path.lower()
        if strip_tower and ("tower" in pl or "muzzle" in pl):
            return False
        if strip_re is not None and _re.search(strip_re, pl):
            return False
        return True

    groups = [("rotation", getattr(clip, "m_RotationCurves", None) or []),
              ("translation", getattr(clip, "m_PositionCurves", None) or []),
              ("scale", getattr(clip, "m_ScaleCurves", None) or [])]
    for kind, curves in groups:
        for rc in curves:
            path = rc.path
            if not want(path):
                continue
            tp = resolve(path)
            nid = node_of_transform.get(tp) if tp is not None else None
            if nid is None:
                continue
            ks = keys_of(rc.curve)
            if not ks:
                continue
            times, vals = [], []
            prev_q = None
            for k in ks:
                t = float(getattr(k, "time", getattr(k, "m_Time", 0.0)))
                v = getattr(k, "value", getattr(k, "m_Value", None))
                if v is None: continue
                if kind == "rotation":
                    q = qconv([float(v.x), float(v.y), float(v.z), float(v.w)])
                    if prev_q is not None and sum(a*b for a, b in zip(q, prev_q)) < 0:
                        q = [-c for c in q]
                    prev_q = q
                    vals.append(q)
                elif kind == "translation":
                    vals.append(pconv([float(v.x), float(v.y), float(v.z)]))
                else:
                    vals.append([float(v.x), float(v.y), float(v.z)])
                times.append(t)
                max_t = max(max_t, t)
            if len(times) < 1:
                continue
            tv = np.array(times, '<f4')
            ov = np.array(vals, '<f4')
            iv = _acc_view(tv)
            ovv = _acc_view(ov)
            ia = GLB_ACC.accessor(iv, 5126, "SCALAR", len(times), float(tv.min()), float(tv.max()))
            comp = {"rotation": "VEC4", "translation": "VEC3", "scale": "VEC3"}[kind]
            oa = GLB_ACC.accessor(ovv, 5126, comp, len(vals))
            channels.append({"sampler": len(channels), "target": {"node": nid, "path": kind}})
            SAMPLERS.append({"input": ia, "output": oa, "interpolation": "LINEAR"})
    return channels, max_t

SAMPLERS = []
GLB_ACC = None

def _acc_view(arr):
    return GLB_ACC._view(arr.tobytes())

# ---------------- unit assembly v2 ----------------
def assemble_v2(name, hash_prefix):
    path = find_bundle(hash_prefix)
    if not path:
        return f"[{name}] bundle not found"
    env = load_env_with_deps(path)
    objs = list(env.objects)
    gos = {}
    for o in objs:
        if o.type.name == "GameObject":
            try: gos[o.path_id] = o.read().m_Name
            except Exception: pass
    trs = {}
    ch_map = {}
    for o in objs:
        if o.type.name != "Transform":
            continue
        d = o.read()
        gp = d.m_Father
        fid = getattr(gp, "file_id", None) if not hasattr(gp, "m_FileID") else gp.m_FileID
        fpid = getattr(gp, "path_id", None) if not hasattr(gp, "m_PathID") else gp.m_PathID
        t, p, s = d.m_LocalRotation, d.m_LocalPosition, d.m_LocalScale
        ch = [getattr(c, "path_id", None) if not hasattr(c, "m_PathID") else c.m_PathID for c in d.m_Children]
        gpid = getattr(d.m_GameObject, "path_id", None) if not hasattr(d.m_GameObject, "m_PathID") else d.m_GameObject.m_PathID
        trs[o.path_id] = {"ch": ch, "go": gpid, "fa": (None if fid != 0 else fpid),
                          "M": local_mat([float(p.x), float(p.y), float(p.z)],
                                         [float(t.x), float(t.y), float(t.z), float(t.w)],
                                         [float(s.x), float(s.y), float(s.z)])}
    mf_by_go, rend_by_go = {}, {}
    anim_go = None
    clips = []
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
        elif tn == "Animation":
            d = o.read()
            gp = d.m_GameObject
            anim_go = gp.path_id if not hasattr(gp, "m_PathID") else gp.m_PathID
        elif tn == "AnimationClip":
            try:
                clips.append(o.read())
            except Exception:
                pass
    anim_root_pid = None
    for tid, td in trs.items():
        if td["go"] == anim_go:
            anim_root_pid = tid; break

    glb = GLB2()
    global GLB_ACC, SAMPLERS
    GLB_ACC = glb
    mesh_cache, mat_cache = {}, {}
    node_of_transform = {}
    meta = {"clips": [], "muzzles": [], "skins": 0}
    MUNIZLES = {}

    # Unity world matrices at bind (for IBM correction)
    W_bind = {}
    def world_of(tid, depth=0):
        if tid in W_bind: return W_bind[tid]
        if tid not in trs or depth > 32: return np.eye(4)
        td = trs[tid]
        fa = td["fa"]
        W = td["M"] if fa in (None, 0) else world_of(fa, depth + 1) @ td["M"]
        W_bind[tid] = W
        return W
    for tid in trs: world_of(tid)
    go2tid = {td["go"]: tid for tid, td in trs.items()}

    def bone_get(tid):
        return trs.get(tid)

    def build_node(tid, depth=0, keep_all=True):
        if tid not in trs or depth > 24:
            return None
        tr = trs[tid]
        gpid = tr["go"]
        gname = gos.get(gpid, "node")
        M = conv(tr["M"])
        trs_out = mat_to_trs(M)
        kids = []
        for c in tr["ch"]:
            r = build_node(c, depth + 1, keep_all)
            if r is not None: kids.append(r)
        mesh_node_ids = []
        mesh_ptr = mf_by_go.get(gpid)
        smr = None
        if gpid in rend_by_go:
            for tn, rd in rend_by_go[gpid]:
                if tn == "SkinnedMeshRenderer":
                    smr = rd
                    if mesh_ptr is None and getattr(rd, "m_Mesh", None) is not None:
                        mesh_ptr = rd.m_Mesh
        if mesh_ptr is not None and gpid in rend_by_go:
            mc = get_mesh(mesh_ptr)
            if mc:
                mat_ids = []
                for tn, rd in rend_by_go[gpid]:
                    mats = getattr(rd, "m_Materials", []) or []
                    for mp in mats:
                        mpid = mp.path_id if not hasattr(mp, "m_PathID") else mp.m_PathID
                        if mpid not in mat_cache:
                            png, mn2 = None, "mat"
                            try:
                                png, mn2 = mat_info(mp)
                            except Exception:
                                pass
                            ti = glb.add_image_png(png) if png else None
                            mat_cache[mpid] = glb.add_material(mn2, ti, alpha=True)
                        if mat_cache[mpid] not in mat_ids:
                            mat_ids.append(mat_cache[mpid])
                v = mc["v"] @ B.T
                n = mc["n"] @ B.T if mc["n"].size else mc["n"]
                uv, idx, subs, mname = mc["uv"], mc["idx"], mc["sub"], mc["name"]
                # joints / weights
                jv = None; wv = None; skin_id = None
                if smr is not None:
                    bones = getattr(smr, "m_Bones", None) or []
                    if bones:
                        jn = []
                        for bp in bones:
                            bpid = bp.path_id if not hasattr(bp, "m_PathID") else bp.m_PathID
                            jn.append(node_of_transform.get(bpid))
                        if all(j is not None for j in jn) and len(jn) <= 255:
                            # SMR node's Unity world (bind) — v1 baked-shape anchor
                            smr_tid = go2tid.get(gpid)
                            W_S = world_of(smr_tid) if smr_tid is not None else np.eye(4)
                            ibms = []
                            bp_list = getattr(smr, "m_BindPose", None) or []
                            for bi2 in range(len(jn)):
                                BP = np.eye(4)
                                if bi2 < len(bp_list):
                                    m4 = bp_list[bi2]
                                    for r, c in ((0,0),(0,1),(0,2),(0,3),(1,0),(1,1),(1,2),(1,3),
                                                 (2,0),(2,1),(2,2),(2,3),(3,0),(3,1),(3,2),(3,3)):
                                        BP[r, c] = float(getattr(m4, f"e{r}{c}"))
                                bpid2 = bones[bi2].path_id if not hasattr(bones[bi2], "m_PathID") else bones[bi2].m_PathID
                                W_b = world_of(bpid2) if bpid2 in trs else np.eye(4)
                                # glTF IBM = conv(W_b^-1 @ W_S @ BP); BP=I when bindposes absent
                                ibms.append(conv(np.linalg.inv(W_b) @ W_S @ BP))
                            while len(ibms) < len(jn):
                                ibms.append(np.eye(4))
                            skin_id = glb.add_skin(jn, ibms)
                            meta["skins"] += 1
                            # JOINTS_0 / WEIGHTS_0
                            nv = len(v)
                            w4, i4 = mc.get("w"), mc.get("bi4")
                            if w4 is not None and w4.size and i4 is not None and i4.size and len(w4) == nv:
                                ji = np.clip(i4, 0, len(jn) - 1).astype(np.uint8)
                                wsum = w4.sum(1, keepdims=True); wsum[wsum == 0] = 1
                                wnorm = (w4 / wsum).astype(np.float32)
                            elif mc.get("bidx") is not None and mc["bidx"].size and len(mc["bidx"]) == nv:
                                ji = np.zeros((nv, 4), np.uint8)
                                ji[:, 0] = np.clip(mc["bidx"], 0, len(jn) - 1).astype(np.uint8)
                                wnorm = np.zeros((nv, 4), np.float32); wnorm[:, 0] = 1.0
                            else:
                                ji = None
                            if ji is not None:
                                jvv = glb._view(ji.tobytes())
                                wvv = glb._view(wnorm.tobytes())
                                jva = glb.accessor(jvv, 5121, "VEC4", nv)
                                wva = glb.accessor(wvv, 5126, "VEC4", nv)
                                jv, wv = jva, wva
                mi = glb.add_mesh2(mname or gname, v, n, uv, idx, subs, mat_ids or [None], jv, wv, skin_id)
                if mi is not None:
                    mnode = glb.add_node((mname or gname) + "_mesh", mesh=mi)
                    if skin_id is not None:
                        glb.nodes[mnode]["skin"] = skin_id
                    mesh_node_ids.append(mnode)
        if gname.startswith("muzzle"):
            MUNIZLES.setdefault(name, []).append({"n": gname})
        if not keep_all and not kids and not mesh_node_ids and not gname.startswith("muzzle"):
            return None
        me = glb.add_node(gname, children=kids + mesh_node_ids, trs=trs_out)
        node_of_transform[tid] = me
        return me

    def get_mesh(mesh_ptr):
        pid = mesh_ptr.path_id if not hasattr(mesh_ptr, "m_PathID") else mesh_ptr.m_PathID
        if pid in mesh_cache: return mesh_cache[pid]
        mesh_cache[pid] = None
        try:
            d = mesh_ptr.read()
            m = unpack_mesh(d)
            if m["v"] is None or len(m["v"]) < 12:
                return None
            # glTF V-down convention fix (V4, 2026-10-09): Unity UVs are V-up
            # but GLTFLoader samples with flipY=false (V-down). Writing the raw
            # Unity UVs makes every mesh sample the vertical mirror of its
            # atlas region — f1/f2 inf_heavy landed on the page's pure-black
            # filler quadrant and rendered as black silhouettes under any
            # light. Evidence: reverse/evidence/visual/probe_inventory.json +
            # probe6-*.png; visual-fidelity-audit §5/§22. The decor path
            # (assemble_decor) already handles this in its own remap.
            # NOTE: docs/game.js preloadGlbModels carries a matching runtime
            # compensation (search marker "V4-UV-FLIP") for the GLBs already
            # committed; when GLBs are REGENERATED with this fix, remove that
            # block or the two flips cancel and the defect returns.
            uvf = (m["uv"].astype(np.float32) if m["uv"] is not None and m["uv"].size else np.zeros(0, np.float32))
            if uvf.size:
                uvf = uvf.copy()
                uvf[:, 1] = 1.0 - uvf[:, 1]
            mesh_cache[pid] = {"v": m["v"].astype(np.float32),
                               "n": (m["n"].astype(np.float32) if m["n"] is not None and m["n"].size else np.zeros(0, np.float32)),
                               "uv": uvf,
                               "idx": m["idx"].astype(np.uint32), "sub": m["sub"], "name": d.m_Name,
                               "bidx": m.get("bidx", np.zeros(0, np.uint32)),
                               "w": m.get("w", np.zeros(0, np.float32)),
                               "bi4": m.get("bi4", np.zeros(0, np.uint32))}
            return mesh_cache[pid]
        except Exception:
            traceback.print_exc(file=ERRLOG)
            return None

    tex_cache = {}
    def mat_info(mat_obj):
        m = mat_obj.read()
        props = m.m_SavedProperties
        tex_ptr = None
        for pp in props.m_TexEnvs:
            key, sec = pp if isinstance(pp, tuple) else (pp.first, pp.second)
            if str(key) == "_MainTex" and sec.m_Texture is not None and getattr(sec.m_Texture, "path_id", None):
                tex_ptr = sec.m_Texture
        if tex_ptr is None:
            return None, m.m_Name
        tid = tex_ptr.path_id
        if tid not in tex_cache:
            tex_cache[tid] = texture_png_bytes(tex_ptr.read())
        return tex_cache[tid], m.m_Name

    roots = [t for t, d in trs.items() if d["fa"] in (None, 0)]
    root_nodes = []
    for r in roots:
        nid = build_node(r)
        if nid is not None:
            root_nodes.append(nid)
    if not root_nodes:
        return f"[{name}] no nodes"

    # ---- animations ----
    animations = []
    SAMPLERS.clear()
    strip_tower = name.startswith(TOWER_FREE)
    by_name = {}
    for c in clips:
        try: by_name.setdefault(c.m_Name, c)
        except Exception: pass
    picked = [n for n in CLIP_PRIORITY if n in by_name][:MAX_CLIPS]
    # children map for path resolution
    for tid, td in trs.items():
        td["_ch"] = td["ch"]; td["_nm"] = gos.get(td["go"], "?")
    for cn in picked:
        try:
            strip_re = None
            if name.startswith(("f1_avia", "f2_avia")) and cn not in ("rotate_cw", "rotate_ccw"):
                strip_re = r"wing"   # rotor spun procedurally at runtime
            chans, dur = clip_channels(by_name[cn], anim_root_pid, trs, node_of_transform, strip_tower, strip_re)
        except Exception:
            traceback.print_exc(file=ERRLOG); continue
        if chans and dur > 0.01:
            animations.append({"name": cn, "samplers": list(SAMPLERS[-len(chans):]), "channels": chans})
            meta["clips"].append(cn)
    meta["muzzles"] = MUNIZLES.get(name, [])

    out = os.path.join(OUT, f"{name}.glb")
    glb.save2(out, root_nodes, animations)
    meta["size_kb"] = os.path.getsize(out) // 1024
    return f"[{name}] OK {meta['size_kb']}KB meshes={len(glb.meshes)} skins={meta['skins']} anims={meta['clips']}", meta

def add_mesh2(self, name, v, n, uv, idx, subs, mat_ids, joints_acc=None, weights_acc=None, skin_id=None):
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
        attrs = {"POSITION": pa}
        if na is not None: attrs["NORMAL"] = na
        if ta is not None: attrs["TEXCOORD_0"] = ta
        if joints_acc is not None: attrs["JOINTS_0"] = joints_acc
        if weights_acc is not None: attrs["WEIGHTS_0"] = weights_acc
        prims.append({"attributes": attrs, "indices": ia,
                      **({"material": mat} if mat is not None else {}),
                      **({"mode": 4})})
    if not prims:
        return None
    self.meshes.append({"name": name[:50], "primitives": prims})
    return len(self.meshes) - 1

GLB.add_mesh2 = add_mesh2

# ---------------- decorations ----------------
DECOR_GROUPS = [
    ("decorations_jungle__decorations_jungle_assets_all", [
        "jungle_tree_ultralow", "jungle_bent_trees", "jungle_palm_hight", "jungle_palm_low",
        "jungle_bush", "jungle_border_bushes", "jungle_rock_tree", "jungle_stone",
        "jungle_bush_and_stones1", "jungle_3dgras", "jungle_middlepath_stones"]),
    ("decorations_desert__decorations_desert_assets_all", [
        "desert_stones_2", "desert_dry_grass_2"]),
]
MAX_PROPS_PER_GROUP = 12
MAX_VERTS = 9000

def categorize(n):
    ln = n.lower()
    if "palm" in ln: return "palm"
    if "tree" in ln or "bent" in ln: return "tree"
    if "bush" in ln: return "bush"
    if "rock" in ln or "stone" in ln: return "rock"
    if "gras" in ln: return "grass"
    return "prop"

def assemble_decor():
    index = []
    for bundle_name, groups in DECOR_GROUPS:
        bpath = None
        for f in os.listdir(BUNDLES):
            if f.startswith(bundle_name):
                bpath = os.path.join(BUNDLES, f); break
        if not bpath:
            print(f"decor bundle {bundle_name} not found", flush=True); continue
        env = load_env_with_deps(bpath)
        objs = list(env.objects)
        gos, trs = {}, {}
        for o in objs:
            tn = o.type.name
            if tn == "GameObject":
                try: gos[o.path_id] = o.read().m_Name
                except Exception: pass
            elif tn == "Transform":
                try:
                    d = o.read()
                    gp = d.m_Father
                    fid = getattr(gp, "file_id", None) if not hasattr(gp, "m_FileID") else gp.m_FileID
                    fpid = getattr(gp, "path_id", None) if not hasattr(gp, "m_PathID") else gp.m_PathID
                    gpid = getattr(d.m_GameObject, "path_id", None) if not hasattr(d.m_GameObject, "m_PathID") else d.m_GameObject.m_PathID
                    t, p, s = d.m_LocalRotation, d.m_LocalPosition, d.m_LocalScale
                    trs[o.path_id] = {"ch": [getattr(c, "path_id", None) if not hasattr(c, "m_PathID") else c.m_PathID for c in d.m_Children],
                                      "go": gpid, "fa": (None if fid != 0 else fpid),
                                      "M": local_mat([float(p.x), float(p.y), float(p.z)],
                                                     [float(t.x), float(t.y), float(t.z), float(t.w)],
                                                     [float(s.x), float(s.y), float(s.z)])}
                except Exception: pass
        mf_by_go, rend_by_go = {}, {}
        for o in objs:
            tn = o.type.name
            if tn in ("MeshFilter", "MeshRenderer", "SkinnedMeshRenderer"):
                try:
                    d = o.read()
                    gp = d.m_GameObject
                    gpid = gp.path_id if not hasattr(gp, "m_PathID") else gp.m_PathID
                    if tn == "MeshFilter":
                        mf_by_go[gpid] = d.m_Mesh
                    else:
                        rend_by_go.setdefault(gpid, []).append((tn, d))
                except Exception: pass
        name_by_tid = {tid: gos.get(td["go"], "?") for tid, td in trs.items()}
        tex_cache = {}
        def mat_info(mat_obj):
            m = mat_obj.read()
            tex_ptr = None
            for pp in m.m_SavedProperties.m_TexEnvs:
                key, sec = pp if isinstance(pp, tuple) else (pp.first, pp.second)
                if str(key) == "_MainTex" and sec.m_Texture is not None and getattr(sec.m_Texture, "path_id", None):
                    tex_ptr = sec.m_Texture
            if tex_ptr is None:
                return None, m.m_Name
            tid = tex_ptr.path_id
            if tid not in tex_cache:
                tex_cache[tid] = texture_png_bytes(tex_ptr.read())
            return tex_cache[tid], m.m_Name

        mesh_cache = {}
        def get_mesh(mesh_ptr):
            pid = mesh_ptr.path_id if not hasattr(mesh_ptr, "m_PathID") else mesh_ptr.m_PathID
            fid = mesh_ptr.file_id if not hasattr(mesh_ptr, "m_FileID") else mesh_ptr.m_FileID
            key = (fid, pid)
            if key in mesh_cache: return mesh_cache[key]
            mesh_cache[key] = None
            try:
                d = mesh_ptr.read()
                m = unpack_mesh(d)
                if m["v"] is None or len(m["v"]) < 12: return None
                mesh_cache[key] = {"v": m["v"].astype(np.float32),
                                   "n": (m["n"].astype(np.float32) if m["n"] is not None and m["n"].size else np.zeros(0, np.float32)),
                                   "uv": (m["uv"].astype(np.float32) if m["uv"] is not None and m["uv"].size else np.zeros(0, np.float32)),
                                   "idx": m["idx"].astype(np.uint32), "sub": m["sub"], "name": d.m_Name}
                return mesh_cache[key]
            except Exception:
                return None

        # per-category fallback materials (renderers reference Default-Material w/o texture)
        fallback_mat = {}
        bundle_mats = []
        for o in objs:
            if o.type.name == "Material":
                try:
                    m = o.read()
                    if "default" in m.m_Name.lower(): continue
                    bundle_mats.append(m)
                except Exception: pass
        def _tex_png(m):
            tex = None
            for pp in m.m_SavedProperties.m_TexEnvs:
                key, sec = pp if isinstance(pp, tuple) else (pp.first, pp.second)
                if str(key) == "_MainTex": tex = sec.m_Texture
            if tex is None: return None
            try: return texture_png_bytes(tex.read())
            except Exception: return None
        cut = [m for m in bundle_mats if "cutout" in m.m_Name.lower() and "anim" not in m.m_Name.lower()]
        diff = [m for m in bundle_mats if "diffuse" in m.m_Name.lower()]
        pick_cut = cut[0] if cut else (bundle_mats[0] if bundle_mats else None)
        pick_diff = diff[0] if diff else (bundle_mats[0] if bundle_mats else None)
        if pick_cut is not None:
            for catx in ("tree", "palm", "bush", "grass"):
                fallback_mat[catx] = (_tex_png(pick_cut), pick_cut.m_Name, pick_cut)
        if pick_diff is not None:
            fallback_mat["rock"] = (_tex_png(pick_diff), pick_diff.m_Name, pick_diff)
            fallback_mat["prop"] = fallback_mat["rock"]

        # find group roots by GO name
        tid_by_name = {}
        for tid, td in trs.items():
            tid_by_name.setdefault(gos.get(td["go"], "?"), tid)
        # atlas images (PIL) per material name — for per-prop UV-region cropping
        atlas_img, atlas_meta = {}, {}
        def atlas_of(m):
            nm = m.m_Name
            if nm not in atlas_img:
                tex = None
                for pp in m.m_SavedProperties.m_TexEnvs:
                    key, sec = pp if isinstance(pp, tuple) else (pp.first, pp.second)
                    if str(key) == "_MainTex": tex = sec.m_Texture
                if tex is None:
                    atlas_img[nm] = None
                else:
                    try:
                        atlas_img[nm] = tex.read().image
                        atlas_meta[nm] = tex.read().m_Name
                    except Exception:
                        atlas_img[nm] = None
            return atlas_img[nm]
        for gname in groups:
            gt = tid_by_name.get(gname)
            if gt is None:
                print(f"  group missing: {gname}", flush=True); continue
            kids = trs[gt]["ch"]
            count = 0
            for k in kids:
                if count >= MAX_PROPS_PER_GROUP: break
                pname = name_by_tid.get(k, "?")
                if pname == "?" or pname.lower() == gname.lower(): continue
                glb = GLB()
                allv = []
                cur_cat = [categorize(pname)]
                # world matrix of the prop root (bakes the group's orientation)
                def wroot(tid3, depth=0):
                    if tid3 not in trs or depth > 24: return np.eye(4)
                    td3 = trs[tid3]
                    fa3 = td3["fa"]
                    return td3["M"] if fa3 in (None, 0) else wroot(fa3, depth + 1) @ td3["M"]
                W_root = wroot(k)
                # ---- collect meshes first (UV bbox + materials), then crop texture
                collected = []   # (mc, gn, mat_obj)
                def collect(tid2, depth=0):
                    if tid2 not in trs or depth > 12: return
                    tr = trs[tid2]
                    gpid = tr["go"]
                    mesh_ptr = mf_by_go.get(gpid)
                    if mesh_ptr is None and gpid in rend_by_go:
                        for tn, rd in rend_by_go[gpid]:
                            if getattr(rd, "m_Mesh", None) is not None:
                                mesh_ptr = rd.m_Mesh; break
                    if mesh_ptr is not None and gpid in rend_by_go:
                        mc = get_mesh(mesh_ptr)
                        if mc:
                            mat_obj = None
                            for tn, rd in rend_by_go[gpid]:
                                for mp in (getattr(rd, "m_Materials", []) or []):
                                    try:
                                        mm = mp.read()
                                        if "default" not in mm.m_Name.lower():
                                            mat_obj = mm; break
                                    except Exception: pass
                                if mat_obj is not None: break
                            if mat_obj is None:
                                fbname = fallback_mat.get(cur_cat[0], fallback_mat.get("prop"))
                                mat_obj = fbname[2] if fbname and len(fbname) > 2 else None
                            collected.append((mc, gos.get(gpid, "node"), mat_obj))
                    for c in tr["ch"]:
                        collect(c, depth + 1)
                collect(k)
                if not collected:
                    continue
                # choose material: prefer one with an atlas image
                mat_obj = None
                for _, _, mo in collected:
                    if mo is not None and atlas_of(mo) is not None:
                        mat_obj = mo; break
                if mat_obj is None:
                    for _, _, mo in collected:
                        if mo is not None:
                            mat_obj = mo; break
                if mat_obj is None:
                    continue
                img = atlas_of(mat_obj)
                # union UV bbox
                umin = vmin = 1e9; umax = vmax = -1e9
                tiled = False
                for mc, _, _ in collected:
                    if mc["uv"].size:
                        u0 = mc["uv"][:, 0]; v0 = mc["uv"][:, 1]
                        if u0.min() < -0.01 or u0.max() > 1.01 or v0.min() < -0.01 or v0.max() > 1.01:
                            tiled = True
                        umin = min(umin, float(u0.min())); umax = max(umax, float(u0.max()))
                        vmin = min(vmin, float(v0.min())); vmax = max(vmax, float(v0.max()))
                prop_mat_id = None
                if img is not None and not tiled:
                    Wp, Hp = img.size
                    pad = 0.004
                    x0 = max(0, int((umin - pad) * Wp)); x1 = min(Wp, int((umax + pad) * Wp) + 1)
                    y0 = max(0, int((1 - vmax - pad) * Hp)); y1 = min(Hp, int((1 - vmin + pad) * Hp) + 1)  # glTF v origin = top
                    if x1 - x0 > 3 and y1 - y0 > 3:
                        crop = img.crop((x0, y0, x1, y1))
                        # downscale big crops
                        maxside = 256
                        if max(crop.size) > maxside:
                            sc = maxside / max(crop.size)
                            crop = crop.resize((max(8, int(crop.size[0] * sc)), max(8, int(crop.size[1] * sc))))
                        import io as _io
                        b = _io.BytesIO(); crop.save(b, "PNG")
                        uw = x1 - x0; vh = y1 - y0
                        def remap(uv):
                            if not uv.size: return uv
                            out = uv.copy()
                            out[:, 0] = (uv[:, 0] * Wp - x0) / uw
                            out[:, 1] = 1.0 - ((1.0 - uv[:, 1]) * Hp - y0) / vh  # undo v-flip, then crop-space flip
                            return out
                        prop_mat_id = glb.add_image_png(b.getvalue())
                def build(tid2, depth=0, root_M=None):
                    if tid2 not in trs or depth > 12: return None
                    tr = trs[tid2]
                    gpid = tr["go"]
                    gn = gos.get(gpid, "node")
                    M = conv(root_M if (root_M is not None and depth == 0) else tr["M"])
                    trs_out = mat_to_trs(M)
                    kids2 = []
                    for c in tr["ch"]:
                        r = build(c, depth + 1)
                        if r is not None: kids2.append(r)
                    mesh_ids = []
                    mesh_ptr = mf_by_go.get(gpid)
                    if mesh_ptr is None and gpid in rend_by_go:
                        for tn, rd in rend_by_go[gpid]:
                            if getattr(rd, "m_Mesh", None) is not None:
                                mesh_ptr = rd.m_Mesh; break
                    if mesh_ptr is not None and gpid in rend_by_go:
                        mc = get_mesh(mesh_ptr)
                        if mc:
                            uv2 = mc["uv"]
                            if prop_mat_id is not None and uv2.size:
                                uv2 = remap(uv2)
                            if prop_mat_id is None:
                                prop_mat_id_local = glb.add_material(mat_obj.m_Name[:40] if mat_obj else "mat", None, alpha=True)
                            else:
                                prop_mat_id_local = glb.add_material(mat_obj.m_Name[:40] if mat_obj else "mat", prop_mat_id, alpha=True)
                            v = mc["v"] @ B.T
                            n = mc["n"] @ B.T if mc["n"].size else mc["n"]
                            allv.append(v)
                            mi = glb.add_mesh(mc["name"] or gn, v, n, uv2, mc["idx"], mc["sub"], [prop_mat_id_local])
                            if mi is not None:
                                mesh_ids.append(glb.add_node((mc["name"] or gn) + "_mesh", mesh=mi))
                    if not kids2 and not mesh_ids:
                        return None
                    return glb.add_node(gn, children=kids2 + mesh_ids, trs=trs_out)
                rn = build(k, root_M=W_root)
                if rn is None or not allv:
                    continue
                vv = np.concatenate(allv)
                if len(vv) > MAX_VERTS * 3:
                    continue
                safe = A.__dict__["sn"] if "sn" in A.__dict__ else None
                import re
                SAFE = re.compile(r"[^A-Za-z0-9._-]")
                fn = f"dec_{SAFE.sub('_', pname)[:40]}_{k % 99991}.glb"
                glb.save(os.path.join(DECOR_OUT, fn), [rn])
                mn, mx = vv.min(0), vv.max(0)
                index.append({"n": pname, "f": f"decor/{fn}", "cat": categorize(pname),
                              "g": gname, "vc": int(len(vv) // 3),
                              "h": float(mx[1] - mn[1]), "w": float(mx[0] - mn[0]), "l": float(mx[2] - mn[2]),
                              "kb": os.path.getsize(os.path.join(DECOR_OUT, fn)) // 1024})
                count += 1
            print(f"  {gname}: {count} props", flush=True)
    with open(os.path.join(DECOR_OUT, "index.json"), "w") as f:
        json.dump(index, f)
    return index

def main():
    t0 = time.time()
    metas = {}
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    for name, h in ROSTER.items():
        if only and name not in only:
            continue
        try:
            r = assemble_v2(name, h)
            if isinstance(r, tuple):
                print(r[0], flush=True); metas[name] = r[1]
            else:
                print(r, flush=True)
        except Exception as e:
            traceback.print_exc(file=ERRLOG)
            print(f"[{name}] FAIL {type(e).__name__} {e}", flush=True)
    json.dump(metas, open(os.path.join(OUT, "units_meta.json"), "w"), indent=1)
    try:
        idx = assemble_decor()
        print(f"decor props: {len(idx)}", flush=True)
    except Exception:
        traceback.print_exc(file=ERRLOG)
        print("decor export failed", flush=True)
    print(f"done in {time.time()-t0:.0f}s", flush=True)

if __name__ == "__main__":
    main()
