# R7 — Native Sight / Visibility Rules (pass 1) — AOW3 6.9.18

Question (fidelity audit §7 R7; gap H4): what are the native fog-of-war / sight rules?
Status after this pass: **PARTIALLY_CONFIRMED** — client contract + radius provenance
CONFIRMED; battle-core grid openers remain Obfuz-protected (bounded residual).
Evidence: `reverse/evidence/fog/r7-fogact-scan.txt`, `r7-sight-writers.txt`,
`r7-writer-functions.txt`. Tool: `reverse/tools/r7_fog_sight_scan.py`,
`r7_sight_writer_scan.py`, `r7_writer_functions.py`.
Provenance: libil2cpp.so sha256 `8ace05bb…`, dump.cs sha256 `0050e67d…` (XAPK
`1a41e033…`, re-verified on extraction this pass).

## 1. Architecture: fog is server-authoritative [DECOMP]

The client does NOT compute sight. The battle core computes per-alliance fog grids and
ships states to the client as logic commands:

```
Battle core (authoritative)                    Client (application + rendering)
FogAct statics over Battle/BattleMap/   ──►    LCUnitFogVisibleChanged {m_unitId 0x1C,
  BattleAlliance, int[][] grids                 m_visibleState 0x20 = sbyte}
  ($nd/$Nd/$od/$Od/$pd/$qd/$Qd/$rd/     ──►    LCMineFogVisibleChanged / LCBuildingFogVisible-
  $Rd/$sd/$Sd/$td; 0x472ED8C..0x4736xxx)         Changed / LCAllianceFogChanged
Unit.calcSightCurr refreshes sight     ──►    LCUnitFoggerOn/Off/VisibleChanged (stealth)
                                              → ClientUnit.m_visibleState @0x98,
                                                m_visibleType @0x108 → BattleFogRenderer /
                                                GUIBattleMinimapFogRenderer
```

Structures decoded:

- `BattleAlliance` fields `$HE` (0x30) and `$iE` (0x38) are both `int[][]` — the
  per-alliance fog grids (two grids per alliance; explored vs currently-visible
  split INFERRED from FogOpener removal pairs + renderer behavior; exact per-cell
  value names need the grid-opener decode).
- `BattleMap.$if` (0x30) is `List<int[][]>` — the map-level grid set.
- `FogAct.$qd/$Qd/$rd(Battle, int[][], sbyte, int, int, int, bool...)` — grid
  openers taking (x, y, radius)-shaped int triples + flag pairs; Obfuz-protected
  jump-table bodies (same class as `$Pg`; capstone census captured in evidence).
- `FogAct.$pd(Battle, BattleMap, Unit, Dynamic)` (0x4733968) — per-unit fog
  contribution; iterates side/alliance arrays, dispatches on a category switch
  (cmp 1/2/5/6), reads holder statics (usage slots 0x968e4d8/4e0/4f0) with XOR-pair
  constants — decode follows the Builds I/J method; bounded residual this pass.
- `FogAct.$sd(Battle, Bullet, sbyte)` — **bullets open fog** (shape args sbyte).
- `FogOpener : GearGamesSerializable` (0x10..0x28): `sbyte $aj; int $Aj,$bj,$Bj,$cj,$Cj; bool $dj`
  — the network fog-open payload (7 fields; consumed by `GAICommandFogOpener{,Remove}` —
  AI can open/remove fog, matching depots/capture points revealing).

## 2. Visibility state enums (client contract) [DECOMP]

```csharp
enum ClientUnitVisibleState  // dump.cs:268434
  { Undefined = -1, Invisible = 0, Hidden = 1, Visible = 2, Detected = 3 }
enum ClientUnitVisibleType   // dump.cs:268446 (presentation)
  { Undefined = -1, Visible = 0, HiddenInForest = 2, Detected = 3, DetectedInForest = 4 }
enum ClientBuildingVisibleState // dump.cs:265554
  { Undefined = -1, Invisible = 0, Fogged = 1, Visible = 2 }
```

- Unit states distinguish **Hidden (1)** from **Visible (2)** and **Detected (3)**:
  stealth (Fogger) units are Hidden until detected — matches the browser's
  HIDE_DETECT ambush reconstruction (game.js hide pass).
- `ClientUnitVisibleType.HiddenInForest/DetectedInForest` — **forest concealment is a
  first-class presentation state**, not just a radius modifier.
- Buildings have a 3-state fog model (Invisible/Fogged/Visible) — fogged buildings
  stay rendered greyed, unlike units.

## 3. Radius provenance: `Unit.calcSightCurr` (0x45B19F8) — FULLY DECODED [DECOMP]

Plain-named method (not Obfuz-renamed). Body (1392-B window, evidence r7-writer-functions.txt):

```
sight_curr = UnitStateType.get_Sight()            ; state.sight @0x4C (serialized "sight",
                                                  ; dump.cs:17287 — EStat 10 view domain)
if (this.in_forest @0x18F != 0):
    obj = this.<vtbl 0x1F8>()                     ; null-checked
    sight_curr -= (sbyte)obj.<vtbl 0x1998>()      ; forest sight penalty (sxtb)
if (this.boostEffects @0x140 != null):            ; short[] (IL2CPP array)
    if (boostEffects.Length < 4) → bounds throw   ; tst w9,#~3 / bl throw
    sight_curr += boostEffects[3]                 ; ldrsh [arr+0x26] = short[3]
```

Field identities CONFIRMED from plain names in dump.cs: `Unit.sight_curr` (0xBC, int),
`Unit.in_forest` (0x18F, bool; client twin `in_forest_client` 0x190),
`Unit.boostEffects` (0x140, short[]), `BoostType.ACT_SIGHT = 3` (dump.cs:376978 —
the boost array slot index used here), `BoostType.ACT_SIGHT_BU = 13` (a second
sight-family act).

INFERRED (exact slot names need script.json vtable resolution — regenerable):
the in-forest penalty object is the occupied cell / terrain provider
(Unit klass vtbl entry @0x1F8 → provider klass vtbl entry @0x1998 returning sbyte).

Also confirmed structurally:
- `Unit.get_SightCurr` (0x45B134C) / setter (0x45B1354) — **0 direct BL callers**
  (virtual dispatch, same as MaxStatValueProvider.Get in Build J); consumer census
  therefore requires vtable-slot analysis, not BL scans (recorded for pass 2).
- `UnitStateType` carries `sight` 0x4C / `sight_init` 0x50 / **`radar` 0x5C** /
  `invisible` 0x70 (sbyte stealth marker) — `BuildingLevelType` has its own
  get_Sight/get_SightInit/get_Radar; `Flag.get_Sight` exists (capture flags see).
- Beholder "oversight" hero mechanic: `SightAbilityParamDescription`
  (dump.cs:170971), `m_beholderSightInterval/Max/DamageDelay` (dump.cs:256205..),
  `SetupAndPlayOversightEffect(int sightAdd, out int currentSight)` (dump.cs:278626)
  — hero abilities mutate sight additively (the boostEffects[3] analog).

## 4. Browser comparison (H4 deltas)

| Aspect | Native (6.9.18) | Browser v=57 | Delta |
|---|---|---|---|
| Authority | server computes per-alliance grids | local sim kernel computes per-seat masks | architectural (browser IS the authority; matches offline skirmish; MP design unaffected — lockstep sim state is hashed) |
| Radius source | `calcSightCurr`: state.sight − forest penalty + boostEffects[3] | static `def.view` (EStat 10 domain) | **dynamic terms missing** (in_forest, boosts) — documented approximation |
| Reveal shape | grid opener bodies Obfuz-protected (UNKNOWN this pass) | Euclidean circle (`hypot <= r`) | unverified |
| States | unit 5-state (+2 forest presentation), building 3-state | visible/explored/unexplored trichotomy | stealth Hidden/Detected reconstructed in hide pass; fogged-building presentation approximate |
| Grids | 2 per alliance (+map-level list) | visible[] per seat + explored[] shared | structurally analogous (explored vs current) |

## 5. Next actions (R7 pass 2+)

1. Decode `FogAct.$qd/$Qd/$rd` jump tables with the Builds I/J method
   (holder statics → obfuz-pool-values.json) — recovers the exact reveal shape
   (Euclidean vs Chebyshev) and the grid value semantics per cell.
2. Vtable-slot resolution for the in-forest penalty provider (needs
   Il2CppDumper `script.json` — regenerable per reverse/README.md).
3. `Battle.$GL` (0x4634104, 11.7 KB) — candidate fog recompute tick; its six
   `#0xBC` hits were stack-local false positives, but the function's structure
   (side iteration + alliance masks) merits the pass-2 treatment alongside $pd.
4. Fold-in the dynamic sight terms once forest cells are classifiable from map
   decor data (in_forest) and the boost pipeline exists (boostEffects[3]).

## Version

- Game 6.9.18; analysis pass 1 executed 2026-10-09 (this session).
- Confidence labels per AGENTS.md §9; nothing here is balance-value-derived.
