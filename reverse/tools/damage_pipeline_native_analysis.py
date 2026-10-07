#!/usr/bin/env python3
"""Native analysis, AOW3 6.9.18 libil2cpp.so — audit-report item #2 + MinePrice/71 xref.

PART A (audit item #2): complete the damage-pipeline reconstruction beyond
CalculateWeaponArmorDamage by disassembling the Medium-armor creation path
end-to-end and enumerating every native consumer of the mitigation curve:

    MineStatsFactory.CreateDamageForMediumArmor
      -> MineDamageForMediumArmorStat..ctor           (mine leg)
    WeaponStatsFactory.GetDamageForMediumArmor
      -> WeaponDamage.CreateMediumDamage
      -> WeaponDamage..ctor(EStat=62)                 (weapon leg)
    WeaponDamage.Calculate / CalculateProgress        (value computation)
    ArmyWeaponItemInfoPresenter.SafeSetDamageStat     (UI consumer leg)
    whole-file BL xref of CalculateWeaponArmorDamage / MaxStatValueProvider.Get
    / WeaponDamage.get_Values / get_Stat / Calculate

PART B (estat note Unknown #2): xref EStat.MinePrice/71 — enumerate every
dump.cs method taking an EStat parameter, BL-scan the whole binary for their
call sites, and detect call sites that pass the literal 71 (0x47) in an
argument register; plus scan for get_Stat() == 71 comparisons.

Run:  python3 damage_pipeline_native_analysis.py [outdir]
"""
import struct, re, sys, os, bisect
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO   = '/home/z/my-project/aow3-work/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/dump/dump.cs'

data = open(SO, 'rb').read()
print(f'libil2cpp.so: {len(data)} bytes')

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

# sanity anchor: 0.1f / 0.9f from combat-stats.md
print('sanity: rodata 0x1b09b9c =', read_float(0x1b09b9c), ' 0x1b099f0 =', read_float(0x1b099f0))

# ---- dump.cs method index (VA -> name, sorted; also extents) ----
cls = '?'
pending_va = None
methods = []   # (va, 'Class.method')
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
vas  = [m[0] for m in methods]
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

# ---- named targets ----
KNOWN = {
    'MineStatsFactory.CreateList':                      0x7FE64DC,
    'MineStatsFactory.CreateDamageForLightArmor':       0x7FE67EC,
    'MineStatsFactory.CreateDamageForMediumArmor':      0x7FE6860,
    'MineStatsFactory.CreateDamageForHeavyArmor':       0x7FE68D4,
    'WeaponStatsFactory.GetDamageForLightArmor':        0x80F0964,
    'WeaponStatsFactory.GetDamageForMediumArmor':       0x80F0974,
    'WeaponStatsFactory.GetDamageForHeavyArmor':        0x80F0984,
    'WeaponDamage..ctor':                               0x80EDBA0,
    'WeaponDamage.CreateLiteDamage':                    0x80EDDAC,
    'WeaponDamage.CreateMediumDamage':                  0x80EDE50,
    'WeaponDamage.CreateHeavyDamage':                   0x80EDEF4,
    'WeaponDamage.CreateSuperWeaponLiteDamage':         0x80EDF98,
    'WeaponDamage.CreateSuperWeaponMediumDamage':       0x80EE03C,
    'WeaponDamage.CreateSuperWeaponHeavyDamage':        0x80EE0E0,
    'WeaponDamage.get_Values':                          0x80EDA7C,
    'WeaponDamage.get_Category':                        0x80EDA8C,
    'WeaponDamage.get_Stat':                            0x80EDA94,
    'WeaponDamage.get_IsIncreasing':                    0x80EDA9C,
    'WeaponDamage.Calculate':                           0x80EE184,
    'WeaponDamage.CalculateProgress':                   0x80EE3C0,
    'MaxStatValueProvider.Get':                         0x7CC176C,
    'MaxStatValueProvider.CalculateWeaponArmorDamage':  0x7CC1C18,
    'ArmyWeaponItemInfoPresenter.SafeSetDamageStat':    0x7C6C474,
    'ArmyWeaponItemInfoPresenter.<SafeSetDamageStat>b__19_0': 0x7C6D3D4,
    'ArmyWeaponItemInfoPresenter.<SafeSetDamageStat>b__1':    0x7C6D4A4,
}
VA2NAME = dict(KNOWN)

ESTAT_NAMES = {61:'WeaponArmorLight',62:'WeaponArmorMedium',63:'WeaponArmorHeavy',64:'WeaponExplosionRadius',
               66:'WeaponMineCost',67:'WeaponMineTime',71:'MinePrice',72:'WeaponSuperWeaponArmorLight',
               73:'WeaponSuperWeaponArmorMedium',74:'WeaponSuperWeaponArmorHeavy',7:'ArmorLight',8:'ArmorMedium',9:'ArmorHeavy'}

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
        if n > 800:
            out.append('  ... (cap)')
            break
    return out

# ================= PART A =================
outA = ['=' * 78,
        'PART A — damage pipeline (audit item #2): Medium-armor path + consumers',
        'binary: libil2cpp.so sha256 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5',
        'source: Art-of-War-3_6.9.18_apkcombo.com.xapk sha256 1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e',
        '=' * 78]

FULL = [
    'MineStatsFactory.CreateDamageForMediumArmor',
    'WeaponStatsFactory.GetDamageForMediumArmor',
    'WeaponDamage.CreateMediumDamage',
    'WeaponDamage.CreateLiteDamage',
    'WeaponDamage.CreateHeavyDamage',
    'WeaponDamage.CreateSuperWeaponLiteDamage',
    'WeaponDamage.CreateSuperWeaponMediumDamage',
    'WeaponDamage.CreateSuperWeaponHeavyDamage',
    'WeaponDamage..ctor',
    'WeaponDamage.get_Values',
    'WeaponDamage.get_Category',
    'WeaponDamage.get_Stat',
    'WeaponDamage.get_IsIncreasing',
    'WeaponDamage.Calculate',
    'WeaponDamage.CalculateProgress',
    'ArmyWeaponItemInfoPresenter.SafeSetDamageStat',
    'ArmyWeaponItemInfoPresenter.<SafeSetDamageStat>b__19_0',
    'ArmyWeaponItemInfoPresenter.<SafeSetDamageStat>b__1',
]
for name in FULL:
    disasm_fn(name, KNOWN[name], outA)

# resolve unresolved bl targets inside the two Medium creators + ctor
outA.append('\n----- resolved call targets (dump.cs attribution) -----')
for name in ('MineStatsFactory.CreateDamageForMediumArmor', 'WeaponDamage.CreateMediumDamage',
             'WeaponDamage..ctor', 'ArmyWeaponItemInfoPresenter.SafeSetDamageStat'):
    va = KNOWN[name]
    off = va2off(va)
    for ins in md.disasm(data[off:off + extent(va)], va):
        if ins.mnemonic == 'bl':
            t = ins.operands[0].imm
            if t not in VA2NAME:
                ev = enclosing(t)
                outA.append(f'  {name}: bl 0x{t:x} -> {ev[1]} (fn VA 0x{ev[0]:x})' if ev[0] else f'  {name}: bl 0x{t:x} -> ?')
        if ins.mnemonic == 'ret':
            break

# ---- whole-file BL scan + attribution ----
print('\nscanning call sites...')
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
print(f'{len(bl_idx)} BL instructions')

def call_sites(target_va):
    hits = np.nonzero(t_va == target_va)[0]
    return sorted(set(int(bl_idx[h]) * 4 for h in hits))

outA.append('\n----- XREF: native callers of key pipeline functions -----')
XREF = [
    ('MaxStatValueProvider.CalculateWeaponArmorDamage (0.9/0.1 curve)', 0x7CC1C18),
    ('MaxStatValueProvider.Get(float, EStat)',                          0x7CC176C),
    ('WeaponDamage.get_Values',                                         0x80EDA7C),
    ('WeaponDamage.get_Stat',                                           0x80EDA94),
    ('WeaponDamage.Calculate(IStatModificationCollection)',             0x80EE184),
    ('WeaponDamage.CreateMediumDamage',                                 0x80EDE50),
    ('WeaponStatsFactory.GetDamageForMediumArmor',                      0x80F0974),
    ('MineStatsFactory.CreateDamageForMediumArmor',                     0x7FE6860),
    ('ArmyWeaponItemInfoPresenter.SafeSetDamageStat',                   0x7C6C474),
]
for label, tgt in XREF:
    sites = call_sites(tgt)
    outA.append(f'\n--- {label}: {len(sites)} call site(s)')
    for s in sites[:80]:
        sva = off2va(s)
        ev = enclosing(sva)
        outA.append(f'  bl from va 0x{sva:x} in {ev[1]} (fn va 0x{ev[0]:x})' if ev[0] else f'  bl from va 0x{sva:x}')

# ================= PART B =================
outB = ['=' * 78,
        'PART B — EStat.MinePrice/71 (0x47) xref',
        '=' * 78]

# B1: every dump.cs method with an EStat parameter
outB.append('\n----- B1: dump.cs methods taking EStat parameters -----')
estat_methods = []  # (va, name, sig, [param indexes])
FLOAT_RE = re.compile(r'\b(float|double|Single)\b', re.I)
for va, name, sig in methods:
    if not re.search(r'^\s*(?:\[InAttribute\]\s*)?EStat\b|[(,]\s*(?:\[InAttribute\]\s*)?EStat\b', sig):
        continue
    params = [p.strip() for p in sig.split(',') if p.strip()]
    idxs = [i for i, p in enumerate(params) if re.search(r'^\[InAttribute\]\s*EStat\b|^EStat\b', p)]
    # integer register slot: instance methods consume x0 for this
    is_static = '.ctor' not in name and bool(re.match(r'^\t(?:public|private|internal|protected)?\s*static\b', ''))
    # cheaper: recompute from dump line later; assume instance unless name starts with static-known
    outB.append(f'  va 0x{va:x}  {name}({sig})  EStat param idx {idxs}')
    estat_methods.append((va, name, sig, idxs))
print(f'\n{len(estat_methods)} methods take EStat params')

# integer-slot heuristic: count preceding non-float params; instance methods add 1 for this
INSTANCE_HINT = ('.ctor', 'Get(', 'Calculate', 'GetIconName', 'GetColor', 'GetParsedValue', 'Get(float')
def arg_slot(va, name, sig, idx):
    params = [p.strip() for p in sig.split(',') if p.strip()]
    slot = 0 if not name.endswith('.ctor') or True else 0
    # instance unless declared static — re-scan dump text for 'static' in signature line
    return None  # replaced below

# simpler + robust: for each call site, find the LAST write of #0x47 to ANY w-register
# before the bl, and report register + context. Manual review of contexts decides.
outB.append('\n----- B2: call sites passing literal 71 (0x47) into EStat-taking methods -----')
hits71 = 0
for va, name, sig, idxs in estat_methods:
    sites = call_sites(va)
    if not sites:
        continue
    for s in sites:
        sva = off2va(s)
        ev = enclosing(sva)
        if not ev[0]:
            continue
        foff = va2off(ev[0])
        code = data[foff:foff + (sva - ev[0]) + 4]
        ins_list = list(md.disasm(code, ev[0]))
        # find last mov/movz wX, #0x47 before the bl (any reg), within 60 instrs
        found = []
        for i2 in ins_list[-60:]:
            if i2.mnemonic in ('mov', 'movz') and re.match(r'^w\d+, #0x47$', i2.op_str):
                found.append((i2.address, i2.op_str))
            elif i2.mnemonic == 'mov' and re.match(r'^w\d+, w\d+$', i2.op_str):
                pass
        if found:
            hits71 += 1
            outB.append(f'\n  SITE va 0x{sva:x} calls {name} (target va 0x{va:x})')
            outB.append(f'    enclosing: {ev[1]} (fn va 0x{ev[0]:x})')
            for a, o in found[-3:]:
                outB.append(f'    arg literal @0x{a:x}: {o}')
            tail = ' ; '.join(f'{i2.mnemonic} {i2.op_str}' for i2 in ins_list[-6:])
            outB.append(f'    tail: {tail}')
print(f'{hits71} call sites pass literal 0x47')

# B3: get_Stat()-style comparisons against 71 — cmp wX, #0x47 near a call to any get_Stat
outB.append('\n----- B3: cmp #0x47 (MinePrice) against get_Stat results -----')
getstat_vas = [va for va, name, sig in methods if re.search(r'\.get_Stat$', name)]
cmp_hits = 0
for va in getstat_vas:
    for s in call_sites(va):
        sva = off2va(s)
        ev = enclosing(sva)
        if not ev[0]:
            continue
        foff = va2off(ev[0])
        after = data[va2off(s):va2off(s) + 0x40]
        for ins in md.disasm(after, s):
            if ins.mnemonic in ('cmp',) and re.match(r'^w\d+, #0x47$', ins.op_str):
                cmp_hits += 1
                outB.append(f'  va 0x{ins.address:x} (after bl get_Stat @0x{sva:x}) in {ev[1]}: cmp {ins.op_str}')
            if ins.mnemonic in ('cbz', 'cbnz', 'tbz', 'tbnz'):
                break
print(f'{cmp_hits} cmp-#0x47 sites after get_Stat')

# B4: raw scan — any mov wX, #0x47 in mine-related classes' functions (belt & braces)
outB.append('\n----- B4: literal 0x47 (71) inside Mine*-class functions (whole-class sweep) -----')
mine_fns = [(va, name) for va, name, sig in methods if '.Mine' in name or name.startswith(('Mine', 'Mines'))]
cnt = 0
for va, name in mine_fns:
    off = va2off(va)
    for ins in md.disasm(data[off:off + extent(va)], va):
        if ins.mnemonic in ('mov', 'movz', 'cmp') and re.search(r'#0x47$', ins.op_str):
            outB.append(f'  0x{ins.address:x} in {name}: {ins.mnemonic} {ins.op_str}')
            cnt += 1
print(f'{cnt} literal-71 instructions in Mine* functions ({len(mine_fns)} fns)')

# ---- write evidence ----
outdir = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/aow3-repo/reverse/evidence/damage-pipeline'
os.makedirs(outdir, exist_ok=True)
open(os.path.join(outdir, 'damage-pipeline-native.txt'), 'w').write('\n'.join(outA) + '\n')
open(os.path.join(outdir, 'mineprice71-xref.txt'), 'w').write('\n'.join(outB) + '\n')
print(f'\nevidence written to {outdir}/')
