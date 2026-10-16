import * as THREE from 'three';
import {createResident} from './atlas-resident.mjs';
import {projectViews} from './atlas-project-views.mjs';
export function createProjectResident(scene,id,origin=new THREE.Vector3()){
 const poses=projectViews[id]?.poses||[{eye:[-1,0,2]},{eye:[-1,0,-1.5]}],a=new THREE.Vector3(...poses[0].eye),b=new THREE.Vector3(...poses[1].eye);a.y=b.y=.035;
 const side=new THREE.Vector3(b.z-a.z,0,a.x-b.x).normalize().multiplyScalar(.55);const start=a.clone().lerp(b,.3).add(side).sub(origin),end=a.clone().lerp(b,.7).add(side).sub(origin),actor=createResident({parent:scene,id,a:start.toArray(),b:end.toArray(),club:/salada|furnet|soleil/.test(id)});actor.setEnabled(false);actor.setVisible(false);let last=0,built=false;
 return {toggle(){actor.setEnabled(!actor.enabled);actor.setVisible(built&&actor.enabled);return actor.enabled},setBuilt(v){built=v;actor.setVisible(v&&actor.enabled)},tick(now){if(!built||!actor.enabled||now-last<180)return false;last=now;actor.update(now/1000);return true},snapshot(){return {...actor.snapshot(),animated:actor.enabled}}};
}
