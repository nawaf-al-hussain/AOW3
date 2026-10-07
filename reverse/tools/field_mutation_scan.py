#!/usr/bin/env python3
"""Build E part 2 — find every direct STRB/LDRB/LDRSB on Unit.task (0x6A) and
Unit.flag_shoot (0xA0) across the executable segment (unsigned-offset encodings
only, complete for these immediates), with enclosing-function attribution."""
import struct, re
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = '/home/z/my-project/aow3-work/native/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/native/dump.cs'
OUT  = '/home/z/my-project/aow3-work/attack-field-scan-sim.txt'

data = open(SO, 'rb').read()
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt, flags = struct.unpack_from('<II', data, b)
    po, pv = struct.unpack_from('<QQ', data, b + 8)
    fs, fm = struct.unpack_from('<QQ', data, b + 32)
    if pt == 1:
        segs.append((po, pv, fs, flags))

def va2off(va):
    for po, pv, fs, fl in segs:
        if pv <= va < pv + fs:
            return va - pv + po
    return None

ex = [(pv, pv + fs) for po, pv, fs, fl in segs if fl & 1]

rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_starts = []
rva2name = {}
lines = open(DUMP).read().split('\n')
for i, l in enumerate(lines):
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0:
            fn_starts.append(rva)
            rva2name[rva] = lines[i + 1].strip()[:120]
fn_starts = sorted(set(fn_starts))
fa = np.array(fn_starts, dtype=np.int64)

def enclosing(va):
    idx = np.searchsorted(fa, va, side='right') - 1
    if idx < 0:
        return None, None
    return int(fa[idx]), rva2name.get(int(fa[idx]), '?')

SIM_LO, SIM_HI = 0x4400000, 0x4A00000  # battle-sim cluster

def scan_uimm(imm12, opcode_base, mask, label):
    """find all words with (w & mask) == (opcode_base | imm12<<10) & mask"""
    want = (opcode_base | (imm12 << 10)) & mask
    hits = []
    for lo, hi in [(max(lo, SIM_LO), min(hi, SIM_HI)) for lo, hi in ex]:
        off = va2off(lo)
        n = (hi - lo) // 4
        words = np.frombuffer(data, dtype='<u4', count=n, offset=off).astype(np.uint32)
        sel = np.nonzero((words & np.uint32(mask)) == np.uint32(want))[0]
        hits += [int(lo + int(i) * 4) for i in sel]
    print(f'{label}: {len(hits)} sites')
    return hits

# STRB imm unsigned: 00 111 0 0 00 imm12 Rn Rt  -> 0x39000000, mask 0xFFE00C00
# LDRB imm unsigned: 00 111 0 0 01 imm12 Rn Rt  -> 0x39400000
# LDRSB w imm unsigned: 00 111 0 0 10s imm12    -> 0x39800000 (s=0, w target)
MASK = 0xFFE00C00
SCANS = [
    (0x39000000, 0x6A, 'STRB [x,#0x6A] task WRITE'),
    (0x39400000, 0x6A, 'LDRB [x,#0x6A] task READ'),
    (0x39800000, 0x6A, 'LDRSB [x,#0x6A] task READ-S'),
    (0x39000000, 0xA0, 'STRB [x,#0xA0] flag_shoot WRITE'),
    (0x39400000, 0xA0, 'LDRB [x,#0xA0] flag_shoot READ'),
    (0x39800000, 0xA0, 'LDRSB [x,#0xA0] flag_shoot READ-S'),
]

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

out = []
for base, imm, label in SCANS:
    hits = scan_uimm(imm, base, MASK, label)
    out.append(f'\n######## {label} : {len(hits)} sites ########')
    by_fn = {}
    for h in hits:
        enc, _ = enclosing(h)
        by_fn.setdefault(enc, []).append(h)
    for enc in sorted(by_fn, key=lambda v: (v is None, v)):
        _, nm = enclosing(enc) if enc else (None, '?')
        out.append(f'\n== [{hex(enc) if enc else "?"}] {nm} ({len(by_fn[enc])} sites) ==')
        if enc:
            nxt_i = np.searchsorted(fa, enc, side='right')
            fend = int(fa[nxt_i]) if nxt_i < len(fa) else enc + 0x8000
            out.append(f'   extent 0x{enc:x}..0x{fend:x} ({fend-enc} B)')
        for h in by_fn[enc][:24]:
            lo = h - 6 * 4
            o = va2off(lo)
            out.append(f'  ---- site 0x{h:x} ----')
            for ins in md.disasm(data[o:o + 8 * 4], lo):
                line = f'    0x{ins.address:x}: {ins.mnemonic:<8s} {ins.op_str}'
                if ins.mnemonic == 'bl':
                    t = ins.operands[0].imm
                    if t in rva2name:
                        line += f'   ; -> {rva2name[t][:90]}'
                if any(k in line for k in ('cmp', 'tbz', 'tbnz', 'cbz', 'cbnz')):
                    line += '   ; BR'
                out.append(line)

open(OUT, 'w').write('\n'.join(out) + '\n')
print('written', OUT)
