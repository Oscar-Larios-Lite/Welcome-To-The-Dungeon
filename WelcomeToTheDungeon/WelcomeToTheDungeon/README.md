# Welcome to the Dungeon — multiplayer prototype 02

An internet-deployable, server-authoritative rework of the original HTML game. This is a separate project; the original Desktop files are untouched.

## Run on this computer

Requires Node.js 22 or newer. Run `npm install` once to install the WebSocket dependency.

```powershell
cd C:\Users\oscar.larios\Documents\ChatGPT\Random\dungeon-multiplayer
npm start
```

Open http://localhost:3000. For a local two-player test, open two separate browser tabs, create a room in one, and join using its code in the other. A refreshed tab resumes its own session. A duplicated tab can inherit session storage; use a fresh tab for the second player.

Localhost is only reachable on this computer. For players in different locations, deploy the server below and share its HTTPS URL.

## Deploy for internet play

The project is ready for one persistent Node web-service instance. Render configuration is supplied in `render.yaml`; a Dockerfile is supplied for other container hosts.

1. Put the contents of this project folder in a GitHub repository.
2. On Render, create a **Web Service** and connect that repository.
3. Select the Node runtime, build command `npm install --omit=dev`, and start command `npm start`. If using a larger repository, set the service root directory to the folder containing this README.
4. Use a single instance. The server reads the host-provided `PORT` and binds to `0.0.0.0`. Health check: `/health`.
5. After deployment, open the returned HTTPS URL, create a room, and use **Copy invite** to share it with your friend.

Official deployment guide: https://render.com/docs/deploy-node-express-app

For the existing repository, the application folder is `WelcomeToTheDungeon`: set Render's **Root Directory** to that exact name. Keep build command `npm install --omit=dev`, start command `npm start`, and one instance. Upload the updated folder to the repository root, replacing the old files. Include `package-lock.json`, `scenery.mjs`, and all files under `public/`. Render then rebuilds the service (or use Manual Deploy). This local update has not been deployed to your service.

Rooms live in memory and disappear when the server restarts; use a continuously running instance for a session. Multiple instances require shared room routing/state, which this prototype does not implement.

## Lobby and match rules

- Red and Blue teams, up to four players on each team (eight total).
- At least two connected players must ready up. Only the host starts the match.
- Both Warrior and Mage are available immediately. Click a team or class to switch before the match; changing either cancels readiness.
- Players can join the same team for co-op or opposing teams for PvP.
- Movement, cooldowns, damage, pickups, enemies, and scores are controlled by the server. Clients send input and receive snapshots.
- Sanctuary at spawn prevents damage. Friendly fire is disabled.
- Death respawns you in five seconds. A disconnected player stops moving immediately and is removed after 60 seconds; refreshing within that grace period reconnects the session.
- Potions are shared world pickups: the first eligible player collects each one.
- The Keeper opens the boss gate for everyone. Killing the Dungeon Lord ends the match.
- Enemy kill: 20 points; Keeper: 200; opposing player: 100; boss: 1000. Highest team score wins; equal scores draw. This is the initial prototype scoring rule, open to revision.
- New players join before the match starts. To replay, create a new room.

## Controls

Hold left mouse to move toward the cursor. Hold right mouse to attack. Aim with the cursor. Hold Q and release to cast/dash; Warrior E also uses hold/release aiming. W, Mage E, and R activate on press. Space drinks a potion.

| Key | Warrior | Mage |
| --- | --- | --- |
| RMB | Arc swing | Magic bolt |
| Q | Dash-cut | Fireball |
| W | Whirlwind | Blink |
| E | Slash wave | Flow: triple basic shots |
| R | Protective damage aura | Mana burst |

Warrior dash now moves along its path over 0.3 seconds and damages each touched target once. The original aim arrow, drill trail, whirlwind, aura blades, spell trails, hit bursts, and explosion rings are restored. Class balancing is still the multiplayer prototype's balance.

## Scope and limitations

Reuses the original 15-room map and 0x72 sprite atlas (`public/atlas.png`). `public/original-renderer.js` retains the actual draw routines from the supplied HTML: original floor/walls, entity/weapon rendering, scenery, torch lighting, vignette, pixel hearts, potion flask, cooldown overlays, minimap, and spell effects. The multiplayer lobby uses the original Courier font and warm red/brown/gold UI. Team labels and scores are multiplayer additions. Scenery placements are retained, and server-authoritative barrels/crates/chests can be destroyed. The supplied handoff identifies the atlas as DungeonTileset II v1.7, CC0. Original hand-drawn fallback paths remain.

This remains a multiplayer foundation, not full single-player feature parity: original boss phases, elite behaviors, sound, and leaderboard are not yet ported. Boss AI is still a simple shared encounter. Graphics restoration does not change those encounter rules.

Transport: a persistent authenticated WebSocket carries input in 30 Hz batches and state at approximately 20 Hz. Gameplay simulates at 60 Hz. Your browser predicts movement using the same collision/movement code as the server, then reconciles acknowledged inputs and replays pending ones; small corrections blend smoothly. Remote players/enemies/projectiles interpolate over 75 ms. Local aiming, sword swings, movement, dash, blink, and spell visuals respond immediately; actual damage and pickup ownership remain server-controlled. The renderer culls offscreen scenery and caps transient particles. A small network indicator shows measured round-trip latency. Real distance and server load still affect confirmed hits; no claim of zero network delay is made.

Session tokens stay out of URLs and public state. Room codes are invite-based access; there are no user accounts. This prototype is intended for invited playtests, not ranked or adversarial public competition.

## Validation

`npm test` runs game rules, real HTTP/WebSocket two-client integration, authentication/reconnection, original renderer smoke tests, and movement prediction/replay tests including simulated 150 ms delay each way. Browser QA checks the original graphics and abilities with two players. Hosted Render latency has not been measured in this update.

## Files

- `server.mjs`: HTTP server, sessions, room lifecycle, live streams.
- `game.mjs`: server-owned game simulation and combat.
- `map.mjs`: map extracted from the supplied game.
- `scenery.mjs`: original scenery placements.
- `public/movement.js`: shared collision, prediction, and reconciliation.
- `public/original-renderer.js`: retained original drawing routines and multiplayer adapter.
- `tools/extract-original.mjs`: reproduces retained drawing code from an original HTML path; normal play/deployment does not require the original HTML.
- `public/`: browser lobby, rendering, input, styles, sprites.
- `test/`: game and network tests.
- `ORIGINAL-HANDOFF.md`: historical reference from Claude, not the current multiplayer specification.
