const PLAYER_CFG = {
  runSpeed: 118,
  jumpVelocity: -350,   // ~4 tiles high
  jumpCut: 0.45,        // releasing Space early cuts the jump short
  jumpBuffer: 110,      // ms a Space press is remembered before landing
  invulnerable: 1000,   // ms of invincibility after taking damage
  hurtStun: 200,
};

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
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
  }

  get state() { return this.scene.state; }

  canBeTargeted() { return !this.dead && !this.frozen; }

  update(time, keys) {
    if (this.dead) return;
    const body = this.body;
    const onFloor = body.blocked.down;

    if (this.frozen) {
      body.setVelocityX(0);
      this.setAlpha(1);
      this.showFrame(onFloor, false, time);
      return;
    }

    const bonus = GameState.bonuses(this.state);

    // Left / Right. Up and Down are reserved and intentionally do nothing.
    let move = 0;
    if (keys.left.isDown) move -= 1;
    if (keys.right.isDown) move += 1;
    if (time >= this.stunUntil) {
      body.setVelocityX(move * (PLAYER_CFG.runSpeed + bonus.speed));
      if (move !== 0) this.facing = move;
    }
    this.setFlipX(this.facing < 0);

    // Jump: only from the ground. A press just before landing still counts.
    if (Phaser.Input.Keyboard.JustDown(keys.jump)) this.jumpPressedAt = time;
    if (onFloor && time - this.jumpPressedAt <= PLAYER_CFG.jumpBuffer) {
      body.setVelocityY(PLAYER_CFG.jumpVelocity);
      this.jumpPressedAt = -10000;
      this.jumping = true;
      Sfx.play('jump');
    }
    if (this.jumping && !keys.jump.isDown && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PLAYER_CFG.jumpCut);
      this.jumping = false;
    }
    if (body.velocity.y >= 0) this.jumping = false;

    // Attack (hold to keep attacking at the weapon's rate).
    if ((keys.atkF.isDown || keys.atkJ.isDown) && time >= this.nextAttack) this.attack(time, bonus);

    // Flicker while invincible.
    this.setAlpha(time < this.invulnUntil && Math.floor(time / 70) % 2 ? 0.3 : 1);
    this.showFrame(onFloor, move !== 0, time);
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
    if (time < this.attackPoseUntil) key = 'player_attack';
    else if (!onFloor) key = 'player_jump';
    else if (moving) key = 'player_run';
    if (key === 'player_run') {
      this.play('player_run', true);
    } else {
      if (this.anims.isPlaying) this.anims.stop();
      this.setTexture(key || 'player_idle');
    }
  }

  isInvulnerable(time) {
    return this.dead || this.frozen || time < this.invulnUntil;
  }

  // Knockback and invincibility after a hit. HP is handled by the scene.
  onHurt(time, fromX) {
    this.invulnUntil = time + PLAYER_CFG.invulnerable;
    this.stunUntil = time + PLAYER_CFG.hurtStun;
    const dir = this.x < fromX ? -1 : 1;
    this.body.setVelocity(dir * 110, -160);
    this.jumping = false;
  }
}
