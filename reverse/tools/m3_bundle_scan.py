#!/usr/bin/env python3
"""M3 — weapon-sound table extraction from the APK asset bundles.

Scans all assets/bin/Data addressables bundles for:
  1. AudioClip objects            -> the clip inventory (names)
  2. MonoBehaviour typetrees carrying m_soundGroup / m_weaponIndex
     (UnitShootSoundEffector)     -> per-prefab (unit, weaponIndex, soundGroup)
  3. MonoScript class names       -> confirms the effector/handler bundles
Results: reverse/evidence/audio/m3-bundle-scan.json + a readable summary.
"""
import zipfile, json, time, sys, io, re

APK = '/home/z/my-project/aow3-extract/com.geargames.aow.apk'
OUTJSON = '/home/z/my-project/aow3-repo/reverse/evidence/audio/m3-bundle-scan.json'
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.20f1'

z = zipfile.ZipFile(APK)
names = [n for n in z.namelist() if n.startswith('assets/bin/Data/') and not n.endswith('/')]
print(f'{len(names)} bundles', flush=True)

clips = {}            # clip name -> bundle count
clip_bundles = {}     # bundle -> [clip names]
shoot_components = [] # dicts: bundle, go, weaponIndex, soundGroup, fadeOut
scripts = {}          # class name -> count
handler_trees = []    # MonoBehaviour trees with sound arrays
t0 = time.time()

def typetree_safe(obj):
    try:
        return obj.read_typetree()
    except Exception:
        return None

for i, n in enumerate(names):
    try:
        data = z.read(n)
    except Exception:
        continue
    try:
        env = UnityPy.load(data)
    except Exception:
        continue
    bname = n.split('/')[-1][:16]
    local_clips = []
    for obj in env.objects:
        t = obj.type.name
        if t == 'AudioClip':
            try:
                nm = obj.read().m_Name
                clips[nm] = clips.get(nm, 0) + 1
                local_clips.append(nm)
            except Exception:
                pass
        elif t == 'MonoScript':
            try:
                cn = obj.read().m_ClassName
                if cn and ('Sound' in cn or 'Audio' in cn):
                    scripts[cn] = scripts.get(cn, 0) + 1
            except Exception:
                pass
        elif t == 'MonoBehaviour':
            tt = typetree_safe(obj)
            if not isinstance(tt, dict):
                continue
            ks = set(tt.keys())
            if 'm_soundGroup' in ks and ('m_weaponIndex' in ks or 'm_fadeOutTime' in ks):
                shoot_components.append({
                    'bundle': bname,
                    'm_Name': tt.get('m_Name', ''),
                    'weaponIndex': tt.get('m_weaponIndex'),
                    'soundGroup': tt.get('m_soundGroup'),
                    'fadeOutTime': tt.get('m_fadeOutTime'),
                    'fields': sorted(ks)[:12],
                })
            elif any(k.startswith('m_sounds') or k.startswith('m_groups') or k == 'm_soundGroup' for k in ks) and len(ks) > 2:
                # possible handler/group table
                handler_trees.append({'bundle': bname, 'fields': sorted(ks)[:20],
                                      'm_Name': tt.get('m_Name', '')})
    if local_clips:
        clip_bundles[bname] = local_clips
    if i % 500 == 0:
        print(f'[{i}/{len(names)}] clips={len(clips)} shoot={len(shoot_components)} t={time.time()-t0:.0f}s', flush=True)

print(f'DONE {time.time()-t0:.0f}s: clips={len(clips)} shoot_components={len(shoot_components)} sound-scripts={len(scripts)}')
res = {
    'clip_count': len(clips),
    'clips': sorted(clips),
    'clip_bundles': clip_bundles,
    'shoot_components': shoot_components,
    'sound_scripts': scripts,
    'handler_like_trees': handler_trees[:200],
}
json.dump(res, open(OUTJSON, 'w'), indent=1)
print('wrote', OUTJSON)
