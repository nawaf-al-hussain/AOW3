#!/usr/bin/env python3
"""R8 numeric pass — ballistic arc/gravity math decode (AOW3 6.9.18, offline).

Second R8 pass: the structural pass (trajectory-gravity-consumer-scan.txt, worklog
Task 54) recovered the engine taxonomy and left §9 unknowns RVA-anchored "for the
.so pass". libil2cpp.so 8ace05bb… is back on disk (Task 60 environment recovery),
so this pass disassembles the anchored functions and extracts the numeric arc law:

  1. get_EngineType x6 — one-instruction family-id reads (note §3 table check).
  2. AbstractBallisticBulletEngine core — CalculateGravity (field/100),
     CalculateHeightCoefficients(duration) — THE parametric height profile,
     CalculatePositionTime / CalculateAltitudeTime / CalculateElapsedTime,
     EngineInitiate gravity/accelerating read path.
  3. LeviaphanNuclearRocketBallisticBulletEngine — gravity divider interpolation
     + curve-driven position/altitude time.
  4. SelfDirectedBulletEngine — Hermite position/velocity evaluation
     (ACCELERATION_MULTIPLIER), MissTargeting, curve-mode branch conditions.
  5. LCBulletMissed.RetargetingBullet — MISSED_FLIGTH_DISTANCE /
     DURATION_TIME_SCALER constants and the miss-flight math.
  6. Bullet.get_AccelerateAndGuide — accelerating/guidance pairing.
  7. Whole-binary BL xref of WeaponType.get_BulletTrajectoryType /
     get_Gravity / get_Accelerating — settles note §9(6) (sim-side readers?).

Usage:
  python3 r8_numeric_arc_decode.py [--so PATH] [--out PATH]
Default --so search: /home/z/my-project/aow3-extract/libil2cpp.so, then cwd walk.
Default --out: reverse/evidence/combat/r8-numeric-arc-decode.txt
"""
import argparse, datetime, hashlib, os, struct, sys

from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

SO_SHA = '8ace05bbaa2cdfda'  # first 16 hex of the provenance pin

# ---- anchors: name -> vaddr (dump.cs RVA = vaddr; resolved via PT_LOAD) ----
ANCHORS = {
    # engine family ids (note §3)
    'BallisticBulletEngine.get_EngineType':                0x80B3558,
    'BallisticHighBulletEngine.get_EngineType':            0x80B36EC,
    'LinearBulletEngine.get_EngineType':                   0x80B5CAC,
    'SelfDirectedBulletEngine.get_EngineType':             0x80B6A80,
    'ChainLightingBulletEngine.get_EngineType':            0x80B4FDC,
    'AdjustableBallisticBulletEngine.get_EngineType':      0x80B2B30,
    # ballistic core (note §9.1/9.3)
    'AbstractBallisticBulletEngine.EngineInitiate':        0x80B1BC8,
    'AbstractBallisticBulletEngine.Targeting':             0x80B1DBC,
    'AbstractBallisticBulletEngine.CalculateElapsedTime':  0x80B219C,
    'AbstractBallisticBulletEngine.CalculateGravity':      0x80B25A8,
    'AbstractBallisticBulletEngine.CalculatePositionTime': 0x80B25DC,
    'AbstractBallisticBulletEngine.CalculateAltitudeTime': 0x80B2604,
    'AbstractBallisticBulletEngine.CalculateHeightCoefficients': 0x80B2050,
    'AbstractBallisticBulletEngine.CalculateCurrentPosition':    0x80B2200,
    'AdjustableBallisticBulletEngine.CalculateCurrentPosition':  0x80B30A4,
    # ballistic high (start rotation)
    'BallisticHighBulletEngine.EngineInitiate':            0x80B36F4,
    # leviathan hero variant (note §9.1)
    'Leviaphan.CalculateGravity':                          0x80B5A18,
    'Leviaphan.CalculatePositionTime':                     0x80B5BBC,
    'Leviaphan.CalculateAltitudeTime':                     0x80B5BF4,
    'Leviaphan.GetClamped01Time':                          0x80B5BE4,
    # self-directed (note §9.4)
    'SelfDirected.Targeting':                              0x80B6A88,
    'SelfDirected.TargetingCurveModeClear':                0x80B6D24,
    'SelfDirected.TargetingCurveModeNotClear':             0x80B6FC4,
    'SelfDirected.SetCurrentPositionAndVelocity':          0x80B7A98,
    'SelfDirected.CalculateCurrentPositionAndVelocity':    0x80B7E40,
    'SelfDirected.MissTargeting':                          0x80B7E28,
    # miss flight (note §9.5)
    'LCBulletMissed.RetargetingBullet':                    0x81429DC,
    # sim-side pairing
    'Bullet.get_AccelerateAndGuide':                       0x458FD60,
    'WeaponType.get_BulletTrajectoryType':                 0x45B62EC,
    'WeaponType.get_Gravity':                              0x45B63AC,
    'WeaponType.get_Accelerating':                         0x45B632C,
}
# disassembly windows (bytes) — keyed by anchor name; default 0x300
WINDOWS = {
    'AbstractBallisticBulletEngine.CalculateHeightCoefficients': 0x120,
    'AbstractBallisticBulletEngine.CalculateCurrentPosition': 0x600,
    'AdjustableBallisticBulletEngine.CalculateCurrentPosition': 0x600,
    'AbstractBallisticBulletEngine.EngineInitiate': 0x500,
    'AbstractBallisticBulletEngine.Targeting': 0x500,
    'SelfDirected.CalculateCurrentPositionAndVelocity': 0x800,
    'SelfDirected.SetCurrentPositionAndVelocity': 0x600,
    'SelfDirected.TargetingCurveModeClear': 0x700,
    'SelfDirected.TargetingCurveModeNotClear': 0x700,
    'SelfDirected.Targeting': 0x800,
    'LCBulletMissed.RetargetingBullet': 0x700,
    'Leviaphan.CalculateGravity': 0x600,
    'Leviaphan.CalculatePositionTime': 0x300,
    'Leviaphan.CalculateAltitudeTime': 0x300,
    'AdjustableBallisticBulletEngine.get_EngineType': 0x60,
}
GETTER_XREF = {  # whole-binary BL xref targets (note §9.6)
    'WeaponType.get_BulletTrajectoryType': 0x45B62EC,
    'WeaponType.get_Gravity': 0x45B63AC,
    'WeaponType.get_Accelerating': 0x45B632C,
}
FIELD_OFFS = {  # WeaponType runtime field offsets (note §2) for ldr [xN,#off] annotation
    0x9E: 'bulletTrajectoryType (sbyte)',
    0xA0: 'gravity (short)',
    0xA2: 'accelerating (bool)',
    0xA4: 'bul_type (int)',
    0xA8: 'boom_type (int)',
}

def find_so(cli):
    if cli:
        return cli
    for cand in ('/home/z/my-project/aow3-extract/libil2cpp.so',):
        if os.path.exists(cand):
            return cand
    d = os.getcwd()
    for root, _, files in os.walk(d):
        if 'libil2cpp.so' in files:
            return os.path.join(root, 'libil2cpp.so')
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--so')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                  '..', 'evidence', 'combat',
                                                  'r8-numeric-arc-decode.txt'))
    args = ap.parse_args()
    so_path = find_so(args.so)
    if not so_path:
        raise SystemExit('libil2cpp.so not found; pass --so')
    data = open(so_path, 'rb').read()
    sha = hashlib.sha256(data).hexdigest()
    print(f'libil2cpp.so: {so_path}')
    print(f'sha256      : {sha}')
    assert sha.startswith(SO_SHA), f'sha mismatch — expected {SO_SHA}… provenance pin'
    print(f'sha pin     : {SO_SHA}… MATCH')

    # ---- ELF64 PT_LOAD map: vaddr <-> file offset ----
    (e_phoff,) = struct.unpack_from('<Q', data, 0x20)
    (e_phentsize, e_phnum) = struct.unpack_from('<HH', data, 0x36)
    segs = []
    for i in range(e_phnum):
        b = e_phoff + i * e_phentsize
        p_type, _fl = struct.unpack_from('<II', data, b)
        p_off, p_va, _pa, p_filesz = struct.unpack_from('<QQQQ', data, b + 8)
        if p_type == 1:
            segs.append((p_off, p_va, p_filesz))

    def va2off(va):
        for po, pv, sz in segs:
            if pv <= va < pv + sz:
                return va - pv + po
        return None

    def read_float(va):
        o = va2off(va)
        if o is None or o + 4 > len(data):
            return None
        return struct.unpack_from('<f', data, o)[0]

    def read_u32(va):
        o = va2off(va)
        if o is None or o + 4 > len(data):
            return None
        return struct.unpack_from('<I', data, o)[0]

    md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
    md.detail = True
    VA2NAME = {va: name for name, va in ANCHORS.items()}

    # build an off->vaddr resolver over PT_LOAD once (bisect over file offsets)
    import bisect
    seg_offs = sorted(po for po, _pv, _sz in segs)
    seg_by_off = {po: (pv, sz) for po, pv, sz in segs}
    def off2va_fast(o):
        k = bisect.bisect_right(seg_offs, o) - 1
        if k < 0:
            return None
        po = seg_offs[k]
        pv, sz = seg_by_off[po]
        if o < po + sz:
            return o - po + pv
        return None

    def bl_xref(target_va):
        """Whole-binary BL scan whose decoded target == target_va.
        BL opcode: bits[31:26] == 0b100101 (0x25); imm26 sign-extended, x4."""
        hits = []
        n = len(data) // 4
        words = struct.unpack_from('<%dI' % n, data, 0)
        for i, w in enumerate(words):
            if (w >> 26) != 0x25:  # BL
                continue
            imm = w & 0x03FFFFFF
            if imm & 0x02000000:
                imm -= 0x04000000
            site_va = off2va_fast(i * 4)
            if site_va is not None and site_va + imm * 4 == target_va:
                hits.append(site_va)
        return hits

    lines = []

    def emit(s=''):
        lines.append(s)
        print(s)

    emit(f'R8 numeric pass — ballistic arc/gravity decode  (generated {datetime.date.today().isoformat()})')
    emit(f'libil2cpp.so sha256 {sha}  (pin {SO_SHA}… MATCH)')
    emit('dump.cs pin 0050e67d… (structural pass, Task 54). Anchors: trajectory-gravity-consumer-scan.txt PART 5.')
    emit('')

    # ---- 1. engine family ids ----
    emit('== 1. get_EngineType per family (note §3 table check) ==')
    engine_ids = {}
    for name, va in ANCHORS.items():
        if not name.endswith('get_EngineType'):
            continue
        o = va2off(va)
        code = data[o:o + 16]
        ins = list(md.disasm(code, va))
        fam = None
        for i2 in ins:
            if i2.mnemonic == 'mov' and i2.op_str.startswith('w0, #'):
                fam = int(i2.op_str.split('#')[1])
                break
        engine_ids[name] = fam
        emit(f'  {name:52} @0x{va:X}: {ins[0].mnemonic} {ins[0].op_str}  => EngineType = {fam}'
             + (f'   {"" if fam is not None else "(NOT a mov imm — see dump)"}'))
    emit('')

    # ---- 2. per-function disassembly ----
    for name, va in ANCHORS.items():
        if name.endswith('get_EngineType'):
            continue
        win = WINDOWS.get(name, 0x300)
        o = va2off(va)
        if o is None:
            emit(f'!! {name}: vaddr 0x{va:X} not mapped')
            continue
        emit(f'===== {name} =====')
        emit(f'  vaddr 0x{va:X}  file 0x{o:X}  window 0x{win:X}')
        code = data[o:o + win]
        adrp_page, reg_ptr = {}, {}
        rets = 0
        for ins in md.disasm(code, va):
            ann = []
            m, op = ins.mnemonic, ins.op_str
            if m == 'adrp':
                d = ins.reg_name(ins.operands[0].reg)
                adrp_page[d] = ins.operands[1].imm
                reg_ptr.pop(d, None)
            elif m == 'add' and len(ins.operands) == 3 and ins.operands[2].type == 2:
                d = ins.reg_name(ins.operands[0].reg)
                s = ins.reg_name(ins.operands[1].reg)
                if s in adrp_page:
                    reg_ptr[d] = adrp_page[s] + ins.operands[2].imm
                    ann.append(f'va 0x{reg_ptr[d]:x}')
            elif m in ('ldr', 'ldrsb', 'ldrsh', 'ldrb', 'ldrh') and ins.operands[0].type == 1 and ins.operands[1].type == 3:
                # Capstone 5: REG=1, IMM=2, MEM=3
                d = ins.reg_name(ins.operands[0].reg)
                base = ins.reg_name(ins.operands[1].mem.base)
                disp = ins.operands[1].mem.disp
                if base in adrp_page:
                    pva = adrp_page[base] + disp
                    reg_ptr[d] = pva
                    if d.startswith(('s', 'd', 'v')):
                        f = read_float(pva)
                        ann.append(f'va 0x{pva:x}' + (f' FLOAT={f!r}' if f is not None else ''))
                    else:
                        u = read_u32(pva)
                        ann.append(f'va 0x{pva:x}' + (f' u32=0x{u:08x}' if u is not None else ''))
                elif base in reg_ptr:
                    pva = reg_ptr[base] + disp
                    if d.startswith(('s', 'd', 'v')):
                        f = read_float(pva)
                        if f is not None:
                            ann.append(f'FLOAT={f!r} (va 0x{pva:x})')
                    else:
                        u = read_u32(pva)
                        if u is not None and 0 < u < 0x1000:
                            ann.append(f'u32={u} (va 0x{pva:x})')
                else:
                    # plain struct field load — annotate known WeaponType offsets
                    for off, fname in FIELD_OFFS.items():
                        if disp == off:
                            ann.append(f'WeaponType.{fname}?')
                            break
            elif m == 'bl':
                t = ins.operands[0].imm
                nm = VA2NAME.get(t)
                ann.append(f'call 0x{t:X}' + (f' <{nm}>' if nm else ''))
            elif m in ('b',) or m.startswith('b.') or m in ('cbz', 'cbnz', 'tbz', 'tbnz'):
                if ins.operands and ins.operands[-1].type == 2:
                    t = ins.operands[-1].imm
                    nm = VA2NAME.get(t)
                    if nm:
                        ann.append(f'-> <{nm}>')
            emit(f'  0x{ins.address:06X}: {m:<9} {op}' + (('   ; ' + ' '.join(ann)) if ann else ''))
            if m == 'ret':
                rets += 1
                if rets >= 3:
                    emit('  [stop after 3 rets]')
                    break
            if ins.address - va > win - 8:
                emit('  [window end]')
                break
        emit('')

    # ---- 3. BL xref of the three getters ----
    emit('== 3. whole-binary BL xref — WeaponType trajectory/gravity/accelerating getters ==')
    emit('   (settles note §9(6): does any caller read the fields via getters?)')
    for name, va in GETTER_XREF.items():
        hits = bl_xref(va)
        emit(f'  {name} @0x{va:X}: {len(hits)} BL site(s)')
        for h in hits[:40]:
            emit(f'    caller 0x{h:X}')
    emit('')
    emit('NOTE: IL2CPP inlines trivial field getters; a zero/low BL count is negative-evidence')
    emit('      for getter-mediated reads only, not for direct field loads (offset 0x9E/0xA0).')

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, 'w') as f:
        f.write('\n'.join(lines) + '\n')
    print(f'\n-> {args.out}  ({len(lines)} lines)')

if __name__ == '__main__':
    main()
