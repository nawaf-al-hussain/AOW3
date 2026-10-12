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
