// Run with the original HTML path to reproduce the retained drawing routines.
import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync(process.argv[2],'utf8');
const section=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const sprites=section('const SPR =','// ================= CONFIG');
let drawing=section('function render()','// ================= GAME FLOW');
drawing=drawing.replace("drawables.push({kind:'player', e:player, y:player.y});","for (const p of allPlayers) if (p.hp > 0) drawables.push({kind:'player', e:p, y:p.y});");
drawing=drawing.replace("else if (d.kind === 'player') drawPlayer(d.e);","else if (d.kind === 'player') { drawPlayer(d.e); drawTeamLabel(d.e); }");
drawing=drawing.replace('  for (const d of drawables) {','  for (const d of drawables) {\n    if (d.e.x < camera.x-160 || d.e.x > camera.x+CW+160 || d.e.y < camera.y-160 || d.e.y > camera.y+CH+160) continue;');
// All players get the original aura / whirlwind / flow visuals, not just the camera owner.
drawing=drawing.replace('  // Flow State: soft pulsing mana ring around the mage','  for (const player of allPlayers) {\n  // Flow State: soft pulsing mana ring around the mage');
drawing=drawing.replace('  // AoE rings: show the hitbox','  }\n  // AoE rings: show the hitbox');
drawing=drawing.replace('  // Aura ring around player (R ult)','  for (const player of allPlayers) {\n  // Aura ring around player (R ult)');
drawing=drawing.replace('  // Aim indicator (while holding Q or E)','  }\n  // Aim indicator (while holding Q or E)');
drawing=drawing.replace('  if (boss && boss.hp > 0) {\n    const bw', '  if (boss && boss.hp > 0 && bossSpawned) {\n    const bw');
// Multiplayer arena does not seal; avoid displaying the old single-player warning.
drawing=drawing.replace('if (!arenaSealed && !bossSpawned &&','if (false && !arenaSealed && !bossSpawned &&');
const particles=section('function spawnParticle(','// AoE damage + visual burst');
const scaffold=readFileSync(new URL('./renderer-scaffold.txt',import.meta.url),'utf8');
writeFileSync(new URL('../public/original-renderer.js',import.meta.url),scaffold.replace('/* ORIGINAL_SPRITES */',sprites).replace('/* ORIGINAL_DRAWING */',drawing).replace('/* ORIGINAL_PARTICLES */',particles));
const population=section('function populate(','// ================= COLLISION');
const factories=section('function makeScenery(','function spawnParticle(').replaceAll('Infinity','1e9');
writeFileSync(new URL('../scenery.mjs',import.meta.url),`// Original scenery placements and appearance, retained from the supplied HTML.\nconst T=32;\n${factories}\nexport function createScenery(rooms) {\nlet scenery=[], enemies=[], enemyTotal=0; const makeEnemy=()=>({});\n${population}\npopulate(rooms);return scenery.map((s,i)=>({...s,id:'scenery-'+i,loot:undefined}));\n}\n`);
