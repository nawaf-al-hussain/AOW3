# V8 — Reference-validation harness (visual-fidelity-audit §21/V8)

Repeatable comparison between the browser build's render and the original game's
render of the same fixed-seed scenario. The harness produces the **browser side**
today; the **device side** arrives with the R1 on-device session (shared cost —
one device pass feeds both R1 balance capture and these references).

## What lives here

| file | meaning |
|---|---|
| `manifest.json` | scenario definitions: seed, viewport, camera pose (`__DBG.cam` probe semantics, AGENTS.md §35.3) |
| `shot-<id>.png` | browser build capture (headless Chromium via `reverse/tools/visual_harness.mjs`) |
| `ref-<id>.png` | original-device capture of the same scenario — **[AWAITING R1 device run]** |
| `sbs-<id>.png` | labeled side-by-side, generated only when a `ref-<id>.png` exists |
| `results.json` | machine-readable capture record + 8×8 average hashes + Hamming distances |
| `REPORT.md` | regenerated human-readable summary |

## Run

```bash
node reverse/tools/visual_harness.mjs              # all scenarios
node reverse/tools/visual_harness.mjs --only tactical-close
```

Requires `playwright` (with its Chromium) resolvable from `node`. The script
serves `docs/` on loopback, loads `index.html#seed=<seed>`, clicks the battle
start, waits for the heightmapped terrain + real-map decals + sim tick, drives
the camera to the manifest pose, and screenshots after settle.

## Device-reference capture spec (R1 session, shared cost)

Executed as steps S2–S3 of the consolidated single device pass in
`reverse/evidence/prototype-data/on-device-run.md` (§ "Single-pass consolidation") —
one session also produces the R1 balance dump and the V1-b camera angulation numbers.

Same ids, same 1280×720 landscape viewport, same seed/scenario semantics:

1. On the device, reach the same jungle map at the same in-battle moment class
   (HQ visible, early battle — units near start positions).
2. Align the camera by landmark to the browser shot's framing (the original's
   angulation numbers are `[NOT FOUND LOCALLY]`; exact numeric pose match is
   not possible until they are recovered — landmark alignment is the protocol).
3. Screenshot, pull the file, save as `ref-<id>.png` here. No editing/rescale
   beyond what the device produced — provenance stays raw.
4. Re-run the harness; it detects refs, composes side-by-sides, and records
   Hamming distances between 8×8 average hashes.

## Interpretation rules (honesty constraints)

- The hash is a **coarse regression signal** for browser-vs-browser runs
  (detect unintended renderer changes between commits), **not** a fidelity
  verdict against the device.
- **No percentages, no "X% match" claims** — images and hashes only; judgment
  happens in notes/ and worklog entries, citing specific differences.
- Probes (`__DBG`, `__aow3`) are QA-only per AGENTS.md §35.3 — never gameplay
  state; the harness writes nothing back into the sim.
- Scenario seeds/poses are versioned in git: a renderer change that shifts
  these screenshots must be able to explain the shift, same discipline as the
  determinism suites.
