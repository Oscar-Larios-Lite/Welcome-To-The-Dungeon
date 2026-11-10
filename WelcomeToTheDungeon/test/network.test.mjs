import test from 'node:test';
import assert from 'node:assert/strict';
import {server} from '../server.mjs';
test('two authenticated network clients join, choose, ready and receive the same match',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;const controllers=[];
 const post=async(path,data={},token)=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(data)});return {status:r.status,...await r.json()};};
 try{const a=await post('create',{name:'Alice'}),b=await post(a.code+'/join',{name:'Bob'});assert.equal(a.status,200);assert.equal(b.status,200);assert.notEqual(a.token,b.token);assert.equal((await post(a.code+'/start',{})).status,400);
 const readers=[];for(const p of [a,b]){const c=new AbortController();controllers.push(c);const r=await fetch(base+'/api/'+a.code+'/events',{headers:{Authorization:'Bearer '+p.token},signal:c.signal});assert.equal(r.status,200);readers.push(r.body.getReader());}
 assert.equal((await post(a.code+'/choose',{team:'red',cls:'mage'},b.token)).status,200);for(const p of [a,b])assert.equal((await post(a.code+'/ready',{ready:true},p.token)).status,200);assert.equal((await post(a.code+'/start',{},a.token)).status,200);
 const snapshots=await Promise.all(readers.map(async reader=>{let s='';const deadline=Date.now()+3000;while(Date.now()<deadline){const {value}=await reader.read();s+=new TextDecoder().decode(value);for(const line of s.split('\n'))if(line.startsWith('data: ')){const snapshot=JSON.parse(line.slice(6));if(snapshot.phase==='playing')return snapshot;}s=s.slice(s.lastIndexOf('\n')+1);}throw Error('No match snapshot');}));
 for(const s of snapshots){assert.equal(s.players.length,2);assert.equal(s.players.find(p=>p.id===b.id).cls,'mage');assert.equal(s.players.find(p=>p.id===b.id).team,'red');assert.equal(s.code,a.code);}assert.deepEqual(snapshots[0].enemies.map(e=>e.id),snapshots[1].enemies.map(e=>e.id));
 }finally{controllers.forEach(c=>c.abort());server.closeAllConnections();await new Promise(r=>server.close(r));}
});
