import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {headingDegrees} from '../runtime/fleet/cab.mjs';

test('truck heading matches north and east in route coordinates',()=>{
 assert.equal(headingDegrees([41,-5],[42,-5]),0);
 assert.ok(Math.abs(headingDegrees([41,-5],[41,-4])-90)<.001);
});

test('cached road references and segments belong to the ten public route geometries',()=>{
 const cache=JSON.parse(readFileSync(new URL('../data/fleet-road-refs-20261016.json',import.meta.url)));
 const routes=JSON.parse(readFileSync(new URL('../data/fleet-routes-osrm-20261015.json',import.meta.url)));
 assert.equal(cache.schema,'GAZA_FLEET_ROAD_REFS_SIM_V1');
 assert.deepEqual(Object.keys(cache.routes),routes.routes.map(x=>x.id));
 for(const entry of Object.values(cache.routes)){
  assert.ok(entry.roadRefs.length>0);
  assert.ok(entry.roadSegments.every(x=>entry.roadRefs.includes(x.ref)&&x.from>=0&&x.from<=1));
  assert.ok(entry.roadSegments.every((x,i)=>i===0||x.from>=entry.roadSegments[i-1].from));
 }
});
