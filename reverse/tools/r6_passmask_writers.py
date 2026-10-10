#!/usr/bin/env python3
"""R6 phase 3 — all m_passMask (offset 0x38, strh) writers in the binary.

Scans libil2cpp.so .text for A64 `strh Wn, [Xm, #imm]` with imm==0x38 and
disassembles a window around each site; plus decodes the tiny mutators
AddBarrier (0x8053D0C) and BuildingEnter/BuildingLeave to confirm which bits
are dynamic occupancy states.
"""
import struct, re, bisect
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
            rva2name[rva] = lines[i + 1].strip()[:100]
fn_rvas.sort()

def fn_of(va):
    idx = bisect.bisect_right(fn_rvas, va) - 1
    return (fn_rvas[idx], rva2name.get(fn_rvas[idx], '?')) if idx >= 0 else (0, '?')

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

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

# --- scan .text for strh Wn, [Xm, #0x38]  (imm12 = 0x1C, halfword-scaled) ---
hits = []
text_start, text_end = 0x400000, 0x9800000  # generous .text bounds
for po, pv, fs in segs:
    lo, hi = max(pv, text_start), min(pv + fs, text_end)
    off0 = lo - pv + po
    for i in range(0, hi - lo - 4, 4):
        w = struct.unpack_from('<I', data, off0 + i)[0]
        # STRH (imm): size=01 111 V=0 01 opc=00 imm12 Rn Rt -> bits31..22 = 0b0111100100
        if ((w >> 22) & 0x3FF) == 0b0111100100 and ((w >> 10) & 0xFFF) == 0x1C:
            va = lo + i
            hits.append(va)
print('strh [x,#0x38] sites: %d' % len(hits))

out = ['R6 phase 3 — m_passMask writer census (strh Wn,[Xm,#0x38])',
       'sha256 libil2cpp.so 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5', '']
by_fn = {}
for va in hits:
    by_fn.setdefault(fn_of(va), []).append(va)
for (fva, fname), vas in sorted(by_fn.items()):
    out.append('== %s @ 0x%x — %d site(s): %s' % (fname[:80], fva, len(vas), ','.join(hex(v) for v in vas)))

def window(va, back=6, fwd=4):
    end = next_rva(va)
    o = va2off(va)
    ins_list = []
    # walk back `back` instructions by re-disasming a window
    start = va - back * 4
    so = va2off(start)
    for ins in md.disasm(data[so:so + (back + fwd) * 4], start):
        ins_list.append('    0x%x: %-8s %s' % (ins.address, ins.mnemonic, ins.op_str))
        if ins.address >= va + fwd * 4:
            break
    return ins_list

# decode windows for sites inside ClientBattleCell range + first 25 others
out.append('')
for (fva, fname), vas in sorted(by_fn.items()):
    if 0x8053A84 <= fva <= 0x80555F0 or len(out) < 40:
        for va in vas[:3]:
            out.append('-- site 0x%x (in %s)' % (va, fname[:70]))
            out.extend(window(va))
            out.append('')

# --- full ClientBattleCell method-range decode (catch writeback forms too) ---
out.append('')
out.append('==== ClientBattleCell method-range orr/bic constants feeding passMask ====')
CB_START, CB_END = 0x8053A84, 0x80555E8
o = va2off(CB_START)
orr_lines = []
pending = None
for ins in md.disasm(data[o:o + (CB_END - CB_START)], CB_START):
    if ins.mnemonic == 'ldrh' and '#0x38]' in ins.op_str:
        pending = ins.address
    elif ins.mnemonic in ('orr', 'and', 'bic') and ins.op_str.startswith('w') and pending is not None \
            and ins.address - pending <= 0x10:
        if '#' in ins.op_str:
            orr_lines.append('  0x%x: %s %s   (after ldrh 0x38 @0x%x)' % (ins.address, ins.mnemonic, ins.op_str, pending))
    if ins.mnemonic == 'strh' and '#0x38]' in ins.op_str:
        pending = None
out.extend(orr_lines if orr_lines else ['  (none found in range)'])
out.append('')

# --- tiny mutators ---
for va, label in [(0x8053D0C, 'AddBarrier'), (0x8054184, 'BuildingEnter'),
                  (0x80541AC, 'BuildingLeave'), (0x80541C8, 'BuildingBandEnter'),
                  (0x805425C, 'BuildingBandLeave'), (0x8053D1C, 'UnitEnter')]:
    end = next_rva(va)
    o = va2off(va)
    out.append('==== %s @ 0x%x (%d bytes) ====' % (label, va, end - va))
    for ins in md.disasm(data[o:o + (end - va)], va):
        out.append('  0x%x: %-8s %s' % (ins.address, ins.mnemonic, ins.op_str))
    out.append('')

open('/home/z/my-project/aow3/reverse/evidence/combat/r6-passmask-writers.txt', 'w').write('\n'.join(out) + '\n')
print('written r6-passmask-writers.txt')
print('\n'.join(out[:60]))
