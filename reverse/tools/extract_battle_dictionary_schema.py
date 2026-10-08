#!/usr/bin/env python3
"""R1 inventory schema extraction (Task 41).

Parses the live battle-dictionary entity classes from dump.cs (6.9.18) into
reverse/evidence/prototype-data/schema.json: full instance-field lists with
offsets and types for UnitType, UnitStateType, BuildingType, BuildingLevelType,
WeaponType, MineType, Fraction, BoostType, TroopType, HeroParam, UpgradeUnit,
UpgradeBuilding, UpgradeLevel, Goods, BattleBaseDictionary, BaseDictionary,
SharedBaseDictionary, ResourceInfo, ClientResourceVersion.
"""
import re, json, sys

DUMP = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/scripts/dumpcs/dump.cs'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/home/z/my-project/scripts/AOW3-repo/reverse/evidence/prototype-data/schema.json'

CLASSES = [
    'BattleBaseDictionary', 'BaseDictionary', 'SharedBaseDictionary',
    'ResourceInfo', 'ClientResourceVersion',
    'Prototype', 'UnitType', 'UnitStateType', 'BuildingType', 'BuildingLevelType',
    'WeaponType', 'MineType', 'Fraction', 'BoostType', 'TroopType', 'HeroParam',
    'UpgradeUnit', 'UpgradeBuilding', 'UpgradeLevel', 'Goods',
]

lines = open(DUMP, 'r', encoding='utf-8', errors='replace').readlines()

# find class declaration line numbers (exact: "public class X : Y // TypeDefIndex: N")
starts = {}
for i, ln in enumerate(lines):
    m = re.match(r'^public (?:abstract |sealed )?class (\w+)\b(?![\w<])', ln)
    if m and m.group(1) in CLASSES and m.group(1) not in starts:
        starts[m.group(1)] = i

result = {}
for name, s in starts.items():
    # scan until the matching class body ends: heuristics — next top-level declaration
    fields = []
    consts = []
    j = s + 1
    depth_seen = False
    while j < len(lines):
        ln = lines[j]
        if ln.startswith('}'):
            break
        fm = re.match(r'\t(?:private|public|protected|internal)\s+(?:readonly\s+)?([\w<>,\[\]\.`\?]+)\s+(\w+); // (0x[0-9A-Fa-f]+)', ln)
        if fm:
            fields.append({'type': fm.group(1), 'name': fm.group(2), 'offset': fm.group(3)})
        cm = re.match(r'\tpublic const (\w+) (\w+) = (.*?);', ln)
        if cm:
            consts.append({'type': cm.group(1), 'name': cm.group(2), 'value': cm.group(3)})
        # stop at the next class declaration
        if j > s and re.match(r'^public (?:abstract |sealed )?class ', ln):
            break
        j += 1
    result[name] = {
        'decl_line': s + 1,
        'fields': fields,
        'consts': consts,
    }

json.dump(result, open(OUT, 'w'), indent=1)
print('extracted', len(result), 'classes ->', OUT)
for k, v in result.items():
    print(f"  {k}: decl {v['decl_line']}, {len(v['fields'])} fields, {len(v['consts'])} consts")
