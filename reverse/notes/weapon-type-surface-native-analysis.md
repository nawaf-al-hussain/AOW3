# Native analysis: WeaponType combat surface — target classes, AntiAir, shell-type semantics (6.9.18)

Created: 2026-10-07. Closes the remaining open rows of `reverse/AGENTS.md` §13:
*target restrictions and AA behavior*, `hitBonus` semantics, `explosionDecr`'s
damage-falloff role, and critical/special effects. Companion to
`weapon-accuracy-native-analysis.md`, `combat-stats.md` and
`damage-pipeline-native-analysis.md`.

## 1. Provenance (same chain as all prior native notes)

| Item | Value |
|---|---|
| Source XAPK | `Art-of-War-3_6.9.18_apkcombo.com.xapk` (repo root, LFS), 270,599,286 bytes, re-downloaded this pass |
| XAPK SHA-256 | `1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e` — byte-identical to the LFS OID |
| Library | `config.arm64_v8a.apk → lib/arm64-v8a/libil2cpp.so`, 164,646,104 bytes |
| libil2cpp.so SHA-256 | `8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5` — matches `armor-stat-helper-native-analysis.md` §1 |
| dump.cs SHA-256 | `0050e67d23f898588f0771c69ba7f30f9122cd6eccd66674c0f7c87b7f24714b` |
| Method | Capstone 5.0.7 ARM64 disassembly at dump.cs RVAs; whole-file BL xref (numpy, 2,982,071 BL instructions, 150,721-method dump.cs index — same totals as `damage-pipeline-native-analysis.md` §1, machinery reproduces); `.rela.dyn` parse (1,158,475 R_AARCH64_RELATIVE entries); strict ADRP+LDR slot-reference scan |
| Tools | `reverse/tools/weapon_type_surface_native_analysis.py`, `weapon_type_followup_scan.py`, `weapon_type_aa_mask_writer_scan.py` |
| Evidence | `reverse/evidence/combat/{weapon-type-surface-native.txt, weapon-type-followup.txt, weapon-type-aa-mask-writer.txt}` |

## 2. Question under investigation

`reverse/AGENTS.md` §13 had four open rows:

1. **explosion falloff**: `explosionRadius` × `explosionDecr` — decr's damage-falloff role;
2. **target restrictions and AA behavior** — nothing was known beyond the FSM note's
   `damage_priority` acquisition weighting;
3. **critical/special effects** — unknown whether a crit system exists;
4. **`hitBonus` semantics** — "field exists at `WeaponType` @0x24 — not seen in the
   accuracy surface" (the offset was wrong; see §3.1).

## 3. Findings

### 3.1 Field schema — corrections and the `type` field

Entity `WeaponType : Prototype` (dump.cs:396871, TDI 11545; base chain `Entity.id @0x10`)
full field table extracted. Corrections to prior mentions:

- **`hit_bonus` is at 0x48** (sbyte), not 0x24. Offset 0x24 is **`type`** (short).
- **`type` (0x24) is the shell/weapon TYPE id**, serialized as `"type"` (`WEAPON_TYPE`
  constant). Its values are the class's own `SHELL_TYPE_*` constants:
  `BULLET=10, BALL=20, BALL_BOMBARD=21, BALL_BOMBARD_PARABOLIC=23, NUCLEAR_MISSILE=27,
  ROCKET=30, ROCKET_BOMBARD=31, ROCKET_TORPEDO=34, FIRE=40, SOLARIS_ACTIVE=42,
  KODOMASH=44, COIL_TANK_ACTIVE=46, PSIONIC=50, MINE=60, LIGHTNING_CHAIN=70`
  (dump.cs:396880-396896), plus hero ability `SHELL_ID_*` 502-623.
- Natively: `canBombard()` (VA 0x45b6268) is `ldrh w8,[x0,#0x24]; and w0, w8, #1; ret` —
  **odd shell types are exactly the bombard variants** (21/23/27/31 odd; direct-fire
  10/20/30/40/50/60/70 even). `usingObjTerritory()` (0x45b622c) special-cases
  `type == 23` (BALL_BOMBARD_PARABOLIC) into a territory query. Both readings only make
  sense with `type` = shell type.
- **This resolves the accuracy note's APPROXIMATION** (which native ids are 10/27/40):
  `WeaponStaticAccuracy`'s dispatch `weaponType ∈ {10, 40}` → percent branches and
  `weaponType == 27` → special curve are **SHELL_TYPE_BULLET / SHELL_TYPE_FIRE /
  SHELL_TYPE_NUCLEAR_MISSILE** (dump-level constants + natively confirmed field role).
  Bullets and flamethrowers use percent accuracy; nuclear missiles the special curve;
  everything else (balls/rockets) the distance/explosion scatter branch.

### 3.2 Target classes — `aiming` is a bitmask (the §13 "target restrictions" answer)

`WeaponType.aiming` (0x8B, sbyte, serialized `"aiming"`) is the weapon's
**allowed-target-class bitmask**. The class bits, with the `EWeaponTarget` enum
(dump.cs:19803: `None=0, Bomber=1, Fighter=2, Helicopter=3, Marine=4, Submarine=5,
LandForce=6, Infantry=7`) and `Unit.OCCUPATION_FOR_*` constants as anchors:

| bit | class |
|---|---|
| 0x01 | ground (`LandForce` + `Infantry`) |
| 0x02 | `Helicopter` |
| 0x04 | `Marine` (water surface) |
| 0x08 | `Fighter` |
| 0x10 | `Bomber` |
| 0x20 | `Submarine` |

Native evidence, hop by hop:

1. **`WeaponStatsFactory.CreateTargets`** (VA 0x80f02e0, dump.cs:19602) builds exactly
   **7 `WeaponTarget` entries** — one per `EWeaponTarget` 1-7 — via
   `WeaponTarget..ctor(EWeaponTarget, short hint, short negativeHint, Func calc, owner)`
   (VA 0x80f08c0; 7 call sites, all in CreateTargets). Localization ids
   (hint / negativeHint): Infantry 713/11681, LandForce 709/11680, Marine 733/11686,
   Submarine 734/11687, Bomber 729/11682, Fighter 730/11683, Helicopter 731/11684.
2. **The 7 predicates** are the compiler lambdas `<CreateTargets>b__0..b__6`
   (0x80f0c4c/0x80f0c6c/0x80f0cbc/0x80f0cdc/0x80f0cfc/0x80f0d1c/0x80f0d3c), each a
   tail/dispatch into **`WeaponStatsFactory.HasAiming(mods, weapon, mask)`** (VA
   0x80f01b8) with masks **1, 1(+exclusion), 4, 0x20, 0x10, 8, 2** respectively:
   - b__0 → 1; b__1 → 1 **plus** an exclusion `((weapon.id & ~1) == 500) → false`
     (weapon entity ids 500/501 — client-side ids only, balance data); b__2 → 4;
     b__3 → 0x20; b__4 → 0x10; b__5 → 8; b__6 → 2.
3. **`HasAiming` body** (fully disassembled): fetches the weapon's aiming value through
   the stat-modification pipeline (interface dispatch, the same
   `ldrh [klass+0x12e] / ldrh [iface+0x50] / bl 0x3d00398` slot-resolution pattern as
   `WeaponAccuracyStat.CalcStaticValue`), converts `float → int` with an
   `+inf → 0` guard, and returns **`(mask & value & 0xff) != 0`**.
4. **`get_AntiAirOnly`** (VA 0x45b6274) is
   **`(Unit.OCCUPATION_FOR_AIR & this.aiming) == this.aiming`** — AntiAirOnly ⇔ the
   weapon's aiming mask is a *subset of the air mask*. (Containment test, not
   intersection.)
5. **`Unit..cctor`** (VA 0x45b1e88) initializes the three static masks natively:
   `strh 0x2505 → [statics+0]` and `strb 0x1a → [statics+2]`, i.e.
   - `OCCUPATION_FOR_AURA` (0x0) = **0x05** = ground \| marine (surface units);
   - `OCCUPATION_FOR_MINES` (0x1) = **0x25** = ground \| marine \| submarine (**all non-air**);
   - `OCCUPATION_FOR_AIR` (0x2) = **0x1A** = helicopter \| fighter \| bomber (**air**).
   (field names dump.cs:393220ff, `public static readonly sbyte`, offsets 0x0/0x1/0x2.)

The bit↔class assignment above is fixed by three mutually-corroborating constraints:
(a) the lambda-to-target construction order (see §3.3), (b) `OCCUPATION_FOR_AIR=0x1A`
must denote *air* (only {2,8,0x10} works for heli/fighter/bomber), (c)
`OCCUPATION_FOR_MINES=0x25` must denote *what mines can hit* (ground+marine+submarine —
mines never hit air; independently confirmed by the mine target list, §3.4).

### 3.3 Pairing method — honesty note

The lambda→`EWeaponTarget` pairing is fixed by construction order: `CreateTargets`
allocates each closure + `Func` immediately before its `WeaponTarget..ctor` call, and
the delegate method-pointer slots ([0x96ef918, 0x96ef920, … 0x96ef948], consumed in
construction order Infantry → LandForce → Marine → Submarine → Bomber → Fighter →
Helicopter) map to b__0..b__6 by deterministic C# codegen (lambda numbering and
method-pointer slot allocation both follow source order). The slots themselves are
runtime-filled: `.rela.dyn` resolves them into the pointer table at 0x9930090-0x99300c0
whose entries are fixed up at load (no static chain to b__N). The pairing is therefore
**structural (HIGH)**, corroborated by the `OCCUPATION_FOR_*` semantic constraints —
an alternative permutation would make `OCCUPATION_FOR_AIR`/`_MINES` semantically wrong.

### 3.4 Mines — static target list, air hard-disabled

`MineStatsFactory.CreateTargets` (VA 0x7fe6ab0) builds the same 7 `EWeaponTarget`
entries via the **bool-state ctor** (`WeaponTarget..ctor(EWeaponTarget, hint,
negativeHint, bool state, owner)` VA 0x80f2018; 7 call sites, all here):
Infantry hint 696, LandForce 697, Marine 698, Submarine 699, each with `state` read
from the mine's serialized balance data (per-class bools loaded through the
entity-data reader); **Bomber/Fighter/Helicopter are hard-coded `state=false` with
hint = -1** (not displayable). Coheres exactly with `OCCUPATION_FOR_MINES = 0x25`
(non-air): a mine can never target air, and which ground/sea classes it affects is
balance data.

### 3.5 `hitBonus` — field present, client-inert (the §13 "hitBonus semantics" answer)

- Field: `WeaponType.hit_bonus` (0x48, sbyte; property pair 0x45b64dc/0x45b64e4 —
  trivial load/store); map-editor mirror `WeaponTypeMapEditorConfig.m_hitBonus` (0x24).
- **Zero client consumers**: 0 direct BL call sites for the getter *and* the setter
  (whole-file scan); every other WeaponType getter is likewise 0-direct-BL (inlined or
  serializer-driven), but hit_bonus is additionally **absent from the client's
  serialized weapon schema** — the `WEAPON_*` string constants cover damage/dist/
  accuracy/aiming/guided/walking_shot/type but have **no `"hit_bonus"` entry**.
- Verdict: a balance-table input that the 6.9.18 **client never reads** — application
  (if any) is server-side, consistent with the standing tick-level conclusion
  (`armor-stat-helper-native-analysis.md` §5). No browser implementation impact is
  possible beyond acknowledging the field. Classification: **CONFIRMED (client-side
  absence)**.

### 3.6 `explosionDecr` — accuracy scatter only, no damage-falloff role (the §13 answer)

`explosion_decr` is serialized (`WEAPON_EXPLOSION_DECR`) on both `WeaponType` (0x84)
and `MineType` (0x2C). Its **only** client-binary consumers remain the accuracy
scatter branches — `WeaponStaticAccuracy` (0x7fceff8) and `WeaponDynamicAccuracy`
(0x7fcf0b8), each with exactly **1 direct call site**
(`WeaponAccuracyStat.CalcStaticValue` 0x80ec9a8 / `CalcDynamicValue` 0x80ece08 — the
stat-display pipeline; the `(1000 − 10·decr)` factor). No damage-falloff consumer
exists anywhere in the binary. Together with the damage-pipeline note's result ("no
second damage formula, no armor-type coefficient"), the client surface of explosion
falloff is now **closed**: the client models decr as *accuracy scatter*, and any
splash-damage falloff would be server-side. Classification: **CONFIRMED (client
surface)** — the §13 row is answered, not hand-waved.

### 3.7 Critical/special effects — no crit system (the §13 answer)

Whole-dump scan: "Critical" exists only as `DebugLevel.Critical = 5` (logging) — **no
critical-hit mechanic in the 6.9.18 client**. "Special effects" are shell-type-driven:
`SHELL_TYPE_PSIONIC=50`, `LIGHTNING_CHAIN=70`, `MINE=60`, hero ability shell ids
502-623 (dump.cs:396882-396896) plus the VFX taxonomy already folded into the tribute
(`vfx-asset-prefix-check.md`). Classification: **CONFIRMED (absence)**.

### 3.8 Xref surface (direct BL, 2.98M instructions)

| Target | Direct callers |
|---|---|
| `WeaponType.init` (0x45b2e6c) | 3 — `BuildingLevelType.init`, `UnitStateType.init`, `UnitType.abilityWeaponInit` (prototype-tree init chain) |
| `WeaponTarget..ctor(bool)` | 7 — all `MineStatsFactory.CreateTargets` |
| `WeaponTarget..ctor(func)` | 7 — all `WeaponStatsFactory.CreateTargets` |
| `WeaponStaticAccuracy` | 1 — `WeaponAccuracyStat.CalcStaticValue` |
| `WeaponDynamicAccuracy` | 1 — `WeaponAccuracyStat.CalcDynamicValue` |
| every `WeaponType` property getter + `CreateTargets` + `WeaponTarget.GetState` | 0 (inlined / interface-dispatched) |

## 4. Verdict

The WeaponType combat surface is now completely enumerated natively:

```
weapon balance row (server) ── serialized: type, aiming, guided, walking_shot,
                               damage triad, distance(+_min), explosion_radius,
                               explosion_decr, accuracy triad, shots, velocity …
        │
        ▼
WeaponType (prototype tree: init ← UnitType.abilityWeaponInit / BuildingLevelType / UnitStateType)
        │
        ├─ type (0x24 short, SHELL_TYPE_*)  → accuracy-curve dispatch {bullet,fire | nuke | default}
        │                                    → canBombard = type&1 (odd = bombard variants)
        ├─ aiming (0x8B bitmask)            → 6 target-class bits (ground/heli/marine/fighter/bomber/sub)
        │      └─ CreateTargets → 7 WeaponTarget predicates (HasAiming: bit & value)
        │      └─ get_AntiAirOnly = (OCCUPATION_FOR_AIR 0x1A & aiming) == aiming
        ├─ damage_priority (0x40 sbyte[])   → acquisition weighting (FSM note)
        └─ hit_bonus (0x48)                 → client-inert (no reads, not serialized client-side)
```

No critical-hit system exists; `explosionDecr` has no damage-falloff role in the
client. **§13 is now fully closed.**

## 5. Implementation guidance (browser tribute)

1. Keep the recovered accuracy curves as-is (v=12); the branch selection may now be
   keyed on the native shell-type semantics instead of the documented interpretation:
   `shellType ∈ {BULLET(10), FIRE(40)}` → percent branch; `== NUCLEAR_MISSILE(27)` →
   special curve; default → scatter branch. (Current interpretation matches; only the
   anchoring changed.)
2. Target eligibility should be modeled as a **6-bit class mask** per weapon
   (ground/heli/marine/fighter/bomber/submarine) with `AntiAir ⇔ mask ⊆ 0x1A`, and
   acquisition weighting as already implemented (`damage_priority`).
3. Mines: air classes hard-excluded; ground/sea per-class enablement is balance data
   (per-mine).
4. No browser change for hit_bonus / crits / explosionDecr — document-only.

## 6. Test

- `python3 reverse/tools/weapon_type_surface_native_analysis.py` — regenerates
  `reverse/evidence/combat/weapon-type-surface-native.txt`: getter bodies must show
  the 0x48/0x78/0x8a-0x8d offsets; CreateTargets must contain the 7
  `mov w1, #<EWeaponTarget>` ctor calls with hints 709-734; the xref table must show
  7/7 ctor splits and the single accuracy-helper callers.
- `python3 reverse/tools/weapon_type_followup_scan.py` — regenerates
  `weapon-type-followup.txt`: slot table 0x96ef918..0x96ef948 in construction order;
  HasAiming ending `(mask & value) != 0`; mine target list with air hints -1.
- `python3 reverse/tools/weapon_type_aa_mask_writer_scan.py` — regenerates
  `weapon-type-aa-mask-writer.txt`: `Unit..cctor` flagged strb@2=True.
- Spot-check: `sed -n '393220,393240p' dump.cs` shows `OCCUPATION_FOR_*`; unit-cctor
  disassembly (§3.2 item 5) reads `mov w9, #0x2505` / `mov w10, #0x1a`.

## 7. Unknowns

- The native `weaponType`/aiming **values per weapon** remain balance/server data
  (unchanged standing conclusion); what this pass adds is the *schema and semantics*.
- Weapon entity ids 500/501 (LandForce exclusion in b__1) are not identifiable from
  the client; plausibly the mine-deployment shells (mines carry their own target
  surface) — interpretation, UNVERIFIED.
- `usingObjTerritory`'s territory query (type == 23 branch) resolves into generic
  entity lookup machinery; its exact semantics were not traced further (display/
  placement concern, low tribute relevance).
- Live-sim application of hit_bonus (if any) is server-side — unknowable from the APK.
