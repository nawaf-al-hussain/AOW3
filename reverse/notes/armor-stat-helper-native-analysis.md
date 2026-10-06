# Native analysis: ArmorStatHelper & the armor-damage surface (6.9.18)

Created: 2026-10-06 (follow-up to the FileUpload/AOW3 audit)
Resolves: `reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md` §C —
external `AttackCoeffCalculating` / `ARMOR_COEFF` claim. **Status after this note: RESOLVED (rejected as unsupported).**

## 1. Provenance of the binary analyzed

| Item | Value |
|---|---|
| Source XAPK | `Art-of-War-3_6.9.18_apkcombo.com.xapk` (repo root, LFS) |
| XAPK SHA-256 | `1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e` — byte-identical to the LFS OID committed in-repo |
| Library | `config.arm64_v8a.apk → lib/arm64-v8a/libil2cpp.so` |
| libil2cpp.so size | 164,646,104 bytes |
| libil2cpp.so SHA-256 | `8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5` |
| Game version | 6.9.18 (`com.geargames.aow`), same binary the in-repo `dump.cs` was produced from (Il2CppDumper 6.7.46, metadata v31) |
| Method | Capstone 5.0.7 ARM64 disassembly at file offsets from `dump.cs` `Offset:` fields; rodata float reads via ELF64 PT_LOAD vaddr mapping |
| Script | `reverse/tools/armor_native_analysis.py` (committed with this note) |

## 2. Question under investigation

External doc (`aow3_documentation/Combat_System.md`, 6.5.22-derived) claims a damage
formula `DamageAfterArmor = BaseDamage * ArmorCoeff(ArmorType, WeaponType)` with named
constants `AttackCoeffCalculating` / `ARMOR_COEFF`. Neither name exists in the 6.9.18
`dump.cs` (0 hits) nor in `stringliteral.json` (0 hits). Prior work recovered
`CalculateWeaponArmorDamage` with a 0.9/0.1 mitigation curve
(`reverse/notes/combat-stats.md` §1). Open question: **does any second, per-armor-type
coefficient multiplier exist outside that function?** `ArmorStatHelper` was the named
candidate location.

## 3. Findings

### 3.1 `ArmorStatHelper.GetArmorMeta(object, sbyte, ILogger)` — VA 0x7cb6b30, file 0x7cb2b30 (dump.cs:166712)

Pure **UI metadata mapper** in `com.geargames.aow.ugui.army.models.info`. Full body
(~0x150 bytes) contains **zero floating-point instructions and zero multiplications**.

```
and      w8, w1, #0xff
cmp      w8, #3
b.hs     <throw-helper 0x4f42e68>      ; type ∉ {0,1,2} → exception path
...
add      w23, w22, #0x2be              ; string enum id = type + 702 (display/icon name)
...
bl       0x7a2855c                     ; box enum (twice: 0x2bd sentinel, then w23)
bl       0x8db625c                     ; enum -> string (icon/label lookup)
...
add      w1, w22, #7                   ; EStat = type + 7  → 7/8/9
...
bl       0x65f378c                     ; construct ValueTuple<EStat,string>
```

Mapping: `ArmorType(0,1,2) → (EStat.ArmorLight/Medium/Heavy = 7/8/9, display string)`.
The string half is an enum-name/icon lookup — consistent with the only armor strings in
the binary (`ico_stat_base_armor_light/medium/heavy`, `ico_stat_unique_frontal_armor`).
**No damage math. No coefficient. The conflict file's explanation (1) — "inlined into
ArmorStatHelper" — is natively excluded.**

### 3.2 `MaxStatValueProvider.Get(float, EStat)` — VA 0x7cc176c, file 0x7cbd76c

Stat-routing gate (UI max-stat display, army-info layer):

```
sub      w8, w20, #0x3d                ; stat - 61
cmp      w8, #0xd                      ; in 61..74 ?
b.hi     <plain path>
mov      w9, #0x3807                   ; mask bits {0,1,2,11,12,13}
tst      w8, w9
b.eq     <plain path>
bl       0x7cc1c18                     ; → CalculateWeaponArmorDamage
```

Only six stats use the armor curve: **EStat 61–63 = `WeaponArmor{Light,Medium,Heavy}`,
72–74 = `WeaponSuperWeaponArmor{Light,Medium,Heavy}`** (names confirmed in the
`EStat` enum, dump.cs:168776). Everything else goes through the plain clamp `Calculate`.
After the curve: `fcmp s8, #1.0; b.le done` + logger path (display guard, not combat).

### 3.3 `MaxStatValueProvider.CalculateWeaponArmorDamage(float, EStat)` — VA 0x7cc1c18, file 0x7cbdc18

Re-verified against the raw binary. One `StatInfo` dictionary lookup
(`BaseMax` + optional `FirstMax`/`MegaMax`). **The only floating constants in the
function are:**

| Constant | Source | Raw bits |
|---|---|---|
| `0.1f` | `ldr s2, [x8, #0xb9c]` (page 0x1b09000 → rodata **0x1b09b9c**) | `0x3DCCCCD0` |
| `0.9f` | `ldr s1, [x8, #0x9f0]` (page 0x1b09000 → rodata **0x1b099f0**) | `0x3F666666` |
| `1.0f` | `fmov s2, #1.0` (immediate) | — |

Branch structure (matches `combat-stats.md` §1 exactly):

```
armor < ref : out = (dmg - armor) * 0.1 / (ref - armor) + 0.9
armor >= ref: out = 0.9 * (1 - 1/(1 + dmg/ref) + armor*(1/(1 + armor/ref))/armor)
```

**No switch on armor type. No per-armor-class coefficient table. No second multiplier.**

### 3.4 `GUIMainUpgradeHelperFunctions.WeaponDamage{Light,Medium,Heavy}Value(WeaponType)` — VA 0x7fcf14c / 0x7fcf1b8 / 0x7fcf224

Three byte-identical bodies differing only in the field offset:

```
ldr      w0, [x19, #0x28]   ; Light  — int damage-vs-light
ldr      w0, [x19, #0x2c]   ; Medium — int damage-vs-medium
ldr      w0, [x19, #0x30]   ; Heavy  — int damage-vs-heavy
ldrh     w8, [x19, #0x24]   ; layout tag
cmp      w8, #0x28          ; tag == 40 ?
b.ne     <ret>
ldrsb    w8, [x19, #0x6a]   ; int8 level scale
mul      w0, w0, w8         ; INTEGER multiply (weapon level scaling)
```

Confirms the counter-triangle triad (`combat-stats.md` §2, offsets 0x28/0x2c/0x30).
The only arithmetic is **integer** level scaling — not an armor coefficient.

### 3.5 `WeaponStatsFactory.GetDamageFor{L,M,H}Armor` + `GetSuperWeaponDamageFor{L,M,H}Armor` — VA 0x80f0964–0x80f09b4

All six are **16-byte tail-call thunks** with zero arithmetic:

```
ldr      x8, [x0, #0x20]
mov      x0, x1
mov      x1, x8
b        <builder>
```

The six builders (file 0x80e9dac / 0x80e9e50 / 0x80e9ef4 / 0x80e9f98 / 0x80ea03c / 0x80ea0e0)
are the same code with **only the baked EStat constant varying**:

```
Light → mov w4, #0x3d (61)   Medium → #0x3e (62)   Heavy → #0x3f (63)
SuperLight → #0x48 (72)      SuperMedium → #0x49 (73)   SuperHeavy → #0x4a (74)
```

i.e. generic `IStatModel` constructors parameterized by the `WeaponArmor*` stat id.
No constants beyond the enum id.

### 3.6 `MineStatsFactory.CreateDamageFor{L,M,H}Armor` — VA 0x7fe67ec / 0x7fe6860 / 0x7fe68d4

Identical wrappers: class-init guard → allocate stat-model (`bl 0x3cc7be4`) →
tail-delegate into the same builder family (`bl 0x80e94c0` / `0x80e9948` / `0x80e9038`)
with `(mine, max, prototype, null)`. Zero arithmetic.

## 4. Verdict

The 6.9.18 armor-damage surface is fully enumerated by metadata (every method whose
name touches armor+damage was disassembled — §3.1–3.6) and every path converges on:

1. **three per-armor-class integer damage fields** on the weapon (0x28/0x2c/0x30) — the counter-triangle;
2. **one shared mitigation curve** with constants 0.9/0.1 in `CalculateWeaponArmorDamage`;
3. integer weapon-level scaling.

**There is no `ArmorCoeff(ArmorType, WeaponType)` multiplier, no `ARMOR_COEFF`
constant, and no `AttackCoeffCalculating` symbol anywhere in the 6.9.18 binary
(metadata, string literals, or native code).** The external formula shape is a
doc-author simplification of the 0.9–0.1 mitigation curve (its output *looks like*
a per-armor coefficient when sampled), consistent with explanations (2)/(3) in the
conflict record; explanation (1) (rename/move into `ArmorStatHelper`) is excluded.

Classification of the external claim: **REJECTED** (formula shape unsupported;
6.5.22-era author inference; no authority over direct binary evidence).
No change to the browser implementation — the recovered 0.9/0.1 curve stands.

## 5. Scope & honesty notes

- All disassembly done at file offsets from `dump.cs` `Offset:` fields on the
  hash-verified 6.9.18 LFS binary; rodata addresses cross-checked against the
  constants recorded in `combat-stats.md` (0x1b09b9c/0x1b099f0) — both read back
  as 0.1f/0.9f exactly.
- BL targets outside the armor surface (il2cpp runtime helpers such as 0x3cc7948
  class-init, 0x3cc7be4 object-alloc, dictionary TryGetValue 0x7182c4c) were
  resolved by role from call-site context, not symbolically; none perform
  armor math (they are engine/alloc/lookup primitives).
- This analysis covers the *UI stat-display* pipeline (`models.info`) plus the
  stat-model factories; the live-sim hot path (tick-level damage application) is
  server/balance-side per prior conclusions and remains out of binary reach —
  unchanged by this note.
- Runtime validation of 6.5.22 claims remains impossible (no 6.5.22 binary in the
  collection — jadx output and metadata exports only).
