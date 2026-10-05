#!/usr/bin/env python3
"""Drop skin references from GLBs whose primitives lack JOINTS_0/WEIGHTS_0
(silences GLTFLoader 'skinning disabled' warnings; units render rigid)."""
import json, struct, os, sys

d = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/scripts/AOW3-repo/docs/assets/models'

def fix(path):
    with open(path, 'rb') as f:
        data = f.read()
    clen, ctype = struct.unpack('<II', data[12:20])
    js = json.loads(data[20:20+clen])
    off = 20 + clen
    blen, btype = struct.unpack('<II', data[off:off+8])
    binchunk = bytearray(data[off+8:off+8+blen])
    changed = False
    # meshes whose prims all lack JOINTS_0 -> strip skin refs
    for ni, nd in enumerate(js.get('nodes', [])):
        if 'mesh' not in nd or 'skin' not in nd:
            continue
        m = js['meshes'][nd['mesh']]
        has_joints = all('JOINTS_0' in p.get('attributes', {}) for p in m.get('primitives', []))
        if not has_joints:
            del nd['skin']
            changed = True
    # drop now-unreferenced skins
    used = {nd['skin'] for nd in js.get('nodes', []) if 'skin' in nd}
    if len(used) < len(js.get('skins', [])):
        js['skins'] = [s for i, s in enumerate(js.get('skins', [])) if i in used]
        changed = True
    if not changed:
        return False
    jsbytes = json.dumps(js, separators=(',', ':')).encode()
    while len(jsbytes) % 4:
        jsbytes += b' '
    while len(binchunk) % 4:
        binchunk += b'\0'
    total = 12 + 8 + len(jsbytes) + 8 + len(binchunk)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(jsbytes), 0x4E4F534A))
        f.write(jsbytes)
        f.write(struct.pack('<II', len(binchunk), 0x004E4942))
        f.write(binchunk)
    return True

for f in sorted(os.listdir(d)):
    if f.endswith('.glb'):
        if fix(os.path.join(d, f)):
            print('fixed', f)
print('done')
