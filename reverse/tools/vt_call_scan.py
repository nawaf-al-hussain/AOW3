#!/usr/bin/env python3
"""Build E part 3 — all vtable-dispatched Unit accessor calls in the sim cluster.
Method: vectorized scan for `ldr x?, [x?, #VT_OFF]` (ldr x imm-unsigned, scaled),
then capstone window ±10 ins, require matching `blr x?` within 5 ins.
VT offsets derived from the Unit vtable blob @0x138A480 (get_Task anchor 0x1008 exact):
  get_FlagShoot 0x258, set_FlagShoot 0x270, get_Forced 0x378, set_Forced 0x390,
  get_Obj 0x810, set_Obj 0x828, get_Task 0x1008, set_Task 0x1020,
  get_TaskVisual 0x1038, get_TaskUntilTick 0x1068"""
import struct, re
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = '/home/z/my-project/aow3-work/native/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/native/dump.cs'
OUT  = '/home/z/my-project/aow3-work/attack-vt-setters.txt'
SIM_LO, SIM_HI = 0x4400000, 0x4A00000

VT = {
    0x268: 'set_FlagShoot', 0x388: 'set_Forced',
    0x820: 'set_Obj',       0x1018: 'set_Task',
}

data = open(SO, 'rb').read()
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

rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_starts, rva2name = [], {}
for i, l in enumerate(open(DUMP).read().split('\n')):
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0:
            fn_starts.append(rva)
            rva2name[rva] = lines = l
for i, l in enumerate(open(DUMP).read().split('\n')):
    pass
# rebuild name map properly (line AFTER the RVA comment)
rva2name = {}
fl = open(DUMP).read().split('\n')
for i, l in enumerate(fl):
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0 and i + 1 < len(fl):
            rva2name[rva] = fl[i + 1].strip()[:120]
fn_starts = sorted(set(fn_starts))
fa = np.array(fn_starts, dtype=np.int64)

def enclosing(va):
    idx = np.searchsorted(fa, va, side='right') - 1
    if idx < 0:
        return None, None
    return int(fa[idx]), rva2name.get(int(fa[idx]), '?')

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

out = []
for vtoff, name in VT.items():
    imm12 = vtoff // 8
    want = 0xF9400000 | (imm12 << 10)
    mask = 0xFFFFFC00  # opcode bits 31:22 + imm12 bits 21:10; Rn/Rt excluded
    hits = []
    for _po, lo, _fs in segs:
        hi = lo + _fs
        if hi <= SIM_LO or lo >= SIM_HI:
            continue
        clo, chi = max(lo, SIM_LO), min(hi, SIM_HI)
        off = va2off(clo)
        n = (chi - clo) // 4
        words = np.frombuffer(data, dtype='<u4', count=n, offset=off).astype(np.uint32)
        sel = np.nonzero((words & np.uint32(mask)) == np.uint32(want))[0]
        hits += [int(clo + int(i) * 4) for i in sel]
    # keep only sites followed by blr with matching reg within 5 ins
    confirmed = []
    for h in hits:
        o = va2off(h)
        ins_l = list(md.disasm(data[o:o + 10 * 4], h))
        ok = False
        m1 = re.match(r'ldr (x\d+),', ins_l[0].mnemonic + ' ' + ins_l[0].op_str)
        for k, ins in enumerate(ins_l):
            if k == 0:
                continue
            if ins.mnemonic in ('ret', 'blr') :
                m2 = re.match(r'blr (x\d+)', ins.mnemonic + ' ' + ins.op_str)
                if m2 and m1 and m2.group(1) == m1.group(1):
                    ok = True
                break
        if ok:
            confirmed.append(h)
    by_fn = {}
    for h in confirmed:
        enc, _ = enclosing(h)
        by_fn.setdefault(enc, []).append(h)
    print(f'{name} [vt+{hex(vtoff)}]: {len(hits)} ldr sites -> {len(confirmed)} confirmed blr pairs, {len(by_fn)} functions')
    out.append(f'\n######## {name} [vt+{hex(vtoff)}] : {len(confirmed)} call sites in {len(by_fn)} functions ########')
    for enc in sorted(by_fn, key=lambda v: (v is None, v)):
        _, nm = (None, '?') if enc is None else enclosing(enc)
        cnt = len(by_fn[enc])
        out.append(f'\n== [{hex(enc) if enc else "?"}] {nm} ({cnt} sites) ==')
        for h in by_fn[enc][:30]:
            lo = h - 7 * 4
            o = va2off(lo)
            out.append(f'  ---- site 0x{h:x} ----')
            for ins in md.disasm(data[o:o + 10 * 4], lo):
                line = f'    0x{ins.address:x}: {ins.mnemonic:<8s} {ins.op_str}'
                if ins.mnemonic == 'bl':
                    t = ins.operands[0].imm
                    if t in rva2name:
                        line += f'   ; -> {rva2name[t][:90]}'
                m = re.search(r'#(0x[0-9a-f]+)', line)
                if m:
                    v = int(m.group(1), 16)
                    if v in (0x6A,): line += '   ; UNIT.task'
                    if v == 0xA0: line += '   ; UNIT.flag_shoot'
                if any(k in line for k in ('cmp', 'tbz', 'tbnz', 'cbz', 'cbnz')):
                    line += '   ; BR'
                out.append(line)

open(OUT, 'w').write('\n'.join(out) + '\n')
print('written', OUT)
