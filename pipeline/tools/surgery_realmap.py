#!/usr/bin/env python3
"""AOW3 game.js surgery: real map + audio + fx + water + camera + minimap.
Every replacement asserts exactly-once (unless allow=0)."""
import sys

P = "/home/z/my-project/scripts/AOW3-repo/docs/game.js"
src = open(P).read()
n_edits = 0

def rep(old, new, count=1, allow=0):
    global src, n_edits
    c = src.count(old)
    if c != count and c != allow:
        print(f"FAIL ({c}x, want {count}): {old[:90]!r}")
        sys.exit(1)
    if c == 0:
        print(f"SKIP (0x): {old[:70]!r}")
        return
    src = src.replace(old, new)
    n_edits += 1
    print(f"ok ({c}x): {old[:64]!r}")

# ---------- 1. world size ----------
rep("var MAP_W = 96", "var MAP_W = 160")
rep("var MAP_H = 96", "var MAP_H = 160")

# ---------- 2. atlas files ----------
rep('jungleground2: "atlas-jungleground2.png" }',
    'jungleground2: "atlas-jungleground2.png", jungleterrain: "atlas-jungleterrain.png" }')

# ---------- 3. preloadDecor: real-map template loading ----------
OLD_PICKS = '''      const byCat = { tree: [], palm: [], bush: [], rock: [], grass: [] };
      for (const e of index) {
        if (byCat[e.cat])
          byCat[e.cat].push(e);
      }
      const want = { tree: 10, palm: 6, bush: 8, rock: 6, grass: 5 };
      const picks = [];
      for (const [cat, n] of Object.entries(want)) {
        picks.push(...pickSpread(byCat[cat], n));
      }
      await Promise.all(picks.map(async (e) => {
        try {
          const g = await new Promise((res) => {
            loader.load(`${base}models/${e.f}`, (g2) => res(g2), undefined, () => res(null));
          });
          if (!g)
            return;
          const parts = [];
          g.scene.updateMatrixWorld(true);
          g.scene.traverse((o) => {
            const mesh = o;
            if (!mesh.isMesh)
              return;
            const geo = mesh.geometry.clone();
            geo.applyMatrix4(mesh.matrixWorld);
            const m = mesh.material.clone();
            m.side = DoubleSide;
            m.metalness = 0;
            m.transparent = false;
            m.alphaTest = 0.45;
            const ak = e.mats && e.mats[m.name];
            const tex = ak ? atlasTex[ak] : null;
            if (tex) {
              m.map = tex;
              m.needsUpdate = true;
            }
            if (m.map)
              m.map.colorSpace = SRGBColorSpace;
            parts.push({ geometry: geo, material: m });
          });
          if (!parts.length)
            return;
          const bbox = new Box3;
          for (const p of parts) {
            p.geometry.computeBoundingBox();
            bbox.union(p.geometry.boundingBox);
          }
          const c = bbox.getCenter(new Vector3);
          const minY = bbox.min.y;
          for (const p of parts) {
            p.geometry.translate(-c.x, -minY, -c.z);
          }
          const bakedH = Math.max(0.4, bbox.max.y - minY);
          const size = bbox.getSize(new Vector3);
          const maxDim = Math.max(0.4, size.x, size.y, size.z);
          templates2.push({
            name: e.n,
            cat: e.cat,
            parts,
            baseH: bakedH,
            maxDim
          });
        } catch {}
      }));'''
NEW_PICKS = '''      const byCat = { tree: [], palm: [], bush: [], rock: [], grass: [] };
      for (const e of index) {
        if (byCat[e.cat])
          byCat[e.cat].push(e);
      }
      let picks = null;
      try {
        const mr = await fetch(`${base}models/map.json`);
        if (mr.ok) {
          const placements = await mr.json();
          window.__realMap = placements;
          const names = [...new Set(placements.map((p) => p.m).filter(Boolean))];
          const byName = new Map;
          for (const e of index)
            if (!byName.has(e.n))
              byName.set(e.n, e);
          picks = names.map((n) => byName.get(n)).filter(Boolean);
          picks.push(...pickSpread(byCat.tree, 3), ...pickSpread(byCat.rock, 2));
        }
      } catch {}
      if (!picks || !picks.length) {
        picks = [];
        const want = { tree: 10, palm: 6, bush: 8, rock: 6, grass: 5 };
        for (const [cat, n] of Object.entries(want)) {
          picks.push(...pickSpread(byCat[cat], n));
        }
      }
      {
        const seenF = new Set;
        picks = picks.filter((e) => e && !seenF.has(e.f) && seenF.add(e.f));
      }
      const progEl = typeof document !== "undefined" ? document.getElementById("baking") : null;
      let doneN = 0;
      const totalN = picks.length;
      const CONC = 14;
      for (let pi = 0; pi < picks.length; pi += CONC) {
        await Promise.all(picks.slice(pi, pi + CONC).map(async (e) => {
          try {
            const g = await new Promise((res) => {
              loader.load(`${base}models/${e.f}`, (g2) => res(g2), undefined, () => res(null));
            });
            if (!g)
              return;
            const parts = [];
            g.scene.updateMatrixWorld(true);
            g.scene.traverse((o) => {
              const mesh = o;
              if (!mesh.isMesh)
                return;
              const geo = mesh.geometry.clone();
              geo.applyMatrix4(mesh.matrixWorld);
              const m = mesh.material.clone();
              m.side = DoubleSide;
              m.metalness = 0;
              m.transparent = false;
              m.alphaTest = e.cat === "ground" ? 0.05 : 0.45;
              const ak = e.mats && e.mats[m.name];
              const tex = ak ? atlasTex[ak] : null;
              if (tex) {
                m.map = tex;
                m.needsUpdate = true;
              }
              if (m.map)
                m.map.colorSpace = SRGBColorSpace;
              parts.push({ geometry: geo, material: m });
            });
            if (!parts.length)
              return;
            const bbox = new Box3;
            for (const p of parts) {
              p.geometry.computeBoundingBox();
              bbox.union(p.geometry.boundingBox);
            }
            const isGround = e.cat === "ground";
            if (!isGround) {
              const c = bbox.getCenter(new Vector3);
              const minY = bbox.min.y;
              for (const p of parts) {
                p.geometry.translate(-c.x, -minY, -c.z);
              }
            }
            const bakedH = Math.max(0.4, bbox.max.y - bbox.min.y);
            const size = bbox.getSize(new Vector3);
            const maxDim = Math.max(0.4, size.x, size.y, size.z);
            templates2.push({
              name: e.n,
              cat: e.cat,
              parts,
              baseH: bakedH,
              maxDim,
              ground: isGround
            });
          } catch {}
        }));
        doneN = Math.min(totalN, pi + CONC);
        if (progEl)
          progEl.textContent = `… LOADING REAL MAP  ${doneN}/${totalN}`;
      }'''
rep(OLD_PICKS, NEW_PICKS)

# ---------- 4. applyTerrainGrid dispatch ----------
rep('''      if (decorReady()) {
        this.applyDecorScatter(grid);
        return;
      }''',
    '''      if (window.__realMap && decorReady()) {
        this.applyRealMap();
        return;
      }
      if (decorReady()) {
        this.applyDecorScatter(grid);
        return;
      }''')

# ---------- 5. applyRealMap method (insert before hqTextures) ----------
rep('''    hqTextures(hqImg) {''',
    '''    applyRealMap() {
      const temps = decorTemplates();
      const byName = new Map;
      temps.forEach((t) => {
        if (!byName.has(t.name))
          byName.set(t.name, t);
      });
      const all = window.__realMap || [];
      const entries = [];
      for (const p of all) {
        if (!p.m || p.p[1] < -1.5)
          continue;
        const t = byName.get(p.m);
        if (!t)
          continue;
        entries.push({ t, p: p.p, q: p.q, s: p.s });
      }
      const dummy = new Object3D;
      const byT = new Map;
      for (const e of entries) {
        let arr = byT.get(e.t);
        if (!arr) {
          arr = [];
          byT.set(e.t, arr);
        }
        arr.push(e);
      }
      for (const [t, arr] of byT) {
        for (const part of t.parts) {
          const im = new InstancedMesh(part.geometry, part.material, arr.length);
          im.castShadow = t.cat !== "ground" && t.cat !== "grass";
          im.receiveShadow = true;
          im.frustumCulled = false;
          for (let i = 0; i < arr.length; i++) {
            const e = arr[i];
            dummy.position.set(e.p[0] + RMAP.shx, e.p[1], e.p[2] + RMAP.shz);
            dummy.quaternion.set(e.q[0], e.q[1], e.q[2], e.q[3]);
            dummy.scale.set(e.s[0], e.s[1], e.s[2]);
            dummy.updateMatrix();
            im.setMatrixAt(i, dummy.matrix);
          }
          im.instanceMatrix.needsUpdate = true;
          this.scene.add(im);
          this.scatterMeshes.push(im);
        }
      }
      if (this.groundMesh)
        this.groundMesh.visible = false;
    }
    addWater() {
      try {
        const t = new TextureLoader().load(this.assetBase + "models/water.png");
        t.colorSpace = SRGBColorSpace;
        t.wrapS = t.wrapT = RepeatWrapping;
        t.repeat.set(26, 26);
        const mat = new MeshStandardMaterial({
          color: 5275088, map: t, roughness: 0.32, metalness: 0.08,
          transparent: true, opacity: 0.92
        });
        const w = new Mesh(new PlaneGeometry(560, 560), mat);
        w.rotation.x = -Math.PI / 2;
        w.position.y = -0.42;
        this.scene.add(w);
      } catch (e) {}
    }
    loadRealMapExtras(base) {
      const tl = new TextureLoader;
      const fixS = (t) => {
        t.colorSpace = SRGBColorSpace;
        return t;
      };
      tl.load(`${base}fx/glow.png`, (t) => {
        fixS(t);
        this.texFlash = t;
        this.texGlow = t;
      });
      tl.load(`${base}fx/smoke.png`, (t) => {
        fixS(t);
        this.texSmoke = t;
      });
      tl.load(`${base}fx/expl.png`, (t) => {
        fixS(t);
        this.texExpl = t;
      });
      fetch(`${base}models/heightmap.json`).then((r) => r.json()).then((m) => {
        const img = new Image;
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = m.res;
          c.height = m.res;
          const g = c.getContext("2d");
          g.drawImage(img, 0, 0);
          const px = g.getImageData(0, 0, m.res, m.res).data;
          RMAP.data = new Float32Array(m.res * m.res);
          for (let i = 0; i < m.res * m.res; i++)
            RMAP.data[i] = px[i * 4] / 255;
          RMAP.hscale = m.hscale || 1;
          RMAP.x0 = m.x0;
          RMAP.x1 = m.x1;
          RMAP.z0 = m.z0;
          RMAP.z1 = m.z1;
          RMAP.res = m.res;
        };
        img.src = `${base}models/heightmap.png`;
      }).catch(() => {});
      const mm = new Image;
      mm.onload = () => {
        this.miniMapImg = mm;
      };
      mm.src = `${base}minimap-jungle.png`;
    }
    hqTextures(hqImg) {''')

# ---------- 6. RMAP globals + heightAtWorld ----------
rep('''  var MAP2 = MAP_W / 2;
  var t2w = (x, y) => [x - MAP2, y - MAP2];''',
    '''  var MAP2 = MAP_W / 2;
  var t2w = (x, y) => [x - MAP2, y - MAP2];
  var RMAP = { shx: -1.58, shz: 14.75, x0: -84, x1: 86, z0: -85, z1: 55, res: 256, data: null, hscale: 1 };
  function heightAtWorld(x, z) {
    const d = RMAP.data;
    if (!d)
      return 0;
    const rx = x - RMAP.shx, rz = z - RMAP.shz;
    const fx = (rx - RMAP.x0) / (RMAP.x1 - RMAP.x0) * (RMAP.res - 1);
    const fz = (rz - RMAP.z0) / (RMAP.z1 - RMAP.z0) * (RMAP.res - 1);
    const x0 = Math.max(0, Math.min(RMAP.res - 2, Math.floor(fx)));
    const z0 = Math.max(0, Math.min(RMAP.res - 2, Math.floor(fz)));
    const tx = Math.max(0, Math.min(1, fx - x0)), tz = Math.max(0, Math.min(1, fz - z0));
    const i = z0 * RMAP.res + x0;
    return ((d[i] * (1 - tx) + d[i + 1] * tx) * (1 - tz) + (d[i + RMAP.res] * (1 - tx) + d[i + RMAP.res + 1] * tx) * tz) * RMAP.hscale;
  }''')

# ---------- 7. load(): extras + water ----------
rep('''      this.buildStaticWorld(baked.texture, hqImg.status === "fulfilled" ? hqImg.value : null);''',
    '''      this.buildStaticWorld(baked.texture, hqImg.status === "fulfilled" ? hqImg.value : null);
      this.addWater();
      this.loadRealMapExtras(base);''')

# ---------- 8. syncUnits: unit y + rings + shadow ----------
rep('g.position.set(v.pos.x, air ? 2.1 + Math.sin(this.time * 2.1 + u.id) * 0.09 : 0, v.pos.z);',
    'g.position.set(v.pos.x, air ? 2.1 + Math.sin(this.time * 2.1 + u.id) * 0.09 : heightAtWorld(v.pos.x, v.pos.z), v.pos.z);')
rep('''        const isSel = sel.has(u.id);
        v.selRing.visible = isSel;''',
    '''        const isSel = sel.has(u.id);
        v.selRing.position.set(v.pos.x, heightAtWorld(v.pos.x, v.pos.z) + 0.07, v.pos.z);
        v.capRing.position.set(v.pos.x, heightAtWorld(v.pos.x, v.pos.z) + 0.06, v.pos.z);
        v.selRing.visible = isSel;''')
rep('v.shadow.position.set(v.pos.x + 0.7, 0.05, v.pos.z + 0.6);',
    'v.shadow.position.set(v.pos.x + 0.7, heightAtWorld(v.pos.x + 0.7, v.pos.z + 0.6) + 0.05, v.pos.z + 0.6);')

# ---------- 9. building y ----------
rep('''      const [wx, wz] = t2w(b.x, b.y);
      group.position.set(wx, 0, wz);''',
    '''      const [wx, wz] = t2w(b.x, b.y);
      group.position.set(wx, heightAtWorld(wx, wz), wz);''')

# ---------- 10. projectile y ----------
rep('const pos = new Vector3(wx, 0.55, wz);',
    'const pos = new Vector3(wx, heightAtWorld(wx, wz) + 0.55, wz);')

# ---------- 11. explosion: ring y + expl puff ----------
rep('''      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, 0.12, z);''',
    '''      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, heightAtWorld(x, z) + 0.12, z);
      if (this.texExpl)
        this.addFx(this.texExpl, x, y + 0.9, z, scale * 3.8, 0.55, scale * 2.6, true, 0.9);''')

# ---------- 12. fog softer ----------
rep('d[o + 3] = 92;', 'd[o + 3] = 74;')
rep('d[o + 3] = 212;', 'd[o + 3] = 195;')

# ---------- 13. minimap real image ----------
rep('''      if (!this.miniBg && this.groundCanvas)
        this.miniBg = minimapBg(this.groundCanvas, mmW, mmH);
      ctx.clearRect(0, 0, mmW, mmH);
      if (this.miniBg)
        ctx.drawImage(this.miniBg, 0, 0);''',
    '''      ctx.clearRect(0, 0, mmW, mmH);
      if (this.miniMapImg) {
        const sxr = mmW / MAP_W, syr = mmH / MAP_H;
        const wx0 = RMAP.x0 + RMAP.shx + MAP2, wz0 = RMAP.z0 + RMAP.shz + MAP2;
        const wx1 = RMAP.x1 + RMAP.shx + MAP2, wz1 = RMAP.z1 + RMAP.shz + MAP2;
        ctx.drawImage(this.miniMapImg, wx0 * sxr, wz0 * syr, (wx1 - wx0) * sxr, (wz1 - wz0) * syr);
      } else {
        if (!this.miniBg && this.groundCanvas)
          this.miniBg = minimapBg(this.groundCanvas, mmW, mmH);
        if (this.miniBg)
          ctx.drawImage(this.miniBg, 0, 0);
      }''')

# ---------- 14. camera default ----------
rep("cam = { x: MAP_W / 2, y: MAP_H / 2, dist: 26 }", "cam = { x: MAP_W / 2, y: MAP_H / 2, dist: 21 }")
rep("cam.dist = 26;", "cam.dist = 21;")

# ---------- 15. menu text ----------
rep('ART OF WAR 3 · BROWSER TRIBUTE', 'ART OF WAR 3 · BROWSER EDITION')
rep('''Real-time 3D skirmish rebuilt from the real APK: damage &amp; armor math
      reverse-engineered from <code>libil2cpp.so</code>, battlefield dressed with the game's own
      extracted terrain decals, HQ art and unit cards. Fan project — not affiliated with Gear Games.''',
    '''Real-time 3D skirmish rebuilt from the real APK: fighting on the game's actual
      jungle map (6,400 original props, real terrain chunks, real water), original 3D unit
      models and animations, damage &amp; armor math reverse-engineered from
      <code>libil2cpp.so</code>, real game audio. Fan project — not affiliated with Gear Games.''')
rep('… BAKING BATTLEFIELD', '… LOADING THE REAL MAP')

# ---------- 16. endgame sfx ----------
rep('''      $("verdict").textContent = win ? "VICTORY" : "DEFEAT";''',
    '''      $("verdict").textContent = win ? "VICTORY" : "DEFEAT";
      window.__sfx && window.__sfx.play(win ? "ann_victory" : "ann_defeat", { vol: 0.9 });''')

# ---------- 17. Sfx class + hooks (append before IIFE close) ----------
rep('''      sim = null;
    }
  }
  requestAnimationFrame(loop);
})();''',
    '''      sim = null;
    }
  }
  requestAnimationFrame(loop);
  class Sfx {
    constructor(base) {
      this.base = base;
      this.ctx = null;
      this.buf = new Map;
      this.getDist = null;
    }
    load() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC)
        return;
      try {
        this.ctx = new AC();
      } catch (e) {
        return;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      const names = ["w_rifle1", "w_rifle2", "w_gun3", "w_mg1", "w_mg2", "w_mg3", "w_mg4", "w_cannon1", "w_cannon2", "w_cannon3", "w_cannon4", "w_missile1", "w_missile2", "w_missile3", "w_bomb1", "w_flame1", "w_flame2", "b_med1", "b_med2", "b_med3", "b_big1", "b_big2", "b_big3", "b_bld_big", "b_bld_med", "b_metal", "ui_click1", "ui_click2", "ui_tap", "ann_ready", "ann_captured", "ann_flag_lost", "ann_enemy", "ann_built", "ann_defeat", "ann_arrived", "ann_base_attack", "ann_flags_lost", "ann_victory", "ann_achievement", "bld_start", "bld_end"];
      for (const n of names) {
        fetch(`${this.base}sfx/${n}.wav`).then((r) => r.ok ? r.arrayBuffer() : Promise.reject(new Error("404"))).then((ab) => this.ctx.decodeAudioData(ab)).then((b) => {
          this.buf.set(n, b);
        }).catch(() => {});
      }
      const resume = () => {
        this.ctx.state === "suspended" && this.ctx.resume();
      };
      document.addEventListener("pointerdown", resume);
      document.addEventListener("keydown", resume);
    }
    play(name, opts = {}) {
      const b = this.buf.get(name);
      if (!b || !this.ctx)
        return;
      this.ctx.state === "suspended" && this.ctx.resume();
      let vol = opts.vol ?? 0.7;
      if (opts.pos && this.getDist) {
        const d = this.getDist(opts.pos[0], opts.pos[1]);
        vol *= Math.max(0.05, 1 - d / 80);
      }
      try {
        const src2 = this.ctx.createBufferSource();
        src2.buffer = b;
        src2.playbackRate.value = opts.rate || 0.94 + Math.random() * 0.12;
        const g = this.ctx.createGain();
        g.gain.value = vol;
        src2.connect(g);
        g.connect(this.master);
        src2.start();
      } catch (e) {}
    }
  }
  window.__sfx = new Sfx("assets/");
  window.__sfx.load();
  window.__sfx.getDist = (x, z) => {
    const r = window.__DBG && window.__DBG.r3d;
    if (!r || !r.camera)
      return 0;
    return Math.hypot(r.camera.position.x - x, r.camera.position.z - z);
  };
  {
    const _fire = Renderer3D.prototype.fireEvent;
    Renderer3D.prototype.fireEvent = function(px, py, owner) {
      const r = _fire.call(this, px, py, owner);
      try {
        let best = null, bd = 2.2;
        for (const v of this.unitViews.values()) {
          const u = v.model.group.userData.unit;
          if (!u || u.owner !== owner)
            continue;
          const d = Math.hypot(u.x - px, u.y - py);
          if (d < bd) {
            bd = d;
            best = u;
          }
        }
        if (best) {
          const def = best.def;
          const splash = def.weapon && def.weapon.splash || 0;
          let pool;
          if (def.kind === "aircraft")
            pool = ["w_missile1", "w_mg2"];
          else if (splash >= 1)
            pool = ["w_missile1", "w_missile2", "w_cannon4"];
          else if (def.kind === "infantry")
            pool = ["w_rifle1", "w_rifle2", "w_mg1"];
          else
            pool = ["w_cannon1", "w_cannon2", "w_mg3"];
          window.__sfx.play(pool[Math.floor(Math.random() * pool.length)], { pos: [px - MAP2, py - MAP2], vol: 0.5 });
        }
      } catch (e) {}
      return r;
    };
    const _expl = Renderer3D.prototype.explosion;
    Renderer3D.prototype.explosion = function(x, y, z, r) {
      const res = _expl.call(this, x, y, z, r);
      try {
        const pool = r >= 2 ? ["b_big1", "b_big2", "b_bld_big"] : r >= 1.2 ? ["b_med1", "b_med2", "b_bld_med"] : ["b_med3", "b_metal"];
        window.__sfx.play(pool[Math.floor(Math.random() * pool.length)], { pos: [x, z], vol: 0.8 });
      } catch (e) {}
      return res;
    };
    document.addEventListener("click", (e) => {
      const t = e.target;
      try {
        if (t.closest && t.closest(".card"))
          window.__sfx.play("ui_click1", { vol: 0.5 });
        if (t.id === "start" || t.id === "rematch")
          window.__sfx.play("ann_ready", { vol: 0.9 });
        if (t.id === "home")
          window.__sfx.play("ui_tap", { vol: 0.5 });
      } catch (err) {}
    });
  }
})();''')

open(P, "w").write(src)
print(f"\nDONE — {n_edits} edits applied")
