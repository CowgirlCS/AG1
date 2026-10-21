class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.chosen = false;

    // Backdrop: meadow scenery with a strip of ground.
    this.add.image(0, 0, 'sky_0').setOrigin(0).setDisplaySize(W, H);
    this.far = this.add.tileSprite(0, 0, W, H, 'bg_far_0').setOrigin(0);
    this.near = this.add.tileSprite(0, 0, W, H, 'bg_near_0').setOrigin(0);
    this.add.tileSprite(0, 224, W, 16, 'tiles', 0).setOrigin(0);
    this.add.tileSprite(0, 240, W, 32, 'tiles', 1).setOrigin(0);

    this.add.sprite(70, 216, 'player_idle').play('player_run');
    this.add.sprite(400, 220, 'slime1').play('slime_move');
    const bat = this.add.sprite(330, 120, 'bat1').play('bat_fly');
    this.tweens.add({ targets: bat, y: 104, x: 350, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.image(440, 217, 'chest_closed');

    const title = pixelText(this, W / 2, 50, 'AG1', { scale: 6, origin: 0.5, tint: 0xffcd3a });
    this.tweens.add({ targets: title, y: 46, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    pixelText(this, W / 2, 84, 'A PIXEL TREASURE QUEST', { origin: 0.5 });

    // Menu: Continue only when a save exists, New Game always.
    this.save = SaveManager.load();
    this.options = [];
    if (this.save) this.options.push({ label: 'CONTINUE', sub: `LEVEL ${this.save.level + 1}  SCORE ${this.save.score}`, action: () => this.startGame(this.save) });
    this.options.push({ label: 'NEW GAME', action: () => this.startGame(GameState.fresh()) });

    this.optionTexts = this.options.map((o, i) => pixelText(this, W / 2, 112 + i * 16, o.label, { scale: 1, origin: 0.5 }));
    this.subText = pixelText(this, W / 2, 112 + this.options.length * 16 + 2, '', { origin: 0.5, tint: 0xaaaaaa });
    this.cursor = pixelText(this, 0, 0, '>', { origin: 0.5, tint: 0xffcd3a });
    this.index = 0;
    this.refresh();

    const best = SaveManager.getBest();
    if (best > 0) pixelText(this, W - 6, 6, 'BEST ' + best, { origin: [1, 0], tint: 0xffcd3a });

    pixelText(this, W / 2, 248, 'ARROWS MOVE  SPACE JUMP  F/J ATTACK  ESC PAUSE', { origin: 0.5 });
    pixelText(this, W / 2, 260, 'UP/DOWN + ENTER TO CHOOSE', { origin: 0.5, tint: 0xcccccc });

    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    ['ENTER', 'SPACE', 'F', 'J'].forEach(k => kb.on('keydown-' + k, () => this.choose()));

    this.cameras.main.fadeIn(300);
  }

  move(d) {
    if (this.options.length < 2) return;
    this.index = (this.index + d + this.options.length) % this.options.length;
    Sfx.play('select');
    this.refresh();
  }

  refresh() {
    this.optionTexts.forEach((t, i) => {
      t.setScale(i === this.index ? 2 : 1);
      t.setTint(i === this.index ? 0xffffff : 0x9a9a9a);
    });
    const sel = this.optionTexts[this.index];
    this.cursor.setPosition(sel.x - sel.displayWidth / 2 - 10, sel.y).setScale(2);
    this.subText.setText(this.options[this.index].sub || '');
  }

  choose() {
    if (this.chosen) return;
    this.chosen = true;
    Sfx.play('confirm');
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.options[this.index].action());
  }

  startGame(state) {
    this.registry.set('state', GameState.clone(state));
    this.scene.start('GameScene');
  }

  update(time) {
    this.far.tilePositionX = time * 0.004;
    this.near.tilePositionX = time * 0.012;
  }
}
