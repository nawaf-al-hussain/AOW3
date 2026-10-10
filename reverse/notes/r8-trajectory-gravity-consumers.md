# RE note: R8 — trajectory-type / gravity consumers (6.9.18)

Created: 2026-10-10 (offline structural pass). Updated 2026-10-10: **numeric .so
pass appended (§10)** — arc/gravity math decoded from libil2cpp.so `8ace05bb…`.
Registry `R8` ("m_bulletTrajectoryType / m_gravity consumer semantics", converts
gap `G10`). Companion to `weapon-type-surface-native-analysis.md` (WeaponType
combat surface), `data-model-extraction.md` (weapon-schema.json) and
`r1-prototype-data-pipeline.md` (per-weapon value keys). Evidence:
`reverse/evidence/combat/trajectory-gravity-consumer-scan.txt` (5 parts, 1,142
lines, structural) and `reverse/evidence/combat/r8-numeric-arc-decode.txt`
(4,147 lines, numeric: 30 functions disassembled + whole-binary BL xref,
tool `reverse/tools/r8_numeric_arc_decode.py`).

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
| 6 | `AdjustableBallisticBulletEngine` | **CORRECTED by the numeric pass**: the enum slot `UpAndSelfDirected = 6` IS this class — `get_EngineType` (0x80B2B30) returns **6**, not 1. Mid-flight retarget + up-phase then self-directed homing; sim-side `Bullet.get_AccelerateAndGuide` (0x458FD60) is literally `trajectoryType == 6`. The structural pass's "no dedicated class — open residual" is RESOLVED. |
| — | `LeviaphanNuclearRocketBallisticBulletEngine` (subclass of 2) | hero special: `m_positionCurve`/`m_heightCurve` AnimationCurves, `m_min/maxDistanceGravityDivider` ([Min(0.5)]/[Min(1)]), overrides `CalculateGravity/CalculatePositionTime/CalculateAltitudeTime`, `GetClamped01Time` |

Every engine exposes `abstract sbyte EngineType` — numeric pass confirmed all six
one-instruction getters (§10.A): Ballistic `mov w0,#1` @0x80B3558, BallisticHigh
`mov w0,#2` @0x80B36EC, Linear `mov w0,wzr` @0x80B5CAC, SelfDirected `mov w0,#3`
@0x80B6A80, ChainLighting `mov w0,#4` @0x80B4FDC, Adjustable `mov w0,#6`
@0x80B2B30.

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

## 7. Numeric pass — all structural-pass unknowns resolved (libil2cpp.so 8ace05bb…, tool r8_numeric_arc_decode.py)

All structural-pass unknowns (the retired §9 list: arc math, engine ids,
EngineInitiate path, SelfDirected profile, miss-flight values, sim-side field
readers) resolved. Full verbatim
disassembly: evidence `r8-numeric-arc-decode.txt` (4,147 lines). Summary:

**A. Engine family ids [DECOMP]** — six one-instruction getters: Linear 0
(`mov w0,wzr`), Ballistic 1, BallisticHigh 2, SelfDirected 3, ChainLighting 4,
**Adjustable 6** — see §3 correction. No other engine class exists, so the
`UpAndSelfDirected` enum label and `AdjustableBallisticBulletEngine` are the same
slot: guided up-then-homing shells.

**B. Gravity read path [DECOMP]** — `CalculateGravity` 0x80B25A8:
`owner = this+0x20; prototype = owner+0x48; g = (short)prototype.gravity(@0xA0) / 100.0f`
with the divider **inlined as `mov w8, #0x42C80000`** (not a rodata load); null
paths throw through 0x3CC7BF4. Runtime offset 0xA0 re-confirmed in code.

**C. The arc law [DECOMP]** — `CalculateHeightCoefficients(duration)` 0x80B2050
stores (V1 = virtual call via vtbl+0x238 = `CalculateGravity`):
```
k    = duration / 200.0f          -> m_pc @0x8C
m_pa = -0.5f * g                  -> @0x84
m_pb = 0.5f * g * k*k             -> @0x88
```
`CalculateAltitudeTime(t)` 0x80B2604 = `t / 100.0f`.
`CalculateCurrentPosition` 0x80B2200 (base) then computes, per client tick:
```
t̂   = clamp(elapsed / m_duration, 0, 1)        (m_duration @0x58)
xz  = lerp(originalPosition, targetPosition, t̂)
alt = elapsed / 100
y   = lerpY + m_pa*(alt − m_pc)² + m_pb        (apex at alt == m_pc)
MaxPositionY @0xA4 = running max of y          (apex tracker)
m_prevPosition @0x94 / m_prevElapsedTime @0xA0 updated only when the squared
  displacement ≥ MIN_MOVE_SQR = 1e-6f (rodata 0x1B09CBC) — idle-tick gate
```
Substituting the coefficients gives the **closed-form arc**:
`height(t) = 0.5·g·(k² − (t/100 − k)²)`, `k = duration/200` —
`h(0) = 0`, `h(duration) = 0`, **apex exactly at t = duration/2 with height
`0.5·g·k²`**. The parabola is fully determined by (gravity, duration); with the
launch/target lerp this is the complete base-ballistic flight render model.

`CalculatePositionTime(t)` 0x80B25DC (accelerating-path progress evaluator):
`T(t) / (2·T(m_duration))` with `T(n) = n(n+1)/2` (triangular) — a quadratic
easing over twice m_duration; consumed via the m_accelerating branch
(vtbl+0x248) of CalculateCurrentPosition when `m_accelerating @0x90` is set.
`EngineInitiate` 0x80B1BC8: `m_offsetTargetPosition @0x78 =
statics[0x9674DE0].fields[+0x18..+0x20] × 0.2f` (rodata 0x1B09B48 = 0.2f).

**D. Leviathan hero variant [DECOMP]** — `CalculateGravity` 0x80B5A18 calls the
base then interpolates the gravity divider from two WeaponType virtual getters
(vtbl+0x378/+0x358) plus target/curve state ([owner+0x58] floats) — the
`m_min/maxDistanceGravityDivider` distance-interpolated arc; curve samplers
0x80B5BBC/0x80B5BF4 + `GetClamped01Time` 0x80B5BE4 verbatim in evidence.

**E. SelfDirected [DECOMP]** — `CalculateCurrentPositionAndVelocity` 0x80B7E40:
normalizes `t̂ = millisecs / duration` then evaluates the Hermite-style
polynomial over the pos0/1/2 + vel0/1/2 buffers (vector fmul/fadd chain verbatim
in evidence); `MissTargeting` 0x80B7E28, `SetCurrentPositionAndVelocity`
0x80B7A98, curve-mode branches `TargetingCurveModeClear` 0x80B6D24 /
`NotClear` 0x80B6FC4.

**F. Miss flight [DECOMP + SERVER-DATA]** — `LCBulletMissed.RetargetingBullet`
0x81429DC scales the miss direction vector by `MISSED_FLIGTH_DISTANCE`
(float instance field @0x20) and the flight time by `DURATION_TIME_SCALER`
(int instance field @0x1C). dump.cs:290068-9 shows both are **instance fields,
not constants** — the values ride the server payload (R1/session-bound); the
browser cannot obtain them offline.

**G. Sim-side readers [DECOMP + NEGATIVE]** — `Bullet.get_AccelerateAndGuide`
0x458FD60 is a 6-instruction predicate: `return (sbyte)we_type.bulletTrajectoryType(@0x9E) == 6`
(guided family), i.e. the sim DOES consume the trajectory field directly
(inlined field load — consistent with the whole-binary BL xref finding **zero**
BL callers for get_BulletTrajectoryType/get_Gravity/get_Accelerating across
41,649,815 scanned words). Trajectory semantics: family 6 = accelerate+guide
(mid-flight retarget); gravity has no sim-side reader — it is purely the client
arc input; sim timing stays the duration triple (§5).

## 8. Verdict and G10 impact (updated by the numeric pass)

`m_bulletTrajectoryType` = **client engine selector** (6 engine classes over 7
enum slots; slot 6 IS Adjustable — §7.A); `m_gravity` = **client arc input in
field/100 units**; `accelerating` = **arc-acceleration + guidance pairing**
(sim predicate: trajectory == 6). The sim's own trajectory-relevant semantics
are the duration triple, `lowing`, `on_target/missed/target_precise_hit` —
already structurally mirrored in the browser battle model, which today flies
every projectile on a linear `speed·dt` path (`game.js` `fireShell` →
`updateProjectiles`).

The **arc math is now fully decoded** (§7.C): base-ballistic height is the
closed-form parabola `0.5·g·(k² − (t/100 − k)²)`, `g = gravity/100`,
`k = duration/200` — determined by exactly two inputs, the per-weapon gravity
value (R1-bound balance data) and the flight duration the sim already streams.
Nothing else blocks an authentic browser arc model: when R1 values land, the
renderer adopts the closed form per family (Linear = no arc, SelfDirected =
Hermite on pos/vel buffers, Adjustable = retargeting variant) with zero further
RE. Residuals are server-data values (per-weapon gravity/trajectory/accelerating
rows; miss-flight MISSED_FLIGTH_DISTANCE/DURATION_TIME_SCALER) — all R1-session
carryable.

## 9. Implementation guidance (browser tribute, updated)

* Keep the projectile struct render-only; the authoritative timing stays
  duration-driven. A future `trajectory` field on the weapon def (values from R1)
  selects among the engine families with Linear=0 as fallback.
* Gravity enters ONLY as `field / 100`; never interpret the raw short as m/s².
* Base-ballistic arc (families 1/2): `height(t) = 0.5·g·(k² − (t/100−k)²)`,
  `k = duration/200` — zero at both ends, apex `0.5·g·k²` at `t = duration/2`;
  X/Z progress is a plain lerp over `duration` (accelerating shells swap in the
  triangular-number easing `T(t)/(2·T(duration))`).
* SelfDirected (3): Hermite-style evaluation on `t̂ = millisecs/duration` over
  the pos0/1/2 + vel0/1/2 buffers; Adjustable (6): same plus mid-flight
  retargeting (`m_originalStartTime`, `TryGetBulletMagnetPosition`).
* `Melee` (5) means no projectile — matches the current instant-hit branch at
  `projectileSpeed === 0` only for melee-class weapons; ranged speed=0 is a
  separate semantic (already flagged in the audit row).
* Comment fold-in shipped at `fireShell`/`updateProjectiles` (provenance +
  family table + closed-form law); cache-bumped v=61 → v=62 per §35.1
  (comment-only, zero behavior delta).
