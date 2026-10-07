/*! AOW3 tribute data model - stats.js (Phase 2). Generated 2026-10-07; edit values via the
 * documented pipeline, keep runtime shape identical to the fixture. Evidence: dump.cs (6.9.18, sha256 0050e67d...) via reverse/evidence/data-model/*.json;
reverse/notes/data-model-extraction.md (field<->EStat map, server-side-value policy);
reverse/notes/units/estat-stat-models.md (45 IStatModel classes, natively pinned).
Balance VALUES are gameplay-tuned approximations (native values are backend-delivered).
 */
(function (g) {
  "use strict";
  // EStat enum verbatim (dump.cs:168776-168860; 78 values, None=0..77)
  var ESTAT = {
  // core unit/building (Base)
  None: 0,
  Health: 1,
  Price: 2,
  PriceUranum: 3,
  CommandPoints: 4,
  TrainTime: 5,
  Speed: 6,
  ArmorLight: 7,
  ArmorMedium: 8,
  ArmorHeavy: 9,
  View: 10,
  ConstructionRadius: 11,
  ConstructionTime: 12,
  BuildingSize: 17,
  HealthRegeneration: 18,
  // production/economy (Produce)
  CommandPointsProduce: 13,
  SupplyIncome: 14,
  EnergyProduction: 15,
  EnergyNeed: 16,
  InitialResourceReserve: 47,
  // energy / shield / fog / detection / fuel / demining / modes (Special)
  EnergyReserve: 24,
  EnergyConsumption: 25,
  EnergyRegeneration: 28,
  ShieldStrength: 26,
  ShieldRadius: 27,
  ShieldActivationTime: 29,
  ShieldDeactivationTime: 30,
  FogRadius: 31,
  FogActivationTime: 32,
  FogDeactivationTime: 33,
  MineDetection: 34,
  ForestUnitDetection: 35,
  SubmarineDetection: 36,
  FuelReserve: 37,
  FuelConsumption: 38,
  RefuelingSpeed: 39,
  MineDeactivationTime: 22,
  DeminingSpeed: 23,
  JumpRange: 19,
  TransitionToMarchModeTime: 20,
  TransitionToSiegeModeTime: 21,
  DeploymentTime: 46,
  SeraphimGroundModeTransitionTime: 41,
  SeraphimAirModeTransitionTime: 42,
  CerberusWeaponSwitchTime: 40,
  WorkshopRepairRadius: 43,
  WorkshopRepairSpeed: 44,
  WorkshopModeTransitionTime: 45,
  // weapon stats (per-weapon)
  WeaponDistance: 58,
  WeaponAccuracy: 59,
  WeaponFireRate: 60,
  WeaponArmorLight: 61,
  WeaponArmorMedium: 62,
  WeaponArmorHeavy: 63,
  WeaponExplosionRadius: 64,
  WeaponBombCount: 65,
  WeaponMineCost: 66,
  WeaponMineTime: 67,
  // super-weapon / mine price / hero-unique
  WeaponSuperWeaponCost: 68,
  WeaponSuperWeaponTime: 69,
  WeaponSuperWeaponCP: 70,
  WeaponSuperWeaponArmorLight: 72,
  WeaponSuperWeaponArmorMedium: 73,
  WeaponSuperWeaponArmorHeavy: 74,
  WeaponSuperWeaponCommandPoints: 75,
  WeaponSuperWeaponDistance: 76,
  WeaponSuperWeaponExplosionRadius: 77,
  MinePrice: 71,
  PsiAttackSpeedReduction: 52,
  PsiSlowdownDuration: 53,
  WolverineMachineGunMaxAccelerationTime: 54,
  CoilTankMaxTargets: 55,
  CoilTankFrontalArmor: 56,
  AtlasImmortalityTime: 57,
  SpaceStrikePreparationTime: 48,
  LaunchPreparationTime: 49,
  MissileFlightTime: 50,
  MaxViewReachTime: 51,
  };

  var ESTAT_CATEGORY = { None: 0, Base: 1, Produce: 2, Cost: 3, Special: 4 };

  // tribute field -> native EStat (reverse/notes/data-model-extraction.md SS3)
  var FIELD_ESTAT = {
    units: { health: "Health", price: "Price", cp: "CommandPoints", trainTime: "TrainTime",
             speed: "Speed", view: "View", regen: "HealthRegeneration",
             "armor.light": "ArmorLight", "armor.medium": "ArmorMedium", "armor.heavy": "ArmorHeavy" },
    weapons: { "damage.light": "WeaponArmorLight", "damage.medium": "WeaponArmorMedium",
               "damage.heavy": "WeaponArmorHeavy", range: "WeaponDistance",
               accStatic: "WeaponAccuracy", cooldown: "WeaponFireRate(1/x)", splash: "WeaponExplosionRadius" },
    buildings: { health: "Health", price: "Price", buildTime: "ConstructionTime", view: "View" },
    economy: { baseIncome: "SupplyIncome", depotIncome: "SupplyDepotIncomeStat(class; no EStat id)",
               baseCP: "CommandPointsProduce", depotCP: "CommandPointsProduce",
               powerIncome: "EnergyProduction(conversion)", powerCP: "EnergyProduction(conversion)" }
  };
  // tribute weapon key -> WeaponTypeMapEditorConfig field (dump.cs:256556, offsets 0x10..0x60)
  var WEAPON_FIELD_MAP = {
    "damage.light": "m_damageLight/0x18", "damage.medium": "m_damageMedium/0x1C",
    "damage.heavy": "m_damageHeavy/0x20", range: "m_distance/0x28",
    accStatic: "m_accuracyStatic/0x4E", accWalk: "m_accuracyWalk/0x52",
    splash: "m_explosionRadius/0x30", explosionDecr: "m_explosionDecr/0x34",
    projectileSpeed: "m_velocity/0x38", hitBonus: "m_hitBonus/0x24",
    accDynamic: "m_accuracyDynamic/0x50 (recovered, unused in tribute)",
    walkingShot: "native walking_shot flag (accuracy note)",
    guided: "native guided weapons (guided -> accStatic/100)",
    splashScatter: "tribute key for native weaponType-27 scatter branch (approximation)",
    cooldown: "EStat WeaponFireRate/60 (1/rate)"
  };
  // tribute-local fields with no native EStat key (documented approximations/stand-ins)
  var TRIBUTE_LOCAL = {
    units: ["kind(=UNIT_CATEGORY_*)", "captures", "radius(collision)", "antiAir", "aircraft",
            "hero(HeroTypes)", "faction(CONF/RES id ranges)", "aura(Shield stand-in, browser-only)",
            "melee(Cerber blades stand-in)", "card/tint/desc(presentation)"],
    economy: ["captureTimeNeutral/Enemy (no native EStat; gameplay-tuned)"]
  };
  g.AOW3_DATA = g.AOW3_DATA || {};
  g.AOW3_DATA.estat = ESTAT;
  g.AOW3_DATA.estatCategory = ESTAT_CATEGORY;
  g.AOW3_DATA.fieldEstat = FIELD_ESTAT;
  g.AOW3_DATA.weaponFieldMap = WEAPON_FIELD_MAP;
  g.AOW3_DATA.tributeLocal = TRIBUTE_LOCAL;
})(typeof window !== "undefined" ? window : globalThis);
