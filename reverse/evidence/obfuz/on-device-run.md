# Obfuz pool — the on-device run (Build H runbook)

One capture command on the device + one decode command on the host decode all 697
`$Obfuz$ConstFieldHolder$0` pool values and convert the remaining pool-dependent
constants to CONFIRMED: the Build E task-id factors (statics+0x004/0x008), the
$ce task threshold (0x014), the DontShoot idempotence constant (0x064), the Build F
DEN factors (0x364/0x368) and the set_FlagShoot value (0x374). Architecture,
crypto chain and evidence: reverse/notes/obfuz-pool-emulation.md (Builds G/G2).

## Requirements

- rooted device or emulator running AOW3 **6.9.18** (`com.geargames.aow`) with
  frida-server matching the host frida CLI version;
- host: python3.9+ with `pip install unicorn capstone` (wheels exist for
  linux/mac/windows, x64+arm64);
- host: the repo (for the tools + the committed key artifact) and the 6.9.18
  `libil2cpp.so` (see below). The .so is NOT needed on the device; the XAPK is
  NOT needed anywhere — the secret key is committed as
  `reverse/tools/obfuz_secret_key.bin` (1,024 B, raw m_Script blob,
  sha256 885f4d0c…1ffe0, source asset sha256 81f07f62…683a4).

## Step 1 — capture (on-device, one command)

    frida -U -f com.geargames.aow -l reverse/tools/obfuz_frida_dump.js \
          -o obfuz_pool_dump.jsonl --runtime=v8

- spawn mode (`-f`) is preferred: the hooks install before any class initializer
  runs, so the boot-time `$qk(0x12345678, K)` canary event is captured;
- late attach also works (`frida -U -n AOW3 -l ...`): the script re-invokes both
  builder .cctors (0x497F474 / 0x497F82C, idempotent) so every segment is still
  captured — but the canary row may then read `NOT SEEN` (it fired before attach);
- wait for the main menu (the ObfuzRuntimeBootstrap runs the builders), then Ctrl-C;
- expected transcript shape: 8 `seg` events (mgr1@0x800/0x1008/0x1810/0x2018/
  0x2820/0x3028 + mgr2@0x800/0x1008; duplicates from cctor re-runs are expected
  and harmless), >= 1 `qk` event, optional `initarr` events. Every line starts
  with `[OBFUZ]{...}`; non-JSON console noise between them is normal frida output
  and is skipped by the consumer.

## Step 2 — decode (host, one command)

    python3 reverse/tools/obfuz_pool_emulator.py --dump obfuz_pool_dump.jsonl

Paths resolve automatically: flag > env (AOW3_SO / AOW3_KEY / AOW3_XAPK /
AOW3_METADATA) > cwd walk (up/down, incl. `./native`) > committed key artifact.
With a repo clone, the only external input is libil2cpp.so; explicit form:

    python3 reverse/tools/obfuz_pool_emulator.py --dump obfuz_pool_dump.jsonl \
        --so libil2cpp.so --out obfuz-pool-values.json

Outputs: the anchor table on stdout and the full 697-value decode as
`obfuz-pool-values.json` (per value: idx, segment, raw bytes, decoded value,
status).

## Getting libil2cpp.so (6.9.18)

    adb shell pm path com.geargames.aow        # -> package:/data/app/.../base.apk
    adb pull <that base.apk path> .
    unzip -j base.apk 'lib/arm64-v8a/libil2cpp.so'

Pin it: sha256 must start `8ace05bb` (Build G pinning: 8ace05bbaa2cdfda…).

## Expected output contract

    so         : <path> sha256 8ace05bbaa2cdfda …
    key source : file …/obfuz_secret_key.bin (raw m_Script blob)
    SELF-TEST  : $GOA(0x720ba23e, 0x545ee170, 0x98705298) = 0x12345678 … : PASS
    dump: N seg / M qk / K initarr events
    canary $qk(0x12345678, K): SEEN (VM booted, cipher chain live)
    CBC re-verify mgr1@0x1008 (cs 0x497f650, keyA …, salt …): 32/32 words PASS
    CBC re-verify mgr1@0x1810 (cs 0x497f6a8, keyA …, salt …): 32/32 words PASS
    combo mgr(0x1008)=mgr1 mgr(0x1810)=mgr1: decoded OK NNNN/697
    --- anchor cross-check ---
      statics+0x004  = <REAL>  [OK]   <- Build E task-id factor V1
      statics+0x008  = <REAL>  [OK]   <- Build E task-id factor V2
      statics+0x014  = <REAL>  [OK]   <- $ce task threshold
      statics+0x064  = <REAL>  [OK]   <- DontShoot idempotence constant
      statics+0x364  = <REAL>  [OK]   <- Build F DEN factor A (DEN = A x B)
      statics+0x368  = <REAL>  [OK]   <- Build F DEN factor B
      statics+0x374  = <REAL>  [OK]   <- set_FlagShoot value
    pool values -> obfuz-pool-values.json (NNNN/697 OK)

Interpretation ladder:

- `SELF-TEST : PASS` — the host re-execution of the real native `$GOA` (whole
  libil2cpp.so mapped in Unicorn) with the committed key satisfies the game's own
  boot assertion; the decryptor is exact before any device data is touched;
- `CBC re-verify … PASS` — the dumped (cipher, plain) segment pair satisfies the
  §6 model `plain_i = $GOA(ciph_i ^ ciph_{i-1}, keyA, salt)` on REAL device bytes
  (the G2 synthetic validated the consumer; this validates the data);
- anchor rows `[OK]` — the actual constants; these are the values that convert
  Build E/F and the fire-discipline/DontShoot models to CONFIRMED;
- a small `CIPHER_UNSURE` residue on strings is expected until the real dump:
  the per-string (len, salt, keyC) hypothesis ladder needs real bytes to settle.

## Troubleshooting

- `no seg events` — reach the main menu; the bootstrap .cctors run the builders.
- `need at least one 0x1008 and one 0x1810 segment` — capture died early; re-run
  in spawn mode and leave the game at the menu for a few seconds.
- `canary … NOT SEEN` on late attach — benign (see Step 1); the SELF-TEST still
  proves the crypto chain.
- `libil2cpp.so not found` / `secret key not found` — pass `--so` / `--key`
  explicitly (the key artifact is committed next to the tool).
- version mismatch — the offsets in both tools are 6.9.18 pins; another build
  needs re-pinning, do not force it.

## After the run

Send back `obfuz_pool_dump.jsonl` (and `obfuz-pool-values.json` if produced):
the anchor values get folded into attack-path-fire-discipline.md (Build E),
siege-stage-boundary-split.md (Build F) and obfuz-pool-emulation.md §8, flipping
those constants from MEDIUM/UNRESOLVED to CONFIRMED with the transcript as
session evidence.
