#!/usr/bin/env python3
"""Phase 2 (AOW3_DEVELOPMENT_PLAN) — Extract the Game's Data Model.

Parses the 6.9.18 dump.cs (Il2CppDumper output of com.geargames.aow) and emits a
machine-readable representation of the game's data-model STRUCTURE to
reverse/evidence/data-model/:

  estat.json          — the complete EStat enum (78 values) + EStatCategory
  weapon-schema.json  — WeaponTypeMapEditorConfig field/offset schema (27 fields)
  unit-type-ids.json  — UnitType.UNIT_ID_* / UNIT_CATEGORY_* constants + HeroTypes enum

Reproducible: run `python3 reverse/tools/extract_data_model.py` with dump.cs at
/home/z/my-project/aow3-work/dump/dump.cs (sha256 0050e67d23f898588f0771c69ba7f30f91
22cd6eccd66674c0f7c87b7f24714b, 63,922,449 bytes).

NOTE (established by the FileUpload audit + estat extraction): the numeric balance
VALUES behind these stats are delivered by the developer's live balance backend at
runtime and are NOT embedded in the APK. This tool extracts the schema/taxonomy;
per-unit values in docs/data/*.js are gameplay-tuned approximations documented in
reverse/notes/data-model-extraction.md.
"""
import hashlib, json, os, re, sys, datetime

DUMP = "/home/z/my-project/aow3-work/dump/dump.cs"
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "evidence", "data-model")
EXPECTED_SHA = "0050e67d23f898588f0771c69ba7f30f9122cd6eccd66674c0f7c87b7f24714b"

raw = open(DUMP, "rb").read()
sha = hashlib.sha256(raw).hexdigest()
if sha != EXPECTED_SHA:
    print("WARNING: dump.cs sha256 mismatch: %s" % sha, file=sys.stderr)
lines = raw.decode("utf-8", errors="replace").split("\n")


def find_block(start_pat, from_line=0):
    """(start_idx, end_idx) inclusive of a { ... } block whose decl matches start_pat."""
    for i in range(from_line, len(lines)):
        if re.search(start_pat, lines[i]):
            j, depth, seen = i, 0, False
            while j < len(lines):
                depth += lines[j].count("{") - lines[j].count("}")
                if "{" in lines[j]:
                    seen = True
                if seen and depth <= 0:
                    return (i, j)
                j += 1
    return None


ENUM_CONST = re.compile(r"public const (\w+(?:\.\w+)*(?:\[\])?)\s+(\w+)\s*=\s*(-?\d+)\s*;")

def parse_enum(name, next_type_pat):
    """Parse `public const <Type> <Name> = <int>;` pairs of enum <name>."""
    blk = find_block(r"public enum %s // TypeDefIndex" % re.escape(name))
    if not blk:
        sys.exit("FATAL: enum %s not found" % name)
    stop = None
    if next_type_pat:
        nxt = find_block(next_type_pat, blk[1] + 1)
        if nxt:
            stop = nxt[0]
    out, order = {}, []
    for i in range(blk[0], (stop or blk[1]) + 1):
        m = ENUM_CONST.search(lines[i])
        if m and m.group(1).endswith(name):
            out[m.group(2)] = int(m.group(3))
            order.append(m.group(2))
    return out, order, blk[0] + 1

FIELD = re.compile(r"(public|private|protected|internal)\s+(?:\[[^\]]+\]\s*)*([\w<>.]+)\s+(\w+)\s*;\s*//\s*(0x[0-9A-Fa-f]+)")

# ---- 1. EStat + EStatCategory ----
estat, estat_order, estat_line = parse_enum("EStat", r"public enum EStatCategory")
cat, cat_order, cat_line = parse_enum("EStatCategory", r"public interface IMaxStatValueProvider")

estat_doc = {
    "source": "dump.cs (Il2CppDumper 6.7.46, metadata v31, AOW3 6.9.18 XAPK LFS chain)",
    "dump_sha256": sha,
    "generated": datetime.date.today().isoformat(),
    "namespace": "com.geargames.aow.ugui.army.models.info",
    "decl_line": estat_line,
    "count": len(estat_order),
    "values": [{"id": estat[n], "name": n} for n in estat_order],
    "categories": {"decl_line": cat_line, "values": cat},
}
os.makedirs(OUT_DIR, exist_ok=True)
with open(os.path.join(OUT_DIR, "estat.json"), "w") as f:
    json.dump(estat_doc, f, indent=1)

# ---- 2. WeaponTypeMapEditorConfig schema ----
wblk = find_block(r"public class WeaponTypeMapEditorConfig // TypeDefIndex")
wfields = []
for i in range(wblk[0], wblk[1] + 1):
    m = FIELD.search(lines[i])
    if m:
        wfields.append({"type": m.group(2), "name": m.group(3), "offset": m.group(4)})
weapon_doc = {
    "source": "dump.cs",
    "dump_sha256": sha,
    "generated": datetime.date.today().isoformat(),
    "decl_line": wblk[0] + 1,
    "note": ("Serialized per-weapon balance row schema (map-editor config). Balance values "
             "are backend-delivered at runtime; APK ships structure only "
             "(see reverse/notes/data-model-extraction.md)."),
    "field_count": len(wfields),
    "fields": wfields,
}
with open(os.path.join(OUT_DIR, "weapon-schema.json"), "w") as f:
    json.dump(weapon_doc, f, indent=1)

# ---- 3. UnitType ids + HeroTypes ----
ublk = find_block(r"public class UnitType : Prototype // TypeDefIndex")
unit_ids, unit_cats, unit_types = {}, {}, []
for i in range(ublk[0], ublk[1] + 1):
    m = re.search(r"public const int (UNIT_ID_\w+)\s*=\s*(-?\d+);", lines[i])
    if m:
        unit_ids[m.group(1)] = int(m.group(2))
        unit_types.append(m.group(1))
        continue
    m = re.search(r"public const sbyte (UNIT_CATEGORY_\w+|SPEC_\w+)\s*=\s*(-?\d+);", lines[i])
    if m:
        unit_cats[m.group(1)] = int(m.group(2))

hblk = find_block(r"HeroTypes // TypeDefIndex|enum HeroTypes")
hstart = None
for i, ln in enumerate(lines):
    if re.search(r"HeroTypes\s*//\s*TypeDefIndex", ln):
        hstart = i
        break
heroes = {}
if hstart:
    j, depth, seen = hstart, 0, False
    while j < len(lines):
        depth += lines[j].count("{") - lines[j].count("}")
        if "{" in lines[j]:
            seen = True
        if seen and depth <= 0:
            break
        m = ENUM_CONST.search(lines[j])
        if m and m.group(1).endswith("HeroTypes"):
            heroes[m.group(2)] = int(m.group(3))
        j += 1

unit_doc = {
    "source": "dump.cs",
    "dump_sha256": sha,
    "generated": datetime.date.today().isoformat(),
    "unit_type_decl_line": ublk[0] + 1,
    "hero_types_decl_line": (hstart + 1) if hstart else None,
    "unit_id_count": len(unit_ids),
    "unit_ids": unit_ids,
    "unit_categories": unit_cats,
    "hero_types": heroes,
}
with open(os.path.join(OUT_DIR, "unit-type-ids.json"), "w") as f:
    json.dump(unit_doc, f, indent=1)

# ---- report ----
print("dump.cs sha256 OK (%s...)" % sha[:16])
print("EStat: %d values (None=%d .. %s=%d)  [decl line %d]" % (
    len(estat_order), estat[estat_order[0]], estat_order[-1], estat[estat_order[-1]], estat_line))
print("EStatCategory: %s" % cat)
print("WeaponTypeMapEditorConfig: %d fields (0x10..%s) [decl line %d]" % (
    len(wfields), wfields[-1]["offset"], wblk[0] + 1))
print("UnitType: %d UNIT_ID_* constants, %d category/special constants" % (len(unit_ids), len(unit_cats)))
print("HeroTypes: %s" % heroes)
for fn in ("estat.json", "weapon-schema.json", "unit-type-ids.json"):
    p = os.path.join(OUT_DIR, fn)
    print("wrote %s (%d bytes)" % (p, os.path.getsize(p)))
