#!/usr/bin/env python3
"""Build A — siege stage machine hunt via direct field accesses (6.9.18).

Unit fields (dump.cs 393716-393719 region):
  siege_stage        // 0xA1  sbyte  -> LDRSB/STRB [x, #0xA1]
  siegeTick          // 0xA4  int    -> LDR/STR w [x, #0xA4]
  siegeAfterWalkTick // 0xA8  int    -> LDR/STR w [x, #0xA8]
  siege_blocked      // 0x1C4 bool   -> LDRB/STRB [x, #0x1C4]

Every WRITE site's enclosing function gets fully disassembled with BL
annotation (dump.cs bisect) and immediate-load tracking, so the stage
progression + timing literals (ticks, EStat 21) can be read out.
"""
import struct, re, sys, hashlib, bisect
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-work/libil2cpp.so'
DUMP = '/home/z/my-project/aow3-work/dump.cs'
OUT = '/home/z/my-project/aow3-work/siege-stage-scan.txt'

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

print('building dump.cs index...', file=sys.stderr)
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

def fn_start(va):
    idx = bisect.bisect_right(fn_rvas, va) - 1
    return fn_rvas[idx] if idx >= 0 else 0

def name_of(va):
    st = fn_start(va)
    return fn_name.get(st, 'sub_%x' % st), st

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

TARGETS = {0xA1: 'siege_stage', 0xA4: 'siegeTick', 0xA8: 'siegeAfterWalkTick', 0x1C4: 'siege_blocked'}

hits = {}   # (kind, fo) -> [va]
for po, pv, fs in segs:
    code = data[po:po + fs]
    for off in range(0, len(code) - 3, 4):
        w = struct.unpack_from('<I', code, off)[0]
        op = w >> 22
        V = (w >> 26) & 1
        if V:
            continue
        imm12 = (w >> 10) & 0xFFF
        size = (w >> 30) & 3
        if op == 0b1011100100:                    # STR 32 (unsigned offset)
            fo = imm12 * 4
            if fo in (0xA4, 0xA8):
                hits.setdefault(('STRw', fo), []).append(pv + off)
        elif op == 0b1011100101:                  # LDR 32 (unsigned offset)
            fo = imm12 * 4
            if fo in (0xA4, 0xA8):
                hits.setdefault(('LDRw', fo), []).append(pv + off)
        elif op == 0b0011100110 or op == 0b0011100111:  # LDRSB (signed byte)
            fo = imm12
            if fo == 0xA1:
                hits.setdefault(('LDRSB', fo), []).append(pv + off)
        elif op == 0b0011100100:                  # STRB
            fo = imm12
            if fo in (0xA1, 0x1C4):
                hits.setdefault(('STRB', fo), []).append(pv + off)
        elif op == 0b0011100101:                  # LDRB
            fo = imm12
            if fo in (0xA1, 0x1C4):
                hits.setdefault(('LDRB', fo), []).append(pv + off)

out = ['BUILD A — siege field access scan', 'sha256 %s' % sha_so]
for k in sorted(hits, key=lambda k: -len(hits[k])):
    vs = hits[k]
    out.append('\n== %s [0x%x]: %d hit(s) ==' % (k[0], k[1], len(vs)))
    fns = {}
    for v in vs:
        nm, st = name_of(v)
        fns.setdefault((nm, st), []).append(v)
    for (nm, st), ss in sorted(fns.items()):
        out.append('   %-90s @0x%x  sites: %s' % (nm[:90], st, ','.join(hex(x) for x in ss)))

# full disasm of enclosing functions of WRITE sites on siege_stage/siegeTick/siegeAfterWalkTick
WRITE_KEYS = [('STRB', 0xA1), ('STRw', 0xA4), ('STRw', 0xA8), ('STRB', 0x1C4)]
write_starts = set()
for k in WRITE_KEYS:
    for v in hits.get(k, []):
        write_starts.add(fn_start(v))

def disasm(va, end_va):
    o = va2off(va)
    res = []
    if o is None:
        return ['  <unmapped>']
    for ins in md.disasm(data[o:o + (end_va - va)], va):
        line = '  0x%x: %-8s %s' % (ins.address, ins.mnemonic, ins.op_str)
        if ins.mnemonic == 'bl':
            t = ins.operands[0].imm if ins.operands and ins.operands[0].type == 2 else None
            if t is not None:
                nm, _ = name_of(t)
                line += '   ; -> %s' % nm[:80]
        res.append(line)
    return res

def next_fn(va):
    idx = bisect.bisect_right(fn_rvas, va)
    return fn_rvas[idx] if idx < len(fn_rvas) else va + 0x4000

out.append('\n\n== FULL DISASSEMBLY of write-site enclosing functions ==')
MAXDUMP = 6000
for st in sorted(write_starts):
    end = next_fn(st)
    size = end - st
    nm = fn_name.get(st, 'sub_%x' % st)
    out.append('\n---- %s @ 0x%x .. 0x%x (%d bytes) ----' % (nm[:110], st, end, size))
    if size > MAXDUMP:
        # dump windows around each write site of this function
        for k in WRITE_KEYS:
            for v in hits.get(k, []):
                if fn_start(v) == st:
                    out.append('  ...window around 0x%x...' % v)
                    out += disasm(v - 0x60, v + 0x90)
    else:
        out += disasm(st, end)

open(OUT, 'w').write('\n'.join(out) + '\n')
print('wrote', OUT, file=sys.stderr)
for k in sorted(hits, key=lambda k: -len(hits[k])):
    print(k, len(hits[k]))
