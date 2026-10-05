#!/usr/bin/env python3
"""Unpack all Unity asset bundles from the AOW3 XAPK into bundles_all/."""
import zipfile, os, sys

XAPK = "/home/z/my-project/scripts/AOW3-repo/Art-of-War-3_6.9.18_apkcombo.com.xapk"
OUT = "/home/z/my-project/scripts/bundles_all"
STAGE = "/home/z/my-project/scripts/apk_stage"
os.makedirs(OUT, exist_ok=True)
os.makedirs(STAGE, exist_ok=True)

zf = zipfile.ZipFile(XAPK)
apks = [n for n in zf.namelist() if n.endswith(".apk")]
print("APKs in XAPK:", apks)

def is_bundle(name, head):
    # Unity bundles: unity3d files, or files whose magic is UnityFS
    if name.endswith((".unity3d", ".bundle")):
        return True
    return head.startswith(b"UnityFS")

total = 0
for apk in apks:
    base = os.path.basename(apk)
    stage_apk = os.path.join(STAGE, base)
    if not os.path.exists(stage_apk):
        with open(stage_apk, "wb") as f:
            f.write(zf.read(apk))
    try:
        az = zipfile.ZipFile(stage_apk)
    except zipfile.BadZipFile:
        print("skip bad zip:", base); continue
    n_before = total
    for info in az.infolist():
        if info.is_dir():
            continue
        name = info.filename
        if not (name.startswith("assets/") or name.startswith("Assets/")):
            continue
        # read first 8 bytes to detect UnityFS
        with az.open(info) as fh:
            head = fh.read(8)
        if not is_bundle(name, head):
            continue
        out_name = os.path.basename(name)
        if not out_name:
            continue
        dst = os.path.join(OUT, out_name)
        if os.path.exists(dst) and os.path.getsize(dst) == info.file_size:
            continue
        with az.open(info) as fh, open(dst, "wb") as wf:
            while True:
                chunk = fh.read(1 << 20)
                if not chunk:
                    break
                wf.write(chunk)
        total += 1
    print(f"{base}: +{total - n_before} bundles")

print("total bundles:", total, "->", OUT)
