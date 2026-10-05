#!/usr/bin/env python3
"""Quick GLB inspector: dump mesh/primitive/texture stats for decor assets."""
import json, struct, sys, os

def inspect(path):
    with open(path, 'rb') as f:
        data = f.read()
    magic, ver, length = struct.unpack('<III', data[:12])
    if magic != 0x46546C67:
        return {'err': 'not glb'}
    clen, ctype = struct.unpack('<II', data[12:20])
    js = json.loads(data[20:20+clen])
    meshes = js.get('meshes', [])
    mats = js.get('materials', [])
    imgs = js.get('images', [])
    nodes = js.get('nodes', [])
    prims = sum(len(m.get('primitives', [])) for m in meshes)
    info = {
        'file': os.path.basename(path),
        'kb': len(data)//1024,
        'meshes': len(meshes), 'prims': prims,
        'materials': [m.get('name','?') for m in mats][:4],
        'images': [i.get('name', i.get('uri','?')) for i in imgs][:4],
        'nodes': [n.get('name','?') for n in nodes][:8],
        'meshNames': [m.get('name','?') for m in meshes][:6],
    }
    # accessor bbox for POSITION
    accs = js.get('accessors', [])
    pos = [a for a in accs if a.get('type') == 'VEC3' and 'min' in a]
    if pos:
        mins = [a['min'] for a in pos[:6]]
        maxs = [a['max'] for a in pos[:6]]
        info['bbox_min_sample'] = mins[0]
        info['bbox_max_sample'] = maxs[0]
        info['verts_total'] = sum(a.get('count',0) for a in accs if a.get('type')=='VEC3')
    return info

if __name__ == '__main__':
    d = sys.argv[1] if len(sys.argv) > 1 else '.'
    files = sys.argv[2:] or sorted(os.listdir(d))[:8]
    for f in files:
        p = os.path.join(d, f) if not f.startswith('/') else f
        if not p.endswith('.glb'):
            continue
        try:
            i = inspect(p)
            print(json.dumps(i))
        except Exception as e:
            print(f, 'ERROR', e)
