# Welcome to the Dungeon — multiplayer prototype 01

An internet-deployable, server-authoritative rework of the original HTML game. This is a separate project; the original Desktop files are untouched.

## Run on this computer

Requires Node.js 22 or newer. No third-party packages are required.

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

Deployment has not been performed: no hosting account or destination repository has been supplied. Hosting plan selection and any costs belong to the hosting account. Rooms live in memory and disappear when the server restarts; use a continuously running instance for a session. Multiple instances require shared room routing/state, which this prototype does not implement.

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

Hold left mouse to move toward the cursor. Hold right mouse to attack. Aim with the cursor. Press Q/W/E/R to use abilities. Space drinks a potion.

| Key | Warrior | Mage |
| --- | --- | --- |
| RMB | Arc swing | Magic bolt |
| Q | Dash-cut | Fireball |
| W | Whirlwind | Blink |
| E | Slash wave | Flow: triple basic shots |
| R | Protective damage aura | Mana burst |

For this iteration abilities activate on key press rather than the original hold/release aiming. Warrior dash currently damages around its destination. Projectile effects and class balancing are simplified.

## Scope and limitations

Reuses the original 15-room map and embedded 0x72 sprite atlas (extracted to `public/atlas.png`). The supplied handoff identifies that atlas as DungeonTileset II v1.7, CC0. Canvas shapes provide a playable fallback if the atlas is unavailable.

This is a multiplayer foundation, not full feature parity with the single-player build. Original boss phases, elite behaviors, destructible scenery, sound, advanced effects, fog of war, and leaderboard are not ported. Boss AI is a simple shared encounter. Movement is rendered from server snapshots without client prediction, so internet latency affects responsiveness. Internet latency and a hosted deployment have not yet been tested.

Transport: authenticated HTTP input requests at up to 20 Hz, streaming server-sent events at 15 Hz, authoritative simulation at 30 Hz. Session tokens stay out of URLs and public state. Room codes are invite-based access; there are no user accounts. This prototype is intended for invited playtests, not ranked or adversarial public competition.

## Validation

`npm test` runs game-rule tests and a real HTTP integration test with two independent authenticated streaming clients. Browser QA verified creation, joining, team switching, class choice, readiness, match start, and movement in two tabs.

## Files

- `server.mjs`: HTTP server, sessions, room lifecycle, live streams.
- `game.mjs`: server-owned game simulation and combat.
- `map.mjs`: map extracted from the supplied game.
- `public/`: browser lobby, rendering, input, styles, sprites.
- `test/`: game and network tests.
- `ORIGINAL-HANDOFF.md`: historical reference from Claude, not the current multiplayer specification.
