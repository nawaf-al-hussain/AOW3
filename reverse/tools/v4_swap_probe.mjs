#!/usr/bin/env node
// V4 root-cause probe #2: live material-swap experiments on the units near the
// tactical-close focus. For each experiment we screenshot + read back the mean
// color over the unit's projected screen rect:
//   E1 baseline                (current build state)
//   E2 map=null                (white diffuse, lighting only)
//   E3 map=solid red DataTexture  (UV-independent color)
//   E4 MeshBasicMaterial white (bypasses lighting entirely)
//   E5 normals=(0,1,0) forced  (up-facing normals, full hemisphere sky term)
// Also samples the live texture pixels (map.image -> canvas) and the UV bounds
// of each unit mesh, so texture content vs UV sampling is separable.
// QA-only probes on live renderer objects (AGENTS.md §35.3); nothing persists.

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const VISUAL = join(ROOT, "reverse", "evidence", "visual");
const PORT = 8143;
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
await page.waitForTimeout(1600);

// ---- texture + UV ground truth ----------------------------------------------
const texInfo = await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  const out = [];
  for (const [id, v] of r3d.unitViews) {
    v.model?.group?.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      const rec = { id, mesh: o.name || o.type, mapPresent: !!m.map, mapClass: m.map?.image?.constructor?.name };
      if (m.map?.image) {
        try {
          const img = m.map.image;
          const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
          const g = cv.getContext("2d"); g.drawImage(img, 0, 0);
          const d = g.getImageData(0, 0, cv.width, cv.height).data;
          let r = 0, gg = 0, b = 0, a = 0, n = 0;
          const step = Math.max(1, Math.floor(cv.width * cv.height / 4000));
          for (let i = 0; i < cv.width * cv.height; i += step) { r += d[i*4]; gg += d[i*4+1]; b += d[i*4+2]; a += d[i*4+3]; n++; }
          rec.texMean = [Math.round(r/n), Math.round(gg/n), Math.round(b/n), Math.round(a/n)];
          // center + corners
          const px = (x, y) => { const i = (y*cv.width+x)*4; return [d[i], d[i+1], d[i+2], d[i+3]]; };
          rec.center = px(cv.width >> 1, cv.height >> 1);
          rec.corners = [px(0,0), px(cv.width-1,0), px(0,cv.height-1), px(cv.width-1,cv.height-1)];
        } catch (e) { rec.texErr = String(e).slice(0, 120); }
      }
      const uv = o.geometry?.attributes?.uv;
      if (uv) {
        let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
        for (let i = 0; i < uv.array.length; i += 2) {
          const U = uv.array[i], V = uv.array[i+1];
          if (U < u0) u0 = U; if (U > u1) u1 = U; if (V < v0) v0 = V; if (V > v1) v1 = V;
        }
        rec.uvRange = [+u0.toFixed(2), +u1.toFixed(2), +v0.toFixed(2), +v1.toFixed(2)];
      }
      const nrm = o.geometry?.attributes?.normal;
      if (nrm) {
        let nz = 0, bad = 0, tot = 0;
        for (let i = 0; i < nrm.array.length; i += 3) {
          const x = nrm.array[i], y = nrm.array[i+1], z = nrm.array[i+2];
          const l = Math.hypot(x, y, z); tot++;
          if (!isFinite(l) || l < 0.5 || l > 1.5) bad++;
          if (y > 0.7) nz++;
        }
        rec.normals = { total: tot, degenerate: bad, upFrac: +(nz / tot).toFixed(2) };
      }
      out.push(rec);
    });
  }
  return out;
});
await writeFile(join(VISUAL, "probe2_texture_uv.json"), JSON.stringify(texInfo, null, 1));
console.log("texture/UV ground truth:");
for (const t of texInfo) console.log(" ", JSON.stringify(t));

// ---- swap experiments -------------------------------------------------------
// project the union screen rect of unit views (ids 2,3,4 = the cluster) and
// measure mean color inside it for each material state.
async function captureRect(name) {
  const buf = await page.screenshot();
  const b64 = buf.toString("base64");
  const mean = await page.evaluate(async (b) => {
    const img = new Image(); img.src = "data:image/png;base64," + b; await img.decode();
    // unit cluster world ~(-68,1,-2) — project via __DBG.r3d.camera
    const r3d = window.__DBG.r3d;
    const v = new (r3d.camera.position.constructor)();
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, any = false;
    for (const [, uv] of r3d.unitViews) {
      const p = uv.model?.group || uv.group;
      if (!p) continue;
      p.getWorldPosition(v); v.y += 1.2;
      v.project(r3d.camera);
      if (v.z < 1) {
        any = true;
        const sx = (v.x * 0.5 + 0.5) * innerWidth, sy = (-v.y * 0.5 + 0.5) * innerHeight;
        minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
      }
    }
    if (!any) return null;
    const pad = 28;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(innerWidth, maxX + pad); maxY = Math.min(innerHeight, maxY + pad);
    const cv = document.createElement("canvas"); cv.width = innerWidth; cv.height = innerHeight;
    const g = cv.getContext("2d"); g.drawImage(img, 0, 0);
    const d = g.getImageData(Math.round(minX), Math.round(minY), Math.round(maxX - minX), Math.round(maxY - minY)).data;
    let r = 0, gg = 0, bl = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i+1]; bl += d[i+2]; n++; }
    return { rect: [Math.round(minX), Math.round(minY), Math.round(maxX), Math.round(maxY)], mean: [Math.round(r/n), Math.round(gg/n), Math.round(bl/n)] };
  }, b64);
  console.log(`E[${name}]`, JSON.stringify(mean));
  return mean;
}

// deep-clone current materials for restore
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  window.__v4saved = new Map();
  for (const [, v] of r3d.unitViews) {
    v.model?.group?.traverse((o) => {
      if (o.isMesh) window.__v4saved.set(o, { mat: o.material, matJson: o.material.toJSON ? null : null });
    });
  }
});

await captureRect("E1-baseline");

// E2: map = null
await page.evaluate(() => { for (const [, v] of window.__DBG.r3d.unitViews) v.model?.group?.traverse((o) => { if (o.isMesh) { o.material.map = null; o.material.needsUpdate = true; } }); });
await page.waitForTimeout(120); await captureRect("E2-map-null");

// E3: map = solid red
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  const c = document.createElement("canvas"); c.width = c.height = 4;
  const g = c.getContext("2d"); g.fillStyle = "#ff2020"; g.fillRect(0, 0, 4, 4);
  const t = new r3d.scene.constructor.__three_unused; // placeholder (never used)
}, null).catch(() => {});
await page.evaluate(() => {
  // build the red texture from the page's own THREE (via an existing texture's constructor)
  const r3d = window.__DBG.r3d;
  let texCtor = null;
  r3d.scene.traverse((o) => { if (!texCtor && o.isMesh && o.material?.map) texCtor = o.material.map.constructor; });
  const c = document.createElement("canvas"); c.width = c.height = 4;
  const g = c.getContext("2d"); g.fillStyle = "#ff2020"; g.fillRect(0, 0, 4, 4);
  const t = new texCtor(c); t.colorSpace = "srgb"; t.flipY = false;
  window.__v4red = t;
  for (const [, v] of r3d.unitViews) v.model?.group?.traverse((o) => { if (o.isMesh) { o.material.map = t; o.material.needsUpdate = true; } });
});
await page.waitForTimeout(120); await captureRect("E3-map-red");

// E4: MeshBasicMaterial white (from an existing basic material's ctor)
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  let basic = null;
  r3d.scene.traverse((o) => { if (!basic && o.isMesh && o.material?.type === "MeshBasicMaterial") basic = o.material; });
  const mk = basic ? basic.clone() : null;
  if (mk) { mk.color.setScalar(1); mk.map = null; mk.transparent = false; mk.opacity = 1; }
  for (const [, v] of r3d.unitViews) v.model?.group?.traverse((o) => { if (o.isMesh && mk) { o.material = mk; o.material.needsUpdate = true; } });
});
await page.waitForTimeout(120); await captureRect("E4-basic-white");

// restore E1 materials + E1' red map on original standard material
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  for (const [o, s] of window.__v4saved) { o.material = s.mat; o.material.needsUpdate = true; }
  for (const [, v] of r3d.unitViews) v.model?.group?.traverse((o) => { if (o.isMesh) { o.material.map = window.__v4red; o.material.needsUpdate = true; } });
});
await page.waitForTimeout(120); await captureRect("E5-standard-red-map");

// restore maps
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  for (const [, v] of r3d.unitViews) v.model?.group?.traverse((o) => { if (o.isMesh) { o.material.map = null; o.material.needsUpdate = true; } });
});
// restore original texture: force reload from saved map
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  for (const [o, s] of window.__v4saved) { o.material = s.mat; o.material.needsUpdate = true; }
});

await browser.close();
srv.close();
console.log("probe2 done");
