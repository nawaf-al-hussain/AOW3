#!/usr/bin/env python3
"""Build B — UnitTakePositionsManager decode (client placement surface, 6.9.18).
Methods (dump.cs:310002+):
  .cctor                  0x81D4DF4  (static occupancy masks)
  GetUnitOccupancyMask    0x81D43BC
  GetHeroUnitOccupancyMask0x81D4568
  CalculateCellsMask      0x81D4780
  SendNearestUnitToCell   0x81D4954
  Update                  0x81D4CC4
  get_NotSendedUnitsCount 0x81D3C34
  get_CellsMask           0x81D3C7C
  IsUnitAliveAndCanTakePositions 0x81D4364
"""
import struct, re, bisect, sys
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

data = open('/home/z/my-project/aow3-work/libil2cpp.so','rb').read()
lines = open('/home/z/my-project/aow3-work/dump.cs').read().split('\n')
rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_rvas=[]; rva2name={}
for i,l in enumerate(lines):
    m=rvapat.match(l.strip())
    if m:
        rva=int(m.group(1),16)
        if rva>0:
            fn_rvas.append(rva); rva2name[rva]=lines[i+1].strip()[:110]
fn_rvas.sort()
def next_rva(va):
    idx=bisect.bisect_right(fn_rvas,va)
    return fn_rvas[idx] if idx<len(fn_rvas) else va+0x2000
(e_phoff,)=struct.unpack_from('<Q',data,0x20)
(e_ps,e_pn)=struct.unpack_from('<HH',data,0x36)
segs=[]
for i in range(e_pn):
    b=e_phoff+i*e_ps
    pt=struct.unpack_from('<I',data,b)[0]
    po,pv=struct.unpack_from('<QQ',data,b+8)[:2]
    fs=struct.unpack_from('<Q',data,b+32)[0]
    if pt==1: segs.append((po,pv,fs))
def va2off(va):
    for po,pv,fs in segs:
        if pv<=va<pv+fs: return va-pv+po

md=Cs(CS_ARCH_ARM64,CS_MODE_LITTLE_ENDIAN); md.detail=True

METHODS = {
 0x81D4DF4:'.cctor (static masks)',
 0x81D43BC:'GetUnitOccupancyMask',
 0x81D4568:'GetHeroUnitOccupancyMask',
 0x81D4780:'CalculateCellsMask',
 0x81D4954:'SendNearestUnitToCell',
 0x81D4CC4:'Update',
 0x81D3C34:'get_NotSendedUnitsCount',
 0x81D3C7C:'get_CellsMask',
 0x81D4364:'IsUnitAliveAndCanTakePositions',
}
out=['BUILD B — UnitTakePositionsManager decode (client TakePositions placement)',
     'sha256 libil2cpp.so 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5','']
for va,label in METHODS.items():
    end=next_rva(va)
    out.append('\n==== %s @ 0x%x .. 0x%x (%d bytes) ===='%(label,va,end,end-va))
    o=va2off(va)
    for ins in md.disasm(data[o:o+(end-va)],va):
        line='  0x%x: %-8s %s'%(ins.address,ins.mnemonic,ins.op_str)
        if ins.mnemonic=='bl':
            nm=rva2name.get(ins.operands[0].imm)
            if nm: line+='   ; -> %s'%nm[:90]
        if 'ldr ' in line and '[x' in line:
            m=re.search(r'#(0x[0-9a-f]+)',line)
            if m and int(m.group(1),16)==0x40: line+='   ; CLASS-STATIC base?'
        out.append(line)
open('/home/z/my-project/aow3-work/takepos-native.txt','w').write('\n'.join(out)+'\n')
print('written takepos-native.txt')
