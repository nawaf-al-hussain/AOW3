#!/usr/bin/env python3
"""Build J part 2c — predecessors of the $Pg join blocks that write the band:
   w23 -> w20 -> band @0x48463e0;  w9 -> w21 -> band @0x4846440;
   w20 -> w21 -> band @0x484677c. Plus 0x4846348..0x4846388 window."""
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
OUT = '/home/z/my-project/aow3-work/band-dataflow-3.txt'
o = open(OUT, 'w')


def P(*a):
    s = ' '.join(str(x) for x in a)
    print(s)
    o.write(s + '\n')


PG_VA, PG_END = 0x483C244, 0x48470D0
off = m.va2off(PG_VA)
ins_list = list(md.disasm(so_b[off:off + (PG_END - PG_VA)], PG_VA))
addr2idx = {ins.address: i for i, ins in enumerate(ins_list)}

TARGETS = (0x48463ec, 0x48466e8, 0x48466f8, 0x4846774, 0x484677c, 0x48463e0,
           0x4846440, 0x4842350, 0x48422ec)
P('=== branches into join blocks ===')
for i, ins in enumerate(ins_list):
    if ins.mnemonic.startswith('b') and ins.op_str.startswith('#'):
        t = int(ins.op_str[1:], 16)
        if t in TARGETS:
            P('  %#x  %-7s -> %#x' % (ins.address, ins.mnemonic, t))
P('')


def dis(va, n, label=''):
    P('-- %s (%#x +0x%x) --' % (label, va, n))
    o2 = m.va2off(va)
    for ins in md.disasm(so_b[o2:o2 + n], va):
        line = '%08x  %-8s %s' % (ins.address, ins.mnemonic, ins.op_str)
        if ins.mnemonic in ('bl',) and ins.op_str.startswith('#'):
            t = int(ins.op_str[1:], 16)
            line += '   ; -> ' + sym.get(t, '%#x' % t)
        P(line)
    P('')


dis(0x4846348, 0x40, 'w23 def hunt (pre store #14 chain)')
dis(0x4846240, 0xF0, 'predecessor region before 0x4846320 (band-14 chain)')
dis(0x4846100, 0x140, 'further predecessor region')
dis(0x48465E0, 0x110, 'predecessor region before 0x48466e8 (band-17 chain)')
dis(0x4846480, 0x170, 'between #15 and #17: decrypt arms + $yG prep')
dis(0x4846790, 0x120, 'after #17: $UG call + band reads')
