// Shared projectile used by the Bow, the Fire Wand and Skeleton Archers.
// opts: { group, texture, dir, speed, damage, knockback, lifetime, trail }
class Projectile extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, opts) {
    super(scene, x, y, opts.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    opts.group.add(this);

    this.damage = opts.damage;
    this.knockback = opts.knockback || 40;
    this.dir = opts.dir;
    this.trail = !!opts.trail;
    this.dieAt = scene.time.now + opts.lifetime;

    this.setDepth(8);
    this.setFlipX(opts.dir < 0);
    this.body.setAllowGravity(false);
    this.body.setSize(Math.max(4, this.width - 2), Math.max(3, this.height - 2));
    this.body.setVelocityX(opts.speed * opts.dir);

    if (this.trail) {
      scene.tweens.add({ targets: this, scale: { from: 0.8, to: 1.15 }, duration: 80, yoyo: true, repeat: -1 });
    }
  }

  update(time) {
    if (!this.active) return;
    if (time > this.dieAt) {
      this.destroy();
      return;
    }
    if (this.trail) this.scene.fx('fire', this.x - this.dir * 3, this.y, 1);
  }

  // Hit a wall or a target.
  impact() {
    if (!this.active) return;
    this.scene.fx(this.trail ? 'fire' : 'spark', this.x, this.y, this.trail ? 8 : 4);
    Sfx.play('impact');
    this.destroy();
  }
}
