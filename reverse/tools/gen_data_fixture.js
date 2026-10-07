#!/usr/bin/env node
/* Regenerate reverse/evidence/tests/data-model-fixture.json from docs/data/*.js.
   Run after ANY intentional data change: node reverse/tools/gen_data_fixture.js
   The fixture captures the data modules' runtime shape (pre-refactor table shape). */
const path = require("path");
const fs = require("fs");
const root = path.join(__dirname, "..", "..");
const g = globalThis;
require(path.join(root, "docs", "data", "stats.js"));
require(path.join(root, "docs", "data", "weapons.js"));
require(path.join(root, "docs", "data", "units.js"));
require(path.join(root, "docs", "data", "buildings.js"));
require(path.join(root, "docs", "data", "factions.js"));
require(path.join(root, "docs", "data", "index.js"));
const D = g.AOW3_DATA;
if (!D || !D.units || !D.weapons) throw new Error("AOW3_DATA incomplete");
// NOTE: docs/data/index.js already resolved weaponId/meleeId -> weapon/melee in place,
// so the runtime shape here matches what game.js consumes. Snapshot it directly.
const UNITS = JSON.parse(JSON.stringify(D.units));
const FIX = {
  UNITS,
  BUILD_ORDER_F1: D.factions[1].buildOrder,
  BUILD_ORDER_F2: D.factions[2].buildOrder,
  HERO_ORDER: D.factions[1].heroOrder,
  HQ: D.hq,
  DEPOT: D.depot,
  BLD: D.buildings,
  BUILDINGS_ORDER: D.buildingsOrder,
  PRODUCER_OF: D.producers,
  ECONOMY: D.economy
};
const out = path.join(root, "reverse", "evidence", "tests", "data-model-fixture.json");
fs.writeFileSync(out, JSON.stringify(FIX, null, 1) + "\n");
console.log("fixture written:", out);
console.log("UNITS:", Object.keys(FIX.UNITS).length, "HERO_ORDER:", FIX.HERO_ORDER.join(","));
