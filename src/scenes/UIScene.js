// HUD overlay: hearts top-left, score and level top-right, weapon bottom-left.
class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.hearts = [];
    this.last = {};

    this.scoreText = pixelText(this, W - 6, 6, '', { origin: [1, 0], tint: 0xffcd3a });
    this.levelText = pixelText(this, W - 6, 17, '', { origin: [1, 0] });

    this.weaponIcon = this.add.image(14, H - 12, 'w_dagger');
    this.weaponText = pixelText(this, 24, H - 16, '');
  }

  update() {
    const s = this.registry.get('state');
    if (!s) return;
    const last = this.last;

    if (s.hp !== last.hp || s.maxHp !== last.maxHp) this.drawHearts(s.hp, s.maxHp);
    if (s.score !== last.score) this.scoreText.setText('SCORE ' + String(s.score).padStart(6, '0'));
    if (s.level !== last.level) this.levelText.setText('LEVEL ' + (s.level + 1) + '/' + LEVELS.length);
    if (s.weapon !== last.weapon) {
      const w = WEAPONS[s.weapon];
      this.weaponIcon.setTexture('w_' + s.weapon);
      this.weaponText.setText(w.name.toUpperCase());
    }
    Object.assign(last, { hp: s.hp, maxHp: s.maxHp, score: s.score, level: s.level, weapon: s.weapon });
  }

  drawHearts(hp, maxHp) {
    const perRow = 12;
    while (this.hearts.length < maxHp) this.hearts.push(this.add.image(0, 0, 'heart_empty').setOrigin(0));
    this.hearts.forEach((img, i) => {
      img.setVisible(i < maxHp);
      img.setPosition(6 + (i % perRow) * 9, 6 + Math.floor(i / perRow) * 8);
      img.setTexture(i < hp ? 'heart_full' : 'heart_empty');
    });
    // Pop the hearts when HP drops.
    if (this.last.hp !== undefined && hp < this.last.hp) {
      this.cameras.main.flash(120, 120, 0, 0);
    }
  }
}
