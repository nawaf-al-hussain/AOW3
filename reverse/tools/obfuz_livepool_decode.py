#!/usr/bin/env python3
"""R2 follow-up — $Pg live-pool holder-segment decoder (materialization).

Materializes the 8 `$gK` live-pool constants that Build I (Task 51) decoded
ad-hoc — values recorded in `reverse/evidence/combat/pg-branches-decode.txt`
pass 3 but never folded into the 697-record .cctor inventory — and makes the
decode reproducible from committed inputs, closing the registry R2
next_action ("keep decoder reproducible; reuse values to pin new branch
constants").

Chain (identical cipher core to the R2 static decoder, imported — one source
of truth for $GOA/$kK; every parameter from committed evidence):

  1. $GOA emulation from libil2cpp.so (VA 0x3DCF784) + the committed 1024-B
     secret key; boot canary $qk(0x720BA23E, 0x545EE170, 0x98705298) ==
     0x12345678 must PASS.
  2. Pipeline sanity: re-derive obfuz-pool-values.json idx 0 from the RVA$1
     segment 0x1008 (fdv 0xDBFC10, keyA 0x5B300BF1, salt 0x8952D5F4):
     raw@304 must equal 0x87b2f461 and $GOA(raw, 1846148991, 835012161) must
     equal 1069165131 (the same "canary + pool idx0 re-derivation" validation
     the Build I session ran before its grid scan).
  3. Live segment: the $Pg accessors read the ConstFieldHolder's second
     segment, whose fdv ciphertext block sits in global-metadata.dat at
     absolute offset 0xDBDBF0 (grid-scan hit k=-4 on the 0x808-stride family:
     0xDBFC10 - 4*0x808, i.e. inside the RVA$0 block run), CBC keys read from
     the holder statics+0x2820 area (evidence "keys=b1@0x2820"):
     keyA 0xC1A1C8CC, salt 0x44A79BB9. $kK CBC: plain_i =
     $GOA(ciph_i ^ ciph_{i-1}, keyA, salt), ciph_{-1} = 0.
  4. Per callsite: raw = BitConverter.ToInt32(seg, start);
     value = $GOA(raw, keyA, salt). The 8 (va, start, keyA, salt) triples are
     committed verbatim from pg-branches-decode.txt pass 1.

Validation anchors (all must PASS; values cross-checked against the
committed pass-3 record):
  0x698=73  0x69c=5  0x6a0=2  0x6a4=73  0x6a8=2  0x6ac=2  0x6b0=5  0x6b4=73
  == the pass-3 hit vector ['0x49','0x5','0x2','0x49','0x2','0x2','0x5','0x49'].
The RAW segment words are new facts recorded by this tool (the ad-hoc
session printed only the $GOA results).

Semantics: 2 = UnitTaskType.DEFEND, 5 = UnitTaskType.BOMBARD (dump.cs:395395
enum — CONFIRMED); 73 = UNIT_ID_BEHOLDER (reverse/evidence/data-model/
unit-type-ids.json; the three 73 sites are `cmp w0, w-reg, sxtb` unit-type-id
compares — INFERRED field identity, Build I).

Usage:
  python3 obfuz_livepool_decode.py --so libil2cpp.so --metadata global-metadata.dat \
      [--key obfuz_secret_key.bin] [--out obfuz-livepool-values.json]
Inputs resolve as: flag > env (AOW3_SO/AOW3_METADATA/AOW3_KEY) > cwd walk >
committed key artifact.
"""
import struct, sys, json, hashlib, os, argparse, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from obfuz_static_decode import load_so, make_uc, moa_decrypt, _find  # noqa: E402

# --- committed parameters (pg-branches-decode.txt pass 1 + pass 3) ---------
HOLDER2_SEG = (0xDBDBF0, 0xC1A1C8CC, 0x44A79BB9)  # (fdv abs offset, CBC keyA, CBC salt)
RVA1_SEG_0x1008 = (0xDBFC10, 0x5B300BF1, 0x8952D5F4)  # pipeline-sanity segment
QK_TRIPLE = (0x720BA23E, 0x545EE170, 0x98705298, 0x12345678)
# (site VA, start, keyA, salt, semantics, confidence) in start-offset order
SITES = [
    (0x4843094, 0x698, 0x16, 0xdabd7bca, "UnitType id BEHOLDER (73) — cmp w0,w-reg,sxtb unit-type-id compare arm", "INFERRED field identity (Build I); UNIT_ID_BEHOLDER=73 per unit-type-ids.json"),
    (0x4843504, 0x69c, 0x11, 0x2927ab7e, "UnitTaskType.BOMBARD (5)", "CONFIRMED (dump.cs:395395 enum; Build I)"),
    (0x4846ffc, 0x6a0, 0x3d, 0x27428cbf, "UnitTaskType.DEFEND (2)", "CONFIRMED (dump.cs:395395 enum; Build I)"),
    (0x4842a7c, 0x6a4, 0x16, 0xdabd7bca, "UnitType id BEHOLDER (73)", "INFERRED field identity (Build I); UNIT_ID_BEHOLDER=73 per unit-type-ids.json"),
    (0x483c7c4, 0x6a8, 0x3d, 0x27428cbf, "UnitTaskType.DEFEND (2)", "CONFIRMED (dump.cs:395395 enum; Build I)"),
    (0x4841160, 0x6ac, 0x3d, 0x27428cbf, "UnitTaskType.DEFEND (2)", "CONFIRMED (dump.cs:395395 enum; Build I)"),
    (0x483dbc4, 0x6b0, 0x11, 0x2927ab7e, "UnitTaskType.BOMBARD (5)", "CONFIRMED (dump.cs:395395 enum; Build I)"),
    (0x4844dfc, 0x6b4, 0x16, 0xdabd7bca, "UnitType id BEHOLDER (73)", "INFERRED field identity (Build I); UNIT_ID_BEHOLDER=73 per unit-type-ids.json"),
]
# committed pass-3 record (value per start offset)
EXPECTED = {0x698: 73, 0x69c: 5, 0x6a0: 2, 0x6a4: 73, 0x6a8: 2, 0x6ac: 2, 0x6b0: 5, 0x6b4: 73}


def main():
    ap = argparse.ArgumentParser(description='$Pg live-pool holder-segment decoder (AOW3 6.9.18)')
    ap.add_argument('--so', help='libil2cpp.so (flag > env AOW3_SO > cwd walk)')
    ap.add_argument('--metadata', help='global-metadata.dat (flag > env AOW3_METADATA > cwd walk)')
    ap.add_argument('--key', help='secret key 1024-B blob (flag > env AOW3_KEY > committed artifact)')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                  '..', 'evidence', 'obfuz', 'obfuz-livepool-values.json'))
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
    md = open(md_path, 'rb').read()
    so_sha, md_sha, key_sha = (hashlib.sha256(b).hexdigest() for b in (so, md, key_blob))
    print('so       :', so_path, 'sha256', so_sha[:16], '…')
    print('metadata :', md_path, 'sha256', md_sha[:16], '…')
    print('key      :', key_path, 'sha256', key_sha[:16], '…')

    goa = make_uc(so, segs, key_blob)

    # 1. boot canary
    K = goa(*QK_TRIPLE[:3])
    print('SELF-TEST: $GOA canary ->', hex(K), 'PASS' if K == QK_TRIPLE[3] else 'FAIL')
    assert K == QK_TRIPLE[3], 'canary FAIL'

    # 2. pipeline sanity: re-derive committed pool idx 0 (segment machinery proof)
    off1, ka1, sa1 = RVA1_SEG_0x1008
    seg1008 = moa_decrypt(goa, md[off1:off1 + 2048], ka1, sa1)
    raw0 = struct.unpack_from('<I', seg1008, 304)[0]
    val0 = goa(raw0, 1846148991, 835012161)
    pool_json = os.path.join(here, '..', 'evidence', 'obfuz', 'obfuz-pool-values.json')
    exp_raw0, exp_val0 = '0x87b2f461', 1069165131
    try:
        rec0 = json.load(open(pool_json))[0]
        exp_raw0, exp_val0 = rec0['raw'], rec0['value']
    except Exception:
        pass
    ok0 = (hex(raw0) == exp_raw0 and val0 == exp_val0)
    print(f'SANITY: pool idx0 re-derivation raw={hex(raw0)} val={val0} '
          f'(expected raw={exp_raw0} val={exp_val0}) ->', 'PASS' if ok0 else 'FAIL')
    assert ok0, 'pool idx0 re-derivation FAIL'

    # 3. live holder segment
    off2, ka2, sa2 = HOLDER2_SEG
    seg2 = moa_decrypt(goa, md[off2:off2 + 2048], ka2, sa2)

    # 4. per-callsite decode + cross-check vs the committed pass-3 record
    records, hits = [], 0
    for va, start, keya, salt, semantics, conf in SITES:
        raw = struct.unpack_from('<I', seg2, start)[0]
        val = goa(raw, keya, salt)
        ok = (val == EXPECTED[start])
        hits += ok
        print(f'site 0x{va:x}  seg word 0x{start:x}  raw=0x{raw:08x}  '
              f'$GOA(0x{keya:x}, 0x{salt:x}) = {val} (0x{val:x})  '
              f'expected {EXPECTED[start]} ->', 'PASS' if ok else 'FAIL')
        records.append({
            'site_va': f'0x{va:x}', 'start': f'0x{start:x}',
            'keyA': f'0x{keya:x}', 'salt': f'0x{salt:x}',
            'raw': f'0x{raw:08x}', 'value': val,
            'semantics': semantics, 'confidence': conf,
        })
    print(f'cross-check vs committed pass-3 record: {hits}/8')
    assert hits == 8, 'live-pool values do not reproduce the committed record'

    out = {
        '$schema_note': '$Pg live-pool holder-segment constants — materialization of the '
                        'Build I (Task 51) ad-hoc decode (pg-branches-decode.txt pass 3); '
                        'chain identical to the R2 static decoder (shared $GOA/$kK core); '
                        'raw segment words recorded here for the first time',
        'game_version': '6.9.18',
        'generated': datetime.date.today().isoformat(),
        'provenance': {
            'libil2cpp_sha256': so_sha, 'global_metadata_sha256': md_sha,
            'secret_key_sha256': key_sha,
            'segment_fdv_offset': f'0x{off2:X}', 'segment_cbc_keyA': f'0x{ka2:X}',
            'segment_cbc_salt': f'0x{sa2:X}',
            'grid_scan': 'k=-4 on the 0x808-stride family (0xDBFC10 - 4*0x808)',
            'evidence': 'reverse/evidence/combat/pg-branches-decode.txt (pass 1 callsites + pass 3 decode)',
            'sanity_crosscheck': 'reverse/evidence/obfuz/obfuz-pool-values.json idx 0',
        },
        'validation': {
            'goa_canary': 'PASS', 'pool_idx0_rederivation': 'PASS',
            'values_match_committed_record': '8/8 PASS',
        },
        'records': records,
    }
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    json.dump(out, open(args.out, 'w'), indent=1)
    print('->', args.out)


if __name__ == '__main__':
    main()
