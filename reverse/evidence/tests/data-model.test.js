// Task 17 / Phase 2 — data-model extraction test.
// Guards the docs/data/*.js extraction against the pre-refactor game.js tables
// (reverse/evidence/tests/data-model-fixture.json, snapshot of game.js v=15 lines
// 15-409) and against the native schema (reverse/evidence/data-model/*.json).
//
// Run: node reverse/evidence/tests/data-model.test.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const REPO = path.resolve(__dirname, "..", "..", "..");
const DATA = path.join(REPO, "docs", "data");
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error("FAIL: " + msg); }
}
function deepEq(a, b, where) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) { console.error("len mismatch at " + where); return false; }
    return a.every((v, i) => deepEq(v, b[i], where + "[" + i + "]"));
  }
  if (typeof a === "object") {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) {
      console.error("key mismatch at " + where + ": +" +
        ka.filter(k => !kb.includes(k)).join(",") + " -" + kb.filter(k => !ka.includes(k)).join(","));
      return false;
    }
    return ka.every(k => deepEq(a[k], b[k], where + "." + k));
  }
  console.error("scalar mismatch at " + where + ": " + a + " vs " + b);
  return false;
}

// ---- load the data modules exactly like index.html does ----
const ctx = { console, Error };
vm.createContext(ctx);
for (const f of ["stats.js", "weapons.js", "units.js", "buildings.js", "factions.js", "index.js"]) {
  vm.runInContext(fs.readFileSync(path.join(DATA, f), "utf8"), ctx, { filename: f });
}
const D = ctx.AOW3_DATA;
ok(D && D.version === 17, "AOW3_DATA.version === 17");

// ---- 1. fixture equivalence (behavior-neutrality guard) ----
const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, "data-model-fixture.json"), "utf8"));
ok(deepEq(D.units, FIX.UNITS, "units"), "UNITS deep-equal fixture");
ok(deepEq(D.buildings, FIX.BLD, "buildings"), "BLD deep-equal fixture");
ok(deepEq(D.hq, FIX.HQ, "hq"), "HQ deep-equal fixture");
ok(deepEq(D.depot, FIX.DEPOT, "depot"), "DEPOT deep-equal fixture");
ok(deepEq(D.producers, FIX.PRODUCER_OF, "producers"), "PRODUCER_OF deep-equal fixture");
ok(deepEq(D.buildingsOrder, FIX.BUILDINGS_ORDER, "buildingsOrder"), "BUILDINGS_ORDER deep-equal fixture");
ok(deepEq(D.factions[1].buildOrder, FIX.BUILD_ORDER_F1, "f1"), "BUILD_ORDER_F1 deep-equal fixture");
ok(deepEq(D.factions[2].buildOrder, FIX.BUILD_ORDER_F2, "f2"), "BUILD_ORDER_F2 deep-equal fixture");
ok(deepEq(D.factions[1].heroOrder, FIX.HERO_ORDER, "heroes"), "HERO_ORDER deep-equal fixture");
ok(D.economy.baseIncome === FIX.ECONOMY.baseIncome && D.economy.depotIncome === FIX.ECONOMY.depotIncome &&
   D.economy.baseCP === FIX.ECONOMY.baseCP && D.economy.depotCP === FIX.ECONOMY.depotCP &&
   D.economy.captureTimeNeutral === FIX.ECONOMY.captureTimeNeutral &&
   D.economy.captureTimeEnemy === FIX.ECONOMY.captureTimeEnemy,
   "ECONOMY legacy keys deep-equal fixture");
// powerIncome/powerCP were hardcoded `power * 2` pre-refactor (game.js:853-854 @v=15)
ok(D.economy.powerIncome === 2 && D.economy.powerCP === 2, "powerIncome/powerCP === 2 (extracted hardcode)");

// ---- 2. EStat taxonomy vs extracted native evidence ----
const EJ = JSON.parse(fs.readFileSync(path.join(REPO, "reverse/evidence/data-model/estat.json"), "utf8"));
ok(EJ.count === 78 && EJ.values.length === 78, "estat.json has 78 values");
ok(Object.keys(D.estat).length === 78, "AOW3_DATA.estat has 78 entries");
let estatOk = true;
for (const v of EJ.values) if (D.estat[v.name] !== v.id) estatOk = false;
ok(estatOk, "every EStat name->id matches estat.json");
ok(D.estat.Health === 1 && D.estat.ArmorLight === 7 && D.estat.ArmorHeavy === 9 &&
   D.estat.View === 10 && D.estat.HealthRegeneration === 18 && D.estat.WeaponArmorLight === 61 &&
   D.estat.WeaponAccuracy === 59 && D.estat.WeaponFireRate === 60 && D.estat.CerberusWeaponSwitchTime === 40 &&
   D.estat.SeraphimGroundModeTransitionTime === 41,
   "spot-check EStat anchors (dump.cs:168776)");
const WJ = JSON.parse(fs.readFileSync(path.join(REPO, "reverse/evidence/data-model/weapon-schema.json"), "utf8"));
ok(WJ.field_count === 27, "weapon schema has 27 fields");
const wNames = new Set(WJ.fields.map(f => f.name));
for (const k of ["m_damageLight", "m_damageMedium", "m_damageHeavy", "m_accuracyStatic", "m_accuracyWalk", "m_explosionRadius", "m_explosionDecr", "m_velocity"])
  ok(wNames.has(k), "weapon schema has " + k);

// ---- 3. unit field -> EStat coverage ----
const fieldMap = D.fieldEstat.units;                       // mapped native keys
const mappedUnit = new Set(Object.keys(fieldMap).flatMap(k => k.split("."))); // incl. armor.*
const localUnit = new Set(["id", "name", "kind", "captures", "radius", "antiAir", "aircraft",
  "hero", "faction", "aura", "meleeId", "melee", "weaponId", "weapon", "card", "tint", "desc",
  "crit", "critMul"]); // crit/critMul: Cerber blades stand-in, gameplay-tuned
const mappedWpn = new Set(Object.keys(D.weaponFieldMap).flatMap(k => k.split(".")));
let covOk = true;
for (const [id, u] of Object.entries(D.units)) {
  for (const k of Object.keys(u)) {
    // armorClass is native-mapped: ArmorType enum (Light=0/Medium=1/Heavy=2, dump.cs:166696)
    if (k === "armorClass") continue;
    if (!mappedUnit.has(k) && !localUnit.has(k)) { covOk = false; console.error("unmapped unit field " + id + "." + k); }
  }
  const w = u.weapon;
  if (w) for (const k of Object.keys(w)) if (!mappedWpn.has(k)) { covOk = false; console.error("unmapped weapon field " + id + "." + k); }
  const m = u.melee;
  if (m) for (const k of Object.keys(m)) {
    if (k === "crit" || k === "critMul") continue; // Cerber blades stand-in tuning (see stats.js TRIBUTE_LOCAL)
    if (!mappedWpn.has(k)) { covOk = false; console.error("unmapped melee field " + id + "." + k); }
  }
}
ok(covOk, "every unit/weapon field is EStat-mapped or documented tribute-local");
for (const [id, u] of Object.entries(D.units)) {
  ok(u.armor && u.armor.light != null && u.armor.medium != null && u.armor.heavy != null,
     id + ": armor triad (EStat 7/8/9)");
  if (u.weapon) ok(u.weapon.damage && u.weapon.damage.light != null && u.weapon.damage.medium != null && u.weapon.damage.heavy != null,
     id + ": damage triad (EStat 61/62/63)");
  for (const f of ["health", "price", "cp", "trainTime", "speed", "view", "regen"])
    ok(typeof u[f] === "number", id + "." + f + " present (EStat-mapped)");
}

// ---- 4. native unit ids vs extracted UnitType/HeroTypes ----
const UJ = JSON.parse(fs.readFileSync(path.join(REPO, "reverse/evidence/data-model/unit-type-ids.json"), "utf8"));
const N = D.nativeUnits;
function chk(claim, id, label) { ok(claim, label); }
chk(N.ilight.conf === UJ.unit_ids.UNIT_ID_ILIGHT_CONF && N.ilight.res === UJ.unit_ids.UNIT_ID_ILIGHT_RES, "ilight 0/100");
chk(N.iheavy.conf === UJ.unit_ids.UNIT_ID_IHEAVY_CONF && N.iheavy.res === UJ.unit_ids.UNIT_ID_IHEAVY_RES, "iheavy 1/101");
chk(N.sniper.res === UJ.unit_ids.UNIT_ID_SNIPER, "sniper 102");
chk(N.hammer.conf === UJ.unit_ids.UNIT_ID_HAMMER, "hammer 11");
chk(N.jaguar.res === UJ.unit_ids.UNIT_ID_JAGUAR, "jaguar 115");
chk(N.coyote.res === UJ.unit_ids.UNIT_ID_COYOTE, "coyote 110");
chk(N.torrent.conf === UJ.unit_ids.UNIT_ID_TORRENT, "torrent 16");
chk(N.porcupine.res === UJ.unit_ids.UNIT_ID_PORCUPINE, "porcupine 112");
chk(N.typhoon.conf === UJ.unit_ids.UNIT_ID_TYPHOON, "typhoon 12");
chk(N.armadillo.res === UJ.unit_ids.UNIT_ID_ARMADILLO, "armadillo 111");
chk(N.zeus.conf === UJ.unit_ids.UNIT_ID_ZEUS, "zeus 15");
chk(N.mammoth.res === UJ.unit_ids.UNIT_ID_MAMMOTH, "mammoth 116");
chk(N.fortress.conf === UJ.unit_ids.UNIT_ID_FORTRESS && N.fortress.unitType === 24, "fortress 10/24");
chk(N.shield.conf === UJ.unit_ids.UNIT_ID_SHIELD, "shield 17");
chk(N.chameleon.res === UJ.unit_ids.UNIT_ID_FOG, "chameleon(FOG) 117");
chk(N.seraphim.unitId === UJ.unit_ids.UNIT_ID_SERAPHIM && N.seraphim.heroType === UJ.hero_types.Seraphim, "seraphim 71 + HeroTypes.Seraphim=3");
chk(N.cerber.heroType === UJ.hero_types.Cerber, "cerber HeroTypes.Cerber=1");

// ---- 5. referential integrity (index.js throws too; assert for the report) ----
for (const [id, u] of Object.entries(D.units)) {
  if (u.weapon) ok(D.weapons && u.weapon === D.weapons[Object.keys(D.weapons).find(k => D.weapons[k] === u.weapon)], id + ": weapon resolved from weapons.js");
}
for (const uid of FIX.BUILD_ORDER_F1.concat(FIX.BUILD_ORDER_F2, FIX.HERO_ORDER))
  ok(D.units[uid] && D.producers[uid] && D.buildings[D.producers[uid]], uid + ": producer resolves");
for (const bid of FIX.BUILDINGS_ORDER) ok(D.buildings[bid], "building " + bid + " exists");
for (const [uid, pid] of Object.entries(D.producers)) ok(D.units[uid], "producer row " + uid + " -> " + pid + " valid");

console.log("\n" + (fail ? "FAILED" : "PASSED") + ": " + pass + " assertions passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
