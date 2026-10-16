import {createVenueCrowd,commercialVenues} from './atlas-venue-crowd.mjs';
import * as THREE from 'three';
import {createResident} from './atlas-resident.mjs';
import {projectViews} from './atlas-project-views.mjs';
export function createProjectResident(scene,id,origin=new THREE.Vector3()){
 const poses=projectViews[id]?.poses||[{eye:[-1,0,2]},{eye:[-1,0,-1.5]}],a=new THREE.Vector3(...poses[0].eye),b=new THREE.Vector3(...poses[1].eye);a.y=b.y=.035;
 const side=new THREE.Vector3(b.z-a.z,0,a.x-b.x).normalize().multiplyScalar(.55);const start=a.clone().lerp(b,.3).add(side).sub(origin),end=a.clone().lerp(b,.7).add(side).sub(origin),actor=createResident({parent:scene,id,a:start.toArray(),b:end.toArray(),club:/salada|furnet|soleil/.test(id)});const crowd=createVenueCrowd({parent:scene,id,origin,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches}),commercial=!!commercialVenues[id];actor.setEnabled(commercial);actor.setVisible(false);let last=0,built=false;if(commercial){const button=document.getElementById('resident-toggle');button.textContent='Venue life';button.title='Fictional visitors and DJ atmosphere';button.setAttribute('aria-pressed','true');}
 return {toggle(){actor.setEnabled(!actor.enabled);crowd?.setEnabled(actor.enabled);actor.setVisible(built&&actor.enabled);return actor.enabled},setBuilt(v){built=v;actor.setVisible(v&&actor.enabled)},tick(now,night=1){const animated=crowd?.update(now/1000,night,built);if(!built||!actor.enabled||now-last<180)return !!animated;last=now;actor.update(now/1000);return true},snapshot(){return {...actor.snapshot(),animated:actor.enabled,crowd:crowd?.snapshot()||null}}};
}
