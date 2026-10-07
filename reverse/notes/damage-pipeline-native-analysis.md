# Native analysis: the damage pipeline beyond `CalculateWeaponArmorDamage` (6.9.18)

Created: 2026-10-07 (closes FileUpload/AOW3 audit-report "Recommended Next Investigations"
item #2: *Native analysis of `CreateDamageForMediumArmor` / `GetDamageForMediumArmor`
(completes the damage-pipeline reconstruction beyond `CalculateWeaponArmorDamage`)*).
Companion findings: MinePrice/71's consumer resolved in the same pass — recorded in
`reverse/notes/units/estat-stat-models.md` §6.7.

## 1. Provenance (same chain as all prior native notes)

| Item | Value |
|---|---|
| Source XAPK | `Art-of-War-3_6.9.18_apkcombo.com.xapk` (repo root, LFS), 270,599,286 bytes |
| XAPK SHA-256 | `1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e` — byte-identical to the LFS OID |
| Library | `config.arm64_v8a.apk → lib/arm64-v8a/libil2cpp.so`, 164,646,104 bytes |
| libil2cpp.so SHA-256 | `8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5` — matches `armor-stat-helper-native-analysis.md` §1 |
| Method | Capstone ARM64 disassembly at dump.cs RVAs; rodata float reads via ELF64 PT_LOAD mapping; whole-file BL xref (numpy) over 2,982,071 BL instructions; call-site attribution via a 150,721-method dump.cs index |
| Tools | `reverse/tools/damage_pipeline_native_analysis.py`, `mine_getkey_sweep.py`, `pipeline_followup_scan.py` |
| Evidence | `reverse/evidence/damage-pipeline/{damage-pipeline-native.txt, mine-capkey-sweep.txt, pipeline-xref-followup.txt}` |

## 2. Question under investigation

The armor note (`armor-stat-helper-native-analysis.md`) had verified the shared mitigation
curve (0.9/0.1, `MaxStatValueProvider.CalculateWeaponArmorDamage`, VA 0x7cc1c18) and the
six `GetDamageFor*/GetSuperWeaponDamageFor*` thunks as 16-byte tail-calls into generic
builders. What remained open for audit item #2:

1. What the builders actually construct (which stat-model class, which EStat key, which
   display ids) — the Medium path was never disassembled past the thunk;
2. How the per-armor-type damage ints on the prototype flow into
   `CalculateWeaponArmorDamage`'s `value` input;
3. Whether any other native code consumes the curve (i.e. is the UI display path the
   whole story);
4. The mine-side twin `MineStatsFactory.CreateDamageForMediumArmor` (dump.cs:17434).

## 3. Findings

### 3.1 Weapon leg — `WeaponDamage.CreateMediumDamage` builds the stat model directly

`WeaponStatsFactory.GetDamageForMediumArmor(WeaponType, IPrototypeModel)` (VA 0x80f0974)
is the known 16-byte thunk into `WeaponDamage.CreateMediumDamage` (VA 0x80ede50,
dump.cs:18906). The factory body (0xa4 bytes) is:

```
bl  0x3cc7be4              ; allocate WeaponDamage (class from static slot)
x5 = [static string slot]  ; m_statName literal (display key string)
x1 = weapon ; x2 = max ; x3 = owner
w4 = 0x3e                  ; EStat.WeaponArmorMedium = 62
w6 = 0x276                 ; display-name id 630
w7 = 0x2d0                 ; hint id 720
bl  0x80edba0              ; WeaponDamage..ctor(weapon, max, owner, type, statName, name, hint)
```

The complete six-factory constant table (each factory: exactly one native call site, all
inside `WeaponStatsFactory.<CreateStats>d__18.MoveNext` — see §3.5):

| Factory (VA) | EStat (w4) | name id (w6) | hint id (w7) |
|---|---|---|---|
| CreateLiteDamage (0x80eddac) | 61 `WeaponArmorLight` | 629 | 719 |
| CreateMediumDamage (0x80ede50) | 62 `WeaponArmorMedium` | 630 | 720 |
| CreateHeavyDamage (0x80edef4) | 63 `WeaponArmorHeavy` | 631 | 721 |
| CreateSuperWeaponLiteDamage (0x80edf98) | 72 `WeaponSuperWeaponArmorLight` | 629 | 719 |
| CreateSuperWeaponMediumDamage (0x80ee03c) | 73 `WeaponSuperWeaponArmorMedium` | 630 | 720 |
| CreateSuperWeaponHeavyDamage (0x80ee0e0) | 74 `WeaponSuperWeaponArmorHeavy` | 631 | 721 |

Super-weapon variants reuse the same display-name/hint ids as their regular counterparts —
only the EStat key differs. The name/hint ids (629–631, 719–721) are localization ids
resolved at construction time (hint built via the localization raw-string builder,
`bl 0x7a2855c` in the ctor).

### 3.2 `WeaponDamage..ctor` (VA 0x80edba0) — field layout and Values construction

Stores match the dump.cs field table exactly (dump.cs:18840-18854):
`weapon→0x10`, `max→0x18`, `statName→0x20`, `name(int)→0x28`, **`EStat type→0x40`**
(the `Stat` backing field), `owner→0x48`, hint string `→0x38`. `Values` (`0x30`) is built
as a fresh list containing an `IStatModel.StatValue` (ctor `0x80e87c4`) whose payload comes
from prototype-backed calls on the weapon object (interface dispatch at 0x80edd44) — i.e.
the per-armor damage int is captured into the stat model at construction time, not
re-read per frame.

Getter bodies, natively:

```
get_Stat      (0x80eda94): ldr w0, [x0, #0x40] ; ret        ; returns the baked EStat
get_Category  (0x80eda8c): mov w0, #1 ; ret                 ; EStatCategory.Base — constant
get_Values    (0x80eda7c): ldr x0, [x0, #0x30] ; ret
```

`get_Category = Base(1)` is a constant — every `WeaponDamage` stat displays in the Base
category regardless of which of the six keys it carries.

### 3.3 The value channels — `Calculate` vs `CalculateProgress`

**`WeaponDamage.Calculate(IStatModificationCollection)` (VA 0x80ee184)** performs three
interface dispatches on the modification collection (workshop modifications), keyed by
`(m_statName, m_weapon)` and `(class-token, m_weapon)`, then combines:

```
0x80ee37c: blr  x8            ; third modification-collection call → s0
0x80ee380: fcvtzs w9, s0      ; int(result)
0x80ee39c: cmp  w9, #0x28     ; threshold 40 (the same 0x28 layout-tag constant seen in
                              ; GUIMainUpgradeHelperFunctions.WeaponDamage*Value)
0x80ee3a4: fccmp s0, s1(#inf), #4, eq
0x80ee3a8: fmov s0, #1.0
0x80ee3ac: fcsel s0, s9, s0, ne
0x80ee3b0: fmul s0, s8, s0    ; final = accumulated × factor
```

i.e. the base value captured at construction is scaled by the weapon's active stat
modifications (the `#0x28`/`+inf` guard mirrors the level-scale tag logic of the UI
helpers). **No armor-type coefficient appears anywhere in `Calculate`.**

**`WeaponDamage.CalculateProgress(float)` (VA 0x80ee3c0)** loads `m_max` (`0x18`) and
`this.Stat` (`0x40`), then interface-tail-calls the max provider:

```
0x80ee408: ldr  w20, [x20, #0x40]   ; this.Stat (61..63 / 72..74)
...
0x80ee454: ldp  x3, x2, [x0]        ; resolve IMaxStatValueProvider.Get vtable slot
0x80ee458: mov  x0, x19             ; this = m_max
0x80ee45c: mov  w1, w20             ; stat key = own EStat
0x80ee468: fmov s0, s8              ; value
0x80ee470: br   x3                  ; tail: m_max.Get(value, ownStat)
```

So progress normalization goes through `MaxStatValueProvider.Get(value, EStat)` — the
function whose armor-keyed branch (61–63, 72–74) routes into the 0.9/0.1 curve
(`armor-stat-helper-native-analysis.md` §3.2) and whose other branch does the plain
`StatInfo {BaseMax, FirstMax?, MegaMax?}` tier clamp.

### 3.4 Mine leg — `MineStatsFactory.CreateDamageForMediumArmor` (VA 0x7fe6860)

Same shape as its Light/Heavy siblings (dump.cs:17431-17437): class-init guard → allocate
stat model (`bl 0x3cc7be4`) → tail-call `MineDamageForMediumArmorStat..ctor` (VA 0x80e9948)
with `(mine, max, prototype, null)`. Each mine stat ctor has exactly one native call site
(`pipeline-xref-followup.txt`):

| Factory (dump.cs) | Stat ctor | ctor call site |
|---|---|---|
| CreateDamageForLightArmor (0x7fe67ec) | MineDamageForLightArmorStat (0x80e94c0) | 0x7fe6848 |
| **CreateDamageForMediumArmor (0x7fe6860)** | **MineDamageForMediumArmorStat (0x80e9948)** | **0x7fe68bc** |
| CreateDamageForHeavyArmor (0x7fe68d4) | MineDamageForHeavyArmorStat (0x80e9038) | 0x7fe6930 |
| CreateCost (0x7fe6948) | MineCostStat (0x80e8bb0) | 0x7fe69a8 |
| CreateFireRate (0x7fe69c0) | MineSetTimeStat (0x80ea268) | 0x7fe6a20 |
| CreateRadius (0x7fe6a38) | MineExplosionRadiusStat (0x80e9dd0) | 0x7fe6a98 |

`MineDamageForMediumArmorStat` (dump.cs:18075-18131): `get_Stat` = `mov w0, #0x3e; ret`
(62, pinned in the EStat note §6.1); `Calculate(IStatModificationCollection)` (VA
0x80e9b10) is a thin adapter — loads `m_mine` (field 0x10) and tail-calls the modification
collection's interface method keyed by the mine prototype (`br x4` at 0x80e9bec); **the
damage value lives on the mine prototype / its balance data, modifications scale it**.
`CalculateProgress` (VA 0x80e9bf4) interface-tail-calls `m_max.Get(value, 62)` — the
same own-key pattern as the weapon leg (see the sweep in §3.5 of the EStat note and
`mine-capkey-sweep.txt`).

### 3.5 Xref — who consumes the mitigation curve (direct BL scan, 2.98M instructions)

| Target | Direct BL callers | Meaning |
|---|---|---|
| `MaxStatValueProvider.CalculateWeaponArmorDamage` (0x7cc1c18) | **1** — `MaxStatValueProvider.Get` (0x7cc1844) | the 0.9/0.1 curve is reachable **only** through `Get(value, EStat)`'s armor branch |
| `MaxStatValueProvider.Get` (0x7cc176c) | 0 direct | interface method — all real calls are vtable-dispatched (7 proven indirect sites: 6 mine `CalculateProgress` + `WeaponDamage.CalculateProgress`) |
| `WeaponDamage.Create*` (6 factories) | 1 each, all in `WeaponStatsFactory.<CreateStats>d__18.MoveNext` | the iterator materializes all six damage models per weapon |
| `WeaponStatsFactory.GetDamageForMediumArmor` (0x80f0974) | 0 direct | the C# wrapper was inlined into the iterator; the thunk is retained but uncalled |
| `MineStatsFactory.CreateDamageForMediumArmor` (0x7fe6860) | 1 — `MineStatsFactory.CreateList` | matches dump.cs:17422-17446 ordering |
| `ArmyWeaponItemInfoPresenter.SafeSetDamageStat` (0x7c6c474) | 0 direct | UI-presenter leg (below) |

**The UI stat-display pipeline is the only consumer surface of the armor curve in the
binary.** No live-sim code path reads `CalculateWeaponArmorDamage` directly — consistent
with the standing conclusion that tick-level damage application is balance/backend-side
(`armor-stat-helper-native-analysis.md` §5).

### 3.6 UI consumer leg — `SafeSetDamageStat` (ArmyWeaponItemInfoPresenter, TDI 4107)

`ArmyWeaponItemInfoPresenter.SafeSetDamageStat(IStatModificationCollection)` (VA
0x7c6c474, dump.cs:157676) resolves the weapon model's stat-model list and pushes the
damage stat into the view: a filter lambda
(`<SafeSetDamageStat>b__19_0`, VA 0x7c6d3d4 — interface type/property check on the
`IStatModel` to select the damage entry) plus a value accessor
(`<SafeSetDamageStat>b__1`, VA 0x7c6d4a4 — `Func<IStatModel,float>`), with view writes
performed through dispatched interface slots (`mov w2, #2/#3` slot resolves at
0x7c6cc0c/0x7c6cc8c). This is the army-info panel's damage row — display only, no math
beyond the shared `Get` path.

## 4. Verdict — the pipeline, end to end

The 6.9.18 damage pipeline is now reconstructed with native evidence at every hop:

```
balance ints on prototype (weapon 0x28/0x2c/0x30 triad; mine prototype payload)
        │  captured at construction
        ▼
WeaponDamage..ctor / MineDamageFor{L,M,H}ArmorStat..ctor      (§3.1-3.2, §3.4)
   Stat = EStat 61/62/63 (weapons), 72/73/74 (super), 61/62/63 (mine damage),
   66 (mine cost value channel), Category = Base(1)
        │  IStatModel.Values (StatValue list)
        ▼
WeaponDamage.Calculate / Mine*.Calculate                       (§3.3, §3.4)
   value × stat-modification collection (workshop mods), #0x28-level guard
        │
        ├─► UI: SafeSetDamageStat / GetParsedValue / icons    (§3.6)
        ▼
CalculateProgress(value) → IMaxStatValueProvider.Get(value, EStat)   (interface dispatch)
        │
        ├─ EStat 61-63, 72-74 → CalculateWeaponArmorDamage    (0.9/0.1 curve — sole consumer)
        └─ other keys          → StatInfo tier clamp (BaseMax/FirstMax?/MegaMax?)
```

Audit item #2's open question — "how the per-armor-type damage ints map to
`CalculateWeaponArmorDamage` inputs" — is answered: the ints are captured into the stat
model's `Values` at construction (§3.2), scaled by the modification collection in
`Calculate`, and the curve consumes the result as its `value` argument keyed by the same
EStat the factory baked in (62 for the Medium path). **No second damage formula, no
armor-type coefficient table, and no non-UI consumer of the curve exists in the binary.**
The Medium path is structurally identical to the already-verified Light path; the
0.9/0.1 curve and the counter-triangle int triad remain the only damage math.

Classification: audit item #2 **CLOSED (CONFIRMED, native)**.

## 5. Scope & honesty notes

- All disassembly at dump.cs RVAs on the hash-verified LFS binary; the 0.1f/0.9f rodata
  anchors re-read correctly before analysis (0x1b09b9c / 0x1b099f0).
- BL xrefs are *direct-call* scans. Interface-dispatched calls (the `br x3/x4` pattern)
  are invisible to them; where that mattered (callers of `MaxStatValueProvider.Get`,
  `get_Stat`, `get_Values`, `Calculate`) the gap was closed by targeted disassembly of
  the known dispatching bodies (mine/weapon `CalculateProgress`, §3.3/§3.4) — 7 indirect
  sites proven, not merely inferred.
- `WeaponDamage.Calculate`'s final combine (`fcvtzs; cmp #0x28; fccmp #inf; fcsel; fmul`)
  is quoted verbatim; the guard's *semantic* reading (level-scale tag interaction) is
  consistent with `GUIMainUpgradeHelperFunctions.WeaponDamage*Value` but was not
  independently confirmed at runtime.
- The static string slot feeding `m_statName` (factory `x5`) was not resolved to a
  literal value (requires metadata usage tables); it is the modification-collection lookup
  key, distinct from the display name id (629-631).
- SafeSetDamageStat's two lambdas were decoded structurally (filter + float accessor);
  individual instruction semantics are in the evidence file for review.
- Live-sim tick damage application remains balance/backend-side (unchanged conclusion).
