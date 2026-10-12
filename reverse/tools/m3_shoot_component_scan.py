#!/usr/bin/env python3
"""M3 pass 2 — structural MonoBehaviour scan for UnitShootSoundEffector components.

The addressables bundles ship stripped typetrees, so UnitShootSoundEffector
components are identified STRUCTURALLY. Layout (Unity 2022.3, 32-bit align):
  m_GameObject PPtr (int32 fileID + int64 pathID)  12 B
  m_Enabled u8 + 3 pad                              4 B
  m_Script PPtr                                    12 B
  m_Name    string (int32 len + bytes + align4)    4+len' B
  ---- UnitShootSoundEffector fields ----
  m_soundGroup  int32   (SoundGroups enum, 0..~140)
  m_fadeOutTime float32 (0..30)
  m_weaponIndex int32   (0..8)
  m_shootSound  PPtr    (12 B)
Tail = exactly 24 B. The m_GameObject PPtr resolves IN-BUNDLE to the prefab's
GameObject name -> the (unit, weaponIndex, soundGroup) triple.
"""
import zipfile, json, struct, time
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.20f1'

APK = '/home/z/my-project/aow3-extract/com.geargames.aow.apk'
OUT = '/home/z/my-project/aow3-repo/reverse/evidence/audio/m3-shoot-components.json'

z = zipfile.ZipFile(APK)
names = [n for n in z.namelist() if n.startswith('assets/bin/Data/') and not n.endswith('/')]

def parse_mb(raw):
    """Parse MonoBehaviour header; return (go_fsid, go_pathid, enabled, script_fsid,
    script_pathid, name, tail_bytes) or None."""
    if len(raw) < 33: return None
    go_fsid, go_path = struct.unpack_from('<iq', raw, 0)
    enabled = raw[8]
    sc_fsid, sc_path = struct.unpack_from('<iq', raw, 12)
    (nlen,) = struct.unpack_from('<i', raw, 24)
    if nlen < 0 or nlen > 300: return None
    name_start = 28
    name = raw[name_start:name_start+nlen].decode('utf-8', 'replace')
    pos = name_start + nlen
    pos = (pos + 3) & ~3
    tail = raw[pos:]
    return go_fsid, go_path, enabled, sc_fsid, sc_path, name, tail

hits = []
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
        p = parse_mb(raw)
        if not p: continue
        go_fsid, go_path, enabled, sc_fsid, sc_path, name, tail = p
        if len(tail) != 24: continue
        sg, fot, wi = struct.unpack_from('<ifi', tail, 0)
        ss_fsid, ss_path = struct.unpack_from('<iq', tail, 12)
        if not (0 <= sg <= 160 and 0 <= wi <= 8 and 0.0 <= fot <= 30.0): continue
        if not (0 <= ss_fsid <= 6 and ss_path >= 0): continue
        if sg == 0 and wi == 0 and fot == 0.0: continue
        goname = gos.get(go_path, f'pathid:{go_path}')
        hits.append({'bundle': n.split('/')[-1][:16], 'go': goname,
                     'soundGroup': sg, 'fadeOut': round(fot, 3), 'weaponIndex': wi})
    if i % 1000 == 0:
        print(f'[{i}] hits={len(hits)} t={time.time()-t0:.0f}s', flush=True)

print(f'DONE: {len(hits)} UnitShootSoundEffector candidates in {time.time()-t0:.0f}s')
json.dump(hits, open(OUT, 'w'), indent=1)
print('wrote', OUT)
# quick print
from collections import Counter
c = Counter(h['go'] for h in hits)
print('top prefabs:', c.most_common(12))
print('soundGroup values:', sorted(set(h['soundGroup'] for h in hits)))
