// Between levels: spend gold on weapons, armor, upgrades and skins.
// Purchases are saved right away. Skins stay unlocked across runs.
const SHOP_TABS = ['WEAPONS', 'ARMOR', 'UPGRADES', 'SKINS'];

class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.state = this.registry.get('state');
    this.profile = Profile.get();
    this.tab = 0;
    this.index = 0;
    this.leaving = false;
    this.rows = [];

    this.add.image(0, 0, 'sky_1').setOrigin(0).setDisplaySize(W, H);
    this.add.tileSprite(0, 0, W, H, 'bg_far_1').setOrigin(0);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.45).setOrigin(0);

    pixelText(this, W / 2, 8, 'SHOP', { scale: 3, origin: [0.5, 0], tint: 0xffcd3a });
    pixelText(this, 8, 10, 'NEXT', { tint: 0x9a9a9a });
    pixelText(this, 8, 21, LEVELS[this.state.level].name, { tint: 0xffffff });
    this.add.image(W - 8, 14, 'coin1').setOrigin(1, 0.5);
    this.goldText = pixelText(this, W - 20, 10, '', { origin: [1, 0], tint: 0xffe080 });

    this.tabTexts = SHOP_TABS.map((t, i) => pixelText(this, 60 + i * 120, 40, t, { origin: [0.5, 0] }));

    this.add.rectangle(10, 52, 318, 182, 0x10101c, 0.85).setOrigin(0).setStrokeStyle(1, 0x4a4a6a);
    this.add.rectangle(334, 52, 136, 182, 0x10101c, 0.85).setOrigin(0).setStrokeStyle(1, 0x4a4a6a);
    this.highlight = this.add.rectangle(12, 0, 314, 18, 0x2a2a4a).setOrigin(0, 0.5);
    this.cursor = pixelText(this, 16, 0, '>', { origin: [0, 0.5], tint: 0xffcd3a });

    this.preview = this.add.image(402, 104, 'player_idle').setScale(4);
    this.statsText = pixelText(this, 344, 150, '', { tint: 0xcccccc });
    this.descText = pixelText(this, 14, 240, '', { tint: 0xcccccc }).setMaxWidth(W - 28);
    this.flashText = pixelText(this, 402, 222, '', { origin: 0.5, tint: 0xff6060 });
    pixelText(this, W / 2, 263, 'LEFT/RIGHT TAB  UP/DOWN CHOOSE  ENTER BUY  ESC NEXT LEVEL', { origin: 0.5, tint: 0x8a8a9a });

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.switchTab(-1));
    kb.on('keydown-RIGHT', () => this.switchTab(1));
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-ENTER', () => this.buy());
    kb.on('keydown-SPACE', () => this.buy());
    kb.on('keydown-ESC', () => this.leave());

    this.refresh();
    Shaders.apply(this);
    this.cameras.main.fadeIn(300);
  }

  // Items in the current tab: { icon, name, desc, price, status, tint, buy?, equip? }
  items() {
    const s = this.state;
    const p = this.profile;
    const owned = 0x80ff80, equipped = 0x80e0ff;
    const priced = price => ({ price, status: price + ' G', tint: s.gold >= price ? 0xffe080 : 0xff6060 });

    if (this.tab === 0) {
      return WEAPON_ORDER.filter(w => w !== 'dagger').map(w => {
        const def = WEAPONS[w];
        const base = { icon: 'w_' + w, name: def.name, desc: def.desc };
        if (s.weapon === w) return Object.assign(base, { status: 'EQUIPPED', tint: equipped });
        if (s.owned.includes(w)) return Object.assign(base, { status: 'EQUIP', tint: owned, equip: () => { s.weapon = w; } });
        return Object.assign(base, priced(def.price), {
          buy: () => {
            s.owned.push(w);
            s.weapon = w;
            if (def.upgrade.maxHp) s.maxHp += def.upgrade.maxHp;
          },
        });
      });
    }
    if (this.tab === 1) {
      const cur = ARMOR_ORDER.indexOf(s.armor);
      return ARMOR_ORDER.map((a, i) => {
        const def = ARMORS[a];
        const base = { icon: 'armor_' + a, name: def.name, desc: `${def.points} shield hearts that soak up hits. Refill every level.` };
        if (i === cur) return Object.assign(base, { status: 'WEARING', tint: equipped });
        if (i < cur) return Object.assign(base, { status: '-', tint: 0x6a6a6a, disabled: 'YOU HAVE BETTER ARMOR' });
        return Object.assign(base, priced(def.price), { buy: () => { s.armor = a; } });
      });
    }
    if (this.tab === 2) {
      return UPGRADE_ORDER.map(k => {
        const def = UPGRADES[k];
        const n = s.upgrades[k];
        const base = { icon: def.icon, name: def.name + (def.max > 1 ? ` (${n}/${def.max})` : ''), desc: def.desc };
        if (n >= def.max) return Object.assign(base, { status: 'MAX', tint: owned });
        return Object.assign(base, priced(def.base + def.step * n), {
          buy: () => {
            s.upgrades[k]++;
            if (k === 'maxHp') s.maxHp++;
          },
        });
      });
    }
    return SKIN_ORDER.map(k => {
      const def = SKINS[k];
      const base = { icon: ensurePlayerTextures(this, k, null) + '_idle', name: def.name, desc: 'A new look. Skins stay unlocked for every run.' };
      if (p.skin === k) return Object.assign(base, { status: 'WEARING', tint: equipped });
      if (p.skins.includes(k)) return Object.assign(base, { status: 'WEAR', tint: owned, equip: () => { p.skin = k; } });
      return Object.assign(base, priced(def.price), {
        buy: () => {
          p.skins.push(k);
          p.skin = k;
        },
      });
    });
  }

  refresh() {
    const s = this.state;
    this.list = this.items();
    this.index = Phaser.Math.Clamp(this.index, 0, this.list.length - 1);
    this.rows.forEach(o => o.destroy());
    this.rows = [];
    this.list.forEach((item, i) => {
      const y = 64 + i * 20;
      const icon = this.add.image(36, y, item.icon);
      icon.setScale(Math.min(1, 14 / Math.max(icon.width, icon.height)) * (icon.height <= 10 ? 1.4 : 1));
      this.rows.push(
        icon,
        pixelText(this, 50, y, item.name, { origin: [0, 0.5], tint: i === this.index ? 0xffffff : 0xb0b0b0 }),
        pixelText(this, 320, y, item.status, { origin: [1, 0.5], tint: item.tint }),
      );
    });
    const y = 64 + this.index * 20;
    this.highlight.setY(y);
    this.cursor.setY(y);
    this.tabTexts.forEach((t, i) => t.setTint(i === this.tab ? 0xffcd3a : 0x7a7a8a).setScale(i === this.tab ? 1.2 : 1));
    this.goldText.setText(String(s.gold));
    this.descText.setText(this.list[this.index].desc.toUpperCase());

    this.preview.setTexture(ensurePlayerTextures(this, this.profile.skin, s.armor) + '_idle');
    const b = GameState.bonuses(s);
    this.statsText.setText([
      'MAX HP  ' + s.maxHp,
      'ARMOR   ' + GameState.armorPoints(s),
      'POWER   +' + b.power,
      'JUMPS   ' + GameState.maxJumps(s),
      'RUNES   ' + s.runes.length + '/3',
    ].join('\n'));
  }

  switchTab(d) {
    this.tab = (this.tab + d + SHOP_TABS.length) % SHOP_TABS.length;
    this.index = 0;
    Sfx.play('select');
    this.refresh();
  }

  move(d) {
    this.index = (this.index + d + this.list.length) % this.list.length;
    Sfx.play('select');
    this.refresh();
  }

  flash(text, tint = 0xff6060) {
    this.flashText.setText(text).setTint(tint).setAlpha(1);
    this.tweens.killTweensOf(this.flashText);
    this.tweens.add({ targets: this.flashText, alpha: 0, delay: 900, duration: 300 });
  }

  buy() {
    if (this.leaving) return;
    const item = this.list[this.index];
    const s = this.state;
    if (item.disabled) {
      Sfx.play('error');
      this.flash(item.disabled);
    } else if (item.buy) {
      if (s.gold < item.price) {
        Sfx.play('error');
        this.flash('NOT ENOUGH GOLD');
        return;
      }
      s.gold -= item.price;
      item.buy();
      Sfx.play('buy');
      this.flash('BOUGHT!', 0x80ff80);
    } else if (item.equip) {
      item.equip();
      Sfx.play('confirm');
    } else {
      return;
    }
    SaveManager.save(s);
    Profile.save();
    this.refresh();
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    Sfx.play('confirm');
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
  }
}
