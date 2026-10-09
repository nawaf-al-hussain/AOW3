#!/usr/bin/env python3
"""Build J part 1 — MaxStatValueProvider.Get/Calculate/CalculateWeaponArmorDamage
native bodies + caller scan (AOW3 6.9.18, libil2cpp.so sha256 8ace05bb…).

Methods (dump.cs boundaries):
  StatInfo.Max1      0x7CC1640..0x7CC1650
  StatInfo.Max3      0x7CC1650..0x7CC16F0
  StatInfo.Max2      0x7CC16F0..0x7CC176C
  Get                0x7CC176C..0x7CC1A94   (slot 4)
  Calculate          0x7CC1A94..0x7CC1C18
  CalculateWeaponArmorDamage 0x7CC1C18..0x7CC1D94
Known Get call site: MineCostStat.CalculateProgress tail-call @0x80e8f08
(estat note §6.7) -> pins the interface vt offset.

Output: aow3-work/maxstat-get-decode.txt
"""
import importlib.util
import json
import re
import struct

import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

spec = importlib.util.spec_from_file_location(
    'm', '/home/z/my-project/scripts/pg_takepos_decode.py')
m = importlib.util.module_from_spec(spec)
src = open('/home/z/my-project/scripts/pg_takepos_decode.py').read().replace(
    "if __name__ == '__main__':", 'if False:')
exec(compile(src, 'm', 'exec'), m.__dict__)

so_b = open('/home/z/my-project/aow3-work/native/libil2cpp.so', 'rb').read()
m.load_so()
sym, cls_fields = m.build_symbol_map()
md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)

OUT = '/home/z/my-project/aow3-work/maxstat-get-decode.txt'
o = open(OUT, 'w')


def P(*a):
    s = ' '.join(str(x) for x in a)
    print(s)
    o.write(s + '\n')


METHODS = {
    'StatInfo.Max1': (0x7CC1640, 0x7CC1650),
    'StatInfo.Max3': (0x7CC1650, 0x7CC16F0),
    'StatInfo.Max2': (0x7CC16F0, 0x7CC176C),
    'Get': (0x7CC176C, 0x7CC1A94),
    'Calculate': (0x7CC1A94, 0x7CC1C18),
    'CalculateWeaponArmorDamage': (0x7CC1C18, 0x7CC1D94),
}

ESTAT = {0: 'None', 1: 'Health', 2: 'Price', 3: 'PriceUranum', 4: 'CommandPoints',
         5: 'TrainTime', 6: 'Speed', 7: 'ArmorLight', 8: 'ArmorMedium',
         9: 'ArmorHeavy', 10: 'View', 11: 'ConstructionRadius',
         12: 'ConstructionTime', 13: 'CommandPointsProduce', 14: 'SupplyIncome',
         15: 'EnergyProduction', 16: 'EnergyNeed', 17: 'BuildingSize',
         18: 'HealthRegeneration', 19: 'JumpRange',
         20: 'TransitionToMarchModeTime', 21: 'TransitionToSiegeModeTime',
         22: 'MineDeactivationTime', 23: 'DeminingSpeed', 24: 'EnergyReserve',
         25: 'EnergyConsumption', 26: 'ShieldStrength', 27: 'ShieldRadius',
         28: 'EnergyRegeneration', 29: 'ShieldActivationTime',
         30: 'ShieldDeactivationTime', 31: 'FogRadius', 32: 'FogActivationTime',
         33: 'FogDeactivationTime', 34: 'MineDetection',
         35: 'ForestUnitDetection', 36: 'SubmarineDetection', 37: 'FuelReserve',
         38: 'FuelConsumption', 39: 'RefuelingSpeed',
         40: 'CerberusWeaponSwitchTime', 41: 'SeraphimGroundModeTransitionTime',
         42: 'SeraphimAirModeTransitionTime', 43: 'WorkshopRepairRadius',
         44: 'WorkshopRepairSpeed', 45: 'WorkshopModeTransitionTime',
         46: 'DeploymentTime', 47: 'InitialResourceReserve',
         48: 'SpaceStrikePreparationTime', 49: 'LaunchPreparationTime',
         50: 'MissileFlightTime', 51: 'MaxViewReachTime',
         52: 'PsiAttackSpeedReduction', 53: 'PsiSlowdownDuration',
         54: 'WolverineMachineGunMaxAccelerationTime', 55: 'CoilTankMaxTargets',
         56: 'CoilTankFrontalArmor', 57: 'AtlasImmortalityTime',
         58: 'WeaponDistance', 59: 'WeaponAccuracy', 60: 'WeaponFireRate',
         61: 'WeaponArmorLight', 62: 'WeaponArmorMedium',
         63: 'WeaponArmorHeavy', 64: 'WeaponExplosionRadius',
         65: 'WeaponBombCount', 66: 'WeaponMineCost', 67: 'WeaponMineTime',
         68: 'WeaponSuperWeaponCost', 69: 'WeaponSuperWeaponTime',
         70: 'WeaponSuperWeaponCP', 71: 'MinePrice', 72: 'WeaponSuperWeaponArmorLight',
         73: 'WeaponSuperWeaponArmorMedium', 74: 'WeaponSuperWeaponArmorHeavy',
         75: 'WeaponSuperWeaponCommandPoints', 76: 'WeaponSuperWeaponDistance',
         77: 'WeaponSuperWeaponExplosionRadius'}


def f32(bits):
    return struct.unpack('<f', struct.pack('<I', bits & 0xffffffff))[0]


def dis(va, end, label):
    P('-- %s %#x..%#x (%d B) --' % (label, va, end, end - va))
    off = m.va2off(va)
    for ins in md.disasm(so_b[off:off + (end - va)], va):
        line = '%08x  %-8s %s' % (ins.address, ins.mnemonic, ins.op_str)
        if ins.mnemonic in ('bl', 'b') and ins.op_str.startswith('#'):
            t = int(ins.op_str[1:], 16)
            if t in sym:
                line += '   ; -> ' + sym[t]
        # float literal comment for fmov with imm
        if ins.mnemonic == 'ldr' and '#0x' in ins.op_str:
            mm = re.match(r'^[ws]\d+, \[x\d+, (x?\d+|#[0-9xa-f]+)\]$', ins.op_str)
        P(line)
    P('')


P('=== Build J part 1: MaxStatValueProvider.Get/Calculate/CalculateWeaponArmorDamage ===')
P('so sha256 prefix', __import__('hashlib').sha256(so_b).hexdigest()[:8])
P('')

for name, (va, end) in METHODS.items():
    dis(va, end, name)

# ---- direct BL caller scan (binary-wide, numpy) ----
P('=== direct BL/B caller scan (whole .text) ===')
targets = {va: name for name, (va, _) in METHODS.items()}
for po, pv, fs in m.segs:
    if fs < 0x1000:
        continue
    words = np.frombuffer(so_b, dtype='<u4', count=fs // 4, offset=po)
    is_bl = (words & 0xFC000000) == 0x94000000
    is_b = (words & 0xFC000000) == 0x14000000
    for kind, mask_words in (('bl', is_bl), ('b', is_b)):
        idx = np.nonzero(mask_words)[0]
        if not len(idx):
            continue
        imm = words[idx].astype(np.int64) & 0x3FFFFFF
        imm = np.where(imm & 0x2000000, imm - 0x4000000, imm)
        tgts = (pv + idx * 4 + imm * 4) & 0xFFFFFFFF
        for i, t in zip(idx, tgts):
            if int(t) in targets:
                va = pv + int(i) * 4
                caller = sym.get(va)
                P('%s %#x -> %s   caller=%s' % (kind, va, targets[int(t)], caller))
P('')

# ---- the known interface-dispatch call site (estat §6.7) ----
P('=== context @0x80e8f08 (MineCostStat.CalculateProgress -> m_max.Get tail-call) ===')
dis(0x80e8e80, 0x80e8f40, 'tail-call window')
P('')

# ---- vt slot check: disasm every direct or vt-based Get consumer candidate ----
P('=== scan: [klass+#vt] load + blr patterns near 0x80e8f08-like dispatch ===')
# find the vt offset used at the tail-call site
off = m.va2off(0x80e8e80)
for ins in md.disasm(so_b[off:off + 0xC0], 0x80e8e80):
    if ins.mnemonic == 'blr' or (ins.mnemonic == 'ldr' and ins.op_str.startswith('x8, [x8,')):
        P('  %08x  %s %s' % (ins.address, ins.mnemonic, ins.op_str))
P('')

# float literal table from .ctor for cross-check of a few entries is in estat-tiers.txt
P('=== Get: notable loads — m_statInfos dict @this+0x10, StatInfo{BaseMax@0x0, FirstMax@0x4(hv@0x8?), MegaMax@0xC} ===')
P('Nullable<float> layout: value @+0x0, has_value @+0x4; FirstMax field @0x4 -> value @+0x4, has_value @+0x8;')
P('MegaMax @0xC -> value @+0xC, has_value @+0x10. Struct size 0x14 (padded 0x18).')
