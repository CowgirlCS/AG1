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

  // Stand the enemy on ground whose top edge is at pixel row `bottom`.
  placeOnGround(bottom) {
    this.y = bottom - (this.body.offset.y + this.body.height - this.displayOriginY) - 1;
  }

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
    this.scene.fx(this.def.fx || 'bone', this.x, this.y, 14);
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
        // A real arrow: slight upward arc, pointing where it flies.
        new Projectile(this.scene, this.x + dir * 6, this.y - 1, {
          group: this.scene.enemyProjectiles,
          texture: 'arrow_enemy',
          dir,
          vx: dir * d.arrowSpeed * this.diff.enemySpeed,
          vy: -35,
          gravity: 70,
          rotate: true,
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


// Scuttles along platforms, then charges sideways when you get close.
class GemCrab extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'gemCrab', 'crab1');
    this.body.setSize(14, 8).setOffset(1, 2);
    this.dir = -1;
    this.play({ key: 'crab_walk', startFrame: Phaser.Math.Between(0, 1) });
  }

  update(time) {
    super.update(time);
    if (!this.active || time < this.stunUntil) return;
    const b = this.body;
    const d = this.def;
    const player = this.scene.player;
    const dx = player.x - this.x;
    let speed = d.speed;
    let chasing = false;
    if (player.canBeTargeted() && Math.abs(dx) < d.chaseRange && Math.abs(player.y - this.y) < 40) {
      this.dir = dx < 0 ? -1 : 1;
      speed = d.chaseSpeed;
      chasing = true;
    }
    if (b.blocked.left) this.dir = 1;
    else if (b.blocked.right) this.dir = -1;

    if (b.blocked.down) {
      const aheadX = this.dir > 0 ? b.right + 2 : b.left - 2;
      if (!this.scene.layer.getTileAtWorldXY(aheadX, b.bottom + 4)) {
        // Wait at the edge while chasing, otherwise turn around.
        if (chasing) {
          b.setVelocityX(0);
          return;
        }
        this.dir *= -1;
      }
    }
    b.setVelocityX(this.dir * speed * this.diff.enemySpeed);
  }
}

// Little rock creature that hops toward you and shrugs off knockback.
class Golemite extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'golemite', 'golemite1');
    this.body.setSize(10, 11).setOffset(1, 1);
    this.dir = -1;
    this.nextHop = scene.time.now + 600 + Math.random() * 900;
  }

  knock(dir, force) {
    super.knock(dir, force * this.def.knockResist);
  }

  update(time) {
    super.update(time);
    if (!this.active || time < this.stunUntil) return;
    const b = this.body;
    const d = this.def;
    if (!b.blocked.down) return;
    b.setVelocityX(0);
    this.setTexture('golemite1');
    if (time < this.nextHop) return;

    const dx = this.scene.player.x - this.x;
    if (Math.abs(dx) < 220) this.dir = dx < 0 ? -1 : 1;
    // Don't hop off a ledge: check where it would land.
    const airTime = -2 * d.hopVelocity / 1000;
    const landX = this.x + this.dir * d.hopSpeed * airTime;
    if (!this.scene.layer.getTileAtWorldXY(landX, b.bottom + 4)) this.dir *= -1;
    b.setVelocity(this.dir * d.hopSpeed * this.diff.enemySpeed, d.hopVelocity);
    this.setTexture('golemite2');
    this.setFlipX(this.dir < 0);
    this.nextHop = time + d.hopEvery;
  }
}

// Keeps its distance, throws shuriken, and leaps across gaps.
class Ninja extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, 'ninja', 'ninja1');
    this.body.setSize(8, 14).setOffset(2, 1);
    this.nextThrow = scene.time.now + 800 + Math.random() * 600;
    this.poseUntil = 0;
  }

  update(time) {
    super.update(time);
    if (!this.active || time < this.stunUntil) return;
    const b = this.body;
    const d = this.def;
    const player = this.scene.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.abs(dx);
    const dir = dx < 0 ? -1 : 1;
    const awake = player.canBeTargeted() && dist < 260 && Math.abs(dy) < 80;

    if (awake && time > this.nextThrow && dist < d.range && Math.abs(dy) < 50) {
      new Projectile(this.scene, this.x + dir * 6, this.y - 1, {
        group: this.scene.enemyProjectiles,
        texture: 'shuriken',
        dir,
        speed: d.starSpeed * this.diff.enemySpeed,
        spin: 900,
        damage: d.damage,
        lifetime: 2000,
      });
      Sfx.play('throw');
      this.nextThrow = time + d.throwRate * this.diff.fireRate;
      this.poseUntil = time + 220;
    }

    let move = 0;
    if (awake) {
      this.setFlipX(dx < 0);
      if (dist > 110) move = dir;
      else if (dist < 60) move = -dir;
    }
    if (move !== 0 && b.blocked.down) {
      const aheadX = move > 0 ? b.right + 2 : b.left - 2;
      if (!this.scene.layer.getTileAtWorldXY(aheadX, b.bottom + 4)) {
        // Leap the gap if there is ground within reach, otherwise stop.
        let landing = false;
        for (let t = 1; t <= 5 && !landing; t++) {
          for (let row = -2; row <= 2; row++) {
            if (this.scene.layer.getTileAtWorldXY(aheadX + move * t * TILE, b.bottom + 4 + row * TILE)) landing = true;
          }
        }
        if (landing) b.setVelocityY(-330);
        else move = 0;
      }
    }
    if (b.blocked.down || move !== 0) b.setVelocityX(move * d.speed * this.diff.enemySpeed);

    if (time < this.poseUntil) {
      this.anims.stop();
      this.setTexture('ninja_throw');
    } else if (move !== 0 && b.blocked.down) {
      this.play('ninja_run', true);
    } else {
      this.anims.stop();
      this.setTexture(b.blocked.down ? 'ninja1' : 'ninja2');
    }
  }
}

const ENEMY_CLASSES = { slime: Slime, bat: Bat, skeleton: Skeleton, gemCrab: GemCrab, golemite: Golemite, ninja: Ninja };
