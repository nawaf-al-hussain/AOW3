#!/usr/bin/env python3
"""Build J part 2 — $Pg (0x483C244..0x48470D0) band local [sp+0x134] dataflow.

Backward register slice for every str/stur to [sp, #0x134]:
  - per site, the ordered defining chain of the stored W register
  - chain terminates at: band self-read (prev band), other stack slot loads,
    call-defined regs (bl/blr with symbol), adrp pages, immediates
Output: aow3-work/band-dataflow.txt
"""
import importlib.util
import re

from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

spec = importlib.util.spec_from_file_location(
    'm', '/home/z/my-project/scripts/pg_takepos_decode.py')
m = importlib.util.module_from_spec(spec)
src = open('/home/z/my-project/scripts/pg_takepos_decode.py').read().replace(
    "if __name__ == '__main__':", 'if False:')
exec(compile(src, 'm', 'exec'), m.__dict__)

so_b = open('/home/z/my-project/aow3-work/native/libil2cpp.so', 'rb').read()
m.load_so()
sym, _ = m.build_symbol_map()
md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)

PG_VA, PG_END = 0x483C244, 0x48470D0
OUT = '/home/z/my-project/aow3-work/band-dataflow.txt'
o = open(OUT, 'w')


def P(*a):
    s = ' '.join(str(x) for x in a)
    print(s)
    o.write(s + '\n')


off = m.va2off(PG_VA)
ins_list = list(md.disasm(so_b[off:off + (PG_END - PG_VA)], PG_VA))
P('$Pg disasm: %d instructions' % len(ins_list))

# ---- locate band stores ----
store_re = re.compile(r'^[wx]\d+, \[sp(?:, #0x([0-9a-f]+))?\]$')
stores = []          # (idx, ins, src_reg)
for i, ins in enumerate(ins_list):
    if ins.mnemonic in ('str', 'stur'):
        mm = store_re.match(ins.op_str)
        if mm and mm.group(1) == '134':
            src = ins.op_str.split(',')[0]
            stores.append((i, ins, src))
P('band stores: %d' % len(stores))
for i, ins, src in stores:
    P('  %#x  %s %s' % (ins.address, ins.mnemonic, ins.op_str))
P('')

RD = re.compile(r'^(?:ldr|ldur|ldp|ldur|adrp|mov|movz|movk|orr|add|sub|mul|'
                r'sdiv|udiv|and|eor|madd|msub|lsl|lsr|asr|sxtw|sxth|sxtb|'
                r'uxtw|uxth|cset|csinc|csel|csneg|fmov|fcvt|scvtf|ucvtf|nop)')
WRITE_RE = re.compile(r'^(?:[wx]\d+|s\d+|d\d+|v\d+),')
LDR_OFF = re.compile(r'^[wx]\d+, \[sp(?:, #(0x[0-9a-f]+))?\]$')


def regnorm(r):
    r = r.strip().lower()
    if r.startswith('w'):
        return 'x' + r[1:], 32
    if r.startswith('x'):
        return r, 64
    return r, 0


def reads_of(ins):
    """registers read by ins (best-effort for the common forms)."""
    ops = ins.op_str
    mn = ins.mnemonic
    reads = []
    if mn in ('ldr', 'ldur', 'ldrh', 'ldrb', 'ldrsb', 'ldrsh', 'ldrsw'):
        mm = re.match(r'^([wsdx]\d+), \[?(.*)\]?$', ops)
        if mm:
            base = re.findall(r'\b([wx]\d+)\b', mm.group(2))
            reads = base
    elif mn == 'ldp':
        mm = re.match(r'^([wsdx]\d+), ([wsdx]\d+), \[?(.*)\]?$', ops)
        if mm:
            reads = [mm.group(1), mm.group(2)] + re.findall(r'\b([wx]\d+)\b', mm.group(3))
    elif mn == 'adrp':
        reads = []
    elif mn in ('mov', 'movz', 'fmov'):
        mm = re.match(r'^([wsdx]\d+), (.+)$', ops)
        if mm:
            reads = re.findall(r'\b([wsdx]\d+)\b', mm.group(2))
    elif mn == 'movk':
        reads = re.findall(r'\b([wx]\d+)\b', ops)
    else:
        # generic: all w/x regs mentioned except the first (dest)
        mm = re.match(r'^([wsdx]\d+), (.+)$', ops)
        if mm:
            reads = re.findall(r'\b([wsdx]\d+)\b', mm.group(2))
        else:
            reads = re.findall(r'\b([wsdx]\d+)\b', ops)
    return reads


def writes_of(ins):
    mn = ins.mnemonic
    if mn in ('cmp', 'tst', 'cmn'):
        return []
    mm = re.match(r'^([wsdx]\d+)', ins.op_str)
    if mn in ('str', 'stur', 'stp', 'sturb', 'sturh'):
        return []
    return [mm.group(1)] if mm else []


def slice_back(start_idx, src_reg, max_back=600):
    """walk backward from start_idx (exclusive) resolving src_reg's chain."""
    events = []          # ordered (addr, text, note)
    needed = {regnorm(src_reg)[0]}
    depth_guard = 0
    i = start_idx - 1
    lo = max(0, start_idx - max_back)
    while needed and i >= lo:
        ins = ins_list[i]
        wr = writes_of(ins)
        wneeded = wr and regnorm(wr[0])[0] in needed
        if wneeded:
            note = ''
            mn, ops = ins.mnemonic, ins.op_str
            if mn in ('ldr', 'ldur'):
                mm = LDR_OFF.match(ops)
                if mm and mm.group(1) == '0x134':
                    note = 'BAND-SELF-READ (previous band value)'
                    needed.discard(regnorm(wr[0])[0])
                elif mm:
                    note = 'stack[%s] load' % mm.group(1)
                    needed.discard(regnorm(wr[0])[0])
                else:
                    mm2 = re.match(r'^[wx]\d+, \[([wx]\d+),? ?(#?0x[0-9a-f]+)?\]$', ops)
                    if mm2:
                        note = 'mem[%s%s]' % (mm2.group(1), mm2.group(2) or '')
                        needed.discard(regnorm(wr[0])[0])
                        needed.add(regnorm(mm2.group(1))[0])
                    else:
                        needed.update(regnorm(r)[0] for r in reads_of(ins))
            elif mn == 'ldp':
                note = 'ldp pair'
                needed.discard(regnorm(wr[0])[0])
                other = re.match(r'^[wx]\d+, ([wx]\d+),', ops)
                if other:
                    needed.add(regnorm(other.group(1))[0])
                needed.update(regnorm(r)[0] for r in reads_of(ins)[2:])
            elif mn == 'adrp':
                note = 'page %s' % ops.split(', #')[-1]
                needed.discard(regnorm(wr[0])[0])
            elif mn in ('bl', 'blr'):
                events.append((ins.address, '%s %s' % (mn, ops),
                               'CALL — w0/x0 call-defined'))
                needed.discard('x0')
                i -= 1
                continue
            else:
                rd = reads_of(ins)
                note = 'uses ' + ','.join(rd) if rd else ''
                needed.discard(regnorm(wr[0])[0])
                needed.update(regnorm(r)[0] for r in rd)
            t = sym.get(ins.address)
            if t:
                note += '  ; ' + t
            events.append((ins.address, '%s %s' % (ins.mnemonic, ins.op_str), note))
        elif ins.mnemonic in ('bl', 'blr') and 'x0' in needed:
            events.append((ins.address, '%s %s' % (ins.mnemonic, ins.op_str),
                           'CALL — w0/x0 call-defined'))
            needed.discard('x0')
            t = sym.get(int(ins.op_str[1:], 16)) if (ins.mnemonic == 'bl' and ins.op_str.startswith('#')) else None
            if t:
                events[-1] = (events[-1][0], events[-1][1], 'CALL — w0/x0 call-defined ; -> ' + t)
        i -= 1
    return events


for si, (idx, ins, src) in enumerate(stores):
    P('=== band store #%d @%#x  (%s %s) ===' % (si + 1, ins.address, ins.mnemonic, ins.op_str))
    # context: 12 before
    P('  context:')
    for j in range(max(0, idx - 12), idx):
        ci = ins_list[j]
        P('    %08x  %-7s %s' % (ci.address, ci.mnemonic, ci.op_str))
    ev = slice_back(idx, src)
    P('  slice (newest first):')
    for a, t, note in ev:
        P('    %08x  %-30s ; %s' % (a, t, note))
    P('')
