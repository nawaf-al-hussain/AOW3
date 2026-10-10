# RE note: R8 — trajectory-type / gravity consumers (6.9.18, offline structural pass)

Created: 2026-10-10. Registry `R8` ("m_bulletTrajectoryType / m_gravity consumer
semantics", converts gap `G10`). Companion to `weapon-type-surface-native-analysis.md`
(WeaponType combat surface), `data-model-extraction.md` (weapon-schema.json) and
`r1-prototype-data-pipeline.md` (per-weapon value keys). Evidence:
`reverse/evidence/combat/trajectory-gravity-consumer-scan.txt` (5 parts, 1,142 lines).

## 1. Provenance and scope

| Item | Value |
|---|---|
| dump.cs | Il2CppDumper v6.7.46 output, SHA-256 `0050e67d23f898588f0771c69ba7f30f9122cd6eccd66674c0f7c87b7f24714b` — matches the pin in all prior native notes |
| libil2cpp.so | **NOT on disk this session** (the repo-root XAPK stub is a 134-byte placeholder; the 6.9.18 work tree was cleaned) — method *bodies* are out of scope |
| Method | dump.cs structural xref: field declarations, enum values, class surfaces (fields + method decls), RVA anchor table (392 methods) |
| Tools | `r8_dump_inventory.py`, `r8_class_surfaces.py`, `r8_bridge_surfaces.py`, `r8_rva_anchors.py` (persisted under repo-root `scripts/`, worklog Task 54) |
| Negative evidence | `stringliteral.json` sweep: **zero** trajectory/ballistic/arc/engine literals — engines are prefab/const-wired, not string-wired. `BaseParams.ContentGravity` (dump.cs:1524415) is Unity UI scroll gravity, unrelated. `BulletMagnet` (257893) is the magnet-catch component consumed by the Adjustable/SelfDirected engines, not a trajectory holder. |

## 2. Finding 1 — twin field surfaces (config vs runtime)

The trajectory/gravity pair exists twice, and both copies are accounted for:

| Surface | Fields | Role |
|---|---|---|
| `WeaponTypeMapEditorConfig` (dump.cs:256556, 27 fields) | `m_bulletTrajectoryType` sbyte **0x3C**, `m_gravity` short **0x3E** | map-editor serialized balance row (schema source of `weapon-schema.json`) |
| `WeaponType` runtime struct (dump.cs:396971..) | `bulletTrajectoryType` sbyte **0x9E**, `gravity` short **0xA0**, `accelerating` bool **0xA2**, `bul_type` int 0xA4, `boom_type` int 0xA8 | runtime weapon prototype handed to bullets |

The R1 prototype dictionary keys `bulletTrajectoryType / gravity / accelerating`
(`r1-prototype-data-pipeline.md` §values; mapping CONFIRMED at
`browser-comparison.md` L62) bind to the **runtime** offsets 0x9E/0xA0/0xA2 —
i.e. when R1 values land, they populate `WeaponType` directly and the config
twin is downstream tooling. Getters/setters:
`get/set_BulletTrajectoryType` RVA `0x45B62EC/0x45B62F4`,
`get/set_Gravity` `0x45B63AC/0x45B63B4`,
`get/set_Accelerating` `0x45B632C/0x45B6334`,
`get/set_BoomType` `0x45B637C/0x45B6384`.

## 3. Finding 2 — the engine dispatch taxonomy (`BulletEngineType`, dump.cs:378800)

`m_bulletTrajectoryType` is a **client bullet-engine selector**. The constants:

```
Linear = 0   Ballistic = 1   Ballistic_High = 2   SelfDirected = 3
ChainLighting = 4   Melee = 5   UpAndSelfDirected = 6
```

Engine class per family (all `AbstractBulletEngine` subclasses, dump.cs:276251..276885):

| Value | Engine class | Mechanic surface (decl-level) |
|---|---|---|
| 0 | `LinearBulletEngine` | straight flight; `m_randomMagnetPoint`, `m_isLookingUpwards` |
| 1 | `BallisticBulletEngine` | parabolic arc (`AbstractBallisticBulletEngine` core) |
| 2 | `BallisticHighBulletEngine` | high-arc variant; `m_overrideStartRotation`, own `EngineInitiate` |
| 3 | `SelfDirectedBulletEngine` | homing with Hermite-style pos0/1/2 + vel0/1/2 buffers, `CurveMode` Clear=0/Straight=1/Single=2/Double=3, `ACCELERATION_MULTIPLIER = 10`, `MissTargeting(offset, durationLeftFrom)` |
| 4 | `ChainLightingBulletEngine` | chain lightning (`ChainBulletParams`, `m_randomMagnetPoint`, controller list) |
| 5 | `Melee` | no bullet body (instant hit — no engine class exists) |
| 6 | `UpAndSelfDirected` | no dedicated class → up-phase then self-directed (handled inside `SelfDirectedBulletEngine` targeting) — open residual |
| — | `AdjustableBallisticBulletEngine` (subclass of 1) | mid-flight retarget: `m_target`, `m_originalStartTime`, `TryGetBulletMagnetPosition`, overrides `CalculateElapsedTime/CalculateCurrentPosition` |
| — | `LeviaphanNuclearRocketBallisticBulletEngine` (subclass of 2) | hero special: `m_positionCurve`/`m_heightCurve` AnimationCurves, `m_min/maxDistanceGravityDivider` ([Min(0.5)]/[Min(1)]), overrides `CalculateGravity/CalculatePositionTime/CalculateAltitudeTime`, `GetClamped01Time` |

Every engine exposes `abstract sbyte EngineType` (getters: Ballistic `0x80B3558`,
BallisticHigh `0x80B36EC`, Linear `0x80B5CAC`, SelfDirected `0x80B6A80`,
ChainLighting `0x80B4FDC`, Adjustable `0x80B2B30`) — the .so pass can confirm
each family's numeric id in one instruction read each.

## 4. Finding 3 — gravity semantics (`AbstractBallisticBulletEngine`, dump.cs:276251)

* `private const float GRAVITY_DIVIDER = 100` — **the gravity field is scaled by /100**:
  a per-weapon `gravity = 1000` means 10.0 distance-units/s² in the arc model.
  This is the first hard unit fact for G10.
* `protected virtual float CalculateGravity()` (RVA `0x80B25A8`) — base reads the
  field through the divider; the Leviathan hero engine overrides it with
  distance-interpolated dividers (min 0.5 … max 1.0 clamps, curve-driven).
* `private void CalculateHeightCoefficients(int duration)` (RVA `0x80B2050`) —
  height profile is **parametric in the flight duration**, not velocity-integrated
  (matches the sim-side absence of any vel_z; see Finding 4).
* `m_accelerating` bool @0x90 mirrors `WeaponType.accelerating` — ballistic shells
  can accelerate along the arc; `Bullet.get_AccelerateAndGuide` (RVA `0x458FD60`)
  is the sim-side paired predicate.
* ClientBulletVisibleStyle enum (VisibleIfNotFogged=0/VisibleAlways=1) is fog-only —
  no trajectory semantics (settles the R7-adjacent bullet-fog question).

## 5. Finding 4 — sim-side `Bullet : Entity` kinematics (dump.cs:378393)

The authoritative sim bullet (integers, server-computed) carries:

* `we_type : WeaponType @0x18` — the whole prototype (trajectory/gravity reachable);
* fixed-point horizontal kinematics: `init_x/init_y/init_h`, `dx/dy`,
  `vel_x/vel_y` (0x28..0x40), `target_x/y/h`, `target_x_next/y_next` (0x44..0x54);
* **three-phase timing**: `duration` 0x5A, `duration_next` 0x5C, `duration_long`
  0x5E — multi-leg flight (first arc → next target leg → long/meteor leg),
  matching `LCBulletTargeting`'s `m_duration/m_durationNext/m_durationLong` payload;
* progress markers `tick` 0x60, `pos/prepos` 0x62/0x64;
* trajectory state: **`lowing` sbyte @0x97** (descending-phase flag — the sim
  tracks the arc's downward leg), `missed` 0x94, `on_target` 0x95,
  `target_precise_hit` 0x96, `needing_guidance` 0xAA + virtual
  `AccelerateAndGuide` (guided/accelerating shells);
* `explosion_radius` 0xAC, per-target damage books `damaged`/`damagedPerc`.

**No vel_z/vel_h exists** — vertical motion is not integrated in the sim; height is
a parametric curve over the duration (consistent with §4). The sim therefore
models *when* shells land and *whether* they hit; the engine family renders *how*
they fly. `LCBulletMissed` even dispatches miss-flight BY FAMILY
(`BallisticBulletExecute()` / `SelfDirectedBulletExecute()` with
`MISSED_FLIGTH_DISTANCE`, `DURATION_TIME_SCALER`, `Initiate(bullet, ticksToFly,
dx, dy, dz, durationLeftFrom)`).

## 6. Finding 5 — the consumption chain (sim → client)

1. `LCBulletCreate.Initiate(Bullet, Weapon, chainBulletId)` — payload includes
   `m_prototype : WeaponType @0x28` (trajectory/gravity ride along), `m_missed`,
   `m_bulletLogicPos`, `m_weaponIndex`; creates the ClientBullet at the muzzle
   (`TryGetMuzzle`, `GetBulletPositionAndRotation`), visibility via
   `GetVisibleStyle(shooter)`.
2. `ClientBullet.Initiate(id, shooter, WeaponType prototype, visibleStyle,
   originalPosition, missed, chain…)` — the bullet keeps `m_prototype @0x48`
   and an `m_bulletEngine : AbstractBulletEngine @0x58` (family selected from
   the prototype's trajectory type).
3. `LCBulletTargeting.Initiate(Bullet)` — streams target position + the three
   durations + `onTarget` into the engine (`Targeting(...)`).
4. `LCBulletExplode.Initiate(Bullet, targetType)` — explosion point from
   `engine.GetExplosionPoint`; named weapon specials: `ThorBombWeaponId = 66`,
   `AlbatrossBombWeaponId = 166`.

## 7. Verdict and G10 impact

`m_bulletTrajectoryType` = **client engine selector** (7 families, §3);
`m_gravity` = **client arc input in field/100 units**; `accelerating` =
**arc-acceleration + guidance pairing**. The sim's own trajectory-relevant
semantics are the duration triple, `lowing`, `on_target/missed/target_precise_hit`
— all already structurally mirrored in the browser battle model, which today
flies every projectile on a linear `speed·dt` path (`game.js` `fireShell` →
`updateProjectiles`), artillery arcs purely cosmetic, and no arc model at all.

What converts **now** (structural, offline): per-family arc shapes + `gravity/100`
scaling + `accelerating` handling can be built as soon as R1 values arrive — the
schema keys are mapped (browser-comparison.md L62) and the family table is final.
What still needs the **.so** (numeric): arc height math
(`CalculateHeightCoefficients`), each engine's returned `EngineType` constant,
gravity read path in `EngineInitiate`, SelfDirected acceleration profile,
miss-flight distance math — all RVA-anchored in evidence PART 5 (392 methods),
so the future pass is a straight disassembly run, no re-search.

## 8. Implementation guidance (browser tribute)

* Keep the projectile struct render-only; the authoritative timing stays
  duration-driven. A future `trajectory` field on the weapon def (values from R1)
  should select among the seven families with Linear=0 as fallback.
* Gravity enters ONLY as `field / 100`; never interpret the raw short as m/s².
* `Melee` (5) means no projectile — matches the current instant-hit branch at
  `projectileSpeed === 0` only for melee-class weapons; ranged speed=0 is a
  separate semantic (already flagged in the audit row).
* Comment fold-in shipped at `fireShell`/`updateProjectiles` (provenance +
  family table pointer); cache-bumped v=56 → v=57 per §35.1.

## 9. Unknowns (RVA-anchored, blocked on libil2cpp.so re-acquisition)

1. Arc math: `CalculateHeightCoefficients` `0x80B2050`, `CalculateGravity` `0x80B25A8`,
   Leviathan overrides `0x80B5A18` (+ curve sampling in
   `CalculatePositionTime/CalculateAltitudeTime`).
2. `get_EngineType` returns per class (six one-liner reads at the §3 RVAs).
3. `EngineInitiate` gravity/accelerating read path (`0x80B1BC8` abstract base).
4. SelfDirected: `CalculateCurrentPositionAndVelocity` `0x80B7E40`,
   `TargetingCurveModeClear/NotClear` (clear-line-of-fire branch condition).
5. Miss flight: `LCBulletMissed.RetargetingBullet` `0x81429DC` +
   `MISSED_FLIGTH_DISTANCE`/`DURATION_TIME_SCALER` values.
6. Whether sim-side code reads `WeaponType.bulletTrajectoryType` at all (loose
   end for gameplay semantics like shooting over obstacles; the BL-xref pass
   would settle it in minutes once the .so is back).
