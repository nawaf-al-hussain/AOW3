# AOW3 Combat Model — Recovered Facts

Source evidence: Art of War 3 v6.9.18, `com.geargames.aow`, IL2CPP ARM64
(`libil2cpp.so` + unencrypted `global-metadata.dat`, metadata v31).
Recovered via Il2CppDumper v6.7.46 + ARM64 disassembly of the named functions.

## 1. Damage vs armor — `CalculateWeaponArmorDamage(float dmg, EStat armorStat)`

Location: `0x7cc1c18` (dump.cs:168923). Two branches, decompiled constants
`0.1f` (`0x1b09b9c`) and `0.9f` (`0x1b099f0`):

```
armor < damage : out = (dmg - armor) * 0.1 / (ref - armor) + 0.9
armor >= damage: out = 0.9 * (1 - 1/(1+dmg/s) + dmg/(armor*(1+armor/s)))
```

Interpretation: the mitigation factor lives in `[0.1 .. 1.0]` — armor can never
reduce a hit below ~10%, and a hit always does at least 90% when damage exceeds
armor. The browser tribute implements the continuous reconstruction:

```
r = armor / dmg
r < 1  -> f = 0.9 + 0.1 * (dmg - armor) / dmg          // 0.9 .. 1.0
r >= 1 -> f = 0.9 * (1 + (dmg - armor) / (armor + dmg)) // -> 0.9 .. 0.0, clamped 0.1
```

Continuous at `r == 1` (f = 0.9), matching both decompiled branch constants.

**Native re-verification + surface closure (2026-10-06):** the full armor-damage surface was
disassembled (`reverse/notes/armor-stat-helper-native-analysis.md`). `CalculateWeaponArmorDamage`
is the ONLY mitigation-curve site; its sole float constants are 0.1f/0.9f (+1.0f immediate).
`MaxStatValueProvider.Get` routes exactly **EStat 61–63 = `WeaponArmor{Light,Medium,Heavy}`**
and **72–74 = `WeaponSuperWeaponArmor{Light,Medium,Heavy}`** into the curve.
`ArmorStatHelper.GetArmorMeta` (0x7cb6b30) is UI-only: `ArmorType(0..2) → (EStat 7/8/9,
icon/label string)` — zero FP instructions. The six `WeaponStatsFactory` damage thunks and
three `MineStatsFactory.CreateDamageFor*` wrappers are arithmetic-free delegation (builders
bake only the EStat id). No per-armor-type coefficient exists anywhere — external
`ARMOR_COEFF`/`AttackCoeffCalculating` claim REJECTED.

## 2. Weapon counter-triangle

`WeaponDamageLightValue @0x7fcf14c`, `WeaponDamageMediumValue @0x7fcf1b8`,
`WeaponDamageHeavyValue @0x7fcf224`. Every weapon object carries **three** damage
ints at offsets `0x28 / 0x2c / 0x30` — vs light / medium / heavy armor — and every
unit carries an armor triad (EStat 7/8/9). This produces the rock-paper-scissors
counter system.

## 3. `EStat` enum (dump.cs:168776) — unit/building stat schema

```
Health=1, Price=2, PriceUranum=3, CommandPoints=4, TrainTime=5, Speed=6,
ArmorLight=7, ArmorMedium=8, ArmorHeavy=9, View=10, ConstructionRadius=11,
ConstructionTime=12, CommandPointsProduce=13, SupplyIncome=14,
EnergyProduction=15, EnergyNeed=16, BuildingSize=17, HealthRegeneration=18, ...
```

## 4. `ArmorType` enum (dump.cs:166696)

`Light=0, Medium=1, Heavy=2`

## 5. `WeaponTypeMapEditorConfig` (dump.cs:256556) — weapon fields

```
m_damageLight/0x18  m_damageMedium/0x1C  m_damageHeavy/0x20
m_hitBonus, m_distance, m_distanceMin, m_explosionRadius, m_explosionDecr,
m_velocity, m_shotStart/m_shotInt/m_shotCount, m_roundLen,
m_accuracyStatic/Dynamic/Walk, m_rotateSpeed ...
```

## 6. Weapon accuracy — `WeaponStaticAccuracy` / `WeaponDynamicAccuracy` (2026-10-06)

Recovered natively (see `weapon-accuracy-native-analysis.md`):
`GUIMainUpgradeHelperFunctions.WeaponStaticAccuracy @0x7FCEFF8`,
`WeaponDynamicAccuracy @0x7FCF0B8`. Dispatch on `weaponType` {10,40} / 27 / default,
guided, and `walking_shot`; constants 100 / 1000 / 10000 / (1000−10·decr) / 10⁶.
Key semantics: the dynamic (walking) curve is keyed on the **shooter's** `walking_shot`,
not the target's motion; `accWalk·accStatic/10⁴` is the direct-fire walking branch;
guided weapons always use `accStatic/100`. Browser implemented in v=12;
deterministic vectors in `evidence/tests/accuracy.md`. The native `weaponType` id
assignment and `explosionDecr` values are server-side (approximations documented).

## Note on numeric values

The per-unit balance numbers (health, price, damage ints) are delivered by the
developer's live balance tables at runtime — they are **not** embedded in the
APK. The browser tribute therefore uses the recovered schema + formulas with
gameplay-tuned values.

## 7. Unit roster — native structure, approximated values (2026-10-06, v=14)

The browser roster was rebuilt from the verified 6.9.18 structure (full evidence:
`unit-roster-native-analysis.md`): faction unit lists from AudioController
select-sound keys, unit ids from `UnitType.UNIT_ID_*` constants (f1 vehicles
Fortress 10 / Hammer 11 / Typhoon 12 / Zeus 15 / Torrent 16 / Shield 17; f2 vehicles
Coyote 110 / Armadillo 111 / Porcupine 112 / Jaguar 115 / Mammoth 116 / Fog 117;
infantry Ilight 0/100, Iheavy 1/101, Sniper 102), roles cross-checked against model
node/clip inventory. Prototype numeric tables are server-delivered (verified absent
from the package), so per-unit hp/price/damage remain gameplay-tuned approximations
distributed by role class; the accuracy curves of §6 apply unchanged on top.

Browser-only stand-ins, documented: Shield support unit implemented as a friendly
heal aura (aura.regen 2/s, radius 6) — native UNIT_TYPE_SHIELD mechanics not
reproduced; Chameleon implemented as an unarmed fast scout — native stealth (FOG)
not reproduced; Zeus's native chain-lightning shell type not reproduced (plain
dual-role weapon instead).
