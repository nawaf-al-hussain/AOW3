# Defend-chase ($Pg) branch enumeration + TakePositions cell-class decode (Build I)

# BUILD I (Task 51) — the two open RE surfaces named by the Task 38 stage summary,
# now decodable because R2 (Task 42) delivered the 697/697 pool. Supersedes
# pg-leash-native.txt §3's "UnitAct statics / per-scenario balance data" reading
# (the class has zero static fields and the XOR pair decodes to 1). No code change.

Game: AOW3 6.9.18 (libil2cpp.so sha256 8ace05bb…, dump.cs sha256 0050e67d…,
global-metadata.dat sha256 d2e8dd0d…, obfuz-pool-values.json 697/697 re-validated
this build: canary PASS + pool idx0 re-derivation PASS from the R2-pinned segment).
Session evidence: reverse/evidence/combat/pg-branches-decode.txt (2,027 lines) and
takepos-cells-decode.txt (434 lines). Reused pipeline: dump.cs symbol map → VA →
Capstone; numpy word-scan for usage-slot sites; Unicorn re-execution of $GOA/$kK
(obfuz_static_decode.py machinery).

## Part 1 — the defend-chase act $Pg (UnitAct, 0x483C244..0x48470D0, 11,171 ins)

### 1.1 Zero in-machine decision constants (CONFIRMED, re-verified at full coverage)

$Pg contains exactly ONE cmp-with-immediate above #1 (the 0x116 IL2CPP class-init
check) — every decision constant is fetched at runtime: either from
`$Obfuz$ConstFieldHolder$0` statics (metadata usage slot @0x968e4d8 → klass →
static_fields) or via live `$gK` decrypts from the holder's segment byte[] at
statics+0x2820. 3,844 binary-wide references to that usage slot; top consumers:
$Pg (509), PathAct.$Te (347), UnitAct.$CG (339), FlightAct.$Kd (211), Battle.$HL (122).

### 1.2 The leash composition — corrected and decoded (CONFIRMED)

The three $UG (0x481ED28) and three $yG (0x480CB44) callsites compose their int
argument at 0x483EFF8/0x483E3B8 (and two more sites, 4 total):

    ldr  x0, [usage 0x968e4d8]   ; $Obfuz$ConstFieldHolder$0 klass
    ldr  x8, [x0, #0xb8]         ; static_fields
    ldp  w9, w8, [x8, #0xc]      ; Value3, Value4
    eor  w8, w8, w9              ; Value3 ^ Value4
    ldr  w9, [sp, #0x134]        ; band local
    add  w2, w8, w9              ; leash_arg = band + (Value3 ^ Value4)

Pool decode: **statics+0xC = Value3 = 2197149770 (0x82E23D2A), statics+0x10 =
Value4 = 2197149771 (0x82E23D2B) → Value3 ^ Value4 = 1.** The leash argument is
`band + 1` — the XOR pair is constant-obfuscation noise, NOT per-scenario balance
data. The prior reading ("two UnitAct static fields, server-side balance") is
wrong on both counts: UnitAct has zero static fields (dump.cs:427991 — only the
const sbytes $Vm/$wm/$Wm), and the values are pool constants. The leash VALUE is
therefore client-computed: band (local [sp+0x134], zero-inited at 0x483c3e4,
19 stores total — computations + register spills + the +1 composition at
0x483eeac immediately before the first $UG call).

### 1.3 The flag_shoot gate inline (CONFIRMED)

Immediately before the first $UG call: `ldr w10, [holder+0x374]` (= −1 =
FLAG_SHOOT_FREE) `cmp w10, w24, sxth; b.ne 0x4842f58` — the defend-chase gate
only runs while the unit's FlagShoot byte == −1 (free). Same-sentinel semantics
as the R2/DontShoot decode, now observed inline in $Pg.

### 1.4 The 8 live-pool constants (CONFIRMED values; INFERRED field identity)

$Pg decrypts eight constants LIVE from the holder's segment byte[] at
statics+0x2820 (`ldr x0, [holder_statics+0x2820]; mov w1,#start; mov w2,#keyA;
mov w3,#salt; bl $gK 0x5265B74` with the VM singleton in x4). These are NOT in
the 697-record .cctor inventory (they are never materialized into holder statics).
The segment's fdv block was located by grid scan on the R2 0x808-stride layout
(anchors 0xDBFC10/0xDC0418): **fdv 0xDBDBF0 (stride −4), CBC keys
0xC1A1C8CC/0x44A79BB9** — the scan hit 8/8 small values and the whole pipeline
was validated by re-deriving pool idx0 and the $qk canary first.

| seg word | keyA | salt | value | sites | semantics |
| --- | --- | --- | --- | --- | --- |
| 0x698 | 0x16 | 0xdabd7bca | **73** | 0x4843094 | UnitType id 73 = BEHOLDER (INFERRED) |
| 0x69c | 0x11 | 0x2927ab7e | **5** | 0x4843504 | UnitTaskType.BOMBARD (CONFIRMED) |
| 0x6a0 | 0x3d | 0x27428cbf | **2** | 0x4846ffc | UnitTaskType.DEFEND (CONFIRMED) |
| 0x6a4 | 0x16 | 0xdabd7bca | **73** | 0x4842a7c | BEHOLDER id check |
| 0x6a8 | 0x3d | 0x27428cbf | **2** | 0x483c7c4 | DEFEND |
| 0x6ac | 0x3d | 0x27428cbf | **2** | 0x4841160 | DEFEND |
| 0x6b0 | 0x11 | 0x2927ab7e | **5** | 0x483dbc4 | BOMBARD |
| 0x6b4 | 0x16 | 0xdabd7bca | **73** | 0x4844dfc | BEHOLDER id check |

The task-id rows are CONFIRMED against the UnitTaskType enum (dump.cs:395395:
NONE 0 … DEFEND 2 … BOMBARD 5 … DONT_SHOOT 8, BERSERK 11). The 73-sites are
`cmp w0, w-reg, sxtb` byte compares — the same byte-width and numbering the
takepos hero partition uses for unit-type ids (Part 2), and 73 = UNIT_ID_BEHOLDER
in the committed id map — hence INFERRED (field identity), CONFIRMED (compare).
So the defend-chase act branches on task == DEFEND / task == BOMBARD and on
unitType == 73 (Beholder-specific defend behavior).

### 1.5 $UG / $yG are selector-flattened dispatchers (CONFIRMED)

$UG is a 148-case jump table (@0x1B0F4EE, base 0x481EEA0) on holder
statics+0x24C = **Value139 = 119** (constant) → chain
**119 → 42 → 132 → 124 → 7 → 67** (selectors = pool values at statics
0x8bc/0x9e0/0x9c0/0x60/0x910) → terminal 0x481faf0:
- vt-chain fetch (vt[0x16e8]→[0x1a8]→[0x208]→[0x198]) → w21;
- `cmp w29, w21; cset w10, gt; w9 = Value1×Value2 (= 0); cset w9, eq (0 == gt)`
  — obfuscated boolean algebra on the product-vs-comparison flag;
- `leash − (Value3^Value4)` (= band) passed to 0x59AD48C (List`1.get_Item shared
  thunk — container indexing, not domain logic);
- **$bh(Battle, Unit, int, Dynamic) → bool** (0x4870C68) called with the raw
  leash argument — the leash comparison helper.
Case 119's own gate: `w9 = Value1×Value2 = 0; cmp w9, arg; b.ge 0x482280c` — a
non-positive leash argument short-circuits.

$yG is a 37-case table (@0x1B0F1B2, base 0x480CC88) on holder statics+0x10C =
**Value59 = 28** → handler 0x480d4e4 → re-dispatch via statics+0x50 (Value32).
$yG = `protected internal static void $yG(Battle, Unit, int)` — the reposition
toward the defend anchor; $Pg calls it at 3 sites with the same band+1 argument.

### 1.6 Residual (bounded)

The band's own formula: [sp+0x134] has 19 stores — init 0, the +1 composition,
register spills, and the actual computations at 0x483c85c / 0x483d528 /
0x4840090 / 0x48403bc / 0x484074c / 0x4840bc8 / 0x4842308 / 0x484236c /
0x4844558 / 0x4845258 / 0x4845c84 / 0x48463e0 / 0x4846440 / 0x4846690 /
0x484677c / 0x4846cb4 (all context-dumped in the evidence file). Untangling the
dataflow (likely distance(unit, defend-anchor) arithmetic around the Coordinate
ctor at 0x4840068) is the next bounded step; until then the leash VALUE stays
"band + 1, band = computed local".

## Part 2 — UnitTakePositionsManager cell-class masks (client class, non-Obfuz)

### 2.1 The three static masks (CONFIRMED — .cctor 0x81D4DF4)

One 32-bit store + one halfword store:
- `m_occupancyMaskAll` (statics+0x0) = **0x215F**
- `m_occupancyMaskHelicopterBehaviour` (statics+0x2) = **0xFEE0**
- `m_occupancyMaskLand` (statics+0x4) = **0xFEFD**

### 2.2 CellsMask = AND-reduce clamped to 15 bits (CONFIRMED — 0x81D4780)

`CalculateCellsMask()` folds `m_aliveNotSendedUnits`: per unit
`isHero(typeobj.vt[0x1f8]) ? GetHeroUnitOccupancyMask(u) : GetUnitOccupancyMask(u)`,
ANDs them into `w22` initialized to **0x7FFF** (the explicit 15-bit clamp behind
the "15-bit cell-class" phrase), and stores the halfword to `m_cellsMask`
(this+0x18; the `get_CellsMask` ldrh). In-binary consumers: Update() is the only
caller of CalculateCellsMask; SendNearestUnitToCell is called from
GHUnitTakePositions.OnBattleMapClick; get_CellsMask has ZERO direct BL callers —
the mask is computed and exposed, not read by other binary code.

### 2.3 Per-unit mask arms (CONFIRMED)

GetUnitOccupancyMask (0x81D43BC) — base = MaskAll, switch on
`(sbyte) typeobj.vt[0x288]` (vtable slot 21):
- 0 / default → MaskAll (0x215F)
- 1 → MaskLand; bit 2 additionally cleared when `vt[0x348]` (slot 33) == 2
- 2 → MaskLand (0x215F & 0xFEFD = 0x215D)
- 3 → `ClientUnitHelper.IsHelicopterBehaviour(unit)` ? HelicopterBehaviour
      (& 0xFEE0) : MaskAll
- 4 → MaskAll & (unitTypeId == 42 ? 0xE5 : 0xEF)  [unitTypeId via vt[0x4d8], slot 58]

GetHeroUnitOccupancyMask (0x81D4568) — base = MaskAll, on the hero unit-type id:
- {64, 65, 70, 71, 73, 75, 76} (bitmask 0x6A1C) → MaskLand
- {63, 72} (0x502 residue) → HelicopterBehaviour
- {62, 74} (0x1001) → MaskAll & 0xFFE5 = 0x2145
- id 60 → MaskLand; id 61 → dedicated arm @0x81D4718; anything else →
  error/reporting arm (ClientEventPairList ctor path)

Naming (unit-type-ids.json): 70 COMMANDO, 71 SERAPHIM, 72 SOLARIS, 73 BEHOLDER,
74 PSI_TANK, 75 ATLAS — SOLARIS (72) in the helicopter arm matches its flying
behavior; the rest of 60–76 and id 42 are not in the committed 43-entry map.

### 2.4 Per-bit meaning (RESOLVED by Task 59 — see r6-bitname-crossref.md)

~~Bits 0..14 index cell classes; the mask consumer chain that would name them
(cell-class enum or terrain table → bit index) is not reachable from this class.~~
Task 59 located the bit space in **ClientBattleCell.m_passMask** (the mask
`CheckByMask` tests): 13/15 bits named by in-binary consts (Barrier, Land,
Forest, Shore, Water, Fog, Dark, Building, BuildingBand, BuildingBarrier,
VisAndInvisUnit, VisAndInvisEnemyUnit, CameraInvisible), bits 7/14 reserved;
`CheckByMask(mask) == ((mask & m_passMask) == 0)` — the takepos masks are
BLOCKED-state masks. Full table + writers + corrections:
`r6-bitname-crossref.md`. The takepos model itself is unchanged.

## 3. Tribute impact (no code change)

The browser defend model documents `DEFEND_TETHER = 4` (game.js:167) as
"recoverable from the APK (server-delivered), tether is gameplay-tuned". Build I
corrects the provenance: the native leash is CLIENT-computed —
`band + (Value3^Value4 = 1)` with the band a computed local; no server data is
involved. Fold-in candidate for the next implementation task (comment-only,
value untouched): replace the provenance note with the Build I citation and the
band-formula residual. No behavioral delta is established (the band formula is
undecoded), so no numeric change lands. AOW3_VFX_TAXONOMY untouched.

## Verdict

- CONFIRMED: $Pg's constant provenance (holder statics via usage slot 0x968e4d8;
  live $gK decrypts from segment statics+0x2820), the leash composition
  (band + 1; Value3^Value4 = 1 with both values decoded), the inline
  FlagShoot == −1 gate, the $UG 148-case/$yG 37-case selector flattening with
  pool-constant chains (119→42→132→124→7→67; 28→…), the $bh leash-gate helper
  call, the eight live-pool constants (DEFEND 2 / BOMBARD 5 / BEHOLDER-id 73),
  the takepos static masks (0x215F / 0xFEE0 / 0xFEFD), the AND-reduce + 0x7FFF
  CellsMask, and the complete per-category/per-hero-type mask partition.
- CORRECTED: "defend leash = per-scenario server balance data loaded into UnitAct
  statics" (pg-leash-native.txt §3) — retired; UnitAct has no statics and the
  XOR pair is pool constants resolving to 1.
- MEDIUM/INFERRED (bounded residuals): the band formula (17 enumerated stores),
  the $UG/$yG chain-terminal full semantics, hero ids 60–69/76 and unit id 42
  naming. (The cell-class bit names residual was RESOLVED by Task 59 —
  r6-bitname-crossref.md.)
