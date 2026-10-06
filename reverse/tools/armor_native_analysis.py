#!/usr/bin/env python3
"""Native disassembly of armor-damage pipeline functions in AOW3 6.9.18 libil2cpp.so.

Evidence for conflict resolution: version-drift-6.5.22-vs-6.9.18.md §C
(external claim: AttackCoeffCalculating / ARMOR_COEFF — absent from 6.9.18 metadata).
Question: does any armor-coefficient multiplier exist OUTSIDE
MaxStatValueProvider.CalculateWeaponArmorDamage (0.9/0.1 curve)?
"""
import struct, sys, json
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-audit/analysis/native/lib/arm64-v8a/libil2cpp.so'

# ---- known functions: name -> (file_offset, vaddr/RVA from dump.cs) ----
KNOWN = {
    'ArmorStatHelper.GetArmorMeta':                    (0x7CB2B30, 0x7CB6B30),
    'MaxStatValueProvider..ctor':                      (0x7CBCC00, 0x7CBCC00),
    'MaxStatValueProvider.Get':                        (0x7CBD76C, 0x7CBD76C),
    'MaxStatValueProvider.Calculate':                  (0x7CBDA94, 0x7CBDA94),
    'MaxStatValueProvider.CalculateWeaponArmorDamage': (0x7CBDC18, 0x7CBDC18),
    'GUIMainUpgradeHelperFunctions.WeaponDamageLightValue':   (0x7FCB14C, 0x7FCF14C),
    'GUIMainUpgradeHelperFunctions.WeaponDamageMediumValue':  (0x7FCB1B8, 0x7FCF1B8),
    'GUIMainUpgradeHelperFunctions.WeaponDamageHeavyValue':    (0x7FCB224, 0x7FCF224),
    'WeaponStatsFactory.GetDamageForLightArmor':        (0x80EC964, 0x80F0964),
    'WeaponStatsFactory.GetDamageForMediumArmor':       (0x80EC974, 0x80F0974),
    'WeaponStatsFactory.GetDamageForHeavyArmor':        (0x80EC984, 0x80F0984),
    'WeaponStatsFactory.GetSuperWeaponDamageForLightArmor':  (0x80EC994, 0x80F0994),
    'WeaponStatsFactory.GetSuperWeaponDamageForMediumArmor': (0x80EC9A4, 0x80F09A4),
    'WeaponStatsFactory.GetSuperWeaponDamageForHeavyArmor':  (0x80EC9B4, 0x80F09B4),
    'WeaponStatsFactory.GetDistance':                   (0x80EC9C4, 0x80F09C4),
    'WeaponStatsFactory.GetFireRate':                   (0x80ECA04, 0x80F0A04),
    'WeaponStatsFactory.CreateTargets':                 (0x80EC2E0, 0x80F02E0),
    'WeaponStatsFactory.CreateStats':                   (0x80EBDC4, 0x80EFDC4),
    'MineStatsFactory.CreateList':                      (0x7FE24DC, 0x7FE64DC),
    'MineStatsFactory.CreateTargets':                   (0x7FE2AB0, 0x7FE6AB0),
    'MineStatsFactory.CreateDamageForLightArmor':       (0x7FE27EC, 0x7FE67EC),
    'MineStatsFactory.CreateDamageForMediumArmor':      (0x7FE2860, 0x7FE6860),
    'MineStatsFactory.CreateDamageForHeavyArmor':       (0x7FE28D4, 0x7FE68D4),
    'MineStatsFactory.CreateCost':                      (0x7FE2948, 0x7FE6948),
}
OFF2NAME = {off: name for name, (off, va) in KNOWN.items()}
VA2NAME = {va: name for name, (off, va) in KNOWN.items()}

# ---- minimal ELF64 program-header parse: vaddr <-> file offset ----
data = open(SO, 'rb').read()
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []  # (p_offset, p_vaddr, p_filesz)
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type, p_flags = struct.unpack_from('<II', data, base)
    p_offset, p_vaddr, p_paddr, p_filesz = struct.unpack_from('<QQQQ', data, base + 8)
    if p_type == 1:  # PT_LOAD
        segs.append((p_offset, p_vaddr, p_filesz))

def off2va(off):
    for po, pv, sz in segs:
        if po <= off < po + sz:
            return off - po + pv
    return None

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

def read_u32(va):
    o = va2off(va)
    if o is None or o + 4 > len(data):
        return None
    return struct.unpack_from('<I', data, o)[0]

print(f'PT_LOAD segments: {len(segs)}')
for po, pv, sz in segs[:4]:
    print(f'  off=0x{po:x} va=0x{pv:x} size=0x{sz:x}')

# sanity: known rodata constants from combat-stats.md
for cva, expect in ((0x1b09b9c, 0.1), (0x1b099f0, 0.9)):
    print(f'rodata 0x{cva:x}: raw=0x{read_u32(cva):08x} float={read_float(cva)} (expect {expect})')

# ---- disassembler ----
md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

def disasm(name, foff, max_bytes=0x460):
    va0 = off2va(foff)
    print(f'\n===== {name} =====')
    print(f'file offset 0x{foff:x}  va 0x{va0:x}')
    code = data[foff:foff + max_bytes]
    adrp_page = {}   # reg -> page va
    reg_ptr = {}     # reg -> computed va (adrp+add / adrp+ldr addr base)
    out = []
    insns = list(md.disasm(code, va0))
    end_va = None
    ret_seen = 0
    for i, ins in enumerate(insns):
        line = f'  0x{ins.address:x} (f+0x{ins.address - va0 + foff - va0 + 0:x}): {ins.mnemonic:<8} {ins.op_str}'
        # annotate
        ann = []
        if ins.mnemonic == 'adrp':
            ops = ins.operands
            reg = ins.reg_name(ops[0].reg)
            adrp_page[reg] = ops[1].imm
            reg_ptr.pop(reg, None)
        elif ins.mnemonic == 'add' and len(ins.operands) == 3:
            d = ins.reg_name(ins.operands[0].reg)
            s = ins.reg_name(ins.operands[1].reg)
            if ins.operands[2].type == 2 and s in adrp_page:
                va = adrp_page[s] + ins.operands[2].imm
                reg_ptr[d] = va
                ann.append(f'-> va 0x{va:x}')
        elif ins.mnemonic in ('ldr',) and ins.operands[0].type == 2 and ins.operands[1].type == 3:
            d = ins.reg_name(ins.operands[0].reg)
            base = ins.reg_name(ins.operands[1].mem.base)
            disp = ins.operands[1].mem.disp
            if base in adrp_page:
                va = adrp_page[base] + disp
                reg_ptr[d] = va
                ann.append(f'-> va 0x{va:x}')
                if ins.reg_name(ins.operands[0].reg).startswith(('s', 'd', 'v')):
                    f = read_float(va)
                    if f is not None:
                        ann.append(f'FLOAT = {f!r}')
                else:
                    u = read_u32(va)
                    if u is not None:
                        ann.append(f'u32 = 0x{u:08x}')
            elif base in reg_ptr:
                va = reg_ptr[base] + disp
                if ins.reg_name(ins.operands[0].reg).startswith(('s', 'd', 'v')):
                    f = read_float(va)
                    if f is not None:
                        ann.append(f'FLOAT = {f!r} (va 0x{va:x})')
        elif ins.mnemonic == 'bl':
            t = ins.operands[0].imm
            nm = VA2NAME.get(t) or OFF2NAME.get(va2off(t) if va2off(t) else -1)
            ann.append(f'call 0x{t:x}' + (f' <{nm}>' if nm else ''))
        elif ins.mnemonic in ('b', 'b.ne', 'b.eq', 'b.lt', 'b.le', 'b.gt', 'b.ge', 'b.hi', 'b.ls', 'b.cc', 'b.cs', 'cbz', 'cbnz', 'tbz', 'tbnz'):
            if ins.operands and ins.operands[-1].type == 2:
                t = ins.operands[-1].imm
                nm = VA2NAME.get(t)
                if nm:
                    ann.append(f'-> <{nm}>')
        elif ins.mnemonic in ('fmov',):
            pass  # capstone already prints float immediates
        if ann:
            line += '   ; ' + ' '.join(ann)
        out.append(line)
        if ins.mnemonic == 'ret':
            ret_seen += 1
            if ret_seen >= 1 and i + 1 < len(insns):
                nxt = insns[i + 1]
                if nxt.mnemonic in ('nop', 'udf') or (nxt.bytes == b'\x00' * 4) or nxt.mnemonic.startswith('b.') is False and nxt.mnemonic not in ('ldr',):
                    # heuristic: ret followed by padding/branch-target of different func — stop after 2nd ret or padding
                    pass
            if ret_seen >= 3:
                end_va = ins.address + 4
                break
        if len(out) > 400:
            end_va = ins.address
            out.append('  ... (window cap)')
            break
    print('\n'.join(out))
    if end_va:
        print(f'  [stopped ~0x{end_va:x}]')

if __name__ == '__main__':
    targets = sys.argv[1:] or list(KNOWN)
    for name in targets:
        foff, _ = KNOWN[name]
        disasm(name, foff)
