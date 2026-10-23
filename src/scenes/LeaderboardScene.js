// Type three letters for the leaderboard.
// data: { score, result, title }
class NameEntryScene extends Phaser.Scene {
  constructor() { super('NameEntryScene'); }

  create(data) {
    const W = this.scale.width, H = this.scale.height;
    this.data_ = data;
    this.letters = ['A', 'A', 'A'];
    this.pos = 0;
    this.done = false;
    this.add.image(0, 0, 'sky_2').setOrigin(0).setDisplaySize(W, H);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.5).setOrigin(0);

    pixelText(this, W / 2, 40, data.title || 'NEW HIGH SCORE!', { scale: 3, origin: 0.5, tint: 0xffcd3a });
    pixelText(this, W / 2, 72, 'SCORE ' + data.score, { scale: 2, origin: 0.5 });
    pixelText(this, W / 2, 100, 'ENTER YOUR NAME', { origin: 0.5, tint: 0xcccccc });

    this.slots = [0, 1, 2].map(i => pixelText(this, W / 2 - 40 + i * 40, 140, 'A', { scale: 4, origin: 0.5 }));
    this.underline = this.add.rectangle(0, 162, 26, 3, 0xffcd3a);
    pixelText(this, W / 2, 200, 'TYPE A LETTER, OR UP/DOWN TO CHANGE IT', { origin: 0.5, tint: 0xaaaaaa });
    pixelText(this, W / 2, 214, 'LEFT/RIGHT TO MOVE   ENTER TO SAVE', { origin: 0.5, tint: 0xaaaaaa });

    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const kb = this.input.keyboard;
    const step = d => {
      const i = CHARS.indexOf(this.letters[this.pos]);
      this.letters[this.pos] = CHARS[(i + d + CHARS.length) % CHARS.length];
      Sfx.play('select');
      this.refresh();
    };
    kb.on('keydown-UP', () => step(1));
    kb.on('keydown-DOWN', () => step(-1));
    kb.on('keydown-LEFT', () => { this.pos = Math.max(0, this.pos - 1); this.refresh(); });
    kb.on('keydown-RIGHT', () => { this.pos = Math.min(2, this.pos + 1); this.refresh(); });
    kb.on('keydown-BACKSPACE', () => { this.pos = Math.max(0, this.pos - 1); this.refresh(); });
    kb.on('keydown', e => {
      const ch = (e.key || '').toUpperCase();
      if (ch.length === 1 && CHARS.includes(ch)) {
        this.letters[this.pos] = ch;
        this.pos = Math.min(2, this.pos + 1);
        Sfx.play('select');
        this.refresh();
      }
    });
    kb.on('keydown-ENTER', () => this.submit());
    this.refresh();
    Shaders.apply(this);
  }

  refresh() {
    this.slots.forEach((t, i) => t.setText(this.letters[i]).setTint(i === this.pos ? 0xffffff : 0x9a9a9a));
    this.underline.setX(this.slots[this.pos].x);
  }

  submit() {
    if (this.done) return;
    this.done = true;
    Sfx.play('confirm');
    const rank = Leaderboard.add(this.letters.join(''), this.data_.score, this.data_.result);
    this.scene.start('LeaderboardScene', { highlight: rank });
  }
}

// Top 10 scores on this computer.
class LeaderboardScene extends Phaser.Scene {
  constructor() { super('LeaderboardScene'); }

  create(data = {}) {
    const W = this.scale.width, H = this.scale.height;
    this.add.image(0, 0, 'sky_2').setOrigin(0).setDisplaySize(W, H);
    this.add.tileSprite(0, 0, W, H, 'bg_far_2').setOrigin(0);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0);
    pixelText(this, W / 2, 22, 'LEADERBOARD', { scale: 3, origin: 0.5, tint: 0xffcd3a });

    const cols = [60, 110, 250, 330];
    ['RANK', 'NAME', 'SCORE', 'RESULT'].forEach((h, i) => pixelText(this, cols[i], 50, h, { tint: 0x9a9a9a }));
    const list = Leaderboard.list();
    if (!list.length) pixelText(this, W / 2, 120, 'NO SCORES YET. BE THE FIRST!', { origin: 0.5 });
    list.forEach((e, i) => {
      const y = 66 + i * 16;
      const tint = i === data.highlight ? 0xffcd3a : (i < 3 ? 0xffffff : 0xcccccc);
      const row = [
        pixelText(this, cols[0], y, String(i + 1), { tint }),
        pixelText(this, cols[1], y, e.name, { tint }),
        pixelText(this, cols[2], y, String(e.score), { tint }),
        pixelText(this, cols[3], y, e.result || '', { tint }),
      ];
      if (i === data.highlight) this.tweens.add({ targets: row, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });
    });
    pixelText(this, W / 2, 252, 'PRESS ENTER', { origin: 0.5 });

    Shaders.apply(this);
    this.cameras.main.fadeIn(300);
    this.time.delayedCall(300, () => {
      ['ENTER', 'ESC', 'SPACE'].forEach(k => this.input.keyboard.once('keydown-' + k, () => this.leave()));
    });
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    Sfx.play('confirm');
    this.scene.start('MenuScene');
  }
}
