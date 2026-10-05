#!/usr/bin/env python3
"""Export the REAL Art of War 3 jungle map from map.prefab.bundle.

- walks the full Transform hierarchy
- resolves MeshFilter meshes + MeshRenderer materials across bundles
- converts Unity world transforms -> glTF convention (p'=-x,-z / q'=-x,-z)
- emits map.json for the browser game
- optional: audio, vfx textures, minimap, UI sprites
"""
import os, sys, json, math, struct, collections
import numpy as np
import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

BASE = "/home/z/my-project/scripts"
OUT = f"{BASE}/map_export"
os.makedirs(OUT, exist_ok=True)

BUNDLES = f"{BASE}/bundles_all"
APKS = [
    f"{BASE}/apk_stage/com.geargames.aow.apk",
    f"{BASE}/apk_stage/defaultlocalgroup_assets_all.apk",
    f"{BASE}/apk_stage/built_inomniwindow_assets_all.apk",
    f"{BASE}/apk_stage/built_invfx_assets_all.apk",
    f"{BASE}/apk_stage/decorations_jungle_assets_all.apk",
    f"{BASE}/apk_stage/decorations_desert_assets_all.apk",
    f"{BASE}/apk_stage/decorations_common_assets_all.apk",
]
BUNDLE_FILES = [os.path.join(BUNDLES, f) for f in sorted(os.listdir(BUNDLES))]

def build_env():
    env = UnityPy.Environment()
    files = [
        f"{BUNDLES}/map.prefab.bundle",
        f"{BUNDLES}/decorations_jungle_assets_all",
        f"{BUNDLES}/decorations_common_assets_all",
        f"{BUNDLES}/decorations_desert_assets_all",
    ]
    if os.environ.get("WITH_APK"):
        files.append(f"{BASE}/apk_stage/com.geargames.aow.apk")
    if os.environ.get("WITH_VFX"):
        files += [
            f"{BUNDLES}/built_invfx_assets_all",
            f"{BUNDLES}/defaultlocalgroup_assets_all",
            f"{BUNDLES}/built_inomniwindow_assets_all",
        ]
    for f in files:
        if os.path.exists(f):
            try:
                env.load_files([f])
            except Exception as e:
                print("load fail", f, e)
    return env

# ---------- transform walking ----------
def local_components(t):
    p = t.m_LocalPosition
    q = t.m_LocalRotation
    s = t.m_LocalScale
    return (p.x, p.y, p.z), (q.x, q.y, q.z, q.w), (s.x, s.y, s.z)

def qmul(a, b):
    x1, y1, z1, w1 = a; x2, y2, z2, w2 = b
    return [
        w1*x2 + x1*w2 + y1*z2 - z1*y2,
        w1*y2 - x1*z2 + y1*w2 + z1*x2,
        w1*z2 + x1*y2 - y1*x2 + z1*w2,
        w1*w2 - x1*x2 - y1*y2 - z1*z2,
    ]

def compose_world(t, cache):
    """world pos/quat/scale in Unity coords"""
    try:
        pid = (id(t.assets_file), t.object.path_id)
    except Exception:
        pid = (id(t.assets_file), id(t))
    if pid in cache:
        return cache[pid]
    lp, lq, ls = local_components(t)
    father = t.m_Father
    if father is not None and father.path_id != 0:
        try:
            ft = father.deref()
            fp, fq, fs = compose_world(ft, cache)
        except Exception:
            fp, fq, fs = (0, 0, 0), (0, 0, 0, 1), (1, 1, 1)
        # world = F * L  (Unity: parent * local)
        # rotate lp by fq
        vq = quat_rot_vec(fq, lp)
        p = (fp[0] + fs[0]*vq[0], fp[1] + fs[1]*vq[1], fp[2] + fs[2]*vq[2])
        q = qmul(fq, lq)
        s = (fs[0]*ls[0], fs[1]*ls[1], fs[2]*ls[2])
    else:
        p, q, s = lp, lq, ls
    cache[pid] = (p, q, s)
    return cache[pid]

def quat_rot_vec(q, v):
    x, y, z, w = q
    vx, vy, vz = v
    # t = 2 * cross(q.xyz, v)
    tx = 2*(y*vz - z*vy)
    ty = 2*(z*vx - x*vz)
    tz = 2*(x*vy - y*vx)
    # v + w*t + cross(q.xyz, t)
    rx = vx + w*tx + (y*tz - z*ty)
    ry = vy + w*ty + (z*tx - x*tz)
    rz = vz + w*tz + (x*ty - y*tx)
    return (rx, ry, rz)

def quat_to_mat(q):
    x, y, z, w = q
    return np.array([
        [1-2*(y*y+z*z), 2*(x*y - z*w),  2*(x*z + y*w)],
        [2*(x*y + z*w), 1-2*(x*x+z*z),  2*(y*z - x*w)],
        [2*(x*z - y*w), 2*(y*z + x*w),  1-2*(x*x+y*y)],
    ], dtype=np.float64)

def export_map(env):
    # index every mesh + material + gameobject by (assetsfile, pathid)
    cache = {}
    map_root = None
    roots = []
    # find transforms with no father in map bundle
    map_file = None
    for f in env.files.values():
        pass
    # simpler: iterate all objects; find the AssetBundle named map.prefab, then its containers
    containers = {}
    try:
        for cname, cobjs in env.container.items():
            containers[cname] = cobjs
    except Exception:
        pass
    # map bundle path ids
    map_objs = []
    for obj in env.objects:
        if obj.assets_file is None:
            continue
        sf_name = getattr(obj.assets_file, "name", "") or ""
    # Instead: locate transforms whose GameObject root chain tops out without father,
    # but only within the map bundle serialized file. Find the serialized file that
    # contains the most Transform objects (map bundle has 6777).
    sf_count = collections.Counter()
    for obj in env.objects:
        try:
            if obj.type.name in ("Transform", "GameObject"):
                sf_count[obj.assets_file] += 1
        except Exception:
            pass
    map_sf = sf_count.most_common(1)[0][0] if sf_count else None
    print("map serialized file:", getattr(map_sf, "name", map_sf), "objs:", sf_count.most_common(3))
    # collect all transforms in that file
    transforms = []
    go_by_pid = {}
    mf_by_go = {}
    mr_by_go = {}
    for obj in env.objects:
        if obj.assets_file is not map_sf:
            continue
        t = obj.type.name
        if t == "Transform":
            transforms.append(obj)
        elif t == "GameObject":
            go_by_pid[obj.path_id] = obj
        elif t == "MeshFilter":
            mf_by_go[obj.read().m_GameObject.path_id] = obj
        elif t == "MeshRenderer":
            mr_by_go[obj.path_id] = obj
    print(f"transforms={len(transforms)} gos={len(go_by_pid)} mf={len(mf_by_go)} mr={len(mr_by_go)}")
    # read transforms
    tread = []
    for o in transforms:
        try:
            tread.append(o.read())
        except Exception:
            pass
    # roots: father.path_id == 0
    tcache = {}
    out = []
    mesh_names = collections.Counter()
    yvals = []
    unresolved = 0
    resolved_ext = collections.Counter()
    for t in tread:
        go_ptr = t.m_GameObject
        if go_ptr.path_id == 0:
            continue
        go = go_by_pid.get(go_ptr.path_id)
        if go is None:
            continue
        try:
            goname = go.read().m_Name
        except Exception:
            goname = "?"
        mf = mf_by_go.get(go_ptr.path_id)
        if mf is None:
            continue
        p, q, s = compose_world(t, tcache)
        # resolve mesh
        mesh_name = None; src = None
        try:
            mptr = mf.read().m_Mesh
            if mptr.path_id != 0:
                mobj = mptr.deref()
                mesh_name = mobj.read().m_Name
                sf = getattr(mobj.assets_file, "name", "") or "same"
                src = "map" if mobj.assets_file is map_sf else sf
                resolved_ext[src] += 1
        except Exception as e:
            unresolved += 1
        mats = []
        mr = mr_by_go.get(go_ptr.path_id)
        if mr is not None:
            try:
                mread = mr.read()
                for mp in mread.m_Materials:
                    if mp and mp.path_id != 0:
                        mats.append(mp.deref().read().m_Name)
            except Exception:
                pass
        mesh_names[(mesh_name, tuple(sorted(set(mats))))] += 1
        yvals.append(p[1])
        # unity -> gltf: p' = (-x, y, -z), q' = (-qx, qy, -qz, qw)
        gp = (-p[0], p[1], -p[2])
        gq = (-q[0], q[1], -q[2], q[3])
        out.append({
            "n": goname, "m": mesh_name, "mat": mats[0] if mats else None,
            "p": [round(gp[0], 4), round(gp[1], 4), round(gp[2], 4)],
            "q": [round(gq[0], 6), round(gq[1], 6), round(gq[2], 6), round(gq[3], 6)],
            "s": [round(s[0], 4), round(s[1], 4), round(s[2], 4)],
        })
    print("entries:", len(out), "unresolved mesh ptrs:", unresolved)
    print("y range:", (min(yvals), max(yvals)) if yvals else None)
    print("source files:", resolved_ext.most_common(10))
    print("top mesh/mat combos:")
    for k, c in mesh_names.most_common(30):
        print("   ", k, c)
    json.dump(out, open(f"{OUT}/map.json", "w"))
    print("wrote", f"{OUT}/map.json", len(json.dumps(out))//1024, "KB")

def export_audio(env):
    os.makedirs(f"{OUT}/audio", exist_ok=True)
    n = 0
    for obj in env.objects:
        if obj.type.name != "AudioClip":
            continue
        try:
            clip = obj.read()
            name = clip.m_Name or f"clip_{obj.path_id}"
            data = clip.m_AudioData
            if not data:
                continue
            if isinstance(data, (bytes, bytearray)):
                raw = bytes(data)
            else:
                continue
            ext = ".ogg" if raw[:4] == b"OggS" else ".wav" if raw[:4] == b"RIFF" else ".bin"
            if ext == ".bin":
                continue
            safe = "".join(c for c in name if c.isalnum() or c in "._- ")[:60]
            path = f"{OUT}/audio/{safe}{ext}"
            if os.path.exists(path):
                continue
            open(path, "wb").write(raw)
            n += 1
        except Exception as e:
            pass
    print("audio clips exported:", n)

def export_fx(env):
    os.makedirs(f"{OUT}/fx", exist_ok=True)
    n = 0
    for obj in env.objects:
        if obj.type.name != "Texture2D":
            continue
        try:
            sf = getattr(obj.assets_file, "name", "") or ""
            if "vfx" not in sf and "defaultlocal" not in sf:
                continue
            tex = obj.read()
            img = tex.image
            if img.width < 8:
                continue
            safe = "".join(c for c in tex.m_Name if c.isalnum() or c in "._-")[:60]
            path = f"{OUT}/fx/{sf[:12]}_{safe}_{img.width}x{img.height}.png"
            if os.path.exists(path):
                continue
            img.save(path)
            n += 1
        except Exception:
            pass
    print("fx textures exported:", n)

def export_minimap(env):
    for obj in env.objects:
        if obj.type.name != "Texture2D":
            continue
        try:
            tex = obj.read()
            if tex.m_Name.lower() in ("minimap.png", "minimap") or "minimap" in tex.m_Name.lower():
                img = tex.image
                print("minimap:", tex.m_Name, img.size)
                img.save(f"{OUT}/minimap.png")
        except Exception:
            pass

if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    env = build_env()
    print("files loaded:", len(env.files))
    if what in ("all", "map"):
        export_map(env)
    if what in ("all", "audio"):
        export_audio(env)
    if what in ("all", "fx"):
        export_fx(env)
    if what in ("all", "minimap"):
        export_minimap(env)
