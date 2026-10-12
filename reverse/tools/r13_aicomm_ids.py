#!/usr/bin/env python3
"""R13 residual — AIComm.get_Type id register decode.

Each AIComm subclass overrides get_Type (slot 4). Bodies are obfuscated:
  ldr  w8, [holder_statics, #OFF]   ; Obfuz ConstFieldHolder pool value
  mul  w0, w8, MULT                 ; (movz/movk odd multiplier)
  ret
id = (pool[OFF] * MULT) mod 2^32, decoded offline from the committed
reverse/evidence/obfuz/obfuz-pool-values.json table.
"""
import re, struct, json, hashlib
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
SO_SHA = '8ace05bb'
DUMP = '/home/z/my-project/aow3-extract/dump.cs'
POOL_JSON = '/home/z/my-project/aow3-repo/reverse/evidence/obfuz/obfuz-pool-values.json'

data = open(SO, 'rb').read()
assert hashlib.sha256(data).hexdigest().startswith(SO_SHA)
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

pool = {e['target']: e['value'] for e in json.load(open(POOL_JSON)) if e.get('thunk') == 'int'}

lines = open(DUMP).readlines()
md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
cur = None
res = []
for i, l in enumerate(lines[431700:437600], start=431700):
    m = re.match(r'\s*public (?:abstract |sealed )?class (\S+).*', l)
    if m and 'TypeDefIndex' in l: cur = m.group(1)
    if 'override int get_Type()' in l and cur and (cur.startswith('AIComm') or 'Desync' in cur or 'BattleLogic' in cur):
        rva = None
        for k in range(1, 4):
            m2 = re.search(r'RVA: (0x[0-9A-F]+)', lines[i-k])
            if m2: rva = int(m2.group(1), 16); break
        res.append((cur, rva))

def u32(u): return u & 0xFFFFFFFF
def s32(u): return u - 2**32 if u >= 2**31 else u

print(f'{"class":45s} {"pool_off":>9s} {"pool_val":>12s} {"op":>5s} {"operand":>12s} {"id(s32)":>13s} {"id(u32)":>12s}')
ids = {}
for c, rva in res:
    if not rva or rva == -1: continue
    o = va2off(rva)
    if o is None: continue
    code = data[o:o+0x80]
    ins = list(md.disasm(code, rva))
    # locate the final value insn feeding w0: mul/add/ldr/mov
    poff = mult = poff2 = None; addform = False
    val_k = None
    for k, x in enumerate(ins):
        if x.mnemonic in ('mul', 'add', 'eor', 'sub', 'orr') and re.match(r'w0, w\d+, w\d+$', x.op_str):
            val_k = k; addform = x.mnemonic
        elif x.mnemonic == 'ldr' and x.op_str.startswith('w0,') and '[' in x.op_str:
            val_k = k; addform = 'ldr'
        elif x.mnemonic in ('mov', 'movz') and x.op_str.startswith('w0, #'):
            val_k = k; addform = False
    if val_k is None:
        poff = None
    else:
        x = ins[val_k]
        if x.op_str.startswith('w0, #'):
            poff = -1; mult = int(x.op_str.split('#')[1].split(',')[0], 0)
        elif x.mnemonic == 'ldr':
            m2 = re.search(r'#(0x[0-9a-f]+|\d+)\]', x.op_str)
            poff = int(m2.group(1), 0); mult = 1
        else:
            _, a, b = [q.strip() for q in x.op_str.split(',')]
            for rn in (a, b):
                got_pool = got_imm = None
                for j in range(val_k-1, -1, -1):
                    y = ins[j]
                    if y.mnemonic == 'ldr' and y.op_str.startswith(rn + ',') and '[' in y.op_str:
                        m2 = re.search(r'#(0x[0-9a-f]+|\d+)\]', y.op_str)
                        if m2: got_pool = int(m2.group(1), 0)
                        break
                    if y.mnemonic in ('movz', 'mov') and y.op_str.startswith(rn + ', #'):
                        v = int(y.op_str.split('#')[1].split(',')[0], 0)
                        got_imm = (got_imm or 0) | v
                        continue
                    if y.mnemonic == 'movk' and y.op_str.startswith(rn + ', #'):
                        v = int(y.op_str.split('#')[1].split(',')[0], 0)
                        sh = int(y.op_str.split('lsl')[-1].strip().lstrip('#'), 0) if 'lsl' in y.op_str else 0
                        got_imm = (got_imm or 0) | (v << sh)
                        continue
                    if y.op_str.startswith(rn + ',') or y.op_str.endswith(', ' + rn):
                        break
                if got_pool is not None:
                    if poff is None: poff = got_pool
                    else: poff2 = got_pool
                if got_imm is not None: mult = got_imm
    if poff is None:
        print(f'{c:45s} (no pool load)')
        continue
    pv = pool.get(poff)
    if poff == -1:
        idx = u32(mult)
        pv = mult  # display
    elif poff2 is not None:
        pv2 = pool.get(poff2)
        if pv is None or pv2 is None:
            print(f'{c:45s} pool[{hex(poff)}]={pv} op pool[{hex(poff2)}]={pv2} (incomplete)')
            continue
        opmap = {'mul': lambda a, b: a * b, 'add': lambda a, b: a + b,
                 'eor': lambda a, b: a ^ b, 'sub': lambda a, b: a - b,
                 'orr': lambda a, b: a | b}
        op = addform if isinstance(addform, str) and addform in opmap else 'add'
        idx = u32(opmap[op](pv, pv2))
    elif mult is None or pv is None:
        print(f'{c:45s} pool[{hex(poff)}]={pv} mult={mult} (incomplete)')
        continue
    elif addform == 'ldr':
        idx = u32(pv)
    else:
        opmap = {'mul': lambda a, b: a * b, 'add': lambda a, b: a + b,
                 'eor': lambda a, b: a ^ b, 'sub': lambda a, b: a - b,
                 'orr': lambda a, b: a | b}
        idx = u32(opmap[addform](pv, mult if mult is not None else 0))
    ids[c] = s32(idx)
    opd = hex(mult) if isinstance(mult, int) else str(mult)
    print(f'{c:45s} {hex(poff):>9s} {pv if pv is not None else -1:>12d} {opd:>12s} {s32(idx):>13d} {idx:>12d}')

# order ids by value to expose the enum register
print()
print('sorted by id:')
for c, v in sorted(ids.items(), key=lambda kv: kv[1]):
    print(f'  {v:>8d}  {c}')
json.dump(ids, open('/home/z/my-project/aow3-repo/reverse/evidence/commands/r13-aicomm-type-ids.json', 'w'), indent=1)
print('\nwrote reverse/evidence/commands/r13-aicomm-type-ids.json')
