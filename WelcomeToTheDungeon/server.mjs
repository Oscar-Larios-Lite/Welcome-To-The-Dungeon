import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {Game,DT} from './game.mjs';
const rooms=new Map(), streams=new Map(), limits=new Map();
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
function authenticate(req,code){const room=rooms.get(code);if(!room)throw Error('Room not found. It may have expired.');const token=req.headers.authorization?.replace(/^Bearer /,'');const p=room.players.find(p=>p.token===token);if(!p)throw Error('Please join this room first.');return {room,p};}
async function body(req){let s='';for await(const chunk of req){s+=chunk;if(s.length>8192)throw Error('Request too large.');}return JSON.parse(s||'{}');}
export const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{ok:true});
  if(req.method==='POST'){
    const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)return json(res,403,{error:'Cross-origin requests are not allowed.'});
    const data=await body(req);const ip=req.socket.remoteAddress;let limit=limits.get(ip);if(!limit||Date.now()-limit.at>1000){limit={at:Date.now(),count:0};limits.set(ip,limit);}if(++limit.count>300)return json(res,429,{error:'Too many requests.'});
    if(url.pathname==='/api/create'){if(rooms.size>=100)throw Error('Server is full. Try again later.');const code=randomBytes(4).toString('hex').toUpperCase();const room=new Game(code);room.touched=Date.now();rooms.set(code,room);const p=room.join(data.name);return json(res,200,{code,id:p.id,token:p.token,map:room.map,rooms:room.rooms});}
    const match=url.pathname.match(/^\/api\/([A-F0-9]{8})\/(join|input|choose|ready|start|leave)$/);if(!match)return json(res,404,{error:'Not found'});const [,code,action]=match;
    if(action==='join'){const room=rooms.get(code);if(!room)throw Error('Room not found. Check the code.');const p=room.join(data.name);room.touched=Date.now();return json(res,200,{code,id:p.id,token:p.token,map:room.map,rooms:room.rooms});}
    const {room,p}=authenticate(req,code);room.touched=Date.now();
    if(action==='input')room.input(p,data);
    if(action==='choose')room.choose(p,data.team,data.cls);
    if(action==='ready'){if(room.phase!=='lobby')throw Error('Match already started.');p.ready=!!data.ready;}
    if(action==='start')room.start(p);
    if(action==='leave'){streams.get(p.id)?.end();streams.delete(p.id);room.players=room.players.filter(q=>q!==p);if(room.host===p.id)room.host=room.players[0]?.id||null;}
    return json(res,200,{ok:true});
  }
  const events=url.pathname.match(/^\/api\/([A-F0-9]{8})\/events$/);
  if(req.method==='GET'&&events){const {room,p}=authenticate(req,events[1]);streams.get(p.id)?.end();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': connected\n\n');streams.set(p.id,res);p.connected=true;p.lastSeen=Date.now();req.on('close',()=>{if(streams.get(p.id)===res){streams.delete(p.id);p.connected=false;p.ready=false;p.input={};p.disconnectedAt=Date.now();}});return;}
  const files={'/':['index.html','text/html'],'/client.js':['client.js','text/javascript'],'/style.css':['style.css','text/css'],'/atlas.png':['atlas.png','image/png']};const file=files[url.pathname];if(req.method==='GET'&&file){res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-cache'});res.end(await readFile(new URL('./public/'+file[0],import.meta.url)));return;}json(res,404,{error:'Not found'});
}catch(e){if(!res.headersSent)json(res,400,{error:e.message});else res.end();}});
let step=0;
const timer=setInterval(()=>{step++;for(const [code,room]of rooms){room.tick(DT);if(step%2===0){const packet='data: '+JSON.stringify(room.snapshot())+'\n\n';for(const p of room.players){const stream=streams.get(p.id);if(stream&&!stream.writableNeedDrain)stream.write(packet);}}
    for(const p of [...room.players])if(!p.connected&&Date.now()-(p.disconnectedAt||p.lastSeen)>60000){room.players=room.players.filter(q=>q!==p);if(room.host===p.id)room.host=room.players[0]?.id||null;}
    if(!room.players.length||Date.now()-room.touched>4*3600000){for(const p of room.players)streams.get(p.id)?.end();rooms.delete(code);}}
  if(limits.size>10000)limits.clear();
},1000/30);timer.unref();
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url)server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Dungeon server listening on port '+(process.env.PORT||3000)));
