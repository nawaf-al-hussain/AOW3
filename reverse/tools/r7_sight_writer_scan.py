#!/usr/bin/env python3
"""R7 pass 2 — sight consumer census + sight_curr writer attribution (6.9.18).

1. Binary-wide BL-target scan: who calls UnitStateType.get_Sight (0x45B362C),
   get_Radar (0x45B35FC), get_Invisible (0x45B356C), plus the Unit sight_curr
   accessors when resolvable from dump.cs.
2. Unsigned-offset STR/LDR scan at Unit.sight_curr #0xBC inside the battle-core
   code range, with neighborhood attribution (nearest preceding BL target).
3. Also census BLs to FogOpener consumers / FogAct siblings from outside FogAct.

Outputs r7-sight-writers.txt (census + annotated neighborhoods).
"""
import struct, re, os
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = os.environ.get('AOW3_SO',   '/home/z/my-project/aow3-re-work/lib/arm64-v8a/libil2cpp.so')
DUMP = os.environ.get('AOW3_DUMP', '/home/z/my-project/aow3-re-work/dump.cs')
OUT  = os.environ.get('AOW3_OUT',  'r7-sight-writers.txt')

data = open(SO, 'rb').read()
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    b = e_phoff + i * e_phentsize
    p_type, = struct.unpack_from('<I', data, b)
    p_offset, p_vaddr, _, p_filesz = struct.unpack_from('<QQQQ', data, b + 8)
    if p_type == 1:
        segs.append((p_offset, p_vaddr, p_filesz))

def va2off(va):
    for po, pv, sz in segs:
        if pv <= va < pv + sz:
            return va - pv + po
    return None

# text segment bounds (largest executable PT_LOAD)
TEXT = max(segs, key=lambda s: s[2])

# ---- VA -> name map from dump.cs (all classes; first match wins per VA) ----
class_re = re.compile(r'^\s*(?:\[[^\]]*\]\s*)*(?:public|internal|private)?\s*(?:abstract\s+|sealed\s+|static\s+|partial\s+)*class\s+([\w.$<>]+)')
rva_re   = re.compile(r'RVA:\s*0x([0-9A-Fa-f]+)\s+Offset:\s*0x([0-9A-Fa-f]+)\s+VA:\s*0x([0-9A-Fa-f]+)')
meth_re  = re.compile(r'^\s+(?:.*\s)?(\$?[\w<>.$]+)\s*\([^;]*\)\s*\{\s*\}?|^\s+(?:.*\s)?(\$?[\w<>.$]+)\s*\([^;]*\);\s*$')
VA2NAME = {}
cur = None
for ln in open(DUMP, 'r', errors='replace'):
    m = class_re.match(ln)
    if m:
        cur = m.group(1)
        continue
    m = rva_re.search(ln)
    if m:
        va = int(m.group(3), 16)
        pending = va
        continue
    if 'cur' in dir() and cur and ln.startswith('	') and '(' in ln and 'RVA' not in ln:
        mm = meth_re.match(ln)
        if mm and 'pending' in dir() and pending:
            nm = mm.group(1) or mm.group(2)
            if nm and not nm.startswith(('get_', 'set_')) or True:
                VA2NAME.setdefault(pending, f'{cur}.{nm}')
            pending = None

TARGETS = {
    0x45B362C: 'UnitStateType.get_Sight',
    0x45B35FC: 'UnitStateType.get_Radar',
    0x45B356C: 'UnitStateType.get_Invisible',
}
for va, nm in VA2NAME.items():
    if 'get_Sight' in nm or 'get_Radar' in nm or 'get_Invisible' in nm or 'sight_curr' in nm.lower():
        TARGETS.setdefault(va, nm)
print('BL scan targets:', {hex(k): v for k, v in TARGETS.items()})

# ---- pass 1: BL census over text ----
t_off, t_va, t_sz = TEXT
calls = {va: [] for va in TARGETS}
sight_curr_hits = []  # (va, kind 'str'/'ldr', width)
md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = False

# BL encoding: 0x94000000 | imm26 (imm26 in words); also BLR skipped
code = data[t_off:t_off + t_sz]
base = t_va
# iterate every 4 bytes; decode only BL/STR/LDR candidates for speed
import ctypes
def s26(x):
    return x - (1 << 26) if x & (1 << 25) else x
n_words = len(code) // 4
for i in range(n_words):
    w = struct.unpack_from('<I', code, i * 4)[0]
    op = w >> 24
    if (w & 0xFC000000) == 0x94000000:  # BL
        imm = s26(w & 0x03FFFFFF)
        tgt = base + i * 4 + imm * 4
        if tgt in calls:
            calls[tgt].append(base + i * 4)
    elif (w & 0xFFC00000) in (0xB9000000, 0xB9400000, 0x39000000, 0x39400000,
                              0x79000000, 0x79400000, 0xB9800000):
        # STR/LDR unsigned imm: size/bits vary; extract imm12
        imm12 = (w >> 10) & 0xFFF
        size = (w >> 30) & 3
        scale = size if ((w >> 22) & 3) != 0 or True else 0
        # scale by size field (00=byte,01=half,10=word,11=qword)
        off = imm12 << size
        if off == 0xBC:
            kind = 'str' if (w & 0x00400000) == 0 else 'ldr'
            width = {0: 'b', 1: 'h', 2: 'w', 3: 'x'}[size]
            sight_curr_hits.append((base + i * 4, kind, width))

print(f'BL census done: {[ (hex(k), len(v)) for k, v in calls.items() ]}')
print(f'#0xBC unsigned-offset hits: {len(sight_curr_hits)}')

# ---- neighborhood attribution ----
def attribute(va, span=64):
    """disassemble backwards as best effort: linear from va-span, collect BLs"""
    off = va2off(va - span * 4)
    if off is None:
        return []
    found = []
    for ins in md.disasm(data[off:off + span * 4 + 4], va - span * 4):
        if ins.mnemonic == 'bl':
            t = int(ins.op_str.lstrip('#'), 16)
            if t in VA2NAME:
                found.append(VA2NAME[t])
    return found

with open(OUT, 'w') as out:
    out.write('R7 sight consumer census — 6.9.18 (libil2cpp.so 8ace05bb…)\n\n')
    for va, name in sorted(TARGETS.items()):
        callers = calls[va]
        out.write(f'== {name} @0x{va:x}: {len(callers)} BL callers\n')
        for c in callers[:200]:
            attrs = attribute(c)
            out.write(f'   call site 0x{c:x}  ctx: {", ".join(attrs[-4:]) or "?"}\n')
    out.write(f'\n== #0xBC (Unit.sight_curr) unsigned-offset accesses: {len(sight_curr_hits)}\n')
    for va, kind, width in sight_curr_hits[:400]:
        attrs = attribute(va)
        out.write(f'   0x{va:x} {kind}{width} [x,#0xBC]  ctx: {", ".join(attrs[-4:]) or "?"}\n')
print(f'wrote {OUT}')
