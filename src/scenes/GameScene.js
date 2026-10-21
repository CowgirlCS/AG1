class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // Run state lives in the registry so the UI and other scenes can read it.
    this.state = this.registry.get('state');
    this.state.hp = this.state.maxHp;
    // Snapshot used to reset the level on death.
    this.registry.set('levelStart', GameState.clone(this.state));

    this.levelIndex = this.state.level;
    this.level = LEVELS[this.levelIndex];
    this.worldW = this.level.width * TILE;
    this.worldH = LEVEL_ROWS * TILE;
    this.dead = false;
    this.completing = false;
    this.melee = null;

    this.createBackground();
    this.createTilemap();

    this.enemies = this.add.group({ runChildUpdate: true });
    this.pickups = this.add.group();
    this.playerProjectiles = this.add.group({ runChildUpdate: true });
    this.enemyProjectiles = this.add.group({ runChildUpdate: true });
    this.createEmitters();
    this.spawnEntities();
    this.createColliders();

    // Camera: follows the player to the right and never scrolls back left.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.scrollX = Phaser.Math.Clamp(this.player.x - cam.width * 0.4, 0, this.worldW - cam.width);
    cam.fadeIn(300);

    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN',
      jump: 'SPACE', atkF: 'F', atkJ: 'J', esc: 'ESC',
    });
    const onResume = () => Object.values(this.keys).forEach(k => k.reset());
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => this.events.off('resume', onResume));

    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
    this.scene.bringToTop('UIScene');

    this.banner(`LEVEL ${this.levelIndex + 1}`, this.level.name.toUpperCase(), 1800);
  }

  // ---------------------------------------------------------------- setup

  createBackground() {
    const t = this.level.theme;
    const W = this.scale.width, H = this.scale.height;
    this.add.image(0, 0, 'sky_' + t).setOrigin(0).setDisplaySize(W, H).setScrollFactor(0).setDepth(-30);
    if (t === 2) this.add.image(380, 52, 'moon').setScrollFactor(0).setDepth(-25);
    this.bgFar = this.add.tileSprite(0, 0, W, H, 'bg_far_' + t).setOrigin(0).setScrollFactor(0).setDepth(-20);
    this.bgNear = this.add.tileSprite(0, 0, W, H, 'bg_near_' + t).setOrigin(0).setScrollFactor(0).setDepth(-10);
  }

  createTilemap() {
    const rows = this.level.map;
    const base = this.level.theme * 3;
    const data = rows.map((row, y) => [...row].map((ch, x) => {
      if (ch === '#') return (y > 0 && rows[y - 1][x] === '#') ? base + 1 : base;
      if (ch === '=') return base + 2;
      return -1;
    }));
    this.map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = this.map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    this.layer = this.map.createLayer(0, tileset, 0, 0);
    this.layer.setCollisionByExclusion([-1]);
  }

  createEmitters() {
    const make = (tint, extra = {}) => this.add.particles(0, 0, 'px', Object.assign({
      speed: { min: 40, max: 130 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 250, max: 520 },
      scale: { start: 1, end: 0 },
      gravityY: 300,
      tint,
      emitting: false,
    }, extra)).setDepth(20);
    this.emitters = {
      spark: make(0xffffff),
      goo: make([0x4fc24a, 0xa8f08a]),
      purple: make([0x7b4fb8, 0x40246a]),
      bone: make([0xe8e2c8, 0xb5ac8c]),
      gold: make([0xffcd3a, 0xffffff], { speed: { min: 60, max: 180 }, gravityY: 200 }),
      fire: make([0xf77622, 0xffcd3a, 0xe43b44], { speed: { min: 5, max: 50 }, lifespan: { min: 150, max: 300 }, gravityY: -60 }),
      blood: make([0xe43b44, 0x9e2835]),
    };
  }

  fx(name, x, y, count) {
    this.emitters[name].explode(count, x, y);
  }

  spawnEntities() {
    this.level.map.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const x = tx * TILE + TILE / 2;
        const cy = ty * TILE + TILE / 2;
        const bottom = (ty + 1) * TILE;
        if (ch === 'P') {
          this.spawnPoint = { x, y: bottom - 8 };
        } else if (ch === 'C') {
          this.chest = this.physics.add.staticImage(x, bottom - 7, 'chest_closed').setDepth(3);
        } else if (ENEMY_CHARS[ch]) {
          const type = ENEMY_CHARS[ch];
          const Cls = ENEMY_CLASSES[type];
          new Cls(this, x, type === 'bat' ? cy : bottom - 8);
        } else if (ch === 'o') {
          new Pickup(this, x, cy, 'coin');
        } else if (ch === 'h') {
          new Pickup(this, x, cy, 'potion');
        } else if (ch === 'H') {
          new Pickup(this, x, cy, 'heart');
        } else if (WEAPON_CHARS[ch]) {
          new Pickup(this, x, cy, 'weapon', { weapon: WEAPON_CHARS[ch] });
        }
      });
    });
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y);
  }

  createColliders() {
    const p = this.physics;
    this.playerTiles = p.add.collider(this.player, this.layer, (pl, tile) => this.checkTileContact(tile));
    p.add.collider(this.enemies, this.layer, null, e => e.collidesWithTiles);
    p.add.collider(this.pickups, this.layer);
    p.add.collider(this.playerProjectiles, this.layer, proj => proj.impact());
    p.add.collider(this.enemyProjectiles, this.layer, proj => proj.impact());

    p.add.overlap(this.player, this.enemies, (pl, e) => {
      if (!e.dying) this.damagePlayer(e.def.damage, e.x);
    });
    p.add.overlap(this.player, this.enemyProjectiles, (pl, proj) => {
      if (this.player.isInvulnerable(this.time.now)) return;
      this.damagePlayer(proj.damage, proj.x);
      proj.impact();
    });
    p.add.overlap(this.playerProjectiles, this.enemies, (proj, e) => {
      if (!proj.active || e.dying) return;
      e.hurt(proj.damage, proj.dir, proj.knockback);
      proj.impact();
    });
    p.add.overlap(this.player, this.pickups, (pl, item) => this.collect(item));
    p.add.overlap(this.player, this.chest, () => this.reachChest());
  }

  // ------------------------------------------------- platform death rule

  // Called for every tile the player is separated from. Landing on top is
  // safe; touching a tile from the side or from below kills the player.
  checkTileContact(tile) {
    if (this.dead || this.completing) return;
    const b = this.player.body;
    const top = tile.pixelY;
    const bottom = top + TILE;

    if (b.bottom <= top + 1) return;              // standing on top: safe
    if (b.top >= bottom - 1) {                    // hit from below
      this.killPlayer();
      return;
    }
    // Side contact. Forgive clipping just the top corner of a ledge (a few
    // pixels short of landing) by popping the player up onto it.
    const above = this.layer.getTileAt(tile.x, tile.y - 1);
    if (!above && b.bottom - top <= 5 && b.velocity.y >= -60) {
      b.y = top - b.height;
      b.velocity.y = 0;
      return;
    }
    this.killPlayer();
  }

  // ---------------------------------------------------------------- update

  update(time) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.esc) && !this.dead && !this.completing) {
      Sfx.play('pause');
      this.scene.launch('PauseScene');
      this.scene.bringToTop('PauseScene');
      this.scene.pause();
      return;
    }

    this.player.update(time, this.keys);
    this.updateMelee(time);
    this.updateCamera();

    if (!this.dead && this.player.body.top > this.worldH) this.killPlayer();
  }

  updateCamera() {
    const cam = this.cameras.main;
    if (!this.dead) {
      const target = this.player.x - cam.width * 0.4;
      cam.scrollX = Phaser.Math.Clamp(Math.max(cam.scrollX, target), 0, this.worldW - cam.width);

      // The player can't walk back past the camera's left edge.
      const b = this.player.body;
      if (b.left < cam.scrollX) {
        this.player.x += cam.scrollX - b.left;
        if (b.velocity.x < 0) b.setVelocityX(0);
      }
    }
    this.bgFar.tilePositionX = cam.scrollX * 0.15;
    this.bgNear.tilePositionX = cam.scrollX * 0.4;
  }

  // ---------------------------------------------------------------- combat

  startMelee(weapon, damage) {
    if (this.melee && this.melee.slash.active) this.melee.slash.destroy();
    const slash = this.add.image(0, 0, 'slash').setDepth(11).setTint(weapon.slashTint);
    slash.setScale(weapon.reach / 16, weapon.height / 16);
    this.tweens.add({ targets: slash, alpha: 0, duration: weapon.duration + 80, onComplete: () => slash.destroy() });
    this.melee = { weapon, damage, until: this.time.now + weapon.duration, hit: new Set(), slash };
    this.updateMelee(this.time.now);
  }

  updateMelee(time) {
    const m = this.melee;
    if (!m) return;
    const w = m.weapon;
    const b = this.player.body;
    const f = this.player.facing;
    const rect = new Phaser.Geom.Rectangle(f > 0 ? b.right - 2 : b.left - w.reach + 2, b.center.y - w.height / 2, w.reach, w.height);
    if (m.slash.active) {
      m.slash.setPosition(rect.centerX, rect.centerY).setFlipX(f < 0);
    }
    if (time > m.until) {
      this.melee = null;
      return;
    }
    const overlaps = obj => {
      const ob = obj.body;
      return Phaser.Geom.Intersects.RectangleToRectangle(rect, new Phaser.Geom.Rectangle(ob.x, ob.y, ob.width, ob.height));
    };
    this.enemies.getChildren().slice().forEach(e => {
      if (!e.active || e.dying || m.hit.has(e) || !overlaps(e)) return;
      m.hit.add(e);
      e.hurt(m.damage, f, w.knockback);
      if (w.shake) this.cameras.main.shake(110, 0.008);
    });
    // Melee swings also knock enemy arrows out of the air.
    this.enemyProjectiles.getChildren().slice().forEach(proj => {
      if (proj.active && overlaps(proj)) proj.impact();
    });
  }

  fireWeapon(weapon, damage) {
    const f = this.player.facing;
    new Projectile(this, this.player.x + f * 8, this.player.y + 1, {
      group: this.playerProjectiles,
      texture: weapon.projectile,
      dir: f,
      speed: weapon.speed,
      damage,
      knockback: weapon.knockback,
      lifetime: weapon.lifetime,
      trail: weapon.projectile === 'fireball',
    });
  }

  damagePlayer(amount, fromX) {
    const time = this.time.now;
    if (this.completing || this.player.isInvulnerable(time)) return;
    this.state.hp = Math.max(0, this.state.hp - amount);
    this.fx('blood', this.player.x, this.player.y, 8);
    if (this.state.hp <= 0) {
      this.killPlayer();
      return;
    }
    Sfx.play('hurt');
    this.cameras.main.shake(140, 0.01);
    this.player.onHurt(time, fromX);
  }

  killPlayer() {
    if (this.dead || this.completing) return;
    this.dead = true;
    this.player.dead = true;
    this.state.hp = 0;
    Sfx.play('death');
    this.cameras.main.shake(250, 0.015);
    this.fx('blood', this.player.x, this.player.y, 16);

    // Classic death hop, falling through the floor.
    this.playerTiles.active = false;
    this.player.anims.stop();
    this.player.setTexture('player_jump').setTint(0xff6060).setAlpha(1);
    this.player.body.setVelocity(0, -240);
    this.player.body.setAllowGravity(true);
    this.tweens.add({ targets: this.player, angle: 180 * -this.player.facing, duration: 600 });

    this.banner('YOU DIED', 'BACK TO THE START...', 1400);
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Respawn at the start of the level with the state from when it began.
        this.registry.set('state', GameState.clone(this.registry.get('levelStart')));
        this.scene.restart();
      });
    });
  }

  dropLoot(enemy) {
    const [min, max] = enemy.def.coins;
    const n = Phaser.Math.Between(min, max);
    for (let i = 0; i < n; i++) new Pickup(this, enemy.x, enemy.y - 4, 'coin', { dropped: true });
    if (Math.random() < enemy.def.potionChance) new Pickup(this, enemy.x, enemy.y - 4, 'potion', { dropped: true });
  }

  // --------------------------------------------------------------- pickups

  collect(item) {
    if (!item.active || this.dead) return;
    const s = this.state;
    switch (item.kind) {
      case 'coin':
        Sfx.play('coin');
        this.addScore(10);
        this.fx('gold', item.x, item.y, 4);
        break;
      case 'potion':
        Sfx.play('potion');
        s.hp = Math.min(s.maxHp, s.hp + 3);
        this.floatText(item.x, item.y - 8, '+3 HP', 0x80ff80);
        break;
      case 'heart':
        Sfx.play('heart');
        s.maxHp += 5;
        s.hp = Math.min(s.maxHp, s.hp + 5);
        this.floatText(item.x, item.y - 8, '+5 MAX HP', 0xff8080);
        this.fx('gold', item.x, item.y, 12);
        break;
      case 'weapon':
        this.equipWeapon(item.weapon, item.x, item.y);
        break;
    }
    item.destroy();
  }

  equipWeapon(key, x, y) {
    const s = this.state;
    const w = WEAPONS[key];
    Sfx.play('weapon');
    this.fx('gold', x, y, 12);
    s.weapon = key;
    if (!s.owned.includes(key)) {
      // First pickup: permanent upgrade.
      s.owned.push(key);
      if (w.upgrade.maxHp) {
        s.maxHp += w.upgrade.maxHp;
        s.hp += w.upgrade.maxHp;
      }
      this.floatText(x, y - 18, w.name, 0xffffff);
      this.floatText(x, y - 8, w.upgradeText, 0x80e0ff);
    } else {
      this.floatText(x, y - 8, w.name, 0xffffff);
    }
  }

  addScore(points, x, y) {
    this.state.score += points;
    if (x !== undefined) this.floatText(x, y, '+' + points, 0xffcd3a);
  }

  // ------------------------------------------------------------ level end

  reachChest() {
    if (this.completing || this.dead) return;
    this.completing = true;
    this.player.frozen = true;
    this.melee = null;
    this.chest.setTexture('chest_open');
    Sfx.play('chest');
    this.fx('gold', this.chest.x, this.chest.y - 6, 30);
    this.cameras.main.shake(150, 0.005);
    this.addScore(100 * (this.levelIndex + 1), this.chest.x, this.chest.y - 20);

    const next = this.levelIndex + 1;
    if (next >= LEVELS.length) {
      SaveManager.clear();
      SaveManager.setBest(this.state.score);
      this.banner('TREASURE FOUND!', '', 1800);
      this.time.delayedCall(2000, () => {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop('UIScene');
          this.scene.start('WinScene', { score: this.state.score });
        });
      });
    } else {
      this.state.level = next;
      const saved = SaveManager.save(this.state);
      this.banner('LEVEL COMPLETE!', saved ? 'PROGRESS SAVED' : 'COULD NOT SAVE', 1800);
      this.time.delayedCall(2000, () => {
        this.cameras.main.fadeOut(400);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
      });
    }
  }

  // ------------------------------------------------------------- text fx

  floatText(x, y, str, tint) {
    const t = pixelText(this, x, y, str, { tint, origin: 0.5 }).setDepth(30);
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 800, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  banner(title, subtitle, duration) {
    const cx = this.scale.width / 2;
    const items = [pixelText(this, cx, 96, title, { scale: 2, origin: 0.5, tint: 0xffe080 })];
    if (subtitle) items.push(pixelText(this, cx, 118, subtitle, { origin: 0.5 }));
    items.forEach(t => t.setScrollFactor(0).setDepth(100));
    this.tweens.add({ targets: items, alpha: 0, delay: duration, duration: 400, onComplete: () => items.forEach(t => t.destroy()) });
  }
}
