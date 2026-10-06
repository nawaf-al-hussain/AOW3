#!/usr/bin/env python3
"""Native disassembly of the weapon-accuracy pipeline in AOW3 6.9.18 libil2cpp.so.

Question: recover the exact formulas behind
  GUIMainUpgradeHelperFunctions.WeaponStaticAccuracy   (VA 0x7FCEFF8, file 0x7FCAFF8)
  GUIMainUpgradeHelperFunctions.WeaponDynamicAccuracy  (VA 0x7FCF0B8, file 0x7FCB0B8)
so the browser hitChance() can be replaced by the recovered rule (root AGENTS.md §13).

Self-test: WeaponDamageLightValue (file 0x7FCB14C) is re-disassembled and must
match the body documented in reverse/notes/armor-stat-helper-native-analysis.md §3.4.
Binary provenance: XAPK sha256 1a41e033... (== LFS OID), libil2cpp.so sha256
8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5 (== armor note §1).
"""
import struct, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/scripts/aow3-bin/lib/arm64-v8a/libil2cpp.so'

KNOWN = {
    'GUIMainUpgradeHelperFunctions.UnitSpeedToCellsPerMin':  (0x7FCAF80, 0x7FCEF80),
    'GUIMainUpgradeHelperFunctions.WeaponShotsPerMin':       (0x7FCAFB0, 0x7FCEFB0),
    'GUIMainUpgradeHelperFunctions.WeaponStaticAccuracy':    (0x7FCAFF8, 0x7FCEFF8),
    'GUIMainUpgradeHelperFunctions.WeaponDynamicAccuracy':   (0x7FCB0B8, 0x7FCF0B8),
    'GUIMainUpgradeHelperFunctions.WeaponDamageLightValue':  (0x7FCB14C, 0x7FCF14C),
    'GUIMainUpgradeHelperFunctions.WeaponDamageMediumValue': (0x7FCB1B8, 0x7FCF1B8),
    'GUIMainUpgradeHelperFunctions.WeaponDamageHeavyValue':  (0x7FCB224, 0x7FCF224),
    'MaxStatValueProvider.CalculateWeaponArmorDamage':       (0x7CBDC18, 0x7CBDC18),
    'MaxStatValueProvider.Calculate':                        (0x7CBDA94, 0x7CBDA94),
}
OFF2NAME = {off: name for name, (off, va) in KNOWN.items()}
VA2NAME = {va: name for name, (off, va) in KNOWN.items()}

data = open(SO, 'rb').read()
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type, p_flags = struct.unpack_from('<II', data, base)
    p_offset, p_vaddr, p_paddr, p_filesz = struct.unpack_from('<QQQQ', data, base + 8)
    if p_type == 1:
        segs.append((p_offset, p_vaddr, p_filesz))

def va2off(va):
    for po, pv, sz in segs:
        if pv <= va < pv + sz:
            return va - pv + po
    return None

def read_float(va):
    o = va2off(va)
    if o is None or o + 4 > len(data):
        return None
    return struct.unpack_from('<f', data, o)[0]

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

def disasm(name, foff, nbytes):
    va0 = None
    for po, pv, sz in segs:
        if po <= foff < po + sz:
            va0 = foff - po + pv
            break
    print(f'\n===== {name} =====')
    print(f'file 0x{foff:x}  va 0x{va0:x}  span 0x{nbytes:x}')
    code = data[foff:foff + nbytes]
    adrp_page = {}
    for ins in md.disasm(code, va0):
        line = f'  0x{ins.address:x}: {ins.mnemonic:<8} {ins.op_str}'
        ann = []
        ops = ins.operands
        if ins.mnemonic == 'adrp':
            adrp_page[ins.reg_name(ops[0].reg)] = ops[1].imm
        elif ins.mnemonic == 'add' and len(ops) == 3 and ops[2].type == 2:
            s = ins.reg_name(ops[1].reg)
            if s in adrp_page:
                va = adrp_page[s] + ops[2].imm
                ann.append(f'-> va 0x{va:x}')
        elif ins.mnemonic == 'ldr' and ops[0].type == 2 and ops[1].type == 3:
            base = ins.reg_name(ops[1].mem.base)
            va = adrp_page.get(base, 0) + ops[1].mem.disp if base in adrp_page else None
            if va is not None:
                d = ins.reg_name(ops[0].reg)
                if d.startswith(('s', 'd', 'v')):
                    f = read_float(va)
                    if f is not None:
                        ann.append(f'FLOAT = {f!r} (va 0x{va:x})')
                else:
                    ann.append(f'@va 0x{va:x}')
        elif ins.mnemonic == 'bl':
            t = ops[0].imm
            nm = VA2NAME.get(t)
            ann.append(f'call 0x{t:x}' + (f' <{nm}>' if nm else ''))
        if ann:
            line += '   ; ' + ' '.join(ann)
        print(line)

if __name__ == '__main__':
    print(f'libil2cpp.so: {len(data)} bytes')
    # rodata constants used by the accuracy functions
    for cva in (0x1b09b9c, 0x1b099f0, 0x1b09d28):
        print(f'rodata 0x{cva:x}: float = {read_float(cva)}')
    # spans from dump.cs method order (next RVA - this RVA)
    disasm('GUIMainUpgradeHelperFunctions.WeaponStaticAccuracy',  0x7FCAFF8, 0x0B8 + 4)
    disasm('GUIMainUpgradeHelperFunctions.WeaponDynamicAccuracy', 0x7FCB0B8, 0x094 + 4)
    # stat-display wrappers (how callers combine the helpers)
    disasm('WeaponAccuracyStat.CalcStaticValue',  0x80E89A8, 0x0C0)
    disasm('WeaponAccuracyStat.CalcDynamicValue', 0x80E8E08, 0x140)
    # self-test against documented body
    disasm('GUIMainUpgradeHelperFunctions.WeaponDamageLightValue [self-test]', 0x7FCB14C, 0x6C + 4)
