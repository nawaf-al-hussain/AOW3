#!/usr/bin/env python3
"""Task 38 / Build G2 step 6 — synthetic Frida-dump generator + consumer test.

No Android device is attached to this sandbox, so the obfuz_pool_emulator.py
--dump consumer is validated end-to-end against a SYNTHETIC transcript:
  - two 2048-B plaintext segments built by placing sampled raw values at the
    real triples' segment offsets (raw chosen, expected = $GOA(raw,k,s) recorded)
  - cipher computed by the CBC ENCRYPT under keyA=0 (identity: the only
    analytically invertible op) — this exercises the consumer's CBC re-verify
  - canary event with the real K
The real crypto is already validated by Build G's $qk self-test; this run
validates transcript parsing, slot mapping (0xb8->0x1810 normalization), CBC
re-verify, per-value decode and anchor reporting.
"""
import struct, json, base64, random, sys
sys.path.insert(0, '/home/z/my-project/aow3-work')
from obfuz_pool_emulator import (load_so, make_uc, load_key, moa_decrypt,
                                 QK_TRIPLE)

OUT = '/home/z/my-project/aow3-work/synthetic_pool_dump.jsonl'
EXPECT = '/home/z/my-project/aow3-work/synthetic_expectations.json'
SALT_SYNTH = 0xD9A4BEEF


def cbc_encrypt_identity(plain, salt):
    """cipher_i = plain_i ^ cipher_{i-1} — inverse of $mOA CBC with keyA=0."""
    cip = bytearray(len(plain))
    prev = 0
    n4 = (len(plain) // 4) * 4
    for i in range(n4 // 4):
        pw = struct.unpack_from('<I', plain, 4 * i)[0]
        cw = pw ^ prev
        struct.pack_into('<I', cip, 4 * i, cw)
        prev = cw
    tail = plain[n4:]
    return bytes(cip) + bytes(b ^ (salt & 0xFF) for b in tail)


def main():
    so, segs = load_so()
    kf, key_blob = load_key()
    goa = make_uc(so, segs, key_blob)
    vals = json.load(open('/home/z/my-project/aow3-work/obfuz_cctor_triples.json'))

    rng = random.Random(0x0BF0)
    noise = bytes(rng.randrange(256) for _ in range(4096))

    plans = {'0x1008': [], '0x1810': []}
    expect = []
    # sample: all 7 anchor-target ints (slot 0x1008), plus 8 ordinary ints per
    # slot, the 0x1008 float, and 3 length>=4 strings from slot 0x1008
    anchors = {v['target']: v for v in vals if v['thunk'] == 'int' and v.get('target') in (4, 8, 0x14, 0x64, 0x364, 0x368, 0x374)}
    for t, v in anchors.items():
        plans['0x1008'].append(('int', v))
    others = {'0x1008': [], '0x1810': []}
    for v in vals:
        s = '0x1810' if v.get('src_slot') in (0xb8, 6160) else ('0x1008' if v.get('src_slot') == 4104 else None)
        if s is None:
            continue
        if v['thunk'] == 'int' and 0 < v.get('start', -1) < 0x800 and v.get('target') not in anchors:
            others[s].append(v)
        elif v['thunk'] == 'float' and s == '0x1008':
            plans[s].append(('float', v))
        elif v['thunk'] == 'string' and s == '0x1008' and 4 <= v['keyA'] <= 24:
            others[s].append(v)
    for s in plans:
        pass  # deterministic picks below
    strs1008 = [v for v in others['0x1008'] if v['thunk'] == 'string'][:3]
    # reserve string byte ranges so int placements cannot overwrite them
    reserved = [(v['start'], v['start'] + (v['keyA'] & 0xFFFF)) for v in strs1008]
    def collides(v):
        st = v['start']
        return any(st < b and st + 4 > a for a, b in reserved)
    ints1008 = [v for v in others['0x1008'] if v['thunk'] == 'int' and not collides(v)][:8]
    ints1810 = [v for v in others['0x1810'] if v['thunk'] == 'int'][:8]
    for v in ints1008 + strs1008:
        plans['0x1008'].append((v['thunk'], v))
    for v in ints1810:
        plans['0x1810'].append((v['thunk'], v))

    seg_plain = {}
    for slot, items in plans.items():
        buf = bytearray(noise[:2048])
        for kind, v in items:
            st = v['start']
            if kind in ('int', 'float'):
                raw = rng.randrange(1 << 32)
                exp = goa(raw, v['keyA'], v['salt'])
                struct.pack_into('<I', buf, st, raw)
                expect.append({'slot': slot, 'start': st, 'target': v.get('target'),
                               'thunk': kind, 'raw': hex(raw),
                               'expected': exp,
                               'expected_float': struct.unpack('<f', struct.pack('<I', exp))[0] if kind == 'float' else None})
            else:
                ln = v['keyA'] & 0xFFFF
                s = bytes(rng.randrange(0x41, 0x5B) for _ in range(ln))  # A-Z
                buf[st:st + ln] = s
                expect.append({'slot': slot, 'start': st, 'thunk': 'string',
                               'raw': s.hex(), 'expected_str': s.decode()})
        seg_plain[slot] = bytes(buf)

    lines = []
    k = goa(*QK_TRIPLE[:3])
    lines.append({'ev': 'qk', 'a': hex(QK_TRIPLE[3]), 'b': hex(k)})
    for slot, plain in seg_plain.items():
        cip = cbc_encrypt_identity(plain, SALT_SYNTH)
        lines.append({
            'ev': 'seg', 'seq': len(lines), 'cs': 'SYNTH',
            'mgr': 'synthetic', 'slot': slot,
            'keyA': hex(0), 'salt': hex(SALT_SYNTH),
            'clen': 2048,
            'cipher': base64.b64encode(cip).decode(),
            'plain': base64.b64encode(plain).decode()
        })
    open(OUT, 'w').write('\n'.join('[OBFUZ]' + json.dumps(l) for l in lines) + '\n')
    json.dump(expect, open(EXPECT, 'w'), indent=1)
    print(f'synthetic dump -> {OUT} ({len(lines)} events, 2 segments x 2048 B)')
    print(f'expectations  -> {EXPECT} ({len(expect)} sampled values)')


if __name__ == '__main__':
    main()
