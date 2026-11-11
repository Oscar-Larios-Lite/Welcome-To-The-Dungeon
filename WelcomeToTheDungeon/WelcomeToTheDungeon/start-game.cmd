@echo off
cd /d "%~dp0"
echo Starting Welcome to the Dungeon multiplayer server.
echo Open http://localhost:3000 in your browser.
echo Keep this window open while playing. Press Ctrl+C to stop.
if not exist node_modules\ws call npm install --omit=dev
node server.mjs
pause
