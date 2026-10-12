import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {BUILDINGS,frame} from '../runtime/farm/site.mjs';
import {INDOOR_ALIGNMENT,placements,herdPlan,DEFAULTS} from '../runtime/farm/life/herd-model.mjs';
import {buildFarmWorld} from '../runtime/farm/world.mjs';
import {buildFarmLife} from '../runtime/farm/life/layer.mjs';
import {projectFarm} from '../runtime/farm/model.mjs';
import {initialState,reduce} from '../runtime/processes/ledger.mjs';
const f=frame(BUILDINGS.find(b=>b.id==='bovine'));
const cows=()=>placements('BOVINE').filter(p=>p.zone==='bovine');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function localPosition(p){const dx=p[0]-f.x,dz=p[1]-f.z;return [Math.cos(f.yaw)*dx-Math.sin(f.yaw)*dz,Math.sin(f.yaw)*dx+Math.cos(f.yaw)*dz]}
function assertHeading(slot,yaw=slot.yaw){const a=yaw-f.yaw,z=localPosition(slot.position)[1];assert(Math.abs(Math.cos(a))<1e-6,'Cow must follow the cubicle axis, not the aisle');assert(-Math.sin(a)*z<0,'Each row must face toward the center aisle')}
function fixture(fn){const old=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};const Mock={...T,TextureLoader:class{load(url,cb){const tx=new T.Texture();cb?.(tx);return tx}}};const scene=new T.Scene(),world=buildFarmWorld(Mock,scene),life=buildFarmLife(Mock,world);try{fn(world,life,scene)}finally{life.dispose();world.dispose();globalThis.document=old}}
test('both indoor cow rows align to local cubicle Z with heads inward',()=>{assert.equal(INDOOR_ALIGNMENT,'bovine-cubicles-20261012-v1');assert.equal(cows().length,46);assert.deepEqual([...new Set(cows().map(p=>p.row))],[-1,1]);for(const p of cows())assertHeading(p)});
test('each indoor cow is centered on an existing bed, with unique occupancy',()=>{const occupied=new Set();for(const p of cows()){const[x,z]=localPosition(p.position),expected=-f.w/2+3+p.stallIndex*3.2;assert(Math.abs(x-expected)<1e-6);assert(Math.abs(z-p.row*(f.d*.32+1.5))<1e-6);const key=p.row+':'+p.stallIndex;assert(!occupied.has(key),'Duplicate cubicle');occupied.add(key);assert.equal(p.space,3.2)}});
test('pasture cow coordinates and headings remain byte-identical',()=>{assert.equal(hash(placements('BOVINE').filter(p=>p.zone.includes('yard'))),'d5cb9743047830b30f2a210941e23693da5fbd18b01b8021eec7759457dd9962')});
test('ovine placements are outside this cattle correction and remain unchanged',()=>{assert.equal(hash(placements('OVINE')),'a14aebd557b46bee99e41543e5897d572b76f6a9352c4a8d915dde24ada86152')});
test('correction preserves symbol count and exact representative census weights',()=>{const v=projectFarm(initialState(),'SIM-BOV-001');for(const[density,total]of [['light',100],['balanced',200],['dense',360]]){const plans=herdPlan(v,{...DEFAULTS,density});assert.equal(plans.reduce((n,p)=>n+p.visible,0),total);for(const p of plans)assert.equal(p.members.reduce((n,a)=>n+a.weight,0),p.productive)}});
test('placements coincide with real instanced bedding, not only a parallel formula',()=>fixture((world)=>{const beds=[],m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();world.buildings.get('bovine').inside.traverse(o=>{if(o.isInstancedMesh&&o.material.color?.getHex()===0xbba678)for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.decompose(p,q,s);if(Math.abs(p.y-.42)<1e-5&&Math.abs(s.y-.25)<1e-5)beds.push({x:p.x,z:p.z,width:s.x,depth:s.z})}});assert(beds.length>cows().length);for(const c of cows()){const[x,z]=localPosition(c.position),bed=beds.find(b=>Math.abs(b.x-x)<1e-4&&Math.abs(b.z+Math.sign(b.z)*1.5-z)<1e-4);assert(bed,'No rendered bed at assigned position');assert(bed.width>1&&bed.depth>3.5)}}));
test('renderer receives corrected yaw and center for every indoor instance',()=>fixture((world,life,scene)=>{const s=initialState(),view=projectFarm(s,'SIM-BOV-001');world.update(view);life.update(view,{...DEFAULTS,density:'dense'});scene.updateMatrixWorld(true);const plan=life.plans.find(p=>p.species==='BOVINE'),m=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),scale=new T.Vector3(),fw=new T.Vector3();let checked=0;for(let seed=0;seed<3;seed++){const body=world.root.getObjectByName('DETAIL_HERD_BOVINE_'+seed).children[0],members=plan.members.filter(a=>a.morphologySeed===seed);members.forEach((a,i)=>{if(a.zone!=='bovine')return;body.getMatrixAt(i,m);m.premultiply(body.matrixWorld);m.decompose(p,q,scale);assert(Math.hypot(p.x-a.position[0],p.z-a.position[1])<1e-4);fw.set(1,0,0).applyQuaternion(q);assertHeading(a,Math.atan2(-fw.z,fw.x));checked++})}assert(checked>=20)}));
test('feeding, pause and hold do not undo stall orientation or mutate the ledger',()=>fixture((world,life)=>{let s=initialState();s=reduce(s,{type:'AUTO',enabled:true});for(let i=0;i<60;i++){s=reduce(s,{type:'TICK',seconds:1});if(s.lots['SIM-BOV-001'].tasks['FARM.FEED'].status==='RUNNING')break}s=reduce(s,{type:'TICK',seconds:2});for(let i=0;i<2;i++){const before=JSON.stringify(s);world.update(projectFarm(s,'SIM-BOV-001'));life.update(projectFarm(s,'SIM-BOV-001'));for(const a of life.plans[0].members.filter(a=>a.zone==='bovine'))assertHeading(a);assert.equal(JSON.stringify(s),before);s=reduce(s,{type:'INCIDENT',lotId:'SIM-BOV-001',reason:'Alignment hold QA'})}}));

test('all detailed cow parts fit the bedding and stay behind the front crossbar',()=>fixture((world,life,scene)=>{
 const view=projectFarm(initialState(),'SIM-BOV-001');world.update(view);life.update(view,{...DEFAULTS,density:'dense'});life.setDetail(true,1);scene.updateMatrixWorld(true);
 const plan=life.plans[0],m=new T.Matrix4(),inverse=new T.Matrix4().copy(world.buildings.get('bovine').shell.matrixWorld).invert(),v=new T.Vector3();let checked=0;
 for(let seed=0;seed<3;seed++){
  const group=world.root.getObjectByName('DETAIL_HERD_BOVINE_'+seed),members=plan.members.filter(a=>a.morphologySeed===seed);
  members.forEach((a,i)=>{if(a.zone!=='bovine')return;const [cx]=localPosition(a.position),bedZ=a.row*f.d*.32;
   for(const part of group.children){part.geometry.computeBoundingBox();const bounds=part.geometry.boundingBox;part.getMatrixAt(i,m);m.premultiply(part.matrixWorld).premultiply(inverse);
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
     v.set(x,y,z).applyMatrix4(m);assert(Math.abs(v.x-cx)<1.5,'Body crosses side of bed');assert(Math.abs(v.z-bedZ)<f.d*.15,'Body crosses end of bed');assert(a.row*v.z>f.d*.3+.05,'Body intersects front crossbar');
    }
   }checked++;
  });
 }
 assert(checked>=20);
}));
