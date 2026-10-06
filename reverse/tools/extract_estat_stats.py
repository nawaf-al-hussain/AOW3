#!/usr/bin/env python3
"""Audit item #4: extract EStat-linked IStatModel stat list from 6.9.18 dump.cs.

Outputs:
  - reverse/notes/units/estat-stat-models.md   (Phase 26 format note)
  - reverse/notes/units/estat-classes.tsv      (machine-readable class table)
  - reverse/evidence/estat/estat-extraction.txt (raw provenance/extraction log)
"""
import json, hashlib, re, os, datetime

DUMP = '/home/z/my-project/aow3-work/dump/dump.cs'
SL = '/home/z/my-project/aow3-work/sl/stringliteral.json'
REPO = '/home/z/my-project/aow3-repo'

lines = open(DUMP, encoding='utf-8', errors='replace').read().split('\n')
sha = hashlib.sha256(open(DUMP, 'rb').read()).hexdigest()


def find_block(start_pat, from_line=0):
    """Return (start_idx, end_idx) inclusive of a { ... } block whose decl matches start_pat."""
    for i in range(from_line, len(lines)):
        if re.search(start_pat, lines[i]):
            j = i
            depth = 0
            seen_open = False
            while j < len(lines):
                depth += lines[j].count('{') - lines[j].count('}')
                if '{' in lines[j]:
                    seen_open = True
                if seen_open and depth <= 0:
                    return (i, j)
                j += 1
    return None


def namespace_before(idx):
    for k in range(idx, max(0, idx - 6), -1):
        m = re.match(r'\s*// Namespace: (.*)', lines[k])
        if m:
            return m.group(1)
    return '?'


def tdi(idx):
    m = re.search(r'TypeDefIndex:\s*(\d+)', lines[idx])
    return m.group(1) if m else '?'


# ---- 1. EStat enum ----
b = find_block(r'^public enum EStat //')
estat_start, estat_end = b
estat_ns = namespace_before(estat_start)
estat_vals = []
for ln in lines[estat_start:estat_end + 1]:
    m = re.match(r'\tpublic const EStat (\w+) = (\d+);', ln)
    if m:
        estat_vals.append((m.group(1), int(m.group(2))))

# ---- 2. EStatCategory ----
bcat = find_block(r'^public enum EStatCategory //')
cat_vals = []
for ln in lines[bcat[0]:bcat[1] + 1]:
    m = re.match(r'\tpublic const EStatCategory (\w+) = (\d+);', ln)
    if m:
        cat_vals.append((m.group(1), int(m.group(2))))

# ---- 3. IStatModel interface ----
bif = find_block(r'^public interface IStatModel //')
iface_ns = namespace_before(bif[0])
iface_members = [l.strip() for l in lines[bif[0]:bif[1] + 1]
                 if re.match(r'\tpublic abstract', l) and '{ get' in l]

# ---- 4. All IStatModel implementors ----
classes = []
i = 0
while i < len(lines):
    m = re.match(r'^public (sealed |abstract )?class (\w+) : IStatModel // TypeDefIndex: (\d+)', lines[i])
    if m:
        end = find_block(r'^public (sealed |abstract )?class ' + m.group(2) + r' : IStatModel //', i)[1]
        body = lines[i:end + 1]
        fields = []
        for l in body:
            fm = re.match(r'\tprivate readonly (\S+) (\w+); // (0x[0-9A-Fa-f]+)', l)
            if fm:
                fields.append((fm.group(2), fm.group(1)))
        ctors = [l.strip() for l in body if re.match(r'\tpublic void \.ctor|private void \.ctor', l)]
        statics = [l.strip() for l in body if 'public static ' in l and '{ }' in l]
        rvas = re.findall(r'RVA: (0x[0-9A-Fa-f]+) Offset: (0x[0-9A-Fa-f]+)', '\n'.join(body))
        classes.append({
            'name': m.group(2), 'tdi': m.group(3), 'sealed': bool(m.group(1)),
            'ns': namespace_before(i), 'line': i + 1, 'endline': end + 1,
            'fields': fields, 'ctors': ctors, 'statics': statics, 'nrva': len(rvas),
        })
        i = end
    i += 1

# ---- 5. Weapon stats factory block (IWeaponStatsFactory + MineStatsFactory) ----
bmine = find_block(r'^public class MineStatsFactory : IWeaponStatsFactory<MineType> //')
mine_ns = namespace_before(bmine[0])

# ---- 6. stringliteral ico_stat_* ----
sl = json.load(open(SL))
icons = sorted(s['value'] for s in sl if re.match(r'ico_stat_', s.get('value', '')))
sl_sha = hashlib.sha256(open(SL, 'rb').read()).hexdigest()

# ---- 7. class -> EStat mapping (name-derived, flagged) ----
# direct name matches first
estat_names = {n for n, v in estat_vals}
mapping = []
special = {
    'WeaponDamage': None,  # polymorphic via 6 factories -> 6 EStat keys (direct dump evidence)
    'BuildingArmorStat': 'ArmorLight | ArmorMedium | ArmorHeavy (chosen natively per building armor type)',
    'UnitArmorStat': 'ArmorLight | ArmorMedium | ArmorHeavy (chosen natively per unit armor type)',
    'MineCostStat': 'MinePrice | WeaponMineCost (one of the two mine-cost stats)',
    'MineSetTimeStat': 'WeaponMineTime',
    'MineExplosionRadiusStat': 'WeaponExplosionRadius (mine radius) or ExplosionRadius-family',
    'SuperWeaponCostStat': 'WeaponSuperWeaponCost',
    'SuperWeaponCpStat': 'WeaponSuperWeaponCP',
    'SuperWeaponTimeStat': 'WeaponSuperWeaponTime',
    'SupplyDepotIncomeStat': 'SupplyIncome',
    'HqSupplyIncomeStat': 'SupplyIncome',
    'HqCommandPointsProduceStat': 'CommandPointsProduce',
    'ConstructionYardRadiusStat': 'ConstructionRadius',
    'UnitControlPointsStat': 'CommandPoints',
    'UnitUraniumCostStat': 'PriceUranum',
    'BuildingConstructionTimeStat': 'ConstructionTime',
    'UnitTrainTimeStat': 'TrainTime',
    'UnitHpRegenStat': 'HealthRegeneration',
    'BuildingHpRegenStat': 'HealthRegeneration',
    'WolverineMachineGunMaxAccelerationTimeStat': 'WolverineMachineGunMaxAccelerationTime',
    'LaunchPreparationTimeStat': 'LaunchPreparationTime',
    'SpaceStrikePreparationTimeStat': 'SpaceStrikePreparationTime',
    'MissileFlightTimeStat': 'MissileFlightTime',
    'PsiAttackSpeedReductionStat': 'PsiAttackSpeedReduction',
    'PsiSlowdownDurationStat': 'PsiSlowdownDuration',
    'CoilTankMaxTargetsStat': 'CoilTankMaxTargets',
    'MineDamageForHeavyArmorStat': 'candidates: WeaponArmorLight/61, WeaponArmorMedium/62, WeaponArmorHeavy/63 '
                                   '(per-armor mine damage; no MineDamage* EStat exists)',
    'MineDamageForLightArmorStat': 'candidates: WeaponArmorLight/61, WeaponArmorMedium/62, WeaponArmorHeavy/63 '
                                   '(per-armor mine damage; no MineDamage* EStat exists)',
    'MineDamageForMediumArmorStat': 'candidates: WeaponArmorLight/61, WeaponArmorMedium/62, WeaponArmorHeavy/63 '
                                    '(per-armor mine damage; no MineDamage* EStat exists)',
    'SpecialStat': None,
}
PREFIXES = ('Building', 'Unit', 'Hq')
for c in classes:
    n = c['name']
    if n in special:
        if special[n] is None:
            if n == 'WeaponDamage':
                mapping.append((n, 'WeaponArmorLight/61, WeaponArmorMedium/62, WeaponArmorHeavy/63, '
                                   'WeaponSuperWeaponArmorLight/72, Medium/73, Heavy/74 '
                                   '— via 6 static Create*Damage factories (dump-direct)', 'DIRECT'))
            else:
                mapping.append((n, 'EStat unknown (native); icon family ico_stat_unique_*; '
                                   'EStatCategory likely Special/4', 'INFERRED'))
        else:
            guess = special[n].split(' ')[0].split('|')[0].strip()
            conf = 'MATCH' if guess in estat_names else 'INFERRED'
            mapping.append((n, special[n], conf))
        continue
    stem = n[:-4] if n.endswith('Stat') else n
    if stem in estat_names:
        v = dict(estat_vals)[stem]
        mapping.append((n, f'{stem}/{v}', 'MATCH'))
        continue
    stripped = stem
    for p in PREFIXES:
        if stripped.startswith(p) and stripped[len(p):] in estat_names:
            v = dict(estat_vals)[stripped[len(p):]]
            mapping.append((n, f'{stripped[len(p):]}/{v} (after prefix strip {p}*)', 'MATCH_STRIPPED'))
            break
    else:
        mapping.append((n, '-', 'UNRESOLVED'))

os.makedirs(f'{REPO}/reverse/notes/units', exist_ok=True)
os.makedirs(f'{REPO}/reverse/evidence/estat', exist_ok=True)

# ---- TSV ----
with open(f'{REPO}/reverse/notes/units/estat-classes.tsv', 'w') as f:
    f.write('class\tTypeDefIndex\tnamespace\tdump.cs lines\tsealed\tEStat binding (dump-derived)\tconfidence\n')
    for (n, bind, conf), c in zip(mapping, classes):
        f.write(f"{n}\t{c['tdi']}\t{c['ns']}\t{c['line']}-{c['endline']}\t{c['sealed']}\t{bind}\t{conf}\n")

# ---- raw extraction log ----
with open(f'{REPO}/reverse/evidence/estat/estat-extraction.txt', 'w') as f:
    f.write('EStat / IStatModel extraction log — 6.9.18 dump.cs\n')
    f.write(f'Generated: {datetime.date.today().isoformat()} (audit-report item #4)\n')
    f.write(f'Source: reverse/dump.cs.zip -> dump.cs, {len(open(DUMP,"rb").read())} bytes, SHA-256 {sha}\n')
    f.write(f'stringliteral.json SHA-256 {sl_sha}\n')
    f.write(f'EStat enum: dump.cs lines {estat_start+1}-{estat_end+1}, namespace {estat_ns}, '
            f'{len(estat_vals)} values (0..{estat_vals[-1][1]})\n')
    f.write(f'EStatCategory enum: dump.cs lines {bcat[0]+1}-{bcat[1]+1}: {cat_vals}\n')
    f.write(f'IStatModel interface: dump.cs lines {bif[0]+1}-{bif[1]+1}, namespace {iface_ns}\n')
    f.write(f'Interface contract: {"; ".join(iface_members)}\n')
    f.write(f'MineStatsFactory: dump.cs lines {bmine[0]+1}-, namespace {mine_ns}\n')
    f.write(f'IStatModel implementors found: {len(classes)}\n\n')
    for c in classes:
        f.write(f"== {c['name']} TDI {c['tdi']} ({c['ns']}) dump.cs:{c['line']}-{c['endline']} "
                f"sealed={c['sealed']} rva_count={c['nrva']}\n")
        for fn, ft in c['fields']:
            f.write(f"   field {ft} {fn}\n")
        for ct in c['ctors']:
            f.write(f"   ctor {ct}\n")
        for st in c['statics']:
            f.write(f"   static {st}\n")
    f.write('\nico_stat_* string literals (%d):\n' % len(icons))
    for s in icons:
        f.write('   ' + s + '\n')

print('classes:', len(classes))
print('estat values:', len(estat_vals))
print('unresolved mappings:', [n for (n, b, c) in mapping if c == 'UNRESOLVED'])
print('icons:', len(icons))
