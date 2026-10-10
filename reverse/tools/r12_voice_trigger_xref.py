#!/usr/bin/env python3
"""R12 — Announcer/voice trigger wiring xref (offline).

Scans the whole .text of libil2cpp.so (v6.9.18, sha256 8ace05bb...) for BL
call sites targeting every public AudioBattleVoicesPlayer.TryPlay*/Play*
entry point (dump.cs:80813-81180), the AudioBattleVoicesUtils helpers, and
the AudioBattleSoundsHandler.PlaySoundById<T>/PlayLimitedSoundById<T>/
PlayAudioItem shared instantiations. For every hit, the containing function
is resolved against the dump.cs RVA->name map, giving the definitive
event -> trigger-site wiring for the browser announcer fold-in (M1/I10).

Usage: python3 r12_voice_trigger_xref.py > reverse/evidence/audio/r12-voice-trigger-xref.txt
"""
import struct, re, bisect, json, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
DUMP = '/home/z/my-project/re-work/dump/dump.cs'

# ---- callees of interest (name -> RVA). Sources: dump.cs:80813-81180 ----
VOICES = [
    # (label, RVA)  AudioBattleVoicesPlayer publics
    ("TryPlayUnderAttackVoice", 0x79F64D8),
    ("TryPlayUnderDamageVoice", 0x79F6610),
    ("TryPlayExplodedOnMineVoice", 0x79F68AC),
    ("TryPlayEnemyDestroyedVoice", 0x79F6A04),
    ("TryPlayEnemySpottedVoice", 0x79F6DA8),
    ("TryPlayMineSpottedVoice", 0x79F6FF4),
    ("TryPlayFogDetectedVoice", 0x79F70DC),
    ("TryPlayShieldDetectedVoice", 0x79F72D4),
    ("TryPlayContainerDetectedVoice", 0x79F73E4),
    ("TryPlayFlagCapturedVoice", 0x79F74D0),
    ("TryPlayUnitOutOfFuelVoice", 0x79F7678),
    ("TryPlayBomberAfterBombingVoice", 0x79F77AC),
    ("TryPlayAviaHitVoice", 0x79F789C),
    ("TryPlayAircraftRebaseVoiceToSelectedUnits", 0x79F7928),
    ("TryPlayMoveVoiceToSelectedUnits", 0x79F79DC),
    ("TryPlayUnitMoveVoice", 0x79F7B0C),
    ("TryPlayAttackVoiceToSelectedUnits", 0x79F80D4),
    ("TryPlayZombieSpottedVoice", 0x79F865C),
    ("TryPlayZombieMoveVoice", 0x79F881C),
    ("TryPlayZombieImpactVoice", 0x79F8828),
    ("TryPlayBeholderSpecialVoice", 0x79F8834),
    ("TryPlayAtlasSpecialVoice", 0x79F8840),
    ("TryPlayAtlasDeathVoice", 0x79F884C),
    ("TryPlayStopVoiceToSelectedUnits", 0x79F8858),
    ("TryPlaySelectVoiceToSelectedUnits", 0x79F890C),
    ("TryPlayPatrolVoiceToSelectedUnits", 0x79F89C0),
    ("TryPlayHoldPositionVoiceToSelectedUnits", 0x79F8ACC),
    ("TryPlayBombardVoiceToSelectedUnits", 0x79F8B80),
    ("TryPlayAttackAreaVoiceToSelectedUnits", 0x79F8C34),
    ("TryPlayAttackAreaVoiceToUnits", 0x79F8CE8),
    ("TryPlaySiegeModeVoiceToSelectedUnits", 0x79F8E4C),
    ("TryPlayActivateShieldVoiceToSelectedUnits", 0x79F8F00),
    ("TryPlayScanningMinesVoiceToSelectedUnits", 0x79F8FB4),
    ("TryPlayActivateFogVoiceToSelectedUnits", 0x79F9068),
    ("TryPlayDeployingMinesVoiceToSelectedUnits", 0x79F911C),
    ("TryPlayHeroUnitCreated", 0x79F91D0),
    ("TryPlayHeroUnitDied", 0x79F92E8),
    ("TryPlayHeroShootActiveAbility", 0x79F9470),
    ("TryPlayHeroCDActiveAbility", 0x79F9550),
    ("TryPlayHeroReadyActiveAbility", 0x79F9630),
    ("TryPlayHeroPassiveAbilityStarted", 0x79F9710),
    ("TryPlayHeroMeleeAttack", 0x79F97F0),
    ("TryPlayHeroSpecToVoice", 0x79F98D0),
    ("TryPlayHeroSpecFromVoice", 0x79F99B0),
    ("TryPlayHeroOutOfRangeActiveVoice", 0x79F9A90),
    # AudioBattleVoicesUtils helpers (who consumes the category/spot logic)
    ("Utils.GetGroupCombatType", 0x77ED4FC),
    ("Utils.GetUnitCombatType", 0x77ED614),
    ("Utils.GetVoiceCategoriesForGroup", 0x77ED968),
    ("Utils.GetRandomCategoryFromSet", 0x77EDBB0),
    ("Utils.GetVoiceCategoryForSingleUnit", 0x77EDCD8),
    ("Utils.GetSpottedEnemyTypeForEntity", 0x77EDD30),
    ("Utils.IsUnitsGroupHideInForest", 0x77EDEAC),
    ("Utils.IsPointNearFlag", 0x77EE17C),
    ("Utils.IsPointInShotDistanceToGroup", 0x77EE560),
    ("Utils.GetSpotterUnit", 0x77EE838),
    # AudioBattleSoundsHandler shared instantiations (global/unit sound plays)
    ("PlaySoundById<Int32Enum> 3arg", 0x4DB6ED4),
    ("PlaySoundById<Nullable<Int32Enum>> 3arg", 0x4DB6E60),
    ("PlaySoundById<Int32Enum> 4arg+cell", 0x4DB7070),
    ("PlaySoundById<Int32Enum> 6arg+cell", 0x4DB7768),
    ("PlaySoundById<Int32Enum> 6arg", 0x4DB722C),
    ("PlayLimitedSoundById<Int32Enum> 3arg", 0x4DB63F4),
    ("PlayLimitedSoundById<Int32Enum> 4arg+cell", 0x4DB6590),
    ("PlayLimitedSoundById<Int32Enum> 6arg+cell", 0x4DB6B78),
    ("PlayLimitedSoundById<Int32Enum> 6arg", 0x4DB674C),
    ("PlayAudioItem 4arg+cell", 0x77EC6DC),
    ("PlayAudioItem 3arg", 0x77EC7B8),
    ("PlayLimitedAudioItem 4arg+cell", 0x77EC8B4),
    ("PlayLimitedAudioItem 3arg", 0x77EC990),
]

# ---- dump.cs RVA -> name map ----
rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
typapat = re.compile(r'^(?:public|private|internal|protected)?\s*(?:sealed |static |abstract |partial )*class\s+([\w.<>`]+)'
                     r'|^(?:public|private|internal)?\s*(?:sealed |static |abstract |partial )*struct\s+([\w.<>`]+)'
                     r'|^(?:public|private|internal)?\s*enum\s+([\w.<>`]+)')
lines = open(DUMP).read().split('\n')
fn_rvas = []
rva2name = {}
cur_type = ""
for i, l in enumerate(lines):
    tm = typapat.match(l.strip())
    if tm:
        cur_type = next(g for g in tm.groups() if g)
        continue
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0:
            fn_rvas.append(rva)
            meth = lines[i + 1].strip()[:90]
            rva2name[rva] = "%s.%s" % (cur_type, meth) if cur_type else meth
fn_rvas.sort()

def fn_of(va):
    """Containing function name for a code address."""
    idx = bisect.bisect_right(fn_rvas, va) - 1
    if idx < 0:
        return "??"
    base = fn_rvas[idx]
    return "%s+0x%x" % (rva2name[base], va - base) if va != base else rva2name[base]

# ---- ELF program headers -> vaddr<->offset ----
data = open(SO, 'rb').read()
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt, fl = struct.unpack_from('<II', data, b)[0:2]
    po, pv, pa, fsz, msz = struct.unpack_from('<QQQQQ', data, b + 8)
    if pt == 1 and fsz > 0:
        segs.append((pv, po, fsz))
segs.sort()

def v2o(va):
    for pv, po, fsz in segs:
        if pv <= va < pv + fsz:
            return po + (va - pv)
    return None

# ---- executable segment(s) ----
text = None
for pv, po, fsz in segs:
    if pv <= 0x79F64D8 < pv + fsz:      # voice code range lives in .text
        text = (pv, po, fsz)
if text is None:
    sys.exit("text segment not found")

tbase, toff, tsz = text
print("R12 voice-trigger xref — libil2cpp.so v6.9.18 (8ace05bb…)")
print("text: vaddr 0x%x..0x%x  (%.1f MB)" % (tbase, tbase + tsz, tsz / 1e6))
print("dump.cs function table: %d entries" % len(fn_rvas))
print()

targets = {rva: name for name, rva in VOICES}
hits = {rva: [] for rva in targets}

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.skipdata = True
CHUNK = 4 << 20
scan_off, scan_va = toff, tbase
bl_calls = 0
while scan_off < toff + tsz:
    n = min(CHUNK, toff + tsz - scan_off)
    code = data[scan_off:scan_off + n]
    for ins in md.disasm(code, scan_va):
        if ins.mnemonic == 'bl':
            bl_calls += 1
            try:
                tgt = int(ins.op_str[1:], 16)
            except ValueError:
                continue
            if tgt in targets:
                hits[tgt].append(ins.address)
    scan_off += n
    scan_va += n

print("total BL instructions scanned: %d" % bl_calls)
print()
for name, rva in VOICES:
    hs = hits[rva]
    print("== %s @ 0x%x — %d BL call site(s)" % (name, rva, len(hs)))
    seen = set()
    for h in sorted(hs):
        caller = fn_of(h)
        if caller in seen:
            continue
        seen.add(caller)
        print("   <- 0x%x  %s" % (h, caller))
    if not hs:
        print("   (no direct BL callers — vtable/virtual dispatch or delegate)")
    print()
