#!/usr/bin/env python3
"""Build F — full annotation trace of $ce(Battle, Unit) @0x47501F0 (siege sim driver).
Goal: the exact per-stage tick progression — where siege_stage advances, how
tick_to_spec/tick_from_spec divide across SEIZE_FIRE/ROTATE_WEAPONS/TRANSFORM."""
import struct, re
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

data = open('/home/z/my-project/aow3-work/native/libil2cpp.so', 'rb').read()
fl = open('/home/z/my-project/aow3-work/native/dump.cs').read().split('\n')
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
      0xDC8: 'get_SiegeStage', 0xDE0: 'set_SiegeStage', 0xDF8: 'get_SiegeTick', 0xE10: 'set_SiegeTick',
      0xE28: 'get_SiegeAfterWalkTick', 0xE40: 'set_SiegeAfterWalkTick', 0xE58: 'get_SiegeBlocked',
      0xE70: 'set_SiegeBlocked', 0x1008: 'get_Task', 0x1018: 'set_Task', 0x258: 'get_FlagShoot',
      0x268: 'set_FlagShoot', 0x810: 'get_Obj', 0x820: 'set_Obj', 0x378: 'get_Forced', 0x388: 'set_Forced',
      0x1068: 'get_TaskUntilTick', 0x1038: 'get_TaskVisual'}
UF = {0xA1: 'siege_stage', 0xA4: 'siegeTick', 0xA8: 'siegeAfterWalkTick', 0x1C4: 'siege_blocked',
      0x6A: 'task', 0x69: 'task_visual', 0xA0: 'flag_shoot', 0x6B: 'state', 0xB8: 'forced',
      0x88: 'obj', 0x90: 'objPreferred', 0x9D: 'think', 0x9E: 'think_add', 0x9F: 'flag',
      0x104: 'task_until_tick', 0xB2: 'energy', 0xE4: 'walk_state', 0xE8: 'walk_state_tick',
      0xF0: 'last_action_tick', 0x118: 'action_until_tick', 0x58: 'walkCrossFlag'}

LO, HI = 0x47501F0, 0x47553CC
out = [f'######## $ce(Battle, Unit) @ 0x{LO:x}..0x{HI:x} ({HI-LO} bytes) — full trace ########']
o = va2off(LO)
for ins in md.disasm(data[o:o + (HI - LO)], LO):
    line = f'  0x{ins.address:x}: {ins.mnemonic:<8s} {ins.op_str}'
    if ins.mnemonic == 'bl':
        t = ins.operands[0].imm
        if t in rva2name:
            line += f'   ; -> {rva2name[t]}'
    if ins.mnemonic in ('ldr', 'ldp', 'str', 'stur', 'ldur', 'strb', 'ldrsb', 'ldrb', 'ldurb', 'sturb', 'strh', 'ldurh'):
        m = re.search(r'#(0x[0-9a-f]+)\]?', line)
        if m:
            v = int(m.group(1), 16)
            if v in VT:
                line += f'   ; VT.{VT[v]}'
            elif v in UF:
                line += f'   ; UNIT.{UF[v]}'
    if any(k in line for k in ('cmp', 'tbz', 'tbnz', 'cbz', 'cbnz', 'cset', 'csel', 'sxtb', 'uxtb', 'madd', 'msub', 'mul', 'sdiv', 'udiv')):
        line += '   ; BR'
    out.append(line)

open('/home/z/my-project/aow3-work/siege-ce-full-trace.txt', 'w').write('\n'.join(out) + '\n')
print('written siege-ce-full-trace.txt', len(out), 'lines')
