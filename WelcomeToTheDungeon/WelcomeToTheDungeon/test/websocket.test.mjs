import test from 'node:test';
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import {server} from '../server.mjs';
test('WebSocket authentication, two-player state, input acknowledgement, stop and reconnect',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,clients=[];
 const post=async(path,data={},token)=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return r.json();};
 function open(session){return new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('http','ws')+'/socket');clients.push(ws);const events=[];ws.on('message',raw=>events.push(JSON.parse(raw)));ws.on('error',reject);ws.on('open',()=>{ws.send(JSON.stringify({type:'auth',code:session.code,token:session.token}));resolve({ws,events});});});}
 async function wait(client,predicate){const deadline=Date.now()+3000;while(Date.now()<deadline){const m=client.events.find(predicate);if(m)return m;await new Promise(r=>setTimeout(r,10));}throw Error('Expected WebSocket event was not received');}
 try{const a=await post('create',{name:'A'}),b=await post(a.code+'/join',{name:'B'}),ca=await open(a),cb=await open(b);await wait(ca,m=>m.type==='welcome');await wait(cb,m=>m.type==='welcome');for(const p of [a,b])await post(a.code+'/ready',{ready:true},p.token);await post(a.code+'/start',{},a.token);const initial=(await wait(ca,m=>m.type==='state'&&m.state.phase==='playing')).state.players.find(p=>p.id===a.id);
 ca.ws.send(JSON.stringify({type:'input',commands:[{seq:1,aimX:1600,aimY:200,move:true,actions:[]}]}));const state=await wait(ca,m=>m.type==='state'&&m.state.players.find(p=>p.id===a.id)?.ack===1);assert.notEqual(state.state.players.find(p=>p.id===a.id).x,initial.x);assert.ok(!JSON.stringify(state).includes(a.token));await wait(cb,m=>m.type==='state'&&m.state.players.some(p=>p.ack===1));
 ca.ws.send(JSON.stringify({type:'stop'}));ca.ws.send(JSON.stringify({type:'ping',sent:123}));await wait(ca,m=>m.type==='pong'&&m.sent===123);ca.ws.close();await new Promise(r=>ca.ws.once('close',r));const resumed=await open(a);await wait(resumed,m=>m.type==='welcome');const reconnect=await wait(resumed,m=>m.type==='state');assert.equal(reconnect.state.players.find(p=>p.id===a.id).ack,1);
 const invalid=await open({...a,token:'wrong'});await wait(invalid,m=>m.type==='error');assert.equal(invalid.events.some(m=>m.type==='state'),false);
 }finally{for(const ws of clients)ws.terminate();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
