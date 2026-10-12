#!/usr/bin/env python3
"""B7 pass 2 v3 — value domains for wait_for_moving / walk_state / forced / dispersal.

v3 corrections over v2 (which superseded the v1 direct-store approach):
  1. PROVENANCE: unit_regs = {x1} for (Battle,Unit) anchors, grown by mov chains;
     x0 is dropped after every bl/blr (clobbered -> call return, not a Unit).
     battle_regs = {x0} likewise — direct [reg,#off] loads are only annotated as
     Unit fields for unit-traced regs; battle-traced regs annotate Battle+off.
     Invariant enforced: *Act classes cannot touch Unit's private fields
     directly (C# access), so direct [unitreg,#0xB9/0xE4] in *Act bodies that
     survive the class-init filter are treated as OTHER-class collisions
     (recorded, not claimed).
  2. SHAPE: a callvirt site is classified by the OBSERVED method-pointer
     register: x2 -> setter (value in x1), x1 -> getter-shaped. A getter-shaped
     call on a Unit-traced receiver at a setter slot is recorded as a
     SLOT-COLLISION FP (pass-1 traffic-map corrections fall out of this).
  3. VALUE TRACE: w/x width normalized; binop chains (eor/and/orr/mul/add/sub,
     reg+imm) resolved recursively against the pool-constant map where known.
  4. Dispersal: Unit slots 61-66 (Dispersal/Prev/BuId), Fraction slots 161/162
     (DispersalTick/ApproachGroupAmount) — anchor scan + whole-.text word scan
     for the Fraction scheduler.
Output: evidence file with per-site tables + domain summary.
"""
import bisect, datetime, hashlib, json, re, struct
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO_SHA = '8ace05bbaa2cdfda'
SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
SJ = '/home/z/my-project/aow3-extract/icd-out/script.json'
OUT = '/home/z/my-project/aow3-repo/reverse/evidence/movement/b7-value-domains.txt'

VT_BASE = 0x138
SLOTS = {61:('get_Dispersal','g'),62:('set_Dispersal','s'),
         63:('get_DispersalPrev','g'),64:('set_DispersalPrev','s'),
         65:('get_DispersalBuId','g'),66:('set_DispersalBuId','s'),
         101:('get_Forced','g'),102:('set_Forced','s'),
         299:('get_WaitForMoving','g'),300:('set_WaitForMoving','s'),
         301:('get_WalkState','g'),302:('set_WalkState','s'),
         303:('get_WalkStateTick','g'),304:('set_WalkStateTick','s')}
FUNC_OFF = {VT_BASE + 16*s: s for s in SLOTS}
# pool constants decoded from the committed obfuz table (evidence/obfuz/obfuz-pool-values.json)
POOL = {0x4:'P4',0x8:'P8',0xC:'P12',0x10:'P16',0x14:'P14=3',0x24:'P24',0x34:'P34=2',0x64:'P64=8',0x80:'P80=5',0x85C:'P85C=1',0x860:'P860=4'}
POOL_VAL = {0x4:-1691519837,0x8:0,0xC:2197149770,0x10:2197149771,0x14:3,0x34:2,0x64:8,0x80:5,0x85C:1,0x860:4}

ANCHORS = [  # (label, rva, unit_entry_reg)  — unit_entry_reg: which arg is the Unit
    ('UnitAct.$cg  (Battle,Unit)',                         0x47FCB0C, 'x1'),
    ('UnitAct.$uG  (Battle,Unit,Dynamic)',                 0x482C59C, 'x1'),
    ('UnitAct.$CG  (Battle,Unit)->bool',                   0x4851D34, 'x1'),
    ('UnitAct.$yG  (Battle,Unit,int)',                     0x480CB44, 'x1'),
    ('BattleAct.$J  (Battle,Unit) orchestration',          0x46692D8, 'x1'),
    ('PathAct.$Qe  (Battle,Unit,int,int,Dynamic)->sbyte',  0x476A73C, 'x1'),
    ('PathAct.$Te  (Battle,Unit,BattleCell,int,int,bool)', 0x4764F44, 'x1'),
    ('PathAct.$Oe  (dispersal writer per census)',         0x4746314, 'x1'),
    ('PathAct.$be  (Battle,Unit)',                         0x474CE70, 'x1'),
    ('PathAct.$ce  (Battle,Unit) walk stepper',            0x47501F0, 'x1'),
    ('UnitAct.$yi  (pass-1 claimed set_WalkState x2)',     0x4889560, 'x1'),
    ('UnitAct.$Ag  (spawn-path; Unit = RETURN value)',     0x47E8D30, None),
]

data = open(SO, 'rb').read()
sha = hashlib.sha256(data).hexdigest()
assert sha.startswith(SO_SHA)
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt, fl = struct.unpack_from('<II', data, b)
    po, pv = struct.unpack_from('<QQ', data, b + 8)
    fs, fm = struct.unpack_from('<QQ', data, b + 32)
    if pt == 1: segs.append((po, pv, fs, fl))
def va2off(va):
    for po, pv, fs, fl in segs:
        if pv <= va < pv + fs: return va - pv + po
def off2va(o):
    for po, pv, fs, fl in segs:
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
        return min(all_addrs[k] - va, 0x9000)
    return 0x9000

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)

def disasm(va, cap=None):
    sz = cap or fn_size(va); o = va2off(va)
    return list(md.disasm(data[o:o+sz], va))

def regname(r):
    r = r.lower()
    return ('x' + r[1:]) if r.startswith('w') else r

callname = [None]

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
            if m == 'movz' and len(parts) >= 4 and parts[2] == 'lsl':
                return parts[1] + '<<' + parts[3].split('#')[-1]
            if len(parts) >= 2: return f'mov[{trace(insns,j,parts[1],depth+1)}]'
        if m == 'movk' and dst == rl: continue
        if m in ('add','sub','eor','and','orr','mul','lsl','lsr','asr','sdiv','madd') and dst == rl:
            srcs = parts[1:]
            if len(srcs) == 2 and srcs[1].startswith('#'):
                return f'{m}({trace(insns,j,srcs[0],depth+1)},{srcs[1]})'
            if len(srcs) == 2:
                return f'{m}({trace(insns,j,srcs[0],depth+1)},{trace(insns,j,srcs[1],depth+1)})'
            if len(srcs) == 3 and m == 'madd':
                return f'madd({trace(insns,j,srcs[0],depth+1)},{trace(insns,j,srcs[1],depth+1)},{trace(insns,j,srcs[2],depth+1)})'
        if m in ('ldrsb','ldrb','ldr','ldrsw','ldursb') and dst == rl:
            m2 = re.search(r'\[(x\d+),?\s*#(0x[0-9a-f]+|\d+)\]', ops)
            if m2: return f'mem[{m2.group(1)},#{m2.group(2)}]'
            return f'load {ops}'
        if m == 'ldp':
            parts2 = [q.strip() for q in ops.split(',')]
            if len(parts2) >= 3 and regname(parts2[0]) == rl:
                m2 = re.search(r'\[(x\d+),?\s*#(0x[0-9a-f]+|\d+)\]', ops)
                if m2: return f'mem[{m2.group(1)},#{m2.group(2)}]'
            if len(parts2) >= 3 and regname(parts2[1]) == rl:
                m2 = re.search(r'\[(x\d+),?\s*#(0x[0-9a-f]+|\d+)\]', ops)
                if m2:
                    off2 = int(m2.group(2), 0) + 4
                    return f'mem[{m2.group(1)},#{hex(off2)}]'
        if m in ('ldr','ldrsw') and dst == rl:
            m2 = re.search(r'\[(x\d+),?\s*#(0x[0-9a-f]+|\d+)\]', ops)
            if m2: return f'mem[{m2.group(1)},#{m2.group(2)}]'
        if m == 'blr':
            return f'{rl}=callret'
        if m == 'bl':
            nm = callname[0](j) if callname[0] else None
            if nm: return f'{rl}={nm}()'
        if dst == rl and m not in ('cmp','cbz','cbnz','tbnz','tbz','adr'):
            return f'{rl} redef({m})'
    return f'{rl}:undef'

def simplify(v):
    """Fold known pool constants into readable forms."""
    if not isinstance(v, str): return v
    m = re.fullmatch(r'eor\(mem\[x\d+,#(0x[0-9a-f]+)\],mem\[x\d+,#(0x[0-9a-f]+)\]\)', v)
    if m:
        a, b = int(m.group(1), 0), int(m.group(2), 0)
        if a in POOL_VAL and b in POOL_VAL:
            xor = POOL_VAL[a] ^ POOL_VAL[b]
            return f'POOL[{hex(a)}]^POOL[{hex(b)}] = {xor}'
    m = re.fullmatch(r'mul\(mem\[x\d+,#(0x[0-9a-f]+)\],mem\[x\d+,#(0x[0-9a-f]+)\]\)', v)
    if m:
        a, b = int(m.group(1), 0), int(m.group(2), 0)
        if a in POOL_VAL and b in POOL_VAL:
            prod = (POOL_VAL[a] * POOL_VAL[b]) & 0xFFFFFFFF
            return f'POOL[{hex(a)}]*POOL[{hex(b)}] = {prod} (as int32: {prod-2**32 if prod>=2**31 else prod})'
    return v

out = []
def P(s=''): out.append(s)

P(f'B7 pass 2 v3 — wait/walk/forced/dispersal VALUE DOMAINS ({datetime.date.today().isoformat()})')
P(f'so={sha[:16]}… PIN MATCH. Shape-filtered callvirt (receiver Unit-traced; method-ptr reg')
P('x2=setter/x1=getter-shaped); x0 dropped after every call (clobber); pool consts from')
P('reverse/evidence/obfuz/obfuz-pool-values.json (P4=-1691519837, P8=0, P12=2197149770, P16=2197149771,')
P('P14=3, P34=2, P64=8, P80=5, P85C=1, P860=4 — P12^P16=1, P4*P8=0).')
P('')

domains = {}
def record(fkey, name, kind, addr, value=None):
    d = domains.setdefault((fkey, name), {'s': [], 'g': [], 'fp': []})
    if kind == 's': d['s'].append((hex(addr), value))
    elif kind == 'g': d['g'].append(hex(addr))
    else: d['fp'].append(hex(addr))

for label, va, uentry in ANCHORS:
    insns = disasm(va)
    fkey = label.split()[0].rstrip(':')
    # per-function call-name resolver for trace(): bl name, or callvirt slot name
    _sites_tmp = {}
    for _i, _ins in enumerate(insns):
        if _ins.mnemonic == 'blr':
            _mr = _ins.op_str.strip()
            for _j in range(_i-1, max(_i-10, -1), -1):
                _pj = insns[_j]
                if _pj.mnemonic == 'blr': break
                if _pj.mnemonic == 'ldr' and _pj.op_str.startswith(_mr + ','):
                    _m2 = re.search(r'\[(x\d+),\s*#(0x[0-9a-f]+)\]', _pj.op_str)
                    if _m2 and int(_m2.group(2), 0) in FUNC_OFF:
                        _sites_tmp[_i] = FUNC_OFF[int(_m2.group(2), 0)]
                    break
    def _cn(j):
        ins = insns[j]
        if ins.mnemonic == 'bl':
            try:
                t = int(ins.op_str.lstrip('#'), 16)
                nm = names.get(t)
                if nm: return nm.split('$$$')[-1][:40]
            except ValueError: pass
            return None
        if ins.mnemonic == 'blr' and j in _sites_tmp:
            return SLOTS[_sites_tmp[j]][0] + '()'
        return None
    callname[0] = _cn
    P('#' * 78)
    P(f'### {label} @0x{va:X} ({len(insns)} insns)')
    P('#' * 78)
    unit_regs = {uentry} if uentry else set()
    battle_regs = {'x0'} if uentry else set()
    for k, ins in enumerate(insns):
        if ins.mnemonic in ('bl', 'blr'):
            unit_regs.discard('x0'); battle_regs.discard('x0')
            continue
        if ins.mnemonic == 'mov':
            parts = [p.strip() for p in ins.op_str.split(',')]
            if len(parts) == 2 and re.fullmatch(r'x\d+', parts[0]):
                dst, src = parts[0], parts[1]
                if src in unit_regs and dst != 'x0':
                    unit_regs.add(dst)
                if src in battle_regs and dst != 'x0':
                    battle_regs.add(dst)
                if src in unit_regs and dst == 'x0':
                    unit_regs.add('x0')   # receiver setup — valid until next call
                if src in battle_regs and dst == 'x0':
                    battle_regs.add('x0')
    # class-init idiom addresses
    init_addrs = set()
    for i, ins in enumerate(insns):
        if ins.mnemonic == 'bl':
            try: t = int(ins.op_str.lstrip('#'), 16)
            except ValueError: continue
            if t in (0x3CC7AC8, 0x3CC7948):
                for k in (1, 2, 3, 4):
                    if i-k >= 0 and insns[i-k].mnemonic in ('cbnz','cbz'):
                        init_addrs.update(a.address for a in insns[max(0,i-k-1):i-k+1])
    # callvirt site map: blr index -> (slot, funcptr-load index)
    sites = {}
    for i, ins in enumerate(insns):
        if ins.mnemonic == 'blr':
            mreg = ins.op_str.strip()
            for j in range(i-1, max(i-10, -1), -1):
                pj = insns[j]
                if pj.mnemonic == 'blr': break
                if pj.mnemonic == 'ldr' and pj.op_str.startswith(mreg + ','):
                    m2 = re.search(r'\[(x\d+),\s*#(0x[0-9a-f]+)\]', pj.op_str)
                    if m2 and int(m2.group(2), 0) in FUNC_OFF:
                        sites[i] = (FUNC_OFF[int(m2.group(2), 0)], j)
                    break
    for i, ins in enumerate(insns):
        m, ops = ins.mnemonic, ins.op_str
        ann = ''
        if ins.address in init_addrs:
            ann = '   ; STATICS-INIT idiom'
        elif m == 'blr' and i in sites:
            slot, jload = sites[i]
            name, _kind = SLOTS[slot]
            # method-pointer register: the ldr AFTER the funcptr load with off+8
            mptr = None
            for j in list(range(max(jload-6, 0), jload)) + list(range(jload+1, min(jload+8, len(insns)))):
                pj = insns[j]
                if pj.mnemonic == 'ldr':
                    m3 = re.search(r'^(x\d+), \[x\d+, #(0x[0-9a-f]+)\]', pj.op_str)
                    if m3 and int(m3.group(2), 0) == VT_BASE + 16*slot + 8:
                        mptr = m3.group(1); break
            # receiver provenance: last mov x0, xR before blr (no call between)
            recv = None
            for j in range(i-1, max(i-14, -1), -1):
                pj = insns[j]
                if pj.mnemonic in ('blr','bl'): break
                if pj.mnemonic == 'mov':
                    p2 = [q.strip() for q in pj.op_str.split(',')]
                    if p2[0] == 'x0' and len(p2) == 2:
                        recv = p2[1]; break
            recv_ok = recv in unit_regs if recv else False
            if mptr == 'x2':
                shape = 'SETTER'
                v = simplify(trace(insns, i, 'x1'))
                if recv_ok:
                    record(fkey, name, 's', ins.address, v)
                    ann = f'   ; callvirt {name} [SETTER] UNIT-VERIFIED  VALUE={v}'
                else:
                    record(fkey, name, 'fp', ins.address)
                    ann = f'   ; callvirt {name} [SETTER shape] fp(receiver={recv})'
            elif mptr == 'x1':
                shape = 'GETTER-shaped'
                if recv_ok and _kind == 'g':
                    record(fkey, name, 'g', ins.address)
                    ann = f'   ; callvirt {name} [GETTER] UNIT-VERIFIED'
                else:
                    record(fkey, name, 'fp', ins.address)
                    why = 'getter-shape on setter slot' if _kind == 's' else f'receiver={recv}'
                    ann = f'   ; callvirt slot {slot} [GETTER-shaped] fp({why})'
            else:
                ann = f'   ; callvirt slot {slot} {name} [shape unresolved mptr={mptr}]'
        else:
            if m == 'bl':
                try: t = int(ops.lstrip('#'), 16); nm = names.get(t)
                except ValueError: nm = None
                if nm: ann = f'   ; {nm}'
            if m in ('ldr','str','ldrb','strb','ldrsb','ldur','stur','ldrsw','ldursb','ldp','stp'):
                m2 = re.search(r'\[(x\d+),?\s*#(0x[0-9a-f]+|\d+)\]', ops)
                if m2:
                    base, offi = m2.group(1), int(m2.group(2), 0)
                    if base in init_addrs_regset if False else False:
                        pass
                    elif base in unit_regs and offi in (0xB9, 0xE4, 0xE8, 0x120, 0x128, 0x130, 0xB8):
                        fld = {0xB9:'wait_for_moving',0xE4:'walk_state',0xE8:'walk_state_tick',
                               0x120:'dispersal',0x128:'dispersal_prev',0x130:'dispersal_bu_id',0xB8:'forced'}.get(offi, hex(offi))
                        wr = m in ('str','strb','stur','stp')
                        ann = f'   ; ?direct Unit.{fld} (C#-invariant: suspicious, see note)'
                        d = domains.setdefault((fkey, fld), {'s': [], 'g': [], 'fp': []})
                        (d['s'] if wr else d['g']).append(f'{hex(ins.address)} DIRECT?')
                    elif base in battle_regs and offi in (0xB9, 0xE4, 0xB8):
                        ann = f'   ; Battle+{hex(offi)} field (not Unit)'
        P(f'  0x{ins.address:X}  {m:<8} {ops}{ann}')
    P('')

P('## DOMAIN SUMMARY')
P('')
for (f, fld), d in sorted(domains.items()):
    P(f'{f} :: {fld}')
    for a, v in d['s']:  P(f'    SET @{a}  <- {v}')
    for a in d['g'][:5]: P(f'    GET @{a}')
    if len(d['g']) > 5: P(f'    ... +{len(d["g"])-5} gets')
    for a in d['fp'][:6]: P(f'    FP  @{a}')
    if len(d['fp']) > 6: P(f'    ... +{len(d["fp"])-6} fps')
    P('')

# ---- Part B: whole-.text word scan for the Fraction scheduler (slots 161/162) ----
P('## FRACTION SCHEDULER SCAN — whole-.text sites for Fraction get/set_DispersalTick (161/162)')
P('')
text_words = np.frombuffer(data, dtype=np.uint32)
hits = {}
for s, nm in ((161,'Fraction.get_DispersalTick'), (162,'Fraction.set_DispersalTick'), (163,'Fraction.get_ApproachGroupAmount')):
    imm12 = 39 + 2*s
    word = np.uint32(0xF9400000 | (imm12 << 10))
    mask = np.uint32(0xFFFFFC00)
    idx = np.nonzero((text_words & mask) == word)[0]
    fns = {}
    for k in idx:
        va = off2va(int(k)*4)
        if va is None: continue
        f = fn_of(va)
        fns.setdefault(f, []).append(va)
    hits[nm] = fns
    top = sorted(fns.items(), key=lambda kv: -len(kv[1]))[:10]
    P(f'{nm} (slot {s}): {sum(len(v) for v in fns.values())} raw sites in {len(fns)} fns; top:')
    for f, vas in top:
        P(f'    {names.get(f, hex(f) if f else "?")}  x{len(vas)}')
    P('')

open(OUT, 'w').write('\n'.join(out) + '\n')
print(f'wrote {OUT} ({len(out)} lines)')
print('--- console ---')
for (f, fld), d in sorted(domains.items()):
    sets = [(a, v) for a, v in d['s'] if not isinstance(a, str)]
    print(f'{f} :: {fld}: vsets={len(sets)} gets={len(d["g"])} fps={len(d["fp"])}')
    for a, v in sets[:8]: print(f'    SET @{a} <- {v}')
print('--- fraction scan top fns ---')
for nm, fns in hits.items():
    top = sorted(fns.items(), key=lambda kv: -len(kv[1]))[:5]
    print(nm, '->', [(names.get(f, hex(f))[:60] if f else '?', len(v)) for f, v in top])
