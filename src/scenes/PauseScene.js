class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0);
    pixelText(this, W / 2, 30, 'PAUSED', { scale: 3, origin: 0.5, tint: 0xffe080 });

    const controls = [
      ['LEFT / RIGHT', 'MOVE'],
      ['UP', 'JUMP (PRESS AGAIN IN THE AIR TO DOUBLE JUMP)'],
      ['DOWN', 'CROUCH (FLYING SHOTS MISS YOU)'],
      ['SPACE OR J', 'ATTACK'],
      ['D', 'DASH (YOU CAN\'T BE HURT WHILE DASHING)'],
      ['S / F / B', 'SWORD / FIRE WAND / BOW'],
      ['A / T / M', 'BATTLE AXE / THROWING AXE / BOMBS'],
      ['1 - 8', 'ANY WEAPON YOU OWN, IN BAR ORDER'],
      ['Q W E', 'RUNE POWERS (EARTH, CRYSTAL, SHADOW)'],
    ];
    controls.forEach(([k, what], i) => {
      pixelText(this, 22, 60 + i * 14, k, { tint: 0xffcd3a });
      pixelText(this, 112, 60 + i * 14, what, { tint: 0xdddddd });
    });

    pixelText(this, W / 2, 196, 'ESC - RESUME', { origin: 0.5 });
    this.shaderText = pixelText(this, W / 2, 210, 'V - ' + Shaders.label(), { origin: 0.5, tint: 0xaaaaaa });
    pixelText(this, W / 2, 224, 'Q - QUIT TO MENU', { origin: 0.5, tint: 0xaaaaaa });
    pixelText(this, W / 2, 240, 'YOUR SAVE IS KEPT. A HIGH SCORE GOES ON THE LEADERBOARD.', { origin: 0.5, tint: 0x7a7a8a });

    this.input.keyboard.once('keydown-ESC', () => {
      Sfx.play('pause');
      this.scene.resume('GameScene');
      this.scene.stop();
    });
    this.input.keyboard.on('keydown-V', () => {
      Shaders.toggle();
      Shaders.apply(this.scene.get('GameScene'));
      this.shaderText.setText('V - ' + Shaders.label());
    });
    this.input.keyboard.once('keydown-Q', () => {
      const s = this.registry.get('state');
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      if (Leaderboard.qualifies(s.score)) {
        this.scene.start('NameEntryScene', { score: s.score, result: s.inBonus ? 'BONUS' : 'LEVEL ' + (s.level + 1), title: 'RUN OVER' });
      } else {
        this.scene.start('MenuScene');
      }
    });
  }
}
