// Bosses guard the treasure chest at the end of each level. A boss waits until
// you walk into its arena (the last screen of the level), then cycles through
// its attacks. Below half health it gets angry: faster, with extra attacks.
// Boss shots do 1 damage; touching a boss does 2.
class Boss extends Enemy {
  constructor(scene, x, y, type, texture) {
    super(scene, x, y, type, texture);
    this.isBoss = true;
    this.awake = false;
    this.untouchable = false;
    this.maxHp = this.hp;
    this.mode = 'idle';
    this.nextAttack = 0;
    this.setDepth(6);
    Shaders.glow(this, this.def.glow, 2);
  }

  get enraged() { return this.hp <= this.maxHp / 2; }

  get arena() { return this.scene.arena; }

  get player() { return this.scene.player; }

  activate(time) {
    this.awake = true;
    this.nextAttack = time + 1200;
  }

  hurt(damage, dir, knockback) {
    if (!this.awake || this.dying || this.untouchable) return;
    super.hurt(damage, dir, knockback);
    this.scene.updateBossBar();
  }

  // Bosses don't get knocked around, they just flinch.
  knock() {}

  // Keep the boss inside the arena.
  clampToArena() {
    const a = this.arena;
    const hw = this.body.width / 2 + 2;
    const b = this.body;
    if (this.x < a.left + hw) {
      this.x = a.left + hw;
      if (b.velocity.x < 0) b.setVelocityX(0);
    } else if (this.x > a.right - hw) {
      this.x = a.right - hw;
      if (b.velocity.x > 0) b.setVelocityX(0);
    }
  }

  // Fire a boss projectile (1 damage).
  shoot(texture, x, y, vx, vy, opts = {}) {
    return new Projectile(this.scene, x, y, Object.assign({
      group: this.scene.enemyProjectiles,
      texture,
      dir: vx < 0 ? -1 : 1,
      vx,
      vy,
      damage: 1,
      lifetime: 3000,
    }, opts));
  }

  // Velocity to hit the player from (x, y) at `speed`, `spread` degrees off.
  aim(x, y, speed, spread = 0) {
    const p = this.player;
    const a = Math.atan2(p.body.center.y - y, p.x - x) + Phaser.Math.DegToRad(spread);
    return [Math.cos(a) * speed, Math.sin(a) * speed];
  }

  // Bring in helpers, never more than `max` of that type in the arena at once.
  summon(type, count, max) {
    const a = this.arena;
    const alive = this.scene.enemies.getChildren()
      .filter(e => e.active && !e.dying && e.type === type && e.x >= a.left).length;
    const n = Math.min(count, max - alive);
    const groundTop = this.scene.groundTop(a.left + 64);
    for (let i = 0; i < n; i++) {
      const x = i % 2 ? a.left + 40 : a.right - 40;
      const e = new ENEMY_CLASSES[type](this.scene, x, groundTop - 40);
      e.placeOnGround(groundTop);
      this.scene.fx('smoke', x, groundTop - 8, 12);
    }
    if (n > 0) Sfx.play('bossRoar');
  }

  later(ms, fn) {
    this.scene.time.delayedCall(ms, () => {
      if (this.active && !this.dying) fn();
    });
  }

  die() {
    this.dying = true;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.body.setAcceleration(0, 0);
    this.anims.stop();
    Sfx.play('bossDie');
    this.scene.onBossDefeated(this);
    this.scene.cameras.main.shake(1200, 0.01);
    // A chain of explosions, then one big one.
    this.scene.time.addEvent({
      delay: 120,
      repeat: 10,
      callback: () => {
        const x = this.x + Phaser.Math.Between(-this.width / 2, this.width / 2);
        const y = this.y + Phaser.Math.Between(-this.height / 2, this.height / 2);
        this.scene.fx('fire', x, y, 10);
        this.scene.fx(this.def.fx, x, y, 6);
        Sfx.play('enemyDie');
      },
    });
    this.scene.tweens.add({ targets: this, alpha: 0.3, duration: 90, yoyo: true, repeat: 7 });
    this.scene.time.delayedCall(1400, () => {
      this.scene.fx(this.def.fx, this.x, this.y, 40);
      this.scene.fx('gold', this.x, this.y, 30);
      Sfx.play('explosion');
      this.scene.addScore(this.def.score, this.x, this.y - 20);
      this.scene.dropLoot(this);
      this.destroy();
    });
  }
}

// Level 1. Stomps around, slams the ground to send shockwaves along it,
// throws boulders, and (when angry) calls in golemites.
class GrassyGolem extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'golem', 'golem1');
    this.body.setSize(22, 27).setOffset(3, 3);
    this.mode = 'walk';
  }

  update(time) {
    super.update(time);
    if (!this.active || this.dying) return;
    const b = this.body;
    if (!this.awake) {
      b.setVelocityX(0);
      return;
    }
    const dx = this.player.x - this.x;
    if (this.mode === 'walk') {
      this.setFlipX(dx < 0);
      b.setVelocityX(Math.abs(dx) < 20 ? 0 : Math.sign(dx) * (this.enraged ? 44 : 28));
      if (time > this.nextAttack && b.blocked.down) this.pickAttack(time);
    } else if (this.mode === 'slam') {
      if (time > this.modeStart + 200 && b.blocked.down) this.land(time);
    }
    this.clampToArena();
  }

  pickAttack(time) {
    const options = ['slam', 'boulder', 'slam', 'boulder'];
    if (this.enraged) options.push('summon', 'slam');
    const pick = Phaser.Utils.Array.GetRandom(options);
    const dx = this.player.x - this.x;
    if (pick === 'slam') {
      this.mode = 'slam';
      this.modeStart = time;
      this.setTexture('golem2');
      this.body.setVelocity(Phaser.Math.Clamp(dx * 1.1, -150, 150), -420);
    } else if (pick === 'boulder') {
      this.mode = 'windup';
      this.setTexture('golem2');
      this.body.setVelocityX(0);
      this.later(450, () => this.throwBoulders());
    } else {
      this.summon('golemite', 2, 3);
      this.nextAttack = time + 1500;
    }
  }

  land(time) {
    this.mode = 'walk';
    this.setTexture('golem1');
    this.body.setVelocityX(0);
    this.scene.cameras.main.shake(250, 0.015);
    this.scene.fx('rock', this.x, this.body.bottom, 16);
    Sfx.play('slam');
    // Shockwaves run along the ground both ways: jump over them.
    const y = this.body.bottom - 5;
    const wave = speed => {
      [-1, 1].forEach(dir => this.shoot('tremor', this.x + dir * 14, y, dir * speed, 0, { hitsLow: true, lifetime: 1800 }));
    };
    wave(170);
    if (this.enraged) this.later(350, () => wave(230));
    this.nextAttack = time + (this.enraged ? 1300 : 2100);
  }

  throwBoulders() {
    const n = this.enraged ? 3 : 1;
    const g = 600;
    const y0 = this.y - 14;
    for (let i = 0; i < n; i++) {
      const t = 0.85 + i * 0.18;
      const tx = this.player.x + (i - (n - 1) / 2) * 30;
      const vx = (tx - this.x) / t;
      const vy = ((this.player.y - y0) - 0.5 * g * t * t) / t;
      this.shoot('boulder', this.x, y0, vx, vy, { gravity: g, spin: 400, hitsLow: true });
    }
    Sfx.play('throw');
    this.setTexture('golem1');
    this.mode = 'walk';
    this.nextAttack = this.scene.time.now + (this.enraged ? 1400 : 2200);
  }
}

// Level 2. Scuttles back and forth, sprays crystal shards into the air, and
// charges across the arena (it's dizzy for a moment after hitting the wall).
class CrystalCrab extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'crystalCrab', 'crab_boss1');
    this.body.setSize(32, 14).setOffset(4, 10);
    this.mode = 'walk';
    this.dir = -1;
    this.play('crab_boss_walk');
  }

  update(time) {
    super.update(time);
    if (!this.active || this.dying) return;
    const b = this.body;
    const a = this.arena;
    if (!this.awake) {
      b.setVelocityX(0);
      return;
    }
    if (this.mode === 'walk') {
      if (this.x <= a.left + 30) this.dir = 1;
      else if (this.x >= a.right - 30) this.dir = -1;
      b.setVelocityX(this.dir * (this.enraged ? 85 : 55));
      if (time > this.nextAttack && b.blocked.down) this.pickAttack(time);
    } else if (this.mode === 'charge') {
      if (this.x <= a.left + 22 || this.x >= a.right - 22) {
        this.mode = 'dizzy';
        b.setVelocityX(0);
        this.scene.cameras.main.shake(200, 0.012);
        Sfx.play('slam');
        this.later(this.enraged ? 500 : 800, () => {
          this.mode = 'walk';
          this.play('crab_boss_walk');
          this.nextAttack = this.scene.time.now + 900;
        });
      }
    } else {
      b.setVelocityX(0);
    }
    this.clampToArena();
  }

  pickAttack(time) {
    const options = ['spray', 'spray', 'charge'];
    if (this.enraged) options.push('summon', 'charge');
    const pick = Phaser.Utils.Array.GetRandom(options);
    if (pick === 'summon') {
      this.summon('gemCrab', 2, 3);
      this.nextAttack = time + 1500;
      return;
    }
    this.mode = 'windup';
    this.anims.stop();
    this.setTexture('crab_boss3');
    if (pick === 'spray') {
      this.later(380, () => this.spray());
    } else {
      this.scene.tweens.add({ targets: this, alpha: 0.5, duration: 80, yoyo: true, repeat: 2 });
      this.later(520, () => {
        this.mode = 'charge';
        this.setTexture('crab_boss1');
        this.play('crab_boss_walk');
        this.body.setVelocityX((this.player.x < this.x ? -1 : 1) * (this.enraged ? 280 : 230));
      });
    }
  }

  spray() {
    const n = this.enraged ? 7 : 5;
    for (let i = 0; i < n; i++) {
      const ang = Phaser.Math.DegToRad(-160 + i * (140 / (n - 1)));
      this.shoot('shard', this.x, this.y - 10, Math.cos(ang) * 170, Math.sin(ang) * 300,
        { gravity: 500, rotate: true, hitsLow: true, trail: 'crystal' });
    }
    Sfx.play('fire');
    this.mode = 'walk';
    this.setTexture('crab_boss1');
    this.play('crab_boss_walk');
    this.nextAttack = this.scene.time.now + (this.enraged ? 1300 : 2000);
  }
}

// Level 3. Teleports around, throws shadow daggers at you, dashes across the
// arena, and (when angry) calls in ninjas.
class MysteriousStranger extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'stranger', 'stranger1');
    this.body.setSize(10, 20).setOffset(3, 2);
    this.mode = 'idle';
  }

  update(time) {
    super.update(time);
    if (!this.active || this.dying) return;
    const b = this.body;
    const dx = this.player.x - this.x;
    if (!this.awake) {
      b.setVelocityX(0);
      this.setFlipX(dx < 0);
      return;
    }
    if (this.mode === 'idle') {
      this.setFlipX(dx < 0);
      b.setVelocityX(Math.abs(dx) > 90 ? Math.sign(dx) * 30 : -Math.sign(dx) * 30);
      if (time > this.nextAttack) this.pickAttack(time);
    } else if (this.mode === 'dash') {
      if (time > this.nextGhost) {
        this.nextGhost = time + 30;
        this.scene.fx('shadow', this.x, this.y, 2);
      }
      if (time > this.dashUntil) {
        this.mode = 'idle';
        this.setTexture('stranger1');
        this.nextAttack = time + (this.enraged ? 700 : 1100);
      }
    } else if (this.mode !== 'dashWindup') {
      b.setVelocityX(0);
    }
    this.clampToArena();
  }

  pickAttack(time) {
    const options = ['teleport', 'daggers', 'dash', 'teleport'];
    if (this.enraged) options.push('summon', 'dash');
    const pick = Phaser.Utils.Array.GetRandom(options);
    if (pick === 'teleport') this.teleport();
    else if (pick === 'daggers') this.daggers();
    else if (pick === 'dash') this.dash();
    else {
      this.summon('ninja', 2, 2);
      this.nextAttack = time + 1200;
    }
  }

  teleport() {
    this.mode = 'teleport';
    this.untouchable = true;
    this.body.setVelocityX(0);
    this.scene.fx('shadow', this.x, this.y, 16);
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 220,
      onComplete: () => {
        if (!this.active || this.dying) return;
        const a = this.arena;
        let x;
        do { x = Phaser.Math.Between(a.left + 30, a.right - 30); } while (Math.abs(x - this.player.x) < 90);
        this.x = x;
        this.scene.fx('shadow', this.x, this.y, 16);
        this.scene.tweens.add({
          targets: this, alpha: 1, duration: 220,
          onComplete: () => {
            if (!this.active || this.dying) return;
            this.untouchable = false;
            this.daggers();
          },
        });
      },
    });
  }

  daggers() {
    this.mode = 'cast';
    this.body.setVelocityX(0);
    this.setFlipX(this.player.x < this.x);
    this.setTexture('stranger2');
    this.later(300, () => {
      const n = this.enraged ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const [vx, vy] = this.aim(this.x, this.y - 4, 220, (i - (n - 1) / 2) * 14);
        this.shoot('dagger_shadow', this.x, this.y - 4, vx, vy, { rotate: true, trail: 'shadow' });
      }
      Sfx.play('throw');
      this.setTexture('stranger1');
      this.mode = 'idle';
      this.nextAttack = this.scene.time.now + (this.enraged ? 1100 : 1700);
    });
  }

  dash() {
    this.mode = 'dashWindup';
    this.body.setVelocityX(0);
    this.setTexture('stranger2');
    const dir = this.player.x < this.x ? -1 : 1;
    this.setFlipX(dir < 0);
    this.scene.tweens.add({ targets: this, alpha: 0.4, duration: 70, yoyo: true, repeat: 2 });
    this.later(420, () => {
      this.mode = 'dash';
      this.nextGhost = 0;
      this.dashUntil = this.scene.time.now + 480;
      this.body.setVelocityX(dir * 320);
      Sfx.play('dash');
    });
  }
}

// Final boss. Flies over the arena, breathes streams of fire at you, rains
// meteors, and swoops low across the ground (jump over it, or dash through).
class DarkDragon extends Boss {
  constructor(scene, x, y) {
    super(scene, x, y, 'dragon', 'dragon1');
    this.body.setAllowGravity(false);
    this.body.setSize(46, 24).setOffset(12, 14);
    this.t = 0;
    this.mode = 'hover';
    this.play('dragon_fly');
  }

  get collidesWithTiles() { return false; }

  update(time, delta) {
    super.update(time);
    if (!this.active || this.dying) return;
    const b = this.body;
    const a = this.arena;
    const dt = delta / 1000;
    this.t += dt;
    if (!this.awake) {
      b.setVelocity(0, Math.sin(this.t * 2) * 10);
      return;
    }
    const cx = (a.left + a.right) / 2;
    const groundTop = this.scene.groundTop(cx);
    const face = () => this.setFlipX(this.player.x < this.x);

    if (this.mode === 'hover') {
      face();
      const tx = cx + Math.sin(this.t * 0.7) * 150;
      const ty = 80 + Math.sin(this.t * 2.1) * 14;
      b.setVelocity((tx - this.x) * 2, (ty - this.y) * 3);
      if (time > this.nextAttack) this.pickAttack(time);
    } else if (this.mode === 'swoopPrep') {
      const ty = groundTop - 16;
      b.setVelocity((this.swoopFrom - this.x) * 3, (ty - this.y) * 3);
      if (Math.abs(this.swoopFrom - this.x) < 8 && Math.abs(ty - this.y) < 8) {
        this.mode = 'swoop';
        this.setFlipX(this.swoopDir < 0);
        Sfx.play('bossRoar');
      }
    } else if (this.mode === 'swoop') {
      b.setVelocity(this.swoopDir * (this.enraged ? 300 : 250), 0);
      if ((this.swoopDir > 0 && this.x > a.right - 40) || (this.swoopDir < 0 && this.x < a.left + 40)) {
        this.mode = 'hover';
        this.nextAttack = time + 900;
      }
    } else {
      b.velocity.scale(0.9);
    }
    this.clampToArena();
  }

  pickAttack(time) {
    const options = ['breath', 'meteor', 'breath', 'swoop'];
    if (this.enraged) options.push('meteor', 'swoop');
    const pick = Phaser.Utils.Array.GetRandom(options);
    const a = this.arena;
    if (pick === 'swoop') {
      // Start from the side farther from the player.
      const leftSide = this.player.x > (a.left + a.right) / 2;
      this.swoopFrom = leftSide ? a.left + 40 : a.right - 40;
      this.swoopDir = leftSide ? 1 : -1;
      this.mode = 'swoopPrep';
    } else if (pick === 'breath') {
      this.mode = 'breath';
      this.anims.stop();
      this.setTexture('dragon3');
      this.later(450, () => this.breathe());
    } else {
      this.meteors();
    }
  }

  breathe() {
    const n = this.enraged ? 9 : 6;
    const mouth = () => [this.x + (this.flipX ? -28 : 28), this.y - 2];
    for (let i = 0; i < n; i++) {
      this.later(i * 110, () => {
        const [x, y] = mouth();
        // Angry: every third shot is a 3-way blast.
        const spreads = this.enraged && i % 3 === 0 ? [-14, 0, 14] : [Phaser.Math.Between(-6, 6)];
        spreads.forEach(s => {
          const [vx, vy] = this.aim(x, y, 210, s);
          this.shoot('fireball', x, y, vx, vy, { trail: 'fire' });
        });
        Sfx.play('fire');
      });
    }
    this.later(n * 110 + 100, () => {
      this.mode = 'hover';
      this.play('dragon_fly');
      this.nextAttack = this.scene.time.now + (this.enraged ? 1000 : 1600);
    });
  }

  meteors() {
    Sfx.play('bossRoar');
    this.scene.cameras.main.shake(400, 0.008);
    const a = this.arena;
    const n = this.enraged ? 8 : 5;
    for (let i = 0; i < n; i++) {
      this.later(300 + i * 180, () => {
        const x = Phaser.Math.Between(a.left + 16, a.right - 16);
        this.shoot('fireball', x, this.scene.cameras.main.scrollY - 8, Phaser.Math.Between(-30, 30), 170,
          { trail: 'fire', hitsLow: true, gravity: 120 });
      });
    }
    this.nextAttack = this.scene.time.now + 300 + n * 180 + (this.enraged ? 700 : 1200);
  }
}

const BOSS_CLASSES = { golem: GrassyGolem, crystalCrab: CrystalCrab, stranger: MysteriousStranger, dragon: DarkDragon };
