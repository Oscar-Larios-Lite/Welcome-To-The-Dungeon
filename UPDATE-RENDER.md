# Update the existing Render game to version 0.2

1. Extract `dungeon-multiplayer-v2.zip`. It contains a folder named **WelcomeToTheDungeon**, matching your existing repository folder.
2. Open the **top level** of https://github.com/Oscar-Larios-Lite/Welcome-To-The-Dungeon (not the folder inside it).
3. Select **Add file → Upload files** and drag the extracted **WelcomeToTheDungeon folder** into the upload area. This replaces files at the same paths and includes the new files.
4. Commit with a message such as `Restore original graphics and improve multiplayer responsiveness`.
5. Render should redeploy automatically. Otherwise, open the existing service and select **Manual Deploy → Deploy latest commit**.
6. Keep these existing Render settings:
   - Root Directory: `WelcomeToTheDungeon`
   - Runtime: Node
   - Build: `npm install --omit=dev`
   - Start: `npm start`
7. Wait for **Live**, refresh the game in both browsers (Ctrl+Shift+R), and create a new room.

Do not upload the ZIP itself. Do not place the extracted folder inside the existing same-named folder; that would produce a nested `WelcomeToTheDungeon/WelcomeToTheDungeon` path. This update adds a WebSocket dependency, so `package.json` and `package-lock.json` must both be uploaded along with the code.

## What changed

- Reused the original HTML's rendering functions: textured floors/walls, animated characters and weapons, original scenery and torch lighting, vignette, hearts, potion flask, cooldown overlays, and minimap.
- Restored original ability drawing and particle trails, with team identifiers added for multiplayer.
- Restored Q and Warrior E hold/release aiming.
- Switched live input/state delivery to WebSockets, removing sequential HTTP input round trips.
- Added immediate client movement prediction, acknowledgement/replay, smooth correction, and interpolation for other entities.
- Shared collision code between client/server; restored destructible scenery and continuous dash movement.
- Added a small measured network-latency indicator.

Validation: 15 automated tests passed, including two-client WebSocket authentication/reconnect, movement replay with 150 ms simulated one-way delay, input rate bounds, collision/dash consistency, respawn input cleanup, effect expiry, and original renderer asset/fallback paths. Browser checks verified both players, restored visuals, aiming, attacks, and spell effects without console errors. Your hosted service has not been updated or measured by this local test.
