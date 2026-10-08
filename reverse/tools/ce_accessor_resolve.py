#!/usr/bin/env python3
"""W1 resolver: decode every $ce accessor call site in siege-ce-full-trace.txt.

Parses the committed trace, extracts each $gK wrapper call (bl 0x5265b74) with its
immediates (w1=keyA, w2=salt, w3/w3-movk=keyC), looks the (keyA, salt) pair up in the
decoded pool (reverse/evidence/obfuz/obfuz-pool-values.json), and prints the decoded
value plus the surrounding control-flow (compare/branch) and whether a get_TickFromSpec
or get_Task site is nearby. Output = the W1-a/W1-b evidence rows.
"""
import json, re, sys

TRACE = "/home/z/my-project/scripts/AOW3-repo/reverse/evidence/combat/siege-ce-full-trace.txt"
POOL = "/home/z/my-project/scripts/AOW3-repo/reverse/evidence/obfuz/obfuz-pool-values.json"

pool = json.load(open(POOL))
by_ks = {}
for e in pool:
    by_ks.setdefault((e["keyA"], e["salt"]), []).append(e)

lines = open(TRACE).read().splitlines()
# normalize: keep the "  0xADDR: insn" part
insns = []
for i, ln in enumerate(lines):
    m = re.match(r"\s*(0x[0-9a-f]+):\s+(.*?)(?:\s*;.*)?$", ln)
    if m:
        insns.append((i, int(m.group(1), 16), m.group(2).strip()))

def find_reg(imm_name, lo, hi):
    """find the most recent mov w-reg, #imm before index hi"""
    for j in range(hi - 1, lo, -1):
        _, _, ins = insns[j]
        m = re.match(rf"mov\s+{imm_name},\s+#(0x[0-9a-f]+|\d+)", ins)
        if m:
            return int(m.group(1), 0)
    return None

out = []
for n, (idx, addr, ins) in enumerate(insns):
    if not re.match(r"bl\s+#0x5265b74", ins):
        continue
    # scan back up to 12 insns for mov w1/w2/w3 (+ movk w3)
    keyA = salt = keyC = None
    for j in range(n - 1, max(0, n - 14), -1):
        _, a2, i2 = insns[j]
        m = re.match(r"mov\s+w1,\s+#(0x[0-9a-f]+|\d+)", i2)
        if m and keyA is None:
            keyA = int(m.group(1), 0)
        m = re.match(r"mov\s+w2,\s+#(0x[0-9a-f]+|\d+)", i2)
        if m and salt is None:
            salt = int(m.group(1), 0)
        m = re.match(r"mov\s+w3,\s+#(0x[0-9a-f]+|\d+)", i2)
        if m and keyC is None:
            keyC = int(m.group(1), 0)
        m = re.match(r"movk\s+w3,\s+#(0x[0-9a-f]+|\d+),\s*lsl\s+#16", i2)
        if m and keyC is not None:
            keyC = (int(m.group(1), 0) << 16) | (keyC & 0xFFFF)
        if keyA is not None and salt is not None and keyC is not None:
            break
    cands = by_ks.get((keyA, salt), [])
    # context: nearest cmp/branch after, nearest TickFromSpec/get_Task within +-30 insns
    ctx_after = []
    for j in range(n + 1, min(len(insns), n + 8)):
        _, a2, i2 = insns[j]
        if re.match(r"(cmp|b\.|tbz|tbnz|cbz|cbnz)", i2):
            ctx_after.append(f"{a2:#x}: {i2}")
        if len(ctx_after) >= 2:
            break
    tfs = [insns[j][1] for j in range(max(0, n - 30), min(len(insns), n + 30))
           if "VT.get_TickFromSpec" in insns[j][2]]
    gt = [insns[j][1] for j in range(max(0, n - 30), min(len(insns), n + 30))
          if "VT.get_Task" in insns[j][2]]
    fs = [insns[j][1] for j in range(max(0, n - 30), min(len(insns), n + 30))
          if "VT.set_FlagShoot" in insns[j][2]]
    vals = "; ".join(f"target=0x{c['target']:x} idx={c['idx']} value={c['value']} ({c['value'] if c['value'] < 2**31 else c['value'] - 2**32} signed) raw={c['raw']}" for c in cands) or "NO POOL MATCH"
    out.append({
        "site": f"{addr:#x}", "keyA": keyA, "salt": salt,
        "keyC": f"{keyC:#x}" if keyC is not None else None,
        "match": len(cands), "values": vals,
        "cmp_after": " | ".join(ctx_after),
        "tickfromspec_near": [f"{a:#x}" for a in tfs],
        "get_task_near": [f"{a:#x}" for a in gt],
        "set_flagshoot_near": [f"{a:#x}" for a in fs],
    })

print(f"$ce accessor sites resolved: {len(out)}\n")
for o in out:
    print(f"@{o['site']}  keyA={o['keyA']} salt={o['salt']} keyC={o['keyC']}")
    print(f"   pool: {o['values']}")
    print(f"   flow: {o['cmp_after']}")
    tag = []
    if o["tickfromspec_near"]: tag.append(f"TickFromSpec@{','.join(o['tickfromspec_near'])}")
    if o["get_task_near"]: tag.append(f"get_Task@{','.join(o['get_task_near'])}")
    if o["set_flagshoot_near"]: tag.append(f"set_FlagShoot@{','.join(o['set_flagshoot_near'])}")
    print(f"   near: {', '.join(tag) if tag else '-'}")
    print()
