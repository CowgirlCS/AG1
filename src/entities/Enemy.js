// Base enemy plus one subclass per enemy type.
// Enemies ignore the platform death rule: walls only stop them.
class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.enemies.add(this);

    this.type = type;
    this.def = ENEMIES[type];
    this.diff = scene.level.difficulty;
    this.hp = this.def.hp + (this.diff.hpBonus || 0);
    this.stunUntil = 0;
    this.dying = false;
    this.setDepth(5);
  }

  get collidesWithTiles() { return true; }

  hurt(damage, dir, knockback) {
    if (!this.active || this.dying) return;
    this.hp -= damage;
    this.scene.floatText(this.x, this.y - this.height / 2, '-' + damage, 0xffe080);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => { if (this.active) this.clearTint(); });
    this.scene.fx('spark', this.x, this.y, 5);
    if (this.hp <= 0) {
      this.die();
      return;
    }
    Sfx.play('hit');
    this.knock(dir, knockback);
  }

  knock(dir, force) {
    this.stunUntil = this.scene.time.now + 180 + force * 0.6;
    this.body.setVelocity(dir * force, -Math.min(force * 0.5, 170));
  }

  die() {
    this.dying = true;
    Sfx.play('enemyDie');
    this.scene.cameras.main.shake(80, 0.004);
    this.scene.fx(this.type === 'slime' ? 'goo' : this.type === 'bat' ? 'purple' : 'bone', this.x, this.y, 14);
    this.scene.addScore(this.def.score, this.x, this.y - 10);
    this.scene.dropLoot(this);
    this.destroy();
  }

  update(time) {
    if (this.active && this.y > this.scene.worldH + 64) this.destroy();
  }
}

class Slime extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'slime', 'slime1');
    this.body.setSize(12, 8).setOffset(1, 1);
    this.dir = -1;
    this.speed = this.def.speed * this.diff.enemySpeed;
    this.play({ key: 'slime_move', startFrame: Phaser.Math.Between(0, 1) });
  }

  update(time) {
    super.update(time);
    if (!this.active || time < this.stunUntil) return;
    const b = this.body;
    if (b.blocked.left) this.dir = 1;
    else if (b.blocked.right) this.dir = -1;

    // Turn around at platform edges.
    if (b.blocked.down) {
      const aheadX = this.dir > 0 ? b.right + 2 : b.left - 2;
      if (!this.scene.layer.getTileAtWorldXY(aheadX, b.bottom + 4)) this.dir *= -1;
    }
    b.setVelocityX(this.dir * this.speed);
  }
}

class Bat extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'bat', 'bat1');
    this.body.setAllowGravity(false);
    this.body.setSize(12, 6).setOffset(2, 2);
    this.homeX = x;
    this.homeY = y;
    this.phase = Math.random() * Math.PI * 2;
    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.mode = 'patrol';
    this.nextSwoop = scene.time.now + 800;
    this.play({ key: 'bat_fly', startFrame: Phaser.Math.Between(0, 1) });
  }

  get collidesWithTiles() { return false; }

  update(time, delta) {
    super.update(time);
    if (!this.active) return;
    const dt = delta / 1000;
    const d = this.def;
    const player = this.scene.player;

    if (time < this.stunUntil) {
      this.body.velocity.scale(0.9);
      return;
    }

    if (this.mode === 'patrol') {
      // Sine-wave flight drifting back and forth around its home point.
      this.phase += dt * d.frequency;
      if (this.x > this.homeX + d.patrolRange) this.dir = -1;
      else if (this.x < this.homeX - d.patrolRange) this.dir = 1;
      const targetY = this.homeY + Math.sin(this.phase) * d.amplitude;
      this.body.setVelocity(this.dir * d.speed * this.diff.enemySpeed, (targetY - this.y) * 6);

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      if (player.canBeTargeted() && time > this.nextSwoop && Math.abs(dx) < d.swoopRange && dy > 0 && dy < 140) {
        this.mode = 'swoop';
        this.swoopEnd = time + 1000;
        this.target = new Phaser.Math.Vector2(player.x, player.y);
      }
    } else if (this.mode === 'swoop') {
      // Dive at where the player was when the swoop started.
      const speed = d.swoopSpeed * this.diff.swoop;
      const v = new Phaser.Math.Vector2(this.target.x - this.x, this.target.y - this.y);
      if (v.length() < 6 || time > this.swoopEnd) {
        this.mode = 'return';
      } else {
        v.normalize().scale(speed);
        this.body.setVelocity(v.x, v.y);
      }
    } else {
      // Fly back up to cruising height.
      this.body.setVelocity(this.body.velocity.x * 0.95, -d.swoopSpeed * 0.6);
      if (this.y <= this.homeY) {
        this.homeX = this.x;
        this.mode = 'patrol';
        this.nextSwoop = time + d.swoopCooldown;
      }
    }
    this.setFlipX(this.body.velocity.x < 0);
  }
}

class Skeleton extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'skeleton', 'skel_idle');
    this.body.setSize(8, 14).setOffset(2, 1);
    this.nextShot = scene.time.now + 900 + Math.random() * 600;
    this.windingUp = false;
  }

  update(time) {
    super.update(time);
    if (!this.active) return;
    const player = this.scene.player;
    if (time >= this.stunUntil && this.body.blocked.down) this.body.setVelocityX(0);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (!this.windingUp) this.setFlipX(dx < 0);

    const d = this.def;
    if (!this.windingUp && time > this.nextShot && player.canBeTargeted()
        && Math.abs(dx) < d.range && Math.abs(dy) < 40) {
      this.windingUp = true;
      this.setTexture('skel_shoot');
      const dir = dx < 0 ? -1 : 1;
      this.scene.time.delayedCall(d.windup, () => {
        if (!this.active) return;
        new Projectile(this.scene, this.x + dir * 6, this.y - 1, {
          group: this.scene.enemyProjectiles,
          texture: 'arrow_enemy',
          dir,
          speed: d.arrowSpeed * this.diff.enemySpeed,
          damage: d.damage,
          lifetime: 2600,
        });
        Sfx.play('enemyShot');
        this.setTexture('skel_idle');
        this.windingUp = false;
        this.nextShot = this.scene.time.now + d.fireRate * this.diff.fireRate;
      });
    }
  }
}

const ENEMY_CLASSES = { slime: Slime, bat: Bat, skeleton: Skeleton };
