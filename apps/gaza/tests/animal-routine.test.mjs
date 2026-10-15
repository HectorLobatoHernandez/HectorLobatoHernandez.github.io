import test from 'node:test';
import assert from 'node:assert/strict';
import {animalRoutine} from '../runtime/farm/life/animal-routine.mjs';

test('a cow walks slowly to water, remains to drink and returns without jumping',()=>{
 const cow={position:[0,0],zone:'cow-yard',index:0,yaw:0};
 const at=t=>animalRoutine(cow,t,[12,0]);
 const states=Array.from({length:240},(_,i)=>at(i));
 assert.ok(states.some(s=>s.activity==='BEBIENDO SIM'));
 assert.ok(states.some(s=>s.activity==='REGRESO SIM'));
 for(let i=1;i<states.length;i++)assert.ok(Math.hypot(states[i].x-states[i-1].x,states[i].z-states[i-1].z)<.5);
 const drinking=states.find(s=>s.activity==='BEBIENDO SIM');
 assert.equal(drinking.walk,0);
 assert.ok(drinking.headTilt<-.4);
});

test('indoor sheep stays inside its assigned stall',()=>{
 const sheep={position:[17,22],zone:'ovine',index:4,yaw:Math.PI};
 for(const t of [0,30,90,300])assert.deepEqual([animalRoutine(sheep,t,[0,0]).x,animalRoutine(sheep,t,[0,0]).z],[17,22]);
});
