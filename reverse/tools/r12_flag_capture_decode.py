#!/usr/bin/env python3
"""R12c — decode ClientFlag.Capture (flag captured/lost polarity) and the
GUIBattleMinimapRenderer attack-feed methods (UnitAttacked/BuildingAttacked
throttles + who feeds them).

Usage: python3 r12_flag_capture_decode.py > reverse/evidence/audio/r12-flag-capture-decode.txt
"""
import struct, re, bisect
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
DUMP = '/home/z/my-project/re-work/dump/dump.cs'

# (label, vaddr, instructions)
FUNCS = [
    ("ClientFlag.Capture(ClientBattleSide) — calls FlagIsCaptured@+0x148 / FlagIsLost@+0x154", 0x8072d10, 0x300),
    ("GUIBattleMinimapRenderer.UnitAttacked(ClientUnit) — feeds OurUnitIsUnderAttack(+0x9c)/Allied(+0xa8)", 0x8206590, 0x140),
    ("GUIBattleMinimapRenderer.BuildingAttacked(ClientBuilding) — feeds OurBaseIsUnderAttack(+0x98)/Allied(+0xa4)", 0x8206654, 0x140),
    ("GUIBattleMinimapRenderer.EnemyDetected(IEntityDetectable) — feeds EnemyDetected(+0x158)/EnemyHiddenDetected(+0x148)", 0x8203f40, 0x280),
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

def v2o(va):
    for pv, po, fsz in segs:
        if pv <= va < pv + fsz:
            return po + (va - pv)
    return None

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.skipdata = True

print("R12c flag-capture polarity + attack-feed decode — libil2cpp.so v6.9.18 (8ace05bb…)")
print()
for label, va, ln in FUNCS:
    off = v2o(va)
    print("=" * 100)
    print("%s @ 0x%x" % (label, va))
    print("=" * 100)
    for ins in md.disasm(data[off:off + ln], va):
        note = ""
        if ins.mnemonic == 'bl':
            try:
                tgt = int(ins.op_str[1:], 16)
                note = "   ; -> " + fn_of(tgt)
            except ValueError:
                pass
        print("  0x%08x  %-8s %-46s%s" % (ins.address, ins.mnemonic, ins.op_str, note))
    print()
