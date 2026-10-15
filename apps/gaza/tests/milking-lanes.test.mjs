import test from 'node:test';
import assert from 'node:assert/strict';
import {BUILDINGS,frame} from '../runtime/farm/site.mjs';
import {milkingLanes,milkingLanePose} from '../runtime/farm/milking-lanes.mjs';

test('sheep and cow enter separate lanes and stay in their own milking positions',()=>{
 const f=frame(BUILDINGS.find(b=>b.id==='milking')),lanes=milkingLanes(f);
 const local=([x,z])=>[(x-f.x)*Math.cos(f.yaw)-(z-f.z)*Math.sin(f.yaw),(x-f.x)*Math.sin(f.yaw)+(z-f.z)*Math.cos(f.yaw)];
 for(const [species,side] of [['BOVINE',1],['OVINE',-1]]){
  const lane=lanes[species];
  for(const p of [.15,.25,.5,.78]){
   const pose=milkingLanePose(lane,p),[x,z]=local(pose.position);
   assert.ok(Math.abs(x-side*3.2)<.01);
   assert.ok(Math.abs(z)<=f.d/2);
   assert.equal(pose.walking,false);
  }
  const first=local(lane.route[0]);
  assert.ok(Math.abs(first[1])>f.d/2);
  assert.ok(Number.isFinite(milkingLanePose(lane,.1).yaw));
 }
 assert.ok(local(lanes.BOVINE.route.at(-1))[1]<0);
 assert.ok(local(lanes.OVINE.route.at(-1))[1]>0);
});
