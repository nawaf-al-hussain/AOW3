#!/usr/bin/env python3
"""Native analysis, AOW3 6.9.18 libil2cpp.so — WeaponType combat-surface completion.

Closes the remaining open rows of reverse/AGENTS.md §13:

  * hitBonus semantics            — WeaponType.hit_bonus @0x48 / get_HitBonus 0x45B64DC
  * target restrictions + AA      — WeaponType.get_AntiAirOnly 0x45B6274, air_aiming,
                                    WeaponStatsFactory.CreateTargets 0x80F02E0 + the
                                    7 EWeaponTarget predicates (<CreateTargets>b__0..6),
                                    WeaponTarget..ctor / GetState
  * shell-type dispatch           — the accuracy helpers' `weaponType ∈ {10,40} / 27`
                                    parameter natively sourced from WeaponType.shell_type
                                    (SHELL_TYPE_BULLET=10 / FIRE=40 / NUCLEAR_MISSILE=27)
  * explosionDecr consumers       — BL xref of WeaponType/MineType ExplosionDecr getters
  * critical/special effects      — dump-level: no crit system (only DebugLevel.Critical)

Parts:
  A  WeaponType core surface disassembly (ctor / init / tuning / behavior getters)
  B  Target-restriction leg (CreateTargets + 7 lambdas + WeaponTarget)
  C  Whole-file direct-BL xref of the surface getters + accuracy helpers
  D  Accuracy-helper call sites: where does the `weaponType` argument come from?

Run:  python3 weapon_type_surface_native_analysis.py [outdir]
"""
import struct, re, sys, os, bisect
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = '/home/z/my-project/work/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/work/il2cpp/dump.cs'
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/aow3-work/reverse/evidence/combat'

data = open(SO, 'rb').read()
print(f'libil2cpp.so: {len(data)} bytes')
import hashlib
print('sha256:', hashlib.sha256(data).hexdigest())

# ---- ELF64 PT_LOAD mapping ----
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

def read_float(va):
    o = va2off(va)
    return struct.unpack_from('<f', data, o)[0] if o is not None and o + 4 <= len(data) else None

def read_u32(va):
    o = va2off(va)
    return struct.unpack_from('<I', data, o)[0] if o is not None and o + 4 <= len(data) else None

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

# sanity anchors from combat-stats.md
print('sanity: rodata 0x1b09b9c =', read_float(0x1b09b9c), ' 0x1b099f0 =', read_float(0x1b099f0))

# ---- dump.cs method index (VA -> name) ----
cls = '?'
pending_va = None
methods = []
cls_re  = re.compile(r'^\s*(?:public|internal|private|protected)?(?: sealed| abstract| static| partial)*\s*(?:class|struct|interface) ([\w.<>]+)')
rva_re  = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: (0x[0-9A-Fa-f]+) VA: (0x[0-9A-Fa-f]+)')
sig_re  = re.compile(r'^\t(?:public|private|protected|internal|static)[\w \[\]<>?,.]*\s([\w.]+)\((.*)\)')
for line in open(DUMP, encoding='utf-8', errors='replace'):
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
            methods.append((pending_va, f'{cls}.{sm.group(1)}', sm.group(2)))
            pending_va = None
        elif line.strip().startswith('//') or not line.strip():
            continue
        else:
            pending_va = None
methods.sort()
vas = [m[0] for m in methods]
print(f'indexed {len(methods)} methods from dump.cs')

def enclosing(va):
    i = bisect.bisect_right(vas, va) - 1
    return methods[i] if i >= 0 else (None, '?', '')

def extent(va):
    i = bisect.bisect_right(vas, va) - 1
    if i < 0:
        return 0x400
    nxt = methods[i + 1][0] if i + 1 < len(methods) else va + 0x800
    return min(max(nxt - va, 0x20), 0x1400)

KNOWN = {
    'WeaponType..ctor':                    0x45B61C0,
    'WeaponType.init':                     0x45B2E6C,
    'WeaponType.tuning':                   0x45B61C8,
    'WeaponType.get_ConeFire':             0x45B621C,
    'WeaponType.usingObjTerritory':        0x45B622C,
    'WeaponType.canBombard':               0x45B6268,
    'WeaponType.get_AntiAirOnly':          0x45B6274,
    'WeaponType.get_AirAiming':            0x45B636C,
    'WeaponType.get_HitBonus':             0x45B64DC,
    'WeaponType.set_HitBonus':             0x45B64E4,
    'WeaponType.get_ShellType':            0x45B64EC,
    'WeaponType.get_Aiming':               0x45B659C,
    'WeaponType.get_Priority':             0x45B65AC,
    'WeaponType.get_WalkingShot':          0x45B65BC,
    'WeaponType.get_DamagePriority':       0x45B645C,
    'WeaponType.get_ExplosionDecr':        0x45B64AC,
    'WeaponType.get_ExplosionRadius':      0x45B64BC,
    'WeaponType.get_Guided':               0x45B63BC,
    'MineType.get_ExplosionDecr':          0x459D724,
    'MineType.get_ExplosionRadius':        0x459D764,
    'WeaponStatsFactory.CreateTargets':    0x80F02E0,
    'WeaponStatsFactory.<CreateTargets>b__0': 0x80F0C4C,
    'WeaponStatsFactory.<CreateTargets>b__1': 0x80F0C6C,
    'WeaponStatsFactory.<CreateTargets>b__2': 0x80F0CBC,
    'WeaponStatsFactory.<CreateTargets>b__3': 0x80F0CDC,
    'WeaponStatsFactory.<CreateTargets>b__4': 0x80F0CFC,
    'WeaponStatsFactory.<CreateTargets>b__5': 0x80F0D1C,
    'WeaponStatsFactory.<CreateTargets>b__6': 0x80F0D3C,
    'WeaponTarget..ctor(bool)':            0x80F2018,
    'WeaponTarget..ctor(func)':            0x80F08C0,
    'WeaponTarget.GetState':               0x80F212C,
    'GUIMainUpgradeHelperFunctions.WeaponStaticAccuracy':  0x7FCEFF8,
    'GUIMainUpgradeHelperFunctions.WeaponDynamicAccuracy': 0x7FCF0B8,
    'MaxStatValueProvider.Get':                        0x7CC176C,
    'MaxStatValueProvider.CalculateWeaponArmorDamage': 0x7CC1C18,
}
VA2NAME = dict(KNOWN)

def annotate(ins, adrp_page, reg_ptr):
    ann = []
    if ins.mnemonic == 'adrp':
        ops = ins.operands
        adrp_page[ins.reg_name(ops[0].reg)] = ops[1].imm
        reg_ptr.pop(ins.reg_name(ops[0].reg), None)
    elif ins.mnemonic == 'add' and len(ins.operands) == 3:
        d = ins.reg_name(ins.operands[0].reg)
        s = ins.reg_name(ins.operands[1].reg)
        if ins.operands[2].type == 2 and s in adrp_page:
            va = adrp_page[s] + ins.operands[2].imm
            reg_ptr[d] = va
            ann.append(f'-> va 0x{va:x}')
    elif ins.mnemonic == 'ldr' and ins.operands[0].type == 2 and ins.operands[1].type == 3:
        d = ins.reg_name(ins.operands[0].reg)
        base = ins.reg_name(ins.operands[1].mem.base)
        disp = ins.operands[1].mem.disp
        va = None
        if base in adrp_page:
            va = adrp_page[base] + disp
        elif base in reg_ptr:
            va = reg_ptr[base] + disp
        if va is not None:
            ann.append(f'-> va 0x{va:x}')
            if d.startswith(('s', 'd', 'v')):
                f = read_float(va)
                if f is not None:
                    ann.append(f'FLOAT = {f!r}')
            else:
                u = read_u32(va)
                if u is not None:
                    ann.append(f'u32 = 0x{u:08x}')
    elif ins.mnemonic == 'bl':
        t = ins.operands[0].imm
        nm = VA2NAME.get(t)
        if nm is None:
            ev = enclosing(t)
            nm = f'{ev[1]} @0x{t:x}' if ev[0] is not None else None
        ann.append(f'call 0x{t:x}' + (f' <{nm}>' if nm else ''))
    elif ins.mnemonic in ('b', 'b.ne', 'b.eq', 'b.lt', 'b.le', 'b.gt', 'b.ge', 'b.hi', 'b.ls',
                          'b.cc', 'b.cs', 'cbz', 'cbnz', 'tbz', 'tbnz'):
        if ins.operands and ins.operands[-1].type == 2:
            t = ins.operands[-1].imm
            nm = VA2NAME.get(t)
            if nm:
                ann.append(f'-> <{nm}>')
    return ann

def disasm_fn(name, va, out, cap=None):
    off = va2off(va)
    size = cap or extent(va)
    out.append(f'\n===== {name} =====')
    out.append(f'VA 0x{va:x}  file 0x{off:x}  body<=0x{size:x} bytes')
    code = data[off:off + size]
    adrp_page, reg_ptr = {}, {}
    n = 0
    for ins in md.disasm(code, va):
        ann = annotate(ins, adrp_page, reg_ptr)
        line = f'  0x{ins.address:x}: {ins.mnemonic:<8} {ins.op_str}'
        if ann:
            line += '   ; ' + ' '.join(ann)
        out.append(line)
        n += 1
        if ins.mnemonic == 'ret':
            break
        if n > 900:
            out.append('  ... (cap)')
            break
    return out

# ---- whole-file BL scan + attribution ----
print('\nscanning BL call sites...')
words = np.frombuffer(data[:len(data) // 4 * 4], dtype=np.uint32)
op = (words >> np.uint32(26)) & np.uint32(0x3f)
bl_idx = np.nonzero(op == np.uint32(0x25))[0]
imm26 = words[bl_idx] & np.uint32(0x3FFFFFF)
imm_sext = np.where(imm26 & np.uint32(0x2000000),
                    imm26.astype(np.int64) - np.int64(0x4000000),
                    imm26.astype(np.int64))
targets_off = bl_idx.astype(np.int64) * 4 + imm_sext * 4
t_va = targets_off.copy()
for po, pv, sz in segs:
    m = (targets_off >= po) & (targets_off < po + sz)
    t_va[m] = targets_off[m] - po + pv
print(f'{len(bl_idx)} BL instructions')

def call_sites(target_va):
    hits = np.nonzero(t_va == target_va)[0]
    return sorted(set(int(bl_idx[h]) * 4 for h in hits))

os.makedirs(OUTDIR, exist_ok=True)
out = ['=' * 78,
       'WeaponType combat surface — native analysis (6.9.18)',
       'binary: libil2cpp.so sha256 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5',
       'source: Art-of-War-3_6.9.18_apkcombo.com.xapk sha256 1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e',
       'dump.cs sha256 0050e67d23f898588f0771c69ba7f30f9122cd6eccd66674c0f7c87b7f24714b',
       'tool: reverse/tools/weapon_type_surface_native_analysis.py',
       '=' * 78]

# ============ PART A: WeaponType core surface ============
out.append('\n' + '=' * 78)
out.append('PART A — WeaponType behavior surface (com.geargames.aow.entities, TDI 11545)')
out.append('=' * 78)
for name in ('WeaponType.get_ConeFire', 'WeaponType.usingObjTerritory',
             'WeaponType.canBombard', 'WeaponType.get_AntiAirOnly',
             'WeaponType.get_AirAiming', 'WeaponType.get_HitBonus',
             'WeaponType.set_HitBonus', 'WeaponType.get_ShellType',
             'WeaponType.get_Aiming', 'WeaponType.get_Priority',
             'WeaponType.get_WalkingShot', 'WeaponType.get_DamagePriority',
             'WeaponType.get_ExplosionDecr', 'WeaponType.get_ExplosionRadius',
             'WeaponType.get_Guided'):
    disasm_fn(name, KNOWN[name], out)

# ============ PART B: target-restriction leg ============
out.append('\n' + '=' * 78)
out.append('PART B — target restrictions: CreateTargets + 7 EWeaponTarget predicates')
out.append('EWeaponTarget (dump.cs:19803): None=0 Bomber=1 Fighter=2 Helicopter=3')
out.append('                              Marine=4 Submarine=5 LandForce=6 Infantry=7')
out.append('=' * 78)
for name in ('WeaponStatsFactory.CreateTargets',
             'WeaponStatsFactory.<CreateTargets>b__0',
             'WeaponStatsFactory.<CreateTargets>b__1',
             'WeaponStatsFactory.<CreateTargets>b__2',
             'WeaponStatsFactory.<CreateTargets>b__3',
             'WeaponStatsFactory.<CreateTargets>b__4',
             'WeaponStatsFactory.<CreateTargets>b__5',
             'WeaponStatsFactory.<CreateTargets>b__6',
             'WeaponTarget..ctor(bool)', 'WeaponTarget..ctor(func)',
             'WeaponTarget.GetState'):
    disasm_fn(name, KNOWN[name], out)

# ============ PART C: BL xref of the surface ============
out.append('\n' + '=' * 78)
out.append('PART C — whole-file direct-BL xref (call-site attribution via dump.cs index)')
out.append('=' * 78)
XREF = [
    ('WeaponType.get_HitBonus (0x45B64DC)',          0x45B64DC),
    ('WeaponType.set_HitBonus (0x45B64E4)',          0x45B64E4),
    ('WeaponType.get_AntiAirOnly (0x45B6274)',       0x45B6274),
    ('WeaponType.canBombard (0x45B6268)',            0x45B6268),
    ('WeaponType.get_ConeFire (0x45B621C)',          0x45B621C),
    ('WeaponType.usingObjTerritory (0x45B622C)',     0x45B622C),
    ('WeaponType.get_AirAiming (0x45B636C)',         0x45B636C),
    ('WeaponType.get_ShellType (0x45B64EC)',         0x45B64EC),
    ('WeaponType.get_Priority (0x45B65AC)',          0x45B65AC),
    ('WeaponType.get_Aiming (0x45B659C)',            0x45B659C),
    ('WeaponType.get_WalkingShot (0x45B65BC)',       0x45B65BC),
    ('WeaponType.get_DamagePriority (0x45B645C)',    0x45B645C),
    ('WeaponType.get_ExplosionDecr (0x45B64AC)',     0x45B64AC),
    ('WeaponType.get_ExplosionRadius (0x45B64BC)',   0x45B64BC),
    ('WeaponType.init (0x45B2E6C)',                  0x45B2E6C),
    ('WeaponType.tuning (0x45B61C8)',                0x45B61C8),
    ('WeaponStatsFactory.CreateTargets (0x80F02E0)', 0x80F02E0),
    ('WeaponTarget..ctor(bool) (0x80F2018)',         0x80F2018),
    ('WeaponTarget..ctor(func) (0x80F08C0)',         0x80F08C0),
    ('WeaponTarget.GetState (0x80F212C)',            0x80F212C),
    ('MineType.get_ExplosionDecr (0x459D724)',       0x459D724),
    ('GUIMainUpgradeHelperFunctions.WeaponStaticAccuracy (0x7FCEFF8)',  0x7FCEFF8),
    ('GUIMainUpgradeHelperFunctions.WeaponDynamicAccuracy (0x7FCF0B8)', 0x7FCF0B8),
]
for label, tgt in XREF:
    sites = call_sites(tgt)
    out.append(f'\n--- {label}: {len(sites)} direct call site(s)')
    for s in sites[:60]:
        sva = off2va(s)
        ev = enclosing(sva)
        out.append(f'  bl from va 0x{sva:x} in {ev[1]} (fn va 0x{ev[0]:x})' if ev[0]
                   else f'  bl from va 0x{sva:x}')

# ============ PART D: accuracy-helper argument sourcing ============
out.append('\n' + '=' * 78)
out.append('PART D — where does the accuracy helpers\' weaponType argument come from?')
out.append('Disassembly of each direct caller; look for WeaponType field loads')
out.append('(shell_type @0x78 short; hit_bonus @0x48 sbyte; walking_shot @0x8A).')
out.append('=' * 78)
seen_fns = set()
for helper in ('GUIMainUpgradeHelperFunctions.WeaponStaticAccuracy',
               'GUIMainUpgradeHelperFunctions.WeaponDynamicAccuracy'):
    sites = call_sites(KNOWN[helper])
    out.append(f'\n--- callers of {helper}: {len(sites)} site(s)')
    for s in sites:
        sva = off2va(s)
        ev = enclosing(sva)
        if not ev[0] or ev[0] in seen_fns:
            continue
        seen_fns.add(ev[0])
        out.append(f'\n  caller: {ev[1]} (fn va 0x{ev[0]:x}) — call site 0x{sva:x}')
        # disassemble the caller body, annotated
        out2 = []
        disasm_fn(ev[1], ev[0], out2)
        out.extend('  ' + l for l in out2)

open(os.path.join(OUTDIR, 'weapon-type-surface-native.txt'), 'w').write('\n'.join(out))
print(f'\nwrote {OUTDIR}/weapon-type-surface-native.txt ({len(out)} lines)')
