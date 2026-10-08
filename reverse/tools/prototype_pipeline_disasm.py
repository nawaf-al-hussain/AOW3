#!/usr/bin/env python3
"""R1 prototype-data pipeline disassembly + call-site attribution (Task 41).

Disassembles logon/resource-dictionary pipeline methods at dump.cs RVAs and
attributes every BL target via the dump.cs RVA index (build_rva_index.py).
"""
import struct, sys, json, os, re
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/scripts/aow3-bin/lib/arm64-v8a/libil2cpp.so'
IDX = sys.argv[2] if len(sys.argv) > 2 else '/home/z/my-project/scripts/rva_index.json'
IDX = json.load(open(IDX))

data = open(SO, 'rb').read()
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    pt, _ = struct.unpack_from('<II', data, base)
    po, pv, _, pf = struct.unpack_from('<QQQQ', data, base + 8)
    if pt == 1:
        segs.append((po, pv, pf))

def va2off(va):
    for po, pv, sz in segs:
        if pv <= va < pv + sz:
            return va - pv + po
    return None

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)

def attr(target):
    e = IDX.get(hex(target))
    if e:
        return f'{e[0]}.{e[1].split("(")[0].split()[-1]}'
    return ''

def disasm(name, va, size, regs=True):
    off = va2off(va)
    if off is None:
        print(f'==== {name} @ {va:#x}: VA NOT MAPPED'); return
    print(f'==== {name} @ {va:#x} ====')
    out = []
    for ins in md.disasm(data[off:off + size], va):
        line = f'  {ins.address:#x}: {ins.mnemonic} {ins.op_str}'
        if ins.mnemonic in ('bl', 'b') and ins.op_str.startswith('#'):
            t = int(ins.op_str[1:], 16)
            a = attr(t)
            if a:
                line += f'   ; {a}'
        out.append((ins.address, line))
    for _, l in out:
        print(l)
    print()

TARGETS = [
    ('CSMainLogonManager.LoadBattleBaseDictionary', 0x7DC3C90, 0x340),
    ('CSMainClientResourceConfigurationReceiver.ProcessMessage', 0x7DBAA58, 0x260),
    ('CSMainBattleBaseDictionaryReceiver.ProcessDictionary', 0x7DBA420, 0x1B0),
    ('CSMainBattleBaseDictionaryReceiver.DoResourceLoaded', 0x7DBA3B4, 0x6C),
    ('CSAbstractSerializableResourceLoader<object>.StartLoading', 0x6E3F220, 0x170),
    ('CSAbstractSerializableResourceLoader<object>.OnResourceLoaded', 0x6E3F390, 0x120),
    ('SnapshotDataLoader.DeserializeDictionary', 0x7D28F9C, 0x280),
    ('AuthorizationCache.GetFilename', 0x7D76F44, 0xA0),
    ('AuthorizationCache.Save', 0x7D76FE4, 0x780),
    ('CSMainLogonManager.LoadSharedBaseDictionary', 0x7DC3A8C, 0x200),
    ('CSMainLogonManager.LoadBaseDictionary', 0x7DC3084, 0x200),
]
only = os.environ.get('ONLY')
for name, va, size in TARGETS:
    if only and only not in name:
        continue
    disasm(name, va, size)
