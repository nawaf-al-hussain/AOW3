#!/usr/bin/env node
// V4 probe #8 — what surfaces actually dominate the ground pixels? Dump the
// live materials of the ground-decal InstancedMeshes + realTerrain under the
// camera, with their map source and color, plus per-mesh screen coverage.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const PORT = 8157;
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
await page.waitForTimeout(900);
const dump = await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  const hex = (c) => "#" + c.getHexString();
  const out = { terrain: null, decorGroups: [], scatter: 0 };
  if (r3d.realTerrain) {
    const m = r3d.realTerrain.material;
    out.terrain = { type: m.type, color: hex(m.color), map: m.map ? (m.map.image?.constructor?.name + " " + (m.map.image?.width || "?") + "px") : null };
  }
  // scan the whole scene: instanced meshes (decor) + meshes with their materials
  const cov = new Map;
  r3d.scene.traverse((o) => {
    if (o.isInstancedMesh) {
      const m = o.material;
      out.decorGroups.push({
        kind: "instanced", count: o.count, name: o.name || null,
        color: hex(m.color), mapType: m.map ? m.map.image?.constructor?.name : null,
        mapSize: m.map?.image?.width || null, userDataCat: o.userData?.cat || null
      });
    }
  });
  // also: how many ground-category templates and their material colors
  const t2 = window.__DBG.r3d.constructor && null;
  return out;
});
console.log(JSON.stringify(dump, null, 1));
await browser.close(); srv.close();
