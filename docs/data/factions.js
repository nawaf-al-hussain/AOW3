/*! AOW3 tribute data model - factions.js (Phase 2). Generated 2026-10-07; edit values via the
 * documented pipeline, keep runtime shape identical to the fixture. Evidence: dump.cs (6.9.18, sha256 0050e67d...) via reverse/evidence/data-model/*.json;
reverse/notes/data-model-extraction.md (field<->EStat map, server-side-value policy);
reverse/notes/units/estat-stat-models.md (45 IStatModel classes, natively pinned).
Balance VALUES are gameplay-tuned approximations (native values are backend-delivered).
 */
(function (g) {
  "use strict";
  // Faction rosters + production + economy knobs. f1 = player (blue, CONF unit ids),
  // f2 = enemy AI (red, RES unit ids) - faction-swap evidence in worklog Task 13.
  var factions = {
    1: { id: 1, name: "Confederation", buildOrder: ["ilight", "iheavy", "hammer", "torrent", "zeus", "typhoon", "fortress", "shield", "helicopter"], heroOrder: ["cerber", "wasp", "seraphim", "gatling", "atlas", "mole"] },
    2: { id: 2, name: "Resistance", buildOrder: ["ilight", "iheavy", "sniper", "coyote", "jaguar", "armadillo", "porcupine", "mammoth", "chameleon", "helicopter"], heroOrder: ["leviaphan", "beholder", "psitank", "solaris", "salamander", "coiltank"] }
  };
  var producers = {"ilight": "barracks", "iheavy": "barracks", "sniper": "barracks", "hammer": "factory", "torrent": "factory", "zeus": "factory", "shield": "factory", "coyote": "factory", "jaguar": "factory", "armadillo": "factory", "porcupine": "factory", "fortress": "heavyfactory", "typhoon": "heavyfactory", "mammoth": "heavyfactory", "chameleon": "heavyfactory", "helicopter": "heavyfactory", "cerber": "herobld", "wasp": "herobld", "seraphim": "herobld", "gatling": "herobld", "atlas": "herobld", "mole": "herobld", "leviaphan": "herobld", "beholder": "herobld", "psitank": "herobld", "solaris": "herobld", "salamander": "herobld", "coiltank": "herobld"};
  var buildingsOrder = ["barracks", "factory", "heavyfactory", "power", "turret", "bunker", "herobld"];
  var economy = {"baseIncome": 14, "depotIncome": 11, "baseCP": 10, "depotCP": 4, "captureTimeNeutral": 5, "captureTimeEnemy": 9, "powerIncome": 2, "powerCP": 2};
  g.AOW3_DATA = g.AOW3_DATA || {};
  g.AOW3_DATA.factions = factions;
  g.AOW3_DATA.producers = producers;
  g.AOW3_DATA.buildingsOrder = buildingsOrder;
  g.AOW3_DATA.economy = economy;
})(typeof window !== "undefined" ? window : globalThis);
