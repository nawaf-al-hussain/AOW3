#!/usr/bin/env python3
"""Task 36 / Build G — Obfuz const-pool emulator (AOW3 6.9.18, arm64).

End-to-end tooling for the $Obfuz$ConstFieldHolder$0 pool:

  1. secret key   : TextAsset Resources/Obfuz/defaultStaticSecretKey
                    (base APK entry assets/bin/Data/0f159d0d59e64604b196175cc4fd2f85,
                    m_Script @0xB0, 1024 B = 256 LE u32 -> int[] via $JK/BlockCopy)
  2. VM           : Obfuz.EncryptionVM.GeneratedEncryptionVirtualMachine : $D
                    kOpCodeBits=8 (256 ops); int decrypt = $GOA @0x3DCF784
                    (opcodes consumed LSB-first from keyA, salt = w3)
                    executed NATIVELY in Unicorn (libil2cpp.so mapped as-is)
  3. self-test    : the game's own integrity check $qk(0x12345678, K) where
                    K = $GOA(0x720BA23E, 0x545EE170, 0x98705298) — must equal
                    0x12345678 or the boot throws. PASS == crypto chain proven.
  4. triples      : parses .cctor @0x4975844 (39,984 B) into 697 pool values
                    {thunk, blobStart, keyA, salt, staticsTarget}
  5. segments     : per-segment byte ciphers ($mOA/$MOA CBC: plain_i =
                    $GOA(ciph_i ^ prev_cipher, kA, salt), tail bytes ^= salt)
                    with the 10 captured segment key pairs
  6. blob sweep   : harness that sweeps ciphertext sources against anchors
                    (residual: the InitializeArray source blocks are runtime-
                    resolved usage slots; not present in global-metadata fdv)

Usage: python3.13 reverse/tools/obfuz_pool_emulator.py [--sweep]
"""
import struct, io, re, json, zipfile, argparse
from unicorn import Uc, UC_ARCH_ARM64, UC_MODE_ARM, UC_PROT_ALL
from unicorn.arm64_const import (UC_ARM64_REG_X0, UC_ARM64_REG_X1, UC_ARM64_REG_X2,
                                 UC_ARM64_REG_X3, UC_ARM64_REG_X30, UC_ARM64_REG_SP)
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

BASE = '/home/z/my-project/aow3-work/native/'
XAPK = '/home/z/my-project/aow3-work/aow3.xapk'
KEY_ENTRY = 'assets/bin/Data/0f159d0d59e64604b196175cc4fd2f85'

CCTOR_VA, CCTOR_SIZE = 0x4975844, 39984
GOA_VA = 0x3DCF784
QK_TRIPLE = (0x720BA23E, 0x545EE170, 0x98705298, 0x12345678)
THUNKS = {0x5265B74: 'int', 0x5265BD0: 'long', 0x5265C2C: 'float',
          0x5265C88: 'double', 0x5265CE4: 'string'}
SEG_KEYS = {   # pool-manager statics slot -> (keyA, salt) of the byte cipher
    'b2@0x800':  (0x98643925, 0xD993A3D1), 'b2@0x1008': (0x5B300BF1, 0x8952D5F4),
    'b2@0x1810': (0xF91F0C58, 0x9A457001), 'b1@0x800':  (0x6E5EF7E2, 0xA4BA9CCE),
    'b1@0x1008': (0xC0FB1F9E, 0xD649BD34), 'b1@0x1810': (0x1C1B6537, 0x5A586297),
    'b1@0x2018': (0x354680C3, 0xFBA322BF), 'b1@0x2820': (0xC1A1C8CC, 0x44A79BB9),
    'b1@0x3028': (0x49CF984F, 0xCA71695E), 'b1@0x3830': (0x0C099C51, 0x8DF68D1D),
}


def load_so():
    so = open(BASE + 'libil2cpp.so', 'rb').read()
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
    uc.mem_write(VM + 0x10, struct.pack('<Q', KEYARR))          # this._secretKey
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


def load_key():
    z1 = zipfile.ZipFile(XAPK)
    apk = zipfile.ZipFile(io.BytesIO(z1.read('com.geargames.aow.apk')))
    kf = apk.read(KEY_ENTRY)
    assert kf[0xAC:0xB0] == struct.pack('<I', 1024), 'unexpected m_Script size'
    return kf, kf[0xB0:0xB0 + 1024]


def parse_cctor():
    so, segs = load_so()
    def va2off(va):
        for po, pv, fs in segs:
            if pv <= va < pv + fs:
                return va - pv + po
    md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
    ins_list = list(md.disasm(so[va2off(CCTOR_VA):va2off(CCTOR_VA) + CCTOR_SIZE], CCTOR_VA))
    def imm16(ins):
        return int(ins.op_str.split('#')[1].split(',')[0].strip(), 16)
    vals, cur, last = [], {}, None
    for ins in ins_list:
        m, ops = ins.mnemonic, ins.op_str
        if m in ('mov', 'movk') and ops[1] == ',' and ops[0] == 'w' and ops[2] == ',' \
                and ops[1:3] in ('1,', '2,', '3,', '4,') and '#' in ops:
            pass
        if m in ('mov', 'movk') and re.match(r'^w[1-4], ', ops) and '#' in ops:
            reg = {'1': 'start', '2': 'keyA', '3': 'salt', '4': 'keyC'}[ops[1]]
            v = imm16(ins)
            sh = int(ops.split('lsl #')[1].split()[0], 0) if ', lsl #' in ops else 0
            if m == 'mov':
                cur[reg] = v
            else:
                cur[reg] = cur.get(reg, 0) | (v << sh)
        elif m == 'ldr' and re.match(r'^x8, \[x8, #(0x[0-9a-f]+|\d+)\]$', ops):
            cur['src_slot'] = int(ops.split('#')[1].rstrip(']'), 0)
        elif m == 'bl':
            t = int(ops.split('#')[1], 16)
            if t in THUNKS:
                cur['thunk'] = THUNKS[t]
                last = dict(cur)
                cur = {}
        elif m in ('str', 'stur') and last is not None:
            mm = re.match(r'^(w0|w8|x0|x8|s0|d0|v0), \[x(?:9|8)(?:, #(0x[0-9a-f]+|\d+))?\](!)?$', ops)
            if mm:
                last['target'] = int(mm.group(2), 0) if mm.group(2) else 0
                vals.append(last)
                last = None
    return vals


def moa_decrypt(goa, blob, ka, sa, nbytes=None):
    """$mOA/$MOA byte cipher: plain_i = GOA(ciph_i ^ prev, kA, salt), prev=cipher; tail ^= salt."""
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sweep', action='store_true', help='resweep metadata fdv region for segment blobs')
    args = ap.parse_args()
    so, segs = load_so()
    kf, key_blob = load_key()
    import hashlib
    print('key entry :', KEY_ENTRY, len(kf), 'B sha256', hashlib.sha256(kf).hexdigest())
    print('key ints  : 256 (u32 LE), u32[0..3] =', [hex(x) for x in struct.unpack_from('<4I', key_blob)])
    goa = make_uc(so, segs, key_blob)
    assert goa(0x12345678, 0, 0xDEADBEEF) == 0x12345678, 'identity'
    K = goa(*QK_TRIPLE[:3])
    ok = (K == QK_TRIPLE[3])
    print('SELF-TEST : $GOA(%#x, %#x, %#x) = %#x  -> $qk expected %#x : %s' %
          (QK_TRIPLE[0], QK_TRIPLE[1], QK_TRIPLE[2], K, QK_TRIPLE[3], 'PASS' if ok else 'FAIL'))
    assert ok, 'game integrity check failed'
    vals = parse_cctor()
    import collections
    c = collections.Counter(v['thunk'] for v in vals)
    slots = collections.Counter(v.get('src_slot', 0x1008) for v in vals if v['thunk'] == 'int')
    print('cctor pool values: %d (%s); int src slots: %s' %
          (len(vals), dict(c), {hex(k): v for k, v in slots.items()}))
    json.dump(vals, open('/home/z/my-project/aow3-work/obfuz_cctor_triples.json', 'w'))
    print('triples -> obfuz_cctor_triples.json')
    print('segment key pairs:', {k: (hex(a), hex(b)) for k, (a, b) in SEG_KEYS.items()})
    if args.sweep:
        md_dat = open(BASE + 'global-metadata.dat', 'rb').read()
        hdr = struct.unpack_from('<64I', md_dat, 0)
        fdv_off, fdv_bytes, dat_off = hdr[16], hdr[17], hdr[18]
        n = fdv_bytes // 12
        dis = sorted(set(struct.unpack_from('<3i', md_dat, fdv_off + i * 12)[2] for i in range(n)))
        hits = 0
        for name, (ka, sa) in SEG_KEYS.items():
            for d in dis:
                if dat_off + d + 0x40 > len(md_dat):
                    continue
                seg = moa_decrypt(goa, md_dat[dat_off + d:dat_off + d + 0x40], ka, sa, 0x40)
                t = goa(struct.unpack_from('<I', seg, 0x1C)[0], 0x3D, 0x27428CBF)
                if 0 <= t <= 15:
                    print('SWEEP HIT %s di=%#x dec(0x1c)=%d' % (name, d, t))
                    hits += 1
        print('sweep done, hits:', hits)


if __name__ == '__main__':
    main()
