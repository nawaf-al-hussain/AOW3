#!/usr/bin/env python3
"""UnitType vtable-call-site scan (6.9.18): who reads tick_to_spec / tick_from_spec / spec.
Anchors: UnitType.get_Type = klass+0x4D8 (verified in GAICommandSpecMode act-2/3 arm)."""
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

WANT={0x448:'ut get_TickToSpec',0x418:'ut get_TickFromSpec',0x3B8:'ut get_Spec',
      0x4D8:'ut get_Type',0x70:'ut get_SniperLikeSiegeMode'}
(e_phoff,)=struct.unpack_from('<Q',data,0x20)
(e_ps,e_pn)=struct.unpack_from('<HH',data,0x36)
segs=[]
for i in range(e_pn):
    b=e_phoff+i*e_ps
    pt=struct.unpack_from('<I',data,b)[0]
    po,pv=struct.unpack_from('<QQ',data,b+8)[:2]
    fs=struct.unpack_from('<Q',data,b+32)[0]
    if pt==1: segs.append((po,pv,fs))

SIM_LO,SIM_HI = 0x4400000,0x4C00000
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
            if va and SIM_LO<=va<SIM_HI:
                st,nm=fn_of(va)
                res.setdefault(WANT[imm],[]).append((va,st,nm))

out=['UNITTYPE VTABLE CALL SITES in sim range 0x4400000-0x4C00000 (6.9.18)']
for k in sorted(res):
    out.append('\n== %s: %d sites'%(k,len(res[k])))
    fns={}
    for va,st,nm in res[k]: fns.setdefault((st,nm),[]).append(va)
    for (st,nm),vs in sorted(fns.items()):
        out.append('   %s @0x%x sites: %s'%(nm[:100],st,','.join(hex(v) for v in vs)))
open('/home/z/my-project/aow3-work/untype-vt-scan.txt','w').write('\n'.join(out)+'\n')
print('written', file=sys.stderr)
for k in sorted(res):
    print(k, len(res[k]))
