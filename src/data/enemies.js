// Enemy definitions. Per-level difficulty multipliers live in levels.js.
// fx: particle colour used when the enemy dies.
const ENEMIES = {
  slime: {
    name: 'Slime',
    hp: 2,
    damage: 1,          // contact damage
    speed: 30,          // patrol speed
    score: 10,
    coins: [1, 2],      // min/max coins dropped
    potionChance: 0.15,
    fx: 'goo',
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
    fx: 'purple',
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
    fx: 'bone',
  },
  gemCrab: {
    name: 'Gem Crab',
    hp: 3,
    damage: 1,
    speed: 32,          // patrol speed
    chaseSpeed: 72,     // scuttles at you when you get close
    chaseRange: 130,
    score: 20,
    coins: [1, 2],
    gems: [0, 1],       // min/max gems dropped (worth 5 gold each)
    potionChance: 0.1,
    fx: 'crystal',
  },
  golemite: {
    name: 'Golemite',
    hp: 4,
    damage: 1,
    hopEvery: 1700,     // ms between hops
    hopSpeed: 85,
    hopVelocity: -230,
    knockResist: 0.4,   // takes only 40% of knockback
    score: 20,
    coins: [2, 3],
    potionChance: 0.15,
    fx: 'rock',
  },
  ninja: {
    name: 'Ninja',
    hp: 2,
    damage: 1,
    speed: 80,
    range: 170,         // throws shuriken inside this distance
    throwRate: 1500,
    starSpeed: 190,
    score: 30,
    coins: [2, 3],
    potionChance: 0.2,
    fx: 'smoke',
  },

  // Bosses (see Boss.js). damage is contact damage; their shots do 1.
  golem: {
    name: 'GRASSY GOLEM',
    hp: 30,
    damage: 2,
    score: 500,
    coins: [12, 12],
    gems: [3, 3],
    potionChance: 0,
    fx: 'rock',
    glow: 0x4fc24a,
  },
  crystalCrab: {
    name: 'CRYSTAL CRAB',
    hp: 40,
    damage: 2,
    score: 700,
    coins: [12, 12],
    gems: [5, 5],
    potionChance: 0,
    fx: 'crystal',
    glow: 0x4dd2ff,
  },
  stranger: {
    name: 'THE MYSTERIOUS STRANGER',
    hp: 45,
    damage: 2,
    score: 900,
    coins: [14, 14],
    gems: [5, 5],
    potionChance: 0,
    fx: 'shadow',
    glow: 0xb44cff,
  },
  dragon: {
    name: 'THE DARK DRAGON',
    hp: 90,
    damage: 2,
    score: 2000,
    coins: [20, 20],
    gems: [8, 8],
    potionChance: 0,
    fx: 'ember',
    glow: 0xff6a00,
  },
};

// Map characters used in levels.js to enemy keys. Bosses use 'K' and the
// level's `boss` field instead.
const ENEMY_CHARS = { s: 'slime', b: 'bat', a: 'skeleton', g: 'gemCrab', m: 'golemite', n: 'ninja' };
