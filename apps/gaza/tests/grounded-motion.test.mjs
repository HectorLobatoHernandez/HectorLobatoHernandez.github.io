import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {animalRoutine} from '../runtime/farm/life/animal-routine.mjs';
import {buildFarmWorld} from '../runtime/farm/world.mjs';
import {buildFarmLife} from '../runtime/farm/life/layer.mjs';
import {herdPlan} from '../runtime/farm/life/herd-model.mjs';
import {milkingLanePose,milkingLanes} from '../runtime/farm/milking-lanes.mjs';
import {projectFarm} from '../runtime/farm/model.mjs';
import {buildExterior} from '../runtime/site-real-world.mjs';
import {initialState} from '../runtime/processes/ledger.mjs';

test('grazing and watering turns remain continuous at phase boundaries',()=>{
 const member={index:0,zone:'cow-yard',position:[0,0],yaw:.4};
 let previous=animalRoutine(member,0,[4,0]);
 for(let t=.05;t<180;t+=.05){
  const next=animalRoutine(member,t,[4,0]);
  const angle=Math.atan2(Math.sin(next.yaw-previous.yaw),Math.cos(next.yaw-previous.yaw));
  assert(Math.abs(angle)<.1,`instant turn at ${t}`);
  assert(Math.hypot(next.x-previous.x,next.z-previous.z)<.1,`position jump at ${t}`);
  previous=next;
 }
 const lane=milkingLanes({x:0,z:0,yaw:0,d:25}).BOVINE;
 assert(Math.abs(milkingLanePose(lane,.78001).yaw-milkingLanePose(lane,.77999).yaw)<.02);
});

test('visible hoof meshes contact their actual indoor floor or yard',()=>{
 const original=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
 const Mock={...T,TextureLoader:class{load(_url,callback){const tx=new T.Texture();callback?.(tx);return tx}}};
 const world=buildFarmWorld(Mock,new T.Scene()),life=buildFarmLife(Mock,world);
 try{
  const view=projectFarm(initialState(),'SIM-BOV-001'),plans=herdPlan(view);
  life.update(view);
  let indoor=false,yard=false;
  world.root.traverse(group=>{
   if(!group.name.startsWith('DETAIL_HERD_')||!group.children.length||group.name.endsWith('_4'))return;
   const [, ,species,seedText]=group.name.split('_'),seed=Number(seedText);
   const members=plans.find(p=>p.species===species).members.filter(m=>m.morphologySeed===seed);
   // The last four parts in each batch are hooves and have a low local bounding box.
   const foot=group.children.at(-1);foot.geometry.computeBoundingBox();
   const body=group.children[0];const matrix=new T.Matrix4(),box=new T.Box3();
   assert.equal(body.count,members.length);
   for(let i=0;i<body.count;i++){
    foot.getMatrixAt(i,matrix);box.copy(foot.geometry.boundingBox).applyMatrix4(matrix);
    const isYard=members[i].zone.includes('yard'),ground=isYard?.27:.365;
    assert(Math.abs(box.min.y-ground)<.065,`hoof does not contact ${isYard?'yard':'floor'}: ${box.min.y}`);
    indoor ||= !isYard;yard ||= isYard;
   }
  });
  assert(indoor&&yard);
 }finally{life.dispose();world.dispose();globalThis.document=original}
});

test('fleet wheels and practice pallets rest on their respective road and warehouse floor',()=>{
 const original=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){},beginPath(){},lineTo(){},arc(){},fill(){}})})};
 const Mock={...T,TextureLoader:class{load(_url,callback){const tx=new T.Texture();callback?.(tx);return tx}}};
 const world=buildExterior(Mock);
 try{
  for(const truck of world.moving){
   const wheel=truck.wheels[0];wheel.geometry.computeBoundingBox();wheel.updateWorldMatrix(true,false);
   const bounds=wheel.geometry.boundingBox.clone().applyMatrix4(wheel.matrixWorld);
   assert(Math.abs(bounds.min.y)<.025,`truck wheel above road by ${bounds.min.y}`);
  }
  const forklift=world.root.getObjectByName('SIM-DOCK-FORKLIFT');
  const wheel=forklift.children.find(o=>o.isMesh&&o.geometry.type==='CylinderGeometry');
  wheel.geometry.computeBoundingBox();wheel.updateWorldMatrix(true,false);
  assert(Math.abs(wheel.geometry.boundingBox.clone().applyMatrix4(wheel.matrixWorld).min.y-.35)<.03);
  const pallets=world.root.getObjectByName('DOCK_PALLETS_PRACTICE_ONLY');
  for(const pallet of pallets.children.filter((_,i)=>i%2===0)){
   pallet.geometry.computeBoundingBox();pallet.updateWorldMatrix(true,false);
   assert(Math.abs(pallet.geometry.boundingBox.clone().applyMatrix4(pallet.matrixWorld).min.y-.35)<.025);
  }
 }finally{world.dispose();globalThis.document=original}
});
