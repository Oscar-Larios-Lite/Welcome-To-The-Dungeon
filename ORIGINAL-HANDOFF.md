# Welcome to the Dungeon — Handoff

Single-file HTML/JS top-down pixel ARPG, built incrementally with Claude for an
office speedrun competition. Everything lives in one HTML file — no deps, no
build, no server. Distributed by sending the `.html`.

## Files you need

- `welcome-to-the-dungeon.html` — the game (double-click or open in a browser)
- This handoff doc

Drop both in your Codex working directory and point it at them.

---

## Current build state (as of 2026-11-09)

### Controls

| Input | Action |
|---|---|
| **LMB (hold)** | Move toward cursor (click-and-drag path). Release = stop. |
| **RMB (hold)** | Arc swing basic attack. Auto-repeats on CD while held. |
| **Q** (hold+release) | Dash-cut: holding roots you + shows aim arrow; release fires. |
| **W** | Whirlwind spin AoE. Grants invulnerability for the duration. |
| **E** (hold+release) | Slash wave crescent projectile. Hold to aim, release to fire. |
| **R** | Aura ultimate. Invulnerable while active. |
| **Space** | Drink potion. |

Facing is a lerped smoothing (0.22) toward the mouse, so quick cursor flicks
don't blow up aim.

### Player stats

- **4 red hearts starting**, cap at 6 total (extras appear as white hearts)
- Potion = +1 heart; if already at `maxHp`, grants +1 white extra up to `hpCap`
- **All incoming hits clamped to 1 heart** (hard clamp in `damagePlayer`)
- **1-second mercy iframes** after any hit — prevents swarm stunlock
- Collision box 14×16 (feet-sized); hit circle `hitR` 11
- Speed 2.6
- Starts with 1 potion, max 3

### Abilities (CDs in frames @ 60fps)

| Key | Name | CD | Effect |
|---|---|---|---|
| Q | Dash-cut | 240 (4s) | 18-frame dash at speed 12 (~216px reach), +12 iframes recovery, 45 dmg (40 vs boss), hits anything within `e.hitR + player.hitR + 14`. Drill-slash particle trail (counter-rotating streams, white core, blue sparks). Golden energy wedge rendered ahead of the player. |
| W | Whirlwind | 900 (15s) | 72-frame spin, SPIN_RANGE 70px, 14 dmg every 6 frames. Three orbiting knight-sword blades + yellow glow + motion rings. **Invulnerable while spinning.** |
| E | Slash wave | 600 (10s) | Projectile `kind:'slash'`, size 22, 65 dmg, 60-frame life, speed 10. Big teal crescent with glow halo + inner arc + trailing arc + sparks. Piercing (hits each target once). |
| R | Aura (ult) | 2700 (45s) | 420-frame duration (7s). AR 130px. **8 dmg/tick vs mobs, 3 dmg/tick vs boss** (so ult alone can't carry). Invulnerable while active. Spinning blade visuals + orange glow. |
| Space | Potion | 180 (3s) | Heals 1 heart, or adds a white extra if full. Only drinks if `hp < hpCap`. |

Basic attack (RMB): `attackCd` 42 frames (~0.7s), `attackAnim` 24 frames.
ARC_RANGE 76, ARC_HALF π/2.1 (170° cone). 25 dmg. Knockback 14 (clamped
against walls + solid scenery so pushed enemies can't jam into a barrel).
Sword visually sweeps through the arc during the animation.

### Enemies

Base type stats (`hp`/`dmg`/`speed`/`hitR`/`range`):

- **skeleton** 20/1/1.3/10/3 — melee
- **zombie** 36/1/0.9/11/4 — melee
- **imp** 16/1/1.1/8/180 — ranged, slow projectile (speed 2.4), fires every 150 frames
- **elite_skeleton** 48/1/1.5/12/3 — purple pulsing aura
- **elite_zombie** 80/2/1.1/13/4 — green pulsing aura (dmg clamped to 1 by `damagePlayer`)
- **elite_imp** 36/1/1.4/9/200 — ranged, orange pulsing aura, cd 120
- **keeper** 180/2/1.4/16/14 — the mini-boss that drops the key
- **dummy** 60 HP — stationary training target, regens, resets instead of dying, doesn't count as a kill

Melee AI: stops at contact distance (`hitR + player.hitR`); swings only within
a tiny `range` past that. Aggro sticky — once engaged within 260px, chases up
to 1400px before giving up.

### Boss — The Dungeon Lord

Ogre sprite. Three phases now, all with distinct particle auras:

- **Phase 1** — 1000 HP, dmg 2 (clamped to 1), speed 1.15. Purple sprite.
- **Phase 2** (at 50% HP) — speed 1.9, +1 dmg, pink/purple tint. Steady purple
  spark emission around the body. 16-projectile slam (vs 10 in P1). Charge
  windup 36 frames.
- **Phase 3** — triggered when phase-2 HP depletes (boss does NOT die yet).
  Fresh **500 HP**, +1 dmg, speed 2.1, bright red tint + pulsing red aura +
  heavy red/orange cinders rising continuously. Banner reads
  "THE DUNGEON LORD — AWAKENED". Only when phase 3 HP hits 0 does the
  real victory flow fire.

Attacks:

- **Melee swing** at `bdist < 60`.
- **Charge** — telegraphed with a 48-frame (phase 1) or 36-frame (phase 2+)
  windup. During windup the boss freezes and renders a pulsing dashed red beam
  + arrowhead at the player's locked position, plus a pulsing red ring on the
  boss. Dedicated `boss.chargeCd` = 480 frames (~8s) after use; 22% pick
  rate on each attack roll. Can't be spammed.
- **Slam** — ring of projectiles (10/16 depending on phase, speed 1.9).
- **Jump smash** (phase 3 only, 45% pick rate) — 90-frame sequence:
  - 90–70: crouch telegraph (red ring on boss)
  - 70–20: `boss.airborne = true`. Boss invisible + untargetable (every player
    attack is gated with `!boss.airborne`). Expanding dashed red target circle
    at impact point; red-tinted ogre silhouette falls into it.
  - 20: teleport + 90px AoE damage, 12-projectile shockwave outward at speed
    1.7, orange flash.
  - 20–0: recovery.

### Map

- **100×80 tiles, 32px each** (3200×2560 world)
- 12 rooms:
  - **0 start** (center top) — SAFE, training dummy, 2 barrels
  - **1 antechamber** — 2 skeletons at the back
  - **2 west crypt** — skeletons + zombie + 1 elite_skeleton + chest
  - **3 east barracks** — zombies + 1 elite_zombie + crates + chest
  - **4 prison** — imps + skeletons + 1 elite_imp + chest
  - **5 library** (big central hub) — zombies + imps + 1 elite_skeleton + 2 chests
  - **6 armory** — skeletons + 1 elite_zombie + crates + chest
  - **7 chapel** — intermediate hall, 2 elite_skeletons + zombie + chest
  - **8 boss antechamber** — gated by a locked door at y=54, x=48–51
  - **9 boss room** — pillars + torches only, no destructibles
  - **10 KEEPER'S CRYPT** (far SW) — Keeper + 2 elite_imps + 2 elite_skeletons + chest
  - **11 east shrine** (far SE) — 2 elite_zombies + 1 elite_skeleton + 2 elite_imps + 2 chests

Key path: `start → antechamber → west crypt → prison → long south corridor →
keeper's crypt → kill Keeper → back → chapel → locked door → boss antechamber
→ boss room (seals behind you)`.

The locked door is a 4-tile `TILE_DOOR` strip. It passes only when
`player.hasKey` is true. Keeper death drops the key.

**Boss arena seal**: when `player.y > 63*T` AND `player.x` is within the boss
room's x-range (34–66), two tile rows north of room 9 (y=60, y=61 at x=48–51)
slam to WALL with dust bursts. 90-frame delay before the boss itself spawns.
The x-range check prevents triggering from entering east_shrine or
keeper_crypt (which share the same y band). Both tiles revert to FLOOR on real
boss death.

### HUD

Everything scales via `uiScale() = clamp(CH/720, 0.9, 2.0)`:

- **Hearts** top-left (red up to `maxHp`, white for extras)
- **Timer** top-right
- **Minimap** right-side under timer, 140×112, shows visited rooms + current
  room highlighted gold + door marker (red/green by key status) + white player
  dot
- **Ability bar** bottom-center, 4 slots (Q W E R), translucent so world shows
  through, cooldown overlay fills top-down
- **Potion flask** to the right of ability bar — glass flask with pink liquid
  that scales with potion count, cork, highlight, bubble sparkle, count badge,
  SPC key hint, cooldown overlay
- **Key slot** under hearts (shows "NO KEY" or a pulsing "KEY")
- **Boss HP bar** center-top when in boss fight, colored by phase

Vignette scales with viewport too — proper darkness falloff on both 720p and
4K.

### Scoring

```
timeBonus = max(0, 20000 - floor(gameTime * 50))
killBonus = player.kills * 60
flawless  = (damageTaken === 0) ? 2000 : 0
total     = timeBonus + killBonus + flawless
```

No damage penalty on the end screen (removed because "Hearts lost: -N"
confused the design). FLAWLESS still rewards 0-damage runs.

Leaderboard: localStorage key `welcome-to-the-dungeon-lb`, top 5 by time
per-device.

---

## Design decisions (why things are the way they are)

### Art pipeline

- Sprites are from **0x72's DungeonTileset II v1.7, CC0 public domain** (no
  attribution required). The 512×512 PNG atlas is base64-embedded as a data
  URI in the `SHEET_B64` constant near the top of the script. Sprite rects
  live in the `SPR` table. `sprite(name, dx, dy, scale, flipX, frame)` is the
  single blit helper.
- Every entity has **both** a sprite path AND a hand-drawn fallback — if
  `spritesReady` is false (atlas failed to decode), the game still runs.
- Mapping: player → knight_m, skeleton → skelet, zombie → zombie_anim, imp →
  imp, keeper → big_demon, boss → ogre, chest → chest_full_open_anim_f0,
  crate → crate, pillar → column, potion → flask_red.
- Barrels, torches, scrolls, key, iron door, training dummy stay hand-drawn.
- Source pack: `~/Downloads/Dungeon_Tiles/0x72_DungeonTilesetII_v1.7/`.
- **Why CC0?** User originally asked for Diablo 1/2 graphics; those are
  copyrighted Blizzard assets. Steered to 0x72's pack for the same dark-dungeon
  vibe, legally clean.

### Gameplay philosophy

- **D2 / Path of Exile control scheme**: LMB move, RMB attack, hold Q/E to
  aim.
- **Attacks commit** — RMB swing / Q / E all cancel the current move target
  (PoE style) and root the player.
- **1-sec mercy iframes** after any hit so swarms can't stunlock you.
- **Damage clamped to 1 heart** per hit — explicit user call. Simpler to
  balance, forces strategic avoidance rather than stat-check tanking.
- **Melee enemies must physically contact** the player — `range` is a tiny
  "reach past contact" value, not an aggro distance.
- **Sticky aggro** — once an enemy sees you (260px), they chase up to 1400px.
  You can't just outrun them, you have to kill or break line-of-sight (long
  enough to leave the leash).

### Content balancing

- First room is SAFE — training dummy only, so new players can learn controls
  without pressure.
- Second room is light (2 skeletons at the back) so the aggro doesn't bleed
  into the start room.
- Keeper deliberately placed FAR from the boss — forces exploration before
  the gated fight.
- Boss room has no destructibles — the arena should be a clean duel.
- Potions are rare: 5% from enemies, 5%/8%/50% from barrels/crates/chests.
- Elite enemies telegraphed by a colored radial pulse behind them + bigger
  sprite scale (2.3x vs 2x).

### UI

- **Hearts, not HP bar** — Zelda-style readability.
- **Minimap** scoped to visited rooms only so exploration still matters.
- **Ability bar translucent** so the world shows through.
- **Ult 45s cooldown** so it's a strategic resource, not a spam button.
- **Boss phase bar color changes** red/magenta/bright-red to telegraph phase
  shifts.

---

## File structure (where to look in the HTML)

Rough navigation order from top of the `<script>` block:

1. **`SHEET_B64`** base64 atlas (very large constant near top)
2. **`SPR`** table — sprite rect lookups
3. **`sprite()`** blit helper
4. **Constants** — `T` tile size, `MAP_W/MAP_H`, cooldowns, durations
5. **Audio** — tiny beep synth + `SFX` dictionary
6. **State** — `tilemap`, `mapRooms`, `visitedRooms`, `player`, `enemies`,
   `items`, `scenery`, `particles`, `projectiles`, `boss`, flags
7. **Input handlers** — `keys`, `prevKeys`, `aiming`, `mouse`, listeners
8. **`buildMap()`** — rooms array, corridor `carve()`, locked door
9. **Entity factories** — `makePlayer`, `makeEnemy`, `makeBoss`, `makeItem`,
   `makeScenery`
10. **`populate(rooms)`** — fills every room with enemies + scenery
11. **Collision** — `solidAt`, `rectHitsWall`, `rectHitsSolidScenery`,
    `moveWithCollision`
12. **`update()`** — one big function: input → cooldowns → ability triggers →
    movement → attacks → enemy AI → boss arena/AI → projectiles → items →
    particles → camera → minimap room-tracking
13. **`damagePlayer`, `onEnemyDeath`, `onBossDeath`** (phase-3 transition
    lives here)
14. **`render()`** — tiles → drawables sorted by y → projectiles → aura FX →
    boss leap FX → aim indicator → move target → particles → vignette → red
    flash → HUD
15. **`drawPlayer/Enemy/Boss/Item/Scenery/Heart`**
16. **`drawHUD/AbilityBar/PotionFlask/Minimap`**
17. **`startGame`, `showDeath`, `showVictory`, `computeScore`, `formatTime`**
18. **Wire** — button listeners, initial empty tilemap, `loop()`

---

## Known quirks / gotchas

- `prevKeys` snapshot runs at the end of `update()` for keydown/keyup edge
  detection on Q and E (hold-to-aim).
- Boss `airborne` flag gates **five** separate hit checks (whirlwind, dash-cut,
  aura, basic swing, projectile). Keep them synced if you add new player
  attacks.
- Boss arena seal is at y=60/61 (not y=61/62) specifically so the player
  entering y=63 can't overlap the slamming walls.
- Dummies have `stationary: true` and reset their HP instead of dying. The
  `onEnemyDeath` early-exit on stationary prevents kill-count inflation. The
  enemy drop filter resets dummy hp to max.
- Phase 2 and phase 3 both set `boss.dmg += 1` on entry. Clamped to 1 by
  `damagePlayer` anyway, but if you remove the clamp, those stack.
- Door prompt timer trick: `solidAt()` sets `doorPromptTimer = 60` as a
  side-effect when the player is near a locked door. Weird coupling but works.
- All HUD positions are derived from `uiScale()`, which clamps `CH/720` to
  [0.9, 2.0]. If you add new HUD elements, use the same scale.

---

## Open ideas / unimplemented

Carried over from earlier sessions:

- **Online leaderboard** (currently per-device only via localStorage)
- **Mobile touch controls**
- **Alt art style option** (unlock after first clear?)
- **Company/team logo** on title screen
- **Difficulty modes** (easy / normal / nightmare)
- **More elite variants** (necromancer, berserker, archer)
- **Secret rooms** / lore scrolls / collectibles
- **Boss intro cinematic** (currently just the seal + 90-frame delay)
- **Combo system** for the basic swing (3-hit chain with final flourish)

---

## Hard requirements (don't break these)

- **Single file**, no external deps, no build step. Must stay double-clickable
  distribution.
- **CC0 or user-authored art only** — no copyrighted sprite rips.
- **Playable fallback** if the sprite atlas fails to decode (hand-drawn paths
  must stay).
- **One HTML, no server** — any new feature must work with just a `file://`
  open.
