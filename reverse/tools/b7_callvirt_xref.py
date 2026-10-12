#!/usr/bin/env python3
"""B7 callvirt xref — Unit movement accessors via vtable slots (r7f method).

BL xref found ZERO direct callers of the Unit movement accessors (census shows
walk_state/dispersal are also accessed inline) — so wait_for_moving/forced traffic
rides CALLVIRT sites: ldr xK,[xR]; ldr xM,[xK,#(0x138+S*16)]; [ldr xT]; blr xM,
imm12 = 39 + 2*S. Slot map (dump.cs, Unit TypeDefIndex 11521):
  101 get_Forced   102 set_Forced     299 get_WaitForMoving  300 set_WaitForMoving
  301 get_WalkState 302 set_WalkState 262 get_NextXLogic
plus (from the ordered slot list) the remaining accessor slots are enumerated as
data. Sites attributed via script.json; arg-shape separation per r7f precedent.
"""
import json, struct, sys
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN
from collections import defaultdict

SLOTS = {
    101: 'Unit.get_Forced', 102: 'Unit.set_Forced',
    299: 'Unit.get_WaitForMoving', 300: 'Unit.set_WaitForMoving',
    301: 'Unit.get_WalkState', 302: 'Unit.set_WalkState',
    262: 'Unit.get_NextXLogic',
    48: 'Unit.?48', 49: 'Unit.?49', 50: 'Unit.?50', 51: 'Unit.?51',
    65: 'Unit.?65', 66: 'Unit.?66',
    144: 'Unit.?144', 145: 'Unit.?145', 146: 'Unit.?146', 147: 'Unit.?147',
    148: 'Unit.?148', 149: 'Unit.?149',
    183: 'Unit.?183', 184: 'Unit.?184', 189: 'Unit.?189', 190: 'Unit.?190',
    205: 'Unit.?205', 206: 'Unit.?206', 221: 'Unit.?221', 222: 'Unit.?222',
    225: 'Unit.?225', 226: 'Unit.?226', 227: 'Unit.?227', 228: 'Unit.?228',
    266: 'Unit.?266', 267: 'Unit.?267', 268: 'Unit.?268', 269: 'Unit.?269',
    270: 'Unit.?270', 271: 'Unit.?271',
}
# imm12 = 39 + 2*S
TARGETS = {39 + 2 * s: f'{n} (slot {s})' for s, n in SLOTS.items()}

SO = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/aow3-extract/libil2cpp.so'
SCRIPT = sys.argv[2] if len(sys.argv) > 2 else '/home/z/my-project/aow3-extract/icd-out/script.json'

names = {}
sj = json.load(open(SCRIPT))
for m in sj['ScriptMethod']:
    names[m['Address']] = m['Name']

data = np.fromfile(SO, dtype=np.uint8)
u32 = data.view(np.uint32)
tb = data.tobytes()
(e_phoff,) = struct.unpack_from('<Q', tb, 0x20)
(e_phentsize, e_phnum) = struct.unpack_from('<HH', tb, 0x36)
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type, p_flags = struct.unpack_from('<II', tb, base)
    p_offset, p_vaddr, _, p_filesz = struct.unpack_from('<QQQQ', tb, base + 8)
    if p_type == 1:
        segs.append((p_offset, p_vaddr, p_filesz, p_flags))

def off2va(o):
    for po, pv, fs, fl in segs:
        if po <= o < po + fs:
            return o - po + pv
    return None

def va2off(va):
    for po, pv, fs, fl in segs:
        if pv <= va < pv + fs:
            return va - pv + po
    return None

# function starts for attribution: use script.json addresses
fstarts = np.array(sorted(names.keys()), dtype=np.int64)
def fn_of(va):
    k = np.searchsorted(fstarts, va, side='right') - 1
    return int(fstarts[k]) if k >= 0 else 0

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)

# executable segment words only
for imm12, label in sorted(TARGETS.items()):
    # ldr xM,[xK,#imm12*8]: encoding bits: 1111100101 imm12 Rn Rt (64-bit unsigned imm)
    pat = ((0b1111100101 << 22) | (imm12 << 10))
    mask = (0b1111111111 << 22) | (0xFFF << 10)
    cand = np.nonzero((u32 & np.uint32(mask)) == np.uint32(pat))[0]
    good = []
    for ci in cand:
        site = off2va(int(ci) * 4)
        if site is None: continue
        # need blr within next 4 words using the loaded register
        fo = va2off(site)
        code = tb[fo:fo + 32]
        window = list(md.disasm(code, site))[:6]
        ldr_reg = None; ok = False
        for j, ins in enumerate(window):
            if ins.mnemonic == 'ldr' and j == 0:
                ldr_reg = ins.op_str.split(',')[0]
            if ins.mnemonic == 'blr' and ldr_reg and ins.op_str == ldr_reg:
                ok = True; break
        if ok:
            good.append(site)
    # attribute to functions
    fns = defaultdict(list)
    for s in good:
        fns[fn_of(s)].append(s)
    print(f'### {label}: imm12={imm12}, {len(good)} blr-chained site(s), {len(fns)} fn(s)')
    for f in sorted(fns):
        print(f'   fn 0x{f:X} {names.get(f, "?")}  (sites {len(fns[f])})')
    print()
