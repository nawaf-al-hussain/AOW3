# B7 pass 1 — native unit–unit collision / path-slot architecture (PathAct layer)

Game: AOW3 6.9.18 (`libil2cpp.so` sha256 `8ace05bb…`, `dump.cs` `0050e67d…`,
`script.json` 177,021,612 B / 366,304 ScriptMethods — full chain re-established
this session, byte-identical to the committed pins). Session: Task 64, B7 pass 1.

Audit gate B7 ("No unit–unit collision / path-slot micro-management", audit §2)
recorded the native surface — `Unit.wait_for_moving 0xB9`, `forced 0xB8`,
`walk_state 0xE4` + cross-tile `walk_dx/dy` — and required "RE the slot system
(likely `$Pg`-adjacent, Obfuz-encumbered), then a deterministic browser
equivalent". This pass maps the system's architecture, traffic and delivery
path from the binary. Tooling: `reverse/tools/b7_pathact_decode.py` (field
census + annotated disassembly), `reverse/tools/b7_callvirt_xref.py` (vtable
slot callvirt xref, r7f method), `reverse/tools/b7_handler_disasm.py`
(targeted handler disasm).

## 1. The engine class map [NATIVE]

The sim-side movement engine is **`com.geargames.aow.entities.battle.PathAct`**
(dump.cs 425673, TypeDefIndex 11928): a static class of ~50 methods over
`(Battle, Unit, ...)` with Obfuz-mangled names (`$ZD`, `$ae`, `$ce`, …) whose
SIGNATURES are fully preserved. Structural landmarks:

| Anchor | RVA | Signature (shape) | Role reading |
|---|---|---|---|
| `$ZD` | 0x4741374 | `(Battle,Unit,int,int,bool,int,int,bool,int,int)` | largest walk-order entry (10 args) |
| `$ce` | 0x47501F0 | `public (Battle,Unit)` | walk stepper — see §3 |
| `$me` / `$Me` | 0x475C2D4 / 0x475DC3C | `public (Battle,Dynamic,BattleCellBasic,int,int)` | cell occupancy add / remove |
| `$Te` | 0x4764F44 | `(Battle,Unit,BattleCell,int,int,bool)->sbyte` | placement legality check |
| `$Qe` | 0x476A73C | `(Battle,Unit,int,int,Dynamic)->sbyte` | placement check reading `wait_for_moving` (§3) |
| `$pe` | 0x47641BC | `(short[],short[],bool[],int,int,bool,int)->bool` | path/cross-array predicate |
| `$ue` | 0x4761F50 | `public (sbyte[][],int,int,bool,bool)->sbyte` | grid query |
| `$ve` | 0x47553CC | `public (sbyte[][],int,int,int,int,bool)->int` | grid query returning int |
| `$xe` / `$Xe` | 0x476B58C / 0x476B320 | `protected (Battle,Unit,int)->int` | per-unit step math pair |
| `$ye` | 0x475ABA4 | `(Unit)->UnitStateType` | state resolve |

PathAct's constant block (dump.cs): `$ZJ=0, $ak=1, $Ak=2, $bk=3, $Bk=4, $ck=5,
$Ck=6, $dk=7` (an 8-value id family, consistent with a state/axis enum),
`$Dk=50, $Hk=50` (50 = the half-cell fixed-point D of the R7 `$Ik` decode),
`$ek=10, $ik=10` (step counts), `$Ek=96, $fk=200` (distances/ticks),
`$Fk=5, $Gk=5` (radii), `$gk=2, $hk=1` (small counts) [NATIVE constants,
semantics INFERRED].

Supporting data classes (`GearGamesSerializable` — battle-state stream members):

- **`PathUnitInfo`** (426005, 96 methods): 30+ scalar slot-state fields
  (ints/bools/sbytes + `Wall`) — the per-unit path execution state bag.
- **`PathCoordInfo`** (425988): `short[][] cells + bool[] cross + int[] ticks +
  Wall + int + sbyte` — one path leg (mirrors `Unit.path/cross/path_tick`).
- **`PathGoAroundCrossSwitchInfo`** (425995): 6 scalars — the go-around
  (obstacle detour) switch state.
- **`SlipInfo`** (391779): a complete sliding-collision resolver state —
  `slipDx/slipDy/slipDo` (slide vector), `closestX/Y/Radius` (nearest
  obstacle), `xFrom/yFrom→xTo/yTo` (movement segment), TWO tangents
  (`x/y/angleTangent1|2 + stepTangent1|2 + orient1|2`) with `stepCur/stepCount`
  (which detour branch, how far), and a strafe sub-system
  (`strafeDx/Dy/Angle/Len/Max/Step`) [NATIVE structure; semantics INFERRED
  from field names + shapes].

The client `Unit` class is thin (26 non-accessor methods) — it is a state
mirror; the movement FSM lives in the `*Act` static classes, exactly like the
damage/armor/fog architecture.

## 2. Per-cell occupancy model [NATIVE]

- **`BattleCellBasic`** (419368): `{ occupant Dynamic @0x10, occupants
  List<Dynamic> @0x18, sbyte ×3 @0x20-0x22, short @0x24, BattleCrosscell @0x28 }`
  — one PRIMARY occupant plus an occupant LIST (stacking tracked, not
  forbidden), per-cell state bytes and a crosscell handle.
- **`BattleCrosscell`** (419437): `{ int[] @0x10, int[] @0x18, Dynamic[] @0x20,
  int ×3 }` — multi-cell occupant bookkeeping (large units/buildings).
- **`BattleMap`** (419504): `BattleCell[][] @0x18 + BattleCrosscell[][] @0x20`
  + bounds shorts — the occupancy grid.
- Battle also keeps `Unit[][]`/`Building[][]` index grids and a
  **`CellScheduleStack`** (378874 — a `BattleCrosscell` object pool) plus a
  **`SkirtsStack`** (391669; unit "skirt" footprint objects) [NATIVE fields].
- `UnitTakePositionsManager` (R6) rides on this for the TakePositions spec.

## 3. Traffic map — who drives the slot/wait/forced/walk-state machine [DECOMP]

BL xref of the Unit accessors returned **zero direct callers** (the fogLines
virtual-dispatch precedent), so access was resolved with the vtable-slot
callvirt scan (`b7_callvirt_xref.py`, idiom `ldr xK,[xR]; ldr xM,[xK,#39+2S];
blr xM`, imm12 = 39 + 2·slot). Unit's slot map (dump.cs): `get/set_Forced`
101/102, `get_NextXLogic` 262, `get/set_WaitForMoving` 299/300,
`get/set_WalkState` 301/302. Site-exact results (full tables in
`b7-pathact-decode.txt` §1b/§1c):

- **`set_Forced` (slot 102, 26 verified sim sites)** —
  `GAICommandSpecMode.execute` ×5 (0x45F64AC/0x45F6610/0x45F6750/0x45F6A70/
  0x45F6AB4), `GAICommandTroopMove.execute` (0x45FC218), `BattleAct.$z/$x/$cA`,
  `GAIAct.$GD`, **`PathAct.$ce` ×2** (0x4750EF4/0x4751880), `PathAct.$Ge`,
  `UnitAct.$cg/$uG/$Ag/$ei×2/$Gg/$Gh/$fg/$Tg/$RH/$rH`, `ChestsByGAIAct.$rj`.
  → **forced = "this move is command-forced"** — set by direct order handlers
  (spec-mode acts, troop move) and cleared/managed by the walk engine
  [INFERRED semantics; sites NATIVE].
- **`get_Forced` (slot 101)** — **`PathAct.$ce` ×13 sites** (the walk stepper
  branches on it constantly), `UnitAct.$yG` ×6, `ShotAct.$EE` ×4, `SideAct`,
  `AICommUnitsMove.$CMA` (the R13 `$CMA` validator family), GAI command
  handlers [NATIVE].
- **`set_WaitForMoving` (slot 300, 5 sim sites)** — `UnitAct.$cg` (0x48062B8),
  `UnitAct.$uG` (0x482D15C), `UnitAct.$CG` (0x4856C60), `BattleAct.$J`
  (0x466AA78), `GAICommandTourTable.execute` [NATIVE].
- **`get_WaitForMoving` (slot 299)** — `BattleAct.$lA/$uA/$J/$DA/$mA/$IA/$KA`,
  `BuildingAct.$LB/$mB`, **`PathAct.$Qe`** (the placement check), `UnitAct`
  ×7 [NATIVE]. → units WAIT when the contested cell is occupied and un-forced
  [INFERRED].
- **`set_WalkState` (slot 302)** — `BattleAct.$ZA` ×4 (0x4658B94/0x4658CDC/
  0x4658D44/0x4658D64), `BattleAct.$J`, `PathAct.$ce`, `UnitAct.$Ag`,
  `UnitAct.$yi` ×2 [NATIVE]. `get_WalkState` is read across `BattleAct`
  (13 fns) + `PathAct.$ce/$Te` — walk_state is the shared walk-phase variable
  of the tick update [NATIVE sites, value semantics residual].
- **Dispersal trio** (`Unit.dispersal 0x120 / dispersal_prev 0x128 /
  dispersal_bu_id 0x130`): direct field traffic (census) concentrates in
  `PathAct.$Oe` (0x4746314, writes all three), `PathAct.$be` (0x474CE70),
  `PathAct.$Te`, `BattleSide.$ju/$iu`, `ShotAct.$Ye`, `SideAct.$yE`,
  `UnitAct.$sH`; the faction-level scheduler field is
  `Fraction.dispersalTick 0xF1` (with `Fraction.approachGroupAmount 0xF2`)
  [NATIVE]. → a faction-timed dispersal pass that spreads stacked units via a
  `dispersal_prev`-chained worklist [INFERRED].

Register-tracking caveat (recorded for successors): inside `PathAct.$ce/$me`
and `BattleAct.$ZA` the recurring `ldr w8,[x0,#0xE4]; cbnz; bl 0x3CC7AC8` pair
is the il2cpp class-init/lazy-init idiom over a STATICS base (x19/x26 = adrp
into 0x968xxxx metadata pages), NOT a `Unit.walk_state` access; the same
applies to some `[xN,#0xB8]` loads. Only the callvirt-site list above is
register-verified; the raw census in the evidence file must be read with this
caveat (annotation heuristic: Unit offset table, register-agnostic).

## 4. Delivery path: the slot state is battle-stream data [NATIVE]

`UnitSTSerializer.serialize` (0x453A3B0) / `UnitSTDeserializer.deserialize`
(0x452FF54) and `BattleSTSerializer`/`BattleSideSTDeserializer` all appear in
the callvirt caller lists of `get/set_Forced`, `get/set_WaitForMoving`,
`get/set_WalkState`, `get/set_Dispersal*`; `Unit` itself is an `Entity`
carrying these as virtual properties, and `SlipInfo`/`PathUnitInfo`/
`PathCoordInfo`/`PathGoAroundCrossSwitchInfo` are `GearGamesSerializable`
with dedicated ST serializers. The slot/wait/walk/dispersal/SlipInfo state is
therefore **part of the server battle-state stream** — same classification as
the R7 fogLines tables ([SERVER-DATA]). The client MIRRORS it for
prediction/rendering; the DECISION LOGIC is server-side, and the client-side
`*Act` classes (which the binary does contain) compute derived walk visuals.
This bounds what static client RE can recover: structures and traffic, plus
whatever decision constants survive in client-side `*Act` bodies (bounded
residual, §6).

## 5. Browser fold-in (comment-only, v=64 → v=65)

Per the fogLines precedent (comment-only provenance first-class, no behavior
change without decoded semantics): `docs/game.js` `passable()` block now
documents the native occupancy model (cell occupant + list + crosscell +
CellScheduleStack), the PathAct engine map with site-pinned evidence, the
forced/wait semantics reading, and the [SERVER-DATA] classification; it states
explicitly that per-cell unit occupancy/slot waiting is NOT simulated (the
browser grid check remains a static-obstacle gate). Comment-only diff verified
(zero non-comment +/- lines); `node --check` OK; `?v=65` per §35.1.

## 6. Residual (bounded, carryable)

1. **Slot-behavior numbers**: wait_for_moving value domain (0 / tick counter /
   waiter id), walk_state value domain (the `$ZJ..$dk` 0..7 family is the
   candidate), dispersal period/radius. All live in `*Act` method bodies whose
   linear decode requires the statics-base register tracking documented in §3 —
   tooling now exists (`b7_handler_disasm.py`), the remaining work is bounded
   per-function flow analysis.
2. **R1 carryable**: one Frida session dumping `SlipInfo` + `PathUnitInfo`
   per unit during a march (single hooks on the Unit/SlipInfo ST serializers)
   recovers the live value domains directly — same one-hook shape as the R7
   fogLines carryable.
3. The deterministic browser equivalent (pairwise slot waiting + dispersal)
   stays DORMANT until §6.1/6.2 land — no invented slot semantics (G11
   dormant-ready precedent).

## 7. Pass 2 — the value domains (Task 65) [DECOMP]

Tooling: `reverse/tools/b7_value_domains.py` (v3: shape-filtered callvirt scan
with Unit-receiver provenance, x0-clobber discipline, w/x width normalization,
Obfuz pool-constant folding) + `b7_dispersal_xref.py` (receiver-verified
whole-binary xref for slots 61-66/300/302) + `b7_inline_pool_decode.py`
(GOA emulator reuse). Evidence: `b7-value-domains.txt` (54k lines),
`b7-dispersal-xref.txt`.

### 7.1 Pool-constant arithmetic idioms (first, they gate everything)

The *Act bodies read constants from the `$Obfuz$ConstFieldHolder$0` statics
(usage slot `0x968e4d8`, values from the committed
`evidence/obfuz/obfuz-pool-values.json`). Three idiom shapes recur:

- **literal 1** = `eor(pool[0xC], pool[0x10])` — pool[0xC]=2197149770 and
  pool[0x10]=2197149771 are CONSECUTIVE ints; their XOR is 1.
- **literal 0** = `mul(pool[0x4], pool[0x8])` — pool[0x8]=0.
- **direct values** — `pool[0x34]=2` (DEFEND), `pool[0x80]=5` (BOMBARD),
  `pool[0x64]=8` (DONT_SHOOT) already known from R2/Build I.

### 7.2 wait_for_moving (sbyte 0xB9) — a WAIT-CYCLE COUNTER, not a bool

Shape-verified writers (method-ptr in x2, Unit-traced receiver; full site
list in the evidence):

| Writer | Site | Value |
|---|---|---|
| `BattleAct.$J` | 0x466AA78 | **1** — wait START |
| `UnitAct.$cg` | 0x48062B8 | **1** — wait START (second entry) |
| `UnitAct.$uG` | 0x482D15C | **old + 1** — wait ESCALATION per continued tick |
| `UnitAct.$CG` | 0x4856C60 + 0x4852510 | **0** — wait CLEAR (×2 sites) |
| `GAICommandTourTable.execute` | 0x45F8C98 | dictionary-lookup result (tour-table reassignment) |
| ST serializers | 0x4937048 / 0x43C8A98 | serialization mirrors ([SERVER-DATA] confirmation) |

Reader arbitration in `PathAct.$Qe` (placement check) @0x476AA50-0x476AABC:
`w27 = unit.get_WaitForMoving()`; then an INLINE Obfuz accessor
(`$gK(seg, start=0xD8, salt=0x3D, keyA=0x27428CBF)`, segment object at holder
statics+0x2820 — NOT one of the two known 2048-B segments, value decodable
after the builder-.cctor segment-source parse, §8) times
`occupant.get_SpeedCurr()` (Unit slot 221, sbyte):
**`if (POOL[0xD8] × occupant.speed_curr > (sbyte)mover.wait_for_moving) →
branch`** — the wait counter is weighed against the OCCUPANT's speed-weighted
patience: fast occupants yield sooner. `UnitAct.$cg`'s other read site tests
`tst w0,#0xff; b.eq` — zero = not waiting. Domain: **0 = not waiting, 1..N =
waiting (N = accumulated wait cycles, sbyte-wrapping)**.

### 7.3 walk_state (sbyte 0xE4) — BINARY, single writer

The whole-binary receiver-verified scan finds exactly ONE sim writer:
`BattleAct.$J` @0x466A460: **`set_WalkState(unit, old ^ 1)`** (the
`eor(get_WalkState(), POOL[0x10]^POOL[0xC]=1)` chain, result of
`get_WalkState` @0x466A430) — a walking-phase TOGGLE, with
`set_WalkStateTick(unit, 0)` @0x466A494 (the `mul(pool[0x4],pool[0x8])=0`
idiom) resetting the phase timer. Readers: `PathAct.$ce` ×2 (the walk
stepper) + `BattleSTSerializer` ×3 + `UnitSTSerializer` — phase state rides
the battle stream. **The pass-1 candidate "$ZJ..$dk 0..7 family = walk_state
values" is WRONG** — walk_state is binary; the 0..7 sbyte family remains an
axis/step-count candidate [INFERRED], unrelated to walk_state by this decode.

### 7.4 forced (sbyte 0xB8) — cleared by the wait handlers

`set_Forced(unit, mul(pool[0x4],pool[0x8])=0)` at `UnitAct.$cg` @0x47FF9E8 and
`UnitAct.$uG` @0x482D1A8 — entering/continuing a wait CLEARS the command-forced
flag (the order's push-through right is consumed by the wait). Readers across
`$ce`/`$Te`/`$yG` per pass 1.

### 7.5 Pass-1 traffic-map CORRECTIONS (argument-shape filter, Task-63 discipline)

The v3 shape+receiver filter re-tests every pass-1 callvirt claim:

- **`BattleAct.$ZA` "set_WalkState ×4" (0x4658B94/CDC/D44/D64): FALSE
  POSITIVES.** The sites are getter-shaped calls (`x1`=method) whose returns
  feed `cmp w23, w9; b.lt` list-index loops on objects pulled from a
  `List<object>` enumerator — slot-302 collisions on a NON-Unit class
  (get_Count-shaped). $ZA's real traffic is the statics-driven state machine
  over pool values (§ pass 1 census, class-init caveat applies).
- **`UnitAct.$yi` "set_WalkState ×2": FALSE POSITIVES** (same getter-shape +
  count-loop signature; receivers are call returns).
- **`UnitAct.$Ag` / `PathAct.$ce` "set_WalkState": receiver-unverified** (the
  receiver comes from call returns / unit-field loads, not the x1 chain) —
  downgraded from verified to unproven, not counted as writers.
- `PathAct.$ce` "get_Forced ×13": getter-shaped, receivers not unit-traced
  (likely `unit.obj` field loads — recorded unverified, not FP).
- `PathAct.$Oe` "dispersal trio writer": the apparent `get_Dispersal`/
  `get_DispersalPrev` calls at 0x4748530/0x4748560 are SLOT COLLISIONS on a
  class with SHORT-returning getters at slots 61/63 (results go through
  `sxth` into `sub` + `CheckAndCalc$$$nc` — coordinate math, not Unit state).

**Corrected writer map**: wait_for_moving = {$cg:1, $J:1, $uG:+1, $CG:0,
TourTable:lookup}; walk_state = {$J: old^1} only; walk_state_tick = {$J: 0};
forced = {$cg:0, $uG:0} in wait contexts.

### 7.6 Dispersal (0x120/0x128/0x130) — accessors virtual, traffic [SERVER-DATA]

Unit slots 61-66 (get/set_Dispersal{,Prev,BuId}, dump.cs 393735-393750). The
whole-binary receiver-verified scan (raw word counts 1.5k-3.6k per slot from
offset collisions) yields verified sites concentrated in serializers
(BattleSTSerializer/UnitST* — the battle-stream confirmation) and a bounded
set of *Act/BattleSide bodies whose receivers trace through unit fields
(`obj @0x88`, `dispersal @0x120`). `Fraction.dispersalTick` (sbyte @0xF1,
slots 161/162) is FACTION CONFIG (data-delivered period, R1-carriable); the
scheduler pass structure stands as pass-1 [INFERRED]. The dispersal VALUE
DOMAINS (period/radius) remain config data — no client-decodable formula, G11
discipline holds.

## 8. Residual after pass 2 (replaces §6.1)

1. The `$Qe` arbitration constant `POOL[0xD8]` (inline accessor triple
   start=0xD8, salt=0x3D, keyA=0x27428CBF, segment @holder statics+0x2820):
   requires extending the R2 builder-.cctor parse to the THIRD segment (the
   697-entry table covers srcSlots 0x1008/0x1810 only). Bounded, tooling
   exists; the rule SHAPE (constant × occupant speed vs mover wait) is the
   deliverable and is decoded.
2. R1 carryable unchanged (SlipInfo/PathUnitInfo march dump), plus now: the
   live wait_for_moving escalation rate and $Qe branch polarity.
