#!/usr/bin/env node
// V8 reference-validation harness (visual-fidelity-audit §21/V8).
//
// Repeatable browser-render capture + comparison against original-device
// references. Protocol and provenance rules: reverse/evidence/visual/README.md.
//
//   node reverse/tools/visual_harness.mjs [--only <id>] [--port <p>] [--out <dir>]
//
// Per manifest scenario it: serves docs/ over loopback HTTP, loads the build
// with a fixed #seed, starts a battle, drives window.__DBG.cam (AGENTS.md
// §35.3 probes — QA only, never gameplay state) to the scenario pose, waits
// for render settle, screenshots, computes an 8×8 average hash, and (when a
// ref-<id>.png device reference exists) composes a labeled side-by-side plus
// Hamming distance. Outputs land in reverse/evidence/visual/:
//   shot-<id>.png        browser build capture
//   sbs-<id>.png         side-by-side (only when a device reference exists)
//   results.json         machine-readable capture + hash record
//   REPORT.md            human-readable validation report (regenerated)
//
// Device references are captured by the R1 on-device session (same protocol —
// see README); until they exist every scenario reports [MISSING-DEVICE-REF].
// No percentages, no similarity verdicts — hashes and images only; the human
// (or the device session) supplies judgment.

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const VISUAL = join(ROOT, "reverse", "evidence", "visual");
const MANIFEST = JSON.parse(await readFile(join(VISUAL, "manifest.json"), "utf8"));

const args = process.argv.slice(2);
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const only = argOf("--only");
const PORT = +(argOf("--port") || 8137);
const OUT = resolve(argOf("--out") || VISUAL);

const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".glb": "model/gltf-binary", ".wav": "audio/wav", ".jpg": "image/jpeg" };

function serve() {
  return new Promise((ok) => {
    const srv = createServer(async (req, res) => {
      try {
        const p = join(DOCS, decodeURIComponent(new URL(req.url, "http://x").pathname));
        const body = await readFile(existsSync(p) && !existsSync(join(p, "index.html")) ? p : join(DOCS, "index.html"));
        res.writeHead(200, { "content-type": MIME[join(p).slice(-4)] || MIME[p.slice(p.lastIndexOf("."))] || "application/octet-stream", "cache-control": "no-store" });
        res.end(body);
      } catch { res.writeHead(404); res.end("nf"); }
    });
    srv.listen(PORT, "127.0.0.1", () => ok(srv));
  });
}

const head = process.env.GIT_SHA || (() => { try { return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim(); } catch { return "?"; } })();
const vq = (await readFile(join(DOCS, "index.html"), "utf8")).match(/game\.js\?v=(\d+)/)?.[1] || "?";

let playwright;
try { playwright = await import("playwright"); } catch { console.error("playwright not available — install or capture manually per README"); process.exit(2); }

const scenarios = MANIFEST.scenarios.filter((s) => !only || s.id === only);
if (!scenarios.length) { console.error("no scenario matches --only"); process.exit(1); }

const srv = await serve();
const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--enable-unsafe-swiftshader"] });
const results = [];

for (const s of scenarios) {
  const page = await browser.newPage({ viewport: { width: (s.viewport || MANIFEST.viewport)[0], height: (s.viewport || MANIFEST.viewport)[1] }, deviceScaleFactor: 1 });
  try {
    await page.goto(`http://127.0.0.1:${PORT}/index.html#seed=${s.seed}`, { waitUntil: "domcontentloaded" });
    // Menu → battle. startGame applies the hash seed (docs/game.js boot).
    await page.waitForSelector("#start", { timeout: 20000 });
    await page.click("#start");
    // Ready = renderer built the heightmapped terrain + real-map decals + sim
    // is ticking (deterministic under the fixed seed).
    await page.waitForFunction(() => {
      const a = window.__aow3 && window.__aow3();
      const d = window.__DBG;
      return !!(a && a.sim && a.sim.tick > 90 && d && d.r3d && d.r3d.realTerrain && window.__realMap);
    }, null, { timeout: 60000, polling: 250 });
    // Pose via the §35.3 probe, then let shadows/decor/FX settle.
    await page.evaluate((p) => {
      const cam = window.__DBG.cam;
      const sim = window.__aow3().sim;
      if (p.focus === "hq-blue") { const h = sim.hq(1); cam.x = h.x + (p.dx ?? 6); cam.y = h.y + (p.dy ?? 0); }
      else if (p.focus === "hq-red") { const h = sim.hq(2); cam.x = h.x + (p.dx ?? 0); cam.y = h.y + (p.dy ?? 0); }
      else if (p.focus === "center") { cam.x = 80 + (p.dx ?? 0); cam.y = 80 + (p.dy ?? 0); }
      cam.dist = p.dist; cam.yaw = p.yaw;
    }, s.pose);
    await page.waitForTimeout(1600);
    const shot = join(OUT, `shot-${s.id}.png`);
    await page.screenshot({ path: shot });

    // 8×8 average hash, computed off the captured PNG in a clean page.
    const hp = await browser.newPage();
    const hash = await hp.evaluate(async (b64) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const c = document.createElement("canvas"); c.width = c.height = 8;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0, 8, 8);
      const d = g.getImageData(0, 0, 8, 8).data;
      const gray = []; for (let i = 0; i < 64; i++) gray.push(0.2126 * d[i*4] + 0.7152 * d[i*4+1] + 0.0722 * d[i*4+2]);
      const mean = gray.reduce((a, b) => a + b, 0) / 64;
      let bits = ""; for (const v of gray) bits += v >= mean ? "1" : "0";
      return BigInt("0b" + bits).toString(16).padStart(16, "0");
    }, (await readFile(shot)).toString("base64"));
    await hp.close();

    const ref = join(OUT, `ref-${s.id}.png`);
    const rec = { id: s.id, label: s.label, seed: s.seed, pose: s.pose, shot: `shot-${s.id}.png`, ahash: hash, git: head, gameJsV: vq, ts: new Date().toISOString() };
    if (existsSync(ref)) {
      rec.ref = `ref-${s.id}.png`;
      const sbp = await browser.newPage({ viewport: { width: s.viewport[0], height: Math.round(s.viewport[1] / 2) + 24 }, deviceScaleFactor: 1 });
      rec.sbs = `sbs-${s.id}.png`;
      rec.refAhash = await sbp.evaluate(async ([b64a, b64b]) => {
        const load = (b) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = "data:image/png;base64," + b; });
        const [ia, ib] = await Promise.all([load(b64a), load(b64b)]);
        const W = 640, H = 372;
        const c = document.createElement("canvas"); c.width = W; c.height = H;
        const g = c.getContext("2d");
        g.fillStyle = "#111"; g.fillRect(0, 0, W, H);
        g.drawImage(ia, 0, 12, W / 2 - 4, H - 12);
        g.drawImage(ib, W / 2 + 4, 12, W / 2 - 8, H - 12);
        g.fillStyle = "#fff"; g.font = "10px monospace";
        g.fillText("BROWSER BUILD", 6, 9); g.fillText("DEVICE REFERENCE", W / 2 + 10, 9);
        const out = c.toDataURL("image/png");
        // hash the reference the same way for the distance record
        const h2 = document.createElement("canvas"); h2.width = h2.height = 8;
        const g2 = h2.getContext("2d"); g2.drawImage(ib, 0, 0, 8, 8);
        const d2 = g2.getImageData(0, 0, 8, 8).data;
        const gr = []; for (let i = 0; i < 64; i++) gr.push(0.2126 * d2[i*4] + 0.7152 * d2[i*4+1] + 0.0722 * d2[i*4+2]);
        const m2 = gr.reduce((a, b) => a + b, 0) / 64;
        let bits = ""; for (const v of gr) bits += v >= m2 ? "1" : "0";
        window.__sbs = out;
        return { refHash: BigInt("0b" + bits).toString(16).padStart(16, "0"), sbsData: out };
      }, [(await readFile(shot)).toString("base64"), (await readFile(ref)).toString("base64")]);
      const ham = (rec.refAhash.refHash ^ rec.ahash).toString(2).match(/1/g)?.length ?? 0;
      rec.hamming = ham;
      await writeFile(join(OUT, rec.sbs), Buffer.from(rec.refAhash.sbsData.split(",")[1], "base64"));
      await sbp.close();
      delete rec.refAhash;
    } else {
      rec.ref = null;
      rec.status = "MISSING-DEVICE-REF";
    }
    results.push(rec);
    console.log(`[${s.id}] shot ok  ahash=${rec.ahash}${rec.hamming !== undefined ? `  ref-hamming=${rec.hamming}` : "  [MISSING-DEVICE-REF]"}`);
  } catch (e) {
    results.push({ id: s.id, label: s.label, error: String(e).slice(0, 300), git: head, gameJsV: vq, ts: new Date().toISOString() });
    console.error(`[${s.id}] FAILED: ${String(e).slice(0, 200)}`);
  } finally {
    await page.close();
  }
}

await browser.close();
srv.close();

await writeFile(join(OUT, "results.json"), JSON.stringify({ generated: new Date().toISOString(), git: head, gameJsV: vq, manifest: MANIFEST.protocol, results }, null, 2) + "\n");

const rows = results.map((r) => r.error
  ? `| ${r.id} | ERROR | — | ${r.error} |`
  : `| ${r.id} | \`${r.ahash}\` | ${r.ref ? (r.hamming === 0 ? "identical-hash" : `hamming=${r.hamming}`) : "[MISSING-DEVICE-REF]"} | ${r.ref ? `shot + sbs + ref captured` : `shot captured, reference absent`} |`);
const md = `# V8 reference-validation report

- Generated: ${new Date().toISOString()}
- Build: HEAD ${head}, \`game.js?v=${vq}\`
- Protocol: \`reverse/evidence/visual/README.md\` — screenshots + 8×8 average
  hashes only; no percentage claims, judgment deferred to the device session.

| scenario | browser aHash | device-ref compare | artifacts |
|---|---|---|---|
${rows.join("\n")}

${results.some((r) => r.status === "MISSING-DEVICE-REF") ? `Device references are captured by the R1 on-device session (same poses/resolution — drop \`ref-<id>.png\` next to the shots and re-run; see README). Scenarios above marked [MISSING-DEVICE-REF] await that run.` : `All scenarios have device references; Hamming distances are recorded in results.json (8×8 average hash — coarse regression signal, not a fidelity verdict).`}
`;
await writeFile(join(OUT, "REPORT.md"), md);
console.log(`\nreport: ${join(OUT, "REPORT.md")}`);
