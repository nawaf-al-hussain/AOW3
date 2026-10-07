#!/usr/bin/env python3
"""Sweep mine-stat Calculate/CalculateProgress for the EStat literal passed to
IMaxStatValueProvider.Get via interface dispatch (mov w1, #imm ... br x3)."""
import struct, re
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-work/lib/arm64-v8a/libil2cpp.so'
data = open(SO, 'rb').read()
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    pt, _ = struct.unpack_from('<II', data, base)
    po, pv, _, pf = struct.unpack_from('<QQQQ', data, base + 8)
    if pt == 1:
        segs.append((po, pv, pf))

def va2off(va):
    for po, pv, sz in segs:
        if pv <= va < pv + sz:
            return va - pv + po

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)

TARGETS = {
    'MineCostStat.Calculate':              (0x80E8D78, 0x80E8E5C),
    'MineCostStat.CalculateProgress':      (0x80E8E5C, 0x80E8F10),
    'MineDamageForLightArmorStat.Calculate':         (0x80E9688, 0x80E976C),
    'MineDamageForLightArmorStat.CalculateProgress': (0x80E976C, 0x80E9820),
    'MineDamageForMediumArmorStat.Calculate':        (0x80E9B10, 0x80E9BF4),
    'MineDamageForMediumArmorStat.CalculateProgress':(0x80E9BF4, 0x80E9CA8),
    'MineDamageForHeavyArmorStat.Calculate':         (0x80E9200, 0x80E92E4),
    'MineDamageForHeavyArmorStat.CalculateProgress': (0x80E92E4, 0x80E9398),
    'MineExplosionRadiusStat.Calculate':             (0x80E9F98, 0x80EA08C),
    'MineExplosionRadiusStat.CalculateProgress':     (0x80EA08C, 0x80EA140),
    'MineSetTimeStat.Calculate':                     (0x80EA430, 0x80EA520),
    'MineSetTimeStat.CalculateProgress':             (0x80EA520, 0x80EA600),
}
ESTAT = {61:'WeaponArmorLight',62:'WeaponArmorMedium',63:'WeaponArmorHeavy',64:'WeaponExplosionRadius',
         66:'WeaponMineCost',67:'WeaponMineTime',71:'MinePrice'}

for name, (va, end) in TARGETS.items():
    off = va2off(va)
    ins = list(md.disasm(data[off:off + (end - va)], va))
    keys = []
    for i, x in enumerate(ins):
        if x.mnemonic == 'br' and x.op_str.startswith('x'):
            # scan back for last w1 literal
            for y in reversed(ins[:i]):
                m = re.match(r'^w1, #(0x[0-9a-f]+|\d+)$', y.op_str)
                if y.mnemonic in ('mov', 'movz') and m:
                    v = int(m.group(1), 0)
                    keys.append((x.address, v))
                    break
    ks = ', '.join(f'0x{a:x}: Get(value, {v} = {ESTAT.get(v, "?")})' for a, v in keys) or 'no interface Get tail-call'
    print(f'{name:52s} {ks}')
