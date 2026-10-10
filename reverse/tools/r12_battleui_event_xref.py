#!/usr/bin/env python3
"""R12b — BattleUIEventHelper (strategic announcer) trigger-site xref.

Scans the whole .text of libil2cpp.so for BL call sites targeting every
public BattleUIEventHelper method (dump.cs:296691, the global BattleEvent
announcer dispatcher). For every hit, the containing function is resolved
against the dump.cs RVA->name map — this pins WHICH battle event fires each
global announcement (base under attack, flag lost, enemy detected, ...).

Usage: python3 r12_battleui_event_xref.py > reverse/evidence/audio/r12-battleui-event-xref.txt
"""
import struct, re, bisect, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
DUMP = '/home/z/my-project/re-work/dump/dump.cs'

# BattleUIEventHelper publics (name -> RVA), dump.cs:296691-296890
EVENTS = [
    ("InsufficientResources", 0x816C52C),
    ("InsufficientEnergy", 0x816C708),
    ("UnitLimitReached", 0x816C894),
    ("OurBuildingIsDestroyed", 0x816CAF8),
    ("BuildingComplete", 0x816CD90),
    ("BuildingUpgradeComplete", 0x816CDA8),
    ("ResourceContainerIsDetected", 0x816E4C8),
    ("ResourceReceived", 0x816E818),
    ("FlagIsCaptured", 0x816EA28),
    ("FlagIsLost", 0x816EBA0),
    ("PlayerControlsFlags", 0x816ED18),
    ("EnemyControlsFlags", 0x816EE90),
    ("EnemyDetected", 0x816F008),
    ("EnemyHiddenDetected", 0x816F1A4),
    ("OurHiddenUnitDetected", 0x816F340),
    ("OurUnitIsUnderAttack", 0x816F4B8),
    ("OurBaseIsUnderAttack", 0x816F654),
    ("AlliedUnitIsUnderAttack", 0x816F7CC),
    ("AlliedBaseIsUnderAttack", 0x816F944),
    ("OurUnitExplodedOnMine", 0x816FABC),
    ("MineDetected", 0x816FC34),
    ("SpaceSystemIsReadyForStrike", 0x816FDD0),
    ("NuclearMissileIsReadyForLaunch", 0x816FF48),
    ("SpaceStrikeIsDetected", 0x81700C0),
    ("NuclearLaunchIsDetected", 0x8170240),
    ("SpaceStrikeIsRejected", 0x81703C0),
    ("NuclearLaunchIsRejected", 0x817051C),
    ("DeployBegin", 0x8170678),
    ("PlaceBuilding", 0x817070C),
    ("BoostAdded", 0x8170798),
    ("BoostApply", 0x81707DC),
    ("BoostReject", 0x8170870),
    ("ContractCompleted", 0x8170DD4),
    ("ThereIsAllyUnit", 0x81709E8),
    ("ThereIsAllyBuilding", 0x8170B00),
    ("ShowInfoMessage", 0x8170C18),
]

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
    idx = bisect.bisect_right(fn_rvas, va) - 1
    if idx < 0:
        return "??"
    base = fn_rvas[idx]
    return "%s+0x%x" % (rva2name[base], va - base) if va != base else rva2name[base]

data = open(SO, 'rb').read()
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt = struct.unpack_from('<I', data, b)[0]
    po, pv, pa, fsz, msz = struct.unpack_from('<QQQQQ', data, b + 8)
    if pt == 1 and fsz > 0:
        segs.append((pv, po, fsz))
segs.sort()

tbase, toff, tsz = None, None, None
for pv, po, fsz in segs:
    if pv <= 0x816F654 < pv + fsz:
        tbase, toff, tsz = pv, po, fsz
if tbase is None:
    sys.exit("text segment not found")

targets = {rva: name for name, rva in EVENTS}
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

print("R12b BattleUIEventHelper trigger-site xref — libil2cpp.so v6.9.18 (8ace05bb…)")
print("total BL instructions scanned: %d" % bl_calls)
print()
for name, rva in EVENTS:
    hs = hits[rva]
    print("== BattleUIEventHelper.%s @ 0x%x — %d BL call site(s)" % (name, rva, len(hs)))
    seen = set()
    for h in sorted(hs):
        caller = fn_of(h)
        if caller in seen:
            continue
        seen.add(caller)
        print("   <- 0x%x  %s" % (h, caller))
    if not hs:
        print("   (no direct BL callers)")
    print()
