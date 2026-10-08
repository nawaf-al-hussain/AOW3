# R1 — the on-device run (prototype/balance capture runbook)

One device session captures the live prototype/balance tables of AOW3 **6.9.18** and
converts the browser's largest `APPROXIMATE` category into evidence-backed data.
Pipeline, hook RVAs and provenance: `inventory.md` / `inventory.json` (same directory).
This file is written so the device portion can be executed without understanding the
rest of the reverse-engineering pipeline.

## Prerequisites

- rooted Android device **or** emulator running AOW3 **6.9.18** (`com.geargames.aow`)
  (any other version → STOP, do not mix datasets; record what you have instead);
- frida-server running on the device, matching the host frida CLI version;
- host: python3.9+, `pip install frida-tools` (decode helpers are stdlib-only);
- the repo (for hook scripts + decode tooling). The `.so`/XAPK are NOT needed on the device;
- ~50 MB free storage on the device for captures;
- **network**: captures contain the DES-encrypted *and* plaintext (post-hook) traffic of
  your own session. Do NOT send raw captures to anyone else; the sanitizer (§6) strips
  credentials before anything is committed.

## Install

    pip install frida-tools
    # device side: push frida-server matching your frida version and run it as root
    adb push frida-server /data/local/tmp/ && adb shell "chmod 755 /data/local/tmp/frida-server"
    adb shell "su -c '/data/local/tmp/frida-server &'"

## Launch

    adb shell monkey -p com.geargames.aow 1     # or tap the icon

## Attach + capture (the one command)

From the repo root (host):

    frida -U -f com.geargames.aow -l reverse/tools/r1_dictionary_dump.js \
          -o r1_session.jsonl --runtime=v8

- spawn mode (`-f`) is preferred: hooks install before the logon sequence starts, so the
  `ClientResourceConfiguration` (state 17) and all dictionary loads (states 19–21) are caught;
- if you must attach late (`-n AOW3`): kill the app in the login screen, clear the app
  cache (not data!) OR just re-login — the dictionaries are re-negotiated on every login,
  but a warm cache may skip re-download (that is itself a §16-D observation — record it);
- leave the game on the main menu until the transcript shows the dictionary events, then
  Ctrl-C. Optionally enter one battle and produce/fire with one known unit for the
  §12-D/E cross-experiments.

## What the hook emits

Every line starts with `[R1]{...}` JSON events:

- `rescfg` — `ClientResourceConfiguration` processed: per-category server `ResourceInfo`
  {path, zipped, crc} + minor versions (config versioning metadata);
- `msg111` — `ResourceAnswer` frames: `{category, resourceInfo, size, sha256, data_b64}`
  where `data_b64` is the **complete ST payload** of one dictionary (post-decryption);
- `setdata` — `BattleBaseDictionaryDataSource.SetData` reached: proof of ingestion +
  IL2CPP-side object stats (counts of unitTypes/weaponTypes/buildingTypes/... when the
  reflection snapshot is enabled);
- `cache` — AuthorizationCache Save/Load events + the resolved `rbi` path.

Non-JSON frida console noise between events is normal and skipped by the decoder.

## Expected output contract (success criteria)

    [R1]{"ev":"rescfg", ...categories with crc...}
    [R1]{"ev":"msg111","category":1,"size":N,"sha256":"...","data_b64":"..."}   <- BattleBaseDictionary
    [R1]{"ev":"msg111","category":2,...}                                        <- SharedBaseDictionary
    [R1]{"ev":"msg111","category":3,...}                                        <- BaseDictionary
    [R1]{"ev":"setdata","units":N,"weapons":N,"buildings":N,...}

Success = at least one `msg111` with `category:1` (BattleBaseDictionary) **or** a
`cache` event whose `rbi` file was pulled successfully. If the server answers with
URL-only `ResourceInfo` (no inline Data), the web path fires instead — in that case also
capture the HTTP download: enable the optional request hook noted in the script header
(plain HTTPS GET of the CRC-versioned file) and save that file; it is the same ST payload.

## Where output is stored / what to send back

- keep raw captures OUT of git: put `r1_session.jsonl` and pulled `rbi` into a scratch
  directory;
- send back: `r1_session.jsonl` (sanitized by §6), the pulled `rbi` file, and (if the web
  path fired) the downloaded dictionary file(s);
- the host-side decode/normalization into `reverse/evidence/prototype-data/` is done on
  the repo side afterwards (same pipeline as §5 of inventory.md — decode → parse →
  EStat map → browser comparison), using the sanitize + provenance template.

## Pulling the cache file directly (no-frida fallback)

If Frida cannot attach (anti-debug or version drift), the `rbi` cache alone still carries
the dictionaries (ST-serialized, post-crypto):

    adb shell "su -c 'ls -la /data/data/com.geargames.aow/files/rbi'"
    adb shell "su -c 'cat /data/data/com.geargames.aow/files/rbi'" > rbi.bin
    sha256sum rbi.bin     # record it

Decode requires the ST class-name registry (known from dump.cs) — repo-side work; send
the file + the exact game version string from Play Store / `dumpsys package com.geargames.aow`.

## Sanitizing before commit (mandatory)

Strip from anything that enters the repository: authentication/session tokens, account
ids, player names, device identifiers, chat content. Keep only: event type, category
ids, sizes, SHA-256 hashes, version metadata, and the dictionary payloads themselves
(they contain game data only). The repo-side decode step re-emits sanitized parsed JSON.

## Verifying success (checklist)

1. `msg111` category 1 present **or** `rbi` pulled and ≥ 1 KB;
2. `rescfg` shows non-empty `crc` for categories 1–3;
3. game reached the main menu normally during capture (no crash);
4. if §12 experiments were run: note the unit produced / weapon fired / building built
   with exact in-game names so the repo side can bind captured rows to UnitType ids;
5. record: device model, Android version, game versionName/versionCode, date/time,
   your in-game faction, and whether the session was clean-cache or warm.

## Version pinning (do not skip)

- game 6.9.18 → `dump.cs` sha256 `0050e67d…`, `libil2cpp.so` sha256 `8ace05bb…` — the
  hook RVAs in `r1_dictionary_dump.js` are pinned to those. Any other version → do not
  force; report back and the hooks get re-pinned (same method as
  `prototype_pipeline_disasm.py`).
- record the server-side dictionary minor versions from `rescfg` — that is the
  config-version identity (task §13).

## Relationship to the Obfuz run (R2)

Both captures can share **one** Frida spawn session: run
`reverse/tools/obfuz_frida_dump.js` first, then `r1_dictionary_dump.js` (same `-l`
command line, comma- or double-`-l` per frida version), one transcript per tool. The
pipelines stay separate: Obfuz = code constants; R1 = ST dictionary payloads. Do not
decode one with the other's tooling.
