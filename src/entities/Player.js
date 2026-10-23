const PLAYER_CFG = {
  runSpeed: 118,
  jumpVelocity: -350,   // ~4 tiles high
  airJumpVelocity: -310, // double jump, a little weaker
  jumpCut: 0.45,        // releasing Up early cuts the jump short
  jumpBuffer: 110,      // ms a jump press is remembered before landing
  coyoteTime: 80,       // ms after walking off a ledge that still counts as on the ground
  invulnerable: 1000,   // ms of invincibility after taking damage
  hurtStun: 200,
  crouchSpeed: 0.35,    // fraction of run speed while crouching
  dashSpeed: 330,
  dashTime: 160,        // ms; you can't be hurt while dashing
  dashCooldown: 700,
  bounceSpeed: 170,     // sideways speed when bouncing off a corner or rune wall
};

class Player extends Phaser.Physics.Arcade.Sprite {
  // tex: texture prefix from ensurePlayerTextures() (skin + armor).
  constructor(scene, x, y, tex) {
    super(scene, x, y, tex + '_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.tex = tex;
    this.body.setSize(8, 14).setOffset(2, 1);
    this.body.setMaxVelocity(400, 520);
    this.setDepth(10);

    this.facing = 1;
    this.dead = false;
    this.frozen = false;
    this.invulnUntil = 0;
    this.stunUntil = 0;
    this.nextAttack = 0;
    this.attackPoseUntil = 0;
    this.jumpPressedAt = -10000;
    this.jumping = false;
    this.jumpsUsed = 0;
    this.lastOnFloor = 0;
    this.crouching = false;
    this.dashing = false;
    this.dashUntil = 0;
    this.nextDash = 0;
    this.nextGhost = 0;
    this.airDashUsed = false;
    this.stoneUntil = 0;
  }

  get state() { return this.scene.state; }

  canBeTargeted() { return !this.dead && !this.frozen; }

  stoneActive(time) { return time < this.stoneUntil; }

  update(time, keys) {
    if (this.dead) return;
    const body = this.body;
    const onFloor = body.blocked.down;
    const JustDown = Phaser.Input.Keyboard.JustDown;

    if (this.frozen) {
      if (this.dashing) this.endDash();
      body.setVelocityX(0);
      this.setAlpha(1);
      this.showFrame(onFloor, false, time);
      return;
    }

    const bonus = GameState.bonuses(this.state);

    if (onFloor) {
      this.lastOnFloor = time;
      this.jumpsUsed = 0;
      this.airDashUsed = false;
    } else if (this.jumpsUsed === 0 && time - this.lastOnFloor > PLAYER_CFG.coyoteTime) {
      this.jumpsUsed = 1;   // walked off a ledge: the ground jump is gone
    }

    // Dash (D): a quick burst in the direction you face. Once per air time.
    if (this.dashing && time >= this.dashUntil) this.endDash();
    if (!this.dashing && JustDown(keys.dash) && time >= this.nextDash && time >= this.stunUntil
        && (onFloor || !this.airDashUsed)) {
      this.startDash(time, keys, onFloor);
    }
    if (this.dashing) {
      body.setVelocity(this.facing * PLAYER_CFG.dashSpeed, 0);
      if (time > this.nextGhost) this.ghost(time);
      this.setFlipX(this.facing < 0);
      this.showFrame(onFloor, true, time);
      return;
    }

    // Crouch (Down): only on the ground. Flying shots pass over you.
    this.setCrouch(keys.down.isDown && onFloor);

    let move = 0;
    if (keys.left.isDown) move -= 1;
    if (keys.right.isDown) move += 1;
    if (time >= this.stunUntil) {
      const speed = (PLAYER_CFG.runSpeed + bonus.speed) * (this.crouching ? PLAYER_CFG.crouchSpeed : 1);
      body.setVelocityX(move * speed);
      if (move !== 0) this.facing = move;
    }
    this.setFlipX(this.facing < 0);

    // Jump (Up). A press just before landing still counts. In the air, a
    // press uses one of your extra jumps (double jump, triple with the upgrade).
    const canGroundJump = onFloor || (this.jumpsUsed === 0 && time - this.lastOnFloor <= PLAYER_CFG.coyoteTime);
    if (JustDown(keys.up)) {
      if (!canGroundJump && this.jumpsUsed > 0 && this.jumpsUsed < GameState.maxJumps(this.state)) {
        this.jumpsUsed++;
        body.setVelocityY(PLAYER_CFG.airJumpVelocity);
        this.jumping = true;
        this.jumpPressedAt = -10000;
        this.scene.fx('spark', this.x, body.bottom, 6);
        Sfx.play('doubleJump');
      } else {
        this.jumpPressedAt = time;
      }
    }
    if (canGroundJump && time - this.jumpPressedAt <= PLAYER_CFG.jumpBuffer) {
      this.setCrouch(false);
      body.setVelocityY(PLAYER_CFG.jumpVelocity);
      this.jumpPressedAt = -10000;
      this.jumpsUsed = 1;
      this.jumping = true;
      Sfx.play('jump');
    }
    if (this.jumping && !keys.up.isDown && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER_CFG.jumpCut);
      this.jumping = false;
    }
    if (body.velocity.y >= 0) this.jumping = false;

    // Attack (hold to keep attacking at the weapon's rate).
    if ((keys.attack.isDown || keys.attack2.isDown) && time >= this.nextAttack) this.attack(time, bonus);

    // Flicker while invincible; grey while Stone Skin is on.
    this.setAlpha(time < this.invulnUntil && Math.floor(time / 70) % 2 ? 0.3 : 1);
    if (this.stoneActive(time)) this.setTint(0xb8a888);
    else this.clearTint();
    this.showFrame(onFloor, move !== 0, time);
  }

  setCrouch(on) {
    if (on === this.crouching) return;
    this.crouching = on;
    if (on) this.body.setSize(8, 9).setOffset(2, 6);
    else this.body.setSize(8, 14).setOffset(2, 1);
  }

  startDash(time, keys, onFloor) {
    if (keys.left.isDown !== keys.right.isDown) this.facing = keys.left.isDown ? -1 : 1;
    this.setCrouch(false);
    this.dashing = true;
    this.dashUntil = time + PLAYER_CFG.dashTime;
    this.nextDash = this.dashUntil + GameState.dashCooldown(this.state);
    if (!onFloor) this.airDashUsed = true;
    this.jumping = false;
    this.body.setAllowGravity(false);
    Sfx.play('dash');
  }

  endDash() {
    this.dashing = false;
    this.body.setAllowGravity(true);
    this.body.setVelocityX(this.body.velocity.x * 0.4);
  }

  // Fading after-image left behind while dashing.
  ghost(time) {
    this.nextGhost = time + 30;
    const g = this.scene.add.image(this.x, this.y, this.texture.key).setFlipX(this.flipX)
      .setAlpha(0.5).setTintFill(0x80c8ff).setDepth(9);
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
  }

  // Knocked back by a corner or a locked rune wall (harmless).
  bounce(vx, vy) {
    if (this.dashing) this.endDash();
    this.body.setVelocity(vx, vy);
    this.stunUntil = this.scene.time.now + 180;
    this.jumping = false;
    Sfx.play('bounce');
  }

  attack(time, bonus) {
    const w = WEAPONS[this.state.weapon];
    this.nextAttack = time + w.cooldown * (1 - bonus.haste);
    this.attackPoseUntil = time + 120;
    const damage = w.damage + bonus.power;
    if (w.style === 'melee') this.scene.startMelee(w, damage);
    else this.scene.fireWeapon(w, damage);
    Sfx.play(w.sfx);
  }

  showFrame(onFloor, moving, time) {
    let key;
    if (this.dashing) key = 'dash';
    else if (this.crouching) key = 'crouch';
    else if (time < this.attackPoseUntil) key = 'attack';
    else if (!onFloor) key = 'jump';
    else if (moving) key = 'run';
    if (key === 'run') {
      this.play(this.tex + '_run', true);
    } else {
      if (this.anims.isPlaying) this.anims.stop();
      this.setTexture(this.tex + '_' + (key || 'idle'));
    }
  }

  isInvulnerable(time) {
    return this.dead || this.frozen || this.dashing || time < this.invulnUntil || this.stoneActive(time);
  }

  // Knockback and invincibility after a hit. HP is handled by the scene.
  onHurt(time, fromX) {
    this.invulnUntil = time + PLAYER_CFG.invulnerable;
    this.stunUntil = time + PLAYER_CFG.hurtStun;
    const dir = this.x < fromX ? -1 : 1;
    this.setCrouch(false);
    this.body.setVelocity(dir * 110, -160);
    this.jumping = false;
  }
}
