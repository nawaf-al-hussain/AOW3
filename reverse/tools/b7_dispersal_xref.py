#!/usr/bin/env python3
"""B7 pass 2 Part C — receiver-verified whole-binary callvirt xref for the Unit
dispersal accessors (slots 61-66) and the wait/walk setters (300/302).

Kills the two known FP classes from earlier passes:
  - class-init idiom / statics-base collisions (ldr [x?,#off] on klass objects)
  - slot collisions (same imm12 on other classes) via receiver provenance:
    the x0 at blr must trace to the function's x1-chain (Unit arg) or to a
    unit-field load ([u,#0x88] obj / [u,#0x120] dispersal / [u,#0x128] prev).
Value traces for verified setters use the v3 tracer (pool constants folded).
"""
import bisect, datetime, hashlib, json, re, struct, sys
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO_SHA = '8ace05bbaa2cdfda'
SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
SJ = '/home/z/my-project/aow3-extract/icd-out/script.json'
OUT = '/home/z/my-project/aow3-repo/reverse/evidence/movement/b7-dispersal-xref.txt'

VT_BASE = 0x138
SLOTS = {61:('get_Dispersal','g'),62:('set_Dispersal','s'),
         63:('get_DispersalPrev','g'),64:('set_DispersalPrev','s'),
         65:('get_DispersalBuId','g'),66:('set_DispersalBuId','s'),
         300:('set_WaitForMoving','s'),302:('set_WalkState','s')}
POOL_VAL = {0x4:-1691519837,0x8:0,0xC:2197149770,0x10:2197149771,0x14:3,0x34:2,0x64:8,0x80:5,0x85C:1,0x860:4}
SLOTS_OFF = {VT_BASE + 16*s: s for s in SLOTS}

data = open(SO, 'rb').read()
sha = hashlib.sha256(data).hexdigest()
assert sha.startswith(SO_SHA)
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs, exec_ranges = [], []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt, fl = struct.unpack_from('<II', data, b)
    po, pv = struct.unpack_from('<QQ', data, b + 8)
    fs, fm = struct.unpack_from('<QQ', data, b + 32)
    if pt == 1:
        segs.append((po, pv, fs, fl))
        if fl & 1: exec_ranges.append((po, pv, fs))
def va2off(va):
    for po, pv, fs, fl in segs:
        if pv <= va < pv + fs: return va - pv + po
def off2va(o):
    for po, pv, fs in exec_ranges:
        if po <= o < po + fs: return o - po + pv
sj = json.load(open(SJ))
names = {m['Address']: m['Name'] for m in sj['ScriptMethod']}
all_addrs = sorted(names.keys())
def fn_of(va):
    k = bisect.bisect_right(all_addrs, va) - 1
    return all_addrs[k] if k >= 0 else None
def fn_size(va):
    k = bisect.bisect_right(all_addrs, va)
    if k < len(all_addrs) and all_addrs[k] > va:
        return min(all_addrs[k] - va, 0x12000)
    return 0x12000

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
def regname(r):
    r = r.lower()
    return ('x' + r[1:]) if r.startswith('w') else r

# ---- numpy word scan for ldr xM,[xK,#off] ----
words = np.frombuffer(data, dtype=np.uint32)
mask = np.uint32(0xFFFFFC00)
site_index = {}   # va -> slot
for s, (nm, kind) in SLOTS.items():
    off = VT_BASE + 16*s
    word = np.uint32(0xF9400000 | ((off // 8) << 10))
    idx = np.nonzero((words & mask) == word)[0]
    n = 0
    for k in idx:
        va = off2va(int(k)*4)
        if va is not None:
            site_index[va] = s; n += 1
    print(f'slot {s} {nm}: {n} raw ldr sites')

# group by containing function
fn_sites = {}
for va, s in site_index.items():
    fn_sites.setdefault(fn_of(va), []).append(va)
print(f'{len(fn_sites)} candidate functions')

unit_regs_cache = {}
def unit_regs_of(fva):
    if fva in unit_regs_cache: return unit_regs_cache[fva]
    insns = disasm_fn(fva)
    regs, br = {'x1'}, {'x0'}
    for ins in insns:
        if ins.mnemonic in ('bl','blr'):
            regs.discard('x0'); br.discard('x0'); continue
        if ins.mnemonic == 'mov':
            parts = [p.strip() for p in ins.op_str.split(',')]
            if len(parts) == 2 and re.fullmatch(r'x\d+', parts[0]):
                d, s0 = parts[0], parts[1]
                if s0 in regs and d != 'x0': regs.add(d)
                if s0 in br and d != 'x0': br.add(d)
                if s0 in regs and d == 'x0': regs.add('x0')
                elif s0 in br and d == 'x0': br.add('x0')
    unit_regs_cache[fva] = (regs, br, insns)
    return unit_regs_cache[fva]

_dis_cache = {}
def disasm_fn(fva):
    if fva in _dis_cache: return _dis_cache[fva]
    sz = fn_size(fva); o = va2off(fva)
    ins = list(md.disasm(data[o:o+sz], fva))
    _dis_cache[fva] = ins
    return ins

def trace(insns, i, reg, depth=0):
    if depth > 6: return f'@depth({reg})'
    rl = regname(reg)
    for j in range(i - 1, max(i - 90, -1), -1):
        ins = insns[j]; m = ins.mnemonic; ops = ins.op_str
        parts = [p.strip() for p in ops.split(',')]
        dst = regname(parts[0]) if parts else ''
        if m in ('mov','movz','orr','mvn') and dst == rl:
            if len(parts) >= 2 and parts[1].startswith('#'): return parts[1]
            if len(parts) >= 2 and parts[1].lower() in ('wzr','xzr'): return '0'
            if len(parts) >= 2: return f'mov[{trace(insns,j,parts[1],depth+1)}]'
        if m == 'movk' and dst == rl: continue
        if m in ('add','sub','eor','and','orr','mul','lsl','lsr','asr','sdiv') and dst == rl:
            srcs = parts[1:]
            if len(srcs) == 2 and srcs[1].startswith('#'):
                return f'{m}({trace(insns,j,srcs[0],depth+1)},{srcs[1]})'
            if len(srcs) == 2:
                return f'{m}({trace(insns,j,srcs[0],depth+1)},{trace(insns,j,srcs[1],depth+1)})'
        if m == 'ldp':
            p2 = [q.strip() for q in ops.split(',')]
            m2 = re.search(r'\[(x\d+),?\s*#(0x[0-9a-f]+|\d+)\]', ops)
            if m2:
                if regname(p2[0]) == rl: return f'mem[{m2.group(1)},#{m2.group(2)}]'
                if len(p2) > 1 and regname(p2[1]) == rl:
                    return f'mem[{m2.group(1)},#{hex(int(m2.group(2),0)+4)}]'
        if m in ('ldrsb','ldrb','ldr','ldrsw','ldursb') and dst == rl:
            m2 = re.search(r'\[(x\d+),?\s*#(0x[0-9a-f]+|\d+)\]', ops)
            if m2: return f'mem[{m2.group(1)},#{m2.group(2)}]'
            return f'load {ops}'
        if m == 'blr': return f'{rl}=callret'
        if m == 'bl':
            try:
                t = int(ops.lstrip('#'), 16); nm = names.get(t)
                if nm: return f'{rl}={nm.split("$$$")[-1][:36]}()'
            except ValueError: pass
        if dst == rl and m not in ('cmp','cbz','cbnz','tbnz','tbz','adr'):
            return f'{rl} redef({m})'
    return f'{rl}:undef'

def simplify(v):
    if not isinstance(v, str): return v
    m = re.fullmatch(r'eor\(mem\[x\d+,#(0x[0-9a-f]+)\],mem\[x\d+,#(0x[0-9a-f]+)\]\)', v)
    if m:
        a, b = int(m.group(1),0), int(m.group(2),0)
        if a in POOL_VAL and b in POOL_VAL:
            return f'POOL[{hex(a)}]^POOL[{hex(b)}] = {POOL_VAL[a]^POOL_VAL[b]}'
    m = re.fullmatch(r'mul\(mem\[x\d+,#(0x[0-9a-f]+)\],mem\[x\d+,#(0x[0-9a-f]+)\]\)', v)
    if m:
        a, b = int(m.group(1),0), int(m.group(2),0)
        if a in POOL_VAL and b in POOL_VAL:
            prod = (POOL_VAL[a]*POOL_VAL[b]) & 0xFFFFFFFF
            return f'POOL[{hex(a)}]*POOL[{hex(b)}] = {prod}'
    return v

out = []
def P(s=''): out.append(s)
P(f'B7 pass 2 Part C — receiver-verified whole-binary xref, dispersal + walk/wait setters')
P(f'({datetime.date.today().isoformat()}) so={sha[:16]}… PIN MATCH')
P('')
verified = {s: [] for s in SLOTS}
fps = {s: 0 for s in SLOTS}
for fva, vas in sorted(fn_sites.items(), key=lambda kv: -len(kv[1])):
    fname = names.get(fva, hex(fva) if fva else '?')
    if fva is None: continue
    regs, br, insns = unit_regs_of(fva)
    idx_of = {ins.address: k for k, ins in enumerate(insns)}
    for va in vas:
        k = idx_of.get(va)
        if k is None: continue   # ldr not at an insn boundary (mid-instruction) — skip
        m2 = re.search(r'\[(x\d+),\s*#(0x[0-9a-f]+)\]', insns[k].op_str)
        if not m2: continue
        s = SLOTS_OFF.get(int(m2.group(2), 0))
        if s is None: continue
        nm, kind = SLOTS[s]
        # find blr xM within +8, method-ptr load (x2 setter / x1 getter)
        mreg = insns[k].op_str.split(',')[0]
        blr_k = None; mptr = None
        for j in range(k+1, min(k+9, len(insns))):
            pj = insns[j]
            if pj.mnemonic == 'blr' and pj.op_str.strip() == mreg:
                blr_k = j; break
            if pj.mnemonic == 'ldr':
                m3 = re.search(r'^(x\d+), \[x\d+, #(0x[0-9a-f]+)\]', pj.op_str)
                if m3 and int(m3.group(2),0) == VT_BASE + 16*s + 8:
                    mptr = m3.group(1)
        if blr_k is None: continue
        # receiver
        recv = None; field_recv = None
        for j in range(blr_k-1, max(blr_k-14, -1), -1):
            pj = insns[j]
            if pj.mnemonic in ('blr','bl'): break
            if pj.mnemonic == 'mov':
                p2 = [q.strip() for q in pj.op_str.split(',')]
                if p2[0] == 'x0' and len(p2) == 2:
                    recv = p2[1]; break
            if pj.mnemonic == 'ldr':
                m4 = re.search(r'^x0, \[(x\d+), #(0x[0-9a-f]+)\]', pj.op_str)
                if m4 and m4.group(1) in regs and m4.group(2) in ('0x88','0x120','0x128'):
                    field_recv = m4.group(2); recv = f'unit.fld{m4.group(2)}'; break
        ok = (recv in regs) if recv else False
        if ok or field_recv:
            val = ''
            if mptr == 'x2' and kind == 's':
                val = '  VALUE=' + str(simplify(trace(insns, blr_k, 'x1')))
            verified[s].append((va, fname, 'unit-arg' if ok else f'unit-field{field_recv}', mptr, val))
            P(f'Verified slot {s} {nm} @0x{va:X} in {fname} recv={recv}{val}')
        else:
            fps[s] += 1
P('')
P('## SUMMARY')
P('')
for s, (nm, kind) in SLOTS.items():
    P(f'slot {s} {nm}: {len(verified[s])} verified sites, {fps[s]} receiver-unverified')
P('')
P('## VERIFIED SITES (full list)')
P('')
for s, (nm, kind) in sorted(SLOTS.items()):
    P(f'--- slot {s} {nm} ---')
    for va, fname, recv, mptr, val in verified[s]:
        P(f'  0x{va:X}  {fname}  recv={recv} mptr={mptr}{val}')
open(OUT, 'w').write('\n'.join(out) + '\n')
print(f'wrote {OUT} ({len(out)} lines)')
for s, (nm, kind) in SLOTS.items():
    print(f'slot {s} {nm}: {len(verified[s])} verified / {fps[s]} unverified')
