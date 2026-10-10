# R7 — Sight / Visibility Native Analysis (AOW3 6.9.18)

**Status:** PARTIALLY_CONFIRMED (architecture `[DECOMP]`-confirmed; shape-table byte
values pending pass 3). Converts fidelity-audit gap **H4** from `APPROXIMATE`
(design) to `PARTIALLY CONFIRMED` (evidence-backed architecture).
**Session:** Task 54 (R7 pass 1+2). **Evidence:**
[`../evidence/vision/sight-jumptable-decode.txt`](../evidence/vision/sight-jumptable-decode.txt)
(+ 9 raw decode artifacts in the same directory).
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
   `AICommBuSet.$Ik(x, y, cx, cy, r, fogLines)` (0x48E649C):
   `|dy| > r → false`; `fogLines == null → true`; else
   **`|dx| < fogLines[r][|dy|] / D`** — a per-row horizontal half-extent
   lookup. The client mirrors it verbatim:
   `ClientUnbuildZoneContainer.IsCellInCircle(...)` tail-calls `$Ik`.
4. **A second, bit-packed variant** — `CheckAndCalc.$ec(fogLines, x0, y0, x1, y1)`
   (0x46D2E7C; **33 callers** across UnitAct/PathAct/FlagAct/BuildingAct/
   BattleAct/commands) reads `(R+dy)·S + (R+dx)` centered-grid bytes with
   per-radius `(byte & M) >> N` bit extraction — **multiple radius levels
   bit-packed per byte**. This is the sim's universal geometry service.
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

## 4. What is NOT yet recovered (→ pass 3)

The **byte values** of the fog-line tables. Provenance established:
- **Not server-delivered**: `BattleAllianceDescriptionSTDeserializer.deserialize`
  reads exactly 3 ints, no arrays.
- **Producer located**: `BattleSide.$iu` stores `Battle.$Mc` at 0x469794C; the
  value chain runs through Obfuz method-bridge calls (`0x5265B74` with
  encrypted method ids, e.g. `(0x144,0x11,0x2927AB7E)`, `(0x150,0x3D,0x27428CBF)`)
  and runtime array allocations — i.e. **computed at battle/side init, inside
  Obfuz-encrypted methods**. Recovering the values = emulate the bridge (same
  technique family as the R2 static pool decode; `obfuz_secret_key.bin` already
  committed). Also still open: the `$ec`/`$Ik` decoded statics (R = `0xD4`,
  S = `0x30`, M = `0x400`, N = `0x14`, D) once bridge values land.

## 5. Browser parity state & fold-in decision

`docs/game.js` `updateVision()` reveal uses a runtime Euclidean disc
(`Math.hypot(gx−x, gy−y) <= r`). Native uses table lookup
`|dx| < fogLines[r][|dy|]/D`. The two are indistinguishable **iff** the native
tables encode the exact Euclidean disc (the client method name
`IsCellInCircle` supports but does not prove this; the tables may be
hand-quantized per radius). **Decision (fold-in protocol):** comment-only
provenance annotation on the reveal kernel; **no behavior change** — any change
before table values are recovered would be `[SPECULATIVE]`. Cache bumped
`v=56 → v=57` per §35.1 (comment change in game.js).

## 6. Labels

Everything in §2/§3 is `[DECOMP]` (Capstone decode of `8ace05bb…` bytes) except
where marked `[NATIVE]` (dump.cs metadata facts) and the `BattleAlliance.$hE=16`
rung guess (`[INFERRED]`). Repro: re-run
`scripts/native/{sight_act_disasm,fog_jumptable_decode,bl_xref_scan,circle_primitive_disasm,fogtable_store_scan}.py`
against `libil2cpp.so` (`8ace05bb…`) — script set preserved at
`/home/z/my-project/scripts/native/` and mirrored by the committed evidence
outputs.
