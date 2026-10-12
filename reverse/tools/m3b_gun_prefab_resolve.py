#!/usr/bin/env python3
"""M3 pass 4 phase B — standard-unit gun-prefab sound scan: RESOLUTION.

Reads phase-A census (m3a_census.jsonl), re-loads hit bundles, builds
GO/Transform/component maps, resolves the full fire-sound chain per unit
prefab, and dumps the AudioController bank (categories -> items -> subItems ->
clips). Cross-file PPtrs resolved via CAB map from phase A 'file' rows.

Output: reverse/evidence/audio/m3-gun-prefab-sound-scan.json (repo)
"""
import json, struct, re, sys, time
from collections import defaultdict
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.20f1'

DATA = '/home/z/my-project/aow3-extract/data/'
AA = '/home/z/my-project/aow3-extract/data/aa/Android/'
CENSUS = '/home/z/my-project/aow3-extract/m3a_census.jsonl'
DUMP_CS = '/home/z/my-project/aow3-extract/dump.cs'
OUT = '/home/z/my-project/aow3-repo/reverse/evidence/audio/m3-gun-prefab-sound-scan.json'

SCRIPT_MAP = {  # pathID -> class (subset needed for MB identification in hit bundles)
    9443: 'UnitShootSoundEffector', 4082: 'UnitShootFlashEffector',
    4185: 'GatlingAudioEffectController', 938: 'BulletSoundEffector',
    3452: 'UnitFlarePrepareSoundEffector', 9557: 'UnitSpecialModeSoundEffector',
    5211: 'UnitLoopedSpecialModeSoundEffector', 11108: 'UnitAbilityReactSoundEffector',
    10518: 'UnitMoveSoundEffector', 1933: 'UnitBipedalMoveSoundEffector',
    6002: 'UnitAircraftMoveSoundEffector', 7229: 'UnitHelicopterMoveSoundEffector',
    1075: 'UnitDeathSoundEffector', 8841: 'BuildingSoundEffector',
    10651: 'BuildingGroundSoundEffector', 7093: 'BuildingSpaceStrikeSoundEffector',
    8882: 'AudioGroups', 11699: 'FlashAudioGroupsLifecycleObserver',
    2015: 'FlashSequentialAudioGroupsLifecycleObserver',
    5721: 'ClientUnitWeapon', 9558: 'ClientBuildingWeapon', 11155: 'ClientBunkerWeapon',
    1888: 'AdditionalWeaponSettings', 9927: 'BurstWeaponSettings',
    10430: 'WeaponIdleEffectsController', 4527: 'BattleHelicopterSoundEffectManager',
    494: 'BattleSoundEffectController', 1080: 'AudioController',
    504: 'AbstractHeroAbilityEffectsPlayer', 728: 'LightningEffectsController',
    2516: 'PsitankAttackEffectController', 11277: 'PsitankAbilitiesEffectsController',
    3182: 'FlashPrefabCreator', 1151: 'AudioDurationAdjuster',
}

# ---------------------------------------------------------------- dump.cs enums
def parse_enums():
    txt = open(DUMP_CS, encoding='utf-8', errors='replace').read()
    out = {}
    for m in re.finditer(r'public enum (SoundGroups|AudioFile\.[\w.]+)[^\{]*\{(.*?)\n\}', txt, re.S):
        name, body = m.group(1), m.group(2)
        vals = {}
        for mm in re.finditer(r'public const [\w.]+ (\w+) = (-?\d+);', body):
            vals[int(mm.group(2))] = mm.group(1)
        if vals:
            out[name] = vals
    return out

# ---------------------------------------------------------------- bundle loader
class Bundle:
    def __init__(self, fname, path):
        self.fname = fname
        self.path = path
        self.env = UnityPy.load(open(path, 'rb').read())
        self.go_name = {}
        self.go_comps = defaultdict(list)   # go path_id -> [(kind, path_id)]
        self.transform = {}                 # tf path_id -> (go path_id, father path_id or 0)
        self.tf_of_go = {}
        self.clips = {}
        self.cab = ''
        self.externals = []                 # index i -> external name (fsid=i+1)
        self._load()
        self.mbs = {}                       # (mb path_id) -> parsed head dict

    def _load(self):
        objs = list(self.env.objects)
        byid = {}
        for o in objs:
            byid[o.path_id] = o
        try:
            sf = objs[0].assets_file
            self.cab = getattr(sf, 'name', '') or ''
            for ext in getattr(sf, 'externals', []) or []:
                nm = getattr(ext, 'path', None) or getattr(ext, 'name', '') or ''
                self.externals.append(nm)
        except Exception:
            pass
        for o in objs:
            t = o.type.name
            try:
                if t == 'GameObject':
                    g = o.read()
                    self.go_name[o.path_id] = g.m_Name or ''
                    for c in (g.m_Component or []):
                        pid = getattr(c, 'path_id', None)
                        if pid is None and isinstance(c, (tuple, list)):
                            pid = c[1]
                        if pid is None:
                            continue
                        kind = byid[pid].type.name if pid in byid else '?'
                        if kind == 'MonoBehaviour':
                            kind = self._mb_class(byid[pid])
                        self.go_comps[o.path_id].append((kind, pid))
                        if kind == 'Transform':
                            self.tf_of_go[o.path_id] = pid
                elif t == 'Transform':
                    tr = o.read()
                    gpp = tr.m_GameObject
                    gp = getattr(gpp, 'path_id', None)
                    if gp is None and isinstance(gpp, (tuple, list)):
                        gp = gpp[1]
                    fpp = tr.m_Father
                    fp = getattr(fpp, 'path_id', 0) or 0
                    if fp is None and isinstance(fpp, (tuple, list)):
                        fp = fpp[1] if fpp[1] else 0
                    self.transform[o.path_id] = (gp, fp or 0)
                elif t == 'AudioClip':
                    self.clips[o.path_id] = o.read().m_Name or ''
            except Exception:
                continue

    def _mb_class(self, o):
        try:
            raw = o.get_raw_data()
            if len(raw) < 33:
                return 'MonoBehaviour'
            fsid, pid = struct.unpack_from('<iq', raw, 16)
            if fsid == 1 and pid in SCRIPT_MAP:
                return SCRIPT_MAP[pid]
        except Exception:
            pass
        return 'MonoBehaviour'

    def root_name(self, go_path):
        tf = self.tf_of_go.get(go_path)
        seen = 0
        while tf and tf in self.transform and seen < 64:
            _, father = self.transform[tf]
            if not father or father not in self.transform:
                break
            tf = father
            seen += 1
        if tf and tf in self.transform:
            gp = self.transform[tf][0]
            return self.go_name.get(gp, '')
        return self.go_name.get(go_path, '')

    def children_gos(self, go_path):
        out = []
        tf0 = self.tf_of_go.get(go_path)
        if not tf0:
            return out
        byfather = defaultdict(list)
        for tf, (gp, father) in self.transform.items():
            if father:
                byfather[father].append(tf)
        stack = [tf0]
        while stack:
            tf = stack.pop()
            for ch in byfather.get(tf, ()):
                gp = self.transform[ch][0]
                out.append(gp)
                stack.append(ch)
        return out

# ---------------------------------------------------------------- registry
bundles = {}
def get_bundle(fname, path=None):
    if fname in bundles:
        return bundles[fname]
    if path is None:
        path = short_to_path.get(fname, '')
        if not path:
            return None
    import os
    if not os.path.exists(path):
        return None
    try:
        b = Bundle(fname, path)
    except Exception as e:
        print(f'!! load fail {fname}: {e}', flush=True)
        return None
    bundles[fname] = b
    return b

# PPtr resolution -> ('go', file, go_path) or None
def resolve_go(src_file, fsid, path_id):
    if fsid == 0:
        return (src_file, path_id)
    if fsid == 1:
        return None
    b = bundles.get(src_file)
    if not b or fsid - 1 >= len(b.externals):
        return None
    ext = b.externals[fsid - 1]
    m = re.search(r'(?:CAB-)?([0-9a-f]{16,32})', ext)
    if not m:
        return None
    tok = m.group(1)
    target = cab_to_file.get(tok) or cab_to_file.get(tok[:16]) or cab_to_file.get('CAB-' + tok)
    if not target:
        return None
    tb = get_bundle(target)
    if not tb:
        return None
    return (target, path_id)

def go_info(ref):
    if not ref:
        return None
    f, pid = ref
    b = bundles.get(f)
    if not b:
        return None
    return {'file': f, 'go': b.go_name.get(pid, f'pathid:{pid}'), 'root': b.root_name(pid)}

# ---------------------------------------------------------------- load census
t0 = time.time()
rows = []
cab_to_file = {}
short_to_path = {}
for line in open(CENSUS):
    r = json.loads(line)
    if r['t'] == 'file':
        if r['cab']:
            cab_to_file[r['cab'].replace('CAB-', '')[:16]] = r['f']
            cab_to_file[r['cab']] = r['f']
        short_to_path[r['f']] = r.get('path', '')
    else:
        rows.append(r)
# zip path -> on-disk path (data/ mirrors assets/bin/Data and assets/aa)
import os
for k, p in list(short_to_path.items()):
    if p.startswith('assets/bin/Data/'):
        short_to_path[k] = DATA + p[len('assets/bin/Data/'):]
    elif p.startswith('assets/'):
        short_to_path[k] = DATA + p[len('assets/'):]
short_to_path = {k: v for k, v in short_to_path.items() if os.path.exists(v)}
print(f'census: {len(rows)} MBs, {len(cab_to_file)} cabs', flush=True)

hit_files = sorted(set(r['f'] for r in rows))
for f in hit_files:
    get_bundle(f)
print(f'bundles loaded: {len(bundles)} t={time.time()-t0:.0f}s', flush=True)

# group rows per (file, class)
by_cls = defaultdict(list)
for r in rows:
    by_cls[r['cls']].append(r)

def tail(r):
    return bytes.fromhex(r['tail'])

def parse_cstr(buf, off):
    if off + 4 > len(buf):
        return None, off
    (n,) = struct.unpack_from('<i', buf, off)
    if n < 0 or n > 200:
        return None, off
    s = buf[off + 4:off + 4 + n].decode('utf-8', 'replace')
    return s, (off + 4 + n + 3) & ~3

# ---------------------------------------------------------------- per-class decode
res = {}

# --- FlashPrefabCreator: [string prefabName][bool+pad] ---
res['flash_creators'] = []
for r in by_cls['FlashPrefabCreator']:
    buf = tail(r)
    s, _ = parse_cstr(buf, 0)
    res['flash_creators'].append({'file': r['f'], 'goPath': r['go'],
                                  'prefabName': s, 'stopByDuration': buf[-1] if buf else None})

# --- AudioGroups: [sg i32][7 bools+pad][PPtr adjuster] ---
res['audio_groups'] = []
for r in by_cls['AudioGroups']:
    buf = tail(r)
    if len(buf) < 12:
        continue
    sg, = struct.unpack_from('<i', buf, 0)
    adj = None
    if len(buf) >= 24:
        af, ap = struct.unpack_from('<iq', buf, 12)
        if af == 0:
            adj = ap
    gname = bundles.get(r['f']).go_name.get(r['go'], '') if r['f'] in bundles else ''
    root = bundles.get(r['f']).root_name(r['go']) if r['f'] in bundles else ''
    res['audio_groups'].append({'file': r['f'], 'go': gname or f'pathid:{r["go"]}',
                                'goPath': r['go'], 'root': root, 'sg': sg,
                                'flags': list(buf[4:12]),
                                'adjuster': adj})

# --- weapons ---
def parse_weapon(r, engined=True):
    buf = tail(r)
    if not buf:
        return None
    out = {'file': r['f'], 'goPath': r['go'], 'index': buf[0] if buf else None,
           'tailLen': len(buf)}
    b = bundles.get(r['f'])
    if b:
        out['go'] = b.go_name.get(r['go'], '')
        out['root'] = b.root_name(r['go'])
    off = 4 + 12 + 4  # index pad + flarePPtr + isVis pad
    muzzles = []
    if engined and len(buf) >= off + 4:
        # engineType(4) vMin(4) vMax(4) consider(4) wTH(12) rotH(12) wTV(12) rotV(12) vRot(4)
        off2 = off + 4 + 4 + 4 + 4 + 12 + 12 + 12 + 12 + 4
        if len(buf) >= off2 + 4:
            (cnt,) = struct.unpack_from('<i', buf, off2)
            if 0 <= cnt <= 8 and len(buf) >= off2 + 4 + 12 * cnt:
                for k in range(cnt):
                    fsid, pid = struct.unpack_from('<iq', buf, off2 + 4 + 12 * k)
                    ref = resolve_go(r['f'], fsid, pid)
                    gi = go_info(ref)
                    if gi:
                        muzzles.append(gi['go'])
                out['muzzles'] = muzzles
                off = off2 + 4 + 12 * cnt + 4 + 12 + 4  # strafe + burst + dirproj
                if len(buf) > off + 4:  # ClientUnitWeapon extra: isMelee+pad + settings PPtr
                    out['isMelee'] = buf[off] if off < len(buf) else None
    out['muzzles'] = muzzles
    return out

res['weapons'] = []
for cls in ('ClientUnitWeapon', 'ClientBuildingWeapon', 'ClientBunkerWeapon'):
    for r in by_cls[cls]:
        w = parse_weapon(r, engined=(cls != 'ClientBunkerWeapon'))
        if w:
            w['cls'] = cls
            res['weapons'].append(w)

# --- UnitShootFlashEffector: m_shootEffects array ---
res['shoot_flash'] = []
for r in by_cls['UnitShootFlashEffector']:
    buf = tail(r)
    rec = {'file': r['f'], 'goPath': r['go'], 'effects': []}
    b = bundles.get(r['f'])
    if b:
        rec['go'] = b.go_name.get(r['go'], '')
        rec['root'] = b.root_name(r['go'])
    if buf and len(buf) >= 4:
        (cnt,) = struct.unpack_from('<i', buf, 0)
        off = 4
        if 0 <= cnt <= 8:
            for k in range(cnt):
                if off + 4 > len(buf):
                    break
                (wi,) = struct.unpack_from('<i', buf, off)
                off += 4
                (ec,) = struct.unpack_from('<i', buf, off)
                off += 4
                effs = []
                if 0 <= ec <= 8:
                    for j in range(ec):
                        if off + 12 > len(buf):
                            break
                        fsid, pid = struct.unpack_from('<iq', buf, off)
                        off += 12
                        ref = resolve_go(r['f'], fsid, pid)
                        gi = go_info(ref) or {'file': None, 'go': f'unresolved:{fsid}:{pid}'}
                        effs.append(gi)
                off = (off + 3) & ~3  # manualEmissionControl bool+pad
                rec['effects'].append({'weaponIndex': wi, 'effectGOs': effs})
    res['shoot_flash'].append(rec)

# --- UnitShootSoundEffector: [sg][fot][wi][PPtr] ---
res['shoot_sound'] = []
for r in by_cls['UnitShootSoundEffector']:
    buf = tail(r)
    if len(buf) < 12:
        continue
    sg, fot, wi = struct.unpack_from('<ifi', buf, 0)
    rec = {'file': r['f'], 'goPath': r['go'], 'sg': sg, 'fadeOut': round(fot, 3),
           'weaponIndex': wi}
    b = bundles.get(r['f'])
    if b:
        rec['go'] = b.go_name.get(r['go'], '')
        rec['root'] = b.root_name(r['go'])
    res['shoot_sound'].append(rec)

# --- Gatling: 4 AudioGroups PPtrs ---
res['gatling'] = []
for r in by_cls['GatlingAudioEffectController']:
    buf = tail(r)
    rec = {'file': r['f'], 'goPath': r['go'], 'refs': []}
    b = bundles.get(r['f'])
    if b:
        rec['go'] = b.go_name.get(r['go'], '')
        rec['root'] = b.root_name(r['go'])
    for k in range(min(4, len(buf) // 12)):
        fsid, pid = struct.unpack_from('<iq', buf, 12 * k)
        ref = resolve_go(r['f'], fsid, pid)
        gi = go_info(ref) or {'file': None, 'go': f'unresolved:{fsid}:{pid}'}
        rec['refs'].append(gi)
    res['gatling'].append(rec)

# --- UnitFlarePrepareSoundEffector: [sg][weaponId][bool+pad] ---
res['flare_prepare'] = []
for r in by_cls['UnitFlarePrepareSoundEffector']:
    buf = tail(r)
    if len(buf) < 8:
        continue
    sg, wid = struct.unpack_from('<ii', buf, 0)
    rec = {'file': r['f'], 'goPath': r['go'], 'sg': sg, 'weaponId': wid}
    b = bundles.get(r['f'])
    if b:
        rec['go'] = b.go_name.get(r['go'], '')
        rec['root'] = b.root_name(r['go'])
    res['flare_prepare'].append(rec)

# --- generic dword record for move/death/special/building/others ---
res['other_sound'] = []
OTHER = ['UnitMoveSoundEffector', 'UnitBipedalMoveSoundEffector',
         'UnitAircraftMoveSoundEffector', 'UnitHelicopterMoveSoundEffector',
         'UnitDeathSoundEffector', 'UnitSpecialModeSoundEffector',
         'UnitLoopedSpecialModeSoundEffector', 'UnitAbilityReactSoundEffector',
         'BuildingSoundEffector', 'BuildingGroundSoundEffector',
         'BuildingSpaceStrikeSoundEffector', 'BulletSoundEffector',
         'LightningEffectsController', 'PsitankAttackEffectController',
         'PsitankAbilitiesEffectsController', 'AbstractHeroAbilityEffectsPlayer',
         'WeaponIdleEffectsController', 'BattleHelicopterSoundEffectManager',
         'BattleSoundEffectController', 'AudioDurationAdjuster']
for cls in OTHER:
    for r in by_cls.get(cls, ()):
        buf = tail(r)
        dws = [struct.unpack_from('<i', buf, k * 4)[0]
               for k in range(min(6, len(buf) // 4))] if buf else []
        rec = {'cls': cls, 'file': r['f'], 'goPath': r['go'], 'dwords': dws,
               'tailLen': len(buf)}
        b = bundles.get(r['f'])
        if b:
            rec['go'] = b.go_name.get(r['go'], '')
            rec['root'] = b.root_name(r['go'])
        res['other_sound'].append(rec)

# ---------------------------------------------------------------- AudioController bank
def parse_audiocontroller(b, mb_pathid):
    o = None
    for obj in b.env.objects:
        if obj.type.name != 'MonoBehaviour':
            continue
        try:
            raw0 = obj.get_raw_data()
            if len(raw0) < 33:
                continue
            fsid0, pid0 = struct.unpack_from('<iq', raw0, 16)
            if fsid0 == 1 and pid0 == 1080:
                o = obj
                break
        except Exception:
            continue
    if o is None:
        return None
    buf = o.get_raw_data()
    off = 32 + 4  # skip name len (name is '' typically) — recompute properly
    (nlen,) = struct.unpack_from('<i', buf, 28)
    if nlen < 0 or nlen > 300:
        return None
    off = (32 + nlen + 3) & ~3
    # AudioObjectPrefab PPtr
    if off + 12 > len(buf):
        return None
    off += 12
    # 5 bools+pad
    off += 20
    # musicCrossFadeTime f32
    off += 4
    # specifyCrossFadeInAndOutSeperately bool+pad
    off += 4
    # _musicCrossFadeTime_In/_Out
    off += 8
    # AudioCategories array
    if off + 4 > len(buf):
        return None
    (ccnt,) = struct.unpack_from('<i', buf, off)
    off += 4
    cats = []
    if not (0 <= ccnt <= 64):
        return None
    for _ in range(ccnt):
        off = (off + 3) & ~3
        cname, off = parse_cstr(buf, off)
        if cname is None:
            return cats
        pname, off = parse_cstr(buf, off)
        if pname is None:
            pname = ''
        off += 12  # AudioObjectPrefab PPtr
        if off + 4 > len(buf):
            return cats
        (icnt,) = struct.unpack_from('<i', buf, off)
        off += 4
        items = []
        if not (0 <= icnt <= 4000):
            return cats
        for _ in range(icnt):
            off = (off + 3) & ~3
            iname, off = parse_cstr(buf, off)
            if iname is None:
                return cats + [None]
            # Loop(4) count(4) overlap(4) randDelay(4) randPitch(4) randVol(4)
            # destroy(4) volume(4) pick(4) minTime(4) maxInst(4) delay(4)
            # override(4) minDist(4) maxDist(4) spatial(4) = 16*4
            if off + 64 > len(buf):
                return items
            volume, = struct.unpack_from('<f', buf, off + 28)
            off += 64
            (scnt,) = struct.unpack_from('<i', buf, off)
            off += 4
            subs = []
            if 0 <= scnt <= 64:
                for _ in range(scnt):
                    off = (off + 3) & ~3
                    if off + 4 + 4 + 4 > len(buf):
                        break
                    stype, = struct.unpack_from('<i', buf, off)
                    prob, = struct.unpack_from('<f', buf, off + 4)
                    off += 12  # type+prob+disable pad
                    mid, off = parse_cstr(buf, off)
                    if mid is None:
                        mid = ''
                    fsid, pid = struct.unpack_from('<iq', buf, off)
                    off += 12
                    vol, pitch = struct.unpack_from('<ff', buf, off)
                    off += 48  # 11 floats (vol..FadeOut = 44) + RandomStartPosition bool+pad (4)
                    off = (off + 3) & ~3  # element align
                    ref = resolve_go(b.fname, fsid, pid)
                    clip = None
                    if ref:
                        cf, cp = ref
                        cb = bundles.get(cf)
                        if cb:
                            clip = cb.clips.get(cp)
                    subs.append({'type': stype, 'prob': round(prob, 3),
                                 'itemModeAudioID': mid, 'clip': clip,
                                 'clipFile': ref[0] if ref else None,
                                 'vol': round(vol, 3), 'pitch': round(pitch, 3)})
            items.append({'name': iname, 'volume': round(float(volume), 3),
                          'subItems': subs})
        off += 4  # AudioCategory._volume [SerializeField] f32 (trailing)
        cats.append({'name': cname, 'items': items})
    return cats

res['bank'] = {}
for r in by_cls['AudioController']:
    b = bundles.get(r['f'])
    if not b:
        continue
    cats = parse_audiocontroller(b, r['go'])
    if cats and cats and any(c is None for c in cats):
        print(f"bank {r['f']}: PARTIAL parse (None sentinel present)")
    n_items = sum(len(c.get('items', ())) for c in (cats or []) if c)
    print(f"bank {r['f']}: cats={len(cats or [])} items={n_items} t={time.time()-t0:.0f}s", flush=True)
    res['bank'][r['f']] = cats or []

# ---------------------------------------------------------------- assemble units view
enums = parse_enums()
SG = enums.get('SoundGroups', {})
units = defaultdict(lambda: {'weapons': [], 'flash': [], 'sound': [], 'gatling': [],
                             'flarePrepare': [], 'other': []})
for w in res['weapons']:
    units[w.get('root') or '?']['weapons'].append(w)
for s in res['shoot_flash']:
    units[s.get('root') or '?']['flash'].append(s)
for s in res['shoot_sound']:
    units[s.get('root') or '?']['sound'].append(s)
for g in res['gatling']:
    units[g.get('root') or '?']['gatling'].append(g)
for f in res['flare_prepare']:
    units[f.get('root') or '?']['flarePrepare'].append(f)
for o in res['other_sound']:
    units[o.get('root') or '?']['other'].append(o)
res['units'] = {k: v for k, v in units.items() if k != '?' and
                (v['weapons'] or v['sound'] or v['flash'] or v['gatling'])}
res['soundgroups_enum_size'] = len(SG)

json.dump(res, open(OUT, 'w'), indent=1)
print('wrote', OUT, f'{time.time()-t0:.0f}s total', flush=True)

# ---------------------------------------------------------------- summary
print('\n=== SHOOT SOUND (direct UnitShootSoundEffector) ===')
for s in res['shoot_sound']:
    print(f"  {s.get('root','?'):28s} wi={s['weaponIndex']} sg={s['sg']} {SG.get(s['sg'],'?')} ({s['go']})")
print('\n=== SHOOT FLASH (UnitShootFlashEffector -> effect GOs) ===')
for s in res['shoot_flash']:
    for e in s['effects']:
        print(f"  {s.get('root','?'):28s} wi={e['weaponIndex']} -> {[x['go'] for x in e['effectGOs']]}")
print('\n=== GATLING ===')
for g in res['gatling']:
    print(f"  {g.get('root','?'):28s} {[x['go'] for x in g['refs']]}")
print('\n=== AUDIO GROUPS on gun/muzzle/unit GOs (sg != 0) ===')
from collections import Counter
c = Counter((a['root'], a['go'], a['sg']) for a in res['audio_groups'] if a['sg'])
for (root, go, sg), n in sorted(c.items()):
    print(f"  {root:28s} {go:32s} sg={sg} {SG.get(sg,'?')} x{n}")
print('\n=== FLASH PREFAB CREATORS (distinct prefab names) ===')
c2 = Counter(f['prefabName'] for f in res['flash_creators'] if f['prefabName'])
for nm, n in c2.most_common(40):
    print(f'  {n:4d}  {nm}')
print('\n=== BANK ItemFire* / Item*Fire items ===')
for bf, cats in res['bank'].items():
    for cat in cats:
        if not cat:
            continue
        for it in cat.get('items', []):
            if 'ire' in it['name'][:8] or it['name'].startswith('ItemFire') or 'muzzle' in it['name'].lower():
                subs = [(s['clip'], s['vol'], s['pitch']) for s in it['subItems']]
                print(f"  [{cat['name']}] {it['name']} vol={it['volume']} subs={subs}")
