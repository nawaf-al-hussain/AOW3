#!/usr/bin/env python3
"""Build F — decode $xh(Battle,Unit) @0x488B9FC and $mG(Battle,Unit) @0x48609D4
(the siege stage machine + tick progression)."""
import struct, re
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

data = open('/home/z/my-project/aow3-work/native/libil2cpp.so', 'rb').read()
fl = open('/home/z/my-project/aow3-work/native/dump.cs').read().splitlines()
rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_starts, rva2name = [], {}
for i, l in enumerate(fl):
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0:
            fn_starts.append(rva)
            rva2name[rva] = fl[i + 1].strip()[:110]
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
VT = {0x418: 'get_TickFromSpec', 0x448: 'get_TickToSpec', 0x3B8: 'get_Spec', 0x4D8: 'get_Type',
      0xDC8: 'get_SiegeStage', 0xDD8: 'set_SiegeStage', 0xDF8: 'get_SiegeTick?', 0xE10: 'set_SiegeTick?',
      0xE28: 'get_SiegeAfterWalkTick', 0xE40: 'set_SiegeAfterWalkTick', 0xE58: 'get_SiegeBlocked',
      0xE70: 'set_SiegeBlocked', 0x1008: 'get_Task', 0x1018: 'set_Task', 0x258: 'get_FlagShoot',
      0x268: 'set_FlagShoot', 0x810: 'get_Obj', 0x820: 'set_Obj', 0x378: 'get_Forced', 0x388: 'set_Forced'}
UF = {0xA1: 'siege_stage', 0xA4: 'siegeTick', 0xA8: 'siegeAfterWalkTick', 0x1C4: 'siege_blocked',
      0x6A: 'task', 0x69: 'task_visual', 0xA0: 'flag_shoot', 0x6B: 'state', 0xB8: 'forced',
      0x88: 'obj', 0x90: 'objPreferred', 0x48: 'un_type', 0x70: 'dest_x', 0x72: 'dest_y',
      0xE4: 'walk_state', 0xE8: 'walk_state_tick', 0xF0: 'last_action_tick', 0x118: 'action_until_tick',
      0x58: 'walkCrossFlag', 0xB2: 'energy', 0x7C: 'undergo', 0x80: 'distance', 0xBC: 'sight_curr',
      0x104: 'task_until_tick'}

def disasm(va, end, label, out):
    out.append(f'\n######## {label} @ 0x{va:x}..0x{end:x} ({end-va} B) ########')
    o = va2off(va)
    for ins in md.disasm(data[o:o + (end - va)], va):
        line = f'  0x{ins.address:x}: {ins.mnemonic:<8s} {ins.op_str}'
        if ins.mnemonic == 'bl':
            t = ins.operands[0].imm
            if t in rva2name:
                line += f'   ; -> {rva2name[t]}'
        if ins.mnemonic in ('ldr', 'ldp', 'str', 'stur', 'ldur', 'strb', 'ldrsb', 'ldrb', 'ldurb', 'sturb'):
            m = re.search(r'#(0x[0-9a-f]+)\]?', line)
            if m:
                v = int(m.group(1), 16)
                if v in VT:
                    line += f'   ; VT.{VT[v]}'
                elif v in UF:
                    line += f'   ; UNIT.{UF[v]}'
        if any(k in line for k in ('cmp', 'tbz', 'tbnz', 'cbz', 'cbnz', 'cset', 'csel', 'sxtb', 'uxtb', 'mul', 'sdiv', 'madd', 'scvtf', 'ucvtf', 'fmov', 'fdiv', 'fmul', 'fadd')):
            line += '   ; BR'
        out.append(line)

out = []
import bisect
def nxt(va):
    i = bisect.bisect_right(fn_starts, va)
    return fn_starts[i] if i < len(fn_starts) else va + 0x800

xh_end = nxt(0x488B9FC)
disasm(0x488B9FC, xh_end, '$xh(Battle, Unit) — siege stage machine?', out)
mg_end = nxt(0x48609D4)
disasm(0x48609D4, min(mg_end, 0x48609D4 + 0x1000), '$mG(Battle, Unit) head 2.25KB — siegeTick progression?', out)
open('/home/z/my-project/aow3-work/siege-xh-mg-decode.txt', 'w').write('\n'.join(out) + '\n')
print('written siege-xh-mg-decode.txt', len(out), 'lines; $xh', xh_end - 0x488B9FC, 'B; $mG', mg_end - 0x48609D4, 'B')
