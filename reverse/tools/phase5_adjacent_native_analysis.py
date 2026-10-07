#!/usr/bin/env python3
"""Phase 5 adjacent unknowns + MaxStatValueProvider tier thresholds (6.9.18).

Targets:
  A. Direct-BL consumers of Unit task/patrol/sameSpeed/takePosition accessors
     (set_TaskUntilTick -> bombard duration; get/set_PatrolDefend -> defend
     anchor/leash; set/get_SameSpeed -> same-speed march; set_Task confirm).
  B. GAICommandSpecMode.execute() residual call sites (siege helpers $hi/$Yh).
  C. MaxStatValueProvider..ctor (0x7CC0C00): extract the per-EStat
     StatInfo {BaseMax, FirstMax?, MegaMax?} literal table via the three
     StatInfo.Max(...) overloads (0x7CC1640 / 0x7CC16F0 / 0x7CC1650).

sha256(libil2cpp.so) = 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5
sha256(dump.cs)      = 0050e67d23f898588f0771c69ba7f30f9122cd6eccd66674c0f7c87b7f24714b
"""
import struct, re, json, hashlib, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-work/so/lib/arm64-v8a/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/dump.cs'
OUT = '/home/z/my-project/aow3-work/phase5-adjacent-native.txt'

data = open(SO, 'rb').read()
sha_so = hashlib.sha256(data).hexdigest()

(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_phentsize, e_phnum) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_phnum):
    b = e_phoff + i * e_phentsize
    pt = struct.unpack_from('<I', data, b)[0]
    po, pv = struct.unpack_from('<QQ', data, b + 8)[:2]
    fs = struct.unpack_from('<Q', data, b + 32)[0]
    if pt == 1:
        segs.append((po, pv, fs))

def va2off(va):
    for po, pv, fs in segs:
        if pv <= va < pv + fs:
            return va - pv + po
    return None

def off2va(off):
    for po, pv, fs in segs:
        if po <= off < po + fs:
            return off - po + pv
    return None

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

# ---------------- dump.cs method index ----------------
print('building dump.cs method index...', file=sys.stderr)
lines = open(DUMP).read().split('\n')
allpat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
rva2name = {}
for i, l in enumerate(lines):
    m = allpat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        sig = lines[i + 1].strip()
        rva2name[rva] = sig[:110]

def cls_of(rva):
    """find enclosing class marker for an RVA (coarse: nearest class header before it)"""
    return rva2name.get(rva, 'sub_%x' % rva)

# ---------------- whole-file BL scan ----------------
print('scanning BL instructions...', file=sys.stderr)
TARGETS = {
    0x45B13D4: 'Unit.set_Task(sbyte)',
    0x45B13CC: 'Unit.get_Task()',
    0x45B13F4: 'Unit.set_TaskUntilTick(int)',
    0x45B13EC: 'Unit.get_TaskUntilTick()',
    0x45B126C: 'Unit.get_PatrolDefend()',
    0x45B1274: 'Unit.set_PatrolDefend(PatrolRoute)',
    0x45B1254: 'Unit.get_Patrol()',
    0x45B125C: 'Unit.set_Patrol(PatrolRoute)',
    0x45B1698: 'Unit.get_SameSpeed()',
    0x45B16A0: 'Unit.set_SameSpeed(SameSpeed)',
    0x45B16B0: 'Unit.get_TakePosition()',
    0x45B16B8: 'Unit.set_TakePosition(Coordinate)',
    0x45B0AF8: 'Unit.get_Hiding()',
    0x45B144C: 'Unit.set_VisibleClient(sbyte)',
    0x47F1DFC: '$ii(Battle,Unit,bool) [reset speed]',
    0x483241C: '$Yh(Battle,Unit,int) [siege final]',
    0x4831FE4: '$hi(Battle,Unit,int,int) [siege position]',
    0x48178FC: '$Hi(Battle,Unit,sbyte) [SetTask]',
    0x4817A8C: '$ki(Battle,Unit,sbyte)',
    0x4832100: '$ji(Battle,Unit)',
    0x4809330: '$Gi(Battle,Unit,int,int)',
    0x4758128: '$he(Battle,Unit,int)',
}
# scan .text via first PT_LOAD executable segments (all PT_LOAD here)
text = []
for po, pv, fs in segs:
    text.append((po, pv, fs))

bl_sites = {t: [] for t in TARGETS}
n_bl = 0
for po, pv, fs in segs:
    code = data[po:po + fs]
    # quick BL scan: ARM64 BL = 0x94000000 | imm26 (little endian)
    for off in range(0, len(code) - 3, 4):
        w = code[off] | (code[off+1] << 8) | (code[off+2] << 16) | (code[off+3] << 24)
        if (w >> 26) == 0x25:  # BL
            imm = w & 0x3FFFFFF
            if imm & 0x2000000:
                imm -= 0x4000000
            tgt = pv + off + imm * 4
            n_bl += 1
            if tgt in bl_sites:
                bl_sites[tgt].append(pv + off)
print(f'scanned {n_bl} BLs', file=sys.stderr)

out = ['AOW3 6.9.18 — phase 5 adjacent unknowns + max-stat tier extraction',
       f'sha256(libil2cpp.so) = {sha_so}',
       f'sha256(dump.cs)      = {hashlib.sha256(open(DUMP,"rb").read()).hexdigest()}',
       '', '== A. direct-BL call sites of Unit accessors ==']
for t, name in sorted(TARGETS.items()):
    sites = bl_sites[t]
    out.append(f'\n-- {name} (0x{t:x}): {len(sites)} direct BL site(s)')
    for s in sites[:60]:
        out.append(f'   bl from 0x{s:x}')

# ---------------- context disassembly around key sites ----------------
def disasm_window(va, back=0x40, fwd=0x80, title=''):
    o = va2off(va)
    if o is None:
        return [f'  !! 0x{va:x} unmapped']
    res = [f'  --- {title} around 0x{va:x} ---']
    start = va - back
    for ins in md.disasm(data[va2off(start):va2off(start) + back + fwd], start):
        mark = ' >>>' if ins.address <= va < ins.address + 4 else '    '
        res.append(f'  {mark} 0x{ins.address:x}: {ins.mnemonic:<8} {ins.op_str}')
        tgt = None
        if ins.mnemonic in ('bl', 'b') and ins.operands and ins.operands[0].type == 2:
            tgt = ins.operands[0].imm
        if tgt in rva2name:
            res.append(f'         -> {rva2name[tgt]}')
        elif tgt in TARGETS:
            res.append(f'         -> {TARGETS[tgt]}')
    return res

out.append('\n\n== A2. context around key call sites ==')
KEY = [0x45B13F4, 0x45B126C, 0x45B1274, 0x45B16A0, 0x45B1698, 0x47F1DFC]
for t in KEY:
    name = TARGETS[t]
    for s in bl_sites[t][:8]:
        out += disasm_window(s, title=f'call of {name}')

open(OUT, 'w').write('\n'.join(out) + '\n')
print(f'wrote {OUT}', file=sys.stderr)
print(f'BL sites: ' + ', '.join(f'{TARGETS[t]}={len(bl_sites[t])}' for t in KEY))
