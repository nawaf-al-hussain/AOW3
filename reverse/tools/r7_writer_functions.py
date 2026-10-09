#!/usr/bin/env python3
"""R7 pass 3 — attribute sight_curr writers & sight getter call sites to dump.cs methods.

Uses the full dump.cs VA map (all classes) as function-start table; each hit address
is attributed to the enclosing method (bisect on sorted starts). For the enclosing
method of each hit, disassemble the whole function and dump annotated text for
sight-relevant accesses.
"""
import struct, re, os, bisect
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = os.environ.get('AOW3_SO',   '/home/z/my-project/aow3-re-work/lib/arm64-v8a/libil2cpp.so')
DUMP = os.environ.get('AOW3_DUMP', '/home/z/my-project/aow3-re-work/dump.cs')
OUT  = os.environ.get('AOW3_OUT',  'r7-writer-functions.txt')

HITS = [0x4597e60, 0x4597e68, 0x45b1a30, 0x45b1a60, 0x45b1a80,
        0x46344a4, 0x4634680, 0x4634ea4, 0x4634fcc, 0x4635114, 0x4636b10,
        0x46447c4, 0x46447cc, 0x46bb460, 0x46bb934, 0x46d9a98, 0x46dc7a0, 0x46dcf24]

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

class_re = re.compile(r'^\s*(?:\[[^\]]*\]\s*)*(?:public|internal|private)?\s*(?:abstract\s+|sealed\s+|static\s+|partial\s+)*class\s+([\w.$<>]+)')
rva_re   = re.compile(r'RVA:\s*0x([0-9A-Fa-f]+)\s+Offset:\s*0x([0-9A-Fa-f]+)\s+VA:\s*0x([0-9A-Fa-f]+)')
meth_re  = re.compile(r'^\s+(?:.*\s)?(\$?[\w<>.$]+)\s*\(')
starts = []  # (va, name)
cur, pending = None, None
for ln in open(DUMP, 'r', errors='replace'):
    m = class_re.match(ln)
    if m:
        cur = m.group(1)
        continue
    m = rva_re.search(ln)
    if m:
        pending = int(m.group(3), 16)
        continue
    if cur and pending and ln.startswith('	') and '(' in ln:
        mm = meth_re.match(ln)
        if mm:
            starts.append((pending, f'{cur}.{mm.group(1)}'))
            pending = None
starts.sort()
SVA = [v for v, _ in starts]
print(f'{len(starts)} methods mapped')

def enclosing(va):
    i = bisect.bisect_right(SVA, va) - 1
    if i >= 0 and va - SVA[i] < 0x4000:
        return starts[i]
    return (None, '?')

VA2NAME_map = dict(starts)
md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
TAG = {0xBC: 'sight_curr', 0x4C: 'UnitState.sight?', 0x50: 'sight_init?/next_x?',
       0x5C: 'radar?/walk_dx?', 0x70: 'invisible?/dest_x?', 0x18: 'Dynamic.side',
       0x20: 'Dynamic.alliance', 0x48: 'Unit.x', 0x4A: 'Unit.y', 0x6A: 'Unit.task'}

seen_fns = {}
with open(OUT, 'w') as out:
    out.write('R7 pass 3 — enclosing-function attribution of sight_curr accesses\n')
    for h in HITS:
        fva, fname = enclosing(h)
        out.write(f'\n== hit 0x{h:x} in {fname} (fn 0x{fva:x} if named)\n')
        if fva is None or fva in seen_fns:
            continue
        seen_fns[fva] = fname
    # full dump of unique functions
    for fva, fname in seen_fns.items():
        if fva is None:
            continue
        i = SVA.index(fva)
        end = SVA[i + 1] if i + 1 < len(SVA) else fva + 0x800
        size = min(end - fva, 0x2000)
        off = va2off(fva)
        out.write(f'\n===== {fname}  0x{fva:x}..0x{end:x} =====\n')
        for ins in md.disasm(data[off:off + size], fva):
            txt = f'  {ins.address:x}  {ins.mnemonic:<8} {ins.op_str}'
            m = re.search(r'\[(x\d+|sp),?\s*#?(0x[0-9a-f]+|\d+)\]', ins.op_str)
            if m and ins.mnemonic.startswith(('l', 's')):
                imm = int(m.group(2), 0) if m.group(2).startswith('0x') else int(m.group(2))
                if imm in TAG:
                    txt += f'  ; {TAG[imm]}'
            if ins.mnemonic == 'bl':
                t = ins.op_str.lstrip('#')
                try:
                    txt += f'  -> {VA2NAME_map.get(int(t,16), "0x"+t)}'
                except Exception:
                    pass
            out.write(txt + '\n')
print(f'wrote {OUT}; unique functions: {len(seen_fns)}')
