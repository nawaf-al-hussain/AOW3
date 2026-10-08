#!/usr/bin/env python3
"""Build a method-RVA index from dump.cs -> JSON, for call-site attribution.
Reused by prototype-pipeline tools (same approach as pin_estat_bindings.py)."""
import re, json, sys

DUMP = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/scripts/dumpcs/dump.cs'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/z/my-project/scripts/rva_index.json'

rva_re = re.compile(r'// RVA: 0x([0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: 0x[0-9A-Fa-f]+')
name_re = re.compile(r'^(?:public|private|protected|internal|\[.*?\]\s)*[\w<>,\[\]\.\(\)`~&|:\s]*?\b([\w<>,\.`]+)\(')

idx = {}
cls = ''
with open(DUMP, 'r', encoding='utf-8', errors='replace') as f:
    cur = None
    for line in f:
        m = re.match(r'^(?:public|internal|private|protected|sealed|abstract|static|partial|readonly)?[\w<>,\[\]\.\s]*class\s+([\w\.<>,`]+)', line)
        if m and not line.startswith('//'):
            cls = m.group(1)
        m = rva_re.search(line)
        if m:
            rva = int(m.group(1), 16)
            # method name is on the NEXT non-comment line
            nxt = f.readline()
            while nxt.strip().startswith('//') or nxt.strip() == '':
                nxt = f.readline()
            nm = nxt.strip()
            if rva and rva not in idx:
                idx[rva] = (cls, nm)
json.dump({hex(k): v for k, v in idx.items()}, open(OUT, 'w'))
print('indexed', len(idx), 'methods ->', OUT)
