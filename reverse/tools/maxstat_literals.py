#!/usr/bin/env python3
"""Build J part 1b — extract the Calculate/CalculateWeaponArmorDamage literal-pool
constants + pin Nullable<float> field order from StatInfo.Max3."""
import struct

SO = '/home/z/my-project/aow3-work/native/libil2cpp.so'

segs = []
so = open(SO, 'rb').read()
(e_phoff,) = struct.unpack_from('<Q', so, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', so, 0x36)
for i in range(e_pn):
    b = e_phoff + i * e_ps
    if struct.unpack_from('<I', so, b)[0] == 1:
        po, pv = struct.unpack_from('<QQ', so, b + 8)[:2]
        fs = struct.unpack_from('<Q', so, b + 32)[0]
        segs.append((po, pv, fs))


def va2off(va):
    for po, pv, fs in segs:
        if pv <= va < pv + fs:
            return va - pv + po
    return None


LITS = {
    'K1 (Calculate path A multiplier)': 0x1B09A88,
    'K2 (Calculate path B multiplier)': 0x1B099C4,
    'K3 (Calculate path B addend)': 0x1B09B4C,
    'K4 (Calculate path C multiplier)': 0x1B09D58,
    'KA (WeaponArmorDamage scale)': 0x1B099F0,
    'KM (WeaponArmorDamage B multiplier)': 0x1B09B9C,
}
for name, va in LITS.items():
    off = va2off(va)
    bits = struct.unpack_from('<I', so, off)[0]
    f = struct.unpack('<f', struct.pack('<I', bits))[0]
    print('%-38s @%#x = %.6g  (bits %#x)' % (name, va, f, bits))

# also dump the surrounding literal pool 0x1B099A0..0x1B09D80 for context
print('\nliteral pool words 0x1B099A0..0x1B09D80 (float interpretation):')
for va in range(0x1B099A0, 0x1B09D80, 4):
    off = va2off(va)
    bits = struct.unpack_from('<I', so, off)[0]
    f = struct.unpack('<f', struct.pack('<I', bits))[0]
    if bits and (abs(f) > 1e-6 and abs(f) < 1e8):
        print('  %#x = %.6g' % (va, f))

# sanity: known constants 1.0 / 0.9 / 0.1 encodings for reference
print('\nreference: 1.0=%#x 0.9=%#x 0.1=%#x' % (
    struct.unpack('<I', struct.pack('<f', 1.0))[0],
    struct.unpack('<I', struct.pack('<f', 0.9))[0],
    struct.unpack('<I', struct.pack('<f', 0.1))[0]))
