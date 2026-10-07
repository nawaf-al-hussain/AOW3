/*! AOW3 tribute data model - index.js (Phase 2). Generated 2026-10-07; edit values via the
 * documented pipeline, keep runtime shape identical to the fixture. Evidence: dump.cs (6.9.18, sha256 0050e67d...) via reverse/evidence/data-model/*.json;
reverse/notes/data-model-extraction.md (field<->EStat map, server-side-value policy);
reverse/notes/units/estat-stat-models.md (45 IStatModel classes, natively pinned).
Balance VALUES are gameplay-tuned approximations (native values are backend-delivered).
 */
(function (g) {
  "use strict";
  // Assembles AOW3_DATA and resolves weapon references so sim/render code keeps the
  // pre-refactor shape (def.weapon / def.melee as plain objects).
  // Load order: stats.js -> weapons.js -> units.js -> buildings.js -> factions.js -> index.js
  "use strict";
  var D = g.AOW3_DATA;
  if (!D || !D.units || !D.weapons)
    throw new Error("AOW3_DATA incomplete: load data/*.js in the documented order");
  D.version = 17; // keep in sync with index.html ?v=
  D.nativeUnits = {
    ilight: { conf: 0, res: 100 }, iheavy: { conf: 1, res: 101 }, sniper: { res: 102 },
    hammer: { conf: 11 }, jaguar: { res: 115 }, coyote: { res: 110 }, torrent: { conf: 16 },
    porcupine: { res: 112 }, typhoon: { conf: 12 }, armadillo: { res: 111 }, zeus: { conf: 15 },
    mammoth: { res: 116 }, fortress: { conf: 10, unitType: 24 }, shield: { conf: 17 },
    chameleon: { res: 117 }, helicopter: {}, cerber: { heroType: 1 },
    seraphim: { unitId: 71, heroType: 3 }
  };
  for (var id in D.units) {
    var u = D.units[id];
    if (u.weaponId) {
      if (!D.weapons[u.weaponId])
        throw new Error("unit " + id + ": unresolved weaponId " + u.weaponId);
      u.weapon = D.weapons[u.weaponId];
      delete u.weaponId;
    }
    if (u.meleeId) {
      if (!D.weapons[u.meleeId])
        throw new Error("unit " + id + ": unresolved meleeId " + u.meleeId);
      u.melee = D.weapons[u.meleeId];
      delete u.meleeId;
    }
  }
  for (var bid in D.buildings) {
    var b = D.buildings[bid];
    if (b.weaponId) {
      if (!D.weapons[b.weaponId])
        throw new Error("building " + bid + ": unresolved weaponId " + b.weaponId);
      b.weapon = D.weapons[b.weaponId];
      delete b.weaponId;
    }
  }
  g.AOW3_DATA = g.AOW3_DATA || {};
})(typeof window !== "undefined" ? window : globalThis);
