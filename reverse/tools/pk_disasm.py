#!/usr/bin/env python3
"""Build E core decode: AICommUnitsMove.$Pk(Battle, Unit) @0x490E864 (per-unit
order application — the attack path) + $CMA head @0x4909950. Full annotation."""
import struct, re, bisect
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

data = open('/home/z/my-project/aow3-work/native/libil2cpp.so', 'rb').read()
lines = open('/home/z/my-project/aow3-work/native/dump.cs').read().split('\n')
rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_starts, rva2name = [], {}
for i, l in enumerate(lines):
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0:
            fn_starts.append(rva)
            rva2name[rva] = lines[i + 1].strip()[:110]
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
      0x1078: 'set_TaskUntilTick'}
UF = {0x6A: 'task', 0x69: 'task_visual', 0xA0: 'flag_shoot', 0x9F: 'flag', 0x6B: 'state',
      0xB8: 'forced', 0x88: 'obj', 0x90: 'objPreferred', 0x98: 'obj_id', 0x9C: 'obj_close',
      0x9D: 'think', 0x9E: 'think_add', 0x104: 'task_until_tick', 0xA1: 'siege_stage',
      0xA4: 'siegeTick', 0x70: 'dest_x', 0x72: 'dest_y', 0x6C: 'obj_x', 0x6E: 'obj_y',
      0x40: 'un_type', 0x80: 'distance', 0x7C: 'undergo', 0xF0: 'last_action_tick',
      0x118: 'action_until_tick'}

def disasm_range(va, end, label, out):
    out.append(f'\n######## {label} @ 0x{va:x}..0x{end:x} ({end-va} bytes) ########')
    o = va2off(va)
    for ins in md.disasm(data[o:o + (end - va)], va):
        line = f'  0x{ins.address:x}: {ins.mnemonic:<8s} {ins.op_str}'
        if ins.mnemonic == 'bl':
            t = ins.operands[0].imm
            if t in rva2name:
                line += f'   ; -> {rva2name[t]}'
        if ins.mnemonic == 'adr':
            pass
        # vtable slot tags
        m = re.search(r'(ldr|ldp)\s+(x\d+), (x\d+)?,?\s*\[?(x\d+), #(0x[0-9a-f]+)\]?', line)
        if m:
            v = int(m.group(5), 16)
            if v in VT:
                line += f'   ; VT.{VT[v]}'
        m2 = re.search(r'(ldr|str|ldrsb|ldurb|sturb|stur|ldur|sturb)(s?)(b|h|w)?\s+\w+.*?(?:, #(0x[0-9a-f]+)\]|, #(\d+)\])', line)
        if m2:
            v = int(m2.group(4) or m2.group(5) or '0', 16)
            if v in UF:
                line += f'   ; UNIT.{UF[v]}'
        if any(k in line for k in ('cmp', 'tbz', 'tbnz', 'cbz', 'cbnz', 'sxtb', 'uxtb')):
            line += '   ; BR'
        out.append(line)

out = []
nxt = fn_starts[bisect.bisect_right(fn_starts, 0x490E864)]
disasm_range(0x490E864, nxt, 'AICommUnitsMove.$Pk(Battle, Unit) — per-unit order application', out)
nxt = fn_starts[bisect.bisect_right(fn_starts, 0x4909950)]
disasm_range(0x4909950, min(0x4909950 + 0x900, nxt), 'AICommUnitsMove.$CMA(Battle) — head 2.25KB', out)

open('/home/z/my-project/aow3-work/attack-pk-decode.txt', 'w').write('\n'.join(out) + '\n')
print('written attack-pk-decode.txt', len(out), 'lines')
