#!/usr/bin/env python3
"""Follow-up scans: (1) call sites of all 6 WeaponDamage.Create* factories;
(2) ThisStatIncreases(EStat) body; (3) any cmp/mov literal 71 anywhere in the
UI stat pipeline functions (GetIconName/GetParsedValue/GetColor*/ThisStatIncreases)."""
import struct, re, bisect
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = '/home/z/my-project/aow3-work/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/dump/dump.cs'
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

def off2va(off):
    for po, pv, sz in segs:
        if po <= off < po + sz:
            return off - po + pv

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

cls = '?'
pending_va = None
methods = []
cls_re  = re.compile(r'^\s*(?:public|internal|private|protected)?(?: sealed| abstract| static| partial)*\s*(?:class|struct|interface) ([\w.<>]+)')
rva_re  = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: (0x[0-9A-Fa-f]+) VA: (0x[0-9A-Fa-f]+)')
sig_re  = re.compile(r'^\t(?:public|private|protected|internal|static)[\w \[\]<>?,.]*\s([\w.]+)\(')
for line in open(DUMP, encoding='utf-8', errors='replace'):
    cm = cls_re.match(line)
    if cm:
        cls = cm.group(1); continue
    rm = rva_re.search(line)
    if rm:
        pending_va = int(rm.group(3), 16); continue
    if pending_va is not None:
        sm = sig_re.match(line)
        if sm:
            methods.append((pending_va, f'{cls}.{sm.group(1)}')); pending_va = None
        elif line.strip().startswith('//') or not line.strip():
            continue
        else:
            pending_va = None
methods.sort()
vas = [m[0] for m in methods]

def enclosing(va):
    i = bisect.bisect_right(vas, va) - 1
    return methods[i] if i >= 0 else (None, '?')

words = np.frombuffer(data[:len(data) // 4 * 4], dtype=np.uint32)
op = (words >> np.uint32(26)) & np.uint32(0x3f)
bl_idx = np.nonzero(op == np.uint32(0x25))[0]
imm26 = words[bl_idx] & np.uint32(0x3FFFFFF)
imm_sext = np.where(imm26 & np.uint32(0x2000000), imm26.astype(np.int64) - np.int64(0x4000000), imm26.astype(np.int64))
targets_off = bl_idx.astype(np.int64) * 4 + imm_sext * 4
t_va = targets_off.copy()
for po, pv, sz in segs:
    m = (targets_off >= po) & (targets_off < po + sz)
    t_va[m] = targets_off[m] - po + pv

def call_sites(t):
    hits = np.nonzero(t_va == t)[0]
    return sorted(set(int(bl_idx[h]) * 4 for h in hits))

print('--- call sites of WeaponDamage.Create* factories (dump name: VA) ---')
FACTS = {
    'WeaponDamage.CreateLiteDamage':              0x80EDDAC,
    'WeaponDamage.CreateMediumDamage':            0x80EDE50,
    'WeaponDamage.CreateHeavyDamage':             0x80EDEF4,
    'WeaponDamage.CreateSuperWeaponLiteDamage':   0x80EDF98,
    'WeaponDamage.CreateSuperWeaponMediumDamage': 0x80EE03C,
    'WeaponDamage.CreateSuperWeaponHeavyDamage':  0x80EE0E0,
    'MineDamageForLightArmorStat..ctor':          0x80E94C0,
    'MineDamageForMediumArmorStat..ctor':         0x80E9948,
    'MineDamageForHeavyArmorStat..ctor':          0x80E9038,
    'MineCostStat..ctor':                         0x80E8BB0,
    'MineExplosionRadiusStat..ctor':              0x80E9DD0,
    'MineSetTimeStat..ctor':                      0x80EA268,
}
for name, va in FACTS.items():
    sites = call_sites(va)
    print(f'{name} (0x{va:x}): {len(sites)} site(s)')
    for s in sites[:6]:
        sva = off2va(s)
        ev = enclosing(sva)
        print(f'   bl 0x{sva:x} in {ev[1]}' if ev[0] else f'   bl 0x{sva:x}')

print('\n--- UI stat pipeline bodies: literal 0x47 (71) scan ---')
UI = {}
for va, name in methods:
    base = name.split('.')[-2] if name.count('.') > 1 else name
    if re.search(r'(ThisStatIncreases|GetIconName|GetIconColorBase|GetIconColorSpecific|GetParsedValue|GetColorBase|GetColorSpecific)$', name):
        UI.setdefault(name, va)
for name, va in sorted(UI.items()):
    i = bisect.bisect_right(vas, va)
    end = methods[i][0] if i < len(methods) else va + 0x400
    off = va2off(va)
    hits = []
    for ins in md.disasm(data[off:off + min(end - va, 0x600)], va):
        if ins.mnemonic in ('mov', 'movz', 'cmp') and re.search(r'#0x47$', ins.op_str):
            hits.append(f'0x{ins.address:x}: {ins.mnemonic} {ins.op_str}')
    print(f'{name} (0x{va:x}, 0x{end - va:x}B): ' + ('; '.join(hits) if hits else 'no 0x47'))
