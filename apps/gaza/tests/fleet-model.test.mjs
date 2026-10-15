import test from 'node:test';
import assert from 'node:assert/strict';
import {motion,pathAt,pathPrefix,TRIPS} from '../runtime/fleet/model.mjs';
test('stops hold the vehicle at a fixed road position and the simulation loops',()=>{
 assert.equal(motion(30).progress,motion(42).progress);
 assert.equal(motion(85).progress,motion(89).progress);
 assert.deepEqual(motion(240),motion(0));
 assert.equal(motion(215).complete,true);
});
test('route interpolation respects endpoints and a midpoint',()=>{
 const route=[[41,-6],[41,-5],[41,-4]];
 assert.deepEqual(pathAt(route,0),route[0]);
 assert.deepEqual(pathAt(route,1),route[2]);
 assert.deepEqual(pathAt(route,.5),route[1]);
 assert.equal(pathAt([],0),null);
 const uneven=[[41,-6],[41,-5.9],[41,-4]];assert.deepEqual(pathPrefix(uneven,.5).at(-1),pathAt(uneven,.5));assert.equal(pathPrefix(uneven,.5).length,3);
});
test('all fleet events carry explicit simulation identities',()=>{
 assert.equal(TRIPS.length,3);
 for(const trip of TRIPS){assert.match(trip.id,/^SIM-/);assert.ok(trip.events.every(e=>e.at>0&&e.at<240&&e.duration>0&&motion(e.at+1).dwell));}
});
