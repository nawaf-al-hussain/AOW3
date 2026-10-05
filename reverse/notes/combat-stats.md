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

## Note on numeric values

The per-unit balance numbers (health, price, damage ints) are delivered by the
developer's live balance tables at runtime — they are **not** embedded in the
APK. The browser tribute therefore uses the recovered schema + formulas with
gameplay-tuned values.
