// Extra art for the upgrades: new player poses, mobs, bosses, weapons, gear.
// Small sprites are pixel grids (like SPRITES in BootScene.js). Big bosses and
// the portal are drawn by a function that returns a palette letter for each
// pixel, which keeps their edges as crisp as the grid sprites.

// Colours added to PAL in BootScene.
const EXTRA_PAL = {
  Z: '#7a6e64', z: '#4e443e',   // rock
  M: '#3d9a45', m: '#246a2e',   // moss
  u: '#2a8fb8', i: '#b8f0ff',   // crystal shade / crystal light
  X: '#2e2442', x: '#17121f',   // cloak / dragon scales
  V: '#b44cff', v: '#6a2aa8',   // violet magic
  q: '#6a2a4a',                 // dragon belly
  T: '#ff6a00',                 // lava
};

const EXTRA_SPRITES = {
  player_crouch: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '....HHHH....',
    '...HHHHHH...',
    '..HHSSSSH...',
    '..HSSSKSK...',
    '...SSSSSS...',
    '..BBBBBBBB..',
    '.SBBBBBBBBS.',
    '..BYYYYYYB..',
    '..bbbbbbbb..',
    '.KKLL..LLKK.',
    '............',
  ],
  player_dash: [
    '............',
    '.....HHHH...',
    '....HHHHHH..',
    '...HHSSSSH..',
    '...HSSSKSK..',
    '....SSSSSS..',
    '.....SSSS...',
    '..BBBBBBBBSS',
    '.bBBBBBBBB..',
    '..BBYYYYB...',
    '...bbbbbb...',
    '..LL...LL...',
    '.LL.....LL..',
    'KK.......KK.',
    '............',
    '............',
  ],
  crab1: [
    '.......Ui.......',
    '......UiUu......',
    '.WK...UUuu...KW.',
    '..R..RRRRRR..R..',
    '.RR.RRRRRRRR.RR.',
    '..RRRRRRRRRRRR..',
    '...rRRRRRRRRr...',
    '....rrrrrrrr....',
    '...r.r....r.r...',
    '..r..r....r..r..',
  ],
  crab2: [
    '.......Ui.......',
    '......UiUu......',
    '.WK...UUuu...KW.',
    '..R..RRRRRR..R..',
    '.RR.RRRRRRRR.RR.',
    '..RRRRRRRRRRRR..',
    '...rRRRRRRRRr...',
    '....rrrrrrrr....',
    '....r.r..r.r....',
    '....r..rr..r....',
  ],
  golemite1: [
    '....MMMM....',
    '..MMmMMMMM..',
    '..ZZZZZZZZ..',
    '.ZZOZZZZOZz.',
    '.ZZZZZZZZZz.',
    '.ZZZKKKKZZz.',
    'ZzZZZZZZZZzZ',
    'Zz.ZZZZZZ.zZ',
    'Z..zZZZZz..z',
    '...ZZ..ZZ...',
    '...Zz..Zz...',
    '..zzz..zzz..',
  ],
  golemite2: [
    '............',
    '....MMMM....',
    '..MMmMMMMM..',
    '..ZZZZZZZZ..',
    '.ZZOZZZZOZz.',
    '.ZZZZZZZZZz.',
    'ZZZZKKKKZZzZ',
    'Zz.ZZZZZZ.zZ',
    'Z..zZZZZz..z',
    '...ZZZZZZ...',
    '..zzz..zzz..',
    '............',
  ],
  ninja1: [
    '....XXXX....',
    '...XXXXXX...',
    '..RRRRRRRR..',
    '..XSKSSKSXRR',
    '...XXXXXX..R',
    '....XXXX....',
    '...XXXXXX...',
    '..XXXXXXXX..',
    '..SXXxxXXS..',
    '..SXRRRRXS..',
    '...xxxxxx...',
    '...XX..XX...',
    '...XX..XX...',
    '...XX..XX...',
    '..xxx..xxx..',
    '............',
  ],
  ninja2: [
    '....XXXX....',
    '...XXXXXX...',
    '..RRRRRRRR..',
    '..XSKSSKSXRR',
    '...XXXXXX..R',
    '....XXXX....',
    '...XXXXXX...',
    '..XXXXXXXXS.',
    '.SXXXxxXX...',
    '...XRRRRX...',
    '...xxxxxx...',
    '...XX...XX..',
    '..XX.....XX.',
    '.XX.......X.',
    '.xx.......xx',
    '............',
  ],
  ninja_throw: [
    '....XXXX....',
    '...XXXXXX...',
    '..RRRRRRRR..',
    '..XSKSSKSXRR',
    '...XXXXXX..R',
    '....XXXX....',
    '...XXXXXX...',
    '..XXXXXXXSSE',
    '..SXXxxXX...',
    '...XRRRRX...',
    '...xxxxxx...',
    '...XX..XX...',
    '...XX..XX...',
    '...XX..XX...',
    '..xxx..xxx..',
    '............',
  ],
  stranger1: [
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '...XXXXXXXXXX...',
    '...XXxxxxxxXX...',
    '...XxxVxxVxxX...',
    '...XxxxxxxxxX...',
    '...XXxxxxxxXX...',
    '..XXXXXXXXXXXX..',
    '.XXVXXXYXXXXVXX.',
    '.XXVXXXXXXXXVXX.',
    'XXXVXXXXXXXXVXXX',
    'XXSVXXXXXXXXVSXX',
    '.XXVXXXXXXXXVXX.',
    '.XXVXXXXXXXXVXX.',
    '.XXVXXXXXXXXVXX.',
    '..XVXXXXXXXXVX..',
    '..XVXXXXXXXXVX..',
    '..XVXXXXXXXXVX..',
    '..XVXXXXXXXXVX..',
    '.XXVXXXXXXXXVXX.',
    '.XXVXXXXXXXXVXX.',
    'XXXVXXXXXXXXVXXX',
    'XxXxXxXxXxXxXxXx',
    '................',
  ],
  stranger2: [
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '...XXXXXXXXXX...',
    '...XXxxxxxxXX...',
    '...XxxVxxVxxX...',
    '...XxxxxxxxxX.iV',
    '...XXxxxxxxXXVVV',
    '..XXXXXXXXXXXXSV',
    '.XXVXXXYXXXXXXS.',
    '.XXVXXXXXXXXVX..',
    'XXXVXXXXXXXXVX..',
    'XXSVXXXXXXXXVX..',
    '.XXVXXXXXXXXVXX.',
    '.XXVXXXXXXXXVXX.',
    '.XXVXXXXXXXXVXX.',
    '..XVXXXXXXXXVX..',
    '..XVXXXXXXXXVX..',
    '..XVXXXXXXXXVX..',
    '..XVXXXXXXXXVX..',
    '.XXVXXXXXXXXVXX.',
    '.XXVXXXXXXXXVXX.',
    'XXXVXXXXXXXXVXXX',
    'XxXxXxXxXxXxXxXx',
    '................',
  ],

  // Projectiles. They point right; the game flips or rotates them.
  // Skeleton arrow: wooden shaft, steel head, red fletching.
  arrow_enemy: [
    'r.r.......e.',
    '.rNNNNNNNNee',
    'r.r.......e.',
  ],
  shuriken: [
    '...E...',
    '...E...',
    '..EWE..',
    'EEWKWEE',
    '..EWE..',
    '...E...',
    '...E...',
  ],
  dagger_shadow: [
    '.v....EE..',
    'vVVxxEEWWW',
    '.v....EE..',
  ],
  shard: [
    '..iU...',
    'iiUUUu.',
    'UUUUuuu',
    'iuUuuu.',
    '..uu...',
  ],
  boulder: [
    '...ZZZZ...',
    '.ZZZZZZzz.',
    '.ZZMZZZZz.',
    'ZZZZZZZZzz',
    'ZZZZZzZZzz',
    'ZZzZZZZzzz',
    'ZZZZZZZzzz',
    '.zZZZzzzz.',
    '.zzzzzzzz.',
    '...zzzz...',
  ],
  tremor: [
    '......Z.......',
    '....Z.ZZ..Z...',
    '...ZZZZZZ.ZZ..',
    '..ZZzZZZZZZZ..',
    '.ZZzzZZZzZZZZ.',
    'ZZzzzzZZzzZZZZ',
    'zzzzzzzzzzzzzz',
    '..............',
  ],
  bomb: [
    '......YO.',
    '.....n.Y.',
    '...KKn...',
    '..KKKKK..',
    '.KKWKKKK.',
    '.KWKKKKK.',
    '.KKKKKKK.',
    '..KKKKK..',
    '...KKK...',
  ],
  p_axe: [
    '..EEEE....',
    '.EWWWEE...',
    'EWEEEEn...',
    'EEEE.nN...',
    '.EE.nN....',
    '...nN.....',
    '..nN......',
    '.nN.......',
    'nN........',
    'N.........',
  ],

  // Weapon icons (pickups, HUD and shop).
  w_axe: [
    '.....nn.....',
    '.EEE.nN.EEE.',
    'EWWEEnNEEWWE',
    'EWEEEnNEEEWE',
    'EWEEEnNEEEWE',
    'EWWEEnNEEWWE',
    '.EEE.nN.EEE.',
    '.....nN.....',
    '.....nN.....',
    '.....YY.....',
    '.....nN.....',
    '.....nN.....',
  ],
  w_throwingAxe: [
    '............',
    '....EEEE....',
    '...EWWWEE...',
    '..EWEEEEn...',
    '..EEEE.nN...',
    '...EE.nN....',
    '.....nN.....',
    '....nN......',
    '...nN.......',
    '..YY........',
    '.nN.........',
    'nN..........',
  ],
  w_bombs: [
    '.........YO.',
    '........n.Y.',
    '.......n....',
    '....KKKn....',
    '...KKKKKK...',
    '..KKWKKKKK..',
    '..KWKKKKKK..',
    '..KKKKKKKK..',
    '..KKKKKKKK..',
    '...KKKKKK...',
    '....KKKK....',
    '............',
  ],

  gem: [
    '..UUUU..',
    '.UiiUUu.',
    'UiiUUUuu',
    'UUUUUuuu',
    '.UUUuuu.',
    '..UUuu..',
    '...Uu...',
    '........',
  ],
  shield_full: [
    'UUUUUUU',
    'UiUUUUU',
    'UUUUUUu',
    '.UUUUu.',
    '..UUu..',
    '...u...',
  ],
  shield_empty: [
    'DDDDDDD',
    'DDDDDDD',
    'DDDDDDD',
    '.DDDDD.',
    '..DDD..',
    '...D...',
  ],
  icon_power: [
    '....RR....',
    '...RRRR...',
    '..RRWRRR..',
    '.RRRRRRRR.',
    '....RR....',
    '....RR....',
    '....RR....',
    '....rr....',
    '...rrrr...',
    '..........',
  ],
  icon_speed: [
    '.W.LLL....',
    'WW.LLL....',
    '.W.LLL....',
    '...LLL....',
    '...LLLL...',
    '..LLLLLLL.',
    '.NNNNNNNNN',
    '.nnnnnnnnn',
    '..........',
    '..........',
  ],
  icon_haste: [
    '.....YY...',
    '....YY....',
    '...YY.....',
    '..YYYYYY..',
    '.....YY...',
    '....YY....',
    '...YY.....',
    '..YY......',
    '.Y........',
    '..........',
  ],
  icon_dash: [
    '..........',
    'U...U.....',
    'UU..UU....',
    'UUU.UUU...',
    'UUUUUUUU..',
    'UUU.UUU...',
    'UU..UU....',
    'U...U.....',
    '..........',
    '..........',
  ],
  icon_jump: [
    '.......WW.',
    '.....WWWW.',
    '...WWWWWW.',
    '..WWWWWWW.',
    '.WWWWWWW..',
    'WWWWWWW...',
    '..WWWW....',
    '...WW.....',
    '..........',
    '..........',
  ],
};

// Recoloured sprites: one grid, several palettes. '*' and '+' are the
// colours that change.
const TEMPLATE_SPRITES = {
  rune: [
    '..EEEEEE..',
    '.EEEEEEEE.',
    'EEE*EE*EEE',
    'EEE****EEE',
    'EEEE**EEEE',
    'EEEE**EEEE',
    'EEE*EE*EEE',
    'EE*EEEE*EE',
    'EEEEEEEEEE',
    '.EEEEEEEE.',
    '..eeeeee..',
  ],
  armor: [
    '.**....**.',
    '****..****',
    '**********',
    '.*******+.',
    '.**+**+**.',
    '.********.',
    '.**+**+**.',
    '.********.',
    '..******..',
    '..++++++..',
  ],
};

// ---------------------------------------------------------------- shapes
// Each shape: { w, h, frames: [fn(x, y) -> palette letter or null] }

const inRect = (x, y, x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;

function golemShape(armsUp) {
  return (x, y) => {
    const r = (x0, y0, x1, y1) => inRect(x, y, x0, y0, x1, y1);
    // moss cap
    if (r(11, 0, 16, 0) || r(9, 1, 18, 2)) return (x * 7 + y) % 4 ? 'M' : 'm';
    // head
    if (r(8, 3, 19, 9)) {
      if (r(10, 5, 11, 6) || r(16, 5, 17, 6)) return armsUp ? 'R' : 'O';
      if (r(11, 8, 16, 8)) return 'K';
      return x === 19 || y === 9 ? 'z' : 'Z';
    }
    // arms
    if (armsUp) {
      if (r(0, 0, 5, 12) || r(22, 0, 27, 12)) {
        if (y <= 3) return 'z';
        return (x === 5 || x === 27) ? 'z' : (y >= 10 ? 'M' : 'Z');
      }
    } else if (r(0, 10, 5, 24) || r(22, 10, 27, 24)) {
      if (y >= 21) return 'z';
      if (y <= 11) return 'M';
      return (x === 0 || x === 22) ? 'z' : 'Z';
    }
    // torso
    if (r(6, 10, 21, 21)) {
      if (y <= 11) return 'M';
      if (r(12, 15, 15, 17)) return armsUp ? 'R' : 'O';     // glowing core
      if ((x === 9 || x === 18) && (y === 13 || y === 14)) return 'M';
      return (x === 21 || y === 21) ? 'z' : 'Z';
    }
    // legs
    if (r(7, 22, 12, 29) || r(15, 22, 20, 29)) return (x === 12 || x === 20 || y === 29) ? 'z' : 'Z';
    return null;
  };
}

function crabShape(frame) {
  return (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    // eyes on stalks
    if ((x === 16 || x === 23) && y >= 6 && y <= 9) return 'C';
    if ((inRect(x, y, 15, 4, 17, 5) || inRect(x, y, 22, 4, 24, 5))) return ((x === 16 || x === 23) && y === 5) ? 'K' : 'W';
    // crystals on the shell
    const spikes = [[13, 3], [20, 0], [27, 3]];
    for (const [cx, top] of spikes) {
      if (y >= top && y <= 11 && Math.abs(px - cx) <= (y - top) * 0.35 + 0.5) return px < cx ? 'U' : (px - cx < 1 ? 'i' : 'u');
    }
    // shell: an upper half-ellipse
    const ex = (px - 20) / 14, ey = (py - 17) / 8;
    const e = ex * ex + ey * ey;
    if (e <= 1 && y <= 19) return e > 0.72 ? 'r' : 'R';
    // claws
    const clawY = frame === 2 ? 6 : 12;
    for (const cx of [4.5, 35.5]) {
      const dx = px - cx, dy = py - clawY;
      const d = dx * dx + dy * dy;
      if (d <= 20) {
        const outward = cx < 20 ? -dx : dx;
        if (Math.abs(dy) < 1 && outward > 0) return null;     // pincer gap
        return d > 12 ? 'r' : 'R';
      }
    }
    // arms
    if (frame === 2) {
      if ((x === 6 || x === 7 || x === 32 || x === 33) && y >= 9 && y <= 15) return 'r';
    } else if (y >= 13 && y <= 14 && (inRect(x, y, 8, 0, 9, 99) || inRect(x, y, 30, 0, 31, 99))) return 'r';
    // legs
    if (y >= 19 && y <= 23) {
      const k = (y - 19) >> 1;
      const swing = frame === 1 ? 1 : -1;
      for (const base of [10, 14, 18]) if (x === base - k * swing) return 'r';
      for (const base of [22, 26, 30]) if (x === base + k * swing) return 'r';
    }
    return null;
  };
}

function dragonShape(frame) {
  // frame 0 wings up, 1 wings down, 2 breathing fire (wings level)
  const side = (px, py, ax, ay, bx, by) => (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const tri = (px, py, a, b, c) => {
    const d1 = side(px, py, a[0], a[1], b[0], b[1]);
    const d2 = side(px, py, b[0], b[1], c[0], c[1]);
    const d3 = side(px, py, c[0], c[1], a[0], a[1]);
    const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  };
  const ell = (px, py, cx, cy, rx, ry) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2;
  const wings = [
    [[[24, 22], [38, 22], [22, 0]], [[24, 22], [22, 0], [6, 5]]],
    [[[24, 22], [38, 22], [20, 43]], [[24, 22], [20, 43], [5, 37]]],
    [[[24, 22], [38, 22], [10, 12]], [[24, 22], [10, 12], [2, 22]]],
  ][frame];
  return (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    if (inRect(x, y, 52, 14, 53, 15)) return 'R';                      // eye
    if (tri(px, py, [45, 13], [48, 13], [42, 4]) || tri(px, py, [49, 12], [52, 12], [51, 3])) return 'C'; // horns
    if (frame === 2 && inRect(x, y, 54, 19, 63, 21)) return py < 20 ? 'Y' : 'T';   // fire in the mouth
    if (inRect(x, y, 53, 15, 62, 21)) return y === 19 ? 'x' : (y >= 20 ? 'q' : 'X'); // snout
    if (ell(px, py, 49, 17, 7, 5) <= 1) return 'X';                     // head
    if (ell(px, py, 41, 22, 7, 5) <= 1) return 'X';                     // neck
    const eb = ell(px, py, 30, 27, 15, 8);
    if (eb <= 1) return py > 30 ? 'q' : (eb > 0.78 ? 'x' : 'X');        // body
    if (px >= 0 && px <= 17) {                                          // tail
      const cy = 27 - (17 - px) * 0.45, th = 0.8 + px * 0.16;
      if (Math.abs(py - cy) <= th) return 'X';
      if (tri(px, py, [0, 17], [5, 19], [2, 13])) return 'T';
    }
    if ((inRect(x, y, 22, 33, 25, 39) || inRect(x, y, 34, 33, 37, 39))) return y >= 38 ? 'C' : 'x'; // legs
    for (const t of wings) {
      if (tri(px, py, t[0], t[1], t[2])) {
        const onEdge = !tri(px, py, ...t.map(([ax, ay]) => [ax + (30 - ax) * 0.08, ay + (20 - ay) * 0.08]));
        return onEdge ? 'X' : 'v';
      }
    }
    return null;
  };
}

function portalShape(frame) {
  return (x, y) => {
    const ex = (x + 0.5 - 8) / 7.5, ey = (y + 0.5 - 12) / 11.5;
    const e = ex * ex + ey * ey;
    if (e > 1) return null;
    if (e > 0.72) return 'V';
    if (e > 0.55) return 'v';
    const ang = Math.atan2(ey, ex) + frame * Math.PI / 2;
    const swirl = Math.sin(ang * 2 + Math.sqrt(e) * 10);
    return swirl > 0.6 ? 'i' : swirl > 0 ? 'V' : 'x';
  };
}

const SHAPES = {
  golem1: { w: 28, h: 30, fn: golemShape(false) },
  golem2: { w: 28, h: 30, fn: golemShape(true) },
  crab_boss1: { w: 40, h: 24, fn: crabShape(0) },
  crab_boss2: { w: 40, h: 24, fn: crabShape(1) },
  crab_boss3: { w: 40, h: 24, fn: crabShape(2) },
  dragon1: { w: 64, h: 44, fn: dragonShape(0) },
  dragon2: { w: 64, h: 44, fn: dragonShape(1) },
  dragon3: { w: 64, h: 44, fn: dragonShape(2) },
  portal1: { w: 16, h: 24, fn: portalShape(0) },
  portal2: { w: 16, h: 24, fn: portalShape(1) },
  portal3: { w: 16, h: 24, fn: portalShape(2) },
  portal4: { w: 16, h: 24, fn: portalShape(3) },
  runewall: {
    w: 16, h: 16,
    fn: (x, y) => {
      if (x === 0 || y === 0 || x === 15 || y === 15) return 'x';
      const d = Math.abs(x - 7.5) + Math.abs(y - 7.5);
      if (d >= 4 && d < 5.2) return 'V';
      if ((x === 7 || x === 8) && y >= 3 && y <= 12) return 'V';
      return (x + y) % 5 === 0 ? 'x' : 'X';
    },
  },
};
