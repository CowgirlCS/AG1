// HUD overlay: hearts and armor top-left, score/gold/level top-right, weapon
// bar bottom-left, rune powers bottom-right, boss health or bonus timer top-center.
class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.hearts = [];
    this.shields = [];
    this.slots = [];
    this.last = {};

    this.scoreText = pixelText(this, W - 6, 6, '', { origin: [1, 0], tint: 0xffcd3a });
    this.goldText = pixelText(this, W - 6, 17, '', { origin: [1, 0], tint: 0xffe080 });
    this.goldIcon = this.add.image(0, 20, 'coin1');
    this.levelText = pixelText(this, W - 6, 28, '', { origin: [1, 0] });

    this.weaponText = pixelText(this, 4, H - 43, '');

    // Rune powers: one slot per rune, right to left.
    this.powers = RUNE_ORDER.map((r, i) => {
      const x = W - 12 - (RUNE_ORDER.length - 1 - i) * 20;
      return {
        rune: r,
        frame: this.add.rectangle(x, H - 12, 18, 18, 0x000000, 0.5).setStrokeStyle(1, RUNES[r].color),
        icon: this.add.image(x, H - 12, 'rune_' + r),
        key: pixelText(this, x, H - 31, RUNES[r].key, { origin: [0.5, 0], tint: RUNES[r].color }),
        cd: pixelText(this, x, H - 15, '', { origin: [0.5, 0] }),
      };
    });

    this.bossName = pixelText(this, W / 2, 4, '', { origin: [0.5, 0], tint: 0xff9090 });
    this.bossBarBg = this.add.rectangle(W / 2, 17, 164, 7, 0x000000).setStrokeStyle(1, 0x5a2a2a);
    this.bossBar = this.add.rectangle(W / 2 - 81, 17, 162, 5, 0xe43b44).setOrigin(0, 0.5);
    this.timerText = pixelText(this, W / 2, 4, '', { origin: [0.5, 0], scale: 2, tint: 0xffe080 });
  }

  update() {
    const s = this.registry.get('state');
    if (!s) return;
    const gs = this.scene.get('GameScene');
    const time = gs.time.now;
    const last = this.last;
    const armorMax = GameState.armorPoints(s);

    if (s.hp !== last.hp || s.maxHp !== last.maxHp || s.armorHp !== last.armorHp || armorMax !== last.armorMax) {
      this.drawHearts(s.hp, s.maxHp, s.armorHp, armorMax);
    }
    if (s.score !== last.score) this.scoreText.setText('SCORE ' + String(s.score).padStart(6, '0'));
    if (s.gold !== last.gold) {
      this.goldText.setText(String(s.gold));
      this.goldIcon.setX(this.scale.width - 12 - this.goldText.width);
    }
    const levelLabel = s.inBonus ? 'BONUS LEVEL' : 'LEVEL ' + (s.level + 1) + '/' + LEVELS.length;
    if (levelLabel !== last.levelLabel) this.levelText.setText(levelLabel);
    const weaponsKey = s.owned.join() + '|' + s.weapon;
    if (weaponsKey !== last.weaponsKey) this.drawWeapons(s);

    // Rune powers: hidden until found, dimmed with a countdown while recharging.
    this.powers.forEach(p => {
      const owned = s.runes.includes(p.rune);
      [p.frame, p.icon, p.key, p.cd].forEach(o => o.setVisible(owned));
      if (!owned) return;
      const left = (gs.powerReady && gs.powerReady[p.rune]) - time;
      const ready = !(left > 0);
      p.icon.setAlpha(ready ? 1 : 0.3);
      p.cd.setText(ready ? '' : String(Math.ceil(left / 1000)));
    });

    // Boss health bar.
    const boss = this.registry.get('boss');
    [this.bossName, this.bossBarBg, this.bossBar].forEach(o => o.setVisible(!!boss));
    if (boss) {
      this.bossName.setText(boss.name);
      this.bossBar.width = 162 * boss.hp / boss.max;
    }

    // Bonus level countdown.
    const showTimer = s.inBonus && gs.bonusEndsAt > 0;
    this.timerText.setVisible(showTimer);
    if (showTimer) {
      const secs = Math.max(0, Math.ceil((gs.bonusEndsAt - time) / 1000));
      this.timerText.setText(String(secs)).setTint(secs <= 10 ? 0xff6060 : 0xffe080);
    }

    Object.assign(last, {
      hp: s.hp, maxHp: s.maxHp, armorHp: s.armorHp, armorMax, score: s.score, gold: s.gold, levelLabel, weaponsKey,
    });
  }

  drawHearts(hp, maxHp, armorHp, armorMax) {
    const perRow = 12;
    while (this.hearts.length < maxHp) this.hearts.push(this.add.image(0, 0, 'heart_empty').setOrigin(0));
    this.hearts.forEach((img, i) => {
      img.setVisible(i < maxHp);
      img.setPosition(6 + (i % perRow) * 9, 6 + Math.floor(i / perRow) * 8);
      img.setTexture(i < hp ? 'heart_full' : 'heart_empty');
    });
    // Armor shields go on the row under the hearts.
    const shieldY = 6 + Math.ceil(maxHp / perRow) * 8;
    while (this.shields.length < armorMax) this.shields.push(this.add.image(0, 0, 'shield_empty').setOrigin(0));
    this.shields.forEach((img, i) => {
      img.setVisible(i < armorMax);
      img.setPosition(6 + i * 9, shieldY);
      img.setTexture(i < armorHp ? 'shield_full' : 'shield_empty');
    });
    // Flash red when HP drops.
    if (this.last.hp !== undefined && hp < this.last.hp) {
      this.cameras.main.flash(120, 120, 0, 0);
    }
  }

  // One slot per owned weapon, in bar order, with its hotkey above it.
  drawWeapons(s) {
    const H = this.scale.height;
    this.slots.forEach(o => o.destroy());
    this.slots = [];
    const letters = {};
    Object.entries(WEAPON_HOTKEYS).forEach(([k, w]) => { letters[w] = k; });
    WEAPON_ORDER.filter(w => s.owned.includes(w)).forEach((w, i) => {
      const x = 12 + i * 20;
      const current = w === s.weapon;
      this.slots.push(
        this.add.rectangle(x, H - 12, 18, 18, current ? 0x3a3020 : 0x000000, 0.6).setStrokeStyle(1, current ? 0xffcd3a : 0x5a5a6a),
        this.add.image(x, H - 12, 'w_' + w).setAlpha(current ? 1 : 0.6),
        pixelText(this, x, H - 31, letters[w] || String(WEAPON_ORDER.indexOf(w) + 1), {
          origin: [0.5, 0], tint: current ? 0xffcd3a : 0x9a9a9a,
        }),
      );
    });
    this.weaponText.setText(WEAPONS[s.weapon].name.toUpperCase());
  }
}
