#!/usr/bin/env python3
"""Pin down the AntiAirOnly static air-class mask writer (AOW3 6.9.18).

get_AntiAirOnly (0x45b6274) computes (static_byte@2 & this.aiming) == this.aiming
through class slot 0x9677b98. This scan finds:
  1. all functions whose body loads slot 0x9677b98 (strict: ldr within 2 instrs,
     no intervening adrp on the same register);
  2. which of them also STORE a byte to static_fields+2 (strb w?, [x?, #2]
     after loading [x?, #0xb8]);
  3. disassembles every candidate writer.
"""
import struct, re, bisect
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = '/home/z/my-project/work/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/work/il2cpp/dump.cs'
OUT  = '/home/z/my-project/aow3-work/reverse/evidence/combat/weapon-type-aa-mask-writer.txt'
PAGE, SLOT = 0x9677000, 0xB98

data = open(SO, 'rb').read()
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type, _ = struct.unpack_from('<II', data, base)
    p_offset, p_vaddr, _, p_filesz = struct.unpack_from('<QQQQ', data, base + 8)
    if p_type == 1:
        segs.append((p_offset, p_vaddr, p_filesz))
seg_bounds = sorted((po, po + sz, pv) for po, pv, sz in segs)
_starts = [s[0] for s in seg_bounds]
def _off2va(o):
    k = bisect.bisect_right(_starts, o) - 1
    if k < 0: return None
    po, pend, pv = seg_bounds[k]
    return o - po + pv if o < pend else None

cls = '?'
pending_va = None
methods = []
cls_re  = re.compile(r'^\s*(?:public|internal|private|protected)?(?: sealed| abstract| static| partial)*\s*(?:class|struct|interface) ([\w.<>]+)')
rva_re  = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: (0x[0-9A-Fa-f]+) VA: (0x[0-9A-Fa-f]+)')
sig_re  = re.compile(r'^\t(?:public|private|protected|internal|static)[\w \[\]<>?,.]*\s([\w.]+)\((.*)\)')
for line in open(DUMP, encoding='utf-8', errors='replace'):
    cm = cls_re.match(line)
    if cm: cls = cm.group(1); continue
    rm = rva_re.search(line)
    if rm: pending_va = int(rm.group(3), 16); continue
    if pending_va is not None:
        sm = sig_re.match(line)
        if sm: methods.append((pending_va, f'{cls}.{sm.group(1)}', sm.group(2))); pending_va = None
        elif line.strip().startswith('//') or not line.strip(): continue
        else: pending_va = None
methods.sort()
vas = [m[0] for m in methods]
def enclosing(va):
    i = bisect.bisect_right(vas, va) - 1
    return methods[i] if i >= 0 else (None, '?', '')
def extent(va):
    i = bisect.bisect_right(vas, va) - 1
    if i < 0: return 0x400
    nxt = methods[i + 1][0] if i + 1 < len(methods) else va + 0x800
    return min(max(nxt - va, 0x20), 0x3000)

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN); md.detail = True

words = np.frombuffer(data[:len(data) // 4 * 4], dtype=np.uint32)
adrp_mask = (words >> np.uint32(24)) & np.uint32(0x9F)
adrp_idx = np.nonzero(adrp_mask == np.uint32(0x90))[0]

slot_loads = []      # (file_off, adrp_reg)
for i in adrp_idx:
    off_i = int(i) * 4
    va_i = _off2va(off_i)
    if va_i is None: continue
    w = int(words[i])
    immlo = (w >> 29) & 0x3
    immhi = (w >> 5) & 0x7FFFF
    imm = (immhi << 2) | immlo
    if imm & 0x100000: imm -= 0x200000
    if (va_i & ~0xFFF) + (imm << 12) != PAGE: continue
    rd = w & 0x1F
    w2 = int(words[i + 1]) if i + 1 < len(words) else 0
    if (w2 & 0xFFC00000) == 0xF9400000 and ((w2 >> 10) & 0xFFF) * 8 == SLOT and ((w2 >> 5) & 0x1F) == rd:
        slot_loads.append(off_i)
print(f'{len(slot_loads)} strict slot-0x9677b98 load sites')

# group by enclosing function, then check each body for strb [x?, #2] after ldr [x?, #0xb8]
fns = {}
for off in slot_loads:
    sva = _off2va(off)
    ev = enclosing(sva)
    if ev[0]: fns.setdefault(ev[0], ev[1])

out = ['=' * 78,
       'AntiAirOnly air-mask static writer scan (6.9.18)',
       f'strict slot 0x9677b98 loaders: {len(fns)} functions',
       '=' * 78]
writers = []
for fva, fname in sorted(fns.items()):
    off = None
    for po, pv, sz in segs:
        if pv <= fva < pv + sz:
            off = fva - pv + po; break
    body_out = []
    adrp_page, reg_ptr = {}, {}
    has_sf_load = False
    has_strb2 = False
    for ins in md.disasm(data[off:off + extent(fva)], fva):
        if ins.mnemonic == 'ldr' and ins.operands[0].type == 2 and ins.operands[1].type == 3:
            disp = ins.operands[1].mem.disp
            if disp == 0xB8: has_sf_load = True
        if ins.mnemonic == 'strb' and ins.operands[1].type == 3:
            disp = ins.operands[1].mem.disp
            if disp == 2: has_strb2 = True
        if ins.mnemonic == 'ret': break
    tag = 'WRITER' if (has_sf_load and has_strb2) else ''
    if tag: writers.append((fva, fname))
    out.append(f'  fn 0x{fva:x} {fname}  sf_load={has_sf_load} strb@2={has_strb2} {tag}')

out.append(f'\nwriter functions: {len(writers)}')
for fva, fname in writers:
    out.append(f'\n===== {fname} (va 0x{fva:x}) =====')
    off = None
    for po, pv, sz in segs:
        if pv <= fva < pv + sz:
            off = fva - pv + po; break
    adrp_page, reg_ptr = {}, {}
    n = 0
    for ins in md.disasm(data[off:off + extent(fva)], fva):
        ann = []
        if ins.mnemonic == 'adrp':
            adrp_page[ins.reg_name(ins.operands[0].reg)] = ins.operands[1].imm
        elif ins.mnemonic == 'ldr' and ins.operands[0].type == 2 and ins.operands[1].type == 3:
            base = ins.reg_name(ins.operands[1].mem.base)
            disp = ins.operands[1].mem.disp
            if base in adrp_page:
                va = adrp_page[base] + disp
                ann.append(f'-> va 0x{va:x}')
        line = f'  0x{ins.address:x}: {ins.mnemonic:<8} {ins.op_str}'
        if ann: line += '   ; ' + ' '.join(ann)
        out.append(line)
        n += 1
        if ins.mnemonic == 'ret' or n > 500: break

open(OUT, 'w').write('\n'.join(out))
print(f'writers: {len(writers)}; wrote {OUT}')
