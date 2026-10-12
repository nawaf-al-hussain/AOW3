#!/usr/bin/env python3
"""M3 pass 3 — definitive weapon-sound table extraction.

globalgamemanagers.assets (3 split files, 11,711 MonoScripts) maps script
pathIDs to engine classes. fsid=1 in a content bundle's MonoBehaviour m_Script
PPtr = externals[0] = globalgamemanagers.assets, so script resolution is exact:
  UnitShootSoundEffector  pathid 9443  -> (m_soundGroup, m_fadeOutTime, m_weaponIndex)
  UnitShootFlashEffector  pathid 4082
  UnitMoveSoundEffector   pathid 10518 (per-unit move sound, same serialized shape)
  UnitDeathSoundEffector  pathid 1075
Scan all content bundles, extract the (prefab, weaponIndex, soundGroup) triples.
"""
import zipfile, struct, json, time
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.20f1'

APK = '/home/z/my-project/aow3-extract/com.geargames.aow.apk'
OUT = '/home/z/my-project/aow3-repo/reverse/evidence/audio/m3-weapon-sound-table.json'

SCRIPT_MAP = {
    9443: 'UnitShootSoundEffector',
    4082: 'UnitShootFlashEffector',
    10518: 'UnitMoveSoundEffector',
    1075: 'UnitDeathSoundEffector',
    6002: 'UnitAircraftMoveSoundEffector',
    1933: 'UnitBipedalMoveSoundEffector',
    7229: 'UnitHelicopterMoveSoundEffector',
    8841: 'BuildingSoundEffector',
    938: 'BulletSoundEffector',
}

z = zipfile.ZipFile(APK)
names = [n for n in z.namelist() if n.startswith('assets/bin/Data/') and not n.endswith('/')]
rows = []
t0 = time.time()
for i, n in enumerate(names):
    try:
        env = UnityPy.load(z.read(n))
    except Exception:
        continue
    gos = {}
    for obj in env.objects:
        if obj.type.name == 'GameObject':
            try:
                gos[obj.path_id] = obj.read().m_Name
            except Exception:
                pass
    for obj in env.objects:
        if obj.type.name != 'MonoBehaviour':
            continue
        try:
            raw = obj.get_raw_data()
        except Exception:
            continue
        if len(raw) < 33: continue
        go_fsid, go_path = struct.unpack_from('<iq', raw, 0)
        sc_fsid, sc_path = struct.unpack_from('<iq', raw, 16)
        if sc_fsid != 1: continue
        cls = SCRIPT_MAP.get(sc_path)
        if not cls: continue
        (nlen,) = struct.unpack_from('<i', raw, 28)
        if nlen < 0 or nlen > 300: continue
        pos = (32 + nlen + 3) & ~3
        tail = raw[pos:]
        rec = {'bundle': n.split('/')[-1][:16], 'class': cls,
               'go': gos.get(go_path, f'pathid:{go_path}'), 'tailLen': len(tail)}
        if cls == 'UnitShootSoundEffector' and len(tail) >= 12:
            sg, fot, wi = struct.unpack_from('<ifi', tail, 0)
            rec.update(soundGroup=sg, fadeOut=round(fot, 3), weaponIndex=wi)
        elif len(tail) >= 12:
            rec['dwords'] = [struct.unpack_from('<i', tail, k*4)[0] for k in range(min(3, len(tail)//4))]
        rows.append(rec)
    if i % 1000 == 0:
        print(f'[{i}] rows={len(rows)} t={time.time()-t0:.0f}s', flush=True)

print(f'DONE {time.time()-t0:.0f}s: {len(rows)} effector components')
json.dump(rows, open(OUT, 'w'), indent=1)
shoot = [r for r in rows if r['class'] == 'UnitShootSoundEffector']
print(f'{len(shoot)} UnitShootSoundEffector rows:')
for r in shoot[:40]:
    print(f"  {r['go']!r:32s} weaponIndex={r.get('weaponIndex')} soundGroup={r.get('soundGroup')} fadeOut={r.get('fadeOut')}")
print('wrote', OUT)
