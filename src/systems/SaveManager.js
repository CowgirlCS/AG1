// Run state helpers and localStorage persistence.

const GameState = {
  BASE_MAX_HP: 5,

  fresh() {
    return {
      level: 0,
      maxHp: this.BASE_MAX_HP,
      hp: this.BASE_MAX_HP,
      weapon: 'dagger',
      owned: ['dagger'],
      score: 0,
      gold: 0,
      armor: null,          // key in ARMORS
      armorHp: 0,           // shield hearts left (refilled every level)
      upgrades: { maxHp: 0, power: 0, speed: 0, haste: 0, dash: 0, jumps: 0 },
      runes: [],
      bonusDone: false,     // the bonus level can be played once per run
      inBonus: false,
    };
  },

  clone(state) {
    return JSON.parse(JSON.stringify(state));
  },

  // Permanent bonuses from every weapon the player has ever obtained plus shop
  // upgrades. (Max HP bonuses are added to state.maxHp directly.)
  bonuses(state) {
    const b = { power: 0, speed: 0, haste: 0 };
    state.owned.forEach(key => {
      const u = WEAPONS[key].upgrade;
      b.power += u.power || 0;
      b.speed += u.speed || 0;
      b.haste += u.haste || 0;
    });
    const up = state.upgrades;
    b.power += up.power;
    b.speed += up.speed * 10;
    b.haste += up.haste * 0.1;
    b.haste = Math.min(b.haste, 0.5);
    return b;
  },

  maxJumps(state) { return 2 + state.upgrades.jumps; },

  dashCooldown(state) { return PLAYER_CFG.dashCooldown - 200 * state.upgrades.dash; },

  armorPoints(state) { return state.armor ? ARMORS[state.armor].points : 0; },
};

const SaveManager = {
  KEY: 'ag1-save-v2',
  OLD_KEY: 'ag1-save-v1',
  BEST_KEY: 'ag1-best-v1',

  has() {
    return this.load() !== null;
  },

  save(state) {
    const data = {
      level: state.level,
      maxHp: state.maxHp,
      weapon: state.weapon,
      owned: state.owned.slice(),
      score: state.score,
      gold: state.gold,
      armor: state.armor,
      upgrades: Object.assign({}, state.upgrades),
      runes: state.runes.slice(),
      bonusDone: state.bonusDone,
    };
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Could not save progress', e);
      return false;
    }
  },

  // Returns a full run state, or null if there is no valid save.
  // Saves from before the upgrade (v1) still load.
  load() {
    try {
      const raw = localStorage.getItem(this.KEY) || localStorage.getItem(this.OLD_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (typeof d.level !== 'number' || d.level < 0 || d.level >= LEVELS.length) return null;
      const s = GameState.fresh();
      const owned = (Array.isArray(d.owned) ? d.owned : []).filter(k => WEAPONS[k]);
      if (!owned.includes('dagger')) owned.unshift('dagger');
      const weapon = WEAPONS[d.weapon] ? d.weapon : 'dagger';
      if (!owned.includes(weapon)) owned.push(weapon);
      UPGRADE_ORDER.forEach(k => {
        const n = d.upgrades ? d.upgrades[k] | 0 : 0;
        s.upgrades[k] = Phaser.Math.Clamp(n, 0, UPGRADES[k].max);
      });
      s.level = d.level;
      s.maxHp = s.hp = Math.max(1, d.maxHp | 0);
      s.weapon = weapon;
      s.owned = owned;
      s.score = Math.max(0, d.score | 0);
      s.gold = Math.max(0, d.gold | 0);
      s.armor = ARMORS[d.armor] ? d.armor : null;
      s.runes = (Array.isArray(d.runes) ? d.runes : []).filter(r => RUNES[r]);
      s.bonusDone = !!d.bonusDone;
      return s;
    } catch (e) {
      return null;
    }
  },

  clear() {
    try {
      localStorage.removeItem(this.KEY);
      localStorage.removeItem(this.OLD_KEY);
    } catch (e) { /* ignore */ }
  },

  getBest() {
    let best = 0;
    try { best = parseInt(localStorage.getItem(this.BEST_KEY), 10) || 0; } catch (e) { /* ignore */ }
    const top = Leaderboard.list()[0];
    return Math.max(best, top ? top.score : 0);
  },

  setBest(score) {
    if (score <= this.getBest()) return;
    try { localStorage.setItem(this.BEST_KEY, String(score)); } catch (e) { /* ignore */ }
  },
};

// Settings and unlocks that last across runs: skins and the shader toggle.
const Profile = {
  KEY: 'ag1-profile-v1',
  data: null,

  get() {
    if (this.data) return this.data;
    let d = {};
    try { d = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { /* ignore */ }
    const skins = (Array.isArray(d.skins) ? d.skins : []).filter(k => SKINS[k]);
    if (!skins.includes('classic')) skins.unshift('classic');
    this.data = {
      skins,
      skin: skins.includes(d.skin) ? d.skin : 'classic',
      shaders: d.shaders !== false,
    };
    return this.data;
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.get())); } catch (e) { /* ignore */ }
  },
};

// Top 10 scores on this computer. Entries: { name, score, result, date }.
const Leaderboard = {
  KEY: 'ag1-leaderboard-v1',
  SIZE: 10,

  list() {
    try {
      const d = JSON.parse(localStorage.getItem(this.KEY));
      if (!Array.isArray(d)) return [];
      return d.filter(e => e && typeof e.name === 'string' && typeof e.score === 'number')
        .sort((a, b) => b.score - a.score)
        .slice(0, this.SIZE);
    } catch (e) {
      return [];
    }
  },

  qualifies(score) {
    if (score <= 0) return false;
    const l = this.list();
    return l.length < this.SIZE || score > l[l.length - 1].score;
  },

  // Returns the new entry's rank (0 = first), or -1 if it didn't make the list.
  add(name, score, result) {
    const entry = { name: name.slice(0, 3), score, result, date: Date.now() };
    const l = this.list();
    l.push(entry);
    l.sort((a, b) => b.score - a.score);
    const top = l.slice(0, this.SIZE);
    try { localStorage.setItem(this.KEY, JSON.stringify(top)); } catch (e) { /* ignore */ }
    return top.indexOf(entry);
  },
};
