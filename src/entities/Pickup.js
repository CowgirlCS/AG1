// Weapons and items lying in the level, or dropped by enemies.
// kind: 'coin' | 'gem' | 'potion' | 'heart' | 'weapon' | 'rune'
const PICKUP_TEXTURES = { coin: 'coin1', gem: 'gem', potion: 'potion', heart: 'heart_container' };

class Pickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, kind, opts = {}) {
    const texture = kind === 'weapon' ? 'w_' + opts.weapon
      : kind === 'rune' ? 'rune_' + opts.rune
      : PICKUP_TEXTURES[kind];
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.pickups.add(this);

    this.kind = kind;
    this.weapon = opts.weapon;
    this.rune = opts.rune;
    this.setDepth(4);
    if (kind === 'coin') this.play('coin_spin');
    if (kind === 'rune') Shaders.glow(this, RUNES[opts.rune].color, 4);

    if (opts.dropped) {
      // Pops out of a defeated enemy, falls, and fades away after a while.
      this.body.setAllowGravity(true);
      this.body.setBounce(0.35);
      this.body.setDragX(120);
      this.body.setVelocity(Phaser.Math.Between(-70, 70), Phaser.Math.Between(-200, -140));
      scene.time.delayedCall(7000, () => {
        if (!this.active) return;
        scene.tweens.add({ targets: this, alpha: 0, duration: 120, yoyo: true, repeat: 6, onComplete: () => this.destroy() });
      });
    } else {
      this.body.setAllowGravity(false);
      scene.tweens.add({ targets: this, y: y - 3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }
}
