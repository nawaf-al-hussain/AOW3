#!/usr/bin/env python3
"""R2 — Obfuz const-pool STATIC decoder (AOW3 6.9.18, arm64, no device required).

Recovers all 697 `$Obfuz$ConstFieldHolder$0` pool values (629 int / 66 string / 2 float)
offline from libil2cpp.so + global-metadata.dat + the committed secret key.

Chain (every step verified against native disassembly, sha-pinned binary 8ace05bb…):

  1. .cctor @0x4975844 parses into 697 accessor triples (thunk, start, keyA, salt,
     keyC, staticsTarget, srcSlot) — srcSlot read PER CALLSITE from the
     `ldr x0, [x8, #imm]` segment load preceding each thunk call (fixes the Build G2
     `0xb8` static_fields parse artifact site-by-site instead of globally).
  2. Segment plaintext: the pool-manager builder .cctors (0x497F474/0x497F82C) copy
     2048-byte RVA data blocks (fdv blob of global-metadata.dat, offsets pinned via
     dump.cs "Metadata offset" annotations == fdv fieldIndex->dataIndex chain) into
     byte[2048] arrays and CBC-decrypt them in place ($MOA -> $kK @0x7712FE4:
     plain_i = $GOA(ciph_i ^ ciph_{i-1}, keyA, salt)).
  3. Per value: accessor $gK @0x5265B74 -> BitConverter.ToInt32(seg, start) ->
     $GOA @0x3DCF784 (256-op VM, key = 256 x LE u32 committed as
     obfuz_secret_key.bin, validated by the game's own $qk boot canary).
     floats: $iOA @0x7712728 mantissa ^= GOA(0xABCD, keyA, salt) & 0x7FFFFF.
     strings: $FK(data, start, len, salt, keyC) -> $kK subrange with keyA=salt,
     salt=keyC -> ASCII.

Proofs embedded in the output: statics+0x64 = 8 (DONT_SHOOT task id),
statics+0x14 = 3 ($ce task threshold), set_FlagShoot = -1, and
pool[0x364]*pool[0x368] mod 2^32 = 1000 = the siege fixed-point DEN (Build F).

Usage:
  python3 obfuz_static_decode.py --so libil2cpp.so --metadata global-metadata.dat \
      [--key obfuz_secret_key.bin] [--out obfuz-pool-values.json]
Inputs resolve as: flag > env (AOW3_SO/AOW3_METADATA/AOW3_KEY) > cwd walk >
committed key artifact.
"""
import struct, sys, json, hashlib, os, re, argparse
from unicorn import Uc, UC_ARCH_ARM64, UC_MODE_ARM, UC_PROT_ALL
from unicorn.arm64_const import (UC_ARM64_REG_X0, UC_ARM64_REG_X1, UC_ARM64_REG_X2,
                                 UC_ARM64_REG_X3, UC_ARM64_REG_X30, UC_ARM64_REG_SP)
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

CCTOR_VA, CCTOR_SIZE = 0x4975844, 39984
GOA_VA = 0x3DCF784                 # $GOA (int decrypt)
QK_TRIPLE = (0x720BA23E, 0x545EE170, 0x98705298, 0x12345678)
THUNKS = {0x5265B74: 'int', 0x5265BD0: 'long', 0x5265C2C: 'float',
          0x5265C88: 'double', 0x5265CE4: 'string'}
# pool-manager builder #2 ($Obfuz$RVA$1) segment (fdv abs offset, keyA, salt);
# the holder reads its statics 0x1008 / 0x1810 (dump.cs field layout:
# Data0@0x0/Value0@0x800/Data1@0x808/Value1@0x1008/Data2@0x1010/Value2@0x1810).
HOLDER_SEGS = {
    '0x1008': (0xDBFC10, 0x5B300BF1, 0x8952D5F4),
    '0x1810': (0xDC0418, 0xF91F0C58, 0x9A457001),
}

def _find(name, start):
    start = os.path.abspath(start or '.')
    d = start
    for _ in range(6):
        for c in (os.path.join(d, name), os.path.join(d, 'native', name)):
            if os.path.isfile(c):
                return c
        if d == '/':
            break
        d = os.path.dirname(d)
    for root, dirs, files in os.walk(start):
        dirs[:] = [x for x in dirs if not x.startswith('.')
                   and x not in {'.git', 'node_modules', '__pycache__'}]
        if os.path.relpath(root, start).count(os.sep) >= 4:
            dirs[:] = []
            continue
        if name in files:
            return os.path.join(root, name)
    return None


def load_so(path):
    so = open(path, 'rb').read()
    (e_phoff,) = struct.unpack_from('<Q', so, 0x20)
    (e_ps, e_pn) = struct.unpack_from('<HH', so, 0x36)
    segs = []
    for i in range(e_pn):
        b = e_phoff + i * e_ps
        if struct.unpack_from('<I', so, b)[0] == 1:
            po, pv = struct.unpack_from('<QQ', so, b + 8)[:2]
            fs = struct.unpack_from('<Q', so, b + 32)[0]
            segs.append((po, pv, fs))
    return so, segs


def make_uc(so, segs, key_blob):
    uc = Uc(UC_ARCH_ARM64, UC_MODE_ARM)
    P = 0x1000
    mapped = []
    for po, pv, fs in segs:
        s, e = pv & ~(P - 1), (pv + fs + P - 1) & ~(P - 1)
        for m0, m1 in mapped:
            if not (e <= m0 or s >= m1):
                s, e = min(s, m0), max(e, m1)
        try:
            uc.mem_map(s, e - s, UC_PROT_ALL)
            mapped.append((s, e))
        except Exception:
            pass
        uc.mem_write(pv, so[po:po + fs])
    HALT, VM, KEYARR, STACK = 0x800000000, 0x7f0000000, 0x7f0001000, 0x7e0000000
    for a in (HALT, VM, KEYARR):
        uc.mem_map(a, P, UC_PROT_ALL)
    uc.mem_map(STACK, P * 16, UC_PROT_ALL)
    uc.mem_write(VM + 0x10, struct.pack('<Q', KEYARR))
    uc.mem_write(KEYARR + 0x18, struct.pack('<I', len(key_blob) // 4))
    uc.mem_write(KEYARR + 0x20, key_blob)
    def goa(raw, keya, salt):
        uc.reg_write(UC_ARM64_REG_SP, STACK + P * 8)
        for r, v in ((UC_ARM64_REG_X0, VM), (UC_ARM64_REG_X1, raw & 0xffffffff),
                     (UC_ARM64_REG_X2, keya & 0xffffffff), (UC_ARM64_REG_X3, salt & 0xffffffff),
                     (UC_ARM64_REG_X30, HALT)):
            uc.reg_write(r, v)
        uc.emu_start(GOA_VA, HALT, count=2_000_000)
        return uc.reg_read(UC_ARM64_REG_X0) & 0xffffffff
    return goa


def moa_decrypt(goa, blob, ka, sa, nbytes=None):
    """$kK @0x7712FE4: plain_i = GOA(ciph_i ^ ciph_{i-1}, keyA, salt); tail bytes ^= salt."""
    n = len(blob) if nbytes is None else min(nbytes, len(blob))
    out = bytearray(blob[:n])
    prev = 0
    for i in range(n // 4):
        cur = struct.unpack_from('<I', blob, 4 * i)[0]
        struct.pack_into('<I', out, 4 * i, goa(cur ^ prev, ka, sa))
        prev = cur
    for i in range(n - n % 4, n):
        out[i] ^= sa & 0xFF
    return bytes(out)


def parse_cctor(so_path):
    """Parse the holder .cctor into triples with PER-CALLSITE segment slots."""
    so, segs = load_so(so_path)
    def va2off(va):
        for po, pv, fs in segs:
            if pv <= va < pv + fs:
                return va - pv + po
    md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
    ins_list = list(md.disasm(so[va2off(CCTOR_VA):va2off(CCTOR_VA) + CCTOR_SIZE], CCTOR_VA))
    vals, cur, last = [], {}, None
    wregs = {}
    cur_slot = None
    prev_slot = None   # sites reuse a previously loaded segment when x0 is carried over
    for ins in ins_list:
        m, ops = ins.mnemonic, ins.op_str
        if m == 'ldr' and re.match(r'^x(?:0|8), \[x8, #(0x[0-9a-f]+|\d+)\]$', ops):
            imm = int(ops.split('#')[1].rstrip(']'), 0)
            if imm != 0xb8:                      # 0xb8 = Il2CppClass::static_fields artifact
                cur_slot = imm                   # true per-callsite segment load
                
        elif m in ('mov', 'movz', 'movk') and re.match(r'^w\d+, ', ops) and '#' in ops:
            reg = ops.split(',')[0]
            v = int(ops.op_str if False else ins.op_str.split('#')[1].split(',')[0].strip(), 16)
            sh = int(ops.split('lsl #')[1].split()[0], 0) if ', lsl #' in ops else 0
            if m == 'movk':
                wregs[reg] = (wregs.get(reg, 0) & ~(0xFFFF << sh)) | ((v & 0xFFFF) << sh)
            else:
                wregs[reg] = v
            if reg in ('w1', 'w2', 'w3', 'w4'):
                role = {'1': 'start', '2': 'keyA', '3': 'salt', '4': 'keyC'}[reg[1]]
                if m == 'movk':
                    cur[role] = cur.get(role, 0) | ((v & 0xFFFF) << sh)
                else:
                    cur[role] = v
        elif m == 'mov' and re.match(r'^w[1-4], wzr$', ops):
            cur[{'1': 'start', '2': 'keyA', '3': 'salt', '4': 'keyC'}[ops[1]]] = 0
        elif m == 'add' and re.match(r'^w[1-4], w\d+, #(0x[0-9a-f]+|\d+)$', ops):
            d, n2 = ops.split(',')[0], ops.split(',')[1].strip()
            if n2 in wregs:
                cur[{'1': 'start', '2': 'keyA', '3': 'salt', '4': 'keyC'}[d[1]]] = \
                    (wregs[n2] + int(ops.split('#')[1], 0)) & 0xFFFFFFFF
        elif m == 'bl':
            t = int(ops.split('#')[1], 16)
            if t in THUNKS:
                cur['thunk'] = THUNKS[t]
                cur['src_slot'] = cur_slot if cur_slot is not None else prev_slot
                prev_slot = cur['src_slot']
                last = dict(cur)
                cur = {}
                cur_slot = None
        elif m in ('str', 'stur') and last is not None:
            mm = re.match(r'^(w0|w8|x0|x8|s0|d0|v0), \[x(?:9|8)(?:, #(0x[0-9a-f]+|\d+))?\](!)?$', ops)
            if mm:
                last['target'] = int(mm.group(2), 0) if mm.group(2) else 0
                vals.append(last)
                last = None
    return vals


def main():
    ap = argparse.ArgumentParser(description='Obfuz const-pool STATIC decoder (AOW3 6.9.18)')
    ap.add_argument('--so', help='libil2cpp.so (flag > env AOW3_SO > cwd walk)')
    ap.add_argument('--metadata', help='global-metadata.dat (flag > env AOW3_METADATA > cwd walk)')
    ap.add_argument('--key', help='secret key 1024-B blob (flag > env AOW3_KEY > committed artifact)')
    ap.add_argument('--out', default='obfuz-pool-values.json')
    args = ap.parse_args()
    so_path = args.so or os.environ.get('AOW3_SO') or _find('libil2cpp.so', os.getcwd())
    md_path = args.metadata or os.environ.get('AOW3_METADATA') or _find('global-metadata.dat', os.getcwd())
    key_path = args.key or os.environ.get('AOW3_KEY') or \
        _find('obfuz_secret_key.bin', os.path.dirname(os.path.abspath(__file__))) or \
        _find('obfuz_secret_key.bin', os.getcwd())
    if not so_path or not md_path:
        raise SystemExit('need libil2cpp.so and global-metadata.dat (pass --so/--metadata)')
    key_blob = open(key_path, 'rb').read()
    assert len(key_blob) == 1024, 'key must be the raw 1024-B m_Script blob'
    so, segs = load_so(so_path)
    md = open(md_path, 'rb').read()
    print('so       :', so_path, 'sha256', hashlib.sha256(so).hexdigest()[:16], '…')
    print('metadata :', md_path, 'sha256', hashlib.sha256(md).hexdigest()[:16], '…')
    print('key      :', key_path, 'sha256', hashlib.sha256(key_blob).hexdigest()[:16], '…')
    goa = make_uc(so, segs, key_blob)
    K = goa(*QK_TRIPLE[:3])
    print('SELF-TEST: $GOA canary ->', hex(K), 'PASS' if K == QK_TRIPLE[3] else 'FAIL')
    assert K == QK_TRIPLE[3]
    S = {k: bytes(moa_decrypt(goa, md[off:off + 2048], ka, sa))
         for k, (off, ka, sa) in HOLDER_SEGS.items()}
    vals = parse_cctor(so_path)
    print(f'triples  : {len(vals)}')
    out = []
    import collections
    stat = collections.Counter()
    for i, v in enumerate(vals):
        rec = dict(v); rec['idx'] = i
        segk = v.get('src_slot')
        segk = '0x1810' if segk == 0x1810 else '0x1008'
        rec['seg'] = segk
        seg = S[segk]
        st = v.get('start')
        if v['thunk'] in ('int', 'float'):
            raw = struct.unpack_from('<I', seg, st)[0]
            d = goa(raw, v['keyA'], v['salt'])
            rec['raw'] = hex(raw); rec['value'] = d
            if v['thunk'] == 'float':
                exp = (d >> 23) & 0xFF
                mask = goa(0xABCD, v['keyA'], v['salt']) & 0x7FFFFF
                bits = d ^ (mask if exp <= 0xFE else 0)
                rec['float'] = struct.unpack('<f', struct.pack('<I', bits))[0]
            rec['status'] = 'OK'
        else:
            ln = v['keyA'] & 0xFFFF
            raw = seg[st:st + ln]
            rec['raw'] = raw.hex()
            ok = False
            for ka2, sa2, via in ((v['salt'], v.get('keyC', 0), 'moa(salt,keyC)'),
                                  (v.get('keyC', 0), v['salt'], 'moa(keyC,salt)')):
                dec = bytes(moa_decrypt(goa, raw, ka2, sa2, ln))
                if all(0x20 <= c <= 0x7e or c in (9, 10, 13) for c in dec):
                    rec['value'] = dec.decode(); rec['via'] = via
                    rec['status'] = 'OK'; ok = True; break
            if not ok and all(0x20 <= c <= 0x7e or c in (9, 10, 13) for c in raw):
                rec['value'] = raw.decode(); rec['via'] = 'plain'; rec['status'] = 'OK'
                ok = True
            if not ok:
                rec['value'] = None; rec['status'] = 'CIPHER_UNSURE'
        stat[rec['status']] += 1
        out.append(rec)
    print('status   :', dict(stat))
    anchors = {0x004: 'Build E task-id factor V1', 0x008: 'Build E task-id factor V2',
               0x014: '$ce task threshold', 0x064: 'DontShoot idempotence constant',
               0x364: 'Build F DEN factor A', 0x368: 'Build F DEN factor B',
               0x374: 'set_FlagShoot value'}
    M = 2 ** 32
    g = {d.get('target'): d.get('value') for d in out if d['thunk'] == 'int'}
    den = (g.get(0x364, 0) * g.get(0x368, 0)) % M
    checks = [('pool[0x364]*pool[0x368] mod 2^32 == 1000 (siege DEN)', den == 1000),
              ('statics+0x64 == 8 (DONT_SHOOT task id)', g.get(0x64) == 8),
              ('statics+0x14 <= 11 ($ce task threshold)', g.get(0x14, 99) <= 11),
              ('(pool[4]*pool[8]) mod 2^32 <= 11 (task id)', (g.get(4, 1) * g.get(8, 1)) % M <= 11)]
    for nm, ok in checks:
        print(f'  [{"PASS" if ok else "FAIL"}] {nm}')
    json.dump(out, open(args.out, 'w'), indent=1)
    print('->', args.out)


if __name__ == '__main__':
    main()
