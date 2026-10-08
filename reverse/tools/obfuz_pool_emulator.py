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

Usage:
  python3.13 reverse/tools/obfuz_pool_emulator.py                  # self-test + triple inventory
  python3.13 reverse/tools/obfuz_pool_emulator.py --dump <jsonl>   # decode all 697 pool values
  python3.13 reverse/tools/obfuz_pool_emulator.py --sweep          # legacy metadata fdv resweep

Input paths resolve as: CLI flag > env (AOW3_SO/AOW3_KEY/AOW3_XAPK/AOW3_METADATA)
> cwd walk (up/down, incl. ./native) > committed key artifact obfuz_secret_key.bin
> XAPK asset extraction. The host decode needs only: this repo + libil2cpp.so + the
dump JSONL (the secret key is committed; the XAPK is only a legacy fallback).
"""
import struct, io, os, re, json, hashlib, zipfile, argparse
from unicorn import Uc, UC_ARCH_ARM64, UC_MODE_ARM, UC_PROT_ALL
from unicorn.arm64_const import (UC_ARM64_REG_X0, UC_ARM64_REG_X1, UC_ARM64_REG_X2,
                                 UC_ARM64_REG_X3, UC_ARM64_REG_X30, UC_ARM64_REG_SP)
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

DEFAULT_SO = '/home/z/my-project/aow3-work/native/libil2cpp.so'
DEFAULT_XAPK = '/home/z/my-project/aow3-work/aow3.xapk'
DEFAULT_MD = '/home/z/my-project/aow3-work/native/global-metadata.dat'
KEY_ENTRY = 'assets/bin/Data/0f159d0d59e64604b196175cc4fd2f85'
KEY_ARTIFACT = 'obfuz_secret_key.bin'   # 1,024-B raw m_Script blob, committed (Build H)

_SKIP_DIRS = {'.git', 'node_modules', '__pycache__', 'proc', 'sys', 'dev', 'run',
              'tool-results', 'download', 'skills'}


def _find(name, start):
    """File lookup: start, start/native, walk-up (<=6), then walk-down (depth<=3)."""
    start = os.path.abspath(start or '.')
    d = start
    for _ in range(6):
        for c in (os.path.join(d, name), os.path.join(d, 'native', name)):
            if os.path.isfile(c):
                return c
        if d == '/':
            break
        d = os.path.dirname(d)
    if start == '/' or not os.path.isdir(start):
        return None
    for root, dirs, files in os.walk(start):
        base = root.rsplit(os.sep, 1)[-1]
        if base in _SKIP_DIRS or base.startswith('.'):
            dirs[:] = []
            continue
        dirs[:] = [x for x in dirs if not x.startswith('.') and x not in _SKIP_DIRS]
        if os.path.relpath(root, start).count(os.sep) >= 3:
            dirs[:] = []
            continue
        if name in files:
            return os.path.join(root, name)
    return None

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


def load_key(args):
    """Secret key from --key / AOW3_KEY / committed artifact / cwd walk, else --xapk/AOW3_XAPK asset.

    Accepts the 1,200-B TextAsset (m_Script @0xB0) or the raw 1,024-B blob.
    Returns (source description, key file bytes, 1024-B key blob).
    """
    kp = args.key or os.environ.get('AOW3_KEY') \
        or _find(KEY_ARTIFACT, os.path.dirname(os.path.abspath(__file__))) \
        or _find(KEY_ARTIFACT, os.getcwd())
    if kp:
        kf = open(kp, 'rb').read()
        if len(kf) == 1200:
            assert kf[0xAC:0xB0] == struct.pack('<I', 1024), 'unexpected m_Script size'
            return 'file %s (TextAsset)' % kp, kf, kf[0xB0:0xB0 + 1024]
        assert len(kf) == 1024, ('key file %s: expected 1024-B raw blob or '
                                 '1200-B TextAsset, got %d B' % (kp, len(kf)))
        return 'file %s (raw m_Script blob)' % kp, kf, kf
    xp = args.xapk or os.environ.get('AOW3_XAPK') or _find('aow3.xapk', os.getcwd()) \
        or (DEFAULT_XAPK if os.path.isfile(DEFAULT_XAPK) else None)
    if not xp:
        raise SystemExit('secret key not found: pass --key (1024-B raw blob or 1200-B '
                         'TextAsset) or --xapk; the extracted key is committed as '
                         'reverse/tools/obfuz_secret_key.bin')
    z1 = zipfile.ZipFile(xp)
    apk = zipfile.ZipFile(io.BytesIO(z1.read('com.geargames.aow.apk')))
    kf = apk.read(KEY_ENTRY)
    assert kf[0xAC:0xB0] == struct.pack('<I', 1024), 'unexpected m_Script size'
    return 'xapk %s entry %s' % (xp, KEY_ENTRY), kf, kf[0xB0:0xB0 + 1024]


def parse_cctor(so_path):
    so, segs = load_so(so_path)
    def va2off(va):
        for po, pv, fs in segs:
            if pv <= va < pv + fs:
                return va - pv + po
    md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
    ins_list = list(md.disasm(so[va2off(CCTOR_VA):va2off(CCTOR_VA) + CCTOR_SIZE], CCTOR_VA))
    def imm16(ins):
        return int(ins.op_str.split('#')[1].split(',')[0].strip(), 16)
    vals, cur, last = [], {}, None
    wregs = {}   # all w-registers -> composed scalar (handles movz + computed salts)
    for ins in ins_list:
        m, ops = ins.mnemonic, ins.op_str
        if m in ('mov', 'movz', 'movk') and re.match(r'^w\d+, ', ops) and '#' in ops:
            reg = ops.split(',')[0]
            v = imm16(ins)
            if v is None:
                continue
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
            d, n = ops.split(',')[0], ops.split(',')[1].strip()
            if n in wregs:
                cur[{'1': 'start', '2': 'keyA', '3': 'salt', '4': 'keyC'}[d[1]]] = \
                    (wregs[n] + int(ops.split('#')[1], 0)) & 0xFFFFFFFF
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


def load_dump(path):
    """Parse an obfuz_frida_dump.js JSONL transcript."""
    import base64
    segs, qks, initarrs = [], [], []
    for line in open(path, 'r', encoding='utf-8', errors='replace'):
        line = line.strip()
        if not line.startswith('[OBFUZ]'):
            continue
        try:
            ev = json.loads(line[7:])
        except Exception:
            continue
        if ev.get('ev') == 'seg':
            ev['_cipher'] = base64.b64decode(ev['cipher'])
            ev['_plain'] = base64.b64decode(ev['plain'])
            segs.append(ev)
        elif ev.get('ev') == 'qk':
            qks.append(ev)
        elif ev.get('ev') == 'initarr':
            ev['_data'] = base64.b64decode(ev['data'])
            initarrs.append(ev)
    return segs, qks, initarrs


def verify_cbc(goa, ev, words=32):
    """Re-execute the $mOA CBC on REAL device bytes: plain_i ?= GOA(ciph_i ^ ciph_{i-1}, keyA, salt)."""
    cip, pln, ka, sa = ev['_cipher'], ev['_plain'], int(ev['keyA'], 16), int(ev['salt'], 16)
    n = min(words, len(cip) // 4, len(pln) // 4)
    ok = 0
    prev = 0
    for i in range(n):
        cw = struct.unpack_from('<I', cip, 4 * i)[0]
        pw = struct.unpack_from('<I', pln, 4 * i)[0]
        if goa(cw ^ prev, ka, sa) == pw:
            ok += 1
        prev = cw
    return ok, n


def decode_pool_from_dump(goa, vals, seg_plain):
    """Decode the 697 holder triples against the dumped PLAINTEXT segments.

    seg_plain: {'0x1008': bytes, '0x1810': bytes} — the two segments the holder
    reads (Build G2: the parse's 0xb8 src_slot was the Il2CppClass::static_fields
    indirection; those triples actually read statics+0x1810).
    """
    out = []
    for i, v in enumerate(vals):
        rec = dict(v)
        rec['idx'] = i
        slot = v.get('src_slot')
        slot = '0x1810' if slot in (0xb8, 6160, '0xb8') else \
               ('0x1008' if slot in (4104, '0x1008') else '0x1008')
        rec['seg'] = slot
        seg = seg_plain.get(slot)
        if seg is None:
            rec['status'] = 'NO_SEGMENT'
            out.append(rec)
            continue
        st = v.get('start')
        if st is None or 'salt' not in v:
            rec['status'] = 'PARAM_MISSING'   # .cctor parse gap (e.g. idx 386: keyA/salt ok, start unrecovered)
            out.append(rec)
            continue
        if v['thunk'] in ('int', 'float'):
            if st + 4 > len(seg):
                rec['status'] = 'OOB'
                out.append(rec)
                continue
            raw = struct.unpack_from('<I', seg, st)[0]
            d = goa(raw, v['keyA'], v['salt'])
            rec['raw'] = hex(raw)
            rec['value'] = d
            if v['thunk'] == 'float':
                rec['float'] = struct.unpack('<f', struct.pack('<I', d))[0]
            rec['status'] = 'OK'
        else:  # string: keyA holds the length, salt+keyC the per-string cipher
            ln = v['keyA'] & 0xFFFF
            if st + ln > len(seg):
                rec['status'] = 'OOB'
                out.append(rec)
                continue
            raw = seg[st:st + ln]
            rec['raw'] = raw.hex()
            if all(0x20 <= c <= 0x7e or c in (9, 10, 13) for c in raw):
                rec['value'] = raw.decode('ascii', 'replace')
                rec['via'] = 'plain-ascii'
                rec['status'] = 'OK'
            else:
                dec = moa_decrypt(goa, raw, v.get('keyC', 0) & 0xFFFFFFFF, v['salt'] & 0xFFFFFFFF, ln)
                if all(0x20 <= c <= 0x7e or c in (9, 10, 13) for c in dec):
                    rec['value'] = dec.decode('ascii', 'replace')
                    rec['via'] = 'moa-subrange(keyC,salt)'
                    rec['status'] = 'OK'
                else:
                    rec['status'] = 'CIPHER_UNSURE'
                    rec['value'] = None
        out.append(rec)
    return out


ANCHOR_TARGETS = {
    0x004: 'Build E task-id factor V1 (product indexes the name table)',
    0x008: 'Build E task-id factor V2',
    0x014: '$ce task threshold',
    0x064: 'DontShoot idempotence constant',
    0x364: 'Build F DEN factor A (DEN = A x B)',
    0x368: 'Build F DEN factor B',
    0x374: 'set_FlagShoot value',
}


def dump_mode(goa, path, vals, out_path):
    segs, qks, initarrs = load_dump(path)
    print(f'dump: {len(segs)} seg / {len(qks)} qk / {len(initarrs)} initarr events')
    canary = [q for q in qks if int(q['a'], 16) == 0x12345678]
    print('canary $qk(0x12345678, K):', 'SEEN (VM booted, cipher chain live)' if canary else 'NOT SEEN')
    for ev in segs:
        ok, n = verify_cbc(goa, ev)
        print(f"CBC re-verify {ev['mgr']}@{ev['slot']} (cs {ev['cs']}, keyA {ev['keyA']}, "
              f"salt {ev['salt']}): {ok}/{n} words {'PASS' if ok == n else 'MISMATCH — cipher model needs review'}")
    for ia in initarrs:
        print(f"initarr fi={ia['fi']} name={ia['fname']!r} len={ia['len']}")
    by_slot = {}
    for ev in segs:
        by_slot.setdefault((ev['mgr'], ev['slot']), ev['_plain'])
    combos = []
    for m1 in {m for m, s in by_slot if s == '0x1008'}:
        for m2 in {m for m, s in by_slot if s == '0x1810'}:
            combos.append((m1, m2))
    if not combos:
        print('ERROR: need at least one 0x1008 and one 0x1810 segment to decode the holder pool')
        return
    best = None
    for m1, m2 in combos:
        seg_plain = {'0x1008': by_slot[(m1, '0x1008')], '0x1810': by_slot[(m2, '0x1810')]}
        dec = decode_pool_from_dump(goa, vals, seg_plain)
        okn = sum(1 for d in dec if d['status'] == 'OK')
        print(f'combo mgr(0x1008)={m1} mgr(0x1810)={m2}: decoded OK {okn}/{len(dec)}')
        if best is None or okn > best[1]:
            best = ((m1, m2), okn, dec, seg_plain)
    (m1, m2), okn, dec, seg_plain = best
    print(f'chosen: 0x1008={m1} 0x1810={m2}')
    print('--- anchor cross-check ---')
    for d in dec:
        t = d.get('target')
        if t in ANCHOR_TARGETS:
            val = d.get('float', d.get('value'))
            print(f"  statics+{t:#05x}  = {val!r}  [{d['status']}]{'' if d['status']=='OK' else ' (needs real dump)'}"
                  f"   <- {ANCHOR_TARGETS[t]}")
    json.dump(dec, open(out_path, 'w'), indent=1)
    print(f'pool values -> {out_path} ({okn}/{len(dec)} OK)')
    return dec


def main():
    ap = argparse.ArgumentParser(
        description='Obfuz const-pool emulator (AOW3 6.9.18, arm64) — '
                    'native $GOA re-executed in Unicorn; see module docstring.')
    ap.add_argument('--dump', metavar='JSONL', help='consume an obfuz_frida_dump.js transcript and decode the pool')
    ap.add_argument('--out', metavar='PATH', default='obfuz-pool-values.json',
                    help='--dump decoded-pool output path (default: ./obfuz-pool-values.json)')
    ap.add_argument('--triples-out', metavar='PATH', default='obfuz-cctor-triples.json',
                    help='triple-inventory output path (default: ./obfuz-cctor-triples.json)')
    ap.add_argument('--so', metavar='PATH', help='libil2cpp.so 6.9.18 (flag > env AOW3_SO > cwd walk)')
    ap.add_argument('--key', metavar='PATH', help='secret key: 1024-B raw blob or 1200-B TextAsset '
                                                  '(flag > env AOW3_KEY > committed obfuz_secret_key.bin)')
    ap.add_argument('--xapk', metavar='PATH', help='XAPK/APK legacy fallback for the secret-key asset')
    ap.add_argument('--metadata', metavar='PATH', help='global-metadata.dat (--sweep only)')
    ap.add_argument('--sweep', action='store_true', help='resweep metadata fdv region for segment blobs')
    args = ap.parse_args()
    so_path = args.so or os.environ.get('AOW3_SO') or _find('libil2cpp.so', os.getcwd()) \
        or (DEFAULT_SO if os.path.isfile(DEFAULT_SO) else None)
    if not so_path:
        raise SystemExit('libil2cpp.so not found: pass --so (the 6.9.18 build, sha256 8ace05bb…) '
                         'or set AOW3_SO, or run from a directory containing it')
    so, segs = load_so(so_path)
    src, kf, key_blob = load_key(args)
    print('so         :', so_path, 'sha256', hashlib.sha256(open(so_path, 'rb').read()).hexdigest()[:16], '…')
    print('key source :', src)
    print('key blob   :', len(kf), 'B sha256', hashlib.sha256(kf).hexdigest())
    print('key ints   : 256 (u32 LE), u32[0..3] =', [hex(x) for x in struct.unpack_from('<4I', key_blob)])
    goa = make_uc(so, segs, key_blob)
    assert goa(0x12345678, 0, 0xDEADBEEF) == 0x12345678, 'identity'
    K = goa(*QK_TRIPLE[:3])
    ok = (K == QK_TRIPLE[3])
    print('SELF-TEST : $GOA(%#x, %#x, %#x) = %#x  -> $qk expected %#x : %s' %
          (QK_TRIPLE[0], QK_TRIPLE[1], QK_TRIPLE[2], K, QK_TRIPLE[3], 'PASS' if ok else 'FAIL'))
    assert ok, 'game integrity check failed'
    vals = parse_cctor(so_path)
    if args.dump:
        dump_mode(goa, args.dump, vals, args.out)
        return
    import collections
    c = collections.Counter(v['thunk'] for v in vals)
    slots = collections.Counter(v.get('src_slot', 0x1008) for v in vals if v['thunk'] == 'int')
    print('cctor pool values: %d (%s); int src slots: %s' %
          (len(vals), dict(c), {hex(k): v for k, v in slots.items()}))
    json.dump(vals, open(args.triples_out, 'w'))
    print('triples ->', args.triples_out)
    print('segment key pairs:', {k: (hex(a), hex(b)) for k, (a, b) in SEG_KEYS.items()})
    if args.sweep:
        md_path = args.metadata or os.environ.get('AOW3_METADATA') \
            or _find('global-metadata.dat', os.getcwd()) \
            or (DEFAULT_MD if os.path.isfile(DEFAULT_MD) else None)
        if not md_path:
            raise SystemExit('global-metadata.dat not found: pass --metadata or set AOW3_METADATA')
        print('metadata  :', md_path)
        md_dat = open(md_path, 'rb').read()
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
