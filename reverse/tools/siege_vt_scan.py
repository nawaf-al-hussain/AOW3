#!/usr/bin/env python3
"""Vtable-call-site scan for Unit siege accessors (6.9.18).
Unit vtable base file offset 0x138A480 (anchored on get_Task = [klass+0x1008]
from specmode-native.txt act-7 arm)."""
import struct, re, bisect, sys

data = open('/home/z/my-project/aow3-work/libil2cpp.so','rb').read()
lines = open('/home/z/my-project/aow3-work/dump.cs').read().split('\n')
rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
fn_rvas=[]; fn_name={}
for i,l in enumerate(lines):
    m=rvapat.match(l.strip())
    if m:
        rva=int(m.group(1),16)
        if rva>0:
            fn_rvas.append(rva); fn_name[rva]=lines[i+1].strip()[:110]
fn_rvas.sort()
def fn_of(va):
    idx=bisect.bisect_right(fn_rvas,va)-1
    return fn_rvas[idx] if idx>=0 else 0, fn_name.get(fn_rvas[idx] if idx>=0 else 0,'sub_%x'%va)

extra={'get_SeraphimSiege':0x45B0474,'siegeOnWalk':0x45B02C8,'get_TypeAutoSiege':0x45B04DC,
       'get_StateAutoSiege':0x45B0A04,'ut_get_Spec':0x45B4828,'ut_get_TickToSpec':0x45B4858,
       'ut_get_TickFromSpec':0x45B4848,'ut_get_Type':0x45B4888}
slots={'get_SiegeStage':0xDC8,'set_SiegeStage':0xDE0,'get_SiegeTick':0xDF8,'set_SiegeTick':0xE10,
       'get_SiegeAfterWalkTick':0xE28,'set_SiegeAfterWalkTick':0xE40,'get_SiegeBlocked':0xE58,
       'set_SiegeBlocked':0xE70}
BASE=0x138A480
for nm,va in extra.items():
    j=data.find(struct.pack('<Q',va),0x138A000,0x138D000)
    if j>=0: slots[nm]=j-BASE
print('slots:',{k:hex(v) for k,v in slots.items()}, file=sys.stderr)

WANT={v:k for k,v in slots.items()}
(e_phoff,)=struct.unpack_from('<Q',data,0x20)
(e_ps,e_pn)=struct.unpack_from('<HH',data,0x36)
segs=[]
for i in range(e_pn):
    b=e_phoff+i*e_ps
    pt=struct.unpack_from('<I',data,b)[0]
    po,pv=struct.unpack_from('<QQ',data,b+8)[:2]
    fs=struct.unpack_from('<Q',data,b+32)[0]
    if pt==1: segs.append((po,pv,fs))
words = struct.unpack('<%dI'%(len(data)//4), data[:len(data)//4*4])
res={}
for idx in range(len(words)):
    w=words[idx]
    if (w>>22)==0b1111100101:
        imm=((w>>10)&0xFFF)*8
        if imm in WANT:
            off=idx*4
            va=None
            for po,pv,fs in segs:
                if po<=off<po+fs: va=off-po+pv; break
            if va:
                st,nm=fn_of(va)
                res.setdefault(WANT[imm],[]).append((va,st,nm))

out=['UNIT VTABLE SIEGE-ACCESSOR CALL SITES (6.9.18)']
for k in sorted(res):
    out.append('\n== vt %s: %d sites'%(k,len(res[k])))
    fns={}
    for va,st,nm in res[k]: fns.setdefault((st,nm),[]).append(va)
    for (st,nm),vs in sorted(fns.items()):
        out.append('   %s @0x%x sites: %s'%(nm[:100],st,','.join(hex(v) for v in vs)))
open('/home/z/my-project/aow3-work/siege-vt-scan.txt','w').write('\n'.join(out)+'\n')
print('written', file=sys.stderr)
for k in sorted(res):
    print(k, len(res[k]))
