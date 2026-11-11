// Original scenery placements and appearance, retained from the supplied HTML.
const T=32;
function makeScenery(type, x, y) {
  const S = {
    barrel: { w: 24, h: 28, hp: 1, color: '#6a4020', loot: () => Math.random() < 0.05 ? 'potion' : null },
    crate:  { w: 26, h: 26, hp: 1, color: '#8a5a2a', loot: () => Math.random() < 0.08 ? 'potion' : null },
    chest:  { w: 32, h: 24, hp: 1, color: '#a8862a', loot: () => Math.random() < 0.50 ? 'potion' : null },
    pillar: { w: 18, h: 18, hp: 1e9, color: '#3a3a40', solid: true },
    torch:  { w: 10, h: 20, hp: 1e9, color: '#5a3a1a', solid: false, light: true },
  }[type];
  return { type, x, y, w: S.w, h: S.h, hp: S.hp, color: S.color, loot: S.loot, solid: S.solid !== false && type !== 'torch', light: S.light, hitFlash: 0 };
}


export function createScenery(rooms) {
let scenery=[], enemies=[], enemyTotal=0; const makeEnemy=()=>({});
function populate(rooms) {
  // Helper: torches at the four inner corners of a room
  const roomTorches = (r) => {
    scenery.push(makeScenery('torch', (r.x+1)*T, (r.y+1)*T));
    scenery.push(makeScenery('torch', (r.x+r.w-2)*T + 16, (r.y+1)*T));
    scenery.push(makeScenery('torch', (r.x+1)*T, (r.y+r.h-2)*T + 16));
    scenery.push(makeScenery('torch', (r.x+r.w-2)*T + 16, (r.y+r.h-2)*T + 16));
  };

  // Room 0: Start - SAFE training room. Dummy to practice on, no live enemies.
  const r0 = rooms[0];
  roomTorches(r0);
  scenery.push(makeScenery('barrel', (r0.x+2)*T, (r0.y+3)*T));
  scenery.push(makeScenery('barrel', (r0.x+r0.w-3)*T, (r0.y+3)*T));
  enemies.push(makeEnemy('dummy', (r0.x + r0.w/2|0)*T, (r0.y + r0.h - 2)*T));

  // Room 1: Antechamber - just 2 skeletons so the player gets a gentle intro
  const r1 = rooms[1];
  roomTorches(r1);
  enemies.push(makeEnemy('skeleton', (r1.x + 6)*T,         (r1.y + r1.h - 2)*T));
  enemies.push(makeEnemy('skeleton', (r1.x + r1.w - 7)*T,  (r1.y + r1.h - 2)*T));
  scenery.push(makeScenery('pillar', (r1.x+2)*T, (r1.y+2)*T));
  scenery.push(makeScenery('pillar', (r1.x+r1.w-3)*T, (r1.y+2)*T));
  scenery.push(makeScenery('crate', (r1.x+6)*T, (r1.y+5)*T));
  scenery.push(makeScenery('crate', (r1.x+r1.w-7)*T, (r1.y+5)*T));

  // Room 2: West Crypt - skeletons + zombie + elite skeleton
  const r2 = rooms[2];
  roomTorches(r2);
  for (let i = 0; i < 4; i++) {
    enemies.push(makeEnemy('skeleton', (r2.x + 2 + i*3)*T, (r2.y + 3)*T));
  }
  enemies.push(makeEnemy('zombie', (r2.x + 6)*T, (r2.y + 6)*T));
  enemies.push(makeEnemy('elite_skeleton', (r2.x + r2.w - 4)*T, (r2.y + r2.h - 3)*T));
  for (let i = 0; i < 5; i++) {
    scenery.push(makeScenery('barrel', (r2.x+1+i*2)*T, (r2.y+r2.h-2)*T));
  }
  scenery.push(makeScenery('chest', (r2.x+r2.w-3)*T, (r2.y+1)*T));

  // Room 3: East Barracks - zombies + elite zombie
  const r3 = rooms[3];
  roomTorches(r3);
  for (let i = 0; i < 4; i++) {
    enemies.push(makeEnemy('zombie', (r3.x + 2 + i*3)*T, (r3.y + 3)*T));
  }
  enemies.push(makeEnemy('elite_zombie', (r3.x + r3.w/2|0)*T, (r3.y + r3.h - 3)*T));
  scenery.push(makeScenery('crate', (r3.x+2)*T, (r3.y+r3.h-3)*T));
  scenery.push(makeScenery('crate', (r3.x+4)*T, (r3.y+r3.h-3)*T));
  scenery.push(makeScenery('crate', (r3.x+6)*T, (r3.y+r3.h-3)*T));
  scenery.push(makeScenery('chest', (r3.x+r3.w-3)*T, (r3.y+1)*T));
  scenery.push(makeScenery('pillar', (r3.x+r3.w-3)*T, (r3.y+r3.h-3)*T));

  // Room 4: Prison - imps + skeletons + elite imp
  const r4 = rooms[4];
  roomTorches(r4);
  enemies.push(makeEnemy('imp', (r4.x + 3)*T, (r4.y + 3)*T));
  enemies.push(makeEnemy('imp', (r4.x + r4.w-4)*T, (r4.y + 3)*T));
  enemies.push(makeEnemy('skeleton', (r4.x + 2)*T, (r4.y + r4.h-3)*T));
  enemies.push(makeEnemy('skeleton', (r4.x + r4.w-3)*T, (r4.y + r4.h-3)*T));
  enemies.push(makeEnemy('elite_imp', (r4.x + r4.w/2|0)*T, (r4.y + 5)*T));
  for (let i = 0; i < 3; i++) {
    scenery.push(makeScenery('barrel', (r4.x+3+i*2)*T, (r4.y+5)*T));
  }
  scenery.push(makeScenery('chest', (r4.x+r4.w/2|0)*T, (r4.y+1)*T));

  // Room 5: Library - bigger hub, mixed enemies + 1 elite
  const r5 = rooms[5];
  roomTorches(r5);
  for (let i = 0; i < 3; i++) {
    enemies.push(makeEnemy('zombie', (r5.x + 4 + i*5)*T, (r5.y + 3)*T));
  }
  for (let i = 0; i < 3; i++) {
    enemies.push(makeEnemy('imp', (r5.x + 5 + i*6)*T, (r5.y + 7)*T));
  }
  enemies.push(makeEnemy('elite_skeleton', (r5.x + r5.w/2|0)*T, (r5.y + r5.h - 3)*T));
  for (let i = 0; i < 4; i++) {
    scenery.push(makeScenery('pillar', (r5.x+3+i*5)*T, (r5.y+r5.h-3)*T));
  }
  scenery.push(makeScenery('chest', (r5.x+2)*T, (r5.y+1)*T));
  scenery.push(makeScenery('chest', (r5.x+r5.w-3)*T, (r5.y+1)*T));

  // Room 6: Armory - elite enemies + crates
  const r6 = rooms[6];
  roomTorches(r6);
  enemies.push(makeEnemy('skeleton', (r6.x + 3)*T, (r6.y + 3)*T));
  enemies.push(makeEnemy('skeleton', (r6.x + r6.w-4)*T, (r6.y + 3)*T));
  enemies.push(makeEnemy('elite_zombie', (r6.x + r6.w/2|0)*T, (r6.y + 5)*T));
  for (let i = 0; i < 4; i++) {
    scenery.push(makeScenery('crate', (r6.x+2+i*2)*T, (r6.y+r6.h-3)*T));
  }
  scenery.push(makeScenery('chest', (r6.x+r6.w/2|0)*T, (r6.y+1)*T));

  // Room 7: Chapel (intermediate hall) - elite skeletons + pillars, no keeper here anymore
  const r7 = rooms[7];
  roomTorches(r7);
  scenery.push(makeScenery('pillar', (r7.x+3)*T, (r7.y+2)*T));
  scenery.push(makeScenery('pillar', (r7.x+r7.w-4)*T, (r7.y+2)*T));
  scenery.push(makeScenery('pillar', (r7.x+3)*T, (r7.y+r7.h-3)*T));
  scenery.push(makeScenery('pillar', (r7.x+r7.w-4)*T, (r7.y+r7.h-3)*T));
  enemies.push(makeEnemy('elite_skeleton', (r7.x+5)*T,         (r7.y+3)*T));
  enemies.push(makeEnemy('elite_skeleton', (r7.x+r7.w-5)*T,    (r7.y+3)*T));
  enemies.push(makeEnemy('zombie',         (r7.x+r7.w/2|0)*T,   (r7.y+r7.h/2|0)*T));
  scenery.push(makeScenery('chest', (r7.x + r7.w/2|0)*T, (r7.y + r7.h - 2)*T));

  // Room 10: Keeper's Crypt (far SW) - THIS is where the Keeper + key live now
  const rK = rooms[10];
  roomTorches(rK);
  scenery.push(makeScenery('pillar', (rK.x+2)*T, (rK.y+2)*T));
  scenery.push(makeScenery('pillar', (rK.x+rK.w-3)*T, (rK.y+2)*T));
  scenery.push(makeScenery('pillar', (rK.x+2)*T, (rK.y+rK.h-3)*T));
  scenery.push(makeScenery('pillar', (rK.x+rK.w-3)*T, (rK.y+rK.h-3)*T));
  enemies.push(makeEnemy('elite_imp', (rK.x+4)*T, (rK.y+3)*T));
  enemies.push(makeEnemy('elite_imp', (rK.x+rK.w-5)*T, (rK.y+3)*T));
  enemies.push(makeEnemy('elite_skeleton', (rK.x+3)*T, (rK.y+rK.h-3)*T));
  enemies.push(makeEnemy('elite_skeleton', (rK.x+rK.w-4)*T, (rK.y+rK.h-3)*T));
  // The Keeper - dead center
  enemies.push(makeEnemy('keeper', (rK.x + rK.w/2|0)*T, (rK.y + rK.h/2|0)*T));
  // Chest with bonus loot
  scenery.push(makeScenery('chest', (rK.x + rK.w/2|0)*T, (rK.y + rK.h - 2)*T));

  // Room 11: East Shrine (far SE) - pure elite room, big loot
  const rS = rooms[11];
  roomTorches(rS);
  scenery.push(makeScenery('pillar', (rS.x+2)*T, (rS.y+rS.h/2|0)*T));
  scenery.push(makeScenery('pillar', (rS.x+rS.w-3)*T, (rS.y+rS.h/2|0)*T));
  enemies.push(makeEnemy('elite_zombie', (rS.x+4)*T,         (rS.y+3)*T));
  enemies.push(makeEnemy('elite_zombie', (rS.x+rS.w-5)*T,    (rS.y+3)*T));
  enemies.push(makeEnemy('elite_skeleton', (rS.x+rS.w/2|0)*T, (rS.y+rS.h/2|0)*T));
  enemies.push(makeEnemy('elite_imp',    (rS.x+4)*T,         (rS.y+rS.h-3)*T));
  enemies.push(makeEnemy('elite_imp',    (rS.x+rS.w-5)*T,    (rS.y+rS.h-3)*T));
  scenery.push(makeScenery('chest', (rS.x+rS.w/2|0)*T, (rS.y+rS.h-2)*T));
  scenery.push(makeScenery('chest', (rS.x+rS.w/2 - 2|0)*T, (rS.y+rS.h-2)*T));

  // Room 12: Necropolis (top-left) - necromancer coven. Rapid-fire magenta casters behind pillars.
  const rN = rooms[12];
  roomTorches(rN);
  scenery.push(makeScenery('pillar', (rN.x+3)*T, (rN.y+2)*T));
  scenery.push(makeScenery('pillar', (rN.x+rN.w-4)*T, (rN.y+2)*T));
  enemies.push(makeEnemy('necromancer', (rN.x + rN.w/2|0)*T, (rN.y + 3)*T));
  enemies.push(makeEnemy('necromancer', (rN.x + 3)*T, (rN.y + rN.h - 3)*T));
  enemies.push(makeEnemy('skeleton',    (rN.x + rN.w - 4)*T, (rN.y + rN.h - 3)*T));
  scenery.push(makeScenery('chest', (rN.x + rN.w/2|0)*T, (rN.y + rN.h - 2)*T));

  // Room 13: Warlord Hall (top-right) - brute barracks. One huge red bruiser flanked by zombies.
  const rW = rooms[13];
  roomTorches(rW);
  scenery.push(makeScenery('crate', (rW.x+2)*T, (rW.y+rW.h-3)*T));
  scenery.push(makeScenery('crate', (rW.x+rW.w-3)*T, (rW.y+rW.h-3)*T));
  enemies.push(makeEnemy('brute',  (rW.x + rW.w/2|0)*T, (rW.y + rW.h/2|0)*T));
  enemies.push(makeEnemy('zombie', (rW.x + 3)*T, (rW.y + 3)*T));
  enemies.push(makeEnemy('zombie', (rW.x + rW.w - 4)*T, (rW.y + 3)*T));
  scenery.push(makeScenery('chest', (rW.x + rW.w/2|0)*T, (rW.y + 1)*T));

  // Room 14: Wraith Sanctum (east of chapel) - shade coven. Hyper-fast cyan melee swarm.
  const rWS = rooms[14];
  roomTorches(rWS);
  scenery.push(makeScenery('pillar', (rWS.x+2)*T, (rWS.y+rWS.h/2|0)*T));
  scenery.push(makeScenery('pillar', (rWS.x+rWS.w-3)*T, (rWS.y+rWS.h/2|0)*T));
  enemies.push(makeEnemy('shade', (rWS.x + 3)*T,            (rWS.y + 3)*T));
  enemies.push(makeEnemy('shade', (rWS.x + rWS.w - 4)*T,    (rWS.y + 3)*T));
  enemies.push(makeEnemy('shade', (rWS.x + rWS.w/2|0)*T,    (rWS.y + rWS.h - 3)*T));
  scenery.push(makeScenery('chest', (rWS.x + rWS.w/2|0)*T, (rWS.y + 1)*T));

  // Corridor dressing
  scenery.push(makeScenery('torch', 48*T, 8*T));
  scenery.push(makeScenery('torch', 52*T, 8*T));
  // Torches flanking the locked door (at y=54, x=48-51)
  scenery.push(makeScenery('torch', 47*T + 16, 53*T));
  scenery.push(makeScenery('torch', 52*T + 16, 53*T));

  // Room 9: Boss room - NO crates / barrels / chests - just pillars + torches
  const rB = rooms[9];
  scenery.push(makeScenery('pillar', (rB.x+3)*T,          (rB.y+3)*T));
  scenery.push(makeScenery('pillar', (rB.x+rB.w-4)*T,     (rB.y+3)*T));
  scenery.push(makeScenery('pillar', (rB.x+3)*T,          (rB.y+rB.h-4)*T));
  scenery.push(makeScenery('pillar', (rB.x+rB.w-4)*T,     (rB.y+rB.h-4)*T));
  scenery.push(makeScenery('torch',  (rB.x+1)*T + 8,       (rB.y+1)*T));
  scenery.push(makeScenery('torch',  (rB.x+rB.w-1)*T,      (rB.y+1)*T));
  scenery.push(makeScenery('torch',  (rB.x+1)*T + 8,       (rB.y+rB.h-1)*T));
  scenery.push(makeScenery('torch',  (rB.x+rB.w-1)*T,      (rB.y+rB.h-1)*T));

  enemyTotal = enemies.filter(e => !e.stationary).length;
}


populate(rooms);return scenery.map((s,i)=>({...s,id:'scenery-'+i,loot:undefined}));
}
