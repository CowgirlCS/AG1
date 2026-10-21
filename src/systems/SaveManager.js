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
    };
  },

  clone(state) {
    return JSON.parse(JSON.stringify(state));
  },

  // Permanent bonuses from every weapon the player has ever picked up.
  // (Max HP bonuses are added to state.maxHp directly when picked up.)
  bonuses(state) {
    const b = { power: 0, speed: 0, haste: 0 };
    state.owned.forEach(key => {
      const u = WEAPONS[key].upgrade;
      b.power += u.power || 0;
      b.speed += u.speed || 0;
      b.haste += u.haste || 0;
    });
    b.haste = Math.min(b.haste, 0.5);
    return b;
  },
};

const SaveManager = {
  KEY: 'ag1-save-v1',
  BEST_KEY: 'ag1-best-v1',

  has() {
    return this.load() !== null;
  },

  // Saved fields: current level, max HP, equipped weapon, owned weapons, score.
  save(state) {
    const data = {
      level: state.level,
      maxHp: state.maxHp,
      weapon: state.weapon,
      owned: state.owned.slice(),
      score: state.score,
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
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (typeof d.level !== 'number' || d.level < 0 || d.level >= LEVELS.length) return null;
      const owned = (Array.isArray(d.owned) ? d.owned : []).filter(k => WEAPONS[k]);
      if (!owned.includes('dagger')) owned.unshift('dagger');
      const weapon = WEAPONS[d.weapon] ? d.weapon : 'dagger';
      if (!owned.includes(weapon)) owned.push(weapon);
      const maxHp = Math.max(1, d.maxHp | 0);
      return { level: d.level, maxHp, hp: maxHp, weapon, owned, score: Math.max(0, d.score | 0) };
    } catch (e) {
      return null;
    }
  },

  clear() {
    try { localStorage.removeItem(this.KEY); } catch (e) { /* ignore */ }
  },

  getBest() {
    try { return parseInt(localStorage.getItem(this.BEST_KEY), 10) || 0; } catch (e) { return 0; }
  },

  setBest(score) {
    if (score <= this.getBest()) return;
    try { localStorage.setItem(this.BEST_KEY, String(score)); } catch (e) { /* ignore */ }
  },
};
