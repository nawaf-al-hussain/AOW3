# M3 — weapon→sound mapping, native decode (pass 1: mechanism CONFIRMED)

Game: AOW3 6.9.18 (`libil2cpp.so` sha256 `8ace05bb…` pin-matched, `dump.cs`
`0050e67d…`, script.json 366,304 methods — Task-63 chain). Session: Task 65,
M3 + R14 pass 2 + R13 residual in one batch. Audit row M3 ("Weapon→sound
mapping heuristic | APPROXIMATE | Sfx pools") — this pass decodes the native
dispatch chain, the id registers, and the serialized per-prefab pairs from the
APK asset bundles; the per-weapon-id table for standard units remains partially
bundle-bound (§5 residual), but the MECHANISM is no longer heuristic.

## 1. The dispatch chain [DECOMP]

1. The server emits the logic command **`LCUnitShoot{m_unitId @0x1C,
   m_weaponIndex @0x20}`** (dump.cs 295222; Initiate(Unit, Weapon) @0x81631C8)
   — the weapon index is SERVER-AUTHORITATIVE, same lockstep channel as the
   other LC commands.
2. The client handler dispatches to every `IUnitShootable` component on the
   unit prefab: **`ToShoot(int weaponIndex)`** (interface, dump.cs 276000).
3. `UnitShootSoundEffector.ToShoot` @0x80D127C (verbatim decode):
   - `if (m_weaponIndex @0x30 != weaponIndex) return;` — each effector serves
     EXACTLY ONE weapon slot (serialized gate);
   - `PlayLimitedSoundById<Int32Enum>(m_soundGroup @0x28, …)` @0x4DB63F4
     (AudioBattleSoundsHandler, dump.cs 1560) — the SOUND is the component's
     serialized **SoundGroups enum value**;
   - result stored into `m_shootSound @0x38` (stop/fade handled by
     `m_fadeOutTime @0x2C`).
4. Special weapon classes override the same interface:
   `GatlingAudioEffectController` (dump.cs 278805: `m_gunSpinStart @0x48`,
   `m_gunSpinEnd @0x4C`, `m_activeFlarePrepare @0x50`, `m_passiveShot @0x54`
   — spin-up/down, flare and passive-shot lanes), plus the hero-ability player
   (`AbstractHeroAbilityEffectsPlayer` 278204) and bullet-side
   `BulletSoundEffector` (259379, `m_moveSound @0x30` — projectile fly loop).

So the native mapping is **serialized per prefab**: (weaponIndex, soundGroup)
pairs on `UnitShootSoundEffector` components + per-class effectors, resolved
through the `SoundGroups` enum register — not a heuristic.

## 2. SoundGroups enum register [NATIVE constants]

`public enum SoundGroups` (dump.cs 83052) — **153 values**, the full id space
of `PlayLimitedSoundById`. Head/tail (full list in dump.cs / evidence):
`ItemFireRifle1=1, ItemFireRifle2=2, ItemFireSlug1=3, ItemFireFlame1=4,
ItemFireMachine1..5=5..9, ItemFireMissile1..5=10..14, ItemFireGun1..5=15..19`
… hero/ability tail `ItemCerberJumpFire=101 … ItemCoiltankAutoAttack=243,
ItemCoiltankActiveCharge=244, ItemCoiltankActiveFire=245,
ItemCoiltankActiveImpact=246, ItemCoiltankActiveDamage=247,
ItemCoiltankIdleCoil=248, ItemCoiltankIdleElectrodes=249 … ItemModTest=999`.
The numbered families (Machine1-5, Missile1-5, Gun1-5) are per-weapon VARIANTS
of a family — matches the multi-gun prefabs (muzzle1_0..5 assets, §3).

## 3. Bundle extraction (the serialized half) [EXTRACTED]

Addressables corpus: 5,526 files (assets/bin/Data + 24 assets/aa bundles),
UnityPy 1.25.4, Unity 2022.3.20f1. Key findings:

- **MonoScript resolution**: the content bundles' MonoBehaviour `m_Script`
  PPtrs are `fileID=1 → externals[0] = globalgamemanagers.assets` (3 split
  files, 11,711 MonoScripts). Script pathIDs are plain small ints (e.g.
  `UnitShootSoundEffector = 9443`, `UnitShootFlashEffector = 4082`,
  `UnitMoveSoundEffector = 10518`, `UnitDeathSoundEffector = 1075`,
  `BulletSoundEffector = 938`, `GatlingAudioEffectController = 4185`,
  `AudioGroups = 8882`, `BattleHelicopterSoundEffectManager = 4527`). Full
  map: `reverse/evidence/audio/m3-script-map-globalgamemanagers.json`.
  ⚠ Tooling note: MonoBehaviour raw layout is
  `m_GameObject PPtr@0(12) · m_Enabled@12(1+3pad) · m_Script PPtr@16(12) ·
  m_Name len@28 · data@32 · fields` — an earlier 4-byte-shifted parse
  (script PPtr@12, name@24) silently produced zero hits; the shifted values
  look like plausible pathIDs, so validate against the head hex when reuse.
- **`UnitShootSoundEffector` components**: 5 found —
  `f2_hero_coiltank` (wi=0 → sg=243 ItemCoiltankAutoAttack),
  `f2_hero_coiltank_meta` (243), `f1_inf_zombie`/`f2_inf_zombie` (200),
  `f2_hero_codomash` (126), all `fadeOut=0.1`. (sg 200/243/126 all resolve in
  the enum tail — hero/zombie units.)
- **`AudioGroups` assets** (the id→variation table, class dump.cs 82289 with
  `GetAvailableSoundGroups` / `IsModificationAudioExist`): **50 assets**,
  each `m_soundGroups`-first tail of 40 B = (enum id, flags…):
  `audio_group_fire_1/2/3 = 150/151/152`, `muzzle1_0..5 = 150` (+variant
  flags), `audio_group_spin = 153`, `audio_group_death = 43`,
  `audio_group_move = 236? (0xEC)`, `audio_group_passive_on/off = 234/235`,
  `audio_group_active = 233`, `audio_group_immortal = 238`,
  `fx_idle_weapon_0/1 = 249/248? (0xF9/0xF8)`, `fx_active_activation = 244`,
  `fx_passive_activation = 240`, `bul_rocket3_s5_nuke_2 = 14`,
  `hero_solaris_charge = 118`, `fx_turbo_2 = 110`, … (full table in
  `m3-all-sound-effectors.json`; ids cross-checked against the enum).
- **Effector census**: 111 sound-bearing components — UnitMoveSoundEffector 43,
  UnitDeathSoundEffector 10, UnitShootSoundEffector 5, UnitShootFlashEffector
  2, GatlingAudioEffectController 1, AudioGroups assets 50.
- **AudioClip inventory**: **1,677 clips** (names in
  `m3-bundle-scan.json`) — fire/impact/death/ambient families.

## 4. Browser fold-in (comment-only, v=65 → v=66)

The browser sfx layer keeps its approximate pools (no behavior change without
the full per-weapon table); the provenance comment now cites the decoded
dispatch chain (LCUnitShoot → IUnitShootable.ToShoot gate → SoundGroups id),
the enum register, and the [SERVER-DATA] weaponIndex. Comment-only diff per
§35.1 (`?v=66`), 10/10 suites green baseline-identical.

## 5. Residual (bounded, carryable)

1. **Per-weapon SoundGroups table for standard units**: the 5 direct
   UnitShootSoundEffector instances cover special units; standard units'
   gun prefabs carry their pairs deeper (gun_* child objects / weapon prefab
   sets). The extraction recipe is now proven end-to-end (script-PPtr
   resolution + structural parse) — a follow-up scan keyed on the gun GO
   hierarchy converts this into the full table without new tooling.
2. **AudioGroups variation flags** (the 36 B after the id): consumed by
   `GetAvailableSoundGroups`/`IsModificationAudioExist` (audio MODIFICATIONS —
   skin/level variants); semantics [INFERRED], one disasm away.
3. **AudioObject → playable clip bindings**: the AudioController resolve step
   (clip naming convention) — R11-adjacent, RUNTIME-gated.
