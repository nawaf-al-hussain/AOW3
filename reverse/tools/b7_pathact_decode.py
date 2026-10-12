#!/usr/bin/env python3
"""B7 pass — PathAct movement/slot system decode (AOW3 6.9.18, offline).

The audit gate B7 (unit-unit collision / path-slot micro-management) named the
native surface: Unit.wait_for_moving 0xB9, forced 0xB8, walk_state 0xE4,
walk_dx/dy cross-tile bookkeeping, plus a dispersal trio (0x120/0x128/0x130)
and a SlipInfo slide-resolver. The sim-side engine class is
com.geargames.aow.entities.battle.PathAct (dump.cs ~425673, Obfuz-named statics).

This tool:
  1. Whole-executable field-write/read census (STR/LDRB/LDRSB/LDR/STR unsigned
     imm-offset) for the B7 Unit fields, with enclosing-function attribution
     (dump.cs RVA map) — answers WHO drives the slot/wait/walk-state machine.
  2. Annotated disassembly of the key PathAct methods: BL targets named via
     script.json (366,304 ScriptMethods), field immediates annotated with
     Unit/BattleCellBasic/PathUnitInfo/SlipInfo member names, float rodata loads
     decoded.

Outputs the evidence file reverse/evidence/movement/b7-pathact-decode.txt.
"""
import argparse, bisect, datetime, hashlib, json, os, re, struct, sys

from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO_SHA = '8ace05bbaa2cdfda'  # provenance pin (evidence chain, R7/R8/R7f passes)
DUMP_SHA = '0050e67d'

# ---- B7 Unit fields (dump.cs 393252-393339; names are plain) ----
UNIT_FIELDS = {
    0x21: 'base(sbyte)', 0x28: 'weapons', 0x30: 'dummy', 0x38: 'skirt',
    0x40: 'un_type', 0x48: 'x(short)', 0x4A: 'y(short)', 0x4C: 'dx(short)',
    0x4E: 'dy(short)', 0x50: 'next_x(short)', 0x52: 'next_y(short)',
    0x54: 'mineDistance', 0x58: 'walkCrossFlag(sbyte)', 0x59: 'path_pos(sbyte)',
    0x5A: 'path_len(sbyte)', 0x5C: 'walk_dx(int)', 0x60: 'walk_dy(int)',
    0x64: 'step_count(short)', 0x66: 'step_cur(short)', 0x68: 'stepCountUnusual',
    0x69: 'task_visual', 0x6A: 'task', 0x6B: 'state', 0x6C: 'obj_x(short)',
    0x6E: 'obj_y(short)', 0x70: 'dest_x(short)', 0x72: 'dest_y(short)',
    0x74: 'obj_x_pix', 0x78: 'obj_y_pix', 0x7C: 'undergo', 0x80: 'distance',
    0x88: 'obj', 0x90: 'objPreferred', 0x98: 'obj_id', 0x9C: 'obj_close',
    0x9D: 'think', 0x9E: 'think_add', 0x9F: 'flag', 0xA0: 'flag_shoot',
    0xA1: 'siege_stage', 0xA4: 'siegeTick', 0xA8: 'siegeAfterWalkTick',
    0xAC: 'jump_length', 0xAE: 'jump_dx(short)', 0xB0: 'jump_dy(short)',
    0xB2: 'energy(short)', 0xB4: 'orient(short)', 0xB6: 'orient_dest(short)',
    0xB8: 'forced(sbyte)', 0xB9: 'wait_for_moving(sbyte)', 0xBA: 'speed_curr(sbyte)',
    0xBC: 'sight_curr', 0xC0: 'path(short[][])', 0xC8: 'cross(bool[])',
    0xD0: 'path_tick(int[])', 0xD8: 'sched_count(sbyte)', 0xD9: 'path_cut(sbyte)',
    0xDA: 'orientObstacledFrom(short)', 0xDC: 'orientObstacledTo(short)',
    0xDE: 'orientObstacledGoAround(sbyte)', 0xE0: 'walk_delay(int)',
    0xE4: 'walk_state(sbyte)', 0xE8: 'walk_state_tick(int)', 0xEC: 'caravan',
    0xF0: 'last_action_tick', 0xF4: 'idled', 0xF8: 'stunned_until_tick',
    0xFC: 'stunType', 0x100: 'blind_until_tick', 0x104: 'task_until_tick',
    0x108: 'shield_until_tick', 0x10C: 'underShieldClient', 0x110: 'fogged_on_tick',
    0x114: 'nearfog_on_tick', 0x118: 'action_until_tick', 0x11C: 'evacuated',
    0x120: 'dispersal(Dynamic)', 0x128: 'dispersal_prev(Unit)', 0x130: 'dispersal_bu_id',
    0x134: 'flag_attack_bonus(short)', 0x138: 'groupAmount', 0x140: 'boostEffects(short[])',
    0x148: 'aura', 0x150: 'patrol', 0x158: 'patrol_defend', 0x160: 'patrol_pos',
    0x168: 'rallyCoords', 0x170: 'rallyPos',
}
# census fields of primary B7 interest
B7_FIELDS = {0x58, 0x59, 0x5A, 0x5C, 0x60, 0x64, 0x66, 0x68, 0xB8, 0xB9, 0xBA,
             0xD8, 0xD9, 0xDA, 0xDC, 0xDE, 0xE0, 0xE4, 0xE8, 0x120, 0x128, 0x130,
             0x48, 0x4A, 0x50, 0x52}
CELL_FIELDS = {0x10: '$YE occupant(Dynamic)', 0x18: '$zE occupants(List)',
               0x20: '$ZE(sbyte)', 0x21: '$af(sbyte)', 0x22: '$Af(sbyte)',
               0x24: '$bf(short)', 0x28: '$Bf crosscell'}
SLIP_FIELDS = {0x10: 'slipDx', 0x14: 'slipDy', 0x18: 'slipDo', 0x1C: 'closestX',
               0x20: 'closestY', 0x24: 'closestRadius', 0x28: 'xFrom', 0x2C: 'yFrom',
               0x30: 'xTo', 0x34: 'yTo', 0x38: 'xTangent1', 0x3C: 'yTangent1',
               0x40: 'angleTangent1', 0x44: 'xTangent2', 0x48: 'yTangent2',
               0x4C: 'angleTangent2', 0x50: 'stepTangent1', 0x54: 'stepTangent2',
               0x58: 'orient1', 0x5C: 'orient2', 0x60: 'stepCur', 0x64: 'stepCount',
               0x68: 'strafeDx', 0x6C: 'strafeDy', 0x70: 'strafeAngle',
               0x74: 'strafeLen', 0x78: 'strafeMax', 0x7C: 'strafeStep'}

# ---- PathAct method anchors (dump.cs, PathAct TypeDefIndex 11928) ----
PATHACT = {
    '$ZD': (0x4741374, '(Battle,Unit,int,int,bool,int,int,bool,int,int) walk order?'),
    '$ae': (0x474233C, '(Battle,Unit,bool)->short'),
    '$Ae': (0x47439C0, '(Battle)->int'),
    '$be': (0x474CE70, '(Battle,Unit)'),
    '$Be': (0x474F190, '(Battle,Unit)'),
    '$ce': (0x47501F0, 'public (Battle,Unit)'),
    '$Ce': (0x47563CC, '(Battle,Path,int)->bool'),
    '$de': (0x475A7D0, '(Battle,Unit)'),
    '$De': (0x475A9DC, 'public (Battle,Unit)->bool'),
    '$ee': (0x4756988, '(Battle,int,int,int,int,int)->bool'),
    '$Ee': (0x475AD58, '(Battle,int,int,int)->bool'),
    '$fe': (0x475AFA4, '(Battle,Unit)'),
    '$Fe': (0x4756E2C, '(Battle,Unit)'),
    '$ge': (0x4755670, '(Battle,Unit)'),
    '$Ge': (0x4757268, '(Battle,Unit)'),
    '$he': (0x4758128, 'public (Battle,Unit,int)'),
    '$He': (0x474B338, '(Battle,Unit,int,int,bool,int,int,bool)->sbyte'),
    '$ie': (0x475E5D4, '(Battle,int,int)->sbyte'),
    '$Ie': (0x475E9E8, '(Battle,Unit,sbyte,short,short,bool)'),
    '$je': (0x4760B94, '(Battle,Unit,int,short,int,int,bool)'),
    '$Je': (0x475F7FC, '(Battle)'),
    '$ke': (0x47607D8, '(PathUnitInfo,int,int,bool,sbyte)'),
    '$Ke': (0x47446E0, '(Battle,Unit)'),
    '$le': (0x4742BE8, '(Battle,sbyte,int)'),
    '$Le': (0x4745C68, '(Battle,Unit,int,int,bool)->bool'),
    '$me': (0x475C2D4, 'public (Battle,Dynamic,BattleCellBasic,int,int) cell place'),
    '$Me': (0x475DC3C, 'public (Battle,Dynamic,BattleCellBasic,int,int) cell remove'),
    '$ne': (0x4763540, 'public (Battle,BattleCellBasic)'),
    '$Ne': (0x47639C4, 'public (Battle,Unit)'),
    '$oe': (0x4762574, '(Battle,Unit,int)'),
    '$Oe': (0x4746314, '(Battle,Unit,int,int)'),
    '$pe': (0x47641BC, '(short[],short[],bool[],int,int,bool,int)->bool'),
    '$Pe': (0x475FE30, 'protected (Battle,Unit,int,int,bool,bool)->sbyte'),
    '$qe': (0x47649C4, '(Battle,Unit,int,int,BattleCell)->bool'),
    '$Qe': (0x476A73C, '(Battle,Unit,int,int,Dynamic)->sbyte'),
    '$re': (0x476A1DC, '(Battle,BattleMap,BattleCell[][],Unit,int,int)->bool'),
    '$Re': (0x474F4E0, '(Battle,Unit,int)->int'),
    '$se': (0x475757C, '(Battle,Unit)'),
    '$Se': (0x47500F4, '(Battle,Unit)'),
    '$te': (0x476446C, '(Battle,Unit,int,int)'),
    '$Te': (0x4764F44, '(Battle,Unit,BattleCell,int,int,bool)->sbyte'),
    '$ue': (0x4761F50, 'public (sbyte[][],int,int,bool,bool)->sbyte'),
    '$Ue': (0x4763C10, '(int,bool,Coordinate)'),
    '$ve': (0x47553CC, 'public (sbyte[][],int,int,int,int,bool)->int'),
    '$Ve': (0x4761B34, 'public (Battle,int,int,int,int,bool,int)->int'),
    '$we': (0x476B988, 'public (Battle,Unit)->sbyte'),
    '$We': (0x476E434, 'public (Battle,Unit,bool)'),
    '$xe': (0x476B58C, 'protected (Battle,Unit,int)->int'),
    '$Xe': (0x476B320, 'protected (Battle,Unit,int)->int'),
    '$ye': (0x475ABA4, '(Unit)->UnitStateType'),
}
PATHACT_CONSTS = [('$ZJ', 0), ('$ak', 1), ('$Ak', 2), ('$bk', 3), ('$Bk', 4),
                  ('$ck', 5), ('$Ck', 6), ('$dk', 7), ('$Dk', 50), ('$ek', 10),
                  ('$Ek', 96), ('$fk', 200), ('$Fk', 5), ('$gk', 2), ('$Gk', 5),
                  ('$hk', 1), ('$Hk', 50), ('$ik', 10), ('$Ik', 7)]

def find_so(cli):
    if cli:
        return cli
    for cand in ('/home/z/my-project/aow3-extract/libil2cpp.so',):
        if os.path.exists(cand):
            return cand
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--so')
    ap.add_argument('--sj', default='/home/z/my-project/aow3-extract/icd-out/script.json')
    ap.add_argument('--dump', default='/home/z/my-project/aow3-extract/dump.cs')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                  '..', 'evidence', 'movement',
                                                  'b7-pathact-decode.txt'))
    ap.add_argument('--census-only', action='store_true')
    ap.add_argument('--xref', action='store_true',
                    help='BL-xref the movement accessors instead of the full disasm')
    args = ap.parse_args()

    so_path = find_so(args.so)
    data = open(so_path, 'rb').read()
    sha = hashlib.sha256(data).hexdigest()
    assert sha.startswith(SO_SHA), 'so sha mismatch'
    dump_sha = hashlib.sha256(open(args.dump, 'rb').read()).hexdigest()
    assert dump_sha.startswith(DUMP_SHA), 'dump sha mismatch'

    (e_phoff,) = struct.unpack_from('<Q', data, 0x20)
    (e_ps, e_pn) = struct.unpack_from('<HH', data, 0x36)
    segs = []
    for i in range(e_pn):
        b = e_phoff + i * e_ps
        pt, flags = struct.unpack_from('<II', data, b)
        po, pv = struct.unpack_from('<QQ', data, b + 8)
        fs, fm = struct.unpack_from('<QQ', data, b + 32)
        if pt == 1:
            segs.append((po, pv, fs, flags))

    def va2off(va):
        for po, pv, fs, fl in segs:
            if pv <= va < pv + fs:
                return va - pv + po
        return None

    ex_segs = [(pv, pv + fs) for po, pv, fs, fl in segs if fl & 1]
    def in_exec(va):
        return any(a <= va < b for a, b in ex_segs)

    seg_offs = sorted(po for po, pv, fs, fl in segs)
    seg_by_off = {po: (pv, fs) for po, pv, fs, fl in segs}
    def off2va(o):
        k = bisect.bisect_right(seg_offs, o) - 1
        if k < 0: return None
        po = seg_offs[k]; pv, fs = seg_by_off[po]
        return o - po + pv if o < po + fs else None

    # script.json name map
    names = {}
    if os.path.exists(args.sj):
        sj = json.load(open(args.sj))
        for m in sj['ScriptMethod']:
            names[m['Address']] = m['Name']
    # dump.cs RVA -> declaring method name (fallback, for methods script.json lacks)
    rvapat = re.compile(r'// RVA: (0x[0-9A-Fa-f]+) Offset: 0x[0-9A-Fa-f]+ VA: (0x[0-9A-Fa-f]+)')
    sigpat = re.compile(r'^\s{1,4}(public|private|protected|internal).*?([$$\w<>\[\],\. ]+?)\s*\(')
    rva2sig = {}
    cur = None
    for l in open(args.dump):
        m = rvapat.match(l.strip())
        if m:
            rva = int(m.group(1), 16)
            rva2sig[rva] = cur
            continue
        s = sigpat.match(l)
        if s and '{ }' in l:
            cur = l.strip()[:150]
    def name_of(va):
        if va in names:
            return names[va]
        if va in rva2sig and rva2sig[va]:
            return rva2sig[va]
        return None

    md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
    md.detail = True

    lines = []
    def emit(s=''):
        lines.append(s)

    emit(f'B7 PathAct movement/slot decode  (generated {datetime.date.today().isoformat()})')
    emit(f'libil2cpp.so sha256 {sha} (pin {SO_SHA}… MATCH)')
    emit(f'dump.cs sha256 {dump_sha} (pin {DUMP_SHA}… MATCH)')
    emit(f'script.json: {len(names)} ScriptMethods indexed')
    emit('')

    # ---------- 1. whole-executable field census ----------
    emit('== 1. field census — who writes/reads the B7 movement fields ==')
    emit('scan: unsigned-imm-offset LDR/STR family across executable segments;')
    emit('attribution = enclosing function via dump.cs RVA map (nearest preceding RVA).')
    emit('')
    # function start list for attribution
    fstarts = sorted(rva2sig.keys())
    def fn_of(va):
        k = bisect.bisect_right(fstarts, va) - 1
        if k < 0: return None
        return fstarts[k]
    # scan all words; decode LDR/STR imm-offset with matching immediates
    n = len(data) // 4
    words = struct.unpack_from('<%dI' % n, data, 0)
    hits = {off: [] for off in B7_FIELDS}
    def decode_imm_off(w):
        """return (ldrsb/strb/ldr/str, rn, imm12, size) for unsigned imm-offset forms"""
        op = w >> 22
        # STRB imm: 00 111 0 00 0 0 imm12 Rn Rt  -> top10 = 0b0011100000
        top10 = w >> 22
        rt = w & 0x1F
        rn = (w >> 5) & 0x1F
        imm12 = (w >> 10) & 0xFFF
        size = (w >> 30) & 0x3
        V = (w >> 26) & 1
        if V: return None
        # STR (imm, unsigned): size 00 -> 0xE40/0xE40? use masks:
        # STRB: 0011 1000 00 imm12 Rn Rt  => bits31-22 == 0b0011100000 (0x0E0)
        b3122 = (w >> 22) & 0x3FF
        opc = (w >> 22) & 0x3
        if b3122 == 0b0011100000: return ('strb', rn, imm12, 1)
        if b3122 == 0b0101110000: return ('ldrsb', rn, imm12, 1)
        if b3122 == 0b0101100000: return ('ldrb', rn, imm12, 1)
        # STR 32/64: 1x 111 0 00 00 imm12 Rn Rt -> bits31-22: 0b1011100000(32) 0b1111100000(64)
        if b3122 == 0b1011100000: return ('str', rn, imm12, 4)
        if b3122 == 0b1111100000: return ('str', rn, imm12, 8)
        if b3122 == 0b1011100100: return ('ldr', rn, imm12, 4)
        if b3122 == 0b1111100100: return ('ldr', rn, imm12, 8)
        return None
    for i, w in enumerate(words):
        va = off2va(i * 4)
        if va is None or not in_exec(va):
            continue
        d = decode_imm_off(w)
        if not d: continue
        kind, rn, imm12, size = d
        # Unit fields are < 0x200: imm12 raw == offset (size 1/4); for 64-bit ldr
        # the imm12 is scaled by 8; 32-bit scaled by 4.
        if kind in ('strb', 'ldrb', 'ldrsb'):
            off = imm12
        elif size == 4:
            off = imm12 * 4
        elif size == 8:
            off = imm12 * 8
        else:
            continue
        if off in B7_FIELDS:
            hits[off].append((va, kind))
    for off in sorted(hits):
        lst = hits[off]
        if not lst: continue
        fname = UNIT_FIELDS.get(off, f'+0x{off:X}')
        # bucket by enclosing function
        fns = {}
        for va, kind in lst:
            f = fn_of(va)
            fns.setdefault(f, []).append((va, kind))
        emit(f'-- Unit +0x{off:X} {fname}: {len(lst)} access site(s), {len(fns)} function(s)')
        for f in sorted(fns, key=lambda x: (x is None, x or 0)):
            nm = name_of(f) if f else '?'
            cnt = fns[f]
            kinds = {}
            for _, k in cnt: kinds[k] = kinds.get(k, 0) + 1
            fs_ = 'fn ?' if f is None else f'fn 0x{f:X}'
            emit(f'   {fs_} {nm}  ({", ".join(f"{k}x{v}" for k, v in sorted(kinds.items()))}, sites {len(cnt)})')
        emit('')
    if args.xref:
        emit('')
        emit('== 1b. BL xref — direct callers of the Unit movement accessors ==')
        emit('virtual dispatch via vtable slots is NOT captured here (see fogLines')
        emit('precedent); direct BL = same-assembly non-virtualized or final calls.')
        emit('')
        ACCESSORS = {
            'get_WaitForMoving': 0x45B17A0, 'set_WaitForMoving': 0x45B17A8,
            'get_Forced': 0x45B0EE8, 'set_Forced': 0x45B0EF0,
            'get_WalkState': 0x45B17B0, 'set_WalkState': 0x45B17B8,
            'get_WalkStateTick': 0x45B17C0, 'set_WalkStateTick': 0x45B17C8,
            'get_WalkDelay': 0x45B1640, 'set_WalkDelay': 0x45B1648,
            'get_WalkDx': 0x45B1660, 'set_WalkDx': 0x45B1668,
            'get_WalkDy': 0x45B1650, 'set_WalkDy': 0x45B1658,
            'get_StepCount': 0x45B137C, 'set_StepCount': 0x45B1384,
            'get_StepCur': 0x45B138C, 'set_StepCur': 0x45B1394,
            'get_StepCountUnusual': 0x45B139C, 'set_StepCountUnusual': 0x45B13A4,
            'get_Dispersal': 0x45B0D28, 'set_Dispersal': 0x45B0D30,
            'get_DispersalPrev': 0x45B0D40, 'set_DispersalPrev': 0x45B0D48,
            'get_DispersalBuId': 0x45B0D58, 'set_DispersalBuId': 0x45B0D60,
            'get_NextX': 0x45B108C, 'set_NextX': 0x45B1094,
            'get_NextY': 0x45B109C, 'set_NextY': 0x45B10A4,
            'get_NextXLogic': 0x45B1588, 'get_NextYLogic': 0x45B15A8,
            'get_SchedCount': 0x45B12DC, 'set_SchedCount': 0x45B12E4,
            'get_PathCut': 0x45B1214, 'set_PathCut': 0x45B121C,
            'get_PathPos': 0x45B1204, 'set_PathPos': 0x45B120C,
            'get_PathLen': 0x45B11F4, 'set_PathLen': 0x45B11FC,
            'get_WalkCrossFlag': 0x45B10AC, 'set_WalkCrossFlag': 0x45B10B4,
            'get_OrientObstacledFrom': 0x45B1224, 'set_OrientObstacledFrom': 0x45B122C,
            'get_OrientObstacledTo': 0x45B1234, 'set_OrientObstacledTo': 0x45B123C,
            'get_OrientObstacledGoAround': 0x45B1244, 'set_OrientObstacledGoAround': 0x45B124C,
            'get_SpeedCurr': 0x45B135C, 'set_SpeedCurr': 0x45B1364,
        }
        n_words = len(data) // 4
        wrds = struct.unpack_from('<%dI' % n_words, data, 0)
        # pre-index all BL sites once: site_va -> target
        bl_sites = []
        for i, w in enumerate(wrds):
            if (w >> 26) != 0x25:
                continue
            imm = w & 0x03FFFFFF
            if imm & 0x02000000:
                imm -= 0x04000000
            sv = off2va(i * 4)
            if sv is None or not in_exec(sv):
                continue
            bl_sites.append((sv, sv + imm * 4))
        tgmap = {}
        for sv, tv in bl_sites:
            tgmap.setdefault(tv, []).append(sv)
        for aname in sorted(ACCESSORS):
            va = ACCESSORS[aname]
            callers = tgmap.get(va, [])
            emit(f'-- {aname} @0x{va:X}: {len(callers)} direct BL caller(s)')
            fns = {}
            for sv in callers:
                f = fn_of(sv)
                fns.setdefault(f, []).append(sv)
            for f in sorted(fns, key=lambda x: (x is None, x or 0)):
                nm = name_of(f) if f else '?'
                emit(f'   fn 0x{f:X} {nm}  (sites {len(fns[f])})')
            emit('')
        open(args.out, 'w').write('\n'.join(lines) + '\n')
        print(f'wrote {args.out} (xref only)')
        return

    # ---------- 2. PathAct method disassembly ----------
    emit('')
    emit('== 2. PathAct disassembly (annotated) ==')
    emit('BL targets named from script.json; field immediates annotated;')
    emit('rodata float loads decoded. All addresses are file VAs (RVA).')
    emit('')
    # sorted anchors to bound windows
    all_addrs = sorted(names.keys())
    def fn_size(va):
        k = bisect.bisect_right(all_addrs, va)
        if k < len(all_addrs):
            nxt = all_addrs[k]
            if nxt > va:
                return min(nxt - va, 0x3000)
        return 0x400
    for mname in sorted(PATHACT, key=lambda k: PATHACT[k][0]):
        va, sig = PATHACT[mname]
        sz = fn_size(va)
        o = va2off(va)
        if o is None:
            emit(f'### PathAct.{mname} @0x{va:X} — NOT IN FILE'); continue
        code = data[o:o + sz]
        emit(f'### PathAct.{mname}  @0x{va:X}  (len<=0x{sz:X})  {sig}')
        for ins in md.disasm(code, va):
            ann = ''
            if ins.mnemonic == 'bl':
                try: tgt = int(ins.op_str.lstrip('#'), 16)
                except ValueError: tgt = None
                if tgt is not None:
                    nm = name_of(tgt)
                    if nm: ann = f'   ; {nm}'
                    if tgt in PATHACT.get('_xref_map', {}): pass
            if ins.mnemonic in ('ldr', 'str', 'ldrb', 'strb', 'ldrsb', 'ldur', 'stur'):
                m2 = re.search(r'\[(x\d+|xzr|sp),?\s*#(0x[0-9a-f]+|\d+)\]!?', ins.op_str)
                if m2:
                    offi = int(m2.group(2), 0)
                    if offi in UNIT_FIELDS: ann = f"   ; Unit.{UNIT_FIELDS[offi]}"
                    elif offi in CELL_FIELDS: ann = f"   ; cell.{CELL_FIELDS[offi]}"
                    elif offi in SLIP_FIELDS: ann = f"   ; SlipInfo.{SLIP_FIELDS[offi]}"
            if ins.mnemonic in ('ldr', 'ldrb') and '#0x' in ins.op_str and ']' in ins.op_str:
                pass
            # float rodata
            if ins.mnemonic == 'ldr' and ins.op_str.startswith(('s', 'd')):
                m3 = re.search(r'#(0x[0-9a-f]+)', ins.op_str)
                if m3:
                    fva = int(m3.group(1), 16)
                    fo = va2off(fva)
                    if fo is not None and fo + 4 <= len(data):
                        fv = struct.unpack_from('<f', data, fo)[0]
                        ann = f'   ; rodata float = {fv!r}'
            emit(f'  0x{ins.address:X}  {ins.mnemonic:<8} {ins.op_str}{ann}')
            if ins.mnemonic == 'ret':
                break
        emit('')
    open(args.out, 'w').write('\n'.join(lines) + '\n')
    print(f'wrote {args.out} ({len(lines)} lines)')

if __name__ == '__main__':
    main()
