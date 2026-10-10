#!/usr/bin/env python3
"""R6 phase 2b — terrain LUT dump + bundle MonoScripts + bits 7/14 name hunt."""
import struct, re, collections

import UnityPy

UnityPy.config.FALLBACK_UNITY_VERSION = "2022.3.20f1"

SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
DUMP = '/home/z/my-project/re-work/dump/dump.cs'
BUNDLE = "/home/z/my-project/scripts/bundles_all/map.prefab.bundle"

data = open(SO, 'rb').read()
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt = struct.unpack_from('<I', data, b)[0]
    po, pv = struct.unpack_from('<QQ', data, b + 8)[:2]
    fs = struct.unpack_from('<Q', data, b + 32)[0]
    if pt == 1:
        segs.append((po, pv, fs))

def va2off(va):
    for po, pv, fs in segs:
        if pv <= va < pv + fs:
            return va - pv + po
    return None

# --- 1. terrain LUT @ 0x1BFE5BC (5 x u16) ---
o = va2off(0x1BFE5BC)
lut = struct.unpack_from('<5H', data, o)
names = {0: 'Barrier', 1: 'Land', 2: 'Forest', 3: 'Shore', 4: 'Water',
         5: 'Fog', 6: 'Dark', 7: 'bit7(0x80)', 8: 'Building', 9: 'BuildingBand',
         10: 'BuildingBarrier', 11: 'VisUnit', 12: 'VisEnemy', 13: 'CamInvis',
         14: 'bit14(0x4000)', 15: 'bit15'}
def bitnames(v):
    return '|'.join(names[b] for b in range(16) if v >> b & 1) or '-'
print('terrain LUT @0x1BFE5BC (5 x u16):')
for i, v in enumerate(lut):
    print('  kind %d = 0x%04X  [%s]' % (i, v, bitnames(v)))

# --- 2. MonoScripts + biggest MonoBehaviours in map.prefab.bundle ---
env = UnityPy.Environment()
env.load_files([BUNDLE])
scripts = []
mbs = []
for obj in env.objects:
    if obj.type.name == 'MonoScript':
        d = obj.read()
        scripts.append((d.m_Name, d.m_Namespace, d.m_ClassName, obj.path_id))
    elif obj.type.name == 'MonoBehaviour':
        try:
            d = obj.read()
            sc = d.m_Script
            spid = sc.path_id if sc else 0
            raw = obj.get_raw_data()
            mbs.append((obj.path_id, spid, len(raw), raw))
        except Exception:
            pass
print('\nMonoScripts in map.prefab.bundle:')
for n, ns, cl, pid in scripts:
    print('  name=%s ns=%s class=%s pid=%s' % (n, ns, cl, pid))
print('\n3 biggest MonoBehaviours raw hex:')
for pid, spid, sz, raw in sorted(mbs, key=lambda x: -x[2])[:3]:
    print('  pid=%s script=%s size=%d' % (pid, spid, sz))
    print('   ', raw[:96].hex())

# --- 3. bits 7/14 name hunt in dump.cs: short/byte/int consts = 128 / 16384 ---
lines = open(DUMP).read().split('\n')
pat = re.compile(r'public const (short|byte|int|sbyte|ushort) (\S+) = (128|16384|0x80|0x4000);')
hits = []
for i, l in enumerate(lines):
    m = pat.match(l.strip())
    if m:
        hits.append((i + 1, m.group(0), lines[i - 1].strip()[:60]))
print('\ndump.cs consts = 128/16384 (name hunt for bits 7/14): %d hits' % len(hits))
for ln, txt, ctx in hits[:40]:
    print('  L%d: %s   %s' % (ln, txt, ctx))

# --- 4. any other "*Mask*" const shorts outside ClientBattleCell (context check) ---
pat2 = re.compile(r'public const short (\w*Mask\w*) = (0x[0-9A-Fa-f]+|\d+);')
masks = collections.defaultdict(list)
cur = ''
for i, l in enumerate(lines):
    s = l.strip()
    if s.startswith('public class') or s.startswith('public enum') or s.startswith('public struct'):
        cur = s[:70]
    m = pat2.match(s)
    if m:
        masks[cur].append((m.group(1), m.group(2), i + 1))
print('\nclasses declaring short *Mask* consts:')
for cls, items in masks.items():
    print(' ==', cls)
    for n, v, ln in items:
        print('    %s = %s (L%d)' % (n, v, ln))
