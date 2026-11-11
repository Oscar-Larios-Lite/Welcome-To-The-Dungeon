const MAP_W=100, MAP_H=80, TILE_WALL=1, TILE_FLOOR=0, TILE_DOOR=2;
function buildMap() {
  const map = Array.from({length: MAP_H}, () => Array(MAP_W).fill(TILE_WALL));
  // Rooms - 100x80 dungeon, keeper placed far west so the player must detour before the boss door
  const rooms = [
    { x: 44, y: 2,  w: 12, h: 6,  name: 'start' },         // 0 start (center top)
    { x: 38, y: 10, w: 24, h: 8,  name: 'antechamber' },   // 1 first combat
    { x: 14, y: 15, w: 18, h: 10, name: 'west_crypt' },    // 2 skeletons
    { x: 68, y: 15, w: 18, h: 10, name: 'east_barracks' }, // 3 zombies
    { x: 2,  y: 30, w: 16, h: 10, name: 'prison' },        // 4 imps + skeletons
    { x: 38, y: 22, w: 24, h: 12, name: 'library' },       // 5 big central hub
    { x: 82, y: 30, w: 16, h: 10, name: 'armory' },        // 6 elites + loot
    { x: 38, y: 40, w: 24, h: 8,  name: 'chapel' },        // 7 central mid chamber (used to be keeper)
    { x: 42, y: 56, w: 16, h: 5,  name: 'antechamber_boss' }, // 8 gated by locked door
    { x: 34, y: 63, w: 32, h: 15, name: 'boss' },          // 9 boss room (bigger)
    { x: 2,  y: 56, w: 18, h: 12, name: 'keeper_crypt' },  // 10 - KEEPER lives here, far SW
    { x: 80, y: 56, w: 18, h: 12, name: 'east_shrine' },   // 11 - elite shrine, far SE
    { x: 14, y: 2,  w: 12, h: 8,  name: 'necropolis' },    // 12 NEW - necromancers (top-left over west crypt)
    { x: 72, y: 2,  w: 12, h: 8,  name: 'warlord_hall' },  // 13 NEW - brutes (top-right over east barracks)
    { x: 66, y: 42, w: 14, h: 10, name: 'wraith_sanctum' },// 14 NEW - shades (east of chapel)
  ];
  const carve = (x,y,w,h) => {
    for (let j = y; j < y+h; j++)
      for (let i = x; i < x+w; i++)
        if (map[j] && i >= 0 && i < MAP_W) map[j][i] = TILE_FLOOR;
  };
  rooms.forEach(r => carve(r.x, r.y, r.w, r.h));
  // Corridors (3-4 wide)
  carve(48, 7,  4, 4);   // start -> antechamber
  carve(31, 18, 8, 4);   // antechamber -> west crypt
  carve(61, 18, 8, 4);   // antechamber -> east barracks
  carve(48, 17, 4, 6);   // antechamber -> library (south)
  carve(18, 24, 4, 7);   // west crypt -> prison (south)
  carve(76, 24, 4, 7);   // east barracks -> armory (south)
  carve(48, 33, 4, 8);   // library -> chapel (south)
  carve(14, 39, 24, 4);  // prison -> chapel (east along y=39)
  carve(62, 39, 24, 4);  // armory -> chapel (west along y=39)
  carve(48, 47, 4, 10);  // chapel -> boss antechamber (south, contains the locked door)
  carve(48, 60, 4, 4);   // boss antechamber -> boss room
  // South-west detour to the KEEPER (far from the boss)
  carve(10, 39, 4, 18);  // prison -> keeper_crypt (long south corridor on west side)
  // South-east detour to the elite shrine
  carve(86, 39, 4, 18);  // armory -> east_shrine (long south corridor on east side)
  // Corridors to the three new elite rooms
  carve(16, 10, 4, 5);   // necropolis -> west_crypt (short south corridor)
  carve(74, 10, 4, 5);   // warlord_hall -> east_barracks (short south corridor)
  carve(62, 45, 4, 4);   // chapel -> wraith_sanctum (short east corridor at y=45)

  // Locked door - 4 tiles wide spanning the corridor between chapel and boss antechamber
  const doorY = 54;
  for (let i = 48; i < 52; i++) map[doorY][i] = TILE_DOOR;

  return { map, rooms, doorY, doorXMin: 48, doorXMax: 51 };
}


export { buildMap };
