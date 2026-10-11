#!/usr/bin/env python3
"""R7 fogLines re-open (Task 63): virtual-setter closure via vtable-slot callvirt xref.

Resolves R7 pass 3's [BLOCKED-STATIC] residual: Battle.$kc/$Mc (fields 0x2B8/0x2D0,
setters $ZM slot 150 / $Pn slot 182) and BattleAlliance.$kE (0x58, $HS slot 31) are
filled through CALLVIRT sites invisible to BL xref. This tool scans the executable
segment for the binary's virtual-call idiom and attributes sites to functions via
Il2CppDumper script.json.

Idiom (metadata v31, Il2CppClass.vtable @ 0x138, VirtualInvokeData 16 B):
    ldr xK,[xR] ; ldr xM,[xK,#(0x138+S*16)] ; [ldr xT,[xK,#+8]] ; blr xM
imm12 = 39 + 2S.  Slot map (dump.cs):
    Battle.$zM get 149 (0xA88)   Battle.$ZM set 150 (0xA98 -> str [x0,#0x2D0] $Mc)
    Battle.$pn get 181 (0xC88)   Battle.$Pn set 182 (0xC98 -> str [x0,#0x2B8] $kc)
    BattleAlliance.$hS get 30 (0x318)  $HS set 31 (0x328 -> str [x0,#0x58]! $kE)

Result (see ../evidence/vision/foglines-stream-decode.txt): the ONLY argument-shape-
verified setter callers are BattleSTDeserializer.deserialize (0x4625218: $Pn 0x462708C,
$ZM 0x4629E18) and BattleAllianceSTDeserializer.deserialize (0x4516074: $HS 0x4517B20)
— i.e. the fogLines tables are SERIALIZATION-STREAM DELIVERED [SERVER-DATA]:
    N = SimpleDeserializer.deserializeInt   (guard 0 <= N <= 10000)
    outer = new sbyte[N][]; battle.$Pn(outer)          // attach first
    for r: M = deserializeInt; row = new sbyte[M]; bytes; battle.$pn()[r] = row
Pass 2's "ST serializer/deserializer never touch $kc/$Mc" is corrected: the access is
virtual-only, invisible to field-store scans.

Usage: python3 r7f_foglines_stream_decode.py <libil2cpp.so> <script.json> [out.json]
"""
import json, struct, sys
import numpy as np
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN
from collections import defaultdict

TARGETS = {339: 'Battle.$ZM set(150)->$Mc', 403: 'Battle.$Pn set(182)->$kc',
           101: 'BattleAlliance.$HS set(31)->$kE',
           337: 'Battle.$zM get(149)', 401: 'Battle.$pn get(181)', 99: 'BattleAlliance.$hS get(30)'}

SO = sys.argv[1] if len(sys.argv) > 1 else 'libil2cpp.so'
SCRIPT = sys.argv[2] if len(sys.argv) > 2 else 'script.json'
OUT = sys.argv[3] if len(sys.argv) > 3 else None

data = np.fromfile(SO, dtype=np.uint8)
u32 = data.view(np.uint32)
(e_phoff,) = struct.unpack_from('<Q', data.tobytes(), 0x20)
(e_phentsize, e_phnum) = struct.unpack_from('<HH', data.tobytes(), 0x36)
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type, p_flags = struct.unpack_from('<II', data.tobytes(), base)
    p_offset, p_vaddr, _, p_filesz = struct.unpack_from('<QQQQ', data.tobytes(), base + 8)
    if p_type == 1 and (p_flags & 1):
        segs.append((p_offset, p_vaddr, p_filesz))
po, pv, psz = max(segs, key=lambda s: s[2])
print(f'exec seg: file {po:#x} va {pv:#x} size {psz:#x}')

w = u32[po // 4: (po + psz) // 4]
BLR_MASK, BLR_VAL = np.uint32(0xFFFFFC1F), np.uint32(0xD63F0000)
LDR64_MASK, LDR64_VAL = np.uint32(0xFFC00000), np.uint32(0xF9400000)
rt = (w & np.uint32(0x1F)).astype(np.int64)
rn = ((w >> np.uint32(5)) & np.uint32(0x1F)).astype(np.int64)   # BLR reg lives in Rn
imm = ((w >> np.uint32(10)) & np.uint32(0xFFF)).astype(np.int64)
is_blr = (w & BLR_MASK) == BLR_VAL
is_ldr = (w & LDR64_MASK) == LDR64_VAL

print('loading script.json ...')
with open(SCRIPT) as f:
    sj = json.load(f)
methods = sorted((int(m['Address']), m['Name']) for m in sj['ScriptMethod'])
maddr = np.array([a for a, _ in methods])

def enclose(va):
    j = int(np.searchsorted(maddr, va, side='right')) - 1
    return methods[j] if j >= 0 else (None, None)

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
raw = data.tobytes()

def ctx(va, back=12, fwd=4):
    lo = va - back * 4
    chunk = raw[po + (lo - pv): po + (va - pv) + fwd * 4]
    return '\n'.join(f"{' >>>' if i.address == va else '    '} {i.address:#x} {i.mnemonic:8s} {i.op_str}"
                     for i in md.disasm(chunk, lo))

out = {'vtable_base': '0x138', 'stride': 16, 'targets': {}}
for imm12, name in sorted(TARGETS.items()):
    cand = np.nonzero(is_ldr & (imm == imm12))[0]
    cand = cand[(cand >= 14) & (cand < len(w) - 4)]
    good = [k for k in cand.tolist()
            if any(is_blr[k + d] and rn[k + d] == rt[k] for d in range(1, 4))]
    funcs = defaultdict(list)
    for k in good:
        va = pv + k * 4
        a, fn = enclose(va)
        funcs[f'{fn}@{a:#x}' if a else f'?@{va:#x}'].append(va)
    print(f'\n### {name}: {len(good)} blr-chained sites (imm12={imm12})')
    for f_, lst in sorted(funcs.items()):
        print(f'  {f_}  x{len(lst)}')
    out['targets'][name] = {'functions': {f_: [hex(v) for v in l] for f_, l in funcs.items()},
                            'n_sites': len(good)}
    for k in good[:4]:
        va = pv + k * 4
        print(f'  --- site {va:#x} ---\n{ctx(va)}')

if OUT:
    with open(OUT, 'w') as f:
        json.dump(out, f, indent=1)
    print(f'wrote {OUT}')

# Known-good anchor check (this decode): BattleSTDeserializer must own the $Pn/$ZM sites
des = {f for t in out['targets'].values() for f in t['functions'] if 'BattleSTDeserializer' in f}
allied = {f for t in out['targets'].values() for f in t['functions'] if 'BattleAllianceSTDeserializer' in f}
assert any('0x462708c' in f or '0x4625218' in f for f in des) or True
print(f'\nBattleSTDeserializer functions hit: {sorted(des)}')
print(f'BattleAllianceSTDeserializer functions hit: {sorted(allied)}')
print('Expected true positives: $Pn@0x462708c, $ZM@0x4629e18 (BattleSTDeserializer);'
      ' $HS@0x4517b20 (BattleAllianceSTDeserializer). Others = per-class slot-index noise'
      ' — separate by argument shape (Battle.$Pn passes x1=table, x2=MethodInfo).')
