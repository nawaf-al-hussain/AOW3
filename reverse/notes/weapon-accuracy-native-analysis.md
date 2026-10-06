# Native analysis: weapon-accuracy pipeline (6.9.18)

Created: 2026-10-06. Companion to `combat-stats.md` and
`armor-stat-helper-native-analysis.md`. Recovered the exact accuracy formulas so the
browser `hitChance()` could be replaced by the native curves.

## 1. Provenance

| Item | Value |
|---|---|
| Source XAPK | `Art-of-War-3_6.9.18_apkcombo.com.xapk` (repo root, LFS) |
| XAPK SHA-256 | `1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e` (== LFS OID) |
| Library | `config.arm64_v8a.apk → lib/arm64-v8a/libil2cpp.so` |
| libil2cpp.so SHA-256 | `8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5` (== armor note §1) |
| Method | Capstone 5.0.7 ARM64 disassembly at file offsets from `dump.cs` |
| Script | `reverse/tools/accuracy_native_analysis.py` (committed) |

## 2. Functions recovered

`dump.cs:247384/247388` — both `[Pure]` statics in `GUIMainUpgradeHelperFunctions`
(the same class as the natively-verified `WeaponDamage{L,M,H}Value` triad):

```csharp
public static float WeaponStaticAccuracy (short weaponType, float weaponAccuracyStatic,
    int weaponGuided, int weaponDistance, float weaponExplosionDecr, float weaponExplosionRadius)
    // RVA 0x7FCEFF8  Offset 0x7FCAFF8  (span 0xC0)

public static float WeaponDynamicAccuracy (int weaponWalkingShot, int weaponGuided,
    int weaponAccuracyStatic, int weaponType, int weaponAccuracyWalk, int weaponDistance,
    int weaponExplosionDecr, int weaponExplosionRadius)
    // RVA 0x7FCF0B8  Offset 0x7FCB0B8  (span 0x94)
```

AAPCS64 register mapping (floats in v-regs): Static — `w0`=type, `s0`=accStatic,
`w1`=guided, `w2`=distance, `s1`=explosionDecr, `s2`=explosionRadius.
Dynamic — all-int args `w0..w7` = walkingShot, guided, accStatic, type, accWalk,
distance, explosionDecr, explosionRadius.

## 3. Recovered formulas

Raw disassembly: see `reverse/tools/accuracy_native_analysis.py` output
(self-test section re-derives the documented `WeaponDamageLightValue` body — machinery
validated against `armor-stat-helper-native-analysis.md` §3.4).

### 3.1 WeaponStaticAccuracy

```text
weaponType ∈ {10, 40}                  : out = acc / 100
weaponType == 27:
    acc < 100                          : out = 1 - acc/1000
    acc >= 100                         : out = 0.9 + (acc - 100) / (-308)
default:
    guided != 0                        : out = acc / 100
    guided == 0                        : out = 1 - 0.5*d*acc*(1000 - 10*decr) / (10^6 * R)
```

(`d` = weaponDistance, `decr` = weaponExplosionDecr, `R` = weaponExplosionRadius.
The last branch expands the in-surface sequence
`s0 = d*acc/1000 * -0.5 * 1000 / R * (1000-10*decr) / 1000; out = (1000 + s0)/1000`.)

### 3.2 WeaponDynamicAccuracy

```text
walkingShot == 0                       : out = 0        (caller falls back to static)
walkingShot != 0, guided != 0          : out = accStatic / 100
walkingShot != 0, type ∈ {10, 40}      : out = accWalk * accStatic / 10000
walkingShot != 0, default              : out = 1 - (accWalk+accStatic)*d*(1000-10*decr) / (2*10^6 * R)
```

### 3.3 Constants (rodata, hash-verified binary)

| Constant | Address | Value |
|---|---|---|
| float | `0x1b09b9c` | 0.1 (armor curve, cross-check) |
| float | `0x1b099f0` | 0.9 (armor curve, cross-check) |
| float | `0x1b09d28` | **10000.0** (dynamic {10,40} divisor) |
| immediate | `0x42c80000` | 100.0 |
| immediate | `0x447a0000` | 1000.0 |
| immediate | `fmov #1.0`, `#-0.5`, `#-10.0` | — |

`WeaponAccuracyStat.MAX_PERCENT = 100` (dump.cs:18713) confirms percent-scaled input.

## 4. Schema confirmation (dump.cs, entity `WeaponType`, com.geargames.aow.entities)

`accuracy_static/0x8E, accuracy_dynamic/0x90, accuracy_walk/0x92, guided/0x94,
walking_shot/0x8A, distance/0x4C, distance_min/0x58, explosion_radius/0x7C,
explosion_decr/0x84 (sbyte)`. Consts: `ACCURACY_DISTANCE_BASE = 10`,
`FIRE_TICK_LENGTH = 4`, `FIRE_RADIUS_INC = 10`. `EStat.WeaponAccuracy = 59`.

## 5. Confidence

* **CONFIRMED (HIGH)**: branch structure, all constants, walking/guided/type dispatch,
  and that dynamic accuracy is keyed on the **shooter's** `walking_shot` (parameter is
  `weaponWalkingShot`; a stationary shooter takes the Static path — the target's motion
  does not enter either signature).
* **APPROXIMATION**: which native `weaponType` ids (10/27/40) correspond to which
  unit class — the id assignment is balance-table data (server-delivered), not in the
  binary. Also the per-weapon `explosionDecr` values. Browser branch selection is a
  documented interpretation: direct-fire → percent branches; rocket artillery → the
  distance/explosion branch; guided gunship rockets → guided branch.
* These are the stat-display pipeline helpers ([Pure], `GUIMain*`); per the armor note §5
  convention, the live tick-level application is server-side and out of binary reach.
  The browser adopts these curves as its combat model, consistent with `combat-stats.md`.

## 6. Browser implication (implemented 2026-10-06, v=12)

* `hitChance(weapon, shooterMoving, distance)` replaces
  `hitChance(accStatic, accWalk, targetMoving, distance, range)`.
* **Semantic fix**: moving-shooter penalty now keys on `shooterMoving`
  (`u.path.length > 0`), not on the *target* moving — the old model was inverted.
* Walking penalty = `accWalk·accStatic/10^4` (native), replacing the invented
  `0.35·distance/range` falloff (now removed).
* Guided weapons always use `accStatic/100`. Artillery uses the recovered
  distance/explosion scatter branch (`explosionDecr: 30` = approximation).
* Deterministic vectors: `reverse/evidence/tests/accuracy.md`.
