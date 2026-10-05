#!/usr/bin/env python3
"""
Rebuild ALL decoration props from the AOW3 decor bundles, correctly:
  - merge _MainTex (RGB) + _MaskTex (alpha) into shared RGBA atlases
  - export every prop as GLB with ORIGINAL UVs (no crops), materials named
  - index.json carries mat->atlas mapping for the game runtime
Output:
  /home/z/my-project/scripts/glb2/decor/*.glb   (all props)
  /home/z/my-project/scripts/glb2/decor/index.json
  /home/z/my-project/scripts/glb2/atlas-*.png   (shared atlases)
"""
import os, sys, json, io, re, traceback
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PIPE = os.path.join(HERE, "AOW3-repo", "pipeline")
sys.path.insert(0, PIPE)
import assemble_glb as A
from assemble_glb import GLB, B, conv, mat_to_trs, local_mat, load_env_with_deps
from extract_v3 import unpack_mesh
import UnityPy
from PIL import Image
UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

BUNDLES = "/home/z/my-project/scripts/bundles_all"
OUT = "/home/z/my-project/scripts/glb2"
DECOR_OUT = os.path.join(OUT, "decor")
os.makedirs(DECOR_OUT, exist_ok=True)

MAX_VERTS = 12000
SAFE = re.compile(r"[^A-Za-z0-9._-]")

# ---------------- 1. atlas registry ----------------
# texture name -> ("merged", main_img, mask_img)  or  ("direct", img)
TEXREG = {}   # texname -> path_id per bundle handled during scan
ATLASES = {}  # atlaskey -> PIL RGBA image
TEX2ATLAS = {}  # texture name -> atlas key

def bundle_paths():
    out = {}
    for f in os.listdir(BUNDLES):
        for key in ("decorations_jungle", "decorations_desert", "decorations_common"):
            if f.startswith(key):
                out[key] = os.path.join(BUNDLES, f)
    return out

def scan_textures(env, reg):
    for o in env.objects:
        if o.type.name != "Texture2D":
            continue
        try:
            d = o.read()
            reg[d.m_Name] = d
        except Exception:
            pass

def to_img(d):
    try:
        im = d.image
        if im is None:
            return None
        return im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
    except Exception:
        return None

def build_atlases():
    paths = bundle_paths()
    envs = {}
    for key, p in paths.items():
        envs[key] = load_env_with_deps(p)
        scan_textures(envs[key], TEXREG)

    def merge_rgba(main_name, mask_name, atlas_key):
        main = to_img(TEXREG[main_name]) if main_name in TEXREG else None
        mask = to_img(TEXREG[mask_name]) if mask_name in TEXREG else None
        if main is None:
            print("  !! no main for", main_name)
            return
        if mask is not None:
            m = mask.convert("L")
            if m.size != main.size:
                m = m.resize(main.size)
            rgba = main.convert("RGBA")
            rgba.putalpha(m)
        else:
            rgba = main.convert("RGBA")
        ATLASES[atlas_key] = rgba
        TEX2ATLAS[main_name] = atlas_key
        print(f"  atlas {atlas_key}: {main_name} + {mask_name} -> {rgba.size}")

    # jungle
    merge_rgba("tex_objects_jungle", "tex_objects_jungle_alpha", "jungle")
    merge_rgba("tex_objects_jungle_2", "tex_objects_jungle_2_alpha", "jungle2")
    merge_rgba("tex_ground_jungle", None, "jungleground")
    merge_rgba("tex_ground_jungle_02", None, "jungleground2")
    merge_rgba("tex_terrain_jungle", None, "jungleterrain")
    # desert
    merge_rgba("tex_objects_desert", "tex_objects_desert_alpha", "desert")
    merge_rgba("tex_ground_desert", None, "desertground")
    merge_rgba("tex_terrain_desert", None, "desertterrain")
    # common / war
    merge_rgba("tex_war_objects", "tex_war_objects_alpha", "war")
    merge_rgba("tex_interface_box", None, "interface")
    merge_rgba("tex_cloud", None, "cloud")

    for key, img in ATLASES.items():
        p = os.path.join(OUT, f"atlas-{key}.png")
        img.save(p, optimize=True)
        print("  saved", p, os.path.getsize(p)//1024, "KB")

# ---------------- 2. prop export ----------------
def categorize(n):
    ln = n.lower()
    if "palm" in ln: return "palm"
    if "tree" in ln or "bent" in ln: return "tree"
    if "bush" in ln: return "bush"
    if "rock" in ln or "stone" in ln: return "rock"
    if "gras" in ln: return "grass"
    if "bridge" in ln: return "prop"
    return "prop"

def gather_bundle(env):
    gos, trs = {}, {}
    for o in env.objects:
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
    for o in env.objects:
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
    return gos, trs, mf_by_go, rend_by_go

def material_atlas(mat_obj):
    """Return atlas key for a material via its _MainTex texture name."""
    if mat_obj is None:
        return None, None
    try:
        m = mat_obj.read()
    except Exception:
        return None, None
    for pp in m.m_SavedProperties.m_TexEnvs:
        key, sec = pp if isinstance(pp, tuple) else (pp.first, pp.second)
        if str(key) == "_MainTex" and sec.m_Texture is not None:
            tid = getattr(sec.m_Texture, "path_id", None)
            if tid and tid in TEXREG:
                tn = TEXREG[tid].m_Name
                if tn in TEX2ATLAS:
                    return TEX2ATLAS[tn], m.m_Name
                # unknown texture: export it as its own atlas
                img = to_img(TEXREG[tid])
                if img is not None:
                    k2 = "x_" + SAFE.sub("_", tn)[:30].lower()
                    if k2 not in ATLASES:
                        ATLASES[k2] = img.convert("RGBA")
                        TEX2ATLAS[tn] = k2
                    return k2, m.m_Name
    return None, (m.m_Name if 'm' in dir() else None)

MESH_CACHE = {}
def get_mesh(mesh_ptr):
    pid = mesh_ptr.path_id if not hasattr(mesh_ptr, "m_PathID") else mesh_ptr.m_PathID
    fid = mesh_ptr.file_id if not hasattr(mesh_ptr, "m_FileID") else mesh_ptr.m_FileID
    key = (fid, pid)
    if key in MESH_CACHE:
        return MESH_CACHE[key]
    MESH_CACHE[key] = None
    try:
        d = mesh_ptr.read()
        m = unpack_mesh(d)
        if m["v"] is None or len(m["v"]) < 12:
            return None
        MESH_CACHE[key] = {"v": m["v"].astype(np.float32),
                           "n": (m["n"].astype(np.float32) if m["n"] is not None and m["n"].size else np.zeros(0, np.float32)),
                           "uv": (m["uv"].astype(np.float32) if m["uv"] is not None and m["uv"].size else np.zeros(0, np.float32)),
                           "idx": m["idx"].astype(np.uint32), "sub": m["sub"], "name": d.m_Name}
        return MESH_CACHE[key]
    except Exception:
        return None

def main():
    build_atlases()
    paths = bundle_paths()
    index = []
    for bkey, bpath in sorted(paths.items()):
        print(f"=== {bkey}")
        env = load_env_with_deps(bpath)
        gos, trs, mf_by_go, rend_by_go = gather_bundle(env)
        name_by_tid = {tid: gos.get(td["go"], "?") for tid, td in trs.items()}
        # root groups = transforms with no father (fa is None or 0)
        roots = [tid for tid, td in trs.items() if td["fa"] in (None, 0)]
        for rt in sorted(roots, key=lambda t: name_by_tid.get(t, "")):
            gname = name_by_tid.get(rt, "?")
            count = 0
            for k in trs[rt]["ch"]:
                pname = name_by_tid.get(k, "?")
                if pname == "?" or pname.lower() == gname.lower():
                    continue
                try:
                    # per-group atlas routing (renderers reference Default-Material,
                    # so the atlas follows the group/bundle, like the original game)
                    if bkey == "decorations_jungle":
                        if "atlas_2" in gname.lower():
                            g_atlas = "jungle2" if "objekts" in gname.lower() else "jungleground2"
                        elif "ground" in gname.lower() or "road" in gname.lower() or "goingup" in gname.lower():
                            g_atlas = "jungleground"
                        else:
                            g_atlas = "jungle"
                    elif bkey == "decorations_desert":
                        g_atlas = "desert"
                    else:
                        g_atlas = "war"
                    glb = GLB()
                    allv = []
                    mats_used = {}
                    def wroot(tid3, depth=0):
                        if tid3 not in trs or depth > 24: return np.eye(4)
                        td3 = trs[tid3]
                        fa3 = td3["fa"]
                        return td3["M"] if fa3 in (None, 0) else wroot(fa3, depth + 1) @ td3["M"]
                    W_root = wroot(k)
                    collected = []
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
                                collected.append((mc, gos.get(gpid, "node"), mat_obj))
                        for c in tr["ch"]:
                            collect(c, depth + 1)
                    collect(k)
                    if not collected:
                        continue
                    # material per mesh: name + atlas key
                    mat_ids = {}
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
                                akey, mname = material_atlas(collect_mat(gpid))
                                if not akey:
                                    akey = g_atlas
                                if mname is None or mname.lower() == "default-material":
                                    mname = g_atlas + "_cutout"
                                if mname not in mat_ids:
                                    mat_ids[mname] = glb.add_material(mname, None, alpha=True)
                                    mats_used[mname] = akey
                                v = mc["v"] @ B.T
                                n = mc["n"] @ B.T if mc["n"].size else mc["n"]
                                allv.append(v)
                                mi = glb.add_mesh(mc["name"] or gn, v, n, mc["uv"], mc["idx"], mc["sub"], [mat_ids[mname]])
                                if mi is not None:
                                    mesh_ids.append(glb.add_node((mc["name"] or gn) + "_mesh", mesh=mi))
                        if not kids2 and not mesh_ids:
                            return None
                        return glb.add_node(gn, children=kids2 + mesh_ids, trs=trs_out)
                    def collect_mat(gpid):
                        for tn, rd in rend_by_go.get(gpid, []):
                            for mp in (getattr(rd, "m_Materials", []) or []):
                                try:
                                    mm = mp.read()
                                    if "default" not in mm.m_Name.lower():
                                        return mm
                                except Exception: pass
                        return None
                    rn = build(k, root_M=W_root)
                    if rn is None or not allv:
                        continue
                    vv = np.concatenate(allv)
                    if len(vv) > MAX_VERTS * 3:
                        continue
                    fn = f"dec_{SAFE.sub('_', pname)[:44]}_{k % 99991}.glb"
                    glb.save(os.path.join(DECOR_OUT, fn), [rn])
                    mn, mx = vv.min(0), vv.max(0)
                    atlas_hint = mats_used[next(iter(mats_used))] if mats_used else None
                    index.append({"n": pname, "f": f"decor/{fn}", "cat": categorize(pname),
                                  "g": gname, "vc": int(len(vv) // 3),
                                  "h": float(mx[1] - mn[1]), "w": float(mx[0] - mn[0]), "l": float(mx[2] - mn[2]),
                                  "kb": os.path.getsize(os.path.join(DECOR_OUT, fn)) // 1024,
                                  "atlas": atlas_hint,
                                  "mats": mats_used})
                    count += 1
                except Exception:
                    traceback.print_exc()
            print(f"  {gname}: {count} props", flush=True)
    with open(os.path.join(DECOR_OUT, "index.json"), "w") as f:
        json.dump(index, f)
    print("TOTAL props:", len(index))

if __name__ == "__main__":
    main()
