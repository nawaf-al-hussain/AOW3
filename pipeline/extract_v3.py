#!/usr/bin/env python3.13
"""
AOW3 extraction v3 — the definitive pass.
Fixes: manual Unity-2022 vertex unpack (m_VertexData channels), Sprite crops
with cross-bundle texture resolution, scene-graph JSON per bundle for 3D
assembly, proper catalog. Output: /home/z/my-project/scripts/exv3/
"""
import os, sys, json, time, re, struct
import numpy as np

BUNDLES = "/home/z/my-project/scripts/bundles_all"
OUT = "/home/z/my-project/scripts/exv3"
DONE = os.path.join(OUT, "done.txt")

for sub in ("textures", "sprites", "meshes", "graphs"):
    os.makedirs(os.path.join(OUT, sub), exist_ok=True)
ERRLOG = open(os.path.join(OUT, "err.log"), "a")
sys.stderr = ERRLOG

import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

MIN_FREE_MB = 600
SAFE = re.compile(r"[^A-Za-z0-9._-]")

def disk_free_mb():
    s = os.statvfs(OUT)
    return s.f_bavail * s.f_bsize // (1024 * 1024)

def sn(n, maxlen=110):
    return SAFE.sub("_", n or "unnamed")[:maxlen]

# ---------------- vertex unpacking (Unity 2022 channels) ----------------
FMT_SIZE = {0: 4, 1: 2, 2: 4, 3: 1, 4: 4, 5: 1, 6: 2, 7: 2, 8: 4, 9: 4, 10: 4, 11: 2, 12: 2, 13: 4, 14: 4, 15: 4}

def unpack_mesh(d):
    """Return dict with v, n, uv arrays (float32) and indices (uint32), submeshes.
    Unity 2022 multi-stream layout: streams packed sequentially, each with own stride."""
    vd = d.m_VertexData
    vc = vd.m_VertexCount
    raw = vd.m_DataSize
    if isinstance(raw, list):
        raw = bytes(raw)
    chans = vd.m_Channels or []
    stream_ch = {}
    for ch in chans:
        if ch.dimension <= 0:
            continue
        st = getattr(ch, "stream", 0) or 0
        stream_ch.setdefault(st, []).append(ch)
    strides, bases, acc = {}, {}, 0
    for st in sorted(stream_ch):
        stride = 0
        for ch in stream_ch[st]:
            end = (ch.offset or 0) + FMT_SIZE.get(ch.format, 4) * ch.dimension
            stride = max(stride, end)
        strides[st] = stride
        bases[st] = acc
        acc += stride * vc
        acc = (acc + 15) // 16 * 16  # Unity pads each stream to 16-byte alignment

    def get(chan_idx, dim):
        if chan_idx >= len(chans):
            return None
        ch = chans[chan_idx]
        if ch.dimension < dim:
            return None
        st = getattr(ch, "stream", 0) or 0
        if st not in strides:
            return None
        off, fmt = ch.offset or 0, ch.format
        base = bases[st]
        stride = strides[st]
        out = np.zeros((vc, dim), np.float32)
        if fmt == 0:      # float32
            dt = np.dtype('<f4')
            for i in range(vc):
                out[i] = np.frombuffer(raw, dt, dim, base + i * stride + off)
        elif fmt == 1:    # float16
            dt = np.dtype('<f2')
            for i in range(vc):
                out[i] = np.frombuffer(raw, dt, dim, base + i * stride + off).astype(np.float32)
        else:
            return None
        return out

    pos = get(0, 3)
    nor = get(1, 3)
    uv0 = get(4, 2)
    if uv0 is None:
        uv0 = get(3, 2)  # some builds put uv0 at ch3 when no color
    # skin data: ch12 = weights (fmt0 dim4), ch13 = bone indices (fmt10 dim4) or rigid (dim1)
    bidx = np.zeros(0, np.uint32)
    wgt = np.zeros(0, np.float32)
    idx4 = np.zeros(0, np.uint32)
    if len(chans) > 13 and chans[13].dimension > 0:
        ch = chans[13]
        st = getattr(ch, "stream", 0) or 0
        if st in strides:
            base = bases[st]; stride = strides[st]; off = ch.offset or 0
            try:
                if ch.dimension == 1 and FMT_SIZE.get(ch.format) == 4:
                    bidx = np.array([np.frombuffer(raw, '<u4', 1, base + i * stride + off)[0]
                                     for i in range(vc)], np.uint32)
                elif ch.dimension == 4:
                    idx4 = np.array([np.frombuffer(raw, '<u4', 4, base + i * stride + off)
                                     for i in range(vc)], np.uint32)
            except Exception:
                pass
    if len(chans) > 12 and chans[12].dimension == 4:
        ch = chans[12]
        st = getattr(ch, "stream", 0) or 0
        if st in strides and ch.format == 0:
            base = bases[st]; stride = strides[st]; off = ch.offset or 0
            try:
                wgt = np.array([np.frombuffer(raw, '<f4', 4, base + i * stride + off)
                                for i in range(vc)], np.float32)
            except Exception:
                wgt = np.zeros(0, np.float32)
    # indices
    idxbuf = d.m_IndexBuffer
    if isinstance(idxbuf, list):
        idxbuf = bytes(idxbuf)
    if d.m_IndexFormat == 1:
        idx = np.frombuffer(idxbuf, '<u4').astype(np.uint32)
    else:
        idx = np.frombuffer(idxbuf, '<u2').astype(np.uint32)
    subs = []
    for s in (d.m_SubMeshes or []):
        first = s.firstByte // (4 if d.m_IndexFormat == 1 else 2)
        cnt = s.indexCount
        if s.topology == 0:  # triangles only
            subs.append([int(first), int(cnt)])
    return {"v": pos, "n": nor, "uv": uv0, "idx": idx, "sub": subs, "bidx": bidx, "w": wgt, "bi4": idx4}

# ---------------- sprite cropping with cross-bundle resolution ----------------
def tex_image_by_pid(env, extra_envs):
    """map path_id -> PIL image for all Texture2D in env + extra_envs (lazy)."""
    out = {}
    for e in [env] + extra_envs:
        if e is None:
            continue
        for o in e.objects:
            if o.type.name == "Texture2D":
                try:
                    d = o.read()
                    img = d.image
                    if img is not None:
                        out[o.path_id] = img
                except Exception:
                    pass
    return out

def sprite_crop(sp, texmap):
    r = sp.m_Rect
    x, y, w, h = int(r.x), int(r.y), int(r.width), int(r.height)
    tid = sp.m_RD.texture.path_id
    img = texmap.get(tid)
    if img is None:
        return None
    texw, texh = img.size
    # Unity rect origin = bottom-left; PIL = top-left
    box = (x, texh - y - h, x + w, texh - y)
    crop = img.crop(box)
    rot = getattr(sp.m_RD, "packingRotation", None)
    import PIL.Image as I
    if rot is not None:
        try:
            if int(rot) & 2:  # FlipVertical
                crop = crop.transpose(I.FLIP_TOP_BOTTOM)
            if int(rot) & 4:  # FlipHorizontal
                crop = crop.transpose(I.FLIP_LEFT_RIGHT)
            if int(rot) & 8:
                crop = crop.transpose(I.ROTATE_180)
        except Exception:
            pass
    return crop

# ---------------- per-bundle processing ----------------
def externals_of(env):
    ext = []
    try:
        for f in env.files.values():
            if hasattr(f, "externals"):
                for e in f.externals:
                    nm = getattr(e, "path", None) or getattr(e, "name", None)
                    if nm:
                        ext.append(os.path.basename(str(nm)))
    except Exception:
        pass
    return ext

def process(path):
    rows, graph = [], None
    try:
        env = UnityPy.load(path)
    except Exception as e:
        return [{"_err": f"LOAD {os.path.basename(path)}: {e}"}], None
    bundle = os.path.basename(path)
    # preload external dep envs (same dir) for sprite/texture resolution
    extra_envs = []
    ext_names = externals_of(env)
    for nm in ext_names[:12]:
        p = os.path.join(BUNDLES, nm)
        if os.path.exists(p):
            try:
                extra_envs.append(UnityPy.load(p))
            except Exception:
                pass
    objs = list(env.objects)
    # ---- textures
    for o in objs:
        if o.type.name != "Texture2D":
            continue
        try:
            d = o.read()
            w, h = d.m_Width, d.m_Height
            if w < 4 or h < 4:
                continue
            if disk_free_mb() < MIN_FREE_MB:
                continue
            img = d.image
            if img is None:
                continue
            fn = f"{sn(d.m_Name)}_{w}x{h}_{o.path_id}.png"
            img.save(os.path.join(OUT, "textures", fn))
            rows.append({"t": "Texture2D", "b": bundle, "n": d.m_Name, "w": w, "h": h, "pid": o.path_id, "f": fn})
        except Exception as e:
            rows.append({"_err": f"TEX {bundle}: {type(e).__name__} {e}"[:180]})
    # ---- sprites
    texmap = None
    for o in objs:
        if o.type.name != "Sprite":
            continue
        try:
            d = o.read()
            if d.m_Rect.width < 4 or d.m_Rect.height < 4:
                continue
            if texmap is None:
                texmap = tex_image_by_pid(env, extra_envs)
            crop = sprite_crop(d, texmap)
            if crop is None:
                rows.append({"t": "Sprite", "b": bundle, "n": d.m_Name, "noTex": True})
                continue
            fn = f"{sn(d.m_Name)}_{int(d.m_Rect.width)}x{int(d.m_Rect.height)}_{o.path_id}.png"
            crop.save(os.path.join(OUT, "sprites", fn))
            rows.append({"t": "Sprite", "b": bundle, "n": d.m_Name, "f": fn,
                         "w": int(d.m_Rect.width), "h": int(d.m_Rect.height)})
        except Exception as e:
            rows.append({"_err": f"SPR {bundle}: {type(e).__name__} {e}"[:180]})
    # ---- meshes
    for o in objs:
        if o.type.name != "Mesh":
            continue
        try:
            d = o.read()
            m = unpack_mesh(d)
            if m["v"] is None or len(m["v"]) < 12:
                continue
            if disk_free_mb() < MIN_FREE_MB:
                continue
            vc = len(m["v"]) // 3
            fn = f"{sn(d.m_Name)}_{vc}_{o.path_id}.npz"
            np.savez_compressed(
                os.path.join(OUT, "meshes", fn),
                v=m["v"], n=(m["n"] if m["n"] is not None else np.zeros(0, np.float32)),
                uv=(m["uv"] if m["uv"] is not None else np.zeros(0, np.float32)),
                idx=m["idx"], sub=np.array(json.dumps(m["sub"])))
            rows.append({"t": "Mesh", "b": bundle, "n": d.m_Name, "vc": vc,
                         "sub": len(m["sub"]), "pid": o.path_id, "f": fn})
        except Exception as e:
            rows.append({"_err": f"MESH {bundle}: {type(e).__name__} {e}"[:180]})
    # ---- scene graph (gameobjects + transforms + renderers + materials)
    try:
        go = {}
        trs = {}
        mfs, mrs, smrs = {}, {}, {}
        for o in objs:
            tn = o.type.name
            if tn == "GameObject":
                d = o.read()
                go[o.path_id] = {"n": d.m_Name, "c": []}
            elif tn == "Transform":
                d = o.read()
                gp = d.m_Father
                fid = getattr(gp, "file_id", None) if not hasattr(gp, "m_FileID") else gp.m_FileID
                fpid = getattr(gp, "path_id", None) if not hasattr(gp, "m_PathID") else gp.m_PathID
                t = d.m_LocalRotation
                p = d.m_LocalPosition
                s = d.m_LocalScale
                trs[o.path_id] = {
                    "go": getattr(d.m_GameObject, "path_id", None) if not hasattr(d.m_GameObject, "m_PathID") else d.m_GameObject.m_PathID,
                    "fa": fpid if fid == 0 else None,
                    "p": [float(p.x), float(p.y), float(p.z)],
                    "q": [float(t.x), float(t.y), float(t.z), float(t.w)],
                    "s": [float(s.x), float(s.y), float(s.z)],
                    "ch": [getattr(c, "path_id", None) if not hasattr(c, "m_PathID") else c.m_PathID for c in d.m_Children]}
            elif tn == "MeshFilter":
                d = o.read()
                gp = d.m_GameObject
                mpid = getattr(d.m_Mesh, "path_id", None) if not hasattr(d.m_Mesh, "m_PathID") else d.m_Mesh.m_PathID
                mfid = getattr(d.m_Mesh, "file_id", None) if not hasattr(d.m_Mesh, "m_FileID") else d.m_Mesh.m_FileID
                mfs[gp.path_id if not hasattr(gp, "m_PathID") else gp.m_PathID] = {"fid": mfid, "pid": mpid}
            elif tn == "MeshRenderer":
                d = o.read()
                gp = d.m_GameObject
                mats = []
                for mm in d.m_Materials:
                    mats.append({"fid": getattr(mm, "file_id", None) if not hasattr(mm, "m_FileID") else mm.m_FileID,
                                 "pid": getattr(mm, "path_id", None) if not hasattr(mm, "m_PathID") else mm.m_PathID})
                mrs[gp.path_id if not hasattr(gp, "m_PathID") else gp.m_PathID] = mats
            elif tn == "SkinnedMeshRenderer":
                d = o.read()
                gp = d.m_GameObject
                mpid = getattr(d.m_Mesh, "path_id", None) if not hasattr(d.m_Mesh, "m_PathID") else d.m_Mesh.m_PathID
                mats = []
                for mm in (d.m_Materials or []):
                    mats.append({"pid": getattr(mm, "path_id", None) if not hasattr(mm, "m_PathID") else mm.m_PathID})
                smrs[gp.path_id if not hasattr(gp, "m_PathID") else gp.m_PathID] = {"mesh": mpid, "mats": mats}
        graph = {"g": go, "t": trs, "mf": mfs, "mr": mrs, "smr": smrs,
                 "ext": ext_names}
        with open(os.path.join(OUT, "graphs", f"{bundle}.json"), "w") as f:
            json.dump(graph, f)
        rows.append({"t": "Graph", "b": bundle, "go": len(go), "mf": len(mfs),
                     "mr": len(mrs), "smr": len(smrs)})
    except Exception as e:
        rows.append({"_err": f"GRAPH {bundle}: {type(e).__name__} {e}"[:180]})
    return rows, graph

def main():
    t0 = time.time()
    files = sorted(f for f in os.listdir(BUNDLES) if not f.startswith("."))
    done = set()
    if os.path.exists(DONE):
        done = set(open(DONE).read().split())
    todo = [f for f in files if f not in done]
    print(f"[scan] {len(files)} bundles, {len(todo)} todo", flush=True)
    cat = open(os.path.join(OUT, "catalog.jsonl"), "a", encoding="utf-8")
    dlog = open(DONE, "a")
    stats, errs = {}, 0
    ngraph = 0
    for i, f in enumerate(todo):
        try:
            rows, _ = process(os.path.join(BUNDLES, f))
        except Exception as e:
            rows = [{"_err": f"BUNDLE {f}: {type(e).__name__} {e}"[:180]}]
        for r in rows:
            if "_err" in r:
                errs += 1
                cat.write(json.dumps(r) + "\n")
                continue
            t = r.get("t", "?")
            stats[t] = stats.get(t, 0) + 1
            cat.write(json.dumps(r) + "\n")
        dlog.write(f + "\n")
        if (i + 1) % 400 == 0:
            cat.flush(); dlog.flush()
            top = dict(sorted(stats.items(), key=lambda x: -x[1])[:7])
            print(f"[{i+1}/{len(todo)}] {time.time()-t0:.0f}s {top} free={disk_free_mb()}MB", flush=True)
    cat.close(); dlog.close()
    json.dump({"stats": stats, "errors": errs, "seconds": round(time.time() - t0, 1)},
              open(os.path.join(OUT, "stats.json"), "w"), indent=1)
    print(f"[DONE] {time.time()-t0:.0f}s stats={stats} errors={errs}", flush=True)

if __name__ == "__main__":
    main()
