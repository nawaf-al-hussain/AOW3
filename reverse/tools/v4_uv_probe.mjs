#!/usr/bin/env node
// V4 probe #4 — UV-layout ground truth + clean unit color sampling.
//  (a) draws each unit mesh's UV triangles over its live texture -> PNG per unit
//  (b) projects each unit's world center to screen and reads a 7x7 px patch
//      mean at that exact location from a live frame (cleaner than bbox diff:
//      the unit body, not bars/shadows)
//  (c) same for one building view as the control (buildings render correctly)

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const VISUAL = join(ROOT, "reverse", "evidence", "visual");
const PORT = 8147;
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
await page.waitForTimeout(1500);

// ---- (a) UV overlay per unit + (b) center pixel read -------------------------
const uvDataUrl = await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  const out = [];
  const V = r3d.camera.position.constructor;
  const v = new V();
  const makeOverlay = (tex, meshes) => {
    const img = tex.image;
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    g.strokeStyle = "rgba(255,0,255,0.5)"; g.lineWidth = 1;
    for (const m of meshes) {
      const uv = m.geometry.attributes.uv, idx = m.geometry.index;
      const tri = idx ? idx.array : [...Array(uv.count).keys()];
      g.beginPath();
      for (let t = 0; t < tri.length; t += 3) {
        const a = tri[t] * 2, b = tri[t + 1] * 2, cc = tri[t + 2] * 2;
        g.moveTo(uv.array[a] * img.width, (1 - uv.array[a + 1]) * img.height);
        g.lineTo(uv.array[b] * img.width, (1 - uv.array[b + 1]) * img.height);
        g.lineTo(uv.array[cc] * img.width, (1 - uv.array[cc + 1]) * img.height);
        g.closePath();
      }
      g.stroke();
    }
    return c.toDataURL("image/png");
  };
  window.__v4overlays = [];
  for (const [id, uv_] of r3d.unitViews) {
    const meshes = [];
    uv_.model?.group?.traverse((o) => { if (o.isMesh) meshes.push(o); });
    if (!meshes.length) continue;
    // (b) screen patch mean at unit center (+1m up)
    uv_.model.group.getWorldPosition(v); v.y += 1.0; v.project(r3d.camera);
    const sx = Math.round((v.x * 0.5 + 0.5) * innerWidth), sy = Math.round((-v.y * 0.5 + 0.5) * innerHeight);
    out.push({ id, sx, sy, overlay: makeOverlay(meshes[0].material.map, meshes.slice(0, 2)) });
  }
  return out;
});
for (const [i, u] of uvDataUrl.entries()) {
  if (u.overlay) await writeFile(join(VISUAL, `probe4-uv-unit${u.id}.png`), Buffer.from(u.overlay.split(",")[1], "base64"));
}

// grab a fresh frame and read 7x7 patches at the projected centers
const shot = (await page.screenshot()).toString("base64");
const patches = await page.evaluate(async ([b64, units]) => {
  const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const read7 = (x, y) => {
    const d = g.getImageData(Math.max(0, x - 3), Math.max(0, y - 3), 7, 7).data;
    let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i+1]; b += d[i+2]; n++; }
    return [Math.round(r/n), Math.round(gg/n), Math.round(b/n)];
  };
  return units.map((u) => ({ id: u.id, sx: u.sx, sy: u.sy, patch: read7(u.sx, u.sy) }));
}, [shot, uvDataUrl]);
console.log("unit center patches:", JSON.stringify(patches));

// control: project each building view center
const blds = await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  const V = r3d.camera.position.constructor; const v = new V();
  const out = [];
  for (const [id, bv] of r3d.bldViews) {
    const g = bv.model?.group || bv.group; if (!g) continue;
    g.getWorldPosition(v); v.y += 1.5; v.project(r3d.camera);
    out.push({ id, sx: Math.round((v.x * 0.5 + 0.5) * innerWidth), sy: Math.round((-v.y * 0.5 + 0.5) * innerHeight) });
  }
  return out;
});
const patchesB = await page.evaluate(async ([b64, bs]) => {
  const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const read7 = (x, y) => {
    const d = g.getImageData(Math.max(0, x - 3), Math.max(0, y - 3), 7, 7).data;
    let r = 0, gg = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i+1]; b += d[i+2]; n++; }
    return [Math.round(r/n), Math.round(gg/n), Math.round(b/n)];
  };
  return bs.map((u) => ({ id: u.id, sx: u.sx, sy: u.sy, patch: read7(u.sx, u.sy) }));
}, [shot, blds]);
console.log("building center patches (control):", JSON.stringify(patchesB));

await writeFile(join(VISUAL, "probe4-frame.png"), Buffer.from(shot, "base64"));
await browser.close();
srv.close();
console.log("probe4 done");
