#!/usr/bin/env python3
"""B7 pass 2 — decode INLINE $gK accessor calls found in the value-domain decode.
Reuses the committed R2 GOA emulator (obfuz_static_decode.py) with per-site triples."""
import struct, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from obfuz_static_decode import (make_uc, load_so, HOLDER_SEGS, _find,
                                 CCTOR_VA, GOA_VA, QK_TRIPLE)
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN
import obfuz_static_decode as R2

SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
KEY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'obfuz_secret_key.bin')

so, segs = R2.load_so(SO)
goa = R2.make_uc(so, segs, open(KEY, 'rb').read())   # make_uc returns the goa closure

# canary self-test
K = goa(QK_TRIPLE[0], QK_TRIPLE[1], QK_TRIPLE[2])
print('canary:', hex(K), 'PASS' if K == QK_TRIPLE[3] else 'FAIL')

# rebuild segments exactly like main() does
import inspect
src = inspect.getsource(R2.main)
S = {}
# replicate: S[segk] = moa_decrypt(goa, blob, ka, sa) over HOLDER_SEGS
for segk, (fdv_off, ka, sa) in R2.HOLDER_SEGS.items():
    md = _find('global-metadata.dat', '/home/z/my-project/aow3-extract') or \
         '/home/z/my-project/aow3-extract/global-metadata.dat'
    blob = open(md, 'rb').read()[fdv_off:fdv_off + 2048]
    S[segk] = R2.moa_decrypt(goa, blob, ka, sa)
    print(f'segment {segk}: decrypted {len(S[segk])} bytes')

def s32(u): return u if u < 2**31 else u - 2**32

# inline accessor triples from the pass-2 decode (site -> (start, keyA, salt))
SITES = {
    'PathAct.$Qe wait-arbitration const (0x476AA94)': (0xd8, 0x27428CBF, 0x3d),
}
for label, (start, ka, sa) in SITES.items():
    for segk, seg in S.items():
        raw = struct.unpack_from('<I', seg, start)[0]
        d = goa(raw, ka, sa)
        print(f'{label}  seg {segk}: raw={hex(raw)} -> value={d} (signed {s32(d)})')
