// Generates every texture in code: sprites from pixel grids, tiles and
// backgrounds drawn procedurally, and a 5x7 bitmap font.

const PAL = {
  K: '#1a1c2c', // outline / dark
  W: '#f4f4f4', // white
  S: '#f2c08a', // skin
  H: '#7a3b1e', // hair
  B: '#3b6fd9', // tunic
  b: '#24408f', // tunic shade
  Y: '#ffcd3a', // gold
  y: '#c28a1e', // gold shade
  L: '#5a4030', // trousers
  G: '#4fc24a', // slime
  g: '#2b8a3a', // slime shade
  l: '#a8f08a', // slime light
  R: '#e43b44', // red
  r: '#9e2835', // red shade
  P: '#7b4fb8', // bat
  p: '#40246a', // bat shade
  O: '#f77622', // orange
  N: '#8a5a2b', // wood
  n: '#5c3a1c', // wood shade
  E: '#9aa3b0', // steel
  e: '#5d6673', // steel shade
  C: '#e8e2c8', // bone
  c: '#b5ac8c', // bone shade
  U: '#4dd2ff', // magic blue
  D: '#3a2a3a', // empty heart
};

const SPRITES = {
  player_idle: [
    '....HHHH....',
    '...HHHHHH...',
    '..HHSSSSH...',
    '..HSSSKSK...',
    '...SSSSSS...',
    '....SSSS....',
    '...BBBBBB...',
    '..BBBBBBBB..',
    '..SBBBBBBS..',
    '..SBYYYYBS..',
    '...bbbbbb...',
    '...LL..LL...',
    '...LL..LL...',
    '...LL..LL...',
    '..KKK..KKK..',
    '............',
  ],
  player_run1: [
    '....HHHH....',
    '...HHHHHH...',
    '..HHSSSSH...',
    '..HSSSKSK...',
    '...SSSSSS...',
    '....SSSS....',
    '...BBBBBB...',
    '..BBBBBBBB..',
    '..SBBBBBBS..',
    '..SBYYYYBS..',
    '...bbbbbb...',
    '...LL...LL..',
    '..LL.....LL.',
    '.LL.......L.',
    '.KK.......KK',
    '............',
  ],
  player_run2: [
    '............',
    '....HHHH....',
    '...HHHHHH...',
    '..HHSSSSH...',
    '..HSSSKSK...',
    '...SSSSSS...',
    '....SSSS....',
    '...BBBBBB...',
    '..BBBBBBBB..',
    '..SBYYYYBS..',
    '...bbbbbb...',
    '....LLL.....',
    '....LL......',
    '....LLL.....',
    '....KKKK....',
    '............',
  ],
  player_jump: [
    '....HHHH....',
    '...HHHHHH...',
    '..HHSSSSH...',
    '..HSSSKSK...',
    '...SSSSSS...',
    '.S..SSSS..S.',
    '.SBBBBBBBBS.',
    '..BBBBBBBB..',
    '...BBBBBB...',
    '...BYYYYB...',
    '...bbbbbb...',
    '..LL...LL...',
    '.LL.....LL..',
    '.KK......KK.',
    '............',
    '............',
  ],
  player_attack: [
    '....HHHH....',
    '...HHHHHH...',
    '..HHSSSSH...',
    '..HSSSKSK...',
    '...SSSSSS...',
    '....SSSS....',
    '...BBBBBB...',
    '..BBBBBBBB..',
    '..SBBBBBBBSS',
    '...BYYYYB...',
    '...bbbbbb...',
    '..LL...LL...',
    '..LL....LL..',
    '..LL....LL..',
    '.KKK....KKK.',
    '............',
  ],
  slime1: [
    '..............',
    '.....gggg.....',
    '...gGGGGGGg...',
    '..gGlGGGGGGg..',
    '.gGlGWKGGWKGg.',
    '.gGGGWKGGWKGg.',
    'gGGGGGGGGGGGGg',
    'gGGGGGGGGGGGGg',
    '.gggggggggggg.',
    '..............',
  ],
  slime2: [
    '..............',
    '..............',
    '....gggggg....',
    '..gGGlGGGGGg..',
    '.gGlGWKGGWKGg.',
    'gGGGGWKGGWKGGg',
    'gGGGGGGGGGGGGg',
    'gGGGGGGGGGGGGg',
    'gggggggggggggg',
    '..............',
  ],
  bat1: [
    'P..............P',
    'PP............PP',
    'PPP..p....p..PPP',
    '.PPPPpp..ppPPPP.',
    '..PPPPPPPPPPPP..',
    '....pPRPPRPp....',
    '.....pPPPPp.....',
    '......W..W......',
    '................',
    '................',
  ],
  bat2: [
    '................',
    '................',
    '.....p....p.....',
    '.....pp..pp.....',
    '....pPPPPPPp....',
    '..PPPPRPPRPPPP..',
    '.PPP.pPPPPp.PPP.',
    'PP....W..W....PP',
    'P..............P',
    '................',
  ],
  skel_idle: [
    '....CCCC....',
    '...CCCCCC...',
    '...CCKCCK...',
    '...CCCCCC...',
    '....CKCK....',
    '.....CC...N.',
    '...cCCCCc.nN',
    '..C.cCc.CCnN',
    '..C.CCC...nN',
    '....cCc...N.',
    '....C.C.....',
    '....C.C.....',
    '...C...C....',
    '...C...C....',
    '..CC...CC...',
    '............',
  ],
  skel_shoot: [
    '....CCCC....',
    '...CCCCCC...',
    '...CCRCCR...',
    '...CCCCCC...',
    '....CKCK....',
    '.....CC.....',
    '...cCCCCCCnN',
    '..C.cCc.EEWN',
    '..C.CCC...nN',
    '....cCc.....',
    '....C.C.....',
    '....C.C.....',
    '...C...C....',
    '...C...C....',
    '..CC...CC...',
    '............',
  ],
  coin1: [
    '..YYYY..',
    '.YYYYYy.',
    'YYWYYYYy',
    'YYWYYYYy',
    'YYYYYYYy',
    'YYYYYYYy',
    '.YYYYYy.',
    '..yyyy..',
  ],
  coin2: [
    '...YY...',
    '..YYYy..',
    '..YWYy..',
    '..YWYy..',
    '..YYYy..',
    '..YYYy..',
    '..YYYy..',
    '...yy...',
  ],
  coin3: [
    '...Yy...',
    '...Yy...',
    '...Yy...',
    '...Yy...',
    '...Yy...',
    '...Yy...',
    '...Yy...',
    '...Yy...',
  ],
  potion: [
    '...nn...',
    '...EE...',
    '..E..E..',
    '.ERRRRE.',
    'ERRWRRRE',
    'ERWRRRRE',
    'ERRRRRRE',
    '.ErrrrE.',
    '..EEEE..',
  ],
  heart_container: [
    '.YYY...YYY.',
    'YRRRY.YRRRY',
    'YRWRRYRRRRY',
    'YRRRRRRRRRY',
    'YRRRRRRRRRY',
    '.YRRRRRRRY.',
    '..YRRRRRY..',
    '...YRRRY...',
    '....YRY....',
    '.....Y.....',
  ],
  heart_full: [
    '.RR.RR.',
    'RWRRRRR',
    'RRRRRRR',
    '.RRRRR.',
    '..RRR..',
    '...R...',
  ],
  heart_empty: [
    '.DD.DD.',
    'DDDDDDD',
    'DDDDDDD',
    '.DDDDD.',
    '..DDD..',
    '...D...',
  ],
  w_dagger: [
    '............',
    '..........E.',
    '.........EW.',
    '........EW..',
    '.......EW...',
    '......EW....',
    '..Y..EW.....',
    '...YEW......',
    '...nY.......',
    '..n..Y......',
    '.n..........',
    '............',
  ],
  w_sword: [
    '..........EW',
    '.........EWE',
    '........EWE.',
    '.......EWE..',
    '......EWE...',
    '.....EWE....',
    '..Y.EWE.....',
    '...YWE......',
    '...nY.......',
    '..nn.Y......',
    '.nn.........',
    'n...........',
  ],
  w_hammer: [
    '..EEEEEEEE..',
    '.EWWWWWWWWE.',
    '.EWEEEEEEEe.',
    '.EEEEEEEEEe.',
    '..eeennee...',
    '.....nn.....',
    '.....nN.....',
    '.....nN.....',
    '.....nN.....',
    '.....nN.....',
    '.....YY.....',
    '.....nN.....',
  ],
  w_bow: [
    '...NN.......',
    '...W.NN.....',
    '...W...N....',
    '...W....N...',
    '...W....N...',
    '...W.....N..',
    '...W.....N..',
    '...W....N...',
    '...W....N...',
    '...W...N....',
    '...W.NN.....',
    '...NN.......',
  ],
  w_fireWand: [
    '.......OYO..',
    '......OYWYO.',
    '.......OYO..',
    '......nN....',
    '.....nN.....',
    '....nN......',
    '...nN.......',
    '..nN........',
    '.nN.........',
    'nN..........',
    '............',
    '............',
  ],
  arrow: [
    'W.......E.',
    'WNNNNNNNEE',
    'W.......E.',
  ],
  fireball: [
    '..OOOO..',
    '.OYYYYO.',
    'OYWWWYYO',
    'OYWWWWYO',
    'OYWWWYYO',
    'OYYYYYO.',
    '.OOOOO..',
    '........',
  ],
  slash: [
    '........WWW.....',
    '..........WWW...',
    '............WW..',
    '.............WW.',
    '..............WW',
    '..............WW',
    '..............WW',
    '...............W',
    '..............WW',
    '..............WW',
    '..............WW',
    '.............WW.',
    '............WW..',
    '..........WWW...',
    '........WWW.....',
    '................',
  ],
  chest_closed: [
    '..nnnnnnnnnnnn..',
    '.nNNNNNNNNNNNNn.',
    '.nNNNNNNNNNNNNn.',
    'nNNNNNNNNNNNNNNn',
    'nYYYYYYYYYYYYYYn',
    'nNNNNNNYYNNNNNNn',
    'nNNNNNNYKNNNNNNn',
    'nNNNNNNYYNNNNNNn',
    'nNNNNNNNNNNNNNNn',
    'nNNNNNNNNNNNNNNn',
    'nYYYYYYYYYYYYYYn',
    'nNNNNNNNNNNNNNNn',
    'nnnnnnnnnnnnnnnn',
    '................',
  ],
  chest_open: [
    '.nnnnnnnnnnnnnn.',
    'nNNNNNNNNNNNNNNn',
    'nnnnnnnnnnnnnnnn',
    'nYYWYYYYYYWYYYYn',
    'nYYYYYWYYYYYYWYn',
    'nNNNNNNNNNNNNNNn',
    'nNNNNNNYYNNNNNNn',
    'nNNNNNNYYNNNNNNn',
    'nNNNNNNNNNNNNNNn',
    'nNNNNNNNNNNNNNNn',
    'nYYYYYYYYYYYYYYn',
    'nNNNNNNNNNNNNNNn',
    'nnnnnnnnnnnnnnnn',
    '................',
  ],
};

// 5x7 font, one byte per column, bit 0 = top row.
const FONT_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!.,:-+/?%'()<>";
const FONT_GLYPHS = {
  ' ': [0, 0, 0, 0, 0],
  A: [0x7C, 0x12, 0x11, 0x12, 0x7C], B: [0x7F, 0x49, 0x49, 0x49, 0x36],
  C: [0x3E, 0x41, 0x41, 0x41, 0x22], D: [0x7F, 0x41, 0x41, 0x22, 0x1C],
  E: [0x7F, 0x49, 0x49, 0x49, 0x41], F: [0x7F, 0x09, 0x09, 0x09, 0x01],
  G: [0x3E, 0x41, 0x49, 0x49, 0x7A], H: [0x7F, 0x08, 0x08, 0x08, 0x7F],
  I: [0x00, 0x41, 0x7F, 0x41, 0x00], J: [0x20, 0x40, 0x41, 0x3F, 0x01],
  K: [0x7F, 0x08, 0x14, 0x22, 0x41], L: [0x7F, 0x40, 0x40, 0x40, 0x40],
  M: [0x7F, 0x02, 0x0C, 0x02, 0x7F], N: [0x7F, 0x04, 0x08, 0x10, 0x7F],
  O: [0x3E, 0x41, 0x41, 0x41, 0x3E], P: [0x7F, 0x09, 0x09, 0x09, 0x06],
  Q: [0x3E, 0x41, 0x51, 0x21, 0x5E], R: [0x7F, 0x09, 0x19, 0x29, 0x46],
  S: [0x46, 0x49, 0x49, 0x49, 0x31], T: [0x01, 0x01, 0x7F, 0x01, 0x01],
  U: [0x3F, 0x40, 0x40, 0x40, 0x3F], V: [0x1F, 0x20, 0x40, 0x20, 0x1F],
  W: [0x3F, 0x40, 0x38, 0x40, 0x3F], X: [0x63, 0x14, 0x08, 0x14, 0x63],
  Y: [0x07, 0x08, 0x70, 0x08, 0x07], Z: [0x61, 0x51, 0x49, 0x45, 0x43],
  0: [0x3E, 0x51, 0x49, 0x45, 0x3E], 1: [0x00, 0x42, 0x7F, 0x40, 0x00],
  2: [0x42, 0x61, 0x51, 0x49, 0x46], 3: [0x21, 0x41, 0x45, 0x4B, 0x31],
  4: [0x18, 0x14, 0x12, 0x7F, 0x10], 5: [0x27, 0x45, 0x45, 0x45, 0x39],
  6: [0x3C, 0x4A, 0x49, 0x49, 0x30], 7: [0x01, 0x71, 0x09, 0x05, 0x03],
  8: [0x36, 0x49, 0x49, 0x49, 0x36], 9: [0x06, 0x49, 0x49, 0x29, 0x1E],
  '!': [0x00, 0x00, 0x5F, 0x00, 0x00], '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  ',': [0x00, 0x50, 0x30, 0x00, 0x00], ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08], '+': [0x08, 0x08, 0x3E, 0x08, 0x08],
  '/': [0x20, 0x10, 0x08, 0x04, 0x02], '?': [0x02, 0x01, 0x51, 0x09, 0x06],
  '%': [0x23, 0x13, 0x08, 0x64, 0x62], "'": [0x00, 0x05, 0x03, 0x00, 0x00],
  '(': [0x00, 0x1C, 0x22, 0x41, 0x00], ')': [0x00, 0x41, 0x22, 0x1C, 0x00],
  '<': [0x08, 0x14, 0x22, 0x41, 0x00], '>': [0x00, 0x41, 0x22, 0x14, 0x08],
};

// Background colours per theme (0 meadow, 1 cave, 2 castle, 3 volcano, 4 sky vault).
const THEMES = [
  { skyTop: '#4aa8f0', skyBottom: '#c4ecff', far: '#8aa8d8', near: '#4f9a55', nearShade: '#3d7d45' },
  { skyTop: '#0e0a18', skyBottom: '#2a1f40', far: '#2a2142', near: '#3a2d5a', nearShade: '#2a2044' },
  { skyTop: '#1e1438', skyBottom: '#c8587a', far: '#46305e', near: '#24183a', nearShade: '#ffcd3a' },
  { skyTop: '#12060a', skyBottom: '#7a2210', far: '#3a1a1c', near: '#22100e', nearShade: '#ff6a00' },
  { skyTop: '#ffc85a', skyBottom: '#fff4d6', far: '#fff0c8', near: '#ffe2a0', nearShade: '#ffffff' },
];

// Small deterministic random generator so the art looks the same every run.
function seededRandom(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    Object.assign(PAL, EXTRA_PAL);
    Object.keys(SPRITES).forEach(key => this.makePixelTexture(key, SPRITES[key]));
    Object.keys(EXTRA_SPRITES).forEach(key => this.makePixelTexture(key, EXTRA_SPRITES[key]));
    Object.keys(SHAPES).forEach(key => this.makeShapeTexture(key, SHAPES[key]));
    RUNE_ORDER.forEach(r => this.makePixelTexture('rune_' + r, TEMPLATE_SPRITES.rune, Object.assign({}, PAL, { '*': RUNES[r].glyph })));
    ARMOR_ORDER.forEach(a => this.makePixelTexture('armor_' + a, TEMPLATE_SPRITES.armor,
      Object.assign({}, PAL, { '*': ARMORS[a].colors[0], '+': ARMORS[a].colors[1] })));
    this.makeRect('px', 2, 2, '#ffffff');
    const moon = this.textures.createCanvas('moon', 29, 29);
    const mctx = moon.getContext();
    mctx.fillStyle = '#ffe8b0';
    mctx.beginPath(); mctx.arc(14.5, 14.5, 14, 0, Math.PI * 2); mctx.fill();
    moon.refresh();
    this.makeTileset();
    THEMES.forEach((t, i) => this.makeBackground(i, t));
    this.makeFont();
    this.makeAnims();
    Shaders.register(this.game);
    this.scene.start('MenuScene');
  }

  makePixelTexture(key, rows, palette = PAL) {
    drawPixelTexture(this.textures, key, rows, palette);
  }

  makeShapeTexture(key, { w, h, fn }) {
    const tex = this.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = PAL[fn(x, y)];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    tex.refresh();
  }

  makeRect(key, w, h, color) {
    const tex = this.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    tex.refresh();
  }

  // Tileset: 3 tiles per theme -> [surface, fill, platform].
  makeTileset() {
    const count = 15;
    const tex = this.textures.createCanvas('tiles', 16 * count, 16);
    const ctx = tex.getContext();
    const rnd = seededRandom(42);
    const px = (ox, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(ox + x, y, 1, 1); };
    const fill = (ox, c) => { ctx.fillStyle = c; ctx.fillRect(ox, 0, 16, 16); };
    const speckle = (ox, colors, n, yMin = 0) => {
      for (let i = 0; i < n; i++) px(ox, Math.floor(rnd() * 16), yMin + Math.floor(rnd() * (16 - yMin)), colors[i % colors.length]);
    };
    const bricks = (ox, base, mortar, light) => {
      fill(ox, base);
      ctx.fillStyle = mortar;
      ctx.fillRect(ox, 7, 16, 1);
      ctx.fillRect(ox, 15, 16, 1);
      ctx.fillRect(ox + 3, 0, 1, 7);
      ctx.fillRect(ox + 11, 0, 1, 7);
      ctx.fillRect(ox + 7, 8, 1, 7);
      ctx.fillStyle = light;
      ctx.fillRect(ox, 0, 3, 1); ctx.fillRect(ox + 4, 0, 7, 1); ctx.fillRect(ox + 12, 0, 4, 1);
      ctx.fillRect(ox, 8, 7, 1); ctx.fillRect(ox + 8, 8, 8, 1);
    };

    // Theme 0: meadow
    let ox = 0;
    fill(ox, '#7a4a24'); speckle(ox, ['#5e3818', '#94602f'], 22, 5);
    ctx.fillStyle = '#55c040'; ctx.fillRect(ox, 0, 16, 4);
    for (let x = 0; x < 16; x++) {
      if (rnd() < 0.6) px(ox, x, 4, '#2f8a2e');
      if (rnd() < 0.3) px(ox, x, 0, '#8ae070');
    }
    ox = 16;
    fill(ox, '#7a4a24'); speckle(ox, ['#5e3818', '#94602f', '#6a3e1c'], 30);
    ox = 32;
    fill(ox, '#a86a32');
    ctx.fillStyle = '#d08a48'; ctx.fillRect(ox, 0, 16, 2);
    ctx.fillStyle = '#6e4420'; ctx.fillRect(ox, 7, 16, 1); ctx.fillRect(ox + 7, 0, 1, 16);
    ctx.fillStyle = '#5c3a1c'; ctx.fillRect(ox, 15, 16, 1);
    px(ox, 2, 3, '#5c3a1c'); px(ox, 12, 3, '#5c3a1c'); px(ox, 4, 11, '#5c3a1c'); px(ox, 11, 11, '#5c3a1c');

    // Theme 1: cave
    ox = 48;
    fill(ox, '#3e3354'); speckle(ox, ['#2c2440', '#54476e'], 26, 3);
    ctx.fillStyle = '#7d6aa8'; ctx.fillRect(ox, 0, 16, 3);
    for (let x = 0; x < 16; x++) {
      if (rnd() < 0.4) px(ox, x, 0, '#a896d0');
      if (rnd() < 0.5) px(ox, x, 3, '#5a4c7c');
    }
    ox = 64;
    fill(ox, '#3e3354'); speckle(ox, ['#2c2440', '#54476e', '#352b4a'], 34);
    ox = 80;
    fill(ox, '#5a4f7a');
    ctx.fillStyle = '#8f7fc0'; ctx.fillRect(ox, 0, 16, 2);
    ctx.fillStyle = '#3a3052'; ctx.fillRect(ox, 14, 16, 2);
    px(ox, 4, 6, '#4dd2ff'); px(ox, 5, 5, '#4dd2ff'); px(ox, 5, 6, '#b8f0ff');
    px(ox, 11, 9, '#4dd2ff'); px(ox, 10, 10, '#4dd2ff'); px(ox, 11, 10, '#b8f0ff');

    // Theme 2: castle
    ox = 96;
    bricks(ox, '#5b6070', '#3a3e4a', '#6c7282');
    ctx.fillStyle = '#b8bcc8'; ctx.fillRect(ox, 0, 16, 2);
    ox = 112;
    bricks(ox, '#5b6070', '#3a3e4a', '#6c7282');
    ox = 128;
    bricks(ox, '#9a4a3a', '#5a2a22', '#b8604c');

    // Theme 3: volcano
    ox = 144;
    fill(ox, '#2e2226'); speckle(ox, ['#3e2e30', '#22181c', '#ff6a00'], 24, 4);
    ctx.fillStyle = '#ff6a00'; ctx.fillRect(ox, 0, 16, 2);
    ctx.fillStyle = '#4a3234'; ctx.fillRect(ox, 2, 16, 2);
    for (let x = 0; x < 16; x++) if (rnd() < 0.35) px(ox, x, 0, '#ffcd3a');
    ox = 160;
    fill(ox, '#2e2226'); speckle(ox, ['#3e2e30', '#22181c'], 30);
    px(ox, 4, 6, '#ff6a00'); px(ox, 5, 7, '#ff6a00'); px(ox, 5, 8, '#ff6a00'); px(ox, 11, 12, '#ff6a00'); px(ox, 12, 11, '#ff6a00');
    ox = 176;
    fill(ox, '#1a1424');
    ctx.fillStyle = '#4a3a6a'; ctx.fillRect(ox, 0, 16, 2);
    ctx.fillStyle = '#0e0a14'; ctx.fillRect(ox, 14, 16, 2);
    px(ox, 3, 4, '#6a5a8a'); px(ox, 4, 5, '#6a5a8a'); px(ox, 10, 8, '#6a5a8a'); px(ox, 11, 9, '#6a5a8a');

    // Theme 4: sky vault
    ox = 192;
    fill(ox, '#ffe2a0'); speckle(ox, ['#f2d27a', '#fff0c8'], 26, 5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(ox, 0, 16, 4);
    for (let x = 0; x < 16; x++) if (rnd() < 0.5) px(ox, x, 4, '#ffffff');
    ox = 208;
    fill(ox, '#ffe2a0'); speckle(ox, ['#f2d27a', '#fff0c8', '#e8c070'], 30);
    ox = 224;
    bricks(ox, '#f2c040', '#c28a1e', '#ffe080');

    tex.refresh();
    for (let i = 0; i < count; i++) tex.add(i, 0, i * 16, 0, 16, 16);

    // Fake walls (secret passages): the same tiles with faint cracks.
    const fake = this.textures.createCanvas('tiles_fake', 16 * count, 16);
    const fctx = fake.getContext();
    fctx.drawImage(tex.getSourceImage(), 0, 0);
    fctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    const crack = [[3, 5], [4, 6], [5, 6], [6, 7], [6, 8], [7, 9], [8, 9], [9, 10], [10, 4], [11, 5], [11, 6], [12, 11], [11, 12], [4, 12], [5, 13]];
    for (let i = 0; i < count; i++) crack.forEach(([x, y]) => fctx.fillRect(i * 16 + x, y, 1, 1));
    fake.refresh();
    for (let i = 0; i < count; i++) fake.add(i, 0, i * 16, 0, 16, 16);
  }

  makeBackground(index, t) {
    const W = 256, H = 272;
    // Sky gradient
    const sky = this.textures.createCanvas('sky_' + index, 4, H);
    let ctx = sky.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, t.skyTop);
    grad.addColorStop(1, t.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, H);
    sky.refresh();

    // Far and near layers. Wave periods divide W so the layers tile seamlessly.
    const wave = (x, parts) => parts.reduce((s, [amp, k, ph]) => s + amp * Math.sin((x / W) * Math.PI * 2 * k + ph), 0);
    const far = this.textures.createCanvas('bg_far_' + index, W, H);
    ctx = far.getContext();
    const near = this.textures.createCanvas('bg_near_' + index, W, H);
    const nctx = near.getContext();

    if (index === 0) {
      // clouds
      ctx.fillStyle = '#ffffff';
      [[30, 40, 22], [120, 60, 30], [200, 30, 18]].forEach(([cx, cy, w]) => {
        ctx.fillRect(cx, cy, w, 6);
        ctx.fillRect(cx + 4, cy - 4, w - 10, 4);
        ctx.fillRect(cx + 8, cy - 7, w - 18, 3);
      });
      for (let x = 0; x < W; x++) {
        const top = Math.round(150 + wave(x, [[30, 2, 0.5], [12, 5, 1.3], [5, 11, 0.2]]));
        ctx.fillStyle = t.far;
        ctx.fillRect(x, top, 1, H - top);
        if (top < 130) { ctx.fillStyle = '#e8f0ff'; ctx.fillRect(x, top, 1, Math.min(4, 130 - top)); }
        const ntop = Math.round(200 + wave(x, [[12, 3, 2.0], [5, 7, 0.4]]));
        nctx.fillStyle = t.near;
        nctx.fillRect(x, ntop, 1, H - ntop);
      }
      // little trees on the near hills
      for (let x = 8; x < W; x += 37) {
        const ntop = Math.round(200 + wave(x, [[12, 3, 2.0], [5, 7, 0.4]]));
        nctx.fillStyle = t.nearShade;
        nctx.fillRect(x - 4, ntop - 14, 9, 10);
        nctx.fillRect(x - 3, ntop - 17, 7, 3);
        nctx.fillStyle = '#5c3a1c';
        nctx.fillRect(x, ntop - 4, 2, 5);
      }
    } else if (index === 1) {
      for (let x = 0; x < W; x++) {
        const hang = Math.max(0, Math.round(30 + wave(x, [[18, 3, 0.3], [10, 8, 1.1], [6, 16, 2.2]])));
        const floor = Math.round(215 + wave(x, [[10, 4, 1.7], [4, 9, 0.5]]));
        ctx.fillStyle = t.far;
        ctx.fillRect(x, 0, 1, hang);
        ctx.fillRect(x, floor, 1, H - floor);
        const nhang = Math.max(0, Math.round(15 + wave(x, [[14, 4, 2.1], [12, 10, 0.4]])));
        const nfloor = Math.round(235 + wave(x, [[8, 2, 0.9], [5, 6, 2.4]]));
        nctx.fillStyle = t.near;
        nctx.fillRect(x, 0, 1, nhang);
        nctx.fillRect(x, nfloor, 1, H - nfloor);
      }
      // glowing crystals
      const rnd = seededRandom(7);
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(rnd() * W), y = 60 + Math.floor(rnd() * 140);
        ctx.fillStyle = '#4dd2ff';
        ctx.fillRect(x, y, 1, 1);
      }
    } else if (index === 3) {
      // volcanoes with glowing craters, embers in the air
      const rnd = seededRandom(13);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = i % 3 ? '#ff6a00' : '#ffcd3a';
        ctx.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * 170), 1, 1);
      }
      for (let x = 0; x < W; x++) {
        let top = Math.round(170 + wave(x, [[14, 2, 0.4], [6, 7, 1.1]]));
        [[64, 70], [192, 95]].forEach(([cx, peak]) => { top = Math.min(top, Math.round(peak + Math.abs(x - cx) * 1.3)); });
        ctx.fillStyle = t.far;
        ctx.fillRect(x, top, 1, H - top);
        if ((Math.abs(x - 64) < 6 && top < 78) || (Math.abs(x - 192) < 6 && top < 103)) {
          ctx.fillStyle = '#ff6a00';
          ctx.fillRect(x, top, 1, 3);
        }
        const ntop = Math.round(212 + wave(x, [[8, 4, 2.0], [6, 13, 0.4], [3, 32, 1.0]]));
        nctx.fillStyle = t.near;
        nctx.fillRect(x, ntop, 1, H - ntop);
      }
      nctx.fillStyle = t.nearShade;
      for (let x = 14; x < W; x += 41) nctx.fillRect(x, 238 + (x % 3) * 6, 6, 1);
    } else if (index === 4) {
      // drifting golden clouds
      const cloud = (c, cx, cy, w, col) => {
        c.fillStyle = col;
        c.fillRect(cx, cy, w, 8);
        c.fillRect(cx + 4, cy - 5, w - 10, 5);
        c.fillRect(cx + 9, cy - 9, w - 20, 4);
      };
      [[10, 60, 40], [90, 90, 54], [170, 50, 46], [220, 120, 30]].forEach(([cx, cy, w]) => cloud(ctx, cx, cy, w, t.far));
      for (let x = 0; x < W; x++) {
        const ntop = Math.round(205 + wave(x, [[8, 4, 0.7], [5, 9, 1.9]]));
        nctx.fillStyle = t.near;
        nctx.fillRect(x, ntop, 1, H - ntop);
        nctx.fillStyle = t.nearShade;
        nctx.fillRect(x, ntop, 1, 2);
      }
    } else {
      for (let x = 0; x < W; x++) {
        const top = Math.round(190 + wave(x, [[10, 2, 0.8], [4, 5, 0.1]]));
        ctx.fillStyle = t.far;
        ctx.fillRect(x, top, 1, H - top);
      }
      // distant towers
      [[20, 120, 14], [90, 140, 10], [150, 105, 16], [215, 135, 12]].forEach(([x, top, w]) => {
        ctx.fillStyle = t.far;
        ctx.fillRect(x, top, w, H - top);
        for (let i = 0; i < w; i += 4) ctx.fillRect(x + i, top - 3, 2, 3);
      });
      // near castle wall with lit windows
      for (let x = 0; x < W; x++) {
        const top = 205 + ((Math.floor(x / 64) % 2) ? -25 : 0);
        nctx.fillStyle = t.near;
        nctx.fillRect(x, top, 1, H - top);
        if (x % 8 < 4) nctx.fillRect(x, top - 4, 1, 4);
      }
      nctx.fillStyle = t.nearShade;
      for (let x = 10; x < W; x += 32) nctx.fillRect(x, (Math.floor(x / 64) % 2) ? 195 : 220, 3, 5);
    }
    far.refresh();
    near.refresh();
  }

  makeFont() {
    // Each cell is 7x9: a 5x7 glyph, a 1px drop shadow and 1px spacing.
    const cw = 7, ch = 9;
    const tex = this.textures.createCanvas('font', cw * FONT_CHARS.length, ch);
    const ctx = tex.getContext();
    const draw = (color, dx, dy) => {
      ctx.fillStyle = color;
      [...FONT_CHARS].forEach((c, i) => {
        const cols = FONT_GLYPHS[c] || FONT_GLYPHS['?'];
        cols.forEach((bits, x) => {
          for (let y = 0; y < 7; y++) if (bits & (1 << y)) ctx.fillRect(i * cw + x + dx, y + dy, 1, 1);
        });
      });
    };
    draw('#000000', 1, 1);
    draw('#ffffff', 0, 0);
    tex.refresh();

    this.cache.bitmapFont.add('pixel', Phaser.GameObjects.RetroFont.Parse(this, {
      image: 'font',
      width: cw,
      height: ch,
      chars: FONT_CHARS,
      charsPerRow: FONT_CHARS.length,
      spacing: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      lineSpacing: 2,
    }));
  }

  makeAnims() {
    this.anims.create({ key: 'player_run', frames: [{ key: 'player_run1' }, { key: 'player_run2' }], frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'slime_move', frames: [{ key: 'slime1' }, { key: 'slime2' }], frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'bat_fly', frames: [{ key: 'bat1' }, { key: 'bat2' }], frameRate: 8, repeat: -1 });
    this.anims.create({
      key: 'coin_spin',
      frames: [{ key: 'coin1' }, { key: 'coin2' }, { key: 'coin3' }, { key: 'coin2' }],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({ key: 'crab_walk', frames: [{ key: 'crab1' }, { key: 'crab2' }], frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'ninja_run', frames: [{ key: 'ninja1' }, { key: 'ninja2' }], frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'crab_boss_walk', frames: [{ key: 'crab_boss1' }, { key: 'crab_boss2' }], frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'dragon_fly', frames: [{ key: 'dragon1' }, { key: 'dragon2' }], frameRate: 4, repeat: -1 });
    this.anims.create({
      key: 'portal_spin',
      frames: [{ key: 'portal1' }, { key: 'portal2' }, { key: 'portal3' }, { key: 'portal4' }],
      frameRate: 8,
      repeat: -1,
    });
    ensurePlayerTextures(this, 'classic', null);
  }
}

function drawPixelTexture(textures, key, rows, palette = PAL) {
  const w = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  const tex = textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = palette[row[x]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  tex.refresh();
}

// Player textures for a skin + armor combination, made the first time they
// are needed. Returns the key prefix: prefix + '_idle', '_run' (anim), etc.
// Armor recolours the tunic and turns the top of the hair into a helmet.
const PLAYER_FRAMES = ['idle', 'run1', 'run2', 'jump', 'attack', 'crouch', 'dash'];

function ensurePlayerTextures(scene, skinKey, armorKey) {
  const skin = SKINS[skinKey] ? skinKey : 'classic';
  const armor = ARMORS[armorKey] ? armorKey : null;
  const prefix = `pl_${skin}_${armor || 'none'}`;
  if (scene.textures.exists(prefix + '_idle')) return prefix;

  const pal = Object.assign({}, PAL, SKINS[skin].colors);
  if (armor) {
    pal.A = ARMORS[armor].colors[0];
    pal.B = ARMORS[armor].colors[0];
    pal.b = ARMORS[armor].colors[1];
  }
  PLAYER_FRAMES.forEach(f => {
    let rows = SPRITES['player_' + f] || EXTRA_SPRITES['player_' + f];
    if (armor) {
      // The first two rows with hair become the helmet.
      let left = 2;
      rows = rows.map(r => (left > 0 && r.includes('H') && left--) ? r.replace(/H/g, 'A') : r);
    }
    drawPixelTexture(scene.textures, prefix + '_' + f, rows, pal);
  });
  scene.anims.create({ key: prefix + '_run', frames: [{ key: prefix + '_run1' }, { key: prefix + '_run2' }], frameRate: 10, repeat: -1 });
  return prefix;
}

// Shared helper for crisp pixel text (font is uppercase only).
function pixelText(scene, x, y, str, opts = {}) {
  const t = scene.add.bitmapText(x, y, 'pixel', String(str).toUpperCase());
  if (opts.scale) t.setScale(opts.scale);
  if (opts.tint !== undefined) t.setTint(opts.tint);
  if (opts.origin !== undefined) t.setOrigin(...[].concat(opts.origin));
  if (opts.align === 'center') t.setCenterAlign();
  return t;
}
