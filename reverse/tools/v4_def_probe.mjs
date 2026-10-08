#!/usr/bin/env node
// V4 probe #5 — exact unit->def->texture identity: dump def ids per unit view,
// save each unit's LIVE map image to PNG, and report its UV quadrants.
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const VISUAL = join(ROOT, "reverse", "evidence", "visual");
const PORT = 8149;
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
await page.waitForTimeout(800);

const recs = await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  const out = [];
  window.__v4tex = [];
  for (const [id, v] of r3d.unitViews) {
    const u = v.model?.group?.userData?.unit;
    const meshes = [];
    v.model?.group?.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const rec = { id, defId: u?.def?.id, kind: u?.def?.kind, owner: u?.owner, meshes: [] };
    for (const m of meshes) {
      const uv = m.geometry.attributes.uv;
      let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
      for (let i = 0; i < uv.array.length; i += 2) { u0 = Math.min(u0, uv.array[i]); u1 = Math.max(u1, uv.array[i]); v0 = Math.min(v0, uv.array[i+1]); v1 = Math.max(v1, uv.array[i+1]); }
      rec.meshes.push({ name: m.name, uv: [+u0.toFixed(2), +u1.toFixed(2), +v0.toFixed(2), +v1.toFixed(2)] });
    }
    if (meshes[0]?.material?.map?.image) {
      const img = meshes[0].material.map.image;
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      rec.texData = c.toDataURL("image/png");
      rec.texW = img.width; rec.texH = img.height;
    }
    out.push(rec);
  }
  return out;
});
for (const r of recs) {
  const { texData, ...rest } = r;
  console.log(JSON.stringify(rest));
  if (texData) await writeFile(join(VISUAL, `probe5-tex-unit${r.id}-def${r.defId}.png`), Buffer.from(texData.split(",")[1], "base64"));
}
await browser.close();
srv.close();
console.log("probe5 done");
