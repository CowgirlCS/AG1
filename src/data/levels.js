// Level layouts.
//
// Each level is described by ground segments, floating platforms and entity
// positions, and buildLevelMap() turns that into an array of strings (one per
// tile row). The game reads the strings.
//
// Map legend:
//   .  empty            #  ground            =  floating platform / stepping stone
//   P  player start     C  treasure chest    K  boss (type set by `boss`)
//   s  slime            b  bat               a  skeleton archer
//   g  gem crab         m  golemite          n  ninja
//   o  gold coin        G  gem               h  health potion     H  heart container
//   r  the level's rune (set by `rune`)      Q  portal to the bonus level
//   1-8 weapon pickup (1 dagger, 2 sword, 3 hammer, 4 bow, 5 fire wand,
//                      6 battle axe, 7 throwing axe, 8 bombs)
//
// Not part of the map strings (drawn on top of it):
//   secrets   [x0, y0, x1, y1]        fake walls: look solid, but you can walk
//                                     straight into them. They hide treasure.
//   runeWalls [x0, y0, x1, y1, rune]  vault walls. Solid (but harmless: they
//                                     bounce you back) until you own the rune,
//                                     then they work like a secret.
//
// Coordinates are in tiles: column x (0 = far left), row y (0 = top).
// The screen is 30 x 17 tiles. Row 14 is the normal ground surface.
// A level with a boss ends in a flat arena exactly one screen wide.
//
// Platform rule: touching a solid tile from the side or from below kills the
// player (clipping just a corner bounces you off instead), so layouts never
// require walking into a wall. Height changes only happen across pits (you
// land on top), and floating stones sit over pits so you can't bump your head.

const TILE = 16;
const LEVEL_ROWS = 17;
const ARENA_WIDTH = 30;

const LEVEL_DEFS = [
  {
    name: 'Green Meadow',
    theme: 0,
    width: 132,
    difficulty: { enemySpeed: 0.85, fireRate: 1.3, swoop: 0.8, hpBonus: 0 },
    rune: 'earth',
    boss: 'golem',
    // [firstColumn, lastColumn, surfaceRow]
    ground: [
      [0, 21, 14],
      [24, 40, 14],
      [44, 58, 14],
      [67, 131, 14],
    ],
    // [column, row, length]
    platforms: [
      [62, 14, 3],
    ],
    secrets: [
      [76, 11, 80, 13],     // mound hiding the Earth Rune
    ],
    runeWalls: [],
    // [char, column, row]
    entities: [
      ['P', 2, 13],
      ['o', 6, 13], ['o', 8, 13], ['o', 10, 13],
      ['2', 18, 13],
      ['s', 14, 13],
      ['o', 22, 12], ['o', 23, 12],
      ['o', 30, 13], ['o', 31, 13],
      ['s', 34, 13],
      ['o', 41, 11], ['o', 42, 11], ['o', 43, 11],
      ['s', 50, 13],
      ['o', 52, 13], ['o', 54, 13],
      ['h', 56, 13],
      ['o', 60, 11], ['o', 62, 12], ['o', 63, 12], ['o', 65, 11],
      ['H', 70, 13],
      ['o', 77, 13], ['r', 78, 13], ['o', 79, 13], ['G', 78, 12],
      ['s', 84, 13],
      ['m', 88, 13],
      ['b', 90, 9],
      ['6', 94, 13],
      ['o', 97, 13], ['o', 98, 13], ['o', 99, 13],
      // boss arena: columns 102-131
      ['K', 124, 13],
      ['C', 128, 13],
    ],
  },
  {
    name: 'Crystal Cave',
    theme: 1,
    width: 144,
    difficulty: { enemySpeed: 1, fireRate: 1, swoop: 1, hpBonus: 0 },
    rune: 'crystal',
    boss: 'crystalCrab',
    ground: [
      [0, 18, 14],
      [22, 36, 13],
      [40, 52, 14],
      [60, 74, 12],
      [78, 92, 14],
      [99, 143, 14],
    ],
    platforms: [
      [55, 13, 3],
      [95, 13, 3],
    ],
    secrets: [
      [44, 11, 46, 13],     // hides the Crystal Rune
    ],
    runeWalls: [
      [84, 12, 85, 13, 'earth'],
    ],
    entities: [
      ['P', 2, 13],
      ['4', 7, 13],
      ['Q', 12, 10],        // bonus portal, floating: jump into it
      ['s', 15, 13],
      ['o', 20, 11], ['o', 21, 11],
      ['b', 26, 8],
      ['g', 29, 12],
      ['a', 34, 12],
      ['o', 38, 11],
      ['h', 44, 13], ['r', 45, 13], ['o', 46, 13],
      ['b', 48, 8],
      ['s', 50, 13],
      ['o', 55, 11], ['o', 56, 11],
      ['H', 61, 11],
      ['o', 63, 11], ['o', 64, 11], ['o', 65, 11],
      ['b', 66, 7],
      ['g', 68, 11],
      ['a', 71, 11],
      ['o', 76, 10],
      ['o', 80, 13], ['o', 81, 13],
      ['h', 82, 13],
      ['G', 84, 13], ['G', 85, 13], ['G', 84, 12], ['G', 85, 12],
      ['b', 88, 8],
      ['s', 89, 13],
      ['a', 91, 13],
      ['o', 95, 11], ['o', 96, 11],
      ['g', 102, 13],
      ['a', 105, 13],
      ['b', 106, 8],
      ['o', 109, 13], ['o', 110, 13],
      // boss arena: columns 114-143
      ['K', 134, 13],
      ['C', 140, 13],
    ],
  },
  {
    name: 'Shadow Castle',
    theme: 2,
    width: 156,
    difficulty: { enemySpeed: 1.25, fireRate: 0.75, swoop: 1.2, hpBonus: 1 },
    rune: 'shadow',
    boss: 'stranger',
    ground: [
      [0, 16, 14],
      [20, 32, 13],
      [37, 50, 13],
      [57, 70, 11],
      [75, 86, 14],
      [94, 104, 12],
      [108, 155, 14],
    ],
    platforms: [
      [53, 12, 3],
      [90, 13, 3],
    ],
    secrets: [
      [81, 11, 83, 13],     // hides the Shadow Rune
    ],
    runeWalls: [
      [116, 12, 117, 13, 'crystal'],
    ],
    entities: [
      ['P', 2, 13],
      ['3', 9, 13],
      ['s', 12, 13],
      ['o', 18, 11], ['o', 19, 11],
      ['b', 18, 8],
      ['s', 26, 12],
      ['a', 31, 12],
      ['o', 34, 10], ['o', 35, 10],
      ['b', 35, 7],
      ['h', 40, 12],
      ['n', 44, 12],
      ['a', 48, 12],
      ['o', 53, 10], ['o', 54, 10],
      ['b', 54, 6],
      ['5', 60, 10],
      ['o', 63, 10], ['o', 64, 10],
      ['H', 66, 10],
      ['a', 68, 10],
      ['o', 72, 9], ['o', 73, 9],
      ['b', 72, 6],
      ['h', 76, 13],
      ['o', 77, 13], ['o', 78, 13],
      ['n', 79, 13],
      ['o', 81, 13], ['r', 82, 13], ['G', 83, 13],
      ['a', 85, 13],
      ['b', 88, 8],
      ['o', 90, 11], ['o', 91, 11],
      ['h', 95, 11],
      ['o', 96, 11], ['o', 97, 11],
      ['s', 99, 11],
      ['8', 101, 11],
      ['a', 102, 11],
      ['b', 106, 8],
      ['o', 110, 13], ['o', 111, 13],
      ['n', 113, 13],
      ['H', 116, 13], ['G', 117, 13], ['G', 116, 12], ['G', 117, 12],
      ['b', 119, 8],
      ['a', 121, 13],
      // boss arena: columns 126-155
      ['K', 146, 13],
      ['C', 152, 13],
    ],
  },
  {
    name: "Dragon's Peak",
    theme: 3,
    width: 140,
    difficulty: { enemySpeed: 1.35, fireRate: 0.7, swoop: 1.3, hpBonus: 1 },
    boss: 'dragon',
    ground: [
      [0, 14, 14],
      [18, 30, 13],
      [34, 44, 12],
      [49, 60, 14],
      [64, 76, 13],
      [81, 92, 11],
      [96, 106, 14],
      [110, 139, 14],
    ],
    platforms: [],
    secrets: [
      [89, 8, 91, 10],
    ],
    runeWalls: [
      [69, 11, 70, 12, 'shadow'],
    ],
    entities: [
      ['P', 2, 13],
      ['7', 7, 13],
      ['n', 11, 13],
      ['o', 16, 11], ['o', 17, 11],
      ['m', 23, 12],
      ['b', 25, 8],
      ['a', 29, 12],
      ['o', 32, 10],
      ['g', 38, 11],
      ['o', 40, 11], ['o', 41, 11],
      ['n', 43, 11],
      ['h', 51, 13],
      ['m', 55, 13],
      ['b', 57, 8],
      ['a', 59, 13],
      ['o', 62, 11],
      ['g', 66, 12],
      ['H', 69, 12], ['G', 70, 12], ['G', 69, 11], ['G', 70, 11],
      ['n', 74, 12],
      ['o', 78, 9], ['o', 79, 9],
      ['n', 82, 10],
      ['o', 83, 10], ['o', 84, 10],
      ['a', 86, 10],
      ['b', 87, 6],
      ['h', 89, 10], ['G', 90, 10], ['G', 91, 10],
      ['o', 98, 13], ['o', 99, 13],
      ['m', 100, 13],
      ['b', 102, 8],
      ['n', 104, 13],
      // boss arena: columns 110-139
      ['K', 128, 7],
      ['C', 136, 13],
    ],
  },
];

// The bonus level is reached through the portal in Crystal Cave (needs the
// Earth Rune). No enemies, no pits: grab as much treasure as you can before
// the timer runs out. Afterwards you go back to the start of Crystal Cave.
const BONUS_DEF = (() => {
  const entities = [['P', 2, 13], ['C', 86, 13]];
  const arc = [12, 10, 9, 10, 12];
  for (let i = 0; i < 8; i++) {
    const cx = 8 + i * 9;
    arc.forEach((row, k) => entities.push(['o', cx + k, row]));
    entities.push(['G', cx + 2, 6]);
    entities.push(['o', cx + 6, 13], ['o', cx + 7, 13]);
  }
  return {
    name: 'Sky Vault',
    theme: 4,
    width: 90,
    timeLimit: 45,
    difficulty: { enemySpeed: 1, fireRate: 1, swoop: 1, hpBonus: 0 },
    ground: [[0, 89, 14]],
    platforms: [],
    secrets: [],
    runeWalls: [],
    entities,
  };
})();

// Turn a level definition into an array of strings, one per tile row.
function buildLevelMap(def) {
  const rows = [];
  for (let y = 0; y < LEVEL_ROWS; y++) rows.push(new Array(def.width).fill('.'));

  def.ground.forEach(([x0, x1, top]) => {
    for (let x = x0; x <= x1; x++) {
      for (let y = top; y < LEVEL_ROWS; y++) rows[y][x] = '#';
    }
  });
  def.platforms.forEach(([x, y, len]) => {
    for (let i = 0; i < len; i++) rows[y][x + i] = '=';
  });
  def.entities.forEach(([ch, x, y]) => {
    if (rows[y][x] !== '.') console.warn(`${def.name}: entity ${ch} at ${x},${y} overlaps a tile`);
    rows[y][x] = ch;
  });
  return rows.map(r => r.join(''));
}

const LEVELS = LEVEL_DEFS.map(def => Object.assign({}, def, { map: buildLevelMap(def) }));
const BONUS_LEVEL = Object.assign({}, BONUS_DEF, { map: buildLevelMap(BONUS_DEF) });
