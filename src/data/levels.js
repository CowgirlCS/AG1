// Level layouts.
//
// Each level is described by ground segments, floating platforms and entity
// positions, and buildLevelMap() turns that into an array of strings (one per
// tile row). The game reads the strings.
//
// Map legend:
//   .  empty            #  ground            =  floating platform / stepping stone
//   P  player start     C  treasure chest
//   s  slime            b  bat               a  skeleton archer
//   o  gold coin        h  health potion     H  heart container
//   1-5 weapon pickup (1 dagger, 2 sword, 3 hammer, 4 bow, 5 fire wand)
//
// Coordinates are in tiles: column x (0 = far left), row y (0 = top).
// The screen is 30 x 17 tiles. Row 14 is the normal ground surface.
//
// Platform rule: touching any solid tile from the side or from below kills the
// player, so layouts never require walking into a wall. Height changes only
// happen across pits (you land on top), and floating stones sit over pits so
// you can't bump your head on them.

const TILE = 16;
const LEVEL_ROWS = 17;

const LEVEL_DEFS = [
  {
    name: 'Green Meadow',
    theme: 0,
    width: 100,
    difficulty: { enemySpeed: 0.85, fireRate: 1.3, swoop: 0.8, hpBonus: 0 },
    // [firstColumn, lastColumn, surfaceRow]
    ground: [
      [0, 21, 14],
      [24, 40, 14],
      [44, 58, 14],
      [67, 99, 14],
    ],
    // [column, row, length]
    platforms: [
      [62, 14, 3],
    ],
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
      ['s', 74, 13],
      ['o', 77, 13], ['o', 79, 13], ['o', 81, 13],
      ['s', 86, 13],
      ['b', 90, 9],
      ['C', 96, 13],
    ],
  },
  {
    name: 'Crystal Cave',
    theme: 1,
    width: 112,
    difficulty: { enemySpeed: 1, fireRate: 1, swoop: 1, hpBonus: 0 },
    ground: [
      [0, 18, 14],
      [22, 36, 13],
      [40, 52, 14],
      [60, 74, 12],
      [78, 92, 14],
      [99, 111, 14],
    ],
    platforms: [
      [55, 13, 3],
      [95, 13, 3],
    ],
    entities: [
      ['P', 2, 13],
      ['4', 8, 13],
      ['s', 14, 13],
      ['o', 20, 11], ['o', 21, 11],
      ['b', 26, 8],
      ['s', 29, 12],
      ['a', 34, 12],
      ['o', 38, 11],
      ['h', 44, 13],
      ['s', 47, 13],
      ['b', 48, 8],
      ['o', 55, 11], ['o', 56, 11],
      ['H', 61, 11],
      ['o', 63, 11], ['o', 64, 11], ['o', 65, 11],
      ['b', 66, 7],
      ['a', 71, 11],
      ['o', 76, 10],
      ['o', 80, 13], ['o', 81, 13],
      ['h', 82, 13],
      ['s', 85, 13],
      ['b', 88, 8],
      ['a', 91, 13],
      ['o', 95, 11], ['o', 96, 11],
      ['b', 104, 8],
      ['a', 105, 13],
      ['C', 108, 13],
    ],
  },
  {
    name: 'Shadow Castle',
    theme: 2,
    width: 124,
    difficulty: { enemySpeed: 1.25, fireRate: 0.75, swoop: 1.2, hpBonus: 1 },
    ground: [
      [0, 16, 14],
      [20, 32, 13],
      [37, 50, 13],
      [57, 70, 11],
      [75, 86, 14],
      [94, 104, 12],
      [108, 123, 14],
    ],
    platforms: [
      [53, 12, 3],
      [90, 13, 3],
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
      ['s', 44, 12],
      ['a', 48, 12],
      ['o', 53, 10], ['o', 54, 10],
      ['b', 54, 6],
      ['5', 60, 10],
      ['o', 63, 10], ['o', 64, 10],
      ['H', 66, 10],
      ['a', 68, 10],
      ['o', 72, 9], ['o', 73, 9],
      ['b', 72, 6],
      ['h', 77, 13],
      ['o', 78, 13], ['o', 79, 13],
      ['s', 80, 13],
      ['a', 84, 13],
      ['b', 88, 8],
      ['o', 90, 11], ['o', 91, 11],
      ['h', 95, 11],
      ['o', 96, 11], ['o', 97, 11],
      ['s', 99, 11],
      ['a', 102, 11],
      ['b', 106, 8],
      ['o', 110, 13], ['o', 111, 13],
      ['s', 113, 13],
      ['b', 116, 8],
      ['a', 118, 13],
      ['C', 120, 13],
    ],
  },
];

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
