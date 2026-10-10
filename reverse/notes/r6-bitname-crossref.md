# R6 — TakePositions cell-class bit names RECOVERED (cross-ref closed, offline)

**Task 59 (2026-10-10).** Answers the R6 residual left by Build I
(`defend-chase-takepos-decode.md` §2.4: "per-bit meaning INFERRED — the
mask consumer chain that would name them is not reachable from this class").

The names were not reachable from `UnitTakePositionsManager` because the
bit space does not belong to it. It belongs to **`ClientBattleCell`**
(dump.cs:262577, namespace `com.geargames.aow.scenes.battle.entities`) — the
client battle cell whose **`m_passMask` (short, offset 0x38)** is the very
15-bit mask the takepos manager ANDs with. The cross-ref chain:

```
UnitTakePositionsManager.GetUnitOccupancyMask  ──produces──▶ blocked-state mask
ClientBattleCell.CheckByMask(mask)             ──tests───▶ m_passMask (this+0x38)
ClientBattleCell consts + ctor LUT + mutators  ──name────▶ the 15 bits
```

## 1. The predicate — CheckByMask decoded [DECOMP] (CONFIRMED)

`ClientBattleCell.CheckByMask(short mask)` @ **0x8054284**, 16 bytes:

```
ldrh  w8, [x0, #0x38]   ; m_passMask
tst   w1, w8            ; mask & m_passMask
cset  w0, eq            ; return (mask & m_passMask) == 0
ret
```

**CheckByMask(mask) == true ⟺ the cell's passMask has NO bit in common with
`mask`.** The takepos "occupancy masks" are therefore **blocked-state masks**:
`GetUnitOccupancyMask` returns the set of cell states that DISQUALIFY a cell
for that unit, and a cell is take-position-legal for a unit iff
`(unitMask & cell.m_passMask) == 0`. This reading makes every arm of the
Build-I partition land on gameplay sense (§4) and retires the "allowed-set"
guess. `get_CellsMask` staying reader-less is fine: the consumer is the
`CheckByMask` call inside `SendNearestUnitToCell` (0x81D4954), via
`TryGetCell(Point2i, out ClientBattleCell)` (ClientBattleMap, 0x8054284 is
the cell-side half).

## 2. The bit table — 13 named, 2 reserved [CONFIRMED]

`ClientBattleCell` const literals (dump.cs:262597-262621), each independently
confirmed by at least one writer/initializer in the binary (§3):

| bit | value | const name | set/cleared by (writer evidence) |
|----:|------:|------------|----------------------------------|
| 0 | 0x0001 | `BarrierMask` | `AddBarrier` orr #0x1; ctor terrain LUT kind 3 |
| 1 | 0x0002 | `LandMask` | ctor terrain LUT kind 0 |
| 2 | 0x0004 | `ForestMask` | ctor terrain LUT kind 4 (Land\|Forest) |
| 3 | 0x0008 | `ShoreMask` | ctor terrain LUT kind 1 |
| 4 | 0x0010 | `WaterMask` | ctor terrain LUT kind 2 |
| 5 | 0x0020 | `FogMask` | fog-state writer `and #0xFFFFFF9F` (clears 5+6) |
| 6 | 0x0040 | `DarkMask` | fog-state writers `and #0xFFFFFFBF` / `#0xFFFFFF9F` |
| 7 | 0x0080 | — (reserved) | no const, no writer in the client kernel |
| 8 | 0x0100 | `BuildingMask` | `BuildingEnter` orr #0x100 / `BuildingLeave` and #0xFFFFFEFF |
| 9 | 0x0200 | `BuildingBandMask` | `BuildingBandEnter` orr #0x200 (+band count) / `BuildingBandLeave` and #0xFFFFFDFF |
| 10 | 0x0400 | `BuildingBarrierMask` | ctor orr #0x400 (when cell not crossable); `RemoveUnbuild` and #0xFFFFFBFF |
| 11 | 0x0800 | `VisAndInvisUnitMask` | `UnitEnter` orr #0x800 / `UnitLeave` and #0xFFFFE7FF |
| 12 | 0x1000 | `VisAndInvisEnemyUnitMask` | `UnitEnter` orr #0x1000 / `UnitLeave` and #0xFFFFEFFF |
| 13 | 0x2000 | `CameraInvisibleMask` | `set_IsCameraVisible` (tests #0x2000), init |
| 14 | 0x4000 | — (reserved) | no const, no writer in the client kernel |
| 15 | — | outside the clamp | `CalculateCellsMask` initializes to 0x7FFF (15 bits) |

**Bits 7 and 14 are reserved**: no `ClientBattleCell` const names them, no
composite const includes 0x80 or 0x4000, and no client writer sets them
(whole-class ORR/AND census, evidence `r6-passmask-writers.txt`). They are
reachable only if the server-set cell stream ever carries them; the takepos
static masks never block them, so they are placement-don't-care today.

The composite consts reproduce the takepos arms EXACTLY — the strongest
naming cross-check:

| const | value | bits | takepos consumer |
|-------|------:|------|------------------|
| `LandBuildingExitCellMask` | **0x215D** | = MaskAll & Land | infantry/vehicle/land-hero arm |
| `WaterBuildingExitCellMask` | **0x214F** | = MaskAll & ~Water | ship arm |
| `FullInvisibleCellMask` | **0x2060** | Fog\|Dark\|CamInvis | ctor passMask initializer |
| `MineLandCellMask` | 0x215D | same as Land exit | (alias) |
| `MineWaterCellMask` | 0x214F | same as Water exit | (alias) |
| `LandBuildingBandCellMask` = `WaterBuildingBandCellMask` | 0x2100 | Building\|CamInvis blocked | band queries |

Take-positions legality per domain == the cells where land/water building
**exits** (and mines) are legal. One semantic system, two consumers.

## 3. passMask lifecycle [DECOMP] (CONFIRMED)

`ClientBattleCell.ctor(BattleCell, raycaster)` @ 0x8053C2C:

1. `m_passMask = 0x2060` (`FullInvisibleCellMask`) — every cell starts
   fogged/dark/camera-invisible.
2. terrain-kind byte from the cell entity (vtbl call, `& 0xFF`); **if ≤ 4**,
   `m_passMask |= LUT[kind]` with the LUT at **0x1BFE5BC** (5 × u16):

   | kind | LUT | bits |
   |-----:|----:|------|
   | 0 | 0x0002 | Land |
   | 1 | 0x0008 | Shore |
   | 2 | 0x0010 | Water |
   | 3 | 0x0001 | Barrier |
   | 4 | 0x0006 | Land\|Forest |

   (kind > 4 → no terrain OR; the byte is the only server-sourced input.)
3. bool getter on the cell entity — if FALSE, `m_passMask |= 0x400`
   (BuildingBarrier): non-crossable cells carry the barrier-band bit.
4. level sbyte getter → `m_level` (+0x3A); `m_buildingBandCount = 0`.
5. Dynamic thereafter: fog state rewrites bits 5/6, `AddBarrier` sets bit 0,
   `BuildingEnter/Leave` bit 8, `BuildingBandEnter/Leave` bit 9 (+count at
   +0x3B), `UnitEnter/Leave` bits 11/12 (own vs enemy), camera visibility
   bit 13, `SetUnbuild/RemoveUnbuild` bit 10.

## 4. The takepos partition, re-expressed with names [CONFIRMED]

Blocked-set semantics (`CheckByMask` = no common bit):

| unit class | blocked mask | blocked states | legal cells |
|------------|-----:|----------------|-------------|
| category 0 / unknown hero id (error arm) | 0x215F (`MaskAll`) | Barrier, Land, Forest, Shore, Water, Dark, Building, CamInvis | none — every initialized cell carries a terrain bit → never placeable |
| INFANTRY (1) / VEHICLE (2) / land heroes {60,64,65,70,71,73,75,76} | 0x215D = `LandBuildingExitCellMask` | Barrier, Forest, Shore, Water, Dark, Building, CamInvis | Land cells (bit 1) — incl. infantry sub-type 2 variant that also allows Forest (0x2159 blocked) |
| AIRCRAFT (3) with IsHelicopterBehaviour / heli heroes {63,72} | 0x2040 | Dark, CamInvis | any visible cell — land, water, buildings, barriers (SOLARIS 72 = flying hero, consistent) |
| AIRCRAFT (3) fixed-wing | 0x215F (`MaskAll`) | all terrain states | never placeable |
| SHIP (4) | 0x214F = `WaterBuildingExitCellMask` | Barrier, Land, Forest, Shore, Dark, Building, CamInvis | Water cells (bit 4) only |
| SHIP (4) UNIT_TYPE 42 amphibian / heroes {62,74} | 0x2145 | Barrier, Forest, Water, Dark, Building, CamInvis | Land + Shore + Water |
| hero id 61 (dedicated arm) | 0x2040 / 0x215D | — | IsHelicopterBehaviour ? heli arm : land arm |

`CalculateCellsMask` (0x7FFF init, AND-reduce over the unsent group) is the
INTERSECTION of blocked sets = the states that disqualify a cell for every
remaining member — the coarse pre-filter; `SendNearestUnitToCell` then
re-checks each candidate unit's own mask before the Forced move.

**Correction to Build B/BUILD I wording:** "each of the last two masks is
the exact bit-complement of All" is wrong — 0x215F ^ 0xFEE0 = 0xDFBF. The
correct relation: each of Heli/Land is a *superset-in-union* of All
(`All | Heli = All | Land = 0xFFFF`); they share bits 6/13 (Heli) and
0/2/3/4/6/8/13 (Land) with All. The blocked-state reading is what makes the
arms correct; the old "allowed-set" phrasing never could.

## 5. Map-prefab cross-ref — what the prefab can and cannot contribute

`map.prefab.bundle` (1,705,382 bytes, the extracted jungle map) was re-scanned
object-by-object (evidence `r6-map-prefab-scan.txt`): **6,777 Transforms /
6,777 GameObjects / 6,371 MeshFilters+Renderers / 27 meshes / 26
MeshColliders / 106 MonoBehaviours (all ≤ 252 bytes) / 0 TextAssets**. The
7 MonoScripts are all render-side (`RendererSortingLayer`, `CloudInstantiator`,
`WaterSetup`, `MeshRendererSortingSettingsSetter`, `ParticleScaler`,
`TreeMaterialSetup`, `MapLightingSettings`). **The per-cell grid is not asset
data** — no cell/mask component exists in the prefab. The client builds cell
world-points by raycasting the prefab colliders
(`ClientBattleMap.ctor` → `GetCellRaycaster`/`RaycastDown`), while the
terrain-kind bytes arrive with the server battle setup (the
`BattleCellBasic/BattleCell` ST serializer family,
dump.cs:343295-343360, `GearGamesByteBuffer` wire format). A per-cell
empirical histogram (kind-vs-geometry overlay) therefore needs a captured
battle setup — the same device-capture blocker family as R1, and recorded as
the R6 residual.

The prefab still confirms the terrain *vocabulary* of the five kinds from its
6,371 placements: Ground ×391, Underbrush (bush/forest decor) ×229, Border
banding ×734, Stone/FlatRock ×78+, road ×83, `Tasharen Water` plane,
barrier/box/container props — i.e. Land / Land+Forest / Shore / Barrier /
Water are all materially present, and `WaterSetup` configures the water
surface. Naming, however, was closed in-binary (§2), not from geometry.

## 6. Method + reproduction

```
# CheckByMask + ctor + terrain LUT:
/home/z/.venv/bin/python3 reverse/tools/r6_bitname_crossref.py
#   -> reverse/evidence/combat/r6-checkbymask-decode.txt
# LUT dump + const census (bits 7/14 name hunt):
/home/z/.venv/bin/python3 reverse/tools/r6_lut_and_bits.py
# whole-binary passMask writer census (strh [x,#0x38]) + mutator decode:
/home/z/.venv/bin/python3 reverse/tools/r6_passmask_writers.py
#   -> reverse/evidence/combat/r6-passmask-writers.txt
# prefab object census:
/home/z/.venv/bin/python3 reverse/tools/r6_map_prefab_scan.py
#   -> reverse/evidence/combat/r6-map-prefab-scan.txt
```

Tools require `capstone` + `UnityPy` (`/home/z/.venv/bin/python3 -m pip
install capstone UnityPy`); inputs `libil2cpp.so`
(sha256 `8ace05bb…`), `dump.cs` (sha256 `0050e67d…`), `map.prefab.bundle`.

## 7. Residuals (bounded)

1. **Per-cell empirical overlay** — terrain-kind byte grid is server battle
   setup; needs a device capture (R1 session can carry it: dump the
   deserialized `BattleMap` cells). Would additionally reveal whether bits
   7/14 ever occur server-side.
2. Infantry sub-type identity for the Forest-allowing variant
   (`vt[0x348]()` object, field +0x10 == 2) — INFERRED mechanism, CONFIRMED rule.
3. Hero ids 60-69/76 and unit id 42 canonical names beyond the committed
   43-entry map (unchanged from Build I).

## Verdict

- CONFIRMED: the 15-bit takepos space == `ClientBattleCell.m_passMask`;
  13/15 bits named by in-binary consts with writer-level confirmation
  (bits 0-6, 8-13); bits 7/14 reserved (no const, no client writer);
  `CheckByMask` = `(mask & m_passMask) == 0` (blocked-state semantics);
  passMask lifecycle (0x2060 init → terrain LUT {Land, Shore, Water,
  Barrier, Land|Forest} → barrier-band OR → dynamic fog/building/unit/
  camera/unbuild updates); takepos arms == building-exit/mine legality
  consts (0x215D / 0x214F); per-category and per-hero partition re-expressed
  with named bits.
- CORRECTED: "Heli/Land masks are exact bit-complements of All" (Build B
  verdict + game.js comment) — union-supersets, not complements; blocked-state
  semantics is the correct model.
- The tribute's takepos model (player-driven nearest-match placement with
  category gates) stands; no behavioral delta — comment-only fold-in.
