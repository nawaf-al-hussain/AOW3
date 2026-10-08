#!/usr/bin/env node
// V4 lighting/material calibration probe (visual-fidelity-audit §5/§9/§21-V4).
//
//   node reverse/tools/v4_light_probe.mjs [--port <p>] [--out <dir>] [--pose tactical-close]
//
// Produces, for ONE fixed-seed boot (seed 12345):
//   1. probe_inventory.json — every light (type/color/intensity/pos/shadow cam),
//      renderer color pipeline (toneMapping/exposure/colorSpace/shadow type),
//      and every unit-view mesh (material type, color, roughness, metalness,
//      emissive, map presence + image size + colorSpace, skinning, geometry
//      attributes, world position) — the material-truth side of the V4 filing.
//   2. probe-<state>.png — per-light ablation captures at the chosen pose:
//      all (baseline), hemi-only, sun-only, fill-only, ambient-none.
//      Lights are toggled via .visible on live scene objects (QA-only probes,
//      AGENTS.md §35.3 discipline — nothing written back into sim state).
// Evidence-first: this script records what IS, it does not assert what should be.

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DOCS = join(ROOT, "docs");
const VISUAL = join(ROOT, "reverse", "evidence", "visual");

const args = process.argv.slice(2);
const argOf = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const PORT = +(argOf("--port") || 8141);
const OUT = resolve(argOf("--out") || VISUAL);
const POSE_ID = argOf("--pose") || "tactical-close";

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
const MANIFEST = JSON.parse(await readFile(join(VISUAL, "manifest.json"), "utf8"));
const pose = MANIFEST.scenarios.find((s) => s.id === POSE_ID).pose;

const srv = await serve();
const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: MANIFEST.viewport[0], height: MANIFEST.viewport[1] }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("pageerror:", String(e).slice(0, 200)));

await page.goto(`http://127.0.0.1:${PORT}/index.html#seed=${MANIFEST.seed}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#start", { timeout: 20000 });
await page.click("#start");
await page.waitForFunction(() => {
  const a = window.__aow3 && window.__aow3();
  const d = window.__DBG;
  return !!(a && a.sim && a.sim.tick > 90 && d && d.r3d && d.r3d.realTerrain && window.__realMap);
}, null, { timeout: 60000, polling: 250 });

// drive to the requested pose (same semantics as visual_harness.mjs)
await page.evaluate((p) => {
  const cam = window.__DBG.cam;
  const sim = window.__aow3().sim;
  if (p.focus === "hq-blue") { const h = sim.hq(1); cam.x = h.x + (p.dx ?? 6); cam.y = h.y + (p.dy ?? 0); }
  else if (p.focus === "hq-red") { const h = sim.hq(2); cam.x = h.x + (p.dx ?? 0); cam.y = h.y + (p.dy ?? 0); }
  else if (p.focus === "center") { cam.x = 80 + (p.dx ?? 0); cam.y = 80 + (p.dy ?? 0); }
  cam.dist = p.dist; cam.yaw = p.yaw;
}, pose);
await page.waitForTimeout(1600);

// ---- 1. scene inventory -----------------------------------------------------
const inventory = await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  const hex = (c) => c && c.isColor ? "#" + c.getHexString() : null;
  const lights = [];
  r3d.scene.traverse((o) => {
    if (!o.isLight) return;
    const L = { kind: o.type, name: o.name || null, visible: o.visible, color: hex(o.color), intensity: o.intensity, worldPos: o.getWorldPosition(new (o.position.constructor)()).toArray().map((v) => +v.toFixed(2)) };
    if (o.isHemisphereLight) L.groundColor = hex(o.groundColor);
    if (o.isDirectionalLight && o.castShadow) {
      const sc = o.shadow.camera;
      L.shadow = { mapSize: o.shadow.mapSize.toArray(), l: sc.left, r: sc.right, t: sc.top, b: sc.bottom, near: sc.near, far: sc.far, bias: o.shadow.bias, normalBias: o.shadow.normalBias, type: r3d.renderer.shadowMap.type };
    }
    lights.push(L);
  });
  const matSummary = (m) => m == null ? null : Array.isArray(m) ? m.map(matSummary) : ({
    type: m.type, color: hex(m.color), roughness: +m.roughness?.toFixed(3), metalness: +m.metalness?.toFixed(3),
    emissive: hex(m.emissive), opacity: m.opacity, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side,
    vertexColors: !!m.vertexColors,
    map: m.map ? { sized: !!(m.map.image && m.map.image.width), w: m.map.image?.width, colorSpace: m.map.colorSpace, flipY: m.map.flipY } : null
  });
  const meshSummary = (mesh) => ({
    name: mesh.name || null, kind: mesh.type, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow,
    material: matSummary(mesh.material),
    geo: { hasNormals: !!mesh.geometry?.attributes?.normal, hasColor: !!mesh.geometry?.attributes?.color, hasUv: !!mesh.geometry?.attributes?.uv }
  });
  const units = [];
  for (const [id, v] of r3d.unitViews) {
    const meshes = [];
    v.model?.group?.traverse?.((o) => { if (o.isMesh) meshes.push(meshSummary(o)); }) ??
      v.group?.traverse?.((o) => { if (o.isMesh) meshes.push(meshSummary(o)); });
    units.push({ id, owner: v.owner ?? null, defId: v.defId ?? v.def?.id ?? null, kind: v.def?.kind ?? null, worldPos: v.group?.position?.toArray?.().map((x) => +x.toFixed(2)) ?? v.model?.group?.position?.toArray?.().map((x) => +x.toFixed(2)) ?? null, hp: v.lastHp ?? null, meshCount: meshes.length, meshes });
  }
  const buildings = [];
  for (const [id, v] of r3d.bldViews) {
    const meshes = [];
    (v.model?.group || v.group)?.traverse((o) => { if (o.isMesh) meshes.push(meshSummary(o)); });
    buildings.push({ id, defId: v.def?.id ?? null, worldPos: (v.model?.group || v.group)?.position?.toArray?.().map((x) => +x.toFixed(2)) ?? null, meshCount: meshes.length, meshes: meshes.slice(0, 3) });
  }
  const R = r3d.renderer;
  return {
    renderer: { toneMapping: R.toneMapping, toneMappingExposure: R.toneMappingExposure, outputColorSpace: R.outputColorSpace, shadowMap: { enabled: R.shadowMap.enabled, type: R.shadowMap.type } },
    fog: r3d.scene.fog ? { color: hex(r3d.scene.fog.color), near: r3d.scene.fog.near, far: r3d.scene.fog.far } : null,
    cam: (() => { const c = r3d.camera; return { pos: c.position.toArray().map((v) => +v.toFixed(2)), fov: c.fov }; })(),
    lights, units, buildings,
    counts: { units: units.length, buildings: buildings.length }
  };
});
await writeFile(join(OUT, "probe_inventory.json"), JSON.stringify(inventory, null, 1));

// ---- 2. per-light ablation captures ----------------------------------------
const shot = async (name) => page.screenshot({ path: join(OUT, `probe-${name}.png`) });
await shot("all");

const ablate = await page.evaluate(() => {
  const r3d = window.__DBG.r3d;
  const ls = [];
  r3d.scene.traverse((o) => { if (o.isLight) ls.push(o); });
  const saved = ls.map((l) => ({ l, v: l.visible }));
  return { saved, list: ls.map((l) => l.type + (l.intensity !== undefined ? `:${+l.intensity.toFixed(2)}` : "")) };
});

async function setLights(pred) {
  await page.evaluate((predStr) => {
    const r3d = window.__DBG.r3d;
    r3d.scene.traverse((o) => {
      if (!o.isLight) return;
      o.visible = predStr === "all" ? true
        : predStr === "hemi" ? o.isHemisphereLight
        : predStr === "sun" ? (o.isDirectionalLight && o.castShadow === true && o.intensity >= 1.5)
        : predStr === "fill" ? (o.isDirectionalLight && o.castShadow === false)
        : false;
    });
  }, pred);
}
for (const st of ["hemi", "sun", "fill", "none"]) { await setLights(st); await page.waitForTimeout(250); await shot(st); }
await setLights("all");

console.log(`probe done — pose=${POSE_ID} lights=[${ablate.list.join(", ")}] units=${inventory.counts.units} blds=${inventory.counts.buildings}`);
console.log(`renderer:`, JSON.stringify(inventory.renderer));
for (const L of inventory.lights) console.log(`light:`, JSON.stringify(L));

// print the units sorted by distance to camera focus, with material one-liners
const focus = inventory.cam.pos;
const flat = [];
for (const u of inventory.units) {
  for (const m of u.meshes) flat.push({ u: `id=${u.id} def=${u.defId} owner=${u.owner} pos=[${(u.worldPos || []).join(",")}]`, m });
}
for (const f of flat.slice(0, 24)) console.log(`unit ${f.u}\n   mat ${JSON.stringify(f.m.material)} shadow(c=${f.m.castShadow},r=${f.m.receiveShadow}) geo=${JSON.stringify(f.m.geo)}`);

await browser.close();
srv.close();
