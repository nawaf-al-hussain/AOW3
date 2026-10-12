#!/usr/bin/env python3
"""M3 pass 4 phase A — standard-unit gun-prefab sound scan: LEAN CENSUS.

Script-id-driven (m3-script-map-globalgamemanagers.json pathIDs), validated MB
layout: GO PPtr@0(12) · m_Enabled@12(1+3pad) · m_Script PPtr@16(12) ·
m_Name len@28 · name@32 · fields(tail).

Captures EVERY candidate-audio/weapon/flash MonoBehaviour with full tail hex,
plus per-file CAB names (for phase B cross-bundle PPtr resolution) and the
AudioController bank asset location. No GameObject/Transform reads (phase B
re-loads only hit bundles for hierarchy work).

Output: /home/z/my-project/aow3-extract/m3a_census.jsonl (+ .done marker)
"""
import zipfile, struct, json, time, sys, os
import UnityPy
UnityPy.config.FALLBACK_UNITY_VERSION = '2022.3.20f1'

APK = '/home/z/my-project/aow3-extract/xapk.bin'
OUT = '/home/z/my-project/aow3-extract/m3a_census.jsonl'
DONE = '/home/z/my-project/aow3-extract/m3a_census.done'

# ---- candidate MonoScript pathIDs (from m3-script-map-globalgamemanagers.json) ----
CANDIDATES = {
    9443: 'UnitShootSoundEffector',
    4082: 'UnitShootFlashEffector',
    4185: 'GatlingAudioEffectController',
    938: 'BulletSoundEffector',
    3452: 'UnitFlarePrepareSoundEffector',
    9557: 'UnitSpecialModeSoundEffector',
    5211: 'UnitLoopedSpecialModeSoundEffector',
    11108: 'UnitAbilityReactSoundEffector',
    10518: 'UnitMoveSoundEffector',
    1933: 'UnitBipedalMoveSoundEffector',
    6002: 'UnitAircraftMoveSoundEffector',
    7229: 'UnitHelicopterMoveSoundEffector',
    1075: 'UnitDeathSoundEffector',
    8841: 'BuildingSoundEffector',
    10651: 'BuildingGroundSoundEffector',
    7093: 'BuildingSpaceStrikeSoundEffector',
    8882: 'AudioGroups',
    11699: 'FlashAudioGroupsLifecycleObserver',
    2015: 'FlashSequentialAudioGroupsLifecycleObserver',
    5721: 'ClientUnitWeapon',
    9558: 'ClientBuildingWeapon',
    11155: 'ClientBunkerWeapon',
    11481: 'AbstractClientWeapon',
    5671: 'AbstractClientEnginedWeapon',
    1888: 'AdditionalWeaponSettings',
    9927: 'BurstWeaponSettings',
    10430: 'WeaponIdleEffectsController',
    4527: 'BattleHelicopterSoundEffectManager',
    494: 'BattleSoundEffectController',
    1080: 'AudioController',
    10009: 'AudioObject',
    9014: 'AudioItem',
    504: 'AbstractHeroAbilityEffectsPlayer',
    728: 'LightningEffectsController',
    2516: 'PsitankAttackEffectController',
    11277: 'PsitankAbilitiesEffectsController',
    3182: 'FlashPrefabCreator',
    1151: 'AudioDurationAdjuster',
}

def main():
    t0 = time.time()
    # ---- file list from the XAPK's base APK (already extracted to data/, but
    # read through the zip for consistency with prior scans) ----
    x = zipfile.ZipFile(APK)
    import io
    apk = zipfile.ZipFile(io.BytesIO(x.read('com.geargames.aow.apk')))
    names = [n for n in apk.namelist()
             if (n.startswith('assets/bin/Data/') or n.startswith('assets/aa/'))
             and not n.endswith('/')]
    print(f'corpus files: {len(names)}', flush=True)

    out = open(OUT, 'w')
    hits = 0
    for i, n in enumerate(names):
        short = n.split('/')[-1][:16]
        try:
            env = UnityPy.load(apk.read(n))
        except Exception as e:
            out.write(json.dumps({'t': 'err', 'f': short, 'e': str(e)[:80]}) + '\n')
            continue
        cabs = set()
        for obj in env.objects:
            try:
                sf = obj.assets_file
                cab = getattr(sf, 'name', '') or ''
                if cab:
                    cabs.add(cab)
            except Exception:
                pass
        if not cabs:
            cabs.add('')
        cab_s = sorted(cabs)[0]
        out.write(json.dumps({'t': 'file', 'f': short, 'cab': cab_s,
                              'path': n}) + '\n')
        for obj in env.objects:
            if obj.type.name != 'MonoBehaviour':
                continue
            try:
                raw = obj.get_raw_data()
            except Exception:
                continue
            if len(raw) < 33:
                continue
            sc_fsid, sc_path = struct.unpack_from('<iq', raw, 16)
            if sc_fsid != 1:
                continue
            cls = CANDIDATES.get(sc_path)
            if not cls:
                continue
            (nlen,) = struct.unpack_from('<i', raw, 28)
            if nlen < 0 or nlen > 300:
                continue
            go_fsid, go_path = struct.unpack_from('<iq', raw, 0)
            enabled = raw[12]
            pos = (32 + nlen + 3) & ~3
            tail = raw[pos:]
            rec = {'t': 'mb', 'f': short, 'cab': cab_s, 'cls': cls,
                   'go': go_path, 'en': enabled, 'goFsid': go_fsid,
                   'tail': tail.hex()[:800]}
            out.write(json.dumps(rec) + '\n')
            hits += 1
        if i % 400 == 0:
            print(f'[{i}/{len(names)}] hits={hits} t={time.time()-t0:.0f}s',
                  flush=True)
    out.close()
    open(DONE, 'w').write(f'{hits} hits in {time.time()-t0:.0f}s\n')
    print(f'DONE: {hits} candidate components, {time.time()-t0:.0f}s', flush=True)

if __name__ == '__main__':
    main()
