#!/usr/bin/env node
// V4 probe #6 — VALIDATE the V-flip fix before committing it.
// Negates V on each unit template mesh's UV attribute (V' = 1 - V) live and
// captures: (a) iheavy-only flip, (b) all-unit flip, vs (c) baseline.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const VISUAL = join(ROOT, "reverse", "evidence", "visual");
const PORT = 8151;
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
page.on("pageerror", (e) => console.error("pageerror:", String(e).slice(0, 160)));
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
  const h = sim.hq(1); cam.x = h.x + 6; cam.y = h.y; cam.dist = 8; cam.yaw = 0;
});
await page.waitForTimeout(1400);

const flip = (view, apply) => {
  const g = view.model?.group; if (!g) return;
  g.traverse((o) => {
    if (!o.isMesh) return;
    const uv = o.geometry.attributes.uv; if (!uv) return;
    for (let i = 0; i < uv.array.length; i += 2) uv.array[i + 1] = apply ? 1 - uv.array[i + 1] : 1 - uv.array[i + 1];
    uv.needsUpdate = true;
  });
};
// state A: baseline shot
await page.screenshot({ path: join(VISUAL, "probe6-A-baseline.png") });

// state B: flip ONLY iheavy (defId iheavy) — the proven-black unit
await page.evaluate(() => {
  for (const [, v] of window.__DBG.r3d.unitViews) {
    const u = v.model?.group?.userData?.unit;
    if (u?.def?.id !== "iheavy") continue;
    v.model.group.traverse((o) => {
      if (!o.isMesh) return;
      const uv = o.geometry.attributes.uv; if (!uv) return;
      for (let i = 0; i < uv.array.length; i += 2) uv.array[i + 1] = 1 - uv.array[i + 1];
      uv.needsUpdate = true;
    });
  }
});
await page.waitForTimeout(200);
await page.screenshot({ path: join(VISUAL, "probe6-B-iheavy-flipped.png") });

// state C: flip ALL unit views (re-flip iheavy back + flip rest)
await page.evaluate(() => {
  for (const [, v] of window.__DBG.r3d.unitViews) {
    v.model.group.traverse((o) => {
      if (!o.isMesh) return;
      const uv = o.geometry.attributes.uv; if (!uv) return;
      for (let i = 0; i < uv.array.length; i += 2) uv.array[i + 1] = 1 - uv.array[i + 1];
      uv.needsUpdate = true;
    });
  }
});
await page.waitForTimeout(200);
await page.screenshot({ path: join(VISUAL, "probe6-C-all-flipped.png") });

await browser.close();
srv.close();
console.log("probe6 done");
