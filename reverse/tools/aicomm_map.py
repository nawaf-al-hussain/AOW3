#!/usr/bin/env python3
"""Build E decisive scan.
Part 1: for every AIComm subclass in dump.cs, scan its method range for
  - BL $Hi (0x48178FC) with task-id extraction
  - vtable call shapes: set_Task 0x1018, set_FlagShoot 0x268, set_Obj 0x820,
    set_Forced 0x388, get_Task 0x1008, get_FlagShoot 0x258
Part 2: fire gate — get_Task(vt+0x1008)/get_FlagShoot(vt+0x258) call sites in the
  sim range followed within 10 ins by cmp w?, #N (N collected) / tbz #8 etc.
"""
import struct, re, bisect
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

data = open('/home/z/my-project/aow3-work/native/libil2cpp.so', 'rb').read()
fl = open('/home/z/my-project/aow3-work/native/dump.cs').read().split('\n')
rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_starts, rva2name = [], {}
for i, l in enumerate(fl):
    m = rvapat.match(l.strip())
    if m:
        rva = int(m.group(1), 16)
        if rva > 0:
            fn_starts.append(rva)
            rva2name[rva] = fl[i + 1].strip()[:110]
fn_starts = sorted(set(fn_starts))
fa = np.array(fn_starts, dtype=np.int64)
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt = struct.unpack_from('<I', data, b)[0]
    po, pv = struct.unpack_from('<QQ', data, b + 8)[:2]
    fs = struct.unpack_from('<Q', data, b + 32)[0]
    if pt == 1:
        segs.append((po, pv, fs))

def va2off(va):
    for po, pv, fs in segs:
        if pv <= va < pv + fs:
            return va - pv + po

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = True

# ---- Part 1: AIComm subclasses ----
classes = []
cur = None
for i, l in enumerate(fl):
    mc = re.match(r'public (?:abstract )?class (\S+) : AIComm', l)
    if mc:
        cur = {'name': mc.group(1), 'line': i, 'rvas': []}
        classes.append(cur)
        continue
    if cur is not None:
        m = rvapat.match(l.strip())
        if m:
            rva = int(m.group(1), 16)
            if rva > 0:
                cur['rvas'].append(rva)
        if re.match(r'\}\s*$', l) and cur['rvas']:
            cur = None

out = ['# AIComm order -> task/flag/obj mutation map']
SIG = {'set_Task': 0x1018, 'set_FlagShoot': 0x268, 'set_Obj': 0x820, 'set_Forced': 0x388,
       'get_Task': 0x1008, 'get_FlagShoot': 0x258, 'set_TaskVisual': 0x1048}

def scan_fn(va, end):
    """returns dict of findings in [va,end)"""
    o = va2off(va)
    code = data[o:o + (end - va)]
    ins_l = list(md.disasm(code, va))
    res = {'$Hi': [], 'vt': {}, 'cmp': []}
    for k, ins in enumerate(ins_l):
        if ins.mnemonic == 'bl' and ins.operands[0].imm == 0x48178FC:
            tid = None
            for j in range(k - 1, max(k - 14, 0), -1):
                mm = re.match(r'mov\s+w2, (#\w+|\d+)$', ins_l[j].mnemonic + ' ' + ins_l[j].op_str)
                if mm:
                    tid = int(mm.group(1).lstrip('#'), 0)
                    break
            res['$Hi'].append((ins.address, tid))
        if ins.mnemonic == 'ldr':
            mm = re.match(r'ldr (x\d+), \[x\d+, #(0x[0-9a-f]+)\]$', ins.mnemonic + ' ' + ins.op_str)
            if mm:
                v = int(mm.group(2), 16)
                if v in SIG.values():
                    # confirm blr of same reg within 6
                    for j in range(k + 1, min(k + 7, len(ins_l))):
                        if ins_l[j].mnemonic in ('blr', 'br'):
                            m2 = re.match(r'(?:blr|br) (x\d+)', ins_l[j].mnemonic + ' ' + ins_l[j].op_str)
                            if m2 and m2.group(1) == mm.group(1):
                                name = [n for n, off in SIG.items() if off == v][0]
                                res['vt'].setdefault(name, []).append(ins.address)
                                break
                        if ins_l[j].mnemonic in ('ret',):
                            break
    return res

for c in classes:
    if not c['rvas']:
        continue
    lo, hi = min(c['rvas']), max(c['rvas'])
    # scan each method range separately
    merged = {'$Hi': [], 'vt': {}}
    for k, rva in enumerate(sorted(c['rvas'])):
        nxt = fn_starts[bisect.bisect_right(fn_starts, rva)]
        if nxt - rva <= 0 or nxt - rva > 0x8000:
            continue
        r = scan_fn(rva, nxt)
        merged['$Hi'] += r['$Hi']
        for kk, vv in r['vt'].items():
            merged['vt'].setdefault(kk, []).extend(vv)
    if merged['$Hi'] or merged['vt']:
        parts = []
        if merged['$Hi']:
            parts.append('$Hi->task ' + str([t for _, t in merged['$Hi']]))
        for kk in ('set_Task', 'set_FlagShoot', 'set_Obj', 'set_Forced', 'get_Task', 'get_FlagShoot', 'set_TaskVisual'):
            if kk in merged['vt']:
                parts.append(f'{kk} x{len(merged["vt"][kk])}')
        out.append(f'{c["name"]:34s} {" | ".join(parts)}   [0x{lo:x}..0x{hi:x}]')

# ---- Part 2: fire gate ----
SIM_LO, SIM_HI = 0x4400000, 0x4A00000
out.append('\n# fire gate: get_Task(vt+0x1008) / get_FlagShoot(vt+0x258) call sites + following cmp #N')

def vt_call_sites(vtoff):
    want = 0xF9400000 | ((vtoff // 8) << 10)
    mask = 0xFFFFFC00
    sites = []
    for po, lo, fs in segs:
        hi = lo + fs
        if hi <= SIM_LO or lo >= SIM_HI:
            continue
        clo, chi = max(lo, SIM_LO), min(hi, SIM_HI)
        off = va2off(clo)
        n = (chi - clo) // 4
        words = np.frombuffer(data, dtype='<u4', count=n, offset=off).astype(np.uint32)
        sel = np.nonzero((words & np.uint32(mask)) == np.uint32(want))[0]
        sites += [int(clo + int(i) * 4) for i in sel]
    # confirm blr
    confirmed = []
    for h in sites:
        o = va2off(h)
        ins_l = list(md.disasm(data[o:o + 10 * 4], h))
        m1 = re.match(r'ldr (x\d+),', ins_l[0].mnemonic + ' ' + ins_l[0].op_str)
        for j in range(1, len(ins_l)):
            if ins_l[j].mnemonic in ('blr', 'br', 'ret'):
                m2 = re.match(r'(?:blr|br) (x\d+)', ins_l[j].mnemonic + ' ' + ins_l[j].op_str)
                if m2 and m1 and m2.group(1) == m1.group(1):
                    confirmed.append((h, ins_l[:j + 6]))
                break
    return confirmed

def enclosing(va):
    idx = np.searchsorted(fa, va, side='right') - 1
    if idx < 0:
        return None, '?'
    return int(fa[idx]), rva2name.get(int(fa[idx]), '?')

for vtoff, nm in [(0x1008, 'get_Task'), (0x258, 'get_FlagShoot')]:
    sites = vt_call_sites(vtoff)
    cmpmap = {}
    for h, ins_l in sites:
        tail = ' | '.join(f'{i.mnemonic} {i.op_str}' for i in ins_l[1:])
        m = re.search(r'cmp (w\d+), #(\d+)', tail)
        val = int(m.group(2)) if m else None
        cmpmap.setdefault(val, []).append(h)
    out.append(f'\n## {nm} [vt+{hex(vtoff)}]: {len(sites)} sites; immediate compare values after call:')
    for val in sorted(cmpmap, key=lambda v: (v is None, v if v is not None else 0)):
        addrs = cmpmap[val]
        fns = {}
        for a in addrs:
            e, n = enclosing(a)
            fns.setdefault((e, n), 0)
            fns[(e, n)] += 1
        top = ', '.join(f'[{hex(e)}] {n[:60]} x{c}' for (e, n), c in sorted(fns.items(), key=lambda kv: -kv[1])[:8])
        out.append(f'  cmp #{val}: {len(addrs)} sites   {top}')

open('/home/z/my-project/aow3-work/attack-aicomm-map.txt', 'w').write('\n'.join(out) + '\n')
print('written attack-aicomm-map.txt', len(out), 'lines')
