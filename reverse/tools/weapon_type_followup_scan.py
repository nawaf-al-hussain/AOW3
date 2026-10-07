#!/usr/bin/env python3
"""Follow-up scan for weapon_type_surface_native_analysis.py (AOW3 6.9.18).

1. .rela.dyn R_AARCH64_RELATIVE resolution of the 7 WeaponTarget method-pointer
   slots -> pair EWeaponTarget (Infantry/LandForce/...) with its aiming-bit
   predicate <CreateTargets>b__N.
2. Disassembly of WeaponStatsFactory.HasAiming (0x80f01b8) — the predicate core.
3. Disassembly of MineStatsFactory.CreateTargets (0x7fe6ab0) — bool-state target
   list of mines.
4. Whole-file ADRP scan for the AntiAirOnly class-slot 0x9677b98 -> find the
   static-target-class-mask writer (cctor) and disassemble it.
"""
import struct, re, bisect
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = '/home/z/my-project/work/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/work/il2cpp/dump.cs'
OUT  = '/home/z/my-project/aow3-work/reverse/evidence/combat/weapon-type-followup.txt'

data = open(SO, 'rb').read()
print(f'libil2cpp.so: {len(data)} bytes')

(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type, _ = struct.unpack_from('<II', data, base)
    p_offset, p_vaddr, _, p_filesz = struct.unpack_from('<QQQQ', data, base + 8)
    if p_type == 1:
        segs.append((p_offset, p_vaddr, p_filesz))

def va2off(va):
    for po, pv, sz in segs:
        if pv <= va < pv + sz:
            return va - pv + po
    return None

def off2va(off):
    for po, pv, sz in segs:
        if po <= off < po + sz:
            return off - po + pv
    return None

# ---- section headers (for .rela.dyn) ----
(e_shoff, e_shentsize, e_shnum, e_shstrndx) = struct.unpack_from('<Q', data, 0x28)[0], \
    struct.unpack_from('<H', data, 0x3A)[0], struct.unpack_from('<H', data, 0x3C)[0], \
    struct.unpack_from('<H', data, 0x3E)[0]
sections = {}
for i in range(e_shnum):
    h = e_shoff + i * e_shentsize
    (sh_name, sh_type, sh_flags, sh_addr, sh_offset, sh_size) = struct.unpack_from('<IIQQQQ', data, h)
    sections[i] = (sh_type, sh_addr, sh_offset, sh_size)
# shstrtab
sh_type, sh_addr, sh_offset, sh_size = sections[e_shstrndx]
strtab = data[sh_offset:sh_offset + sh_size]
def sname(i):
    sh_type, sh_addr, sh_offset, sh_size = sections[i]
    end = strtab.find(b'\0', sh_name := struct.unpack_from('<I', data, e_shoff + i * e_shentsize)[0])
    return strtab[sh_name:end].decode()
rela = None
for i in range(e_shnum):
    if sname(i) == '.rela.dyn':
        sh_type, sh_addr, sh_offset, sh_size = sections[i]
        rela = (sh_offset, sh_size)
        break
print(f'.rela.dyn: {"found" if rela else "MISSING"}')

# ---- parse RELA entries: R_AARCH64_RELATIVE (1027) ----
slotmap = {}
if rela:
    ro, rsz = rela
    n = rsz // 24
    arr = np.frombuffer(data[ro:ro + n * 24], dtype=np.uint8).reshape(n, 24)
    r_offset = arr[:, 0:8].copy().view(np.uint64).ravel()
    r_info   = arr[:, 8:16].copy().view(np.uint64).ravel()
    r_addend = arr[:, 16:24].copy().view(np.int64).ravel()
    rel = r_info & np.uint64(0xFFFFFFFF)
    m = rel == np.uint64(1027)
    for off, add in zip(r_offset[m], r_addend[m]):
        slotmap[int(off)] = int(add)
    print(f'{m.sum()} R_AARCH64_RELATIVE entries indexed')

def resolve(va, depth=3):
    """follow a chain of relative relocations; return (final_va, chain)"""
    chain = [va]
    cur = va
    for _ in range(depth):
        if cur in slotmap:
            cur = slotmap[cur]
            chain.append(cur)
        else:
            break
    return cur, chain

# ---- dump.cs method index ----
cls = '?'
pending_va = None
methods = []
cls_re  = re.compile(r'^\s*(?:public|internal|private|protected)?(?: sealed| abstract| static| partial)*\s*(?:class|struct|interface) ([\w.<>]+)')
rva_re  = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: (0x[0-9A-Fa-f]+) VA: (0x[0-9A-Fa-f]+)')
sig_re  = re.compile(r'^\t(?:public|private|protected|internal|static)[\w \[\]<>?,.]*\s([\w.]+)\((.*)\)')
for line in open(DUMP, encoding='utf-8', errors='replace'):
    cm = cls_re.match(line)
    if cm:
        cls = cm.group(1)
        continue
    rm = rva_re.search(line)
    if rm:
        pending_va = int(rm.group(3), 16)
        continue
    if pending_va is not None:
        sm = sig_re.match(line)
        if sm:
            methods.append((pending_va, f'{cls}.{sm.group(1)}', sm.group(2)))
            pending_va = None
        elif line.strip().startswith('//') or not line.strip():
            continue
        else:
            pending_va = None
methods.sort()
vas = [m[0] for m in methods]

def enclosing(va):
    i = bisect.bisect_right(vas, va) - 1
    return methods[i] if i >= 0 else (None, '?', '')

def extent(va):
    i = bisect.bisect_right(vas, va) - 1
    if i < 0:
        return 0x400
    nxt = methods[i + 1][0] if i + 1 < len(methods) else va + 0x800
    return min(max(nxt - va, 0x20), 0x2000)

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True
KNOWN = {
    'WeaponStatsFactory.HasAiming':        0x80F01B8,
    'MineStatsFactory.CreateTargets':      0x7FE6AB0,
    'WeaponTarget..ctor(bool)':            0x80F2018,
    'WeaponStatsFactory.<CreateTargets>b__0': 0x80F0C4C,
    'WeaponStatsFactory.<CreateTargets>b__1': 0x80F0C6C,
    'WeaponStatsFactory.<CreateTargets>b__2': 0x80F0CBC,
    'WeaponStatsFactory.<CreateTargets>b__3': 0x80F0CDC,
    'WeaponStatsFactory.<CreateTargets>b__4': 0x80F0CFC,
    'WeaponStatsFactory.<CreateTargets>b__5': 0x80F0D1C,
    'WeaponStatsFactory.<CreateTargets>b__6': 0x80F0D3C,
}
VA2NAME = dict(KNOWN)

def annotate(ins, adrp_page, reg_ptr):
    ann = []
    if ins.mnemonic == 'adrp':
        ops = ins.operands
        adrp_page[ins.reg_name(ops[0].reg)] = ops[1].imm
        reg_ptr.pop(ins.reg_name(ops[0].reg), None)
    elif ins.mnemonic == 'add' and len(ins.operands) == 3:
        d = ins.reg_name(ins.operands[0].reg)
        s = ins.reg_name(ins.operands[1].reg)
        if ins.operands[2].type == 2 and s in adrp_page:
            va = adrp_page[s] + ins.operands[2].imm
            reg_ptr[d] = va
            ann.append(f'-> va 0x{va:x}')
    elif ins.mnemonic == 'ldr' and ins.operands[0].type == 2 and ins.operands[1].type == 3:
        d = ins.reg_name(ins.operands[0].reg)
        base = ins.reg_name(ins.operands[1].mem.base)
        disp = ins.operands[1].mem.disp
        va = None
        if base in adrp_page:
            va = adrp_page[base] + disp
        elif base in reg_ptr:
            va = reg_ptr[base] + disp
        if va is not None:
            ann.append(f'-> va 0x{va:x}')
            if va in slotmap:
                fin, ch = resolve(va)
                nm = VA2NAME.get(fin) or (enclosing(fin)[1] if enclosing(fin)[0] else None)
                ann.append('RELA -> ' + ' -> '.join(f'0x{c:x}' for c in ch) + (f' <{nm}>' if nm else ''))
    elif ins.mnemonic == 'bl':
        t = ins.operands[0].imm
        nm = VA2NAME.get(t)
        if nm is None:
            ev = enclosing(t)
            nm = f'{ev[1]} @0x{t:x}' if ev[0] is not None else None
        ann.append(f'call 0x{t:x}' + (f' <{nm}>' if nm else ''))
    elif ins.mnemonic in ('b', 'b.ne', 'b.eq', 'b.lt', 'b.le', 'b.gt', 'b.ge', 'b.hi', 'b.ls',
                          'cbz', 'cbnz', 'tbz', 'tbnz'):
        if ins.operands and ins.operands[-1].type == 2:
            t = ins.operands[-1].imm
            nm = VA2NAME.get(t)
            if nm:
                ann.append(f'-> <{nm}>')
    return ann

def disasm_fn(name, va, out):
    off = va2off(va)
    size = extent(va)
    out.append(f'\n===== {name} =====')
    out.append(f'VA 0x{va:x}  file 0x{off:x}  body<=0x{size:x} bytes')
    adrp_page, reg_ptr = {}, {}
    n = 0
    for ins in md.disasm(data[off:off + size], va):
        ann = annotate(ins, adrp_page, reg_ptr)
        line = f'  0x{ins.address:x}: {ins.mnemonic:<8} {ins.op_str}'
        if ann:
            line += '   ; ' + ' '.join(ann)
        out.append(line)
        n += 1
        if ins.mnemonic == 'ret':
            break
        if n > 900:
            out.append('  ... (cap)')
            break

out = ['=' * 78,
       'WeaponType surface — follow-up scan (6.9.18): slot resolution, HasAiming,',
       'mine target list, AntiAirOnly static-mask writer',
       'binary: libil2cpp.so sha256 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5',
       '=' * 78]

# ---- 1. resolve the 7 method-pointer slots ----
out.append('\n----- 1. WeaponTarget method-pointer slots via .rela.dyn -----')
TARGETS = [
    ('Infantry=7',   713, 11681, 0x96EF918),
    ('LandForce=6',  709, 11680, 0x96EF920),
    ('Marine=4',     733, 11686, 0x96EF928),
    ('Submarine=5',  734, 11687, 0x96EF930),
    ('Bomber=1',     729, 11682, 0x96EF938),
    ('Fighter=2',    730, 11683, 0x96EF940),
    ('Helicopter=3', 731, 11684, 0x96EF948),
]
for tname, hint, neg, slot in TARGETS:
    if slot in slotmap:
        fin, ch = resolve(slot, depth=4)
        nm = VA2NAME.get(fin)
        if nm is None:
            ev = enclosing(fin)
            nm = f'{ev[1]} @0x{ev[0]:x}' if ev[0] else '?'
        out.append(f'  {tname:<14} slot 0x{slot:x} -> RELA chain ' +
                   ' -> '.join(f'0x{c:x}' for c in ch) + f'  == {nm}')
    else:
        out.append(f'  {tname:<14} slot 0x{slot:x} -> NO relative relocation (runtime-filled?)')

# ---- 2. HasAiming ----
out.append('\n----- 2. WeaponStatsFactory.HasAiming (predicate core) -----')
disasm_fn('WeaponStatsFactory.HasAiming', KNOWN['WeaponStatsFactory.HasAiming'], out)

# ---- 3. Mine target list ----
out.append('\n----- 3. MineStatsFactory.CreateTargets (bool-state ctor) -----')
disasm_fn('MineStatsFactory.CreateTargets', KNOWN['MineStatsFactory.CreateTargets'], out)

# ---- 4. ADRP scan for AntiAirOnly class slot 0x9677b98 ----
out.append('\n----- 4. writers/readers of the AntiAirOnly class slot 0x9677b98 -----')
PAGE = 0x9677000
words = np.frombuffer(data[:len(data) // 4 * 4], dtype=np.uint32)
op26 = (words >> np.uint32(26)) & np.uint32(0x3f)
# ADRP: bits31-24 pattern 1xx10000 -> (w>>24)&0x9F == 0x90
adrp_mask = (words >> np.uint32(24)) & np.uint32(0x9F)
adrp_idx = np.nonzero(adrp_mask == np.uint32(0x90))[0]
hits = []
seg_bounds = []
for po, pv, sz in segs:
    seg_bounds.append((po, po + sz, pv))
seg_bounds.sort()
import bisect as _bisect
_starts = [s[0] for s in seg_bounds]
def _off2va_fast(o):
    k = _bisect.bisect_right(_starts, o) - 1
    if k < 0:
        return None
    po, pend, pv = seg_bounds[k]
    return o - po + pv if o < pend else None
for i in adrp_idx:
    off_i = int(i) * 4
    va_i = _off2va_fast(off_i)
    if va_i is None:
        continue
    w = int(words[i])
    immlo = (w >> 29) & 0x3
    immhi = (w >> 5) & 0x7FFFF
    imm = (immhi << 2) | immlo
    if imm & 0x100000:
        imm -= 0x200000
    pc_page = va_i & ~0xFFF
    tgt_page = pc_page + (imm << 12)
    if tgt_page != PAGE:
        continue
    rd = w & 0x1F
    # look ahead up to 6 instrs for ldr x?, [xrd, #0xb98]
    for j in range(i + 1, min(i + 7, len(words))):
        w2 = int(words[j])
        # LDR (immediate, unsigned offset, 64-bit): 1111 1001 01 imm12 Rn Rt
        if (w2 & 0xFFC00000) == 0xF9400000:
            imm12 = ((w2 >> 10) & 0xFFF) * 8
            rn = (w2 >> 5) & 0x1F
            if rn == rd and imm12 == 0xB98:
                hits.append((off_i, int(j) * 4))
                break
out.append(f'{len(adrp_idx)} adrp instructions scanned; {len(hits)} adrp+ldr(0xb98) hits on page 0x{PAGE:x}')
for site, ldr in hits:
    sva = off2va(site)
    ev = enclosing(sva)
    out.append(f'  adrp@0x{sva:x} ldr@0x{off2va(ldr):x} in {ev[1]} (fn va 0x{ev[0]:x})' if ev[0]
               else f'  adrp@0x{sva:x}')

# disassemble every function that references the slot
seen = set()
for site, ldr in hits:
    sva = off2va(site)
    ev = enclosing(sva)
    if ev[0] and ev[0] not in seen:
        seen.add(ev[0])
        out.append(f'\n--- referencing fn: {ev[1]} (va 0x{ev[0]:x})')
        disasm_fn(ev[1], ev[0], out)

open(OUT, 'w').write('\n'.join(out))
print(f'\nwrote {OUT} ({len(out)} lines)')
