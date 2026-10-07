#!/usr/bin/env python3
"""Native disassembly of the spec-mode / stance command functions in AOW3 6.9.18 libil2cpp.so.

Phase 5 unknowns: Defend / DontShoot / TakePositions / aircraft-hold.
Centerpiece: GAICommandSpecMode.execute(Battle) (VA 0x45F61E0) — the single dispatch
for ACT_STOP/HOLD/SIEGE_TO/SIEGE_FROM/HIDE/DEFEND/RESET_SPEED/DONT_SHOOT —
plus the AIComm executors ($CMA(Battle)) for the generic spec command and bombard.

sha256(libil2cpp.so) = 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5
"""
import struct, json, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-audit/analysis/native/lib/arm64-v8a/libil2cpp.so'
STR = '/home/z/my-project/aow3-audit/analysis/stringliteral.json'
OUT = '/home/z/my-project/aow3-repo/reverse/evidence/combat/specmode-native.txt'

# ---- functions: name -> (file_offset/VA, window_bytes)  (dump.cs 6.9.18: VA==RVA here) ----
FUNC = {
    'GAICommandSpecMode.verifyVariables(Battle)': (0x45F6158, 0x88),
    'GAICommandSpecMode.execute(Battle)':         (0x45F61E0, 0xEB8),
    'GAICommandSpecMode.ToString()':              (0x45F7128, 0x120),
    'AICommUnitsSpec.$CMA(Battle)':               (0x49130F0, 0xB2C),
    'AICommUnitsBombard.$CMA(Battle)':            (0x4906390, 0x600),
    'AICommUnitsHoldPosition.$CMA(Battle)':       (0x4907E7C, 0x86C),
    'WeaponType.canBombard()':                    (0x45B6268, 0x64),
    'Unit.get_Resting()':                         (0x45B0258, 0x60),
    'Unit.get_Hiding()':                          (0x45B0B0C, 0x60),
    'Unit.get_StopOnEnemyNearby()':               (0x45B0C40, 0x60),
    'Unit.set_Task(sbyte)':                       (0x45B13DC, 0x30),
}
# known VAs for BL annotation
KNOWN = {
    0x45B13DC: 'Unit.set_Task', 0x45B13D4: 'Unit.get_Task',
    0x45B0C40: 'Unit.get_StopOnEnemyNearby', 0x45B0B0C: 'Unit.get_Hiding',
    0x45B0258: 'Unit.get_Resting', 0x45B6268: 'WeaponType.canBombard',
    0x45F61E0: 'GAICommandSpecMode.execute',
}

data = open(SO, 'rb').read()
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type = struct.unpack_from('<I', data, base)[0]
    p_offset, p_vaddr = struct.unpack_from('<QQ', data, base + 8)[:2]
    p_filesz = struct.unpack_from('<Q', data, base + 32)[0]
    if p_type == 1:
        segs.append((p_offset, p_vaddr, p_filesz))

def va2off(va):
    for po, pv, sz in segs:
        if pv <= va < pv + sz:
            return va - pv + po
    return None

def read_cstr(va, maxlen=80):
    o = va2off(va)
    if o is None:
        return None
    end = data.find(b'\0', o, o + maxlen)
    if end < 0:
        return None
    try:
        s = data[o:end].decode('utf-8', 'replace')
        return s if s and all(32 <= ord(c) < 127 or c in '\n\t' for c in s) else None
    except Exception:
        return None

# string literal table: va -> text
lits = {}
try:
    for e in json.load(open(STR)):
        v = e.get('value', '')
        if v:
            lits[int(e['address'], 16)] = v
except Exception as ex:
    print(f'WARN: stringliteral load failed: {ex}', file=sys.stderr)

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

def disasm(out, name, va, window):
    foff = va2off(va)
    out.append(f'\n===== {name} =====')
    out.append(f'va 0x{va:x}  file offset 0x{foff:x}  window 0x{window:x}')
    if foff is None:
        out.append('  !! VA not mapped')
        return
    code = data[foff:foff + window]
    adrp_page, reg_ptr = {}, {}
    n = 0
    for ins in md.disasm(code, va):
        n += 1
        line = f'  0x{ins.address:x}: {ins.mnemonic:<8} {ins.op_str}'
        ann = []
        ops = ins.operands
        if ins.mnemonic == 'adrp' and len(ops) == 2:
            reg = ins.reg_name(ops[0].reg)
            adrp_page[reg] = ops[1].imm
            reg_ptr.pop(reg, None)
        elif ins.mnemonic == 'add' and len(ops) == 3 and ops[2].type == 2:
            d = ins.reg_name(ops[0].reg); s = ins.reg_name(ops[1].reg)
            if s in adrp_page:
                va2 = adrp_page[s] + ops[2].imm
                reg_ptr[d] = va2
                ann.append(f'= 0x{va2:x}')
        elif ins.mnemonic in ('ldr', 'ldrb', 'ldrsb') and len(ops) == 2 and ops[1].type == 3:
            d = ins.reg_name(ops[0].reg)
            b = ins.reg_name(ops[1].mem.base); disp = ops[1].mem.disp
            if b in adrp_page:
                va2 = adrp_page[b] + disp
                reg_ptr[d] = va2
                s = lits.get(va2)
                if s is not None:
                    ann.append(f'= 0x{va2:x} STR {s[:60]!r}')
                else:
                    cs_ = read_cstr(va2)
                    ann.append(f'= 0x{va2:x}' + (f' CSTR {cs_[:60]!r}' if cs_ else ''))
        elif ins.mnemonic in ('bl', 'b') and ops and ops[0].type == 2:
            tgt = ops[0].imm
            if tgt in KNOWN:
                ann.append(f'-> {KNOWN[tgt]}')
        elif ins.mnemonic.startswith('cmp') and len(ops) == 2 and ops[1].type == 2:
            ann.append(f'; cmp #{ops[1].imm}')
        if ann:
            line += '   ; ' + ' '.join(ann)
        out.append(line)
        if ins.mnemonic == 'ret' and n > 8:
            pass  # keep going — tail branches follow in switches
    out.append(f'  [{n} instructions]')

out = ['AOW3 6.9.18 libil2cpp.so — spec-mode native analysis (Phase 5 unknowns)',
       f'sha256 {__import__("hashlib").sha256(open(SO,"rb").read()).hexdigest()}',
       'Anchors: dump.cs GAICommandSpecMode (410916), AICommUnits* (433431+), Unit (393220)']
for name, (va, win) in FUNC.items():
    disasm(out, name, va, win)

open(OUT, 'w').write('\n'.join(out) + '\n')
print(f'wrote {OUT} ({len(out)} lines)')
