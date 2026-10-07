#!/usr/bin/env python3
"""Extract the per-EStat tier-threshold table (StatInfo {BaseMax, FirstMax?, MegaMax?})
from MaxStatValueProvider..ctor(ILogger) (VA 0x7CC0C00) in 6.9.18 libil2cpp.so.

Entry shapes observed:
  A) floats -> s0[/s1[/s2]] -> bl StatInfo.Max{1,2,3} (sret x8 = sp+0xc) -> Add(key)
  B) direct struct build: str wN,[sp,#0xc] (BaseMax bits), stp xzr,xzr,[sp,#0x10]
     (FirstMax/MegaMax = null) -> Add(key)
Dictionary.Add helper = 0x7181154 (x0=dict, w1=key, x2=&StatInfo, x3=MethodInfo).
"""
import struct, re
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-work/so/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/dump.cs'
OUT = '/home/z/my-project/aow3-work/estat-tiers.txt'

data = open(SO, 'rb').read()
segs = [(0x0, 0x0, 0x38a4b14), (0x38a4b20, 0x38a8b20, 0x5730370)]

def va2off(va):
    for po, pv, fs in segs:
        if pv <= va < pv + fs:
            return va - pv + po

# EStat names from dump.cs enum
names = {}
lines = open(DUMP).read().split('\n')
start = None
for i, l in enumerate(lines):
    if l.strip().startswith('public enum EStat //'):
        start = i
        break
i = start
while i < len(lines):
    l = lines[i].strip()
    if l == '}':
        break
    m = re.match(r'public const EStat (\w+) = (\d+);', l)
    if m:
        names[int(m.group(2))] = m.group(1)
    i += 1

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

VA = 0x7CC0C00
END = 0x7CC1640
o = va2off(VA)
code = data[o:o + (va2off(END) - o)]

adrp_page = {}
wreg = {}
sreg = {}
entries = []
pending = None
cur_key = None

def f32(bits):
    return struct.unpack('<f', struct.pack('<I', bits & 0xFFFFFFFF))[0]

for ins in md.disasm(code, VA):
    op = ins.mnemonic
    ops = ins.operands
    rn = ins.reg_name(ops[0].reg) if ops and ops[0].type == 1 else None
    if op == 'adrp':
        adrp_page[rn] = ops[1].imm
    elif op == 'add' and len(ops) == 3 and ops[2].type == 2:
        d = ins.reg_name(ops[0].reg); s = ins.reg_name(ops[1].reg)
        if s in adrp_page:
            adrp_page[d] = adrp_page[s] + ops[2].imm
    elif op in ('mov', 'movz') and len(ops) == 2 and ops[1].type == 2 and rn and rn.startswith('w'):
        wreg[rn] = ops[1].imm & 0xFFFFFFFF
        if rn == 'w1':
            cur_key = ops[1].imm
    elif op == 'movk' and rn and rn.startswith('w'):
        val = ops[1].imm if ops[1].type == 2 else 0
        sh = ops[1].shift.value if getattr(ops[1], 'shift', None) and ops[1].shift.type else 0
        cur = wreg.get(rn, 0)
        wreg[rn] = (cur & ~(0xFFFF << sh)) | ((val & 0xFFFF) << sh)
    elif op == 'fmov' and len(ops) == 2:
        d = ins.reg_name(ops[0].reg)
        if d.startswith('s') and ops[1].type == 1 and ins.reg_name(ops[1].reg).startswith('w'):
            sreg[d] = f32(wreg.get(ins.reg_name(ops[1].reg), 0))
        elif d.startswith('s') and ops[1].type == 1 and ins.reg_name(ops[1].reg).startswith('s'):
            sreg[d] = sreg.get(ins.reg_name(ops[1].reg))
        elif d.startswith('s') and ops[1].type == 2:
            sreg[d] = f32(ops[1].imm)
    elif op == 'ldr' and rn and rn.startswith('s') and len(ops) == 2 and ops[1].type == 3:
        b = ins.reg_name(ops[1].mem.base); disp = ops[1].mem.disp
        if b in adrp_page:
            va = adrp_page[b] + disp
            fo = va2off(va)
            bits = struct.unpack_from('<I', data, fo)[0]
            sreg[rn] = f32(bits)
    elif op == 'str' and rn and rn.startswith('w') and len(ops) == 2 and ops[1].type == 3:
        b = ins.reg_name(ops[1].mem.base); disp = ops[1].mem.disp
        if b == 'sp' and disp == 0xC:
            pending = (f32(wreg.get(rn, 0)), None, None)
    elif op == 'bl':
        t = ops[0].imm
        if t == 0x7CC1640:
            pending = (sreg.get('s0'), None, None)
        elif t == 0x7CC16F0:
            pending = (sreg.get('s0'), sreg.get('s1'), None)
        elif t == 0x7CC1650:
            pending = (sreg.get('s0'), sreg.get('s1'), sreg.get('s2'))
        elif t == 0x7181154:
            if cur_key is not None and pending is not None:
                entries.append((cur_key,) + pending)
                pending = None

out = ['MaxStatValueProvider tier thresholds (BaseMax/FirstMax/MegaMax) per EStat',
       'extracted from MaxStatValueProvider..ctor(ILogger), VA 0x7CC0C00',
       'libil2cpp.so sha256 8ace05bb…; dictionary Add helper 0x7181154',
       f'entries: {len(entries)}', '',
       f'{"EStat":<44} {"BaseMax":>10} {"FirstMax":>10} {"MegaMax":>10}']
for k, b, f_, m in entries:
    nm = names.get(k, f'?{k}')
    out.append(f'{nm + " / " + str(k):<44} {b:>10.6g} {("%g" % f_ if f_ is not None else "-"):>10} {("%g" % m if m is not None else "-"):>10}')
open(OUT, 'w').write('\n'.join(out) + '\n')
print(f'wrote {OUT}: {len(entries)} entries')
