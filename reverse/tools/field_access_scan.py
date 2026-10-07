#!/usr/bin/env python3
"""Field-access scan for Phase 5 adjacent unknowns (6.9.18 libil2cpp.so).

ARM64 unsigned-offset LDR/STR word patterns over Unit fields:
  task_until_tick // 0x104 (int)   -> STR/LDR w, [x, #0x104]
  patrol_defend    // 0x158 (ref)  -> LDR/STR x, [x, #0x158]
  sameSpeed        // 0x260 (ref)  -> LDR/STR x, [x, #0x260]
  siegeTick        // 0xA4  (int)  -> STR/LDR w, [x, #0xA4]
  siege_stage      // 0xA1  (sbyte)-> LDRSB/STRB w, [x, #0xA1]
plus vtable-pair loads for the binary slots observed in GAICommandSpecMode.execute:
  0xD38 (set_PatrolDefend) / 0xD28 (get_PatrolDefend)
  0x1008 (get_Task) etc. for cross-checking.

Also disassembles each hit's enclosing neighborhood to attribute semantics.
"""
import struct, re, sys, hashlib
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-work/so/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/dump.cs'
OUT = '/home/z/my-project/aow3-work/field-scan.txt'

data = open(SO, 'rb').read()
sha_so = hashlib.sha256(data).hexdigest()
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_phentsize, e_phnum) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_phnum):
    b = e_phoff + i * e_phentsize
    pt = struct.unpack_from('<I', data, b)[0]
    po, pv = struct.unpack_from('<QQ', data, b + 8)[:2]
    fs = struct.unpack_from('<Q', data, b + 32)[0]
    if pt == 1:
        segs.append((po, pv, fs))

def va2off(va):
    for po, pv, fs in segs:
        if pv <= va < pv + fs:
            return va - pv + po
    return None

lines = open(DUMP).read().split('\n')
allpat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
rva2name = {}
for i, l in enumerate(lines):
    m = allpat.match(l.strip())
    if m:
        rva2name[int(m.group(1), 16)] = lines[i + 1].strip()[:100]

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

def decode(w):
    """decode unsigned-offset load/store -> (kind, imm12, is64) or None"""
    op = w >> 22
    imm12 = (w >> 10) & 0xFFF
    size = (w >> 30) & 3
    V = (w >> 26) & 1
    if V:
        return None
    if op == 0b1111100100:  # STR imm unsigned
        return ('STR', imm12 << ((size) and 2 or 0) if False else imm12, size)
    if op == 0b1111100101:  # LDR imm unsigned
        return ('LDR', imm12, size)
    if op == 0b0011100100:  # STRB
        return ('STRB', imm12, 0)
    if op == 0b0011100101:  # LDRB
        return ('LDRB', imm12, 0)
    if op == 0b1001100100 or op == 0b1001100101 or op == 0b0011100010 or op == 0b0011100011:
        return None
    return None

def scale(kind, size):
    return 4 if (kind in ('STR', 'LDR') and size == 2) else (8 if (kind in ('STR', 'LDR') and size == 3) else (2 if (kind in ('STR','LDR') and size==1) else 1))

# targets: field offsets of interest
FIELD_TARGETS = {
    0x104: 'task_until_tick', 0x158: 'patrol_defend', 0x260: 'sameSpeed',
    0xA4: 'siegeTick', 0x258: 'units_to_follow', 0x150: 'patrol',
    0x1C4: 'siege_blocked', 0x268: 'takePosition', 0xA1: 'siege_stage',
}
# vtable slot byte offsets (binary) observed/derived
VT_TARGETS = {
    0xD38: 'vt set_PatrolDefend', 0xD28: 'vt get_PatrolDefend',
    0x1008: 'vt get_Task', 0x798: 'vt set_Forced(?)', 0x8E8: 'vt life-alive',
    0xF28: 'vt speed/state', 0x368: 'vt get_UnType(?)', 0xAB8: 'vt set_Obj(null)',
    0x4B8: 'vt caravan/bool-set', 0x6A8: 'vt flag-check(0x20)', 0x748: 'vt getter-obj',
    0xE78: 'vt setter-0', 0x688: 'vt flag-set(0x20)', 0x608: 'vt short-getter',
    0xED8: 'vt bool-setter', 0xE08: 'vt Battle A', 0xD78: 'vt setter-0 B',
}

hits = {}   # (label) -> list of va
for po, pv, fs in segs:
    code = data[po:po + fs]
    for off in range(0, len(code) - 3, 4):
        w = code[off] | (code[off+1] << 8) | (code[off+2] << 16) | (code[off+3] << 24)
        d = decode(w)
        if not d:
            continue
        kind, imm, size = d
        if kind in ('STR', 'LDR'):
            if size == 2:      # 32-bit
                fo = imm * 4
                if fo in (0x104, 0xA4):
                    hits.setdefault(f'{kind}w [{fo:#x}] {FIELD_TARGETS[fo]}', []).append(pv + off)
            elif size == 3:    # 64-bit
                fo = imm * 8
                if fo in (0x158, 0x260, 0x150, 0x258, 0x268):
                    hits.setdefault(f'{kind}x [{fo:#x}] {FIELD_TARGETS[fo]}', []).append(pv + off)
        elif kind in ('STRB', 'LDRB'):
            fo = imm
            if fo in (0xA1, 0x1C4):
                hits.setdefault(f'{kind} [{fo:#x}] {FIELD_TARGETS[fo]}', []).append(pv + off)
    # vtable slots
    for off in range(0, len(code) - 3, 4):
        w = code[off] | (code[off+1] << 8) | (code[off+2] << 16) | (code[off+3] << 24)
        if (w >> 22) == 0b1111100101:  # LDR x, [x, #imm]
            imm = ((w >> 10) & 0xFFF) * 8
            if imm in VT_TARGETS:
                hits.setdefault(f'{VT_TARGETS[imm]} [ldrx #{imm:#x}]', []).append(pv + off)

out = ['AOW3 6.9.18 field/vtable-slot access scan', f'sha256 {sha_so}']
for k in sorted(hits, key=lambda k: -len(hits[k])):
    vs = hits[k]
    out.append(f'\n== {k}: {len(vs)} hit(s) ==')
    for v in vs[:40]:
        out.append(f'   0x{v:x}')

# context for the most interesting: patrol_defend readers, task_until_tick writers, sameSpeed
def ctx(va, back=0x30, fwd=0x50):
    start = va - back
    o = va2off(start)
    res = []
    for ins in md.disasm(data[o:o + back + fwd], start):
        mark = ' >>>' if ins.address <= va < ins.address + 4 else '    '
        line = f'  {mark} 0x{ins.address:x}: {ins.mnemonic:<8} {ins.op_str}'
        if ins.mnemonic in ('bl', 'b') and ins.operands and ins.operands[0].type == 2:
            t = ins.operands[0].imm
            if t in rva2name:
                line += f'   -> {rva2name[t]}'
        res.append(line)
    return res

SHOW = [k for k in hits if ('patrol_defend' in k or 'task_until_tick' in k or 'sameSpeed' in k or 'siegeTick' in k or 'get_PatrolDefend' in k)]
out.append('\n\n== contexts ==')
for k in SHOW:
    for v in hits[k][:6]:
        out.append(f'\n--- {k} @ 0x{v:x} ---')
        out += ctx(v)

open(OUT, 'w').write('\n'.join(out) + '\n')
print(f'wrote {OUT}')
for k in sorted(hits, key=lambda k: -len(hits[k])):
    print(f'{k}: {len(hits[k])}')
