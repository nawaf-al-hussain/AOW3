/*! AOW3 tribute data model - buildings.js (Phase 2). Generated 2026-10-07; edit values via the
 * documented pipeline, keep runtime shape identical to the fixture. Evidence: dump.cs (6.9.18, sha256 0050e67d...) via reverse/evidence/data-model/*.json;
reverse/notes/data-model-extraction.md (field<->EStat map, server-side-value policy);
reverse/notes/units/estat-stat-models.md (45 IStatModel classes, natively pinned).
Balance VALUES are gameplay-tuned approximations (native values are backend-delivered).
 */
(function (g) {
  "use strict";
  // HQ / capture-target depot / buildable structures. Values byte-identical to the
  // pre-refactor tables (fixture-verified). model = GLB asset ref (render layer).
  var hq = {"id": "hq", "name": "Headquarters", "health": 4200, "radius": 2.2, "view": 13};

  var depot = {"id": "depot", "name": "Supply Depot", "health": 600, "radius": 1.6, "view": 8};

  var buildings = {

    barracks: {
      id: "barracks",
      name: "Barracks",
      health: 900,
      radius: 1.9,
      view: 9,
      price: 400,
      buildTime: 14,
      model: "f1_bld_barracks"
    },
    factory: {
      id: "factory",
      name: "Factory",
      health: 1100,
      radius: 2.1,
      view: 9,
      price: 550,
      buildTime: 18,
      model: "f1_bld_factory_light"
    },
    heavyfactory: {
      id: "heavyfactory",
      name: "Heavy Factory",
      health: 1400,
      radius: 2.3,
      view: 9,
      price: 850,
      buildTime: 24,
      model: "f1_bld_factory_heavy"
    },
    power: {
      id: "power",
      name: "Power Plant",
      health: 700,
      radius: 1.7,
      view: 8,
      price: 300,
      buildTime: 10,
      model: "f1_bld_power"
    },
    turret: {
      id: "turret",
      name: "Turret",
      health: 800,
      radius: 1.2,
      view: 11,
      price: 450,
      buildTime: 12,
      model: "f1_bld_tower",
      antiAir: true,
      weaponId: "w_bld_turret"
    },
    bunker: {
      id: "bunker",
      name: "Bunker",
      health: 1000,
      radius: 1.4,
      view: 9,
      price: 350,
      buildTime: 10,
      model: "f1_bld_bunker",
      weaponId: "w_bld_bunker"
    },
    herobld: {
      id: "herobld",
      name: "Hero Building",
      health: 1300,
      radius: 2.1,
      view: 9,
      price: 900,
      buildTime: 26,
      model: "f1_bld_hero"
    }
  };
  g.AOW3_DATA = g.AOW3_DATA || {};
  g.AOW3_DATA.hq = hq;
  g.AOW3_DATA.depot = depot;
  g.AOW3_DATA.buildings = buildings;
})(typeof window !== "undefined" ? window : globalThis);
