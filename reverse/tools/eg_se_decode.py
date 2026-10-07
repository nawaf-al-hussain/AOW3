#!/usr/bin/env python3
"""Build E decode pack: $eg (fire predicate), $se, AICommUnitsSpec.$CMA,
AICommUnitsMove set_Task/set_FlagShoot windows."""
import struct, re, bisect
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
fn_starts = sorted(set(fn_starts))
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
VT = {0x258: 'get_FlagShoot', 0x268: 'set_FlagShoot', 0x378: 'get_Forced', 0x388: 'set_Forced',
      0x810: 'get_Obj', 0x820: 'set_Obj', 0x1008: 'get_Task', 0x1018: 'set_Task',
      0x1038: 'get_TaskVisual', 0x1048: 'set_TaskVisual', 0x1068: 'get_TaskUntilTick',
      0x1078: 'set_TaskUntilTick', 0x1128: 'get_Type(u)', 0x1f8: 'get_id(Dyn)',
      0x998: 'v998', 0x1b8: 'v1b8'}
UF = {0x6A: 'task', 0x69: 'task_visual', 0xA0: 'flag_shoot', 0x9F: 'flag', 0x6B: 'state',
      0xB8: 'forced(u)', 0x88: 'obj', 0x90: 'objPreferred', 0x98: 'obj_id', 0x9C: 'obj_close',
      0x104: 'task_until_tick', 0xA1: 'siege_stage', 0xA4: 'siegeTick', 0xF0: 'last_action_tick',
      0x118: 'action_until_tick', 0x7C: 'undergo', 0x80: 'distance', 0xBC: 'sight_curr'}

def disasm_range(va, end, label, out):
    out.append(f'\n######## {label} @ 0x{va:x}..0x{end:x} ({end-va} B) ########')
    o = va2off(va)
    for ins in md.disasm(data[o:o + (end - va)], va):
        line = f'  0x{ins.address:x}: {ins.mnemonic:<8s} {ins.op_str}'
        if ins.mnemonic == 'bl':
            t = ins.operands[0].imm
            if t in rva2name:
                line += f'   ; -> {rva2name[t]}'
        if ins.mnemonic in ('ldr', 'ldp', 'str', 'stur', 'ldur', 'sturb', 'ldurb', 'strb', 'ldrsb', 'ldurb'):
            m = re.search(r'#(0x[0-9a-f]+)$', line)
            if m:
                v = int(m.group(1), 16)
                if v in VT:
                    line += f'   ; VT.{VT[v]}'
                elif v in UF:
                    line += f'   ; UNIT.{UF[v]}'
        if any(k in line for k in ('cmp', 'tbz', 'tbnz', 'cbz', 'cbnz', 'sxtb', 'uxtb', 'cset', 'csel')):
            line += '   ; BR'
        out.append(line)

out = []
def nxt_of(va):
    i = bisect.bisect_right(fn_starts, va)
    return fn_starts[i] if i < len(fn_starts) else va + 0x800

# 1. $eg(Battle, Unit) bool
nxt = nxt_of(0x482A4E0)
disasm_range(0x482A4E0, nxt, '$eg(Battle, Unit) bool — fire predicate?', out)
# 2. $se(Battle, Unit)
nxt = nxt_of(0x475757C)
disasm_range(0x475757C, nxt, '$se(Battle, Unit)', out)
# 3. AICommUnitsSpec class full (0x49130c8..0x4913eb0)
disasm_range(0x49130C8, 0x4913EB0, 'AICommUnitsSpec methods ($CMA etc.)', out)
open('/home/z/my-project/aow3-work/attack-eg-se-spec.txt', 'w').write('\n'.join(out) + '\n')
print('written attack-eg-se-spec.txt', len(out), 'lines')
