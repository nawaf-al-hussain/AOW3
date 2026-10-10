# R7 — Sight / Visibility Native Analysis (AOW3 6.9.18)

**Status:** PARTIALLY_CONFIRMED (architecture + membership-test semantics
`[DECOMP]`-confirmed; the fogLines byte VALUES remain runtime data — see §4).
Converts fidelity-audit gap **H4** from `APPROXIMATE` (design) to
`PARTIALLY CONFIRMED` (evidence-backed architecture + decoded membership
contract).
**Session:** Task 54 (R7 pass 1+2), Task 57 (pass 3 — this update). **Evidence:**
[`../evidence/vision/sight-jumptable-decode.txt`](../evidence/vision/sight-jumptable-decode.txt),
[`../evidence/vision/ik-ec-constants-decode.txt`](../evidence/vision/ik-ec-constants-decode.txt)
(+ raw decode artifacts in the same directories).
**Provenance:** `libil2cpp.so` `8ace05bb…`, `dump.cs` `0050e67d…` (XAPK `1a41e033…`
re-fetched from repo LFS blob `58faba3f` — blob in git history is an LFS pointer;
recovered via GitHub LFS batch API, sha256 re-verified).

## 1. Question

R7 (audit §7): *What are the native visibility/sight rules?* Pass 2 specifically
(user-scoped): *decode the kernel jump tables → the exact reveal shape.*

## 2. TL;DR

The native fog is **not** a runtime `dx²+dy² ≤ r²` test. It is a **precomputed,
per-radius, per-row-extent table system** ("fog lines") consumed through a
bit-packed visibility bitmap, driven from the deterministic command stream and
per-tick acts:

1. **Three-state fog** — `BattleCellFoggyState { Clear=0, Fogged=1, Dark=2 }`
   (dump.cs:262733): visible-now / explored-not-visible / never-seen.
2. **Per-alliance packed visibility bitmaps** — `BattleAlliance` holds two
   `int[][]` buffers (`$HE // 0x30`, `$iE // 0x38`): 32 cells packed per int,
   row-major. `FogAct.$rd` writes spans with run-of-ones masks — `orr` to
   reveal, `bic` to un-reveal (`((1<<n)-1) << off` computed in `$rd` case 1,
   0x4735958). The two buffers + the 3-state enum give the classic RTS fog.
3. **Reveal shape = `sbyte[][]` "fog lines" tables** — `Battle.$kc // 0x2B8`,
   `Battle.$Mc // 0x2D0`, `BattleAlliance.$kE // 0x58`. Membership test
   `AICommBuSet.$Ik(x, y, cx, cy, r, fogLines)` (0x48E649C), pass-3 decoded:
   `|dy| > r → false`; bounds-checked row select (null fogLines THROWS);
   **`|dx| <= (sbyte) fogLines[r][|dy|] / 2`** — per-row horizontal half-extent
   in HALF-CELL fixed-point (divisor D = 2, pool-decoded), inclusive bound
   (the `statics[4]*statics[8] = 0` polarity gadget returns the inside test).
   The client mirrors it verbatim:
   `ClientUnbuildZoneContainer.IsCellInCircle(...)` tail-calls `$Ik`.
4. **A second, packed variant** — `CheckAndCalc.$ec(fogLines, x0, y0, x1, y1)`
   (0x46D2E7C; **33 callers** across UnitAct/PathAct/FlagAct/BuildingAct/
   BattleAct/commands) reads `(R+dy)·S + (R+dx)` bytes from a (2R+1)² = 31×31
   grid and returns `(byte & 0xFF) >> 3` — **per-cell levels in 1/8-cell
   fixed-point** (R = 15, S = 31, N = 3, pass-3 decoded). This is the sim's
   universal geometry service.
5. **Reveal drivers (BL xref, 2.67M BLs scanned)** — per-unit sight:
   `FogAct.$pd → $Qd`; per-tick acts: `$Od` (0x48E8 B, 7 flattened dispatch
   states) fires `$qd`/`$Qd`; **bullets reveal**: `UnitAct.$oh → $sd(Bullet)`;
   **flags reveal**: `FlagAct.$xC` (Flag.Sight is `sbyte`);
   **command-driven rect opens**: `GAICommandFogOpener { x, y, w, h, tick }`
   `.execute` calls both `$qd` and `$Qd`.
6. **Sight stat plumbing** — `Unit.sight_curr:int // 0xBC`,
   `Unit.calcSightCurr()/calcSightState(int)`, `EStat FogRadius = 31`,
   `Fraction.ForestSightDrop` (forest blocks sight), `ShieldFogRadius`,
   hero `BeholderSightInterval/Max/DamageDelay`,
   `UnitSpecialStatFactory.CreateStatsForFog(...)`. `BattleAlliance`
   const `sbyte $hE = 16` (likely max radius rung — `[INFERRED]`).

## 3. Jump-table decode (the pass-2 deliverable)

All FogAct bodies are control-flow-flattened (dispatch re-reads a static state
int; each arm chains to the next state slot). Seven genuine PC-relative jump
tables were extracted and decoded (form: `adr base; ldrh w,[rodata,idx,lsl #1];
add base,w,lsl #2; br` — u16 entries are byte-offset/4):

| site | bounds | u16 table | code base | cases |
|---|---|---|---|---|
| `$nd` jt1 | 13 | `0x1B0D1F6` | `0x472EE64` | 13 |
| `$Od` jt1 | 29 | `0x1B0D212` | `0x472FC88` | 30 (act dispatcher) |
| `$Od` jt2 | — | `0x1B0D24E` | `0x4730D20` | (2nd dispatch) |
| `$Od` jt3 | 16 | reg | `0x4732BFC` | 17 |
| `$Rd` jt1 | 18 | reg | `0x4733F8C` | 19 |
| `$Pd` jt1 | 31 | reg | `0x47349EC` | 32 |
| `$rd` jt1 | 18 | `0x1B0D302` | `0x473575C` | 20 |

Key arms: `$rd` case 1 computes the span mask (`w21 = ((C<<n) − C) << off` with
the `0xCB5E3C38` add-decode key); case 4 `bic` (un-reveal), case 5 `orr`
(reveal), both stored back through the bounds-checked `row[col]` path
(`0x47359DC`). Virtual tail-calls (`br x3` after `ldr x3,[x,#0x…/0x230]`) were
correctly excluded — not jump tables.

## 4. Pass 3 — what was decoded, what is still open

**Decoded (Task 57, [`../evidence/vision/ik-ec-constants-decode.txt`](../evidence/vision/ik-ec-constants-decode.txt))**:
- **`$Ik` membership contract**: `|dx| <= (sbyte) fogLines[r][|dy|] / 2` with
  divisor **D = 2** (`$gK(seg[statics+0x3830], 0x5D0, 0x3D, 0x27428CBF)` = 2,
  raw `0xa3af9c8d` — the Task-55 live-pool raw-word family), INCLUSIVE bound
  (the `statics[4]*statics[8] = 0` gadget returns the inside test), `null`
  fogLines THROWS (pass 2's "null → true" and strict-`<` both corrected).
- **`$ec` packed-grid constants**: R = `0x7FE0CA87 ^ 0x7FE0CA88` = **15**,
  S = `0x34A1C3E7 + 0xCB5E3C38` = **31** (= 2R+1; matches Battle consts
  `$cc = 31 / $Cc = 15`), M = **0xFF**, N = **3** → 31×31 signed-byte grid,
  `(b & 0xFF) >> 3` = 1/8-cell fixed-point levels.
- **All constants live in ONE global statics class** (klass ccache slot
  `0x968E4D8`) — the same class the R2 697-value holder `.cctor` writes
  (697/697 stores re-attributed to it; 631/631 int/float pool records
  cross-checked).
- **Pass-2 correction**: `BattleSide.$iu` does NOT produce `Battle.$Mc` — the
  0x469794C store is `BattleSide.$ch = new List<BuildingDestroyed>(capacity)`
  (x19 field fingerprint: +0x2E0 RedeployInfo, +0x360 List<BonusChest>, …).
  `$iu` is a plain field initializer; its `$gK` reads are container capacities
  from a mix of committed (0x2820 → 2, the DEFEND key family) and uncommitted
  segments.

**Still open (fogLines byte VALUES)** — `[BLOCKED-STATIC]`, precisely bounded:
- No client-side producer: field stores = setter bodies only; setter BL callers
  = 0; byte-grid writers absent; Battle init surface (`$HL` 0x5C84 B, `$ju`,
  `$iu`, `$Iu`, `$fb`) has no `array_new`; pool strings carry no tables; the ST
  serializer/deserializer never touch `$kc/$Mc` (→ still NOT server-delivered;
  `BattleAllianceDescription` reads 3 ints — pass 2, holds).
- The tables are therefore filled through **virtual setter dispatch
  (`$ZM/$Pn/$HS` callvirt)** whose static closure needs Il2CppDumper
  `script.json` (not recovered) or a device dump. Membership equivalence with
  the browser's Euclidean disc is PROVED for consistently-built tables — the
  residual risk is only hand-tuned extents (±1 edge cells per row).

## 5. Browser parity state & fold-in decision

`docs/game.js` `updateVision()` reveal uses a runtime Euclidean disc
(`Math.hypot(gx−x, gy−y) <= r`). Native uses the table lookup
`|dx| <= (sbyte) fogLines[r][|dy|] / 2`. For a consistently-built Euclidean
table (extent ∈ {2·⌊√(r²−dy²)⌋, 2·⌊√(r²−dy²)⌋+1}) the two are PROVABLY
identical on integer cells; the observable delta exists only if the runtime
tables hand-tune extents — and the bytes are `[BLOCKED-STATIC]` (§4).
**Decision (fold-in protocol):** comment-only provenance annotation on the
reveal kernel (updated with the decoded contract); **no behavior change** —
any change before table values are recovered would be `[SPECULATIVE]`.
Cache bumped `v=57 → v=58` per §35.1 (comment change in game.js).

## 6. Labels

Everything in §2/§3 is `[DECOMP]` (Capstone decode of `8ace05bb…` bytes) except
where marked `[NATIVE]` (dump.cs metadata facts) and the `BattleAlliance.$hE=16`
rung guess (`[INFERRED]`). §4 pass-3 items are `[DECOMP]` (decoded via the
shared R2 Obfuz core + operand scans); the fogLines byte values and `$ec`'s
rowIdx/aux bounds are `[BLOCKED-STATIC]`/PENDING as marked. Repro:
`reverse/tools/r7_ik_ec_constants_decode.py` (pass-3 constants, emits
`reverse/evidence/vision/ik-ec-constants.json`) and the pass-1/2 script set at
`/home/z/my-project/scripts/native/` mirrored by the committed evidence outputs.
