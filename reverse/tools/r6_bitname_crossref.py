#!/usr/bin/env python3
"""R6 — TakePositions cell-class bit-name cross-reference (offline).

Phase 1: decode ClientBattleCell.CheckByMask (0x8054284) + the passMask
         producers (ClientBattleCell.ctor 0x8053C2C <- BattleCellBasic $bf).
Phase 2: map-prefab cross-ref — histogram per-cell $bf shorts from the
         extracted jungle map data, correlate bits with the ClientBattleCell
         const names (Barrier..CameraInvisible), flag the unnamed bits 7/14.
"""
import struct, re, bisect, json, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
DUMP = '/home/z/my-project/re-work/dump/dump.cs'

data = open(SO, 'rb').read()
lines = open(DUMP).read().split('\n')
rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_rvas = []
rva2name = {}
for i, l in enumerate(lines):
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0:
            fn_rvas.append(rva)
            rva2name[rva] = lines[i + 1].strip()[:110]
fn_rvas.sort()

def next_rva(va):
    idx = bisect.bisect_right(fn_rvas, va)
    return fn_rvas[idx] if idx < len(fn_rvas) else va + 0x2000

(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt = struct.unpack_from('<I', data, b)[0]
    po, pv = struct.unpack_from('<QQ', data, b + 8)[:2]
    fs = struct.unpack_from('<Q', data, b + 32)[0]
    if pt == 1:
        segs.append((po, pv, fs))

def va2off(va):
    for po, pv, fs in segs:
        if pv <= va < pv + fs:
            return va - pv + po
    return None

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

def disasm(va, label, out, maxins=None):
    end = next_rva(va)
    o = va2off(va)
    out.append('\n==== %s @ 0x%x .. 0x%x (%d bytes) ====' % (label, va, end, end - va))
    n = 0
    for ins in md.disasm(data[o:o + (end - va)], va):
        line = '  0x%x: %-8s %s' % (ins.address, ins.mnemonic, ins.op_str)
        if ins.mnemonic == 'bl':
            nm = rva2name.get(ins.operands[0].imm)
            if nm:
                line += '   ; -> %s' % nm[:90]
        out.append(line)
        n += 1
        if maxins and n >= maxins:
            out.append('  ... (truncated)')
            break
    return end

out = ['R6 bit-name cross-ref — phase 1 (CheckByMask + passMask producers)',
       'sha256 libil2cpp.so 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5']

# ClientBattleCell methods (dump.cs:262577..):
disasm(0x8054284, 'ClientBattleCell.CheckByMask(short)', out)
disasm(0x8053C2C, 'ClientBattleCell.ctor(BattleCell, raycaster)', out, maxins=120)
disasm(0x8053CF4, 'get_VisAndInvisUnits', out, maxins=8)

open('/home/z/my-project/aow3/reverse/evidence/combat/r6-checkbymask-decode.txt', 'w').write('\n'.join(out) + '\n')
print('phase 1 written: reverse/evidence/combat/r6-checkbymask-decode.txt')
print('\n'.join(out[:40]))
