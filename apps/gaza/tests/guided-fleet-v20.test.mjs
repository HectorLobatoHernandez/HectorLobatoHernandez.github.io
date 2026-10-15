import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GUIDE_STEPS} from '../runtime/demo/tour-steps.mjs';
import {buildFleetTruck} from '../runtime/fleet/truck-model.mjs';

test('guided flow visits every active department in material order',()=>{
 assert.deepEqual(GUIDE_STEPS.map(s=>s.view),['farm','labs','site','site','site','fleet','workflow']);
 assert.deepEqual(GUIDE_STEPS.filter(s=>s.view==='site').map(s=>s.focus),['reception','process','asrs']);
});

test('synthetic 3D fleet model has two load variants, selection light and visual provenance',()=>{
 const label=new THREE.MeshBasicMaterial({color:0xffffff});
 for(const kind of ['Recogida','Expedición']){
  const model=buildFleetTruck(THREE,{vehicle:{id:'SIM-FLT-01',kind},labelMaterial:label});
  assert.equal(model.group.userData.provenance,'SYNTHETIC_VEHICLE_DIMENSIONS_AND_LIVERY');
  assert(model.parts.filter(x=>x.name.startsWith('Neumático')).length>=6);
  assert(model.parts.some(x=>x.name.includes('GAZA · OPERACIÓN SIM')));
  assert(model.parts.some(x=>kind==='Recogida'?x.name.includes('Tanque de acero'):x.name.includes('Semirremolque')));
  model.setNight(true,true);assert(model.lights[0].visible);assert(model.lights[0].intensity>0);
  model.setNight(false,true);assert.equal(model.lights[0].visible,false);
  const width=new THREE.Box3().setFromObject(model.group).getSize(new THREE.Vector3()).x;
  assert(width>.017&&width<.1);
  model.dispose();
 }
 label.dispose();
});
