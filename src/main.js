// Phaser config and scene registration.
const config = {
  type: Phaser.AUTO,   // WebGL when available (needed for shaders), Canvas otherwise
  parent: 'game',
  width: 480,          // 30 tiles
  height: 272,         // 17 tiles
  backgroundColor: '#0b0b14',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 1000 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  audio: { noAudio: true },   // sound effects use our own Web Audio synth
  scene: [BootScene, MenuScene, GameScene, UIScene, PauseScene, ShopScene, WinScene, NameEntryScene, LeaderboardScene],
};

window.game = new Phaser.Game(config);
