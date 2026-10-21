# AG1

A side-scrolling pixel-art platformer that runs in a web browser with no internet connection.
Run right, collect weapons and items, fight slimes, bats and skeleton archers, and reach the
treasure chest at the end of each of the three levels.

## How to run

**Option 1: open the file.** Double-click `index.html` (or drag it into a browser window).

**Option 2: local server (use this if option 1 shows a blank screen or saving doesn't work).**
Some browsers restrict pages opened from `file://`. From this folder, run:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser. Stop the server with `Ctrl+C`.

Everything the game needs is in this folder. Phaser 3 is included as `lib/phaser.min.js`, and
all graphics and sounds are generated in code, so no network connection is ever needed.

## Controls

| Key | Action |
| --- | --- |
| Left / Right arrows | Move |
| Space | Jump (only while standing on something). Release early for a shorter jump. |
| F or J | Attack with the equipped weapon (hold to keep attacking) |
| Esc | Pause (in the pause menu, Q quits to the main menu) |
| Up / Down arrows | Reserved, do nothing in game yet (they move the cursor in the main menu) |

## Rules

- **Platforms are deadly from the side and from below.** Landing on top of ground or a platform is
  safe. Walking into a wall, bumping your head on a ceiling, or falling into a pit kills you.
- Dying sends you back to the start of the level with the stats you had when the level began.
- After taking damage you are invincible for about one second.
- Touching the treasure chest completes the level and saves your progress.

## Weapons

Picking up a weapon equips it. The first time you pick up each weapon you also get a permanent
upgrade that stays after you switch weapons.

| Weapon | Style | Damage | Upgrade |
| --- | --- | --- | --- |
| Dagger | Fast melee | 1 | +Speed (you start with it) |
| Sword | Medium melee | 2 | +1 max HP |
| Hammer | Slow melee, big knockback | 4 | +1 power (all weapons) |
| Bow | Arrows | 2 | +1 max HP |
| Fire Wand | Fireballs, short cooldown | 3 | +10% attack speed |

Melee swings also knock enemy arrows out of the air.

## Items and enemies

- Gold coin: +10 score. Health potion: heals 3 HP. Heart container: +5 max HP.
- Slime (2 HP) patrols platforms. Bat (1 HP) flies in a wave and swoops at you. Skeleton Archer
  (3 HP) stands still and fires arrows when you are in range.
- Enemies drop coins and sometimes a potion.

## Saving

Progress is saved to the browser's `localStorage` when you finish a level: current level, max HP,
equipped weapon, owned weapons and score. The main menu shows **Continue** when a save exists.
Beating level 3 clears the save and records your best score.

## Project layout

```
index.html            loads Phaser and the game scripts
lib/phaser.min.js     Phaser 3.80.1 (local copy)
src/main.js           Phaser config, scene registration
src/data/             weapons.js, enemies.js, levels.js (all tunable data)
src/scenes/           Boot (generates textures), Menu, Game, UI (HUD), Pause, Win
src/entities/         Player, Enemy (+ Slime, Bat, Skeleton), Projectile, Pickup
src/systems/          SaveManager (state + localStorage), Sound (Web Audio synth)
```

Levels are described in `src/data/levels.js` as ground segments, platforms and entity positions,
which are turned into a grid of characters (see the legend at the top of that file).
