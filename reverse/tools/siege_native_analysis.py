#!/usr/bin/env python3
"""Build A — siege transform stage machine + timings (6.9.18).

Targets:
  1. Callers of Unit siege accessors (set/get_SiegeStage 0x45B130C/0x45B1314,
     set/get_SiegeTick 0x45B131C/0x45B1324, set/get_SiegeAfterWalkTick
     0x45B132C/0x45B1334, set/get_SiegeBlocked 0x45B133C/0x45B1344,
     Unit.siegeOnWalk, Fraction.get_SiegeHp 0x4597DC0,
     Fraction.get_AutoSiegeDelay 0x4598020).
  2. Disassembly of the enclosing functions = the siege stage machine
     (SIEGE_STAGE_SEIZE_FIRE=0 -> ROTATE_WEAPONS=1 -> TRANSFORM=2), extracting
     timing literals (ticks) and the EStat 21 TransitionToSiegeModeTime read.

sha256(libil2cpp.so) = 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5
sha256(dump.cs)      = 0050e67d23f898588f0771c69ba7f30f9122cd6eccd66674c0f7c87b7f24714b
"""
import struct, re, hashlib, sys, bisect
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-work/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/dump.cs'
OUT = '/home/z/my-project/aow3-work/siege-native.txt'

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

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = False

# ---------------- dump.cs function index ----------------
print('building dump.cs function index...', file=sys.stderr)
lines = open(DUMP).read().split('\n')
rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_rvas = []
fn_name = {}
for i, l in enumerate(lines):
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0:
            fn_rvas.append(rva)
            fn_name[rva] = lines[i + 1].strip()[:120]
fn_rvas.sort()

def name_of(va):
    """enclosing function name via bisect on sorted RVAs"""
    if not fn_rvas:
        return 'sub_%x' % va
    idx = bisect.bisect_right(fn_rvas, va) - 1
    if idx < 0:
        return 'sub_%x' % va
    return fn_name.get(fn_rvas[idx], 'sub_%x' % fn_rvas[idx]) + ' @0x%x' % fn_rvas[idx]

def next_rva(va):
    idx = bisect.bisect_right(fn_rvas, va)
    return fn_rvas[idx] if idx < len(fn_rvas) else va + 0x8000

def disasm(va, end_va, annotate=True):
    """disassemble [va, end_va); annotate BL targets and movz/movk/fmov literals"""
    off = va2off(va)
    if off is None:
        return ['  <va 0x%x not mapped>' % va]
    out = []
    code = data[off:off + (end_va - va)]
    movz = {}
    for ins in md.disasm(code, va):
        txt = '%s      %s' % (ins.mnemonic, ins.op_str)
        note = ''
        if ins.mnemonic == 'bl':
            try:
                tgt = int(ins.op_str.lstrip('#'), 16)
                note = '  ; -> %s' % name_of(tgt).split(' @')[0][:70] + (' @0x%x' % tgt)
            except ValueError:
                pass
        if ins.mnemonic in ('movz', 'mov', 'movk') and 'wzr' not in ins.op_str and 'xzr' not in ins.op_str:
            movz[ins.op_str.split(',')[0]] = ins.op_str
        if ins.mnemonic == 'fmov' or ins.mnemonic == 'ldr':
            pass
        out.append('  0x%x: %s%s' % (ins.address, txt, note))
    return out

# ---------------- whole-file BL scan ----------------
print('scanning BL instructions...', file=sys.stderr)
TARGETS = {
    0x45B130C: 'Unit.get_SiegeStage',
    0x45B1314: 'Unit.set_SiegeStage',
    0x45B131C: 'Unit.get_SiegeTick',
    0x45B1324: 'Unit.set_SiegeTick',
    0x45B132C: 'Unit.get_SiegeAfterWalkTick',
    0x45B1334: 'Unit.set_SiegeAfterWalkTick',
    0x45B133C: 'Unit.get_SiegeBlocked',
    0x45B1344: 'Unit.set_SiegeBlocked',
    0x4597DC0: 'Fraction.get_SiegeHp',
    0x4598020: 'Fraction.get_AutoSiegeDelay',
}
# also resolve virtual-vtable calls: collect vtable slot usage later if needed

callers = {va: [] for va in TARGETS}
n = len(data)
for off in range(0, n - 4, 4):
    w = struct.unpack_from('<I', data, off)[0]
    op = w >> 26
    if op == 0x25:  # BL
        imm = w & 0x03FFFFFF
        if imm & 0x02000000:
            imm -= 0x04000000
        tgt = (off + (imm << 2)) & 0xFFFFFFFF
        if tgt in TARGETS:
            va = None
            for po, pv, fs in segs:
                if po <= off < po + fs:
                    va = off - po + pv
                    break
            if va is not None:
                callers[tgt].append(va)

with open(OUT, 'w') as f:
    f.write('BUILD A — SIEGE STAGE MACHINE + TIMINGS (native extraction)\n')
    f.write('game 6.9.18  libil2cpp.so sha256 %s\n' % sha_so[:16] + '…')
    f.write('  dump.cs sha256 %s\n' % hashlib.sha256(open(DUMP, 'rb').read()).hexdigest()[:16] + '…')
    f.write('SIEGE_STAGE_SEIZE_FIRE=0 ROTATE_WEAPONS=1 TRANSFORM=2 (dump.cs Unit consts 393233-393235)\n')
    f.write('chassis identities: UNIT_TYPE_SHIELD=22 UNIT_TYPE_FOG=23 UNIT_TYPE_FIGHTER=31 (dump.cs 395427-395445)\n')
    f.write('EStat.TransitionToSiegeModeTime = 21 (dump.cs 168801)\n\n')

    for va, tname in sorted(TARGETS.items(), key=lambda kv: kv[1]):
        sites = callers[va]
        f.write('== %s (0x%x): %d direct BL sites ==\n' % (tname, va, len(sites)))
        fns = {}
        for s in sites:
            fns.setdefault(name_of(s), []).append(s)
        for fn, ss in sorted(fns.items()):
            f.write('   %s   sites: %s\n' % (fn, ', '.join('0x%x' % x for x in sorted(ss))))
    f.write('\n')

    # ---- disassemble the interesting enclosing functions ----
    # collect unique enclosing function start VAs for setters/getters
    starts = set()
    for va in TARGETS:
        for s in callers[va]:
            m = re.search(r'@0x([0-9a-f]+)$', name_of(s))
            if m:
                starts.add(int(m.group(1), 16))

    f.write('=== DISASSEMBLY of enclosing functions (call-site +/- window and full bodies for small fns) ===\n\n')
    for st in sorted(starts):
        end = next_rva(st)
        size = end - st
        nm = fn_name.get(st, 'sub_%x' % st)
        f.write('---- %s @ 0x%x .. 0x%x (%d bytes) ----\n' % (nm[:110], st, end, size))
        f.write('\n'.join(disasm(st, end)))
        f.write('\n\n')

print('written', OUT, file=sys.stderr)
