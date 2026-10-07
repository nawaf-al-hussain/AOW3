#!/usr/bin/env python3
"""Windows around siege-relevant sites in $ce (0x47501f0) and $fe (0x475afa4).
Annotates UnitType vtable getters, Unit vtable siege accessors, direct siege fields."""
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
def next_rva(va):
    idx=bisect.bisect_right(fn_rvas,va)
    return fn_rvas[idx] if idx<len(fn_rvas) else va+0x4000
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

UT={0x418:'get_TickFromSpec',0x448:'get_TickToSpec',0x3B8:'get_Spec',0x4D8:'get_Type',0x70:'SniperLike'}
UU={0xDC8:'get_SiegeStage',0xDE0:'set_SiegeStage',0xDF8:'get_SiegeTick',0xE10:'set_SiegeTick',
    0xE28:'get_SiegeAfterWalkTick',0xE40:'set_SiegeAfterWalkTick',0xE58:'get_SiegeBlocked',
    0xE70:'set_SiegeBlocked',0x1008:'get_Task',0x1020:'set_Task',0x1068:'get_TaskUntilTick',
    0x1080:'set_TaskUntilTick',0xC18:'get_PatrolDefend',0xC30:'set_PatrolDefend'}
UF={0xA1:'siege_stage',0xA4:'siegeTick',0xA8:'siegeAfterWalkTick',0x1C4:'siege_blocked',0x6A:'task',0x69:'task_visual'}

GROUPS = {
 0x47501f0:('$ce(Battle,Unit) siege stage machine?',[0x4750f78,0x47516bc,0x4751700,0x4752e9c,0x4752fdc,0x4753218,0x47534d0,0x475359c,0x4753cf4,0x4753f64]),
 0x475afa4:('$fe(Battle,Unit)',[0x475afe0,0x475b4e0]),
}
out=[]
for fst,(label,sites) in GROUPS.items():
    end=next_rva(fst)
    out.append('\n######## %s @ 0x%x .. 0x%x (%d bytes) ########'%(label,fst,end,end-fst))
    for s in sorted(set(sites)):
        lo=max(fst,s-0xb0); hi=min(end,s+0xc0)
        out.append('\n---- window 0x%x..0x%x (site 0x%x) ----'%(lo,hi,s))
        o=va2off(lo)
        for ins in md.disasm(data[o:o+(hi-lo)],lo):
            line='  0x%x: %-8s %s'%(ins.address,ins.mnemonic,ins.op_str)
            if ins.mnemonic=='bl':
                nm=rva2name.get(ins.operands[0].imm)
                if nm: line+='   ; -> %s'%nm[:85]
            m=re.search(r'ldr\s+x\d+, \[x\d+, #(0x[0-9a-f]+)\]',line)
            if m:
                v=int(m.group(1),16)
                if v in UT: line+='   ; UNITTYPE.'+UT[v]
                if v in UU: line+='   ; UNIT.'+UU[v]
            m2=re.search(r'(ldr|str|ldrsb|stur|ldur)(s?)(b|h)?\s+w\d+, \[x\d+, #(0x[0-9a-f]+)\]',line)
            if m2:
                v=int(m2.group(4),16)
                if v in UF: line+='   ; UNIT.%s'%UF[v]
            if 'cmp' in line or 'tbnz' in line or 'tbz' in line or 'cbz' in line or 'cbnz' in line:
                line+='   ; BR'
            out.append(line)
open('/home/z/my-project/aow3-work/siege-ce-fe-windows.txt','w').write('\n'.join(out)+'\n')
print('written', len(out), 'lines')
