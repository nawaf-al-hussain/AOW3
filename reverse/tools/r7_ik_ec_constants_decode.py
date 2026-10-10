#!/usr/bin/env python3
"""R7 pass 3 — $Ik/$Ec shape-test constant decoder (AOW3 6.9.18, offline).

Recovers the Obfuz-pool constants behind the fog-of-war reveal-shape tests that
R7 pass 2 left pending, from committed inputs (libil2cpp.so 8ace05bb… +
global-metadata.dat d2e8dd0d… + obfuz_secret_key.bin), through the shared R2
$GOA/$kK core (obfuz_static_decode.py — one cipher implementation repo-wide):

  1. $GOA boot canary (0x720BA23E, 0x545EE170, 0x98705298) == 0x12345678.
  2. Decrypt the three committed pool segments (2048-B CBC blocks inside the
     global-metadata fdv region, keys from builder-chain-decode.txt / R2 / Task 55):
       0x1008 -> fdv 0xDBFC10 (keyA 0x5B300BF1, salt 0x8952D5F4)   [R2, anchor-validated]
       0x1810 -> fdv 0xDC0418 (keyA 0xF91F0C58, salt 0x9A457001)   [R2, anchor-validated]
       0x2820 -> fdv 0xDBDBF0 (keyA 0xC1A1C8CC, salt 0x44A79BB9)   [Task 55, 8/8 validated]
  3. Decode the pass-3 callsite triples found in the disassembly:
       AICommBuSet.$Ik   (0x48E649C)  D  = $gK(seg 0x2820/0x3830, 0x5D0, 0x3D, 0x27428CBF)
       CheckAndCalc.$ec  (0x46D2E7C)  boundA = $gK(seg 0x1810, 0x574, 0x79, 0x9B98D882)
                                      boundB = $gK(seg 0x1810, 0x578, 0x79, 0x9B98D882)
     and the global-constants statics class (klass ccache slot 0x968E4D8 — the ONE
     class the 697-record holder .cctor 0x4975844 writes; every R7 shape function
     reads its statics):
       R = statics[0xD4] ^ 0x7FE0CA88      (eor-pair decode)
       S = statics[0x30] + 0xCB5E3C38      (add-decode)
       M = statics[0x400] ^ 0xB4092818     (eor-pair decode)
       N = statics[0x14]                   (raw)
       FOLD = statics[0x4] * statics[0x8]  ($Ik polarity gadget)
  4. Cross-validate every statics value against the committed 697-record
     obfuz-pool-values.json (target-keyed).

Decoded result (all PASS or the tool aborts):
  D = 2          -> $Ik membership |dx| <= (sbyte) fogLines[r][|dy|] / 2   (half-cell extents)
  R = 15, S = 31 -> $ec grid index (R+dy)*S + (R+dx) on a (2R+1)^2 = 31x31 byte grid
                    (matches Battle consts $cc = 31, $Cc = 15, dump.cs)
  M = 0xFF, N = 3-> $ec returns (byte & 0xFF) >> 3  — 3 fractional bits (1/8-cell levels)
  FOLD = 0       -> $Ik tail returns the INSIDE test; |dy| > r path returns false

Usage:
  python3 r7_ik_ec_constants_decode.py [--so …] [--metadata …] [--key …] [--out …]
Inputs resolve as: flag > env (AOW3_SO/AOW3_METADATA/AOW3_KEY) > cwd walk > committed key.
"""
import struct, sys, json, hashlib, os, argparse, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from obfuz_static_decode import load_so, make_uc, moa_decrypt, _find  # noqa: E402

SEGS = {
    '0x1008': (0xDBFC10, 0x5B300BF1, 0x8952D5F4),
    '0x1810': (0xDC0418, 0xF91F0C58, 0x9A457001),
    '0x2820': (0xDBDBF0, 0xC1A1C8CC, 0x44A79BB9),
}
QK_TRIPLE = (0x720BA23E, 0x545EE170, 0x98705298, 0x12345678)
# (label, segment statics-slot, start, keyA, salt, expected, source)
CALLSITES = [
    ('$Ik divisor D',        '0x2820', 0x5D0, 0x3D, 0x27428CBF, 2,
     'AICommBuSet.$Ik 0x48E649C @0x48E6654-0x48E6668; segment byte[] read from statics+0x3830'),
    ('$ec bound A',          '0x1810', 0x574, 0x79, 0x9B98D882, None,
     'CheckAndCalc.$ec 0x46D2E7C @0x46D3068-0x46D307C; statics+0x1810 segment'),
    ('$ec bound B',          '0x1810', 0x578, 0x79, 0x9B98D882, None,
     'CheckAndCalc.$ec 0x46D2E7C @0x46D2FF4-0x46D3008; statics+0x1810 segment'),
]
# statics-class values (klass ccache slot 0x968E4D8), (target, decode, key, expected)
STATICS = [
    (0xD4, 'eor', 0x7FE0CA88, 15, '$ec R (grid radius bound); $Ik row bound'),
    (0x30, 'add', 0xCB5E3C38, 31, '$ec S (grid stride = 2R+1); Battle const $cc = 31'),
    (0x400, 'eor', 0xB4092818, 0xFF, '$ec M (byte mask)'),
    (0x14, 'raw', 0, 3, '$ec N (fixed-point shift; 3 fractional bits)'),
    (0x4, 'mul-a', 0, None, '$Ik polarity gadget factor A'),
    (0x8, 'mul-b', 0, None, '$Ik polarity gadget factor B (0 -> gadget returns INSIDE test)'),
    (0x688, 'raw', 0, 5400, 'adjacent getter @0x48E6744 returns this directly'),
]

def main():
    ap = argparse.ArgumentParser(description='R7 pass 3 — $Ik/$Ec constant decoder')
    ap.add_argument('--so')
    ap.add_argument('--metadata')
    ap.add_argument('--key')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                  '..', 'evidence', 'vision',
                                                  'ik-ec-constants.json'))
    args = ap.parse_args()
    here = os.path.dirname(os.path.abspath(__file__))
    so_path = args.so or os.environ.get('AOW3_SO') or _find('libil2cpp.so', os.getcwd())
    md_path = args.metadata or os.environ.get('AOW3_METADATA') or _find('global-metadata.dat', os.getcwd())
    key_path = args.key or os.environ.get('AOW3_KEY') or \
        _find('obfuz_secret_key.bin', here) or _find('obfuz_secret_key.bin', os.getcwd())
    if not so_path or not md_path:
        raise SystemExit('need libil2cpp.so and global-metadata.dat (pass --so/--metadata)')
    key_blob = open(key_path, 'rb').read()
    assert len(key_blob) == 1024, 'key must be the raw 1024-B m_Script blob'
    so, segs = load_so(so_path)
    mdf = open(md_path, 'rb').read()
    print('so       :', so_path, 'sha256', hashlib.sha256(so).hexdigest()[:16], '…')
    print('metadata :', md_path, 'sha256', hashlib.sha256(mdf).hexdigest()[:16], '…')
    print('key      :', key_path, 'sha256', hashlib.sha256(key_blob).hexdigest()[:16], '…')

    goa = make_uc(so, segs, key_blob)
    K = goa(*QK_TRIPLE[:3])
    print('SELF-TEST: $GOA canary ->', hex(K), 'PASS' if K == QK_TRIPLE[3] else 'FAIL')
    assert K == QK_TRIPLE[3]

    S = {}
    for slot, (off, ka, sa) in SEGS.items():
        S[slot] = bytes(moa_decrypt(goa, mdf[off:off + 2048], ka, sa))
        print(f'segment {slot}: fdv 0x{off:X} keyA 0x{ka:X} salt 0x{sa:X} decrypted')

    records = []
    for label, slot, start, ka, salt, exp, src in CALLSITES:
        raw = struct.unpack_from('<I', S[slot], start)[0]
        val = goa(raw, ka, salt)
        ok = True if exp is None else (val == exp)
        print(f'{label:16} $gK({slot}, 0x{start:X}, 0x{ka:X}, 0x{salt:X}) '
              f'raw=0x{raw:08x} -> {val}' + (f'  expected {exp}' if exp else '') +
              '  ' + ('PASS' if ok else 'FAIL'))
        assert ok, f'{label} decode mismatch'
        records.append({'label': label, 'segment': slot, 'start': f'0x{start:x}',
                        'keyA': f'0x{ka:x}', 'salt': f'0x{salt:x}',
                        'raw': f'0x{raw:08x}', 'value': val, 'source': src})

    # statics class values via the committed pool (target-keyed)
    pool_path = os.path.join(here, '..', 'evidence', 'obfuz', 'obfuz-pool-values.json')
    pool = json.load(open(pool_path))
    by_target = {}
    for r in pool:
        if r['thunk'] in ('int', 'float'):
            by_target.setdefault(r['target'], []).append(r)
    statics_rec = []
    for tgt, mode, key, exp, note in STATICS:
        recs = by_target.get(tgt, [])
        assert len(recs) == 1, f'target {tgt:#x}: expected exactly one pool record'
        v = recs[0]['value'] & 0xFFFFFFFF
        if mode == 'eor':
            plain = v ^ key
        elif mode == 'add':
            plain = (v + key) & 0xFFFFFFFF
        elif mode == 'mul-a' or mode == 'mul-b':
            plain = v
        else:
            plain = v
        ok = True if exp is None else (plain == exp)
        print(f'statics+{tgt:#05x} pool={v} (0x{v:08x}) {mode}' +
              (f' 0x{key:X}' if key else '') + f' -> {plain}' +
              (f'  expected {exp}' if exp is not None else '') +
              '  ' + ('PASS' if ok else 'FAIL'))
        assert ok, f'statics+{tgt:#x} mismatch'
        statics_rec.append({'target': f'0x{tgt:x}', 'pool_value': f'0x{v:08x}',
                            'mode': mode, 'key': f'0x{key:x}' if key else None,
                            'plain': plain, 'note': note})
    fold = next(r['plain'] for r in statics_rec if r['target'] == '0x4') * \
        next(r['plain'] for r in statics_rec if r['target'] == '0x8')
    print(f'$Ik polarity FOLD = statics[0x4]*statics[0x8] = {fold} -> '
          + ('INSIDE test (|dx| <= extent/D)' if fold == 0 else 'OUTSIDE test'))
    assert fold == 0

    out = {
        '$schema_note': 'R7 pass 3 — decoded Obfuz-pool constants behind the fog reveal-shape '
                        'tests: AICommBuSet.$Ik membership (D divisor) and CheckAndCalc.$ec '
                        'grid constants (R/S/M/N). Shared R2 $GOA/$kK core; segments and pool '
                        'cross-checked against committed evidence.',
        'game_version': '6.9.18',
        'generated': datetime.date.today().isoformat(),
        'provenance': {
            'libil2cpp_sha256': hashlib.sha256(so).hexdigest(),
            'global_metadata_sha256': hashlib.sha256(mdf).hexdigest(),
            'secret_key_sha256': hashlib.sha256(key_blob).hexdigest(),
            'segments': {k: {'fdv_offset': f'0x{v[0]:X}', 'keyA': f'0x{v[1]:X}',
                             'salt': f'0x{v[2]:X}'} for k, v in SEGS.items()},
            'statics_class_ccache_slot': '0x968E4D8',
            'evidence': 'reverse/evidence/vision/ik-ec-constants-decode.txt',
        },
        'callsites': records,
        'statics': statics_rec,
        'ik_polarity_fold': fold,
    }
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    json.dump(out, open(args.out, 'w'), indent=1)
    print('->', args.out)


if __name__ == '__main__':
    main()
