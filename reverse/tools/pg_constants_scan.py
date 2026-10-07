#!/usr/bin/env python3
"""Build C — UnitAct.$Pg (0x483C244) chase machine constant-pool scan (6.9.18).
Extracts: bounds, immediate constants (movz/movk/cmp), float immediates,
BL targets, and the neighborhood of every distance-like comparison."""
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

START=0x483C244
END=next_rva(START)
print('$Pg bounds: 0x%x .. 0x%x (%d bytes)'%(START,END,END-START))
o=va2off(START)
md=Cs(CS_ARCH_ARM64,CS_MODE_LITTLE_ENDIAN); md.detail=True

ins_list=list(md.disasm(data[o:o+(END-START)],START))
print('instructions:',len(ins_list))

# 1. BL target histogram
bls={}
consts=[]   # (addr, const) movz-immediates incl. shifted
floats=[]   # fmov/ldr-literal patterns
cmps=[]     # cmp/subs against immediates
fldacc={}   # ldr/str offsets histogram
for ins in ins_list:
    if ins.mnemonic=='bl':
        t=ins.operands[0].imm
        nm=rva2name.get(t,'sub_%x'%t)
        bls.setdefault(nm,[]).append(ins.address)
    if ins.mnemonic in ('cmp','subs') :
        m=re.search(r'#(0x[0-9a-f]+|\d+)$',ins.op_str)
        if m: cmps.append((ins.address,m.group(1)))
    if ins.mnemonic=='movz' or (ins.mnemonic=='mov' and re.search(r'w\d+, #(0x[0-9a-f]+|\d+)$',ins.op_str)):
        m=re.search(r'#(0x[0-9a-f]+|\d+)$',ins.op_str)
        if m:
            v=int(m.group(1),0)
            if v>10: consts.append((ins.address,v))
    if ins.mnemonic=='movk':
        m=re.search(r'#(0x[0-9a-f]+|\d+)(, lsl #\d+)?$',ins.op_str)
        if m: consts.append((ins.address,'movk '+m.group(0)))
    if ins.mnemonic in ('fmov','ldr') and 's0' in ins.op_str or 'd0' in ins.op_str:
        floats.append((ins.address,ins.mnemonic+' '+ins.op_str))
    m=re.search(r'(?:ldr|str)(?:b|sb|h|sh)?\s+w\d+, \[x\d+, (?:#)?(0x[0-9a-f]+)\]',ins.op_str)
    if m:
        v=int(m.group(1),16)
        fldacc[v]=fldacc.get(v,0)+1

out=['$Pg (0x%x..0x%x, %d bytes) constant-pool + structure scan'%(START,END,END-START),
     'sha256 8ace05bb… / 0050e67d…','',
     '== BL target histogram (top 40) ==']
for nm,ss in sorted(bls.items(),key=lambda kv:-len(kv[1]))[:40]:
    out.append('  %4dx  %s   first@0x%x'%(len(ss),nm[:90],ss[0]))
out.append('\n== cmp immediates (%d) =='%len(cmps))
for a,v in cmps: out.append('  0x%x: cmp #%s'%(a,v))
out.append('\n== mov constants > 10 (%d, first 80) =='%len(consts))
for a,v in consts[:80]: out.append('  0x%x: %s'%(a,v))
out.append('\n== float regs used (%d, first 40) =='%len(floats))
for a,v in floats[:40]: out.append('  0x%x: %s'%(a,v))
out.append('\n== field-offset histogram (top 40) ==')
for v,c in sorted(fldacc.items(),key=lambda kv:-kv[1])[:40]:
    out.append('  0x%-5x %d'%(v,c))
open('/home/z/my-project/aow3-work/pg-scan.txt','w').write('\n'.join(out)+'\n')
print('written pg-scan.txt')
