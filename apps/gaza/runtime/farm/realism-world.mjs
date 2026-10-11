import * as T from 'three';
import {createInstancedHerd,createUniformWorker,geometryKit} from '../shared/livestock-assets.mjs';
import {PADDOCKS,STATION_INFO,point} from './site.mjs';
import {estimateHerd,pastureSlots,seed01,gaitPose,milkingPhase,HERD_ASSUMPTIONS} from './herd-plan.mjs';
/** Visual refinement only; original site remains, no new stock/events/results. */
export function enrichFarmRealism(world){
 const root=new T.Group();root.name='FARM_REALISM_V2';world.site.add(root);
 const sharedMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.83}),helpers=[],herds=[],people=[],inspectMeshes=[];
 const actorNames=[];world.root.traverse(o=>{if(o.isGroup&&/^SIM-(?:bovine|ovine)-[0-9]+$|^SIM-MILKING-(?:COW|SHEEP)$/.test(o.name))actorNames.push({g:o});});
 const staffDefinitions=[['SIM-FARM-01','FARM.BIOSECURITY',0],['SIM-FARM-02','FARM.FEED',1],['SIM-FARM-OVI','FARM.FEED',2],['SIM-FARM-03','FARM.MILKING',3],['SIM-CLEAN-01','FARM.CIP',3],['SIM-COLD','FARM.COOL',4],['SIM-VET-01','FARM.HEALTH',5],['SIM-DRIVER-01','COLLECTION.LOAD',6]];
 const milkGroup=world.root.getObjectByName('FARM.MILKING');
 const legacy={animals:actorNames,staff:staffDefinitions.map(([id,taskId,station])=>({id,taskId,station,g:world.root.getObjectByName(id)})),tanker:world.root.getObjectByName('SIM-MASTER-TANKER'),feedCart:world.root.getObjectByName('SIM-FEED-CART'),demoCow:world.root.getObjectByName('SIM-MILKING-COW'),demoSheep:world.root.getObjectByName('SIM-MILKING-SHEEP'),flows:[{taskId:'FARM.MILKING',bead:milkGroup?.children.find(o=>o.geometry?.type==='SphereGeometry')}]};
 if(actorNames.length!==28||legacy.staff.some(w=>!w.g)||!legacy.tanker||!legacy.feedCart||!legacy.demoCow||!legacy.demoSheep)throw Error('Farm V2: modelo base incompatible; no se reemplaza la granja');
 let options={...HERD_ASSUMPTIONS},lastView=null,selectedAnimal=null,geometryKey='',plan=null,phase=null,selectedStation=0,isolate=false,hiddenLayers=false;
 // Preserve parent transforms/semantic references and remove only the old visual bodies.
 legacy.animals.forEach(a=>a.g.children.forEach(c=>c.visible=false));
 legacy.staff.forEach(w=>{w.g.children.forEach(c=>c.visible=false);const person=createUniformWorker(w.id);person.g.name='UNIFORM_'+w.id;w.g.add(person.g);people.push({...person,taskId:w.taskId,station:w.station,id:w.id});});
 function solid(parent,kit,name){const g=kit.finish();if(!g)return null;const mesh=new T.Mesh(g,sharedMaterial);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);helpers.push(mesh);return mesh;}
 const colour={straw:0xb6a16d,steel:0xa9b8b7,blue:0x204f7b,wood:0x877052,roof:0x8d826e,stone:0x8d937f};
 const box=(kit,p,s,c)=>kit.add('box',p,s,c),cyl=(kit,p,s,c,rotation=[0,0,0])=>kit.add('cylinder',p,s,c,rotation);
 // Buildings: roof structure, gutters, internal lights and hygiene fixtures are proposals.
 for(const b of world.buildings.values()){
  const k=geometryKit(),w=b.f.w,d=b.f.d;
  for(let x=-w/2+1;x<w/2;x+=7){box(k,[x,b.height-.15,0],[.17,.24,d-.4],colour.steel);box(k,[x,b.height-.12,-d*.32],[2,.035,.32],0xf1e5c7);}
  box(k,[0,.42,-d/2+.3],[w-.5,.1,.28],colour.stone);
  if(['bovine','ovine'].includes(b.id)){
   for(let x=-w/2+3;x<w/2-3;x+=6){const fan=new T.TorusGeometry(.53,.027,5,18),material=new T.MeshStandardMaterial({color:0x536473,roughness:.7});const f=new T.Mesh(fan,material);f.position.set(x,b.height-1.0,0);b.inside.add(f);helpers.push(f);for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])box(k,[x+Math.cos(a)*.24,b.height-1.0+Math.sin(a)*.24,0],[.22,.06,.06],colour.steel);}
   // Rubber walking strips leave feeding and drinking lanes clear.
   box(k,[0,.51,0],[w-3,.035,2.2],0x4f5750);
  }
  if(b.id==='milking'){
   // Hoses, teat-cup sets, drains, status displays and wash cabinet; not a measured parlour.
   for(const side of [-1,1])for(let z=-4;z<=4;z+=2){for(const dx of [-.09,.09])for(const dz of [-.06,.06]){cyl(k,[side*2.3+dx,1.06,z+dz],[.035,.22,.035],colour.steel);cyl(k,[side*2.3+dx,.81,z+dz],[.021,.30,.021],0x363b3b);}box(k,[side*4.7,1.5,z],[.4,.32,.08],colour.blue);}
   box(k,[0,.32,0],[.8,.06,11],0x626d6a);for(let z=-5;z<=5;z+=.35)box(k,[0,.365,z],[.72,.02,.028],colour.steel);
   box(k,[-6.2,1.2,-5],[1.6,2.2,.8],0xe0e4d8);box(k,[-6.2,1.56,-4.57],[.9,.42,.04],colour.blue);
  }
  if(b.id==='office'){
   for(let x=-5;x<=4;x+=4)for(const z of [-3,3]){box(k,[x,1.1,z+.30],[.65,.027,.2],0x363f47);box(k,[x+.55,1.12,z+.30],[.16,.05,.1],0x33414b);box(k,[x-.8,1.20,z-.1],[.25,.24,.08],0xe6dcc4);}
   box(k,[b.f.w/2-1.2,1.1,0],[1.8,2.2,.5],0xdddcca);
  }
  solid(b.inside,k,'INTERIOR_DETAIL_'+b.id);
  const outer=geometryKit();for(const side of [-1,1]){
   cyl(outer,[0,b.height-.15,side*(d/2+.12)],[.08,w,.08],colour.steel,[0,0,Math.PI/2]);
   for(const x of [-w/2+.35,w/2-.35])cyl(outer,[x,b.height/2,side*(d/2+.17)],[.065,b.height,.065],colour.steel);
  }solid(b.walls,outer,'GUTTERS_'+b.id);
 }
 // Visible reference signboards at each station; all explicitly a proposed operating layout.
 for(const b of world.buildings.values()){
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const c=cv.getContext('2d');c.fillStyle='#f2f0df';c.fillRect(0,0,512,256);c.fillStyle='#1b496b';c.fillRect(0,0,512,64);c.fillStyle='#ffffff';c.font='bold 27px system-ui';c.fillText('GAZA · GRANJA VIRTUAL',18,42,476);c.fillStyle='#203944';c.font='bold 25px system-ui';c.fillText(STATION_INFO[b.station][0],18,104,475);c.font='19px system-ui';c.fillText('Estación '+(b.station+1)+' · lote trazable',18,147);c.fillText('Uso y señalización propuestos',18,205,470);
  const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const m=new T.MeshBasicMaterial({map:tx,side:T.DoubleSide}),board=new T.Mesh(new T.PlaneGeometry(2.8,1.4),m);board.name='FARM_STATION_SIGN';board.position.set(b.f.w*.1,2.0,-b.f.d/2-.34);board.rotation.y=Math.PI;const holder=new T.Group();holder.name='INFO_BOARD_HOLDER';holder.add(board);b.walls.add(holder);helpers.push(board);
 }
 // Original prairie envelope stays untouched. Grass tufts are confined to existing fenced polygons.
 // Fine curved grass leaves, not conical tufts; pasture surface differs from indoor bedding.
 for(const surface of world.site.children)if(surface.geometry?.type==='ExtrudeGeometry'&&surface.geometry.parameters?.options?.depth===.07){surface.material=surface.material.clone();surface.material.color.setHex(0x7f9159);}
 const blade=new T.BufferGeometry();const bv=[],bi=[];for(let k=0;k<4;k++){const a=k*1.7,h=.16+k*.025,x=Math.cos(a),z=Math.sin(a),base=bv.length/3;bv.push(-z*.015,0,x*.015,z*.015,0,-x*.015,x*.025+z*.01,h*.60,z*.025-x*.01,x*.025-z*.01,h*.60,z*.025+x*.01,x*.065,h,z*.065);bi.push(base,base+1,base+2,base,base+2,base+3,base+3,base+2,base+4);}blade.setAttribute('position',new T.Float32BufferAttribute(bv,3));blade.setIndex(bi);blade.computeVertexNormals();const gm=new T.MeshStandardMaterial({color:0x617c41,side:T.DoubleSide,roughness:1});const grass=new T.InstancedMesh(blade,gm,10000);grass.castShadow=false;grass.receiveShadow=true;root.add(grass);helpers.push(grass);const dummy=new T.Object3D();let n=0;
 for(const f of PADDOCKS){const poly=f.corners.map(point),slots=pastureSlots(poly,500,3.2,2);for(let i=0;i<slots.length&&n<10000;i++)for(let j=0;j<5&&n<10000;j++){dummy.position.set(slots[i][0]+(seed01(n)-.5)*1.4,.29,slots[i][1]+(seed01(n+16)-.5)*1.4);dummy.rotation.y=seed01(n+9)*6.28;dummy.scale.setScalar(.45+seed01(n+8));dummy.updateMatrix();grass.setMatrixAt(n++,dummy.matrix);}}grass.count=n;grass.instanceMatrix.needsUpdate=true;
 // Refine existing tanker rather than adding another vehicle or stock counter.
 const truckKit=geometryKit();for(const side of [-1,1]){
  box(truckKit,[4.2,1.3,side*1.28],[1.5,.85,.08],0xe5e7de);box(truckKit,[4.45,2.1,side*1.32],[1.15,.7,.035],0x375364);box(truckKit,[5.5,2.22,side*1.47],[.15,.42,.18],0x333b3f);
  for(const x of [-4,-2.7,3.8]){cyl(truckKit,[x,.56,side*1.265],[.30,.07,.30],colour.steel,[Math.PI/2,0,0]);for(let z=0;z<6;z++){const a=z*Math.PI/3;box(truckKit,[x+Math.cos(a)*.22,.56+Math.sin(a)*.22,side*1.31],[.035,.035,.02],0x364454);}}
  box(truckKit,[5.37,1.03,side*.75],[.08,.26,.35],0xeae8bc);box(truckKit,[-5.8,.83,side*.80],[.07,.18,.25],0xc55443);
 }for(const x of [-4,1.3]){cyl(truckKit,[x,3.36,0],[.32,.12,.32],colour.steel);box(truckKit,[x,3.18,0],[.15,.20,1.9],colour.steel);}box(truckKit,[5.4,.6,0],[.15,.35,2.25],0x353f42);solid(legacy.tanker,truckKit,'TANKER_DETAIL');
 const feedKit=geometryKit();box(feedKit,[1.5,2.57,0],[2,.12,1.95],colour.blue);box(feedKit,[2.2,1.5,0],[.35,1.7,1.9],colour.blue);box(feedKit,[2.4,1.06,0],[.15,.6,1.8],0x4c575d);cyl(feedKit,[.3,2.4,-.67],[.055,1.4,.055],0x303838);solid(legacy.feedCart,feedKit,'FEED_TRACTOR_DETAIL');
 function disposeHerds(){for(const h of herds)h.batch.dispose();herds.length=0;inspectMeshes.length=0;}
 function build(view){
  const lots=view.ready?view.lots.map(l=>({species:l.species,plannedL:l.plannedL})):[];
  plan=estimateHerd(lots,options);const counts=plan.species.map(p=>view.ready?p.rendered:Math.min(p.species==='BOVINE'?80:100,{compact:48,balanced:160,high:240}[options.detail]));
  const key=counts.join(':')+':'+options.detail;if(key===geometryKey)return;geometryKey=key;disposeHerds();
  for(const [s,species]of ['BOVINE','OVINE'].entries()){
   const barn=world.buildings.get(s===0?'bovine':'ovine'),count=counts[s],inCount=Math.min(count,s===0?28:40),positions=[];
   barn.inside.updateWorldMatrix(true,false);
   for(let i=0;i<inCount;i++){const side=i%2===0?-1:1,col=Math.floor(i/2),cols=Math.ceil(inCount/2),x=-barn.f.w*.40+(cols<=1?0:col*barn.f.w*.80/(cols-1)),z=side*barn.f.d*.32;const pos=new T.Vector3(x,.53,z).applyMatrix4(barn.inside.matrixWorld);positions.push({x:pos.x,z:pos.z,y:.53,yaw:barn.f.yaw+side*Math.PI/2,scale:.97+seed01(i)*.07,indoors:true,station:barn.station,seed:i});}
   const pasture=PADDOCKS.find(p=>p.species===species),slots=pastureSlots(pasture.corners.map(point),count-inCount,s===0?4.8:3.2,s===0?3.4:2.5);
   slots.forEach(([x,z],i)=>positions.push({x,z,y:.27,yaw:seed01(i+18)*Math.PI*2,scale:.94+seed01(i+40)*.10,indoors:false,station:barn.station,seed:i+inCount}));
   const batch=createInstancedHerd(root,species,positions.length);batch.g.userData={station:barn.station};for(const mesh of [batch.meshes.body,batch.meshes.head]){mesh.userData={herdSpecies:species,station:barn.station};inspectMeshes.push(mesh);}
   herds.push({species,batch,positions});
  }
 }
 // Detailed versions of the two existing milking actors follow the same semantic task anchors.
 const milkingHerds=['BOVINE','OVINE'].map((species,i)=>{const h=createInstancedHerd(root,species,1);h.g.name='MILKING_REALISM_'+species;const hoseGeometry=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(i?-1.2:1.2,.7,-.3),new T.Vector3(i?-2.1:2.1,.45,-.15),new T.Vector3(i?-3:3,.72,-.5)]),18,.043,6,false);const hose=new T.Mesh(hoseGeometry,new T.MeshStandardMaterial({color:0x414d4a,roughness:.8}));world.buildings.get('milking').inside.add(hose);helpers.push(hose);hose.visible=false;return {species,batch:h,parent:i?legacy.demoSheep:legacy.demoCow,hose}});
 function update(view){
  lastView=view;build(view);const feed=view.tasks['FARM.FEED'],milk=view.tasks['FARM.MILKING'];phase=milk?milkingPhase(milk.progress):null;
  herds.forEach(h=>{h.positions.forEach((a,i)=>{const active=h.species===view.species&&feed?.status==='RUNNING',seconds=h.species===view.species?(feed?.elapsed||0):0,pose=gaitPose(seconds,a.seed,false),down=a.indoors?.05:(.55+seed01(i+7)*.26);h.batch.setAnimal(i,a,pose,down);});h.batch.finish();});
  milkingHerds.forEach(h=>{h.batch.g.visible=h.parent.visible;const active=milk&&['RUNNING','HELD','UNAVAILABLE'].includes(milk.status)&&h.species===view.species,walking=active&&['entry','exit'].includes(phase?.id),f=world.buildings.get('milking'),progress=milk?.progress||0;let z=0;if(progress<.16)z=-6+6*progress/.16;else if(progress>.87)z=6*(progress-.87)/.13;const position=new T.Vector3(h.species==='OVINE'?-3:3,.52,z).applyMatrix4(f.inside.matrixWorld);h.batch.setAnimal(0,{x:position.x,y:position.y,z:position.z,yaw:f.f.yaw-Math.PI/2,scale:1},gaitPose(milk?.elapsed||0,4,walking),.03);h.batch.finish();h.hose.visible=active&&['attach','extract','detach'].includes(phase?.id);});
  const milkFlow=legacy.flows.find(f=>f.taskId==='FARM.MILKING');if(milkFlow?.bead)milkFlow.bead.visible=milk?.status==='RUNNING'&&phase?.id==='extract';
  people.forEach(p=>{const t=view.tasks[p.taskId];p.animate(t?.elapsed||0,['RUNNING','HELD','UNAVAILABLE'].includes(t?.status));});
  applyVisibility();
 }
 function applyVisibility(){
  const w=world.snapshot();selectedStation=w.station;isolate=w.isolated;root.visible=!hiddenLayers;
  for(const h of herds){ // Retain outdoor herd when cutaway; hide internal stock under opaque roofs for overview naturally.
   h.batch.g.visible=!isolate||h.positions[0]?.station===selectedStation;
   if(isolate){h.positions.forEach((a,i)=>{if(!a.indoors){h.batch.setAnimal(i,{...a,scale:0},gaitPose(0));}});h.batch.finish();}
  }
  for(const h of milkingHerds)h.batch.g.visible=h.parent.visible&&(!isolate||selectedStation===3);
  grass.visible=!isolate;
 }
 return {update,inspectMeshes,focusPoint(species='BOVINE'){const h=herds.find(h=>h.species===species);return h?.positions.find(p=>!p.indoors)||h?.positions[0]||null;},get plan(){return plan},setOptions(p){const next={...options,...p};estimateHerd([],next);options=next;geometryKey='';if(lastView)update(lastView)},syncVisibility(){if(lastView)update(lastView)},
  inspect(hit){const species=hit.object.userData.herdSpecies,h=herds.find(h=>h.species===species),index=hit.instanceId;if(!h||!Number.isInteger(index)||!h.positions[index])return null;const d=plan.species.find(p=>p.species===species);selectedAnimal={id:'VIS-'+(species==='BOVINE'?'V':'O')+'-'+String(index+1).padStart(3,'0'),species,station:h.positions[index].station,position:h.positions[index],censusMeasured:false,estimatedAdults:d.adultFemales,visibleRepresentatives:h.positions.length};return selectedAnimal;},
  snapshot(){return {version:2,provenance:'PROPOSED_VISUAL_ASSETS',animals:herds.reduce((n,h)=>n+h.positions.length,0),species:herds.map(h=>({species:h.species,rendered:h.positions.length,inside:h.positions.filter(a=>a.indoors).length})),milkingRepresentatives:2,uniformedWorkers:people.length,grassTufts:n,phase:phase?.id||null,phaseTitle:phase?.title||null,selectedAnimal,plan};},
  dispose(){disposeHerds();milkingHerds.forEach(h=>h.batch.dispose());for(const h of helpers){h.removeFromParent();h.geometry?.dispose();if(h.isInstancedMesh)h.dispose();if(h.material!==sharedMaterial){h.material.map?.dispose();h.material.dispose();}}people.forEach(p=>{p.g.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});p.g.removeFromParent()});sharedMaterial.dispose();root.removeFromParent();}
 };
}
