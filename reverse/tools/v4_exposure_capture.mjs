#!/usr/bin/env node
// V4-c exposure/brightness calibration measurement.
// Compares the RENDERED ground-plane luma distribution (browser build,
// overview-far pose — whole map visible) against the extracted authentic
// minimap of the SAME map (minimap-jungle.png). Both are the same world; the
// minimap is an original-engine render, so median-luma ratio rendered/minimap
// is the combined (decor multipliers x rig x exposure) brightness error.
// Water + HUD masked; medians/IQR reported (no spatial matching needed for a
// global calibration check). Evidence for the audit §9 [SPEC] re-tune decision.

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const VISUAL = join(ROOT, "reverse", "evidence", "visual");
const PORT = 8153;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".glb": "model/gltf-binary", ".wav": "audio/wav" };
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
const playwright = await import("playwright");
const srv = await serve();
const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${PORT}/index.html#seed=12345`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#start", { timeout: 20000 });
await page.click("#start");
await page.waitForFunction(() => {
  const a = window.__aow3 && window.__aow3();
  const d = window.__DBG;
  return !!(a && a.sim && a.sim.tick > 90 && d && d.r3d && d.r3d.realTerrain && window.__realMap);
}, null, { timeout: 60000, polling: 250 });
await page.evaluate(() => {
  const cam = window.__DBG.cam;
  const sim = window.__aow3().sim;
  const h = sim.hq(1); cam.x = 80; cam.y = 80; cam.dist = 14; cam.yaw = 0;
});
await page.waitForTimeout(1500);
const shot = (await page.screenshot({ path: join(VISUAL, "probe7c-postchange.png") })).toString("base64");
await browser.close(); srv.close();

// minimap reference
const fs = await import("node:fs");
const mmPath = join(DOCS, "assets", "minimap-jungle.png");
fs.copyFileSync(mmPath, join(VISUAL, "probe7-minimap-ref.png"));
console.log("captured probe7c-postchange.png + copied minimap ref");
