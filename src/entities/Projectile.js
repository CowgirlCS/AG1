// Shared projectile used by player weapons, enemies and bosses.
// opts: { group, texture, dir, speed, vx, vy, gravity, spin, rotate, pierce,
//         hitsLow, damage, knockback, lifetime, trail }
//   vx, vy  - starting velocity (default: speed * dir sideways)
//   gravity - downward acceleration for arcing shots (throwing axe, boulders)
//   spin    - degrees per second (throwing axe, shuriken)
//   rotate  - point the sprite along its velocity (arrows, shards)
//   pierce  - flies through enemies, hitting each one once
//   hitsLow - still hits a crouching player (falling rocks, ground tremors)
//   trail   - particle trail: true / 'fire', 'crystal' or 'shadow'
class Projectile extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, opts) {
    super(scene, x, y, opts.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    opts.group.add(this);

    this.damage = opts.damage;
    this.knockback = opts.knockback || 40;
    this.dir = opts.dir;
    this.trail = opts.trail === true ? 'fire' : (opts.trail || null);
    this.spin = opts.spin || 0;
    this.rotateToVelocity = !!opts.rotate;
    this.pierce = !!opts.pierce;
    this.hitsLow = !!opts.hitsLow;
    this.hits = new Set();
    this.dieAt = scene.time.now + opts.lifetime;

    this.setDepth(8);
    if (!this.rotateToVelocity) this.setFlipX(opts.dir < 0);
    this.body.setAllowGravity(false);
    this.body.setSize(Math.max(4, this.width - 2), Math.max(3, this.height - 2));
    this.body.setVelocity(opts.vx !== undefined ? opts.vx : opts.speed * opts.dir, opts.vy || 0);
    if (opts.gravity) this.body.setAccelerationY(opts.gravity);
    if (this.rotateToVelocity) this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);

    if (this.trail === 'fire') {
      scene.tweens.add({ targets: this, scale: { from: 0.8, to: 1.15 }, duration: 80, yoyo: true, repeat: -1 });
    }
  }

  update(time, delta) {
    if (!this.active) return;
    if (time > this.dieAt) {
      this.destroy();
      return;
    }
    if (this.spin) this.angle += this.spin * delta / 1000;
    if (this.rotateToVelocity) this.rotation = Math.atan2(this.body.velocity.y, this.body.velocity.x);
    if (this.trail) this.scene.fx(this.trail, this.x - this.dir * 3, this.y, 1);
  }

  // Hit a wall or a target.
  impact() {
    if (!this.active) return;
    this.scene.fx(this.trail || 'spark', this.x, this.y, this.trail ? 8 : 4);
    Sfx.play('impact');
    this.destroy();
  }
}

// Thrown by the Bombs weapon. Bounces along, then explodes when the fuse runs
// out or as soon as it touches an enemy.
class Bomb extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, dir, weapon, damage) {
    super(scene, x, y, 'bomb');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.bombs.add(this);

    this.weapon = weapon;
    this.damage = damage;
    this.explodeAt = scene.time.now + weapon.fuse;
    this.setDepth(8);
    this.body.setSize(7, 7).setOffset(1, 2);
    this.body.setBounce(0.45);
    this.body.setVelocity(dir * weapon.speed, weapon.lift);
  }

  update(time, delta) {
    if (!this.active) return;
    const left = this.explodeAt - time;
    if (left <= 0) {
      this.explode();
      return;
    }
    // Blink faster as the fuse burns down.
    if (Math.floor(time / (left < 400 ? 50 : 130)) % 2) this.setTintFill(0xffffff);
    else this.clearTint();
    this.angle += this.body.velocity.x * delta / 400;
    if (this.body.blocked.down) this.body.velocity.x *= 0.92;
  }

  explode() {
    if (!this.active) return;
    const w = this.weapon;
    this.scene.explode(this.x, this.y, w.radius, this.damage, w.knockback);
    this.destroy();
  }
}
