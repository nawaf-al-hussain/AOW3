#!/usr/bin/env python3
"""M3 pass 4 final assembly — fold split-pack scan, catalog fire keys, SG enum,
bank fire items and the decoded chain into m3-gun-prefab-sound-scan.json."""
import json, re, base64, zipfile, io, struct, sys
sys.path.insert(0, '/home/z/my-project/scripts')
import importlib.util
spec = importlib.util.spec_from_file_location('m3b', '/home/z/my-project/scripts/m3b_gun_prefab_resolve.py')

OUT = '/home/z/my-project/aow3-repo/reverse/evidence/audio/m3-gun-prefab-sound-scan.json'
d = json.load(open(OUT))

# ---- 1. SoundGroups enum names 1..19 (from dump.cs) ----
enums = {}
txt = open('/home/z/my-project/aow3-extract/dump.cs', encoding='utf-8', errors='replace').read()
for m in re.finditer(r'public enum (SoundGroups|AudioFile\.[\w.]+)[^\{]*\{(.*?)\n\}', txt, re.S):
    vals = {}
    for mm in re.finditer(r'public const [\w.]+ (\w+) = (-?\d+);', m.group(2)):
        vals[int(mm.group(2))] = mm.group(1)
    if vals:
        enums[m.group(1)] = vals
SG = enums.get('SoundGroups', {})
d['sg_enum_1_19'] = {str(k): SG.get(k) for k in range(1, 20)}

# ---- 2. AudioGroups sg histogram (prove no standard-unit sg) ----
from collections import Counter
hist = Counter(a['sg'] for a in d['audio_groups'])
d['audio_groups_sg_histogram'] = {str(k): v for k, v in sorted(hist.items())}
d['audio_groups_sg_in_1_19'] = {a['go']: a['sg'] for a in d['audio_groups'] if 1 <= a['sg'] <= 19}

# ---- 3. bank ItemFire* items with clips ----
fire_items = []
for bf, cats in d['bank'].items():
    for cat in cats:
        if not cat:
            continue
        for it in cat.get('items', []):
            if it['name'].startswith('ItemFire'):
                fire_items.append({'bank': bf, 'category': cat['name'],
                                   'name': it['name'],
                                   'sg': next((k for k, v in SG.items() if v == it['name']), None),
                                   'volume': it['volume'],
                                   'clips': [{'clip': s['clip'], 'vol': s['vol'],
                                              'pitch': s['pitch'],
                                              'prob': s['prob'],
                                              'file': s['clipFile']} for s in it['subItems']]})
d['bank_fire_items'] = fire_items

# ---- 4. addressables catalog fire keys ----
x = zipfile.ZipFile('/home/z/my-project/aow3-extract/xapk.bin')
apk = zipfile.ZipFile(io.BytesIO(x.read('com.geargames.aow.apk')))
j = json.loads(apk.read('assets/aa/catalog.json'))
kd = base64.b64decode(j['m_KeyDataString'])
allk = sorted(set(s.decode() for s in re.findall(rb'[a-zA-Z_][a-zA-Z0-9_.]{4,60}', kd)))
d['catalog_fire_keys'] = {
    'standard_fire': [k for k in allk if re.match(r'^(fire_rifle|fire_tank|fire_gun|fire_machine|fire_missile)', k)],
    'hero_fire': [k for k in allk if k.startswith('hero_fire_')],
    'hero_bullet': [k for k in allk if k.startswith('hero_bul_')],
    'boom_families': len([k for k in allk if k.startswith('boom_')]),
    'total_keys': len(allk),
    'internal_ids': len(j['m_InternalIds']),
}

# ---- 5. split-pack scan result (0 audio hits) ----
d['splitpack_scan'] = {'files': ['assetpack/defaultlocalgroup_assets_all',
                                 'assetpack/built_invfx_assets_all',
                                 'assetpack/built_inomniwindow_assets_all',
                                 'assetpack/decorations_common_assets_all',
                                 'assetpack/decorations_jungle_assets_all',
                                 'assetpack/decorations_desert_assets_all'],
                       'audio_candidates': 0,
                       'note': 'defaultlocalgroup = UI popups; fire prefabs NOT in APK (CDN addressables)'}

# ---- 6. decoded chain ----
d['standard_fire_chain'] = {
    'weapon_side': 'WeaponType.visual: FireType (dump.cs 396980 @0xC8) — server prototype field',
    'registry': 'BattleEffectsContext.m_firePrefabs: Dictionary<int, ClientFirePrefabs> (dump.cs 249526) keyed by FireType; GetFireEffects(FireType)',
    'prefab_set': 'ClientFirePrefabs {Fire, Bullet, BoomGround/Infantry/Vehicle/Ship/Building/Water/Air, Funnel, Power*} (dump.cs 250083)',
    'config': 'MapEditorFireTypeConfig (script 2197) {m_fireStyle sbyte, m_bulletType sbyte, m_prefFire/m_prefBullet/m_prefBoom* strings} — prefab-name mapping SERIALIZED but 0 assets in APK = map-editor/server config',
    'trigger': 'LCUnitShoot -> ClientUnit.WeaponShoot -> ComponentEventExecutor over IUnitShootable receivers (6 classes; census complete: UnitShootSoundEffector x5, UnitShootFlashEffector x2, GatlingAudioEffectController x1, Psitank x2, Lightning x1 — ALL hero/special)',
    'prefab_keys': 'fire_rifle1_s1..s4 / fire_rifle2_s1..s4(+_anim) / fire_rifle3_s1..s3 / fire_tank0..5 / hero_fire_* — addressables keys, bundles NOT in base APK (CDN runtime download)',
    'bank': 'battle AudioController bank aecb32e5f2b6e664 (11 cats, 308 items) holds ItemFireRifle1/2, ItemFireMachine1..4, ItemFireMissile1..3 etc. with clip subItems — id->clip binding EXTRACTED',
    'classification': 'standard-unit (weaponIndex -> SoundGroups) final pair lives on CDN Fire-prefab AudioGroups components = [CDN-ASSETS]+[SERVER-DATA]; R1-carriable (Frida: dump BattleEffectsContext.m_firePrefabs after PrewarmFireEffectPrefabs)',
}

json.dump(d, open(OUT, 'w'), indent=1)
print('wrote', OUT)
print('fire items:', len(fire_items))
for fi in fire_items[:20]:
    print(f"  sg={fi['sg']} {fi['name']} clips={[(c['clip'], c['file']) for c in fi['clips']][:3]}")
print('sg hist:', dict(sorted(hist.items())))
