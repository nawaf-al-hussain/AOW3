/*! AOW3 tribute data model - weapons.js (Phase 2). Generated 2026-10-07; edit values via the
 * documented pipeline, keep runtime shape identical to the fixture. Evidence: dump.cs (6.9.18, sha256 0050e67d...) via reverse/evidence/data-model/*.json;
reverse/notes/data-model-extraction.md (field<->EStat map, server-side-value policy);
reverse/notes/units/estat-stat-models.md (45 IStatModel classes, natively pinned).
Balance VALUES are gameplay-tuned approximations (native values are backend-delivered).
 */
(function (g) {
  "use strict";
  // Named weapon configs (single source of truth). Values are byte-identical to the
  // pre-refactor game.js tables (fixture-verified). Units/buildings reference by id.
  var weapons = {

    // ilight: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_ilight: {"damage": {"light": 16, "medium": 7, "heavy": 3}, "range": 6.5, "cooldown": 1.1, "accStatic": 72, "accWalk": 48, "splash": 0, "projectileSpeed": 0, "walkingShot": 1},
    // iheavy: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_iheavy: {"damage": {"light": 10, "medium": 34, "heavy": 42}, "range": 7.5, "cooldown": 2.4, "accStatic": 78, "accWalk": 55, "splash": 1.1, "projectileSpeed": 14, "walkingShot": 1},
    // sniper: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_sniper: {"damage": {"light": 34, "medium": 14, "heavy": 4}, "range": 11, "cooldown": 2.2, "accStatic": 84, "accWalk": 62, "splash": 0, "projectileSpeed": 0},
    // hammer: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_hammer: {"damage": {"light": 42, "medium": 30, "heavy": 20}, "range": 9, "cooldown": 1.8, "accStatic": 82, "accWalk": 62, "splash": 0.6, "projectileSpeed": 26},
    // jaguar: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_jaguar: {"damage": {"light": 44, "medium": 32, "heavy": 22}, "range": 9, "cooldown": 1.8, "accStatic": 82, "accWalk": 62, "splash": 0.6, "projectileSpeed": 26},
    // coyote: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_coyote: {"damage": {"light": 20, "medium": 14, "heavy": 6}, "range": 8, "cooldown": 1.2, "accStatic": 76, "accWalk": 60, "splash": 0, "projectileSpeed": 30},
    // torrent: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_torrent: {"damage": {"light": 14, "medium": 46, "heavy": 4}, "range": 10.5, "cooldown": 0.55, "accStatic": 84, "accWalk": 70, "splash": 0, "projectileSpeed": 34},
    // porcupine: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_porcupine: {"damage": {"light": 15, "medium": 48, "heavy": 4}, "range": 10.5, "cooldown": 0.55, "accStatic": 84, "accWalk": 70, "splash": 0, "projectileSpeed": 34},
    // typhoon: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38, explosionDecr->m_explosionDecr/0x34
    w_typhoon: {"damage": {"light": 40, "medium": 38, "heavy": 46}, "range": 15, "cooldown": 4.2, "accStatic": 62, "accWalk": 44, "splash": 2.6, "projectileSpeed": 12, "splashScatter": 1, "explosionDecr": 30},
    // armadillo: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_armadillo: {"damage": {"light": 12, "medium": 40, "heavy": 30}, "range": 10, "cooldown": 2.6, "accStatic": 74, "accWalk": 54, "splash": 0.8, "projectileSpeed": 22},
    // zeus: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_zeus: {"damage": {"light": 30, "medium": 34, "heavy": 26}, "range": 8.5, "cooldown": 1.5, "accStatic": 80, "accWalk": 64, "splash": 0.4, "projectileSpeed": 30},
    // mammoth: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_mammoth: {"damage": {"light": 64, "medium": 52, "heavy": 40}, "range": 9.5, "cooldown": 2.6, "accStatic": 84, "accWalk": 60, "splash": 0.8, "projectileSpeed": 24},
    // fortress: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38, explosionDecr->m_explosionDecr/0x34
    w_fortress: {"damage": {"light": 50, "medium": 55, "heavy": 60}, "range": 14, "cooldown": 3.4, "accStatic": 70, "accWalk": 50, "splash": 1.6, "projectileSpeed": 16, "splashScatter": 1, "explosionDecr": 20},
    // helicopter: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_helicopter: {"damage": {"light": 34, "medium": 26, "heavy": 16}, "range": 8.5, "cooldown": 1.2, "accStatic": 76, "accWalk": 68, "splash": 0.4, "projectileSpeed": 30, "guided": 1},
    // cerber: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_cerber: {"damage": {"light": 22, "medium": 26, "heavy": 18}, "range": 7.5, "cooldown": 1.5, "accStatic": 78, "accWalk": 55, "splash": 0, "projectileSpeed": 28},
    // seraphim: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_seraphim: {"damage": {"light": 34, "medium": 26, "heavy": 16}, "range": 9, "cooldown": 1.05, "accStatic": 80, "accWalk": 72, "splash": 0.3, "projectileSpeed": 32, "guided": 1},
    // building turret: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_bld_turret: {"damage": {"light": 34, "medium": 30, "heavy": 20}, "range": 10.5, "cooldown": 1.35, "accStatic": 88, "accWalk": 66, "splash": 0, "projectileSpeed": 30},
    // building bunker: range->m_distance/0x28, accStatic->m_accuracyStatic/0x4E, accWalk->m_accuracyWalk/0x52, splash->m_explosionRadius/0x30, projectileSpeed->m_velocity/0x38
    w_bld_bunker: {"damage": {"light": 26, "medium": 8, "heavy": 2}, "range": 7.5, "cooldown": 0.7, "accStatic": 80, "accWalk": 60, "splash": 0, "projectileSpeed": 0},
    // cerber melee mode: tribute stand-in for the Cerber blade weapon (HeroTypes.Cerber=1);
    // area splash + crit are gameplay-tuned (EStat CerberusWeaponSwitchTime/40 = switch gate)
    m_cerber_blades: {"damage": {"light": 46, "medium": 58, "heavy": 42}, "range": 2.1, "cooldown": 1.05, "splash": 1.5, "crit": 0.22, "critMul": 2}
  };
  g.AOW3_DATA = g.AOW3_DATA || {};
  g.AOW3_DATA.weapons = weapons;
})(typeof window !== "undefined" ? window : globalThis);
