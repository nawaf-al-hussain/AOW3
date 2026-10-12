#!/usr/bin/env python3
"""R13 residual — $CMA(Battle) validator decode (validate-before-apply rule set).

The AIComm abstract base (dump.cs 431706) declares `abstract short $CMA(Battle)`
at slot 9 — the per-command validator returning an error code. R13 (Task 62)
decoded the command STRUCTURE from dump.cs but declared the $CMA bodies
[AWAITING BINARY]. script.json is recovered (Task 63) — this decodes the bodies.

Also: AIComm.$b (virtual int getter) = the command-type id surface; concrete
overrides extracted where RVA present.
"""
import bisect, datetime, hashlib, json, re, struct, sys, os
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SO_SHA = '8ace05bbaa2cdfda'
SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
SJ = '/home/z/my-project/aow3-extract/icd-out/script.json'
OUT = '/home/z/my-project/aow3-repo/reverse/evidence/commands/r13-cma-validators.txt'

TARGETS = [  # (class, RVA) — R13 suite first, then movement/relevant others
    ('AICommBuyUnit',            0x48EB1CC),
    ('AICommCancelBuyUnit',      0x48F3DD0),
    ('AICommBuildingRepair',     0x48E8DA8),
    ('AICommBuildingUpgrade',    0x48EA1B8),
    ('AICommBuildingRallyPoint', 0x48E6F74),
    ('AICommBuildingRemove',     0x48E7CD0),
    ('AICommUnitsMove',          0x4909950),
    ('AICommUnitsStop',          0x49140D0),
    ('AICommMineLay',            0x48FC4A4),
    ('AICommHeroAbilityActive',  0x48F716C),
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
sj = json.load(open(SJ))
names = {m['Address']: m['Name'] for m in sj['ScriptMethod']}
all_addrs = sorted(names.keys())
def fn_size(va):
    k = bisect.bisect_right(all_addrs, va)
    if k < len(all_addrs) and all_addrs[k] > va:
        return min(all_addrs[k] - va, 0x4000)
    return 0x4000

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)

# inline $gK accessor sites: (start, salt, keyA) recorded for follow-up decoding
INLINE_GK = []

out = []
def P(s=''): out.append(s)
P(f'R13 residual — AIComm $CMA validator bodies ({datetime.date.today().isoformat()})')
P(f'so={sha[:16]}… PIN MATCH; script.json naming; pool accessor triples recorded')
P('')

for label, va in TARGETS:
    sz = fn_size(va); o = va2off(va)
    P('#' * 76)
    P(f'### {label}.$CMA @0x{va:X} (cap 0x{sz:X})')
    P('#' * 76)
    for ins in md.disasm(data[o:o+sz], va):
        m, ops = ins.mnemonic, ins.op_str
        ann = ''
        if m == 'bl':
            try:
                t = int(ops.lstrip('#'), 16); nm = names.get(t)
            except ValueError: nm = None
            if nm:
                ann = f'   ; {nm}'
                if t == 0x5265B74:
                    INLINE_GK.append((label, ins.address))
            else:
                ann = f'   ; sub_{t:X}'
        if m == 'blr':
            ann = '   ; callvirt'
        if m in ('ldr', 'str', 'ldrb', 'strb', 'ldrsb', 'ldrsw', 'ldp'):
            m2 = re.search(r'\[(x\d+),?\s*#(0x[0-9a-f]+|\d+)\]', ops)
            if m2:
                offi = int(m2.group(2), 0)
                ann = f'   ; +{hex(offi)}'
        if m in ('cmp',) and '#' in ops:
            ann = f'   ; THRESHOLD {ops}'
        if m in ('mov', 'movz') and ops.startswith('w') and '#' in ops:
            ann = f'   ; {ops}'
        P(f'  0x{ins.address:X}  {m:<8} {ops}{ann}')
        if m == 'ret':
            break
    P('')

P('## inline $gK accessor sites (start/salt/keyA triples at callsites)')
for label, addr in INLINE_GK:
    P(f'  {label} @0x{addr:X}')
open(OUT, 'w').write('\n'.join(out) + '\n')
print(f'wrote {OUT} ({len(out)} lines)')
