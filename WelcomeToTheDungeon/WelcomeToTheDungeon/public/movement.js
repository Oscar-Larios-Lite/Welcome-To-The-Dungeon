// Shared by the authoritative server and the browser's prediction/replay.
export const STEP=1/60;
export function walkable(map,x,y,r=11,scenery=[]){
  for(const dx of [-r,r])for(const dy of [-r,r])if(map[Math.floor((y+dy)/32)]?.[Math.floor((x+dx)/32)]!==0)return false;
  if(r>0)for(const s of scenery)if(s.solid&&s.hp>0&&x+r>s.x-s.w/2&&x-r<s.x+s.w/2&&y+r>s.y-s.h/2&&y-r<s.y+s.h/2)return false;
  return true;
}
export function move(map,p,dx,dy,scenery=[]){const n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));for(let i=0;i<n;i++){if(walkable(map,p.x+dx/n,p.y,11,scenery))p.x+=dx/n;if(walkable(map,p.x,p.y+dy/n,11,scenery))p.y+=dy/n;}}
export function advanceMovement(map,p,input,dt=STEP,scenery=[]){
  const x=p.x,y=p.y;
  if(p.hp<=0){p.moving=false;return;}
  p.facing=Math.atan2(input.aimY-p.y,input.aimX-p.x);
  if(p.dashLeft>0){move(map,p,Math.cos(p.dashAngle)*720*dt,Math.sin(p.dashAngle)*720*dt,scenery);p.dashLeft=Math.max(0,p.dashLeft-dt);}
  else if(input.move&&!input.aiming){const d=Math.hypot(input.aimX-p.x,input.aimY-p.y);if(d>5)move(map,p,(input.aimX-p.x)/d*Math.min(d,156*dt),(input.aimY-p.y)/d*Math.min(d,156*dt),scenery);}
  p.moving=Math.hypot(p.x-x,p.y-y)>0.1;
}
export function predictCommand(map,p,command,scenery=[]){
  p.cd={...p.cd};for(const k in p.cd)p.cd[k]=Math.max(0,p.cd[k]-STEP);
  for(const k of ['inv','spin','aura','flow','attackAnim','blinkFlash'])p[k]=Math.max(0,(p[k]||0)-STEP);
  p.facing=Math.atan2(command.aimY-p.y,command.aimX-p.x);
  for(const key of [...command.actions,...(command.attack?['attack']:[])]){
    if(p.hp<=0||p.cd[key]>0)continue;
    const mage=p.cls==='mage';p.cd[key]=({attack:.65,q:4,w:mage?6:15,e:mage?15:10,r:45,space:3})[key]||0;
    if(key==='attack')p.attackAnim=.4;
    if(key==='q'&&!mage){p.dashLeft=.3;p.dashAngle=p.facing;p.inv=Math.max(p.inv,.5);}
    if(key==='w'){if(mage){move(map,p,Math.cos(p.facing)*180,Math.sin(p.facing)*180,scenery);p.blinkFlash=.3;p.inv=Math.max(p.inv,.5);}else{p.spin=1.2;p.inv=Math.max(p.inv,1.2);}}
    if(key==='e'&&mage)p.flow=5;
    if(key==='r'&&!mage){p.aura=7;p.inv=Math.max(p.inv,7);}
  }
  advanceMovement(map,p,command,STEP,scenery);
}
export class Predictor {
  constructor(){this.reset();}
  reset(){this.player=null;this.pending=[];this.sequence=0;this.offset={x:0,y:0};}
  reconcile(authoritative,map,scenery=[]){
    const old=this.player;this.sequence=Math.max(this.sequence,authoritative.ack||0);
    this.pending=this.pending.filter(c=>c.seq>(authoritative.ack||0));
    this.player={...authoritative,cd:{...authoritative.cd}};
    for(const c of this.pending)predictCommand(map,this.player,c,scenery);
    if(old&&old.hp>0&&authoritative.hp>0){const dx=old.x-this.player.x,dy=old.y-this.player.y;if(Math.hypot(dx,dy)<100){this.offset.x+=dx;this.offset.y+=dy;}else this.offset={x:0,y:0};}else this.offset={x:0,y:0};
  }
  step(input,map,scenery=[]){if(!this.player||this.pending.length>=120)return null;const command={...input,actions:[...input.actions],seq:++this.sequence};predictCommand(map,this.player,command,scenery);this.pending.push(command);return command;}
  view(dt){if(!this.player)return null;const decay=Math.exp(-20*dt);this.offset.x*=decay;this.offset.y*=decay;return {...this.player,x:this.player.x+this.offset.x,y:this.player.y+this.offset.y};}
}
