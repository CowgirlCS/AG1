# AG1

A side-scrolling pixel-art platformer that runs in a web browser with no internet connection.
Run right, collect weapons, gold and runes, fight your way through four levels, beat the boss
guarding each treasure chest, and finally defeat The Dark Dragon.

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
| Up arrow | Jump. Press again in mid-air to double jump. Release early for a shorter jump. |
| Down arrow | Crouch. Flying shots pass over you; melee, falling rocks and shockwaves still hit. |
| Space (or J) | Attack with the equipped weapon (hold to keep attacking) |
| D | Dash. You can't be hurt while dashing. One dash per jump. |
| S / F / B / A / T / M | Switch to Sword / Fire Wand / Bow / Battle Axe / Throwing Axe / Bombs |
| 1 - 8 | Switch to any weapon you own, in weapon-bar order |
| Q / W / E | Rune superpowers (once you have found the rune) |
| V | Shaders on/off |
| Esc | Pause (in the pause menu, Q quits to the main menu) |

## Rules

- **Platforms are deadly from the side and from below.** Landing on top of ground or a platform is
  safe. Walking into a wall, bumping your head on a ceiling, or falling into a pit kills you.
  Clipping just the **corner** of a ledge or ceiling bounces you off instead.
- Dying sends you back to the start of the level with the stats you had when the level began.
  Once a boss fight has started, dying puts you back at the boss instead.
- After taking damage you are invincible for about one second.
- Each level ends in a boss arena. Beat the boss and the treasure chest drops from the sky.
- Touching the chest completes the level, saves your progress, and opens the shop.

## Levels and bosses

| Level | Boss |
| --- | --- |
| 1 Green Meadow | Grassy Golem: ground slams (jump the shockwaves), boulders, golemite helpers |
| 2 Crystal Cave | Crystal Crab: crystal shard sprays, charges (dizzy after hitting the wall), gem crabs |
| 3 Shadow Castle | The Mysterious Stranger: teleports, shadow daggers, dash strikes, ninja helpers |
| 4 Dragon's Peak | The Dark Dragon: fire breath, meteor showers, low swoops (jump or dash through) |

Bosses get faster and add attacks once they're below half health.

**Bonus level (Sky Vault):** a portal floats near the start of Crystal Cave. With the Earth Rune
you can jump into it for 45 seconds of coin and gem grabbing. Afterwards you return to the start of
Crystal Cave. It can be played once per run.

## Secrets and runes

- **Secret passages** are fake walls with faint cracks and the occasional sparkle. Walk straight
  into them: they're not solid, and they hide treasure.
- Levels 1-3 each hide a **rune** in a secret passage. Each rune gives a superpower:

| Rune | Key | Superpower | Recharge |
| --- | --- | --- | --- |
| Earth (level 1) | Q | Stone Skin: 4 seconds where nothing hurts you and enemies you touch take damage | 20 s |
| Crystal (level 2) | W | Crystal Storm: a ring of shards that cut through enemies | 10 s |
| Shadow (level 3) | E | Void Blast: damages every enemy on screen and wipes out their shots | 25 s |

- **Rune vaults** are glowing purple walls. They bounce you back (harmlessly) until you own the
  rune they need; after that they open like a secret passage. Crystal Cave's vault needs Earth,
  Shadow Castle's needs Crystal, Dragon's Peak's needs Shadow.

## Weapons

You can hold any number of weapons and switch with the keys above. The first time you get a weapon
(picked up or bought) you also get a permanent upgrade that stays after you switch.

| Weapon | Key | Style | Damage | Upgrade |
| --- | --- | --- | --- | --- |
| Dagger | 1 | Fast melee | 1 | +Speed (you start with it) |
| Sword | S | Medium melee | 2 | +1 max HP |
| Hammer | 3 | Slow melee, big knockback | 4 | +1 power (all weapons) |
| Battle Axe | A | Wide heavy melee | 3 | +2 max HP |
| Bow | B | Arrows | 2 | +1 max HP |
| Fire Wand | F | Fireballs, short cooldown | 3 | +10% attack speed |
| Throwing Axe | T | Spinning arc, cuts through every enemy | 3 | +5% attack speed |
| Bombs | M | Bounce, then explode (big area) | 6 | +1 max HP |

Melee swings also knock enemy shots out of the air.

## Shop, armor and skins

The shop opens between levels. Coins are worth 1 gold and gems 5 gold.

- **Weapons** you don't have yet.
- **Armor** gives blue shield hearts that take hits before your real hearts and refill every
  level: Leather 2, Gold 3, Iron 5, Diamond 8. It also shows on your character.
- **Upgrades:** +1 max HP, +1 power, Swift Boots (run speed), Quick Hands (attack speed),
  faster dash recharge, and Triple Jump.
- **Skins** are cosmetic and stay unlocked for every future run.

## Items and enemies

- Gold coin: +1 gold, +10 score. Gem: +5 gold, +50 score. Health potion: heals 3 HP.
  Heart container: +5 max HP.
- Slime (2 HP) patrols platforms. Bat (1 HP) flies in a wave and swoops at you. Skeleton Archer
  (3 HP) shoots arrows when you are in range.
- Gem Crab (3 HP) scuttles at you when you get close and may drop gems.
- Golemite (4 HP) hops toward you and barely gets knocked back.
- Ninja (2 HP) keeps its distance, throws shuriken and leaps across gaps.
- Enemies drop coins and sometimes a potion.

## Saving and leaderboard

Progress is saved to the browser's `localStorage` when you finish a level and when you buy
something: level, max HP, weapons, gold, armor, upgrades, runes and score. The main menu shows
**Continue** when a save exists. Skins and the shader setting are kept separately and survive
new games.

The **leaderboard** keeps the top 10 scores on this computer. You enter three letters after beating
the game, or when you quit a run from the pause menu with a high enough score.

## Shaders

With WebGL (any modern browser), the game uses a CRT-style screen effect (scanlines, slight color
fringing, vignette) and glows on runes, the portal and bosses. Toggle with V, from the pause screen,
or from the main menu. The game still runs without WebGL; the effects are just skipped.

## Project layout

```
index.html            loads Phaser and the game scripts
lib/phaser.min.js     Phaser 3.80.1 (local copy)
src/main.js           Phaser config, scene registration
src/data/             weapons, enemies (+ bosses), levels, gear (armor, skins, upgrades,
                      runes), sprites (extra pixel art)
src/scenes/           Boot (generates textures), Menu, Game, UI (HUD), Pause, Shop, Win,
                      Leaderboard (+ name entry)
src/entities/         Player, Enemy (+ all regular enemies), Boss (+ the four bosses),
                      Projectile (+ Bomb), Pickup
src/systems/          SaveManager (state, save, profile, leaderboard), Sound (Web Audio synth),
                      Shaders (CRT post-process, glow)
```

Levels are described in `src/data/levels.js` as ground segments, platforms, secrets, rune vaults
and entity positions, which are turned into a grid of characters (see the legend at the top of
that file).
