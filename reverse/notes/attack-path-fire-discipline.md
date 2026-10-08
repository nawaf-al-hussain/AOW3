# Attack-Path Decode: Native Fire Discipline vs an Attack Order (Build E)

Game: AOW3 6.9.18 (XAPK sha256 1a41e033… → libil2cpp.so sha256 8ace05bb…, dump.cs sha256 0050e67d…, metadata v31 / Il2CppDumper 6.7.46).
Session evidence: reverse/evidence/combat/attack-path-hi-xref.txt, attack-vt-setters.txt, attack-unitsmove-decode.txt, attack-aicomm-map.txt, attack-eg-se-spec.txt. Tools: /scripts/attack_path_scan.py, field_mutation_scan.py, vt_call_scan.py, aicomm_map.py, eg_se_decode.py, pk_disasm.py.

## Question

Does native fire discipline (DontShoot) survive an attack order? The answer decides the tribute fireHold fidelity fix (whether an explicit attack order on a fireHold unit should fire, and whether discipline resumes afterwards).

## 1. There is no Attack task — attack rides the move order (CONFIRMED)

- Sim-side task enum `UnitTaskType` (dump.cs:395395-395410, TypeDefIndex 11531): NONE=0, PATROL=1, DEFEND=2, HOLD_POSITION=3, HIDE=4, BOMBARD=5, MINE=6, DEMINE=7, DONT_SHOOT=8, LOADING=9, UNLOADING=10, BERSERK=11. No Attack member. Client mirror `ClientUnitTaskType` (271207-271237) matches 1:1. Attacking is the default behavior; fire discipline is the exception state.
- `AICommandHelper.SendUnitsAttack(IList<ClientUnit> units, ClientEntity target, int prototypeId, sbyte category, Point2i cell, UnitSpeedMoveStyle speedMoveStyle)` @0x82D4FF8 (dump.cs:337709) disassembled end-to-end: constructs the SAME message object as `SendUnitsMove` @0x82D4A50 via the shared factory 0x4EF4548, then writes targetId (vt slot pair 0x238/0x240 read from the target entity), cell low/high (0x2F8, 0x318), prototypeId (0x278), category (0x258), `GetEntityIdsByEntityList(units)` @0x827B788 → unit id array (0x2D8), a constant 1 into the moveStyle slot (0x218), and `cset(speedMoveStyle == 1)` (0x298), then the shared send epilogue `b 0x82D4BBC`.
- The AIComm command class list (dump.cs:431773-433991) contains AICommUnitsMove / UnitsStop / UnitsHoldPosition / UnitsBombard / UnitsPatrolTargeting / UnitsPsionic / UnitBombersTargeting — **no AICommUnitsAttack exists**. An explicit player attack order IS an AICommUnitsMove with a target attached.

## 2. The task-write surface (CONFIRMED inventory)

- `$Hi(Battle, Unit, sbyte task)` @0x48178FC (400 B, fully disassembled in attack-path-hi-xref.txt): the set-task helper. Dispatches on a statics int (mode 0/1/2), idempotence-checks the requested task against the unit's current task via `get_Task` (vt 0x1008) before the write; the actual write is the tail call `ldr x3,[klass+0x1018]; br x3` (set_Task) with the MethodInfo pair loaded from 0x1018/0x1020. 33 direct BL call sites (whole-binary vectorized scan).
- Caller task-id histogram (attack-path-hi-xref.txt): task 2 DEFEND ×1 (0x45F6AA8), task 3 HOLD_POSITION ×1 (0x45F6B84), task 4 HIDE ×1 (0x45F66E0), task 8 DONT_SHOOT ×1 (0x45F6820) — the four spec arms inside `GAICommandSpecMode.execute(Battle)` @0x45F61E0 (3768 B; dump.cs:410948, "public override void execute(Battle battle)"). The execute body gates each arm on the streamed spec bitmask BEFORE the task check: `tbz w0,#0x11` (bit 17 = Hide 131072) @0x45F65E8 and `tbz w0,#0x14` (bit 20 = DontShoot 1048576) @0x45F6728, then `get_Task` idempotence @0x45F65F4/0x45F6734. This pins the spec→task mapping: **the persistent per-unit spec bit 20 drives the DontShoot task 8**.
- Virtual call convention pinned this session (attack-vt-setters.txt): getter call shape `ldr xFN,[klass+X]; ldr xMI,[klass+X+8]; blr xFN`; setter call shape `ldr xFN,[klass+X-8]; ldr xMI,[klass+X]; br/blr xFN` (the static blob at 0x138A480 is 24-byte records {0x403, fn, mi}; live layout compacts pairs). Verified anchors: get_Task [klass+0x1008] (82 confirmed sites), set_Task [klass+0x1018] (599 sites / 252 functions), get_FlagShoot [klass+0x258] (609 sites / 370 functions), set_FlagShoot [klass+0x268] (475 / 341), set_Forced [klass+0x388] (529 / 256).

## 3. The attack-order application replaces the task (CONFIRMED call-shape inventory)

`AICommUnitsMove` (dump.cs:433557): `$CMA(Battle)` @0x4909950 (~20 KB — a computed state machine, ~174 codes, dispatched at 0x490A614 via jump table on the code value) + per-unit helper `$Pk(Battle, Unit)` @0x490E864 (964 B, formation geometry; tail-calls Battle vt 0x1638). Inventory of unit-state mutations inside the class range 0x4909850..0x490F33C (attack-unitsmove-decode.txt):

- `get_Task` idempotence gates @0x490AC5C and @0x490CB04 — both compare the unit's current task (sxtb) against `$Obfuz$ConstFieldHolder$0` pool constants (statics +0x64 / +0x14) and branch to distinct state codes (pool +0x2CC vs +0x8F8 paths) — the order path is task-aware.
- `set_Task` ×2 @0x490C500 (value from a vt call chain) and @0x490C954.
- `$Hi(Battle, Unit, w2)` @0x490DC48 with the task arg computed as `mul w2, w8, w9` from pool statics +4/+8 (obfuscated conditional task selection), immediately followed by `set_Forced`.
- `set_FlagShoot` ×1 @0x490C610 (value = pool static +0x374).
- `set_Forced` ×3 @0x490B948 / 0x490CC60 / 0x490DC64.

So a DontShoot unit (task 8) that receives an explicit attack order gets its task REPLACED by the move-application state machine and its flag_shoot rewritten — the ordered engagement fires.

## 4. flag_shoot is the fire-control byte (CONFIRMED inventory; semantics per-site)

- `Unit.flag_shoot` @0xA0 (dump.cs:393289), virtual accessors get/set_FlagShoot @0x45B0E78/0x45B0E80 (Slots 89/90). Written by 8 order-command types (per-class site counts in attack-aicomm-map.txt): AICommBuSet ×1, AICommFightersGuard ×1, AICommMineLay ×1, AICommSquad ×1, AICommUnitBombersTargeting ×1, AICommUnitsBombard ×2, AICommUnitsMove ×1, AICommUnitsPsionic ×1 — and read 609+ times across 370 functions including the fire decision.
- Fire-decision readers: `$se(Battle, Unit)` @0x475757C (called by the $ce siege driver, window 0x4750FE8) and `$eg(Battle, Unit) bool` @0x482A4E0 (5048 B, 30-case jump table — target acquisition / can-fire; also calls $Dg target finder 0x482BFDC, $uG 0x482C59C, $We 0x476E434, $iG 0x47F1FC8 and $ce 0x47501F0) — both test flag_shoot against 0 (attack-eg-se-spec.txt).

## 5. The spec bit survives the attack order (CONFIRMED negative)

The UnitsMove application inventory contains NO spec-stream writes: `AICommUnitsSpec` @0x49130C8..0x4913EB0 (get_Task ×4, the spec applier) is a separate command class, and the move path never touches it. The DontShoot spec bit (bit 20) therefore persists across an attack order; when the ordered engagement ends, the spec→task layer (GAICommandSpecMode arms, §2) re-asserts task 8. Discipline resumes.

## 6. Verdict (answers the fireHold fidelity question)

- CONFIRMED (structural): fire discipline = task 8 driven by persistent spec bit 20; attack order = AICommUnitsMove(targetId≠0) whose application REPLACES the task and rewrites flag_shoot; the spec bit is untouched by the move path.
- Consequence 1: a fireHold unit given an explicit attack order DOES fire at the ordered target (task replaced during the engagement).
- Consequence 2: fireHold remains sticky across the attack — after the ordered target dies, the surviving spec re-asserts task 8 and the unit resumes holding fire.
- UNRESOLVED (obfuscator barrier): the exact numeric task values written by the UnitsMove state machine. The literals live in the `$Obfuz$ConstFieldHolder$0` const pool (statics +4/+8/+0x14/+0x64/+0x374/…) decrypted at runtime by the Obfuz helper chain (0x5265B74 trampoline → delegate dispatch → 0x5265090, resolved through runtime-initialized interface maps). Static recovery of the pool requires emulating IL2CPP class initialization; documented as the residual for a possible Unicorn-based session.

## 7. Tribute implementation (v=37)

- `orderedEngagement(u)` predicate: `order.kind === "attackMove" && order.x === undefined && targetId !== undefined` — uniquely identifies commandAttack-issued orders with a live ordered target (commandAttack @game.js sets `{kind:"attackMove", x:undefined, y:undefined}` + targetId + preferredId; commandMove attackMove always carries x/y; updateTargeting clears targetId/preferredId when the target dies).
- All five fire gates (`shoot`, `fireShell`, bombard shell, `meleeStrike`, `shootBuilding`) now read `u.fireHold && !this.orderedEngagement(u)` — an explicit attack order fires through hold-fire; every other path stays suppressed; stickiness is preserved after the target dies.
- Determinism: all three predicate inputs are already lockstep-serialized state (order.kind, order.x, targetId in the U-line); no new state introduced.

## R2 addendum (Task 42) — the pool residuals are CONFIRMED

The Obfuz pool is now decoded statically (697/697 — `reverse/evidence/obfuz/
obfuz-pool-values.json`, note `obfuz-pool-emulation.md` §9). The constants this note
left UNRESOLVED resolve to:

- pool statics +0x04 = 2603447459, +0x08 = 0 — the `mul w2, w8, w9` task argument at
  0x490DC48 evaluates to (V1*V2) mod 2^32 = **0 = UnitTaskType.NONE** (valid task id;
  the multiplier pair is the obfuscation of a constant task write).
- pool statics +0x14 = **3** — the `$ce` task threshold.
- pool statics +0x64 = **8** — the DontShoot idempotence constant = DONT_SHOOT task id
  (matches the `UnitTaskType` enum and the get_Task compare at 0x490AC5C/0x490CB04).
- pool statics +0x374 = **-1 (0xFFFFFFFF)** — the `set_FlagShoot` value.

The four numeric rows above upgrade MEDIUM/UNRESOLVED -> CONFIRMED (semantic cross-
checks pass natively: task-id ranges and the DEN product, see the R2 note).

## Task 45 addendum — $ce task arms decoded; fold-in landed (no behavior change in the gates)

The $ce on-demand constants decode as task ids (`ce-constants-decode.txt`): the
driver holds dedicated arms for **DEFEND = 2** (9 sites, e.g. 0x4750600
`cmp 2, vt[0xba8]; b.eq`), **BOMBARD = 5** (7 sites, one a `b.ge` threshold),
**MINE = 6** (1 site), and the **-1** flag_shoot-free sentinel (3 sites). The
statics+0x14 = 3 constant is **HOLD_POSITION** at the get_Task equality gate
(@0x4750668) — R2's "$ce task threshold" label is corrected to an equality match;
the same literal 3 also serves as the mod-3 divisor in the phase comparison
@0x4751998. `$se` (0x475757C) is CONFIRMED as the flag_shoot EVALUATOR: its return
value is written straight back by set_FlagShoot @0x4751008 — the native shape of
the browser's `nativeTask() === TASK_DONT_SHOOT` fire gates.

Fold-in (Task 45, no gate behavior change): the shipped kernel now carries
`nativeTask(u)` (derived, unserialized — hold->3, defend->2, bombard->5,
fireHold+no-engagement->8, else 0), the decoded constants block
(TASK_DONT_SHOOT/CE_TASK_*/FLAG_SHOOT_FREE/SIEGE_DEN), and $Hi idempotence in
commandDontShoot/commandCanShoot. All five fire gates read the derived task;
`fireHold` remains the only serialized state (U-line/hash bytes unchanged —
replay 45/45 + lockstep-jip 88/88 green). Vectors: phase5.test.js sections
"per-mille accumulator", "DEN + task-id anchors", "nativeTask fold-in" (+23).
