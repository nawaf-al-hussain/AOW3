#!/usr/bin/env node
// V4 root-cause probe #3 — diff-based unit appearance measurement.
// For each material state: capture frame with all unit views hidden, capture
// frame with them shown, diff → changed pixels are exactly the units. Reports
// mean color of changed pixels + saves the visible-frame crop as PNG.
// States: E1 baseline / E2 map=null / E3 map=red / E4 basic-white / E5 normals-up.

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const VISUAL = join(ROOT, "reverse", "evidence", "visual");
const PORT = 8145;
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

// measure(state label): hide/show units, screenshot each, diff in-page.
async function measure(name) {
  const setUnits = (vis) => page.evaluate((v) => {
    for (const [, uv] of window.__DBG.r3d.unitViews) {
      const g = uv.model?.group || uv.group;
      if (g) g.visible = !!v;
    }
  }, vis);
  // NOTE: syncUnits re-asserts visibility each frame via visibleToPlayer; we
  // freeze the frame first by suspending the RAF loop? Not needed: we set both
  // states back-to-back and grab immediately; sim visibility for own units is
  // true anyway, so toggling .visible on the top group persists within a frame.
  await setUnits(false);
  await page.waitForTimeout(80);
  const b64off = (await page.screenshot()).toString("base64");
  await setUnits(true);
  await page.waitForTimeout(80);
  const b64on = (await page.screenshot()).toString("base64");
  const res = await page.evaluate(async ([off, on, label]) => {
    const load = (b) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = "data:image/png;base64," + b; });
    const [ia, ib] = await Promise.all([load(off), load(on)]);
    const c = document.createElement("canvas"); c.width = ia.width; c.height = ia.height;
    const g = c.getContext("2d");
    g.drawImage(ia, 0, 0);
    const da = g.getImageData(0, 0, c.width, c.height).data;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(ib, 0, 0);
    const db = g.getImageData(0, 0, c.width, c.height).data;
    let r = 0, gg = 0, b = 0, n = 0;
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i+1] - db[i+1]) + Math.abs(da[i+2] - db[i+2]) > 24) {
        r += db[i]; gg += db[i+1]; b += db[i+2]; n++;
        const px = (i / 4) % c.width, py = Math.floor((i / 4) / c.width);
        if (px < minX) minX = px; if (px > maxX) maxX = px;
        if (py < minY) minY = py; if (py > maxY) maxY = py;
      }
    }
    let crop = null;
    if (n > 0) {
      const cw = Math.min(c.width, maxX + 8) - Math.max(0, minX - 8), ch = Math.min(c.height, maxY + 8) - Math.max(0, minY - 8);
      const c2 = document.createElement("canvas"); c2.width = cw; c2.height = ch;
      const g2 = c2.getContext("2d");
      g2.drawImage(c, Math.max(0, minX - 8), Math.max(0, minY - 8), cw, ch, 0, 0, cw, ch);
      crop = c2.toDataURL("image/png");
    }
    window.__v4last = crop;
    return { n, mean: n ? [Math.round(r/n), Math.round(gg/n), Math.round(b/n)] : null, rect: n ? [minX, minY, maxX, maxY] : null, crop };
  }, [b64off, b64on, name]);
  await writeFile(join(VISUAL, `probe3-${name}.png`), Buffer.from(b64on, "base64"));
  console.log(`E[${name}] changed-px=${res.n} mean=${JSON.stringify(res.mean)} rect=${JSON.stringify(res.rect)}`);
  return res;
}

await measure("E1-baseline");

// E2 map=null
await page.evaluate(() => { for (const [, v] of window.__DBG.r3d.unitViews) v.model?.group?.traverse((o) => { if (o.isMesh) { o.material.map = null; o.material.needsUpdate = true; } }); });
await measure("E2-map-null");

// E3 map=solid red (ctor from any existing texture)
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  let texCtor = null;
  r3d.scene.traverse((o) => { if (!texCtor && o.isMesh && o.material?.map) texCtor = o.material.map.constructor; });
  const c = document.createElement("canvas"); c.width = c.height = 4;
  const g = c.getContext("2d"); g.fillStyle = "#ff2020"; g.fillRect(0, 0, 4, 4);
  const t = new texCtor(c); t.colorSpace = "srgb"; t.flipY = false;
  window.__v4red = t;
  for (const [, v] of r3d.unitViews) v.model?.group?.traverse((o) => { if (o.isMesh) { o.material.map = t; o.material.needsUpdate = true; } });
});
await measure("E3-map-red");

// E4 MeshBasicMaterial white
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  let basic = null;
  r3d.scene.traverse((o) => { if (!basic && o.isMesh && o.material?.type === "MeshBasicMaterial") basic = o.material; });
  const mk = basic.clone(); mk.color.setScalar(1); mk.map = null; mk.transparent = false; mk.opacity = 1;
  window.__v4basic = mk;
  for (const [, v] of r3d.unitViews) v.model?.group?.traverse((o) => { if (o.isMesh) { o.material = mk; o.material.needsUpdate = true; } });
});
await measure("E4-basic-white");

// E5 restore standard material, force normals to up
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  for (const [, v] of r3d.unitViews) v.model?.group?.traverse((o) => {
    if (!o.isMesh || o.material === window.__v4basic) return;
    // restore standard material with red map still set (fine for the check)
    const n = o.geometry.attributes.normal;
    if (n) { for (let i = 0; i < n.array.length; i += 3) { n.array[i] = 0; n.array[i+1] = 1; n.array[i+2] = 0; } n.needsUpdate = true; }
  });
});
await measure("E5-normals-up");

// E6 baseline restore (sanity: back to original look)
await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  for (const [, v] of r3d.unitViews) v.model?.group?.traverse((o) => {
    if (!o.isMesh) return;
    const n = o.geometry.attributes.normal;
    // restore normals from index-wound geometry: recompute is overkill; reload from the position-derived default by clearing overrides
    if (n) { o.geometry.computeVertexNormals(); n.needsUpdate = true; }
    o.material = o.material; // unchanged
  });
});
await measure("E6-restored");

await browser.close();
srv.close();
console.log("probe3 done");
