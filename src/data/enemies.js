// Enemy definitions. Per-level difficulty multipliers live in levels.js.
const ENEMIES = {
  slime: {
    name: 'Slime',
    hp: 2,
    damage: 1,          // contact damage
    speed: 30,          // patrol speed
    score: 10,
    coins: [1, 2],      // min/max coins dropped
    potionChance: 0.15,
  },
  bat: {
    name: 'Bat',
    hp: 1,
    damage: 1,
    speed: 36,          // horizontal drift speed
    patrolRange: 40,    // how far it drifts from its home point
    amplitude: 14,      // sine-wave height
    frequency: 3,       // sine-wave speed
    swoopRange: 120,    // starts a swoop when the player is this close
    swoopSpeed: 150,
    swoopCooldown: 1600,
    score: 15,
    coins: [1, 2],
    potionChance: 0.1,
  },
  skeleton: {
    name: 'Skeleton Archer',
    hp: 3,
    damage: 1,          // per arrow (and on contact)
    range: 200,         // shoots when the player is within this distance
    fireRate: 1900,     // ms between shots
    windup: 350,        // ms of warning before the arrow leaves
    arrowSpeed: 160,
    score: 25,
    coins: [2, 3],
    potionChance: 0.3,
  },
};

// Map characters used in levels.js to enemy keys.
const ENEMY_CHARS = { s: 'slime', b: 'bat', a: 'skeleton' };
