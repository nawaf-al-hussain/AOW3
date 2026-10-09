#!/usr/bin/env python3
"""R7 — native sight/visibility rules scan (AOW3 6.9.18, libil2cpp.so).

Question (audit §7 R7 / gap H4): what are the native fog-of-war / sight rules?
Battle-core surface decoded from dump.cs:
  FogAct (Obfuz-renamed statics)  — authoritative fog computation over Battle
  FogOpener (serializable)        — network fog-open payload
  LC*FogVisibleChanged            — server->client visibility-state commands
  ClientUnitVisibleState          -1/0/1/2/3 (Undefined/Invisible/Hidden/Visible/Detected)
  ClientBuildingVisibleState      -1/0/1/2 (Undefined/Invisible/Fogged/Visible)
  Unit.sight_curr @0xBC; UnitStateType.sight @0x4C / sight_init @0x50 / radar @0x5C /
  invisible @0x70; Dynamic.side @0x18 / alliance @0x20;
  BattleAlliance.$HE @0x30 + $iE @0x38 (int[][] fog grids); BattleMap.$if @0x30 (List<int[][]>).

Outputs annotated disasm of the FogAct methods (calls resolved against a dump.cs-derived
VA->Class.method map for the battle-core classes, literal-pool loads, and tagged
field accesses at the offsets above).
"""
import struct, re, sys, os
from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN

DUMP = os.environ.get('AOW3_DUMP', '/home/z/my-project/aow3-re-work/dump.cs')
SO   = os.environ.get('AOW3_SO',   '/home/z/my-project/aow3-re-work/lib/arm64-v8a/libil2cpp.so')
OUT  = os.environ.get('AOW3_OUT',  'r7-fogact-scan.txt')

# ---- battle-core classes of interest (dump.cs line ranges are parsed, not hardcoded) ----
CLASSES = ['Dynamic', 'Unit', 'UnitType', 'UnitStateType', 'Battle', 'BattleMap',
           'BattleAlliance', 'BattleSide', 'FogAct', 'FogOpener', 'Bullet', 'Weapon',
           'Building', 'Mine', 'Flag', 'BattleCell', 'BattleCrosscell', 'Quest', 'Loss']

# ---- minimal ELF64 program-header parse: vaddr <-> file offset ----
data = open(SO, 'rb').read()
(e_phoff, e_phentsize, e_phnum) = struct.unpack_from('<Q', data, 0x20)[0], \
    struct.unpack_from('<H', data, 0x36)[0], struct.unpack_from('<H', data, 0x38)[0]
segs = []
for i in range(e_phnum):
    base = e_phoff + i * e_phentsize
    p_type, p_flags = struct.unpack_from('<II', data, base)
    p_offset, p_vaddr, p_paddr, p_filesz = struct.unpack_from('<QQQQ', data, base + 8)
    if p_type == 1:
        segs.append((p_offset, p_vaddr, p_filesz))

def va2off(va):
    for po, pv, sz in segs:
        if pv <= va < pv + sz:
            return va - pv + po
    return None

def read_u32(va):
    off = va2off(va)
    return struct.unpack_from('<I', data, off)[0] if off is not None else None

def maybe_float(u32):
    f = struct.unpack('<f', struct.pack('<I', u32))[0]
    return f if (abs(f) > 1e-6 and abs(f) < 1e12) else None

# ---- build VA -> "Class.method" map from dump.cs for the classes of interest ----
class_re = re.compile(r'^(?:public|internal|private|abstract|sealed|static|partial)*\s*class\s+(\w+)')
rva_re   = re.compile(r'RVA:\s*0x([0-9A-Fa-f]+)\s+Offset:\s*0x([0-9A-Fa-f]+)\s+VA:\s*0x([0-9A-Fa-f]+)')
meth_re  = re.compile(r'^\s+(?:public|private|internal|protected|virtual|override|static|abstract|sealed|extern|unsafe|async|\s|\[.*\])*'
                      r'(?:[\w<>\[\],.]+\s+)?(\$?[\w.<>$]+)\s*\(')
VA2NAME = {}
lines = open(DUMP, 'r', errors='replace').read().split('\n')
cur_class, pending_va = None, None
for ln in lines:
    m = class_re.match(ln)
    if m and (m.group(1) in CLASSES or ln.find(' Namespace:') >= 0):
        cur_class = m.group(1) if m.group(1) in CLASSES else None
        pending_va = None
        continue
    if cur_class is None:
        continue
    m = rva_re.search(ln)
    if m:
        pending_va = int(m.group(3), 16)
        continue
    m = meth_re.match(ln)
    if m and pending_va is not None:
        name = f'{cur_class}.{m.group(1)}'
        VA2NAME.setdefault(pending_va, name)
        pending_va = None

print(f'call map: {len(VA2NAME)} methods from classes: {sorted(CLASSES)}')

# ---- FogAct function table (name -> (file_offset, va), boundaries from sorted RVAs) ----
FOGACT = {
    'FogAct..ctor': (0x472AD8C, 0x472ED8C),
    'FogAct.$nd':   (0x472AD94, 0x472ED94),
    'FogAct.$Nd':   (0x472B314, 0x472F314),
    'FogAct.$od':   (0x472B720, 0x472F720),
    'FogAct.$Od':   (0x472BA24, 0x472FA24),
    'FogAct.$qd':   (0x472F30C, 0x473330C),
    'FogAct.$Qd':   (0x472F6D4, 0x47336D4),
    'FogAct.$pd':   (0x472F968, 0x4733968),
    'FogAct.$Rd':   (0x472FED8, 0x4733ED8),
    'FogAct.$td':   (0x47306B0, 0x47346B0),
    'FogAct.$Pd':   (0x4730914, 0x4734914),
    'FogAct.$rd':   (0x473166C, 0x473566C),
    'FogAct.$sd':   (0x4731DF4, 0x4735DF4),
    'FogAct.$Sd':   (0x4732328, 0x4736328),
}
# UnitStateType getters (for sight/radar/invisible provenance)
GETTERS = {
    'UnitStateType.get_Invisible': (0x45AF56C, 0x45B356C),
    'UnitStateType.get_Radar':     (0x45AF5FC, 0x45B35FC),
    'UnitStateType.get_Sight':     (0x45AF62C, 0x45B362C),
}
for n, (o, v) in GETTERS.items():
    VA2NAME.setdefault(v, n)

SORTED = sorted(FOGACT.items(), key=lambda kv: kv[1][1])

# field tags: imm-offset -> meaning (per owning-struct guess by surrounding calls)
FIELD_TAGS = {
    0x4C: 'UnitState.sight?', 0x50: 'UnitState.sight_init?/Unit.next_x?',
    0x5C: 'UnitState.radar?/Unit.walk_dx?', 0x70: 'UnitState.invisible?/Unit.dest_x?',
    0xBC: 'Unit.sight_curr', 0x18: 'Dynamic.side', 0x20: 'Dynamic.alliance',
    0x30: 'Alliance.$HE grid/BattleMap.$if', 0x38: 'Alliance.$iE grid',
    0x48: 'Unit.x(short@0x48)', 0x4A: 'Unit.y', 0x88: 'Unit.obj', 0x6A: 'Unit.task',
    0x9F: 'Unit.flag', 0xA0: 'Unit.flag_shoot', 0x14: 'Map.$ff(dim?)',
    0x16: 'Map.$Ff(dim?)', 0x28: 'Map.$hf(dim?)', 0x2A: 'Map.$Hf(dim?)',
}

md = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
md.detail = False

def annotate(addr, ins, adrp_reg):
    txt = f'  {addr:x}  {ins.mnemonic:<8} {ins.op_str}'
    # adrp tracking for literal pool / statics
    if ins.mnemonic == 'adrp':
        parts = ins.op_str.split(', ')
        if len(parts) == 2:
            adrp_reg[parts[0]] = parts[1].lstrip('#')
        return txt, None
    if ins.mnemonic == 'add':
        parts = [p.strip() for p in ins.op_str.split(',')]
        if len(parts) == 3 and parts[1] in adrp_reg:
            try:
                imm = int(parts[2].lstrip('#'), 0)
            except ValueError:
                return txt, None
            va = int(adrp_reg[parts[1]], 16) + imm
            u = read_u32(va)
            if u is not None:
                f = maybe_float(u)
                extra = f' ; [0x{va:x}] = 0x{u:x}' + (f' (float {f})' if f is not None else '')
                if f is None and u < 0x100000:
                    extra += f' (int {u})'
                return txt + extra, None
    if ins.mnemonic in ('bl', 'b') :
        parts = ins.op_str.split()
        if parts and parts[0].startswith('#'):
            try:
                tgt = int(parts[0].lstrip('#'), 16)
            except ValueError:
                return txt, None
            name = VA2NAME.get(tgt)
            if name:
                return txt + f'  -> {name} (0x{tgt:x})', None
            return txt + f'  -> 0x{tgt:x}', None
    if ins.mnemonic in ('ldr', 'str', 'ldrb', 'strb', 'ldrsb', 'strsb', 'ldrsh', 'strsh', 'ldrsw'):
        m = re.search(r'\[x(\d+),?\s*#?(0x[0-9a-f]+|\d+)\]', ins.op_str)
        if m:
            imm = int(m.group(2), 0) if m.group(2).startswith('0x') else int(m.group(2))
            tag = FIELD_TAGS.get(imm)
            if tag:
                return txt + f'  ; OFF 0x{imm:x} = {tag}', None
    return txt, None

def disasm_fn(name, foff, va, end_va, out):
    off = va2off(va)
    if off is None:
        out.write(f'!! {name}: VA 0x{va:x} not mapped\n')
        return
    size = min(end_va - va, 0x3000)
    code = data[off:off + size]
    out.write(f'\n===== {name}  VA 0x{va:x} .. 0x{end_va:x} ({size} B cap) =====\n')
    adrp_reg = {}
    bls = []
    for ins in md.disasm(code, va):
        txt, _ = annotate(ins.address, ins, adrp_reg)
        if ins.mnemonic == 'bl':
            m = re.search(r'-> (\S+)', txt)
            if m:
                bls.append(m.group(1))
        if ins.mnemonic == 'ret' and ins.address > va + 0x10:
            # keep disassembling (multiple rets possible); boundaries capped anyway
            pass
        out.write(txt + '\n')
        if ins.address >= end_va - 4:
            break
    out.write(f'  -- calls: {", ".join(sorted(set(bls))) or "(none resolved)"}\n')

with open(OUT, 'w') as out:
    out.write('R7 fog/sight scan — FogAct (battle-core fog computation), 6.9.18\n')
    out.write(f'libil2cpp.so sha256 8ace05bb…, dump.cs sha256 0050e67d…\n')
    out.write(f'call map: {len(VA2NAME)} battle-core methods resolved from dump.cs\n')
    for i, (name, (foff, va)) in enumerate(SORTED):
        end_va = SORTED[i + 1][1][1] if i + 1 < len(SORTED) else va + 0x1000
        if end_va <= va:
            end_va = va + 0x400
        disasm_fn(name, foff, va, end_va, out)
print(f'wrote {OUT}')
