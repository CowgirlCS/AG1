class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    // Run state lives in the registry so the UI and other scenes can read it.
    this.state = this.registry.get('state');
    this.inBonus = !!this.state.inBonus;
    this.levelIndex = this.state.level;
    this.level = this.inBonus ? BONUS_LEVEL : LEVELS[this.levelIndex];

    // A checkpoint is set when a boss fight starts, so dying to the boss puts
    // you back at the arena instead of the start of the level.
    const cp = this.registry.get('checkpoint');
    this.checkpoint = !this.inBonus && cp && cp.level === this.levelIndex ? cp : null;
    this.state.hp = this.state.maxHp;
    this.state.armorHp = GameState.armorPoints(this.state);
    // Snapshot used to reset the level on death.
    if (!this.checkpoint) this.registry.set('levelStart', GameState.clone(this.state));

    this.worldW = this.level.width * TILE;
    this.worldH = LEVEL_ROWS * TILE;
    this.dead = false;
    this.completing = false;
    this.melee = null;
    this.boss = null;
    this.portal = null;
    this.chest = null;
    this.bossStarted = false;
    this.chestReady = true;
    this.arena = this.level.boss ? { left: (this.level.width - ARENA_WIDTH) * TILE, right: this.worldW } : null;
    this.powerReady = { earth: 0, crystal: 0, shadow: 0 };   // time each superpower can be used again
    this.bonusEndsAt = 0;
    this.msgAt = 0;
    this.nextSparkle = 0;
    this.registry.set('boss', null);

    this.createBackground();
    this.createTilemap();

    this.enemies = this.add.group({ runChildUpdate: true });
    this.pickups = this.add.group();
    this.playerProjectiles = this.add.group({ runChildUpdate: true });
    this.enemyProjectiles = this.add.group({ runChildUpdate: true });
    this.bombs = this.add.group({ runChildUpdate: true });
    this.runeWalls = this.physics.add.staticGroup();
    this.createEmitters();
    this.createSecrets();
    this.spawnEntities();
    this.createColliders();

    // Camera: follows the player to the right and never scrolls back left.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.scrollX = Phaser.Math.Clamp(this.player.x - cam.width * 0.4, 0, this.worldW - cam.width);
    cam.fadeIn(300);
    Shaders.apply(this);

    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN',
      attack: 'SPACE', attack2: 'J', dash: 'D', esc: 'ESC',
      powerEarth: 'Q', powerCrystal: 'W', powerShadow: 'E', shaders: 'V',
    });
    // Weapon switching: letter hotkeys and number keys 1-8 (bar order).
    this.weaponKeys = Object.entries(WEAPON_HOTKEYS).map(([k, w]) => [this.input.keyboard.addKey(k), w]);
    WEAPON_ORDER.forEach((w, i) => this.weaponKeys.push([this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + i), w]));
    const onResume = () => {
      Object.values(this.keys).forEach(k => k.reset());
      this.weaponKeys.forEach(([k]) => k.reset());
    };
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => this.events.off('resume', onResume));

    if (!this.scene.isActive('UIScene')) this.scene.launch('UIScene');
    this.scene.bringToTop('UIScene');

    if (this.inBonus) this.banner('BONUS LEVEL', `GRAB ALL YOU CAN IN ${this.level.timeLimit} SECONDS`, 1800);
    else if (this.checkpoint) this.banner('TRY AGAIN!', this.boss ? this.boss.def.name : '', 1200);
    else this.banner(`LEVEL ${this.levelIndex + 1}`, this.level.name.toUpperCase(), 1800);
  }

  // ---------------------------------------------------------------- setup

  createBackground() {
    const t = this.level.theme;
    const W = this.scale.width, H = this.scale.height;
    this.add.image(0, 0, 'sky_' + t).setOrigin(0).setDisplaySize(W, H).setScrollFactor(0).setDepth(-30);
    if (t === 2) this.add.image(380, 52, 'moon').setScrollFactor(0).setDepth(-25);
    if (t === 3) this.add.image(380, 52, 'moon').setTint(0xff5030).setScrollFactor(0).setDepth(-25);
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
    const floaty = { speed: { min: 10, max: 60 }, gravityY: -40, lifespan: { min: 250, max: 500 } };
    this.emitters = {
      spark: make(0xffffff),
      goo: make([0x4fc24a, 0xa8f08a]),
      purple: make([0x7b4fb8, 0x40246a]),
      bone: make([0xe8e2c8, 0xb5ac8c]),
      gold: make([0xffcd3a, 0xffffff], { speed: { min: 60, max: 180 }, gravityY: 200 }),
      fire: make([0xf77622, 0xffcd3a, 0xe43b44], { speed: { min: 5, max: 50 }, lifespan: { min: 150, max: 300 }, gravityY: -60 }),
      blood: make([0xe43b44, 0x9e2835]),
      crystal: make([0x4dd2ff, 0xb8f0ff, 0x2a8fb8]),
      rock: make([0x7a6e64, 0x4e443e, 0x3d9a45]),
      smoke: make([0x3a3a4a, 0x5a5a6a, 0x8a8a9a], floaty),
      shadow: make([0xb44cff, 0x6a2aa8, 0x17121f], floaty),
      ember: make([0xff6a00, 0xffcd3a, 0x2e2442]),
    };
  }

  fx(name, x, y, count) {
    (this.emitters[name] || this.emitters.spark).explode(count, x, y);
  }

  // Fake walls and rune vaults. Both are drawn on top of the player so you
  // disappear into them; they turn see-through while you're inside.
  createSecrets() {
    this.secrets = (this.level.secrets || []).map(r => this.makeFakeBlock(r, 'tiles_fake'));
    (this.level.runeWalls || []).forEach(([x0, y0, x1, y1, rune]) => {
      if (this.state.runes.includes(rune)) {
        const s = this.makeFakeBlock([x0, y0, x1, y1], 'runewall');
        s.images.forEach(img => img.setTint(0x9080b0));
        this.secrets.push(s);
        return;
      }
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const wall = this.runeWalls.create(x * TILE + 8, y * TILE + 8, 'runewall').setDepth(2);
          wall.rune = rune;
        }
      }
    });
  }

  makeFakeBlock([x0, y0, x1, y1], texture) {
    const base = this.level.theme * 3;
    const images = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const frame = texture === 'tiles_fake' ? (y === y0 ? base : base + 1) : undefined;
        images.push(this.add.image(x * TILE + 8, y * TILE + 8, texture, frame).setDepth(12));
      }
    }
    const rect = new Phaser.Geom.Rectangle(x0 * TILE, y0 * TILE, (x1 - x0 + 1) * TILE, (y1 - y0 + 1) * TILE);
    return { rect, images, alpha: 1, found: false };
  }

  // Top of the ground (in pixels) in the column under world x.
  groundTop(px) {
    const tx = Phaser.Math.Clamp(Math.floor(px / TILE), 0, this.level.width - 1);
    for (let y = 0; y < LEVEL_ROWS; y++) if (this.level.map[y][tx] === '#') return y * TILE;
    return this.worldH;
  }

  spawnEntities() {
    const arenaCol = this.arena ? this.level.width - ARENA_WIDTH : Infinity;
    this.level.map.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        // Respawning at the boss: skip everything before the arena.
        if (this.checkpoint && tx < arenaCol && ch !== 'P') return;
        const x = tx * TILE + TILE / 2;
        const cy = ty * TILE + TILE / 2;
        const bottom = (ty + 1) * TILE;
        if (ch === 'P') {
          this.spawnPoint = { x, y: bottom - 8 };
        } else if (ch === 'C') {
          this.chest = this.physics.add.staticImage(x, bottom - 7, 'chest_closed').setDepth(3);
        } else if (ch === 'K') {
          this.boss = new BOSS_CLASSES[this.level.boss](this, x, cy);
          if (this.boss.collidesWithTiles) this.boss.placeOnGround(bottom);
        } else if (ENEMY_CHARS[ch]) {
          const e = new ENEMY_CLASSES[ENEMY_CHARS[ch]](this, x, ENEMY_CHARS[ch] === 'bat' ? cy : bottom - 8);
          if (e.collidesWithTiles) e.placeOnGround(bottom);
        } else if (ch === 'o') {
          new Pickup(this, x, cy, 'coin');
        } else if (ch === 'G') {
          new Pickup(this, x, cy, 'gem');
        } else if (ch === 'h') {
          new Pickup(this, x, cy, 'potion');
        } else if (ch === 'H') {
          new Pickup(this, x, cy, 'heart');
        } else if (ch === 'r') {
          if (!this.state.runes.includes(this.level.rune)) new Pickup(this, x, cy, 'rune', { rune: this.level.rune });
        } else if (ch === 'Q') {
          if (!this.state.bonusDone) {
            this.portal = this.physics.add.staticSprite(x, cy, 'portal1').setDepth(3).play('portal_spin');
            Shaders.glow(this.portal, 0xb44cff, 4);
          }
        } else if (WEAPON_CHARS[ch]) {
          new Pickup(this, x, cy, 'weapon', { weapon: WEAPON_CHARS[ch] });
        }
      });
    });
    if (this.boss && this.chest) {
      this.chest.setVisible(false);
      this.chestReady = false;
    }
    if (this.checkpoint) this.spawnPoint = { x: this.checkpoint.x, y: this.groundTop(this.checkpoint.x) - 8 };
    const tex = ensurePlayerTextures(this, Profile.get().skin, this.state.armor);
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y, tex);
  }

  createColliders() {
    const p = this.physics;
    this.playerTiles = p.add.collider(this.player, this.layer, (pl, tile) => this.checkTileContact(tile));
    this.playerWalls = p.add.collider(this.player, this.runeWalls, (pl, wall) => this.hitRuneWall(wall));
    p.add.collider(this.enemies, this.layer, null, e => e.collidesWithTiles);
    p.add.collider(this.enemies, this.runeWalls, null, e => e.collidesWithTiles);
    p.add.collider(this.pickups, this.layer);
    p.add.collider(this.bombs, this.layer);
    p.add.collider(this.bombs, this.runeWalls);
    [this.playerProjectiles, this.enemyProjectiles].forEach(g => {
      p.add.collider(g, this.layer, proj => proj.impact());
      p.add.collider(g, this.runeWalls, proj => proj.impact());
    });

    p.add.overlap(this.player, this.enemies, (pl, e) => this.touchEnemy(e));
    p.add.overlap(this.player, this.enemyProjectiles, (pl, proj) => {
      if (!proj.active || this.player.isInvulnerable(this.time.now)) return;
      // Crouching ducks under flying shots. Falling rocks and ground tremors still hit.
      if (this.player.crouching && !proj.hitsLow) return;
      this.damagePlayer(proj.damage, proj.x);
      proj.impact();
    });
    p.add.overlap(this.playerProjectiles, this.enemies, (proj, e) => {
      if (!proj.active || e.dying) return;
      if (proj.pierce) {
        if (proj.hits.has(e)) return;
        proj.hits.add(e);
        e.hurt(proj.damage, proj.dir, proj.knockback);
        return;
      }
      e.hurt(proj.damage, proj.dir, proj.knockback);
      proj.impact();
    });
    p.add.overlap(this.bombs, this.enemies, (bomb, e) => {
      if (!e.dying && !(e.isBoss && !e.awake)) bomb.explode();
    });
    p.add.overlap(this.player, this.pickups, (pl, item) => this.collect(item));
    p.add.overlap(this.player, this.chest, () => {
      if (this.chestReady) this.reachChest();
    });
    if (this.portal) p.add.overlap(this.player, this.portal, () => this.enterPortal());
  }

  // ------------------------------------------------- platform death rule

  // Called for every tile the player is separated from. Landing on top is
  // safe; touching a tile from the side or from below kills the player.
  // Clipping just the corner of a tile bounces you off instead.
  checkTileContact(tile) {
    if (this.dead || this.completing) return;
    const pl = this.player;
    const b = pl.body;
    const top = tile.pixelY;
    const bottom = top + TILE;
    const left = tile.pixelX;
    const right = left + TILE;
    const getTile = (dx, dy) => this.layer.getTileAt(tile.x + dx, tile.y + dy);
    const above = getTile(0, -1);
    const below = getTile(0, 1);

    if (b.bottom <= top + 1) return;              // standing on top: safe

    if (b.top >= bottom - 1) {                    // hit from below
      // Only the edge of your head clipped an outer corner: bounce away.
      const overlap = Math.min(b.right, right) - Math.max(b.left, left);
      const dir = b.center.x < left + TILE / 2 ? -1 : 1;
      if (overlap <= 4 && !getTile(dir, 0)) {
        pl.bounce(dir * 120, 80);
        return;
      }
      this.killPlayer();
      return;
    }

    // Side contact. Forgive clipping just the top corner of a ledge (a few
    // pixels short of landing) by popping the player up onto it.
    if (!above && b.bottom - top <= 5 && b.velocity.y >= -60) {
      b.y = top - b.height;
      b.velocity.y = 0;
      return;
    }
    // A little deeper than that, or the bottom corner of a floating stone:
    // bounce back off the corner.
    const away = b.center.x < left + TILE / 2 ? -1 : 1;
    if ((!above && b.bottom - top <= 10) || (!below && bottom - b.top <= 6)) {
      pl.bounce(away * PLAYER_CFG.bounceSpeed, !above && b.bottom - top <= 10 ? -220 : 60);
      return;
    }
    this.killPlayer();
  }

  hitRuneWall(wall) {
    if (this.dead || this.completing) return;
    const b = this.player.body;
    if (b.bottom <= wall.body.top + 1) return;    // standing on top is fine
    const dir = this.player.x < wall.x ? -1 : 1;
    this.player.bounce(dir * PLAYER_CFG.bounceSpeed, -150);
    const r = RUNES[wall.rune];
    this.message(wall.x, wall.y - 14, 'NEEDS THE ' + r.name, r.color);
  }

  // ---------------------------------------------------------------- update

  update(time) {
    const k = this.keys;
    if (Phaser.Input.Keyboard.JustDown(k.esc) && !this.dead && !this.completing) {
      Sfx.play('pause');
      this.scene.launch('PauseScene');
      this.scene.bringToTop('PauseScene');
      this.scene.pause();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(k.shaders)) {
      Shaders.toggle();
      Shaders.apply(this);
      this.floatText(this.player.x, this.player.y - 20, Shaders.label(), 0xffffff);
    }
    if (!this.dead && !this.completing) {
      this.updateWeaponKeys();
      this.updatePowers(time);
    }

    this.player.update(time, k);
    this.updateMelee(time);
    this.updateCamera();
    this.updateSecrets(time);
    this.updateBossTrigger(time);

    if (this.inBonus && !this.completing) {
      if (!this.bonusEndsAt) this.bonusEndsAt = time + this.level.timeLimit * 1000;
      if (time > this.bonusEndsAt) this.finishBonus(false);
    }
    if (!this.dead && this.player.body.top > this.worldH) this.killPlayer();
  }

  updateCamera() {
    const cam = this.cameras.main;
    if (!this.dead) {
      const target = this.player.x - cam.width * 0.4;
      let scroll = Math.max(cam.scrollX, target);
      // During a boss fight the camera settles on the arena.
      if (this.bossStarted) scroll = Math.max(scroll, cam.scrollX + (this.arena.left - cam.scrollX) * 0.08);
      cam.scrollX = Phaser.Math.Clamp(scroll, 0, this.worldW - cam.width);

      // The player can't walk back past the camera's left edge, or off the right end.
      const b = this.player.body;
      if (b.left < cam.scrollX) {
        this.player.x += cam.scrollX - b.left;
        if (b.velocity.x < 0) b.setVelocityX(0);
      }
      if (b.right > this.worldW) {
        this.player.x -= b.right - this.worldW;
        if (b.velocity.x > 0) b.setVelocityX(0);
      }
    }
    this.bgFar.tilePositionX = cam.scrollX * 0.15;
    this.bgNear.tilePositionX = cam.scrollX * 0.4;
  }

  updateSecrets(time) {
    const pb = this.player.body;
    const pr = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);
    this.secrets.forEach(s => {
      const inside = Phaser.Geom.Intersects.RectangleToRectangle(s.rect, pr);
      if (inside && !s.found) {
        s.found = true;
        Sfx.play('secret');
        this.addScore(50, s.rect.centerX, s.rect.y - 6);
        this.floatText(s.rect.centerX, s.rect.y - 16, 'SECRET!', 0xffe080);
      }
      s.alpha += ((inside ? 0.3 : 1) - s.alpha) * 0.2;
      s.images.forEach(img => img.setAlpha(s.alpha));
    });
    // A faint sparkle hints at undiscovered fake walls.
    if (time > this.nextSparkle) {
      this.nextSparkle = time + 700;
      const hidden = this.secrets.filter(s => !s.found);
      if (hidden.length) {
        const s = Phaser.Utils.Array.GetRandom(hidden);
        this.fx('spark', s.rect.x + Math.random() * s.rect.width, s.rect.y + Math.random() * s.rect.height, 1);
      }
    }
  }

  updateWeaponKeys() {
    for (const [key, w] of this.weaponKeys) {
      if (!Phaser.Input.Keyboard.JustDown(key)) continue;
      if (!this.state.owned.includes(w)) {
        Sfx.play('error');
        this.message(this.player.x, this.player.y - 14, 'NO ' + WEAPONS[w].name, 0xff8080);
      } else if (this.state.weapon !== w) {
        this.state.weapon = w;
        Sfx.play('select');
        this.floatText(this.player.x, this.player.y - 14, WEAPONS[w].name, 0xffffff);
      }
    }
  }

  // ---------------------------------------------------------- superpowers

  updatePowers(time) {
    const k = this.keys;
    const JustDown = Phaser.Input.Keyboard.JustDown;
    if (JustDown(k.powerEarth)) this.usePower('earth', time);
    if (JustDown(k.powerCrystal)) this.usePower('crystal', time);
    if (JustDown(k.powerShadow)) this.usePower('shadow', time);
  }

  usePower(rune, time) {
    const def = RUNES[rune];
    const pl = this.player;
    if (!this.state.runes.includes(rune)) {
      Sfx.play('error');
      this.message(pl.x, pl.y - 14, 'FIND THE ' + def.name, 0xff8080);
      return;
    }
    if (time < this.powerReady[rune]) {
      Sfx.play('error');
      return;
    }
    this.powerReady[rune] = time + def.cooldown;
    Sfx.play('power');
    this.floatText(pl.x, pl.y - 18, def.power, def.color);

    if (rune === 'earth') {
      pl.stoneUntil = time + def.duration;
      this.fx('rock', pl.x, pl.y, 16);
      this.cameras.main.shake(150, 0.006);
    } else if (rune === 'crystal') {
      const damage = def.damage + GameState.bonuses(this.state).power;
      for (let i = 0; i < def.shards; i++) {
        const a = (i / def.shards) * Math.PI * 2;
        new Projectile(this, pl.x, pl.body.center.y, {
          group: this.playerProjectiles,
          texture: 'shard',
          dir: Math.cos(a) < 0 ? -1 : 1,
          vx: Math.cos(a) * 260,
          vy: Math.sin(a) * 260,
          rotate: true,
          pierce: true,
          trail: 'crystal',
          damage,
          knockback: 120,
          lifetime: 650,
        });
      }
    } else if (rune === 'shadow') {
      const view = this.cameras.main.worldView;
      this.cameras.main.flash(350, 140, 60, 220);
      this.cameras.main.shake(300, 0.012);
      this.enemyProjectiles.getChildren().slice().forEach(p => p.impact());
      this.enemies.getChildren().slice().forEach(e => {
        if (e.active && !e.dying && view.contains(e.x, e.y)) {
          this.fx('shadow', e.x, e.y, 10);
          e.hurt(def.damage, e.x < pl.x ? -1 : 1, 200);
        }
      });
    }
  }

  // ---------------------------------------------------------------- combat

  touchEnemy(e) {
    if (e.dying || e.untouchable || (e.isBoss && !e.awake)) return;
    const time = this.time.now;
    if (this.player.stoneActive(time)) {
      // Stone Skin: enemies you touch get hurt instead.
      if (!e.stoneHitAt || time > e.stoneHitAt) {
        e.stoneHitAt = time + 400;
        e.hurt(2, e.x < this.player.x ? -1 : 1, 160);
      }
      return;
    }
    this.damagePlayer(e.def.damage, e.x);
  }

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
    // Melee swings also knock enemy shots out of the air.
    this.enemyProjectiles.getChildren().slice().forEach(proj => {
      if (proj.active && overlaps(proj)) proj.impact();
    });
  }

  fireWeapon(weapon, damage) {
    const f = this.player.facing;
    const x = this.player.x + f * 8;
    const y = this.player.body.center.y + 1;
    if (weapon.style === 'bomb') {
      new Bomb(this, x, y - 2, f, weapon, damage);
      return;
    }
    const opts = {
      group: this.playerProjectiles,
      texture: weapon.projectile,
      dir: f,
      speed: weapon.speed,
      damage,
      knockback: weapon.knockback,
      lifetime: weapon.lifetime,
      trail: weapon.projectile === 'fireball',
    };
    if (weapon.style === 'thrown') Object.assign(opts, { vy: weapon.lift, gravity: weapon.gravity, spin: f * 900, pierce: weapon.pierce });
    new Projectile(this, x, y, opts);
  }

  // Bomb blast: hurts every enemy in range and destroys enemy shots.
  explode(x, y, radius, damage, knockback) {
    Sfx.play('explosion');
    this.cameras.main.shake(200, 0.012);
    this.fx('fire', x, y, 24);
    this.fx('smoke', x, y, 12);
    this.fx('spark', x, y, 10);
    const ring = this.add.circle(x, y, 4, 0xffcd3a, 0.8).setDepth(19);
    this.tweens.add({ targets: ring, scale: radius / 4, alpha: 0, duration: 250, onComplete: () => ring.destroy() });
    this.enemies.getChildren().slice().forEach(e => {
      if (!e.active || e.dying) return;
      if (Phaser.Math.Distance.Between(x, y, e.x, e.y) <= radius + e.body.width / 2) e.hurt(damage, e.x < x ? -1 : 1, knockback);
    });
    this.enemyProjectiles.getChildren().slice().forEach(p => {
      if (Phaser.Math.Distance.Between(x, y, p.x, p.y) <= radius) p.impact();
    });
  }

  damagePlayer(amount, fromX) {
    const time = this.time.now;
    if (this.completing || this.player.isInvulnerable(time)) return;
    const s = this.state;
    // Armor's shield hearts soak up damage first.
    const absorbed = Math.min(s.armorHp, amount);
    s.armorHp -= absorbed;
    s.hp = Math.max(0, s.hp - (amount - absorbed));
    if (absorbed > 0) {
      Sfx.play('armor');
      this.fx('crystal', this.player.x, this.player.y, 8);
    } else {
      this.fx('blood', this.player.x, this.player.y, 8);
    }
    if (s.hp <= 0) {
      this.killPlayer();
      return;
    }
    if (absorbed < amount) Sfx.play('hurt');
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
    this.playerWalls.active = false;
    this.player.anims.stop();
    this.player.setTexture(this.player.tex + '_jump').setTint(0xff6060).setAlpha(1);
    this.player.body.setAllowGravity(true);
    this.player.body.setVelocity(0, -240);
    this.tweens.add({ targets: this.player, angle: 180 * -this.player.facing, duration: 600 });

    const cp = this.registry.get('checkpoint');
    const atBoss = cp && cp.level === this.levelIndex && !this.inBonus;
    this.banner('YOU DIED', atBoss ? 'BACK TO THE BOSS...' : 'BACK TO THE START...', 1400);
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        // Respawn with the state from when the level (or boss fight) began.
        this.registry.set('state', GameState.clone(this.registry.get('levelStart')));
        this.scene.restart();
      });
    });
  }

  dropLoot(enemy) {
    const d = enemy.def;
    const between = range => (range ? Phaser.Math.Between(range[0], range[1]) : 0);
    const n = between(d.coins);
    for (let i = 0; i < n; i++) new Pickup(this, enemy.x, enemy.y - 4, 'coin', { dropped: true });
    const gems = between(d.gems);
    for (let i = 0; i < gems; i++) new Pickup(this, enemy.x, enemy.y - 4, 'gem', { dropped: true });
    if (Math.random() < d.potionChance) new Pickup(this, enemy.x, enemy.y - 4, 'potion', { dropped: true });
  }

  // ------------------------------------------------------------------ boss

  updateBossTrigger(time) {
    if (!this.boss || this.bossStarted || this.dead || this.completing) return;
    if (this.player.x > this.arena.left + 40) this.startBoss(time);
  }

  startBoss(time) {
    this.bossStarted = true;
    this.boss.activate(time);
    Sfx.play('bossRoar');
    this.cameras.main.shake(400, 0.01);
    this.banner(this.boss.def.name, 'BOSS FIGHT!', 1600);
    this.registry.set('checkpoint', { level: this.levelIndex, x: this.arena.left + 24 });
    this.registry.set('levelStart', GameState.clone(this.state));
    this.updateBossBar();
  }

  updateBossBar() {
    const b = this.boss;
    const show = b && b.active && !b.dying && this.bossStarted;
    this.registry.set('boss', show ? { name: b.def.name, hp: Math.max(0, b.hp), max: b.maxHp } : null);
  }

  onBossDefeated(boss) {
    this.registry.set('boss', null);
    this.registry.set('checkpoint', null);
    // Minions vanish with their master.
    this.enemies.getChildren().slice().forEach(e => {
      if (e !== boss && e.active && !e.dying) e.die();
    });
    this.enemyProjectiles.getChildren().slice().forEach(p => p.impact());
    this.time.delayedCall(1800, () => {
      if (!this.chest || this.dead) return;
      // The chest drops out of the sky.
      const y = this.chest.y;
      this.chest.setVisible(true).setY(y - 180);
      this.tweens.add({
        targets: this.chest, y, duration: 700, ease: 'Bounce.out',
        onComplete: () => { this.chestReady = true; },
      });
      Sfx.play('weapon');
      this.banner('VICTORY!', 'THE TREASURE AWAITS', 1600);
    });
  }

  // --------------------------------------------------------------- pickups

  collect(item) {
    if (!item.active || this.dead) return;
    const s = this.state;
    switch (item.kind) {
      case 'coin':
        Sfx.play('coin');
        s.gold += 1;
        this.addScore(10);
        this.fx('gold', item.x, item.y, 4);
        break;
      case 'gem':
        Sfx.play('gem');
        s.gold += 5;
        this.addScore(50);
        this.floatText(item.x, item.y - 8, '+5 GOLD', 0x80e0ff);
        this.fx('crystal', item.x, item.y, 8);
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
      case 'rune':
        this.collectRune(item.rune, item.x, item.y);
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

  collectRune(rune, x, y) {
    const def = RUNES[rune];
    if (!this.state.runes.includes(rune)) this.state.runes.push(rune);
    Sfx.play('rune');
    this.fx('gold', x, y, 20);
    this.fx(rune === 'earth' ? 'goo' : rune === 'crystal' ? 'crystal' : 'shadow', x, y, 20);
    this.cameras.main.flash(250, 255, 255, 255);
    this.addScore(200);
    this.banner(def.name + ' FOUND!', `SUPERPOWER ${def.power} - PRESS ${def.key}`, 2400);
  }

  addScore(points, x, y) {
    this.state.score += points;
    if (x !== undefined) this.floatText(x, y, '+' + points, 0xffcd3a);
  }

  // ------------------------------------------------------------ level end

  reachChest() {
    if (this.completing || this.dead) return;
    if (this.inBonus) {
      this.finishBonus(true);
      return;
    }
    this.completing = true;
    this.player.frozen = true;
    this.melee = null;
    this.chest.setTexture('chest_open');
    Sfx.play('chest');
    this.fx('gold', this.chest.x, this.chest.y - 6, 30);
    this.cameras.main.shake(150, 0.005);
    this.addScore(100 * (this.levelIndex + 1), this.chest.x, this.chest.y - 20);
    this.registry.set('checkpoint', null);

    const next = this.levelIndex + 1;
    if (next >= LEVELS.length) {
      SaveManager.clear();
      SaveManager.setBest(this.state.score);
      this.banner('TREASURE FOUND!', 'THE DARK DRAGON IS DEFEATED', 1800);
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
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.stop('UIScene');
          this.scene.start('ShopScene');
        });
      });
    }
  }

  // The portal in Crystal Cave leads to the bonus level (needs the Earth Rune).
  enterPortal() {
    if (this.completing || this.dead) return;
    if (!this.state.runes.includes('earth')) {
      this.message(this.portal.x, this.portal.y - 20, 'THE PORTAL NEEDS THE EARTH RUNE', RUNES.earth.color);
      return;
    }
    this.completing = true;
    this.player.frozen = true;
    this.melee = null;
    this.player.body.setAllowGravity(false);
    this.player.body.setVelocity(0, 0);
    Sfx.play('portal');
    this.tweens.add({ targets: this.player, x: this.portal.x, y: this.portal.y, scale: 0, angle: 360, duration: 600 });
    this.time.delayedCall(700, () => {
      this.cameras.main.fadeOut(400, 180, 76, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.state.inBonus = true;
        this.scene.restart();
      });
    });
  }

  finishBonus(found) {
    if (this.completing) return;
    this.completing = true;
    this.player.frozen = true;
    this.melee = null;
    const s = this.state;
    if (found) {
      this.chest.setTexture('chest_open');
      Sfx.play('chest');
      this.fx('gold', this.chest.x, this.chest.y - 6, 30);
      s.gold += 25;
      this.addScore(500, this.chest.x, this.chest.y - 20);
    } else {
      Sfx.play('pause');
    }
    s.inBonus = false;
    s.bonusDone = true;
    SaveManager.save(s);
    this.banner(found ? 'BONUS CLEARED!' : "TIME'S UP!", 'BACK TO ' + LEVELS[s.level].name.toUpperCase(), 1800);
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
    });
  }

  // ------------------------------------------------------------- text fx

  floatText(x, y, str, tint) {
    const t = pixelText(this, x, y, str, { tint, origin: 0.5 }).setDepth(30);
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 800, ease: 'Cubic.out', onComplete: () => t.destroy() });
  }

  // Like floatText, but at most once every 1.2 seconds (for repeated bumps).
  message(x, y, str, tint) {
    if (this.time.now < this.msgAt) return;
    this.msgAt = this.time.now + 1200;
    this.floatText(x, y, str, tint);
  }

  banner(title, subtitle, duration) {
    const cx = this.scale.width / 2;
    const items = [pixelText(this, cx, 96, title, { scale: 2, origin: 0.5, tint: 0xffe080 })];
    if (subtitle) items.push(pixelText(this, cx, 118, subtitle, { origin: 0.5 }));
    items.forEach(t => t.setScrollFactor(0).setDepth(100));
    this.tweens.add({ targets: items, alpha: 0, delay: duration, duration: 400, onComplete: () => items.forEach(t => t.destroy()) });
  }
}
