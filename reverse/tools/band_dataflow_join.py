#!/usr/bin/env python3
"""Build J part 2b — resolve the ambiguous band stores (#14/#15/#17), the
stack[0x164] local, and the ctor/getter context around the $UG callsites."""
import importlib.util
import re

from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

spec = importlib.util.spec_from_file_location(
    'm', '/home/z/my-project/scripts/pg_takepos_decode.py')
m = importlib.util.module_from_spec(spec)
src = open('/home/z/my-project/scripts/pg_takepos_decode.py').read().replace(
    "if __name__ == '__main__':", 'if False:')
exec(compile(src, 'm', 'exec'), m.__dict__)

so_b = open('/home/z/my-project/aow3-work/native/libil2cpp.so', 'rb').read()
m.load_so()
sym, _ = m.build_symbol_map()
md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
OUT = '/home/z/my-project/aow3-work/band-dataflow-2.txt'
o = open(OUT, 'w')


def P(*a):
    s = ' '.join(str(x) for x in a)
    print(s)
    o.write(s + '\n')


def dis(va, n, label=''):
    P('-- %s (%#x +0x%x) --' % (label, va, n))
    off = m.va2off(va)
    for ins in md.disasm(so_b[off:off + n], va):
        line = '%08x  %-8s %s' % (ins.address, ins.mnemonic, ins.op_str)
        if ins.mnemonic in ('bl',) and ins.op_str.startswith('#'):
            t = int(ins.op_str[1:], 16)
            line += '   ; -> ' + sym.get(t, '%#x' % t)
        P(line)
    P('')


# 1. who writes stack[0x164]? scan $Pg
PG_VA, PG_END = 0x483C244, 0x48470D0
off = m.va2off(PG_VA)
ins_list = list(md.disasm(so_b[off:off + (PG_END - PG_VA)], PG_VA))
P('=== stores to [sp, #0x164] ===')
st164 = re.compile(r'^[wx]\d+, \[sp(?:, #0x([0-9a-f]+))?\]$')
for i, ins in enumerate(ins_list):
    if ins.mnemonic in ('str', 'stur'):
        mm = st164.match(ins.op_str)
        if mm and mm.group(1) == '164':
            P('  %#x  %s %s' % (ins.address, ins.mnemonic, ins.op_str))
            for j in range(max(0, i - 8), i):
                ci = ins_list[j]
                P('      %08x  %-7s %s' % (ci.address, ci.mnemonic, ci.op_str))
P('')

# 2. windows around the three ambiguous sites
dis(0x4846380, 0xD0, 'window before band store #14 @0x48463e0 (mov w20, w23)')
dis(0x4846320, 0x30, 'statics load context for #15')
dis(0x48463E0, 0x80, 'store #14 + #15 region')
dis(0x48466E0, 0xB0, 'window around store #17 @0x484677c (mov w21, w20)')
dis(0x48469C0, 0x140, 'region after #17: the $UG/$yG call cluster tail')

# 3. ctor 0x4594abc identity + call sites of both coordinate ctors in $Pg
P('=== Coordinate ctor candidates ===')
for va in (0x4593100, 0x4594abc):
    P('sym[%#x] = %s' % (va, sym.get(va, '??')))
P('')
P('=== bl sites to 0x4593100 / 0x4594abc inside $Pg ===')
import struct
import numpy as np
for po, pv, fs in m.segs:
    if fs < 0x1000:
        continue
    words = np.frombuffer(so_b, dtype='<u4', count=fs // 4, offset=po)
    is_bl = (words & 0xFC000000) == 0x94000000
    idx = np.nonzero(is_bl)[0]
    if not len(idx):
        continue
    imm = words[idx].astype(np.int64) & 0x3FFFFFF
    imm = np.where(imm & 0x2000000, imm - 0x4000000, imm)
    tgts = (pv + idx * 4 + imm * 4) & 0xFFFFFFFF
    for i, t in zip(idx, tgts):
        if int(t) in (0x4593100, 0x4594abc) and 0x483C244 <= pv + int(i) * 4 < 0x48470D0:
            P('  bl %#x -> %#x' % (pv + int(i) * 4, int(t)))
P('')

# 4. disasm around the two ctor call sites in $Pg
dis(0x483FFB0, 0x100, '$Pg ctor call @0x4840068 (0x4594abc) full window')
dis(0x4842240, 0x100, '$Pg region of store #9/#10 (cmp + band stores)')
