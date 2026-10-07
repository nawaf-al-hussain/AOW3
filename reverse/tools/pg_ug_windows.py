#!/usr/bin/env python3
"""Windows around $UG(Battle,Unit,int) and $dC(Battle,Unit,Dynamic) call sites in $Pg,
plus the tail of $sH usage — find the leash value's data source."""
import struct, re, bisect
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

SITES=[0x483f014,0x483e868,0x483e3d4]
START=0x483C244; END=0x48470d0
out=['$Pg leash-source windows: $UG / $dC / $yG call sites']
for site in SITES:
    lo=site-0x70; hi=site+0x40
    out.append('\n---- window around call @0x%x ----'%site)
    oo=va2off(lo)
    for i2 in md.disasm(data[oo:oo+(hi-lo)],lo):
        line='  0x%x: %-8s %s'%(i2.address,i2.mnemonic,i2.op_str)
        if i2.mnemonic=='bl':
            nm=rva2name.get(i2.operands[0].imm)
            if nm: line+='   ; -> %s'%nm[:80]
        m=re.search(r'\[x\d+, #(0x[0-9a-f]+)\]',line)
        if m:
            v=int(m.group(1),16)
            UF={0x80:'distance',0x88:'obj',0x90:'objPreferred',0x158:'patrolDefend',0x150:'patrol',
                0x104:'task_until_tick',0x98:'obj_id',0x70:'dest_x',0x72:'dest_y',0x48:'x',0x4A:'y',
                0x40:'un_type',0x6A:'task',0xE4:'walk_state',0xE8:'walk_state_tick',0x9D:'think'}
            if v in UF: line+='   ; UNIT.%s'%UF[v]
        out.append(line)
open('/home/z/my-project/aow3-work/pg-ug-windows.txt','w').write('\n'.join(out)+'\n')
print('written')
