class PauseScene extends Phaser.Scene {
  constructor() { super('PauseScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0);
    pixelText(this, W / 2, H / 2 - 24, 'PAUSED', { scale: 3, origin: 0.5, tint: 0xffe080 });
    pixelText(this, W / 2, H / 2 + 8, 'ESC - RESUME', { origin: 0.5 });
    pixelText(this, W / 2, H / 2 + 22, 'Q - QUIT TO MENU', { origin: 0.5, tint: 0xaaaaaa });

    this.input.keyboard.once('keydown-ESC', () => {
      Sfx.play('pause');
      this.scene.resume('GameScene');
      this.scene.stop();
    });
    this.input.keyboard.once('keydown-Q', () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }
}
