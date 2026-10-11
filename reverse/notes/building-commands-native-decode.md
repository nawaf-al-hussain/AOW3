# Building/production command suite — native decode (G1–G4 / I4) — Task 62

Game: AOW3 6.9.18 (`com.geargames.aow`), dump.cs sha256 `0050e67d…` (pin-matched
this session from `reverse/dump.cs.zip`), stringliteral.json corpus pinned.
Session constraint: `libil2cpp.so` NOT loadable (XAPK blobs are git-LFS
pointers; no git-lfs/dotnet/Il2CppDumper in this environment — same tooling
gate as the R7 fogLines re-open, see `reverse-engineering-roadmap.md` queue
item 6). This pass is therefore a **dump.cs structural decode**; every
disassembly-dependent question is explicitly labeled `[AWAITING BINARY]`.
Evidence: `../evidence/commands/building-commands-decode.txt` (verbatim class
extracts + line numbers).

## 1. What was unknown

The audit carried four `MISSING` command gaps (§6): **G1** production
cancellation/refunds, **G2** building rally point, **G3** repair, **G4**
building/unit upgrade — all HIGH impact rows in the command table (§5.B), plus
browser item **I4** ("add command types + sim handlers + UI; journal from day
one | R1 for numbers"). The command-system note knew only the class *names*
(`AICommCancelBuyUnit`, `AICommBuildingRallyPoint/Remove/Repair/Upgrade`)
with a "(gaps)" placeholder — payload shapes, sender signatures, server
application commands, config surfaces and validation rules were all
undecoded. This pass closes that structure layer end-to-end and wires the
browser kernel to it.

## 2. The three-layer protocol (all [NATIVE], dump.cs)

**Intent layer (client→server, `AIComm : Message`).** Every command is
tick-stamped at construction (`AIComm..ctor(int senderTick, int side)`,
0x48DF0CC) — the exact journal discipline the browser already ships. Payload
shapes (fields at their dump.cs offsets):

| Command | Fields | Roles (pinned by sender + LC mirror) |
|---|---|---|
| `AICommBuyUnit` | int@0x30, int@0x34 | (buildingId, unitPrototype) |
| `AICommCancelBuyUnit` | int@0x30, int@0x34 | (buildingId, unitPrototype) |
| `AICommBuildingRepair` | int@0x30, int@0x34 | (buildingId, **price**) |
| `AICommBuildingUpgrade` | int@0x30 | (buildingId) |
| `AICommBuildingRemove` | int@0x30 | (buildingId) |
| `AICommBuildingRallyPoint` | short@0x2E, short@0x30, `Coordinate[]`@0x38, int@0x40 | waypoints (+crosscell flags), buildingId |

Role-pinning method (recorded because it is reusable): field **count+types**
are matched against the plain-named sender facade
(`SendBuildingBuyUnit(ClientBuilding, UnitType)`,
`SendBuildingCancelBuyUnit(ClientBuilding, UnitType)`,
`SendBuildingRepair(ClientBuilding, int price)`,
`SendBuildingUpgrade(ClientBuilding)`, `SendBuildingRemove(ClientBuilding)`,
`SendBuildingRallyPointSet(ClientBuilding, List<Point2i>)` and the group
variant `SendBuildingsRallyPointSet(IList<ClientBuilding>, List<Point2i>)`),
and the resulting role hypothesis is cross-checked against the server→client
application command that consumes the same pair. The calibration example is
`AICommBuSet` vs `SendBuildingSet(...)`: five params map 1:1 onto six fields
with **non-identical ordering** (`requestId` is param #5 but field @0x34) —
so parameter order must never be assumed; only count/type alignment plus a
cross-layer mirror settles roles. For cancel, the mirror is decisive:
`LCBuildingUnitTrainingCancel{m_buildingId, m_unitType}` — cancel names a
UNIT TYPE (it decrements a type-bucket), not a slot index.

**Application layer (server→client, `LC* : AbstractLogicCommand`).** The
authoritative application commands are plain-named (no Obfuz encoding in this
family — field names are literal): `LCBuildingUnitTrainingCancel`,
`LCBuildingUnitTrainingCompleted{m_buildingId, m_unitPrototype}`,
`LCBuildingRepairInitiate{m_buildingId, m_repairDuration}` with
`Initiate(IBuilding, int startTick, int duration)`,
`LCBuildingRepairCompleted`, `LCBuildingStartUpgrade{m_buildingId,
m_duration}` with `Initiate(Building, int startTick, int duration)`,
`LCBuildingProcessCompleted{m_buildingId, m_upgradeLevel, m_health}` (+
`TryBuildingGroundFree`), `LCBuildingRallyPoint{m_buildingId, m_cells:
List<Point2i>}` with single-cell AND waypoint-array `Initiate` overloads,
`LCBuildingErase`, and production progress control
(`LCBuildingProgress/Pause/Resume`).

Two server-authority findings fall straight out of the signatures:

1. **Repair and upgrade durations are server-computed and delivered**
   (`startTick + duration` in both `Initiate`s; the client mirrors store
   `m_repairDuration` @0x1A8 verbatim). The client never derives them. Any
   browser duration rule is therefore a `[BROWSER]` tuning surface by
   construction — the native rule is not a client-side formula to recover
   but a server-side value to capture (R1-session class).
2. **A level-up rebases building health**: `LCBuildingProcessCompleted`
   carries `m_upgradeLevel` **and** `m_health` — the new health arrives with
   the completion event. Stat deltas therefore live in per-level config
   (below), not in a client-side multiplier. This kills the temptation to
   ship an invented `level × 1.25` style factor (audit I1's class of error).

**Config layer.** `BuildingLevelType : Prototype` (dump.cs:377885) is the
per-level building prototype: `life/lifeInt`, `armor/armor_bonus/armor_type`,
`sight/sight_init`, `radar`, `regen/regen_init`, `energy/energy_init` (G6/I8
anchor), `time_constr/time_constr_init`, `price`, `score`,
`repair_price: short` @0x80, `repair_pause: int` @0x84,
`upg_lvl: UpgradeLevel` @0x90, `barracks: List<UnitType>` (the production
roster), `weapons: List<WeaponType>`, `open_ground/water/air` (B8 anchors),
`available: NOT_AVAILABLE=0/AVAILABLE=1/RESEARCHED=2` (level availability
state machine), `hq_count`, `rank_pvp`, `contrib`.
`UpgradeLevel : Entity` (dump.cs:396156) carries `cost_c` (upgrade cost),
`time` (upgrade duration input), `xp`, `coef_rush`, plus meta-progression
coupling (`cardId/cardAmount`, `ProfileRank contrib_rank`, `contrib_upl[]`)
— the in-battle surface is `(cost_c, time)` `[INFERRED mapping]`, consistent
with the server-delivered upgrade duration.

The repair price function is plain-named:
`calcRepairPrice(short repairPrice, int life, int maxLife)` (dump.cs:338564).
Signature is `[NATIVE]`; the parameter set forces proportionality to *missing*
life (full-health pricing must be 0), while exact arithmetic/rounding is
`[AWAITING BINARY]`.

## 3. Queue topology (drives cancel semantics)

The native production queue is **per-building** and **count-stacked**:
`ClientBuilding.m_trainingQueue : List<UnitTrainingQueueItem>` @0xF0 with
`m_trainingQueueIndex` @0xF8 + `m_trainingProgress` @0xFC, where
`UnitTrainingQueueItem = { readonly UnitType Prototype; int Count }` (a
struct, dump.cs:265567). Separate air trainer: `m_buildingTrainerEngineAir`
@0xD8. The browser's per-player flat queue (`p.queue`, max 8) is a
long-documented approximation; the native (building, unitType) cancel payload
is exactly the operation a count-stacked queue needs (decrement the matching
bucket). Browser mapping: `produceCancel{defId}` removes the newest matching
entry from the player queue — the per-player analogue of the native
per-building type-bucket cancel, with the topology difference restated in the
audit row.

Rally topology: per-building waypoint lists, ground and air engines separate
(`m_rallyPointsCells` @0x100 / `m_rallyPoints` @0x108;
`IsRallyPointAllowed`, `IsExistBuildingWithRallyPointForGround`), placed
through the `GUIBattleLayoutBuildingRallyPointSet` layout; state flags
`ClientBuildingStates.RallyPointIsSet = 0x4000`,
`ClientBuildingChanges.RallyPoint = 1`. Group rally
(`SendBuildingsRallyPointSet`) serves multiple buildings with one intent —
the browser ships the single-building variant (group selection of buildings
is not a browser UI concept yet).

## 4. Validation taxonomy + refund question

Upgrade gates (GUI.BuildingList, dump.cs:57100-57140):
`CanBuildingUpgrade`, `IsBuildingUpgrading` (no concurrent upgrades),
`IsLackEnergy`, `IsLackResources` — the energy gate is dormant in the browser
until G6/I8 (energy shortage) exists. The native per-command `$CMA(Battle)`
validators (short return, slot 9 on every AIComm) are the authoritative
validate-before-apply rule set and are `[AWAITING BINARY]` for all five
commands — the browser keeps its validate-before-journal discipline with the
structural rules decoded here (owner/producer/built/funds/queue-cap).

**Refund rule: unknown.** No named refund surface exists in dump.cs (only
IAP `GooglePurchaseState.Refunded` and localization `REFUNDORDER`);
stringliteral.json holds an isolated lowercase `"refund"` @0x9969AA8 with no
recoverable enclosing format string. The browser ships **100% refund on
cancel labeled `[INFERRED]`** — the minimal coherent rule, flagged in the
audit row and in `r1-prototype-data-pipeline.md` as a device-session question
(capture a native cancel and read the funds delta).

## 5. Browser fold-in (v=62 → v=63)

Kernel (`docs/game.js`), all journaled through the existing
validate-before-journal `Commands.execute` path and lockstep-routed:

- `produceCancel{defId, owner}` (G1) — removes the newest matching queue
  entry, refunds `UNITS[defId].price` `[INFERRED 100%]`, `refreshEconomy()`.
- `rally{buildingId, cells, owner}` (G2) — validates own built production
  building (`PRODUCER_OF` set ⇔ native `IsRallyPointAllowed` class), stores
  `b.rally` (≤16 cells, quantized in `stateString`); spawn hook: produced
  units of a building with rally receive a move order to the LAST rally cell
  `[INFERRED]` (native traversal of intermediate waypoints is
  `[AWAITING BINARY]`; cells are stored verbatim so the contract survives).
- `repair{buildingId, owner}` (G3) — **dormant-ready**: requires
  `def.repairPrice` (the `BuildingLevelType.repair_price` counterpart, R1
  data — no invented balance values); price = `calcRepairPrice` analogue
  `ceil(repairPrice × (1 − hp/maxHp))` `[INFERRED arithmetic]`, funds
  escrowed upfront `[INFERRED]`, deterministic duration rule
  `REPAIR_DURATION_FULL_S = 8 s × missing fraction` `[BROWSER — the native
  rule is a server-delivered duration, not a client formula]`; progress +
  completion per `LCBuildingRepairInitiate/Completed`; destroyed building
  cancels (refund escrow) `[INFERRED]`.
- `upgrade{buildingId, owner}` (G4) — **dormant-ready**: requires
  `def.upg = {price, time}` (the `upg_lvl.{cost_c, time}` counterpart, R1
  data); blocks while upgrading/repairing `[INFERRED mutual exclusion]`;
  completion raises `b.level` (new field, `LCBuildingProcessCompleted`
  analogue) with health rebase awaiting per-level prototypes `[AWAITING R1]`
  — no invented stat multipliers.
- `stateString()` B-line extended additively (H1 column discipline):
  `lv` level, `ra` rally cells, `ug` upgrade progress, `rp` repair progress —
  hash-covered from day one.
- `LOCKSTEP_NET_TYPES` += the four new types (MP parity with
  produce/build).
- UI: right-click on own built production building (no units selected) sets
  rally; right-click on a production card cancels one queued unit of that
  type (native cancel-by-unitType); repair/upgrade buttons stay hidden until
  config data lands (dormant, no dead UI).

Tests: `reverse/evidence/tests/building-commands.test.js` — cancel
(refund/queue/journal), rally (validation + spawn-follows-rally + hash),
repair/upgrade full cycles on fixture defs (config-gated dormancy proven by
asserting rejection without config), stateString coverage of every new
field, same-seed determinism with the new commands, lockstep set membership.

## 6. Verdict

G1/G2 structure **CONFIRMED** (payload shapes + application commands +
sender signatures `[NATIVE]`; refund fraction `[INFERRED]`; waypoint
traversal `[INFERRED]`), G3/G4 structure **CONFIRMED** (server-delivered
durations + per-level config chain `[NATIVE]`; browser duration/price rules
`[BROWSER]/[INFERRED]`; stat deltas `[AWAITING R1]`). I4 ships its kernel
half (command types + sim handlers + journal + hash coverage + minimal UI);
the numeric half is R1-bound exactly like production values. Remaining
binary-gated questions (refund rule, rally shorts, calcRepairPrice
arithmetic, repair_pause, `$CMA` validators, get_Type ids) are recorded in
the evidence file's NEGATIVES section and in the registry — they ride the
same tooling-gate as the R7 script.json re-open.
