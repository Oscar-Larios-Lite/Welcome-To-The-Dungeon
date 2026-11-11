import { randomBytes } from 'node:crypto';
import { buildMap } from './map.mjs';
import { createScenery } from './scenery.mjs';
import {walkable,move,advanceMovement,STEP} from './public/movement.js';
export const DT=STEP;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const uid=()=>randomBytes(12).toString('hex');
export class Game {
  constructor(code){this.code=code;this.players=[];this.phase='lobby';this.host=null;this.time=0;this.seq=0;this.scores={red:0,blue:0};this.events=[];this.resetWorld();}
  resetWorld(){const b=buildMap();this.map=b.map;this.rooms=b.rooms;this.scenery=createScenery(b.rooms);this.enemies=[];this.items=[];this.shots=[];this.fx=[];this.doorOpen=false;
    for(let i=1;i<b.rooms.length;i++){const r=b.rooms[i];if(i===8)continue;const count=i===9||i===10?1:3;
      for(let k=0;k<count;k++){const type=i===9?'boss':i===10?'keeper':k===2?'imp':k===1?'zombie':'skeleton';const hp=type==='boss'?1000:type==='keeper'?180:type==='zombie'?60:40;
        this.enemies.push({id:uid(),type,x:(r.x+r.w/2+k*2-2)*32,y:(r.y+r.h/2)*32,hp,maxHp:hp,cd:1,r:type==='boss'?25:13});}
      if(i!==9)this.items.push({id:uid(),type:'potion',x:(r.x+3)*32,y:(r.y+3)*32});
    }
  }
  join(name){if(this.phase!=='lobby')throw Error('This match has started. Create another room.');if(this.players.length>=8)throw Error('Room full.');
    const team=this.players.filter(p=>p.team==='red').length<=this.players.filter(p=>p.team==='blue').length?'red':'blue';
    const p={id:uid(),token:uid(),name:String(name||'Adventurer').trim().slice(0,20)||'Adventurer',team,cls:'warrior',ready:false,connected:false,lastSeen:Date.now(),input:{},cd:{},hp:4,maxHp:4,x:1600,y:160,kills:0,deaths:0,potions:1,inv:0,respawn:0,facing:0};this.players.push(p);this.host??=p.id;return p;}
  choose(p,team,cls){if(this.phase!=='lobby')throw Error('Choices are locked during the match.');if(!['red','blue'].includes(team)||!['warrior','mage'].includes(cls))throw Error('Invalid selection.');if(team!==p.team&&this.players.filter(q=>q.team===team).length>=4)throw Error('That team already has four players.');p.team=team;p.cls=cls;p.ready=false;}
  start(p){if(p.id!==this.host)throw Error('Only the host can start.');if(this.phase!=='lobby'||this.players.length<2||!this.players.every(q=>q.ready&&q.connected))throw Error('At least two connected, ready players are required.');this.phase='playing';this.time=0;this.scores={red:0,blue:0};this.resetWorld();for(const [i,q] of this.players.entries()){q.maxHp=q.cls==='mage'?5:4;q.hp=q.maxHp;q.x=(47+i%4*2)*32;q.y=(q.team==='red'?4:6)*32;q.inv=5;q.cd={};q.input={};}this.note('The dungeon is open. Slay the Dungeon Lord to finish.');}
  note(text){this.events.unshift({id:++this.seq,text});this.events=this.events.slice(0,5);}
  walkable(x,y,r=11){return walkable(this.map,x,y,r,this.scenery);}
  move(p,dx,dy){move(this.map,p,dx,dy,this.scenery);}
  visible(a,b){const n=Math.ceil(distance(a,b)/12);for(let i=1;i<=n;i++)if(!this.walkable(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,0))return false;return true;}
  targets(p){return [...this.enemies.filter(e=>e.hp>0),...this.scenery.filter(s=>s.hp>0&&s.hp<1e9),...this.players.filter(q=>q.id!==p.id&&q.team!==p.team&&q.hp>0&&q.connected)];}
  effect(f){this.fx.push({id:++this.seq,life:0.7,...f});}
  damage(t,amount,source){if(t.hp<=0)return;if(t.team&&(source?.team===t.team||t.inv>0||this.safe(t)))return;this.effect({kind:'hit',target:t.id,x:t.x,y:t.y,color:t.team?'#ff5555':'#ffeeaa'});if(t.id.startsWith('scenery-')){t.hp=0;this.effect({kind:'burst',x:t.x,y:t.y,r:24,color:'#a87840'});if(Math.random()<(t.type==='chest'?.5:.05))this.items.push({id:uid(),type:'potion',x:t.x,y:t.y});return;}if(t.team){t.hp-=1;t.inv=1;if(t.hp<=0){t.hp=0;t.respawn=5;t.deaths++;if(source?.team){source.kills++;this.scores[source.team]+=100;this.note(`${source.name} defeated ${t.name}`);}}}else{t.hp-=amount;if(t.hp<=0){t.hp=0;this.effect({kind:'death',x:t.x,y:t.y});if(source?.team)this.scores[source.team]+=t.type==='boss'?1000:t.type==='keeper'?200:20;
      if(t.type==='keeper'){this.doorOpen=true;for(let x=48;x<52;x++)this.map[54][x]=0;this.note('The Keeper has fallen. The boss gate is open for both teams.');}
      if(t.type==='boss'){this.phase='finished';this.note('The Dungeon Lord has fallen!');}
      if(t.type!=='boss'&&Math.random()<0.15)this.items.push({id:uid(),type:'potion',x:t.x,y:t.y});}}
  }
  safe(p){return p.x>44*32&&p.x<56*32&&p.y<8*32;}
  area(p,r,damage,kind='aura',cone=false){for(const t of this.targets(p)){const a=Math.atan2(t.y-p.y,t.x-p.x);const diff=Math.atan2(Math.sin(a-p.facing),Math.cos(a-p.facing));if(distance(p,t)<r+(t.r||11)&&(!cone||Math.abs(diff)<1.45)&&this.visible(p,t))this.damage(t,damage,p);}}
  projectile(p,kind='bolt',angle=p.facing){this.shots.push({id:uid(),owner:p.id,team:p.team,x:p.x,y:p.y,dx:Math.cos(angle),dy:Math.sin(angle),kind,speed:kind==='mana'?260:360,life:2,damage:kind==='fireball'?65:kind==='mana'?120:kind==='slash'?65:25,r:kind==='mana'?18:8});}
  action(p,key){if(this.phase!=='playing'||p.hp<=0||!p.connected||p.cd[key]>0)return;const mage=p.cls==='mage';
    if(key==='space'){if(!p.potions||p.hp>=6)return;p.potions--;p.hp++;p.cd.space=3;this.effect({kind:'potion',x:p.x,y:p.y});return;}
    if(!['attack','q','w','e','r'].includes(key))return;
    p.cd[key]=({attack:0.65,q:4,w:mage?6:15,e:mage?15:10,r:45})[key];
    if(key==='attack'){p.attackAnim=.4;if(mage){this.projectile(p);if(p.flow>0){this.projectile(p,'bolt',p.facing-0.2);this.projectile(p,'bolt',p.facing+0.2);}}else this.area(p,76,25,'swing',true);}
    if(key==='q'){if(mage)this.projectile(p,'fireball');else{p.inv=Math.max(p.inv,0.5);p.dashLeft=.3;p.dashAngle=p.facing;p.dashHits=[];}}
    if(key==='w'){if(mage){this.effect({x:p.x,y:p.y,r:40,kind:'blink',team:p.team,color:'#88aaff'});this.move(p,Math.cos(p.facing)*180,Math.sin(p.facing)*180);p.blinkFlash=.3;p.inv=Math.max(p.inv,0.5);}else{p.spin=1.2;p.inv=Math.max(p.inv,1.2);}}
    if(key==='e'){if(mage)p.flow=5;else this.projectile(p,'slash');}
    if(key==='r'){if(mage)this.projectile(p,'mana');else{p.aura=7;p.inv=Math.max(p.inv,7);}}
  }
  input(p,data){if(!Number.isFinite(data.aimX)||!Number.isFinite(data.aimY))throw Error('Invalid aim.');p.lastSeen=Date.now();p.input={aimX:Math.max(0,Math.min(3200,data.aimX)),aimY:Math.max(0,Math.min(2560,data.aimY)),move:!!data.move,attack:!!data.attack};p.facing=Math.atan2(p.input.aimY-p.y,p.input.aimX-p.x);if(Array.isArray(data.actions))for(const key of data.actions.slice(0,5))this.action(p,key);}
  enqueue(p,commands){if(!Array.isArray(commands)||commands.length>12)throw Error('Invalid input batch.');p.queue??=[];for(const c of commands){if(!Number.isSafeInteger(c.seq)||c.seq<1||!Number.isFinite(c.aimX)||!Number.isFinite(c.aimY))throw Error('Invalid input.');if(c.seq<=(p.lastQueued||p.ack||0))continue;if(p.queue.length>=120)throw Error('Input queue full.');p.queue.push({seq:c.seq,aimX:Math.max(0,Math.min(3200,c.aimX)),aimY:Math.max(0,Math.min(2560,c.aimY)),move:!!c.move,attack:!!c.attack,aiming:['q','e'].includes(c.aiming)?c.aiming:null,actions:Array.isArray(c.actions)?c.actions.filter(k=>['attack','q','w','e','r','space'].includes(k)).slice(0,5):[]});p.lastQueued=c.seq;}p.lastSeen=Date.now();}
  tick(dt=DT){if(this.phase!=='playing')return;this.time+=dt;for(const p of this.players){for(const k in p.cd)p.cd[k]=Math.max(0,p.cd[k]-dt);p.inv=Math.max(0,p.inv-dt);p.flow=Math.max(0,(p.flow||0)-dt);p.attackAnim=Math.max(0,(p.attackAnim||0)-dt);p.blinkFlash=Math.max(0,(p.blinkFlash||0)-dt);p.spin=Math.max(0,(p.spin||0)-dt);p.aura=Math.max(0,(p.aura||0)-dt);
      if(p.hp<=0){p.queue=[];p.ack=p.lastQueued||p.ack||0;p.dashLeft=0;p.credit=0;p.respawn-=dt;if(p.respawn<=0){p.hp=p.maxHp;p.x=(p.team==='red'?48:52)*32;p.y=5*32;p.inv=3;p.potions=1;p.input={};}continue;}
      if(!p.connected||Date.now()-p.lastSeen>1000){p.input={};continue;}
      if(p.queue){p.credit=Math.min(.2,(p.credit||0)+dt);while(p.queue.length&&p.credit>=STEP-1e-8){const c=p.queue.shift();p.credit-=STEP;p.facing=Math.atan2(c.aimY-p.y,c.aimX-p.x);for(const k of c.actions)this.action(p,k);if(c.attack)this.action(p,'attack');advanceMovement(this.map,p,c,STEP,this.scenery);p.ack=c.seq;if(p.dashLeft>0)for(const t of this.targets(p))if(!p.dashHits.includes(t.id)&&distance(p,t)<(t.r||11)+25&&this.visible(p,t)){this.damage(t,45,p);p.dashHits.push(t.id);}}}
      else {const input=p.input;advanceMovement(this.map,p,{aimX:p.x+Math.cos(p.facing),aimY:p.y+Math.sin(p.facing),...input},dt,this.scenery);if(input.attack)this.action(p,'attack');}
      for(const key of ['spin','aura'])if(p[key]>0){if((p.cd[key+'Tick']||0)<=0){this.area(p,key==='spin'?70:130,key==='spin'?14:8);p.cd[key+'Tick']=0.2;}}
      for(const item of this.items)if(!item.taken&&distance(p,item)<25&&p.potions<3){p.potions++;item.taken=true;}
    }
    for(const e of this.enemies){if(e.hp<=0)continue;e.cd-=dt;const living=this.players.filter(p=>p.connected&&p.hp>0&&!this.safe(p));living.sort((a,b)=>distance(e,a)-distance(e,b));const target=living[0];if(!target||distance(e,target)>600||!this.visible(e,target))continue;
      const d=distance(e,target),a=Math.atan2(target.y-e.y,target.x-e.x);if(d>(e.type==='imp'?180:34))this.move(e,Math.cos(a)*(e.type==='zombie'?50:75)*dt,Math.sin(a)*(e.type==='zombie'?50:75)*dt);
      if(e.cd<=0){if(e.type==='imp'){this.shots.push({id:uid(),owner:e.id,x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),speed:145,life:3,kind:'enemy',r:7});e.cd=2.5;}else if(e.type==='boss'&&d<400){for(let i=0;i<12;i++)this.shots.push({id:uid(),owner:e.id,x:e.x,y:e.y,dx:Math.cos(i*Math.PI/6),dy:Math.sin(i*Math.PI/6),speed:130,life:3,kind:'enemy',r:8});e.cd=2;}else if(d<40){this.damage(target,1);e.cd=1;}}
    }
    for(const s of this.shots){s.life-=dt;const owner=this.players.find(p=>p.id===s.owner);const targets=s.team?(owner?this.targets(owner):[]):this.players.filter(p=>p.connected&&p.hp>0);const steps=Math.ceil(s.speed*dt/5);for(let i=0;i<steps&&s.life>0;i++){s.x+=s.dx*s.speed*dt/steps;s.y+=s.dy*s.speed*dt/steps;const hit=targets.find(t=>distance(s,t)<s.r+(t.r||11));if(hit||!this.walkable(s.x,s.y,0)){if(hit)this.damage(hit,s.damage||1,owner);if(owner&&['fireball','mana'].includes(s.kind)){const r=s.kind==='mana'?110:65;this.effect({x:s.x,y:s.y,r,kind:'burst',team:s.team,color:s.kind==='mana'?'#c060ff':'#ff8a30'});for(const t of targets)if(t!==hit&&distance(s,t)<r&&this.visible(s,t))this.damage(t,s.damage,owner);}s.life=0;}}}
    this.shots=this.shots.filter(s=>s.life>0);this.items=this.items.filter(i=>!i.taken);this.fx=this.fx.filter(f=>(f.life-=dt)>0);
  }
  snapshot(){return {code:this.code,host:this.host,phase:this.phase,time:this.time,scores:this.scores,doorOpen:this.doorOpen,brokenScenery:this.scenery.filter(s=>s.hp<=0).map(s=>s.id),players:this.players.map(({token,input,lastSeen,queue,credit,lastQueued,dashHits,...p})=>p),enemies:this.enemies.filter(e=>e.hp>0),items:this.items,shots:this.shots,fx:this.fx,events:this.events};}
}
