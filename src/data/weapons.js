// Weapon definitions.
// The first time a weapon is picked up, its `upgrade` is applied permanently:
// it stays even after you swap to a different weapon.
//   maxHp  - added to max HP once
//   power  - flat bonus damage for every weapon
//   speed  - bonus run speed (pixels/second)
//   haste  - attack cooldown reduction (0.1 = 10% faster)
const WEAPONS = {
  dagger: {
    name: 'Dagger',
    style: 'melee',
    damage: 1,
    cooldown: 220,      // ms between attacks
    reach: 16,          // hitbox width in front of the player
    height: 14,         // hitbox height
    duration: 90,       // how long the hitbox stays active (ms)
    knockback: 90,
    slashTint: 0xffffff,
    sfx: 'swingFast',
    upgrade: { speed: 12 },
    upgradeText: '+SPEED',
  },
  sword: {
    name: 'Sword',
    style: 'melee',
    damage: 2,
    cooldown: 360,
    reach: 22,
    height: 18,
    duration: 120,
    knockback: 140,
    slashTint: 0xcfe8ff,
    sfx: 'swing',
    upgrade: { maxHp: 1 },
    upgradeText: '+1 MAX HP',
  },
  hammer: {
    name: 'Hammer',
    style: 'melee',
    damage: 4,
    cooldown: 700,
    reach: 22,
    height: 24,
    duration: 150,
    knockback: 340,
    slashTint: 0xffb060,
    sfx: 'swingHeavy',
    shake: true,
    upgrade: { power: 1 },
    upgradeText: '+1 POWER',
  },
  bow: {
    name: 'Bow',
    style: 'ranged',
    damage: 2,
    cooldown: 450,
    projectile: 'arrow',
    speed: 330,
    lifetime: 1100,
    knockback: 70,
    sfx: 'bow',
    upgrade: { maxHp: 1 },
    upgradeText: '+1 MAX HP',
  },
  fireWand: {
    name: 'Fire Wand',
    style: 'ranged',
    damage: 3,
    cooldown: 280,
    projectile: 'fireball',
    speed: 230,
    lifetime: 520,
    knockback: 110,
    sfx: 'fire',
    upgrade: { haste: 0.1 },
    upgradeText: '+10% ATK SPEED',
  },
};

// Map characters used in levels.js to weapon keys.
const WEAPON_CHARS = { '1': 'dagger', '2': 'sword', '3': 'hammer', '4': 'bow', '5': 'fireWand' };
