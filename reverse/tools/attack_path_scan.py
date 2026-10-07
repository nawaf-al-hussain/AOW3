#!/usr/bin/env python3
"""Build E — attack-path decode: does native fire discipline (DontShoot task 8 /
flag_shoot) survive an attack order?

Whole-binary BL xref (vectorized numpy) for:
  $Hi            0x48178FC   (set-task helper: $Hi(Battle,Unit,taskId))
  Unit.set_Task  0x45B13D4
  Unit.get_Task  0x45B13CC
  Unit.set_FlagShoot 0x45B0E80
  Unit.get_FlagShoot 0x45B0E78
  Unit.set_Obj   0x45B10C4
Then: full disasm of $Hi; windows around each $Hi caller (extract mov w2,#N);
enclosing function lookup for every hit from the dump.cs RVA table.
"""
import struct, re, bisect, sys
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = '/home/z/my-project/aow3-work/native/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/native/dump.cs'
OUT  = '/home/z/my-project/aow3-work/attack-path-scan.txt'

data = open(SO, 'rb').read()

# ---- ELF program headers -> va2off + exec segment extent ----
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

# executable segment range
ex = [(pv, pv + fs) for po, pv, fs, fl in segs if fl & 1]
EX_LO, EX_HI = min(v[0] for v in ex), max(v[1] for v in ex)

# ---- dump.cs RVA table -> enclosing-function lookup + name map ----
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

def next_start(va):
    idx = np.searchsorted(fa, va, side='right')
    return int(fa[idx]) if idx < len(fa) else va + 0x8000

# ---- vectorized whole-binary BL xref ----
md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

def bl_xref(target, label):
    hits = []
    for lo, hi in ex:
        off = va2off(lo)
        n = (hi - lo) // 4
        words = np.frombuffer(data, dtype='<u4', count=n, offset=off).astype(np.uint32)
        is_bl = (words >> 26) == 0x25  # 100101
        idxs = np.nonzero(is_bl)[0]
        if len(idxs) == 0:
            continue
        w = words[idxs].astype(np.int64)
        imm = (w & 0x3FFFFFF)
        imm = np.where(imm & 0x2000000, imm - 0x4000000, imm)
        tgt = (lo + idxs.astype(np.int64) * 4) + imm * 4
        sel = np.nonzero(tgt == target)[0]
        for s in sel:
            hits.append(int(lo + idxs[int(s)] * 4))
    print(f'{label} 0x{target:x}: {len(hits)} BL sites')
    return hits

ANCHORS = [
    (0x48178FC, '$Hi'),
    (0x45B13D4, 'Unit.set_Task'),
    (0x45B13CC, 'Unit.get_Task'),
    (0x45B0E80, 'Unit.set_FlagShoot'),
    (0x45B0E78, 'Unit.get_FlagShoot'),
    (0x45B10C4, 'Unit.set_Obj'),
]

out = []
xrefs = {}
for tgt, name in ANCHORS:
    hits = bl_xref(tgt, name)
    xrefs[name] = hits
    out.append(f'\n==== {name} @ 0x{tgt:x} : {len(hits)} direct BL sites ====')
    for h in sorted(hits):
        enc, encname = enclosing(h)
        out.append(f'  BL @ 0x{h:x}   in [{enc and hex(enc)}] {encname}')

# ---- windows around $Hi callers with task-id extraction ----
def disasm_window(va, back=26, fwd=6, note=''):
    lo = va - back * 4
    o = va2off(lo)
    out_lines = [f'  ---- window around 0x{va:x} {note} ----']
    for ins in md.disasm(data[o:o + (back + fwd) * 4], lo):
        line = f'    0x{ins.address:x}: {ins.mnemonic:<8s} {ins.op_str}'
        if ins.mnemonic == 'bl':
            t = ins.operands[0].imm
            nm = rva2name.get(t)
            if nm:
                line += f'   ; -> {nm[:90]}'
        out_lines.append(line)
    return out_lines

out.append('\n==== $Hi caller windows (task id = w2 mov before BL) ====')
task_ids = {}
for h in xrefs['$Hi']:
    o = va2off(h - 26 * 4)
    ins_list = list(md.disasm(data[o:o + (26 + 6) * 4], h - 26 * 4))
    tid = None
    for ins in ins_list:
        if ins.address >= h:
            break
        m = re.match(r'mov\s+w2, #(-?(0x[0-9a-f]+|\d+))$', ins.mnemonic + ' ' + ins.op_str)
        if m:
            v = int(m.group(1), 0)
            tid = v if v < 128 else v  # sbyte task
    task_ids.setdefault(tid, []).append(h)
    enc, encname = enclosing(h)
    out.append(f'\n  BL $Hi @ 0x{h:x} in [{enc and hex(enc)}] {encname}  --> task arg w2 = {tid}')
    out += disasm_window(h, note='(task-id scan)')

out.append('\n==== $Hi caller task-id histogram ====')
for tid in sorted(task_ids, key=lambda v: (v is None, v)):
    out.append(f'  task {tid}: {len(task_ids[tid])} sites  {[hex(x) for x in task_ids[tid][:12]]}')

# ---- full disasm of $Hi ----
hi_end = next_start(0x48178FC)
out.append(f'\n==== $Hi @ 0x48178FC .. 0x{hi_end:x} ({hi_end - 0x48178FC} bytes) ====')
o = va2off(0x48178FC)
for ins in md.disasm(data[o:o + (hi_end - 0x48178FC)], 0x48178FC):
    line = f'  0x{ins.address:x}: {ins.mnemonic:<8s} {ins.op_str}'
    if ins.mnemonic == 'bl':
        nm = rva2name.get(ins.operands[0].imm)
        if nm:
            line += f'   ; -> {nm[:90]}'
    m = re.search(r'(ldr|str|ldrsb|ldurb|sturb|stur|ldur)(s?)(b|h|w)?\s+(w|x)\d+.*#(0x[0-9a-f]+)', line)
    if m:
        v = int(m.group(5), 16)
        tag = {0x6A: 'UNIT.task', 0x69: 'UNIT.task_visual', 0xA0: 'UNIT.flag_shoot',
               0x104: 'UNIT.task_until_tick', 0x9F: 'UNIT.flag', 0x6B: 'UNIT.state',
               0xB8: 'UNIT.forced', 0x88: 'UNIT.obj', 0x90: 'UNIT.objPreferred',
               0xA1: 'UNIT.siege_stage', 0xA4: 'UNIT.siegeTick'}.get(v)
        if tag:
            line += f'   ; {tag}'
    if any(k in line for k in ('cmp', 'tbz', 'tbnz', 'cbz', 'cbnz')):
        line += '   ; BR'
    out.append(line)

# ---- enclosing function of the act dispatch (contains ACT_DONT_SHOOT arm 0x45F6700) ----
enc, encname = enclosing(0x45F6700)
out.append(f'\n==== act dispatch: 0x45F6700 enclosed by [{hex(enc)}] {encname} ====')
out.append(f'    extent -> next start 0x{next_start(enc):x} ({next_start(enc) - enc} bytes)')

# ---- set_Task direct callers (who bypasses $Hi) ----
out.append('\n==== Unit.set_Task direct caller windows ====')
for h in xrefs['Unit.set_Task'][:40]:
    enc, encname = enclosing(h)
    out.append(f'\n  BL set_Task @ 0x{h:x} in [{enc and hex(enc)}] {encname}')
    out += disasm_window(h, back=18, fwd=4)

open(OUT, 'w').write('\n'.join(out) + '\n')
print('written', OUT, len(out), 'lines')
