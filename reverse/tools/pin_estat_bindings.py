#!/usr/bin/env python3
"""Pin exact EStat bindings for the ambiguous IStatModel classes via native disassembly.

Targets (audit item #4 follow-up):
  - 6 mine stat classes: get_Stat() constant returns (no m_stat field)
  - BuildingArmorStat..ctor: computes m_stat natively (no EStat param)
  - UnitArmorStat..ctor / SpecialStat..ctor: EStat caller-supplied -> BL call-site scan
"""
import struct, re, sys
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-work/xapk/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/dump/dump.cs'

data = open(SO, 'rb').read()
print(f'libil2cpp.so: {len(data)} bytes')

# ---- ELF64 PT_LOAD mapping (va2off) ----
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type, _ = struct.unpack_from('<II', data, base)
    p_offset, p_vaddr, _, p_filesz = struct.unpack_from('<QQQQ', data, base + 8)
    if p_type == 1:
        segs.append((p_offset, p_vaddr, p_filesz))

def va2off(va):
    for po, pv, sz in segs:
        if pv <= va < pv + sz:
            return va - pv + po
    return None

def off2va(off):
    for po, pv, sz in segs:
        if po <= off < po + sz:
            return off - po + pv
    return None

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)

# ---- 1. constant-return get_Stat for the 6 mine classes ----
MINE_GETSTAT = {
    'MineCostStat':            0x80E8AAC,
    'MineDamageForHeavyArmorStat': 0x80E8F34,
    'MineDamageForLightArmorStat': 0x80E93BC,
    'MineDamageForMediumArmorStat': 0x80E9844,
    'MineExplosionRadiusStat': 0x80E9CCC,
    'MineSetTimeStat':         0x80EA164,
}
ESTAT_NAMES = {0:'None',1:'Health',2:'Price',3:'PriceUranum',4:'CommandPoints',5:'TrainTime',
    6:'Speed',7:'ArmorLight',8:'ArmorMedium',9:'ArmorHeavy',10:'View',11:'ConstructionRadius',
    12:'ConstructionTime',13:'CommandPointsProduce',14:'SupplyIncome',15:'EnergyProduction',
    16:'EnergyNeed',17:'BuildingSize',18:'HealthRegeneration',19:'JumpRange',
    20:'TransitionToMarchModeTime',21:'TransitionToSiegeModeTime',22:'MineDeactivationTime',
    23:'DeminingSpeed',24:'EnergyReserve',25:'EnergyConsumption',26:'ShieldStrength',
    27:'ShieldRadius',28:'EnergyRegeneration',29:'ShieldActivationTime',30:'ShieldDeactivationTime',
    31:'FogRadius',32:'FogActivationTime',33:'FogDeactivationTime',34:'MineDetection',
    35:'ForestUnitDetection',36:'SubmarineDetection',37:'FuelReserve',38:'FuelConsumption',
    39:'RefuelingSpeed',40:'CerberusWeaponSwitchTime',41:'SeraphimGroundModeTransitionTime',
    42:'SeraphimAirModeTransitionTime',43:'WorkshopRepairRadius',44:'WorkshopRepairSpeed',
    45:'WorkshopModeTransitionTime',46:'DeploymentTime',47:'InitialResourceReserve',
    48:'SpaceStrikePreparationTime',49:'LaunchPreparationTime',50:'MissileFlightTime',
    51:'MaxViewReachTime',52:'PsiAttackSpeedReduction',53:'PsiSlowdownDuration',
    54:'WolverineMachineGunMaxAccelerationTime',55:'CoilTankMaxTargets',56:'CoilTankFrontalArmor',
    57:'AtlasImmortalityTime',58:'WeaponDistance',59:'WeaponAccuracy',60:'WeaponFireRate',
    61:'WeaponArmorLight',62:'WeaponArmorMedium',63:'WeaponArmorHeavy',64:'WeaponExplosionRadius',
    65:'WeaponBombCount',66:'WeaponMineCost',67:'WeaponMineTime',68:'WeaponSuperWeaponCost',
    69:'WeaponSuperWeaponTime',70:'WeaponSuperWeaponCP',71:'MinePrice',
    72:'WeaponSuperWeaponArmorLight',73:'WeaponSuperWeaponArmorMedium',74:'WeaponSuperWeaponArmorHeavy',
    75:'WeaponSuperWeaponCommandPoints',76:'WeaponSuperWeaponDistance',77:'WeaponSuperWeaponExplosionRadius'}

print('\n===== 1. mine-class get_Stat() constants =====')
mine_bindings = {}
for name, va in MINE_GETSTAT.items():
    off = va2off(va)
    code = data[off:off + 0x30]
    ins = list(md.disasm(code, va))
    consts = [i.op_str for i in ins if i.mnemonic == 'mov' and i.op_str.startswith('w0, #')]
    txt = ' ; '.join(f'{i.mnemonic} {i.op_str}' for i in ins[:6])
    val = int(consts[0].split('#')[1], 0) if consts else None
    mine_bindings[name] = val
    print(f'{name}.get_Stat VA 0x{va:x}: {txt}  -> EStat {val} = {ESTAT_NAMES.get(val)}')

# ---- 2. call-site scan for ctor VAs (BL scan over whole file, numpy) ----
CTOR_VA = {
    'UnitArmorStat..ctor':   0x7CC660C,
    'SpecialStat..ctor':     0x7CBCEE0,
    'BuildingArmorStat..ctor': 0x7CC1EC4,
}
print('\n===== 2. BL call-site scan =====')
# map file offsets to uint32 words on 4-byte aligned grid per segment
words = np.frombuffer(data[:len(data) // 4 * 4], dtype=np.uint32)
op = (words >> np.uint32(26)) & np.uint32(0x3f)
bl_mask = op == np.uint32(0x25)  # 0b100101 = BL
bl_idx = np.nonzero(bl_mask)[0]
imm26 = words[bl_idx] & np.uint32(0x3FFFFFF)
imm_sext = np.where(imm26 & np.uint32(0x2000000), imm26.astype(np.int64) - np.int64(0x4000000),
                    imm26.astype(np.int64))
targets = bl_idx.astype(np.int64) * 4 + imm_sext * 4  # file-offset space target
# convert target file offset -> va
def off2va_arr(off):
    for po, pv, sz in segs:
        if po <= off < po + sz:
            return off - po + pv
    return off
# vectorized off2va
t_va = targets.copy()
for po, pv, sz in segs:
    m = (targets >= po) & (targets < po + sz)
    t_va[m] = targets[m] - po + pv

for name, cva in CTOR_VA.items():
    hits = np.nonzero(t_va == cva)[0]
    sites = sorted(set(int(bl_idx[h] * 4) for h in hits))
    print(f'{name} (VA 0x{cva:x}): {len(sites)} call site(s)')
    for s in sites:
        print(f'   bl from file 0x{s:x} (va 0x{off2va(s):x})')

# ---- 3. dump.cs RVA index for enclosing-function attribution ----
print('\n===== 3. dump.cs method index =====')
cls = '?'
pending_va = None
methods = []  # (va, 'Class.sig')
cls_re = re.compile(r'^\s*(?:public|internal|private|protected)?(?: sealed| abstract| static| partial)*\s*(?:class|struct|interface) ([\w.<>]+)')
ns_re = re.compile(r'^\s*// Namespace: (.*)')
rva_re = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: (0x[0-9A-Fa-f]+) VA: (0x[0-9A-Fa-f]+)')
sig_re = re.compile(r'^\t(?:public|private|protected|internal|static)[\w \[\]<>?,.]*\s([\w.]+)\(')
for line in open(DUMP, encoding='utf-8', errors='replace'):
    if ns_re.match(line):
        continue
    cm = cls_re.match(line)
    if cm:
        cls = cm.group(1)
        continue
    rm = rva_re.search(line)
    if rm:
        pending_va = int(rm.group(3), 16)
        continue
    if pending_va is not None:
        sm = sig_re.match(line)
        if sm:
            methods.append((pending_va, f'{cls}.{sm.group(1)}'))
            pending_va = None
        elif line.strip().startswith('//') or not line.strip():
            continue
        else:
            pending_va = None
methods.sort()
import bisect
vas = [m[0] for m in methods]

def enclosing(va):
    i = bisect.bisect_right(vas, va) - 1
    return methods[i] if i >= 0 else (None, '?')

print(f'indexed {len(methods)} methods')

# ---- 4. attribute call sites + decode EStat argument register ----
print('\n===== 4. call-site attribution + EStat arg decode =====')
md.detail = False
ARG_REG = {'UnitArmorStat..ctor': 'w3', 'SpecialStat..ctor': 'w3', 'BuildingArmorStat..ctor': None}
results = {}
for name, cva in CTOR_VA.items():
    hits = np.nonzero(t_va == cva)[0]
    sites = sorted(set(int(bl_idx[h] * 4) for h in hits))
    results[name] = []
    print(f'\n--- {name} (VA 0x{cva:x}), {len(sites)} site(s)')
    for s in sites:
        sva = off2va(s)
        env_va, env_name = enclosing(sva)
        print(f'  site va 0x{sva:x} in {env_name} (fn va 0x{env_va:x})')
        # disassemble the enclosing function from its start up to call site + a bit
        code = data[env_va - (env_va - va2off(env_va)):va2off(sva) + 0x10 - (env_va - va2off(env_va))]
        # simpler: disassemble from function start
        foff = va2off(env_va)
        code = data[foff:foff + (sva - env_va) + 0x10]
        ins = list(md.disasm(code, env_va))
        # find last write to arg register (movz/mov w3 #imm / orr) before the bl
        argreg = ARG_REG.get(name)
        estat = None
        if argreg:
            for i2 in ins:
                if i2.mnemonic in ('mov', 'movz') and i2.op_str.startswith(f'{argreg}, #'):
                    try:
                        estat = int(i2.op_str.split('#')[-1], 0)
                    except ValueError:
                        pass
        tail = ' ; '.join(f'{i2.mnemonic} {i2.op_str}' for i2 in ins[-8:])
        print(f'    EStat arg {estat} = {ESTAT_NAMES.get(estat)}')
        print(f'    tail: {tail}')

# ---- 5. BuildingArmorStat.ctor: trace m_stat store ([x0+0x20]) ----
print('\n===== 5. BuildingArmorStat..ctor native body (m_stat @0x20) =====')
foff = va2off(0x7CC1EC4)
ins = list(md.disasm(data[foff:foff + 0x2a0], 0x7CC1EC4))
for i2 in ins:
    if '0x20]' in i2.op_str or i2.mnemonic in ('bl', 'cbz', 'cbnz', 'tbz', 'tbnz') or \
       (i2.mnemonic in ('mov', 'movz') and '#' in i2.op_str and 'w' in i2.op_str.split(',')[0]):
        print(f'  0x{i2.address:x}: {i2.mnemonic} {i2.op_str}')

import json
json.dump({'mine_bindings': mine_bindings}, open('estat_pin_results.json', 'w'), indent=1)
print('\nmine bindings saved.')
