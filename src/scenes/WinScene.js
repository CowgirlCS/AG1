class WinScene extends Phaser.Scene {
  constructor() { super('WinScene'); }

  create(data) {
    const W = this.scale.width, H = this.scale.height;
    const score = data.score || 0;
    this.add.image(0, 0, 'sky_2').setOrigin(0).setDisplaySize(W, H);
    this.add.image(400, 40, 'moon');
    this.add.tileSprite(0, 0, W, H, 'bg_far_2').setOrigin(0);

    // Coins raining down.
    for (let i = 0; i < 40; i++) {
      const c = this.add.sprite(Phaser.Math.Between(0, W), Phaser.Math.Between(-H, 0), 'coin1').play('coin_spin');
      this.tweens.add({ targets: c, y: H + 20, duration: Phaser.Math.Between(2500, 5000), repeat: -1, delay: Phaser.Math.Between(0, 2000) });
    }

    this.add.image(W / 2, 170, 'chest_open').setScale(4);
    const title = pixelText(this, W / 2, 50, 'YOU WIN!', { scale: 5, origin: 0.5, tint: 0xffcd3a });
    this.tweens.add({ targets: title, scale: 5.4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    pixelText(this, W / 2, 90, 'THE TREASURE IS YOURS', { origin: 0.5 });
    pixelText(this, W / 2, 110, 'FINAL SCORE ' + score, { scale: 2, origin: 0.5 });
    pixelText(this, W / 2, 128, 'BEST ' + SaveManager.getBest(), { origin: 0.5, tint: 0xffcd3a });
    pixelText(this, W / 2, 250, 'PRESS ENTER', { origin: 0.5 });

    this.cameras.main.fadeIn(500);
    this.time.delayedCall(800, () => {
      this.input.keyboard.once('keydown-ENTER', () => this.scene.start('MenuScene'));
    });
  }
}
