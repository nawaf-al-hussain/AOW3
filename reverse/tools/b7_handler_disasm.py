#!/usr/bin/env python3
"""B7 supplemental — targeted disasm of the wait/occupancy/dispersal handlers.
Anchors chosen from the callvirt/field-census traffic map (see tool header)."""
import bisect, datetime, hashlib, json, os, re, struct
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO_SHA = '8ace05bbaa2cdfda'
SO = '/home/z/my-project/aow3-extract/libil2cpp.so'
SJ = '/home/z/my-project/aow3-extract/icd-out/script.json'
DUMP = '/home/z/my-project/aow3-extract/dump.cs'
OUT = '/home/z/my-project/aow3-extract/b7-handlers.txt'

UNIT = {0x48:'x',0x4A:'y',0x4C:'dx',0x4E:'dy',0x50:'next_x',0x52:'next_y',
        0x58:'walkCrossFlag',0x59:'path_pos',0x5A:'path_len',0x5C:'walk_dx',0x60:'walk_dy',
        0x64:'step_count',0x66:'step_cur',0x68:'stepCountUnusual',0x6A:'task',0x6B:'state',
        0x70:'dest_x',0x72:'dest_y',0x74:'obj_x_pix',0x78:'obj_y_pix',0x80:'distance',
        0x88:'obj',0x90:'objPreferred',0x98:'obj_id',0x9C:'obj_close',0x9D:'think',
        0xA0:'flag_shoot',0xA1:'siege_stage',0xA4:'siegeTick',0xA8:'siegeAfterWalkTick',
        0xB4:'orient',0xB6:'orient_dest',0xB8:'forced',0xB9:'wait_for_moving',
        0xBA:'speed_curr',0xBC:'sight_curr',0xC0:'path',0xC8:'cross',0xD0:'path_tick',
        0xD8:'sched_count',0xD9:'path_cut',0xDA:'orientObstacledFrom',0xDC:'orientObstacledTo',
        0xDE:'orientObstacledGoAround',0xE0:'walk_delay',0xE4:'walk_state',
        0xE8:'walk_state_tick',0xF0:'last_action_tick',0xF4:'idled',
        0xF8:'stunned_until_tick',0x104:'task_until_tick',0x118:'action_until_tick',
        0x120:'dispersal',0x128:'dispersal_prev',0x130:'dispersal_bu_id',0x138:'groupAmount'}
CELL = {0x10:'$YE occupant',0x18:'$zE occupants',0x20:'$ZE',0x21:'$af',0x22:'$Af',0x24:'$bf',0x28:'$Bf crosscell'}
CROSS = {0x10:'$cf int[]',0x18:'$Cf int[]',0x20:'$df Dynamic[]',0x28:'$Df',0x2C:'$ef',0x30:'$Ef'}

ANCHORS = [
    ('UnitAct.$cg  (set wait_for_moving)',      0x47FCB0C),
    ('UnitAct.$uG  (wait_for_moving r/w)',      0x482C59C),
    ('UnitAct.$CG  (set wait_for_moving)',      0x4851D34),
    ('UnitAct.$Ag  (walk_state + wait rw)',     0x47E8D30),
    ('UnitAct.$yi  (set walk_state x2)',        0x4889560),
    ('UnitAct.$yG  (get_Forced x6)',            0x480CB44),
    ('BattleAct.$J  (wait/walk orchestration)', 0x46692D8),
    ('BattleAct.$ZA (set walk_state x4)',       0x465869C),
    ('PathAct.$Qe  (placement check read wait)',0x476A73C),
    ('PathAct.$Te  (placement legality)',       0x4764F44),
    ('PathAct.$me  (cell place)',               0x475C2D4),
    ('PathAct.$Me  (cell remove)',              0x475DC3C),
    ('PathAct.$Oe  (dispersal writer)',         0x4746314),
    ('PathAct.$be  (walk_state + dispersal_prev)', 0x474CE70),
    ('PathAct.$he  (public Battle,Unit,int)',   0x4758128),
    ('PathAct.$Ne  (public Battle,Unit)',       0x47639C4),
    ('PathAct.$we  (public ->sbyte)',           0x476B988),
    ('PathAct.$We  (public Battle,Unit,bool)',  0x476E434),
    ('GAICommandSpecMode.execute (set forced)', 0x45F61E0),
    ('GAICommandTroopMove.execute (set forced)',0x45FBF10),
    ('AICommUnitsMove.$CMA (get forced)',       0x4909950),
]

data = open(SO, 'rb').read()
sha = hashlib.sha256(data).hexdigest()
assert sha.startswith(SO_SHA)
(e_phoff,) = struct.unpack_from('<Q', data, 0x20)
(e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
segs = []
for i in range(e_pn):
    b = e_phoff + i * e_ps
    pt, fl = struct.unpack_from('<II', data, b)
    po, pv = struct.unpack_from('<QQ', data, b + 8)
    fs, fm = struct.unpack_from('<QQ', data, b + 32)
    if pt == 1: segs.append((po, pv, fs, fl))
def va2off(va):
    for po, pv, fs, fl in segs:
        if pv <= va < pv + fs: return va - pv + po
def off2va(o):
    for po, pv, fs, fl in segs:
        if po <= o < po + fs: return o - po + pv
def in_exec(va):
    return any(pv <= va < pv+fs for po,pv,fs,fl in segs if fl & 1)
seg_offs = sorted(po for po,pv,fs,fl in segs)
seg_by_off = {po:(pv,fs) for po,pv,fs,fl in segs}
def off2va_f(o):
    k = bisect.bisect_right(seg_offs, o) - 1
    if k < 0: return None
    po = seg_offs[k]; pv, fs = seg_by_off[po]
    return o - po + pv if o < po + fs else None

sj = json.load(open(SJ))
names = {m['Address']: m['Name'] for m in sj['ScriptMethod']}
all_addrs = sorted(names.keys())
def fn_size(va):
    k = bisect.bisect_right(all_addrs, va)
    if k < len(all_addrs) and all_addrs[k] > va:
        return min(all_addrs[k] - va, 0x3000)
    return 0x400

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
lines = [f'B7 handler disasm ({datetime.date.today().isoformat()})  so={sha[:16]}… MATCH']
for label, va in ANCHORS:
    sz = fn_size(va)
    o = va2off(va)
    if o is None:
        lines.append(f'### {label} @0x{va:X} NOT FOUND'); continue
    lines.append(f'### {label}  @0x{va:X} len<=0x{sz:X}')
    cnt = 0
    for ins in md.disasm(data[o:o+sz], va):
        ann = ''
        if ins.mnemonic == 'bl':
            try: t = int(ins.op_str.lstrip('#'), 16); nm = names.get(t)
            except ValueError: nm = None
            if nm: ann = f'   ; {nm}'
        if ins.mnemonic in ('ldr','str','ldrb','strb','ldrsb','ldur','stur','ldrsw'):
            m2 = re.search(r'\[(x[0-9]+|xzr),?\s*#(0x[0-9a-f]+|\d+)\]!?', ins.op_str)
            if m2:
                offi = int(m2.group(2), 0)
                if offi in UNIT: ann = f'   ; Unit.{UNIT[offi]}'
                elif offi in CELL: ann = f'   ; cell.{CELL[offi]}'
                elif offi in CROSS: ann = f'   ; cross.{CROSS[offi]}'
        if ins.mnemonic == 'ldr' and ins.op_str.startswith(('s','d','q')):
            m3 = re.search(r'#(0x[0-9a-f]+)', ins.op_str)
            if m3:
                fva = int(m3.group(1), 16); fo = va2off(fva)
                if fo is not None and fo+4 <= len(data):
                    fv = struct.unpack_from('<f', data, fo)[0]
                    ann = f'   ; rodata {fv!r}'
        lines.append(f'  0x{ins.address:X}  {ins.mnemonic:<8} {ins.op_str}{ann}')
        cnt += 1
        if ins.mnemonic == 'ret' and cnt > 8: break
    lines.append('')
open(OUT, 'w').write('\n'.join(lines) + '\n')
print(f'wrote {OUT} ({len(lines)} lines)')
