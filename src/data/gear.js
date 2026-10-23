// Armor, skins, shop upgrades and runes.

// Armor gives blue shield hearts that soak up damage before your real hearts.
// They refill at the start of every level and when you respawn.
// colors: [main, shade] used for the helmet and chest of the player sprite.
const ARMORS = {
  leather: { name: 'Leather Armor', points: 2, price: 30, colors: ['#9a6a3b', '#6a4424'] },
  gold:    { name: 'Gold Armor',    points: 3, price: 55, colors: ['#ffcd3a', '#c28a1e'] },
  iron:    { name: 'Iron Armor',    points: 5, price: 90, colors: ['#c8ced8', '#7d8794'] },
  diamond: { name: 'Diamond Armor', points: 8, price: 150, colors: ['#7ff0ea', '#2aa8b8'] },
};
const ARMOR_ORDER = ['leather', 'gold', 'iron', 'diamond'];

// Skins are cosmetic and stay unlocked across runs.
// colors override the player palette: H hair, S skin, B tunic, b tunic shade, L trousers.
const SKINS = {
  classic: { name: 'Classic', price: 0, colors: {} },
  ranger:  { name: 'Ranger',  price: 25, colors: { H: '#e8c050', B: '#3d9a45', b: '#246a2e' } },
  royal:   { name: 'Royal',   price: 40, colors: { H: '#2a1a10', B: '#7b4fb8', b: '#4a2a7a', L: '#2a2a3a' } },
  frost:   { name: 'Frost',   price: 50, colors: { H: '#f4f4f4', B: '#4dd2ff', b: '#2a7fb0', L: '#3a4a6a' } },
  crimson: { name: 'Crimson', price: 60, colors: { H: '#1a1c2c', B: '#e43b44', b: '#9e2835', L: '#3a2020' } },
  shadow:  { name: 'Shadow',  price: 75, colors: { H: '#e8e8f0', S: '#d8a878', B: '#2a2a38', b: '#15151f', L: '#15151f' } },
  midas:   { name: 'Midas',   price: 120, colors: { H: '#ffe080', S: '#ffd27a', B: '#ffcd3a', b: '#c28a1e', L: '#c28a1e' } },
};
const SKIN_ORDER = Object.keys(SKINS);

// Shop upgrades. price = base + step * (times already bought).
const UPGRADES = {
  maxHp: { name: '+1 Max HP',     desc: 'One more heart, for good.',            icon: 'heart_full', base: 15, step: 10, max: 10 },
  power: { name: '+1 Power',      desc: 'Every weapon does 1 more damage.',     icon: 'icon_power', base: 40, step: 30, max: 3 },
  speed: { name: 'Swift Boots',   desc: 'Run a little faster.',                 icon: 'icon_speed', base: 20, step: 15, max: 3 },
  haste: { name: 'Quick Hands',   desc: 'Attack 10% faster.',                   icon: 'icon_haste', base: 30, step: 20, max: 3 },
  dash:  { name: 'Dash Recharge', desc: 'Dash recharges 0.2 seconds faster.',   icon: 'icon_dash',  base: 20, step: 20, max: 2 },
  jumps: { name: 'Triple Jump',   desc: 'Jump a third time in mid-air.',        icon: 'icon_jump',  base: 80, step: 0,  max: 1 },
};
const UPGRADE_ORDER = Object.keys(UPGRADES);

// One rune is hidden in a secret passage in each of the first three levels.
// A rune gives a superpower and opens rune vaults and the bonus portal.
const RUNES = {
  earth: {
    name: 'EARTH RUNE', power: 'STONE SKIN', key: 'Q', color: 0x4fc24a, glyph: '#4fc24a',
    cooldown: 20000, duration: 4000,
    desc: 'Nothing can hurt you for 4 seconds, and enemies you touch take damage.',
  },
  crystal: {
    name: 'CRYSTAL RUNE', power: 'CRYSTAL STORM', key: 'W', color: 0x4dd2ff, glyph: '#4dd2ff',
    cooldown: 10000, shards: 12, damage: 3,
    desc: 'A ring of crystal shards bursts out in every direction.',
  },
  shadow: {
    name: 'SHADOW RUNE', power: 'VOID BLAST', key: 'E', color: 0xb44cff, glyph: '#b44cff',
    cooldown: 25000, damage: 6,
    desc: 'Damages every enemy on screen and wipes out their shots.',
  },
};
const RUNE_ORDER = ['earth', 'crystal', 'shadow'];
