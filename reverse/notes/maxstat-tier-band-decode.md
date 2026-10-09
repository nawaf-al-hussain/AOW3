# MaxStatValueProvider.Get semantics + $Pg band dataflow (Build J)

# BUILD J (Task 52) — the two surfaces named by the Task 51 stage summary:
# (a) "MaxStatValueProvider tier thresholds (backlog b)" — the threshold VALUES were
#     already extracted natively (estat note §7, 72/78 entries, CONFIRMED); the open
#     residual was the CONSUMPTION side: the Get/Calculate/CalculateWeaponArmorDamage
#     bodies that turn those thresholds into the returned number. Both bodies are now
#     fully decoded, and they CORRECT the tribute's reading of the Get contract.
# (b) "the band dataflow (17 stores enumerated)" — all 19 stores to $Pg's band local
#     [sp+0x134] are now classified; the reset and the +1 composition are decoded to
#     constants; the remaining 3 writes are located in jump-table join arms.

Game: AOW3 6.9.18 (libil2cpp.so sha256 8ace05bb…, dump.cs sha256 0050e67d…,
global-metadata.dat sha256 d2e8dd0d…, obfuz-pool-values.json 697/697). Session
evidence: reverse/evidence/estat/estat-get-decode.txt (559 lines — the six method
bodies + caller scan + the §6.7 tail-call window), reverse/evidence/combat/
band-dataflow.txt (356 lines — backward slices for all 18 non-init stores),
band-dataflow-2.txt (join/predecessor windows, [sp+0x164] census, ctor xref),
band-dataflow-3.txt (dispatch-cluster disasm). Reused pipeline: dump.cs symbol map
→ VA → Capstone; numpy BL scan; obfuz-pool-values.json statics-offset lookups.

## Part 1 — MaxStatValueProvider.Get / Calculate / CalculateWeaponArmorDamage

Methods (dump.cs:168902 class block): StatInfo.Max1 0x7CC1640..0x7CC1650,
Max3 0x7CC1650..0x7CC16F0, Max2 0x7CC16F0..0x7CC176C, Get 0x7CC176C..0x7CC1A94
(slot 4), Calculate 0x7CC1A94..0x7CC1C18, CalculateWeaponArmorDamage
0x7CC1C18..0x7CC1D94.

### 1.1 Get = min(normalized fraction, 1.0) — the contract CORRECTED (CONFIRMED)

    Get(value /*s0*/, EStat statName /*w1*/):
      w8 = statName - 61; if (unsigned)w8 > 13            -> Calculate path
      if ((1 << (statName-61)) & 0x3807) == 0             -> Calculate path
      else s8 = CalculateWeaponArmorDamage(value, statName)
      joined tail (0x7cc1a4c): return Math.Min(s8, 1.0f)

0x3807 = bits {0,1,2,11,12,13} → stats {61,62,63,72,73,74} = the six weapon-armor
damage keys (WeaponArmorLight/Medium/Heavy + the three WeaponSuperWeaponArmor*
keys) — exactly the keys with the three-tier 300/4000/20000|55000 caps. **Get
returns a display-normalized FRACTION in [0,1], not the clamped value.** The
v=32 fold-in comment in game.js ("maxStatGet … clamp the value to the stat's tier
cap") describes a deliberate sim-domain adaptation, not the native contract; the
native Get is the stat-panel progress-bar fill fraction.

Over-max telemetry (CONFIRMED, display-only): when the computed fraction > 1.0 and
`CrpValueProvider.get_NeedLogStatWithOverMaxValue()` is set, Get builds a
ClientEventPairList (pairs: value as double; 0xBF = EStat.ToString(statName);
capped value as double), TryGetValue's the StatInfo (Dictionary helper 0x7182C4C,
out @sp+0x28), String.Format's the caps into a message and routes it through
GGParamsMapper.MapToGGParamsPairList to the logger (m_logger @this+0x18, vt
dispatch at [klass+0x138]). The RETURN value is unaffected (s8 is untouched by the
log block).

### 1.2 Calculate (non-armor stats) — piecewise bar-fill, constants CONFIRMED

    TryGetValue(m_statInfos, statName, &si); if !found -> return 0.0f
    s9 = si.BaseMax; s0 = Math.Max(0.0f, value)
    if neither tier present  -> return s0 / s9
    s1 = FirstMax ?? BaseMax ; s2 = MegaMax ?? BaseMax   (fcsel coalescing)
    v <= s1 (FirstMax)  -> return (v / FirstMax) * 0.8          [+0: movi d1,#0
    v <= s9 (BaseMax)   -> return (v-FirstMax)/(BaseMax-FirstMax) * 0.15 + 0.8
    v >  BaseMax        -> return (v-BaseMax)/(MegaAnchor-BaseMax) * 0.05 + 0.95

Literal-pool constants (extracted): K1 = 0.8 @0x1B09A88, K2 = 0.05 @0x1B099C4,
K3 = 0.95 @0x1B09B4C, K4 = 0.15 @0x1B09D58. The `movi d1, #0` at 0x7cc1bd4 zeroes
s1 (d1's low half) before the shared fadd — path A adds 0, not K1. The three
segments are CONTINUOUS: 0 → 0.8 across [0..FirstMax], 0.8 → 0.95 across
[FirstMax..BaseMax], 0.95 → 1.0 across [BaseMax..MegaMax]. For two-tier stats
(MegaMax null, MegaAnchor = BaseMax) the v > BaseMax arm divides by zero → ±inf →
Get's Math.Min clamps to 1.0 — values beyond the second rung fill the bar. The
path-C arm (v <= BaseMax after failing v <= FirstMax) is reachable only when
FirstMax < BaseMax — which the CORRECTED factory mapping below makes the norm.

### 1.3 CalculateWeaponArmorDamage (the six armor-damage keys) — the 0.9/0.1 split

    TryGetValue; if !found -> return 0.0f;  s9 = BaseMax; s0 = Math.Max(0, value)
    if neither tier present -> return s0 / s9              (no 0.9 scale)
    a = FirstMax ?? BaseMax
    v <= BaseMax:  return 0.9 * ( v/(a+v) + v/(BaseMax*(1+BaseMax/a)) )
    v >  BaseMax:  return 0.9 + (v-BaseMax)*0.1/(MegaMax ?? BaseMax - BaseMax)

Constants: KA = 0.9 @0x1B099F0, KM = 0.1 @0x1B09B9C. The lower segment is a smooth
saturating curve (0 at v=0, exactly 0.9 at v=BaseMax — the two terms sum to
v/(a+v) + a/(a+v) = 1 there), the upper segment linear 0.9 → 1.0 at MegaMax (two-
tier → div0 → inf → 1.0 via Get). **This is the native "0.9/0.1" pair** the armor
note §3.2 phrase pointed at: 90% of the bar covers [0..BaseMax], the last 10%
covers [BaseMax..MegaMax]. All six registered keys have all three tiers
(300/4000/20000 and 300/4000/55000), so a = FirstMax = 300 in practice.

### 1.4 StatInfo factory mapping CORRECTED + Nullable<float> binary layout

The Max factories are not identity-mapped (bodies disassembled):

    Max1(v)            -> BaseMax = v
    Max2(v1, v2)       -> FirstMax = Nullable(v1); BaseMax = v2; MegaMax = null
    Max3(v1, v2, v3)   -> FirstMax = Nullable(v1); BaseMax = v2; MegaMax = Nullable(v3)

(arg2 → BaseMax: Max3 stores s1 to [x19] at 0x7cc16cc; Max2 stores s8 = s1 to
[x19] at 0x7cc174c; both route arg1 through the Nullable ctor 0x5C34578 into
[x19+4] and Max3's arg3 into [x19+0xC].) Call-site verification from the .ctor
(0x7CC0C00..0x7CC1640; 7 Max3 + 6 Max2 + 59 Max1 sites — matching the 7 three-tier
and 6 two-tier + single-rung entries):

    Health : Max3(8000, 25000, 45000) -> FirstMax 8000, BaseMax 25000, MegaMax 45000
    Price  : Max2(1000, 2600)         -> FirstMax 1000, BaseMax 2600

Consequences:
- The estat §7 / v=32 TABLE VALUES are untouched — the literals and their ascending
  order are exactly as extracted. What changes is the native FIELD LABELS: the
  column the note called "BaseMax" is native FirstMax (the FIRST/lower rung), and
  the called "FirstMax" is native BaseMax (the middle rung). Max1 (single-rung)
  entries are labeled correctly. The tribute's tier ladder (tier0 -> rung1, tier1
  -> rung2, tier2/3 -> rung3, fallback down the chain) is numerically unaffected.
- The band-fill segments of §1.2 anchor as [0..FirstMax]→0.8, [FirstMax..BaseMax]
  →0.95, [BaseMax..MegaMax]→1.0 — with Health: 8000 / 25000 / 45000.
- **Nullable<float> in this binary is { bool hasValue @+0; float value @+4 }** —
  has-value FIRST (Calculate's presence tests read the low byte of each 8-byte
  block and take the value from the high word: `ldrb w8,[sp,#0xc]` /
  `lsr x9, x8, #0x20` over the out-struct at sp+8). Non-standard vs the C#
  {value, hasValue} order; matters for any future raw-struct reads.
- Hex correction to the Task 51 note: Value3/Value4 = 2197149770/2197149771 =
  **0x82F5D84A/0x82F5D84B** (the §1.2 hex "0x82E23D2A/B" was a typo; the decimals
  and XOR=1 were right). Pool re-check this build: statics+0xC = 0x82F5D84A,
  statics+0x10 = 0x82F5D84B.

### 1.5 Dispatch + consumer facts

- Get has **ZERO direct BL callers** binary-wide (numpy scan of every BL/B in all
  loadable segments) — consumers dispatch the IMaxStatValueProvider interface. The
  dispatch shape is the il2cpp interface-map walk (klass interface count at
  [klass+0x12E], interface table at [klass+0xB0], method pair at [klass+0x138]),
  confirmed at the pinned §6.7 site: MineCostStat.CalculateProgress tail-calls
  `m_max.Get(value, 71)` at 0x80e8f08 (`mov w1, #0x47` = MinePrice; `br x3`).
- Calculate/CalculateWeaponArmorDamage are called only from Get (direct-BL scan:
  1 site each). The StatInfo.Max* bodies are called only from the .ctor.
- Symbol-map quirk worth recording: the automated dump.cs map resolves
  0x7CC1640/0x7CC16F0/0x7CC1650 to "ArmyIcons.Max" (class-attribution slip in the
  regex pass); dump.cs itself binds those RVAs to MaxStatValueProvider.StatInfo.
  Max1/2/3. VA-level identity is not in doubt.

## Part 2 — $Pg band local [sp+0x134]: all 19 stores classified

### 2.1 Store census (backward register slices, band-dataflow.txt)

| # | site | classification |
|---|------|----------------|
| 0 | 0x483c3e4 | init: `str wzr, [sp, #0x134]` (the zero-init block) |
| 1 | 0x483c85c | spill/restore (self-read w24 -> str w24; survives a vt call) |
| 2 | **0x483d528** | **REAL WRITE: band = Value1 × Value2 = 0** (see 2.2) |
| 3 | **0x483eeac** | **REAL WRITE: band += Value3 ^ Value4 (= +1)** (see 2.2) |
| 4 | 0x483ffac | spill/restore (w23; survives the Coordinate-arm block) |
| 5 | 0x4840090 | spill/restore (w28; around the ctor call @0x4840068 → 0x4594ABC) |
| 6 | 0x48403bc | spill/restore (w19; around statics+0x180/0x184 loads) |
| 7 | 0x484074c | spill/restore (w24) |
| 8 | 0x4840bc8 | spill/restore (w20; before the [sp+0x138]/[sp+0x164] reloads) |
| 9 | 0x4842308 | spill (self-read at 0x4842234, carried across the cmp/b.ge arm) |
| 10 | 0x484236c | restore of #9's value (join @0x4842350, entered from 0x483e614/0x48422ec) |
| 11 | 0x4844558 | spill/restore (w25; survives vt[0x198] call + Value3/Value4 reload) |
| 12 | 0x4845258 | spill/restore (w28; around vt[0xC88]/vt[0xC68] pair calls) |
| 13 | 0x4845c84 | spill/restore (w28) |
| 14 | **0x48463e0** | **join-arm write** (see 2.3) |
| 15 | **0x4846440** | **join-arm write** (see 2.3) |
| 16 | 0x4846690 | spill/restore (self-read w10 -> str w10) |
| 17 | **0x484677c** | **join-arm write** (see 2.3) |
| 18 | 0x4846cb4 | spill (self-read w29 -> mov w8 -> str w8 across a restore) |

14 of 18 non-init stores are value-preserving spills — the band is a
callee-saved-worklocal hybrid that survives $Pg's call-heavy arms unchanged.

### 2.2 The two decoded real writes (CONFIRMED)

**Reset to zero** (0x483d528, inside the arm entered from the [sp+0xE0] null-check
block at 0x483d4e8):

    ldr  x8, [usage 0x968e4d8] ; holder klass
    ldr  x8, [x8, #0xb8]       ; static_fields
    ldp  w9, w8, [x8, #4]      ; Value1 (statics+0x4), Value2 (statics+0x8)
    mul  w8, w8, w9
    str  w8, [sp, #0x134]      ; band = Value1 * Value2

Pool decode: Value1 = 2603447459 (0x9B2D74A3), **Value2 = 0** → product = **0**.
The obfuscated zero: the band reset is expressed as a pool-product that provably
evaluates to 0 (idx2 = 0 in obfuz-pool-values.json). The same product is materialized
a second time to stack[0x38] at 0x4846410 (arm bookkeeping, not the band).

**+1 composition** (0x483eeac, immediately before the first $UG gate block — the
store the Task 51 note already tied to the leash argument): band = band +
(Value3 ^ Value4) = band + 1, with Value3/Value4 = 2197149770/2197149771
(0x82F5D84A/0x82F5D84B — hex corrected, see 1.4).

### 2.3 The three join-arm writes (structure CONFIRMED, sources bounded)

$Pg is a flattened-dispatch machine: arms end in `b 0x483c410` (the shared $gK
decrypt header) and the case blocks at 0x48463e0/0x4846440/0x484677c are reached
through the jump tables at 0x1B0Fxxxx (x20 = 0x1B0FAF0 built beside them) or via
compare-gates (the only direct branch into the cluster: `b.eq 0x48466e8` at
0x4840818). The three writes carry predecessor-arm register-dance values into the
band:

- #14 (0x48463e0): `mov w20, w23` (0x4846388) -> `str w20` — w23 arrives through the
  x22/x23/x25/x26/x29 shuffle that follows the 5-arg call at 0x4846360 (→ 0x47C4F68,
  sym "SideAct.oF"; args include w2 = holder statics+0x34 and w3 = Value3^Value4
  = 1). statics+0x34 = **2** (pool idx13) — if the dance carries that value,
  band = 2 here (INFERRED; the dance spans >200 instructions across dispatch arms).
- #15 (0x4846440): `mov w21, w9` (0x48463ec, a jump-table target) -> `str w21`; the
  same block computes the Value1×Value2 product into stack[0x38].
- #17 (0x484677c): `mov w21, w20` (0x48466f8) -> `str w21` — entered from the
  parity gate at 0x4840814: `tst (Value3^Value4=1), ([x25+0x10] + vt[0x1018] result)`
  → `b.eq 0x48466e8` when the sum is EVEN (obfuscated parity branch; the band rides
  through unchanged on this arm — w20/w21 swap dance).

Callsite census (numpy BL scan inside $Pg, re-verified): **$UG ×3**
(0x483f014, 0x483fef0, 0x4840e0c), **$yG ×3** (0x483e3d4, 0x4846108, 0x48461e0),
**$bh ×0** direct (the Task 51 $bh call lives inside $UG's terminal case). Every
$yG site builds `w2 = band + (Value3^Value4)` inline (0x4846104/0x48461dc shown in
full; 0x483e3b8 area in Task 51 evidence) — **$yG(Battle, Unit, band + 1)**.

Second obfuscated bit-test pattern (0x484621c-38, preceding the $yG cluster):
`w10 = (Value@statics+0x30 + 0xCB5E3C38) & (Value3^Value4)`; `w10 = 1 << w10`;
`tst w10, sxtb(vt result)`. Pool: statics+0x30 = 883016679 (0x34A1C3E7);
0x34A1C3E7 + 0xCB5E3C38 = 0x1_0000001F → &1 = 1 → shift = 2 → the test is
**`(vt result) & 2 != 0`** — a constant-bit probe on a getter result, same
constant-obfuscation grammar as the XOR pair.

### 2.4 Where this leaves the leash VALUE

The band lifecycle is: init 0 → arms run (14 spills preserve it; the reset arm
proves it returns to 0 between scenarios) → the join arms may load small constants
(statics+0x34 = 2 candidate) → every $UG/$yG consumer adds the XOR-pair 1. Observed
band values therefore ∈ {0, 2, arm-carried} → leash argument ∈ {1, 3, …} — small
integers consistent with a tether measured in the coordinate unit the defense act
uses. The exact per-arm values stay a bounded residual (MEDIUM): the flattened
dispatch means the three join sources are register-file state at indirect-jump
time; fully pinning them needs the jump-table case map, out of scope here. The
tribute's DEFEND_TETHER = 4 remains gameplay-tuned with no behavioral delta
established; what Build J adds is that the native leash is band+1 with band
client-computed from {0-reset, pool constants ≤ small ints, arm-carried state} —
no server data at any point in the chain.

## 3. Tribute impact (no code change — fold-in candidates for the next
implementation task)

1. game.js `AOW3_MAX_STAT_TIERS` header comment: correct the column labels
   (native field names FirstMax/BaseMax are swapped relative to the comment's
   "BaseMax=first rung" reading; Max1 entries unaffected), and replace
   "maxStatGet … clamp the value to the stat's tier cap" with the native contract
   (piecewise fraction in [0,1]: 0.8/0.15/0.05 non-armor, 0.9/0.1 saturating
   armor-damage keys; unregistered → v/BaseMax; Get = min(fraction, 1.0)). The
   tribute's maxStatGet stays as the sim-domain adaptation, now correctly labeled.
2. game.js DEFEND_TETHER (line 167) provenance note: append the Build J citation
   (band lifecycle decoded; leash = band+1, band ∈ {0, 2, arm-carried}).
3. reverse/notes/units/estat-stat-models.md §7: superseded by §8 (appended this
   build) — same content as (1) plus the Nullable layout note.

AOW3_VFX_TAXONOMY untouched. Tests: none (no code change).

## Verdict

- CONFIRMED (native, disassembly + literal extraction): Get's routing bitmask
  0x3807 → {61,62,63,72,73,74} and min(·,1.0) tail; Calculate's piecewise with
  constants 0.8/0.15/0.05/0.95 and the coalesce fallbacks; the armor curve
  v/(a+v)+v/(B(1+B/a)) with 0.9/0.1; the Max1/2/3 factory mapping (arg2 → BaseMax);
  the Nullable<float> {hasValue@+0, value@+4} layout; the Health/Price call-site
  assignments; the zero direct-BL callers of Get and the interface-walk dispatch
  shape at 0x80e8f08; the band reset (Value1×Value2 = 0 with pool idx2 = 0); the
  band +1 composition; 14/18 non-init stores classified as value-preserving spills;
  the $UG×3/$yG×3/$bh×0 callsite census; the (result & 2) obfuscated bit-test.
- CORRECTED: "Get clamps the value to the stat's tier cap" (v=32 game.js comment)
  → Get returns a normalized fraction; estat §7 column labels BaseMax↔FirstMax for
  Max2/Max3 entries; Task 51 note's Value3/Value4 hex (0x82E23D2A/B → 0x82F5D84A/B).
- MEDIUM/INFERRED (bounded residuals): the three join-arm band sources (mechanism
  confirmed: jump-table dispatch + register dance; statics+0x34 = 2 candidate for
  #14), the full per-case semantics of the $UG/$yG chain terminals, the 5-arg call
  0x47C4F68's identity ("SideAct.oF" per the automated map, unverified at dump.cs
  level).
