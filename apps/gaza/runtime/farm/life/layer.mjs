import {createAnatomy,createHerdBatch} from './anatomy.mjs';
import {DEFAULTS,herdPlan,operationPhase,inside,placements,weights} from './herd-model.mjs';
import {PADDOCKS,point} from '../site.mjs';
/** Visual layer: no access to store.dispatch, no automatic quality review, no counted milk created here. */
export function buildFarmLife(T,world){
 const root=new T.Group();root.name='FARM_LIFE_V2';world.site.add(root);
 const anatomy=createAnatomy(T),batches=[],oldActors=[],uniforms=[],extra=[],signs=[];
 world.root.traverse(o=>{if(/^SIM-(bovine|ovine)-\d+$/.test(o.name)||o.name.startsWith('SIM-MILKING-'))oldActors.push(o)});
 const milestones=Object.fromEntries(oldActors.filter(o=>o.name.startsWith('SIM-MILKING')).map(o=>[o.name.endsWith('COW')?'BOVINE':'OVINE',o]));
 for(const species of ['BOVINE','OVINE'])for(let seed=0;seed<3;seed++){const batch=createHerdBatch(T,root,anatomy,species,240,seed);batch.species=species;batch.seed=seed;batches.push(batch)}
 let assumptions={...DEFAULTS},plans=[],latest=null,configurationKey='',focusId=null;
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.72}),cube=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,12);
 const steel=mat('#a9b9b8'),black=mat('#26323a'),white=mat('#e1e5df'),amber=mat('#c2a365'),water=mat('#3b697b');
 function box(p,pos,size,m=steel){const o=new T.Mesh(cube,m);o.position.set(...pos);o.scale.set(...size);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
 function tube(p,a,b,r=.045,m=steel){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=new T.Mesh(cylinder,m);o.position.copy(av).add(bv).multiplyScalar(.5);o.scale.set(r,av.distanceTo(bv),r);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());o.castShadow=true;p.add(o);return o}
 const brandTexture=new T.TextureLoader().load('assets/gaza-logo.svg');brandTexture.colorSpace=T.SRGBColorSpace;
 const brandMaterial=new T.MeshBasicMaterial({map:brandTexture,side:T.DoubleSide});
 const people=[['SIM-FARM-01','farm','FARM.BIOSECURITY'],['SIM-FARM-02','farm','FARM.FEED'],['SIM-FARM-OVI','farm','FARM.FEED'],['SIM-FARM-03','milk','FARM.MILKING'],['SIM-CLEAN-01','clean','FARM.CIP'],['SIM-COLD','milk','FARM.COOL'],['SIM-VET-01','vet','FARM.HEALTH'],['SIM-DRIVER-01','driver','COLLECTION.LOAD']];
 for(const[id,profile,task]of people){const old=world.root.getObjectByName(id);if(!old)continue;const hidden=[...old.children],g=new T.Group();g.name='DETAIL_UNIFORM';g.position.y=.31;old.add(g);const a=anatomy.human(profile),joints=[];
  const add=(parent,key,p)=>{const o=new T.Mesh(a[key],anatomy.material);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};add(g,'body',[0,0,0]);add(g,'head',[0,1.71,0]);
  for(const side of [-1,1]){const upper=new T.Group();upper.position.set(side*.27,1.46,0);g.add(upper);add(upper,'upperArm',[0,0,0]);const lower=new T.Group();lower.position.y=-.29;upper.add(lower);add(lower,'lowerArm',[0,0,0]);const thigh=new T.Group();thigh.position.set(side*.12,.92,0);g.add(thigh);add(thigh,'thigh',[0,0,0]);const shin=new T.Group();shin.position.y=-.44;thigh.add(shin);add(shin,'shin',[0,0,0]);add(shin,'boot',[0,-.4,0]);joints.push({upper,lower,thigh,shin,side})}
  const badge=new T.Mesh(new T.PlaneGeometry(.16,.07),brandMaterial);badge.position.set(.09,1.4,.177);g.add(badge);
  // Role-specific hand tool, not a medical procedure or a measured real instrument.
  if(profile==='vet')box(g,[.24,1.1,.32],[.21,.27,.025],black);
  if(profile==='clean'){tube(g,[.33,.2,.6],[.3,1.3,.34],.023);box(g,[.33,.15,.65],[.45,.07,.15],white)}
  uniforms.push({old,hidden,g,joints,task,profile,id});
 }
 // Keep existing vehicle route and forward axis (+X), enhance the same vehicle instead of a second fleet.
 const tanker=world.root.getObjectByName('SIM-MASTER-TANKER');
 if(tanker){const g=new T.Group();g.name='DETAIL_TANKER';tanker.add(g);extra.push(g);
  box(g,[5.33,.64,0],[.25,.2,2.6],white);box(g,[5.36,1.08,0],[.06,.63,1.2],black);
  for(let j=0;j<6;j++)box(g,[5.4,.84+j*.085,0],[.02,.035,1.1],steel);
  for(const side of [-1,1]){box(g,[5.39,1,side*.95],[.06,.21,.44],white);box(g,[3.6,1.38,side*1.23],[1.5,1.16,.03],white);box(g,[3.48,1.77,side*1.26],[.34,.055,.045],black);box(g,[4.14,2.6,side*1.52],[.14,.44,.25],black);tube(g,[4.24,2.56,side*1.18],[4.15,2.73,side*1.48],.035);box(g,[3.62,.56,side*1.28],[1.14,.11,.38],steel);box(g,[-5.8,.9,side*.8],[.1,.21,.32],mat('#944c42'));
   const badge=new T.Mesh(new T.PlaneGeometry(1.15,.5),brandMaterial);badge.position.set(3.7,1.36,side*1.26);badge.rotation.y=side>0?0:Math.PI;g.add(badge);
  }
  for(const x of [-4.2,-2,.1,1.65]){const ring=new T.Mesh(new T.TorusGeometry(1.31,.028,5,32),steel);ring.position.set(x,2,0);ring.rotation.y=Math.PI/2;g.add(ring)}
  for(let j=0;j<6;j++)tube(g,[-4.5,.55+j*.39,1.34],[-4.5,.55+j*.39,1.77],.027);tube(g,[-4.5,.5,1.36],[-4.5,3.1,1.36]);tube(g,[-4.5,.5,1.75],[-4.5,3.1,1.75]);tube(g,[-5.05,1.4,0],[-5.05,.73,1.2],.085);box(g,[-5.05,.69,1.2],[.3,.22,.28],black);
 }
 const cart=world.root.getObjectByName('SIM-FEED-CART');if(cart){const g=new T.Group();g.name='DETAIL_FEED_TRACTOR';cart.add(g);extra.push(g);box(g,[2.7,1.1,0],[.36,.45,1.25],black);for(const side of [-1,1]){box(g,[2.91,1.5,side*.68],[.06,.14,.28],white);box(g,[1.3,1.71,side*.835],[.85,.5,.025],black);tube(g,[1.1,1.8,side*.85],[1.1,2.4,side*.85],.024);box(g,[.75,.48,side*1.12],[.65,.1,.45],steel)}tube(g,[2,1.3,-.4],[2,2.65,-.4],.075,black);box(g,[-1.25,2.1,0],[2.1,.17,1.6],amber);}
 // Exterior details follow existing buildings. These are finishes/fixtures proposed, not new footprints.
 for(const b of world.buildings.values()){const {f}=b,wg=new T.Group(),ig=new T.Group();wg.name='DETAIL_FACADE';ig.name='DETAIL_INTERIOR';b.walls.add(wg);b.inside.add(ig);extra.push(wg,ig);
  for(const side of [-1,1]){tube(wg,[-f.w/2,b.height-.13,side*(f.d/2+.17)],[f.w/2,b.height-.13,side*(f.d/2+.17)],.11);for(const x of [-f.w/2+.3,f.w/2-.3])tube(wg,[x,.38,side*(f.d/2+.17)],[x,b.height-.13,side*(f.d/2+.17)],.075);box(wg,[0,.42,side*(f.d/2+.48)],[Math.min(f.w-1,14),.18,.52],steel)}
  for(let x=-f.w/2+3;x<f.w/2;x+=9){box(wg,[x,b.height-.65,-f.d/2-.24],[.7,.14,.4],white);box(ig,[x,b.height-.4,0],[1.8,.07,.45],white)}
  if(['bovine','ovine'].includes(b.id)){for(let x=-f.w/2+5;x<f.w/2;x+=10){tube(ig,[x,.1,1.62],[x,1.25,1.62],.043);tube(ig,[x-3,1.12,1.62],[x+3,1.12,1.62],.035);for(let j=0;j<5;j++)tube(ig,[x-2.4+j*1.2,.5,1.62],[x-2.05+j*1.2,1.1,1.62],.027)}box(ig,[0,.39,0],[f.w-2,.035,.31],black)}
  const cv=document.createElement('canvas');cv.width=512;cv.height=256;const ctx=cv.getContext('2d');ctx.fillStyle='#163746';ctx.fillRect(0,0,512,256);ctx.fillStyle='#d7e7d3';ctx.font='bold 35px system-ui';ctx.fillText('GAZA · '+b.id.toUpperCase(),18,57,478);ctx.font='23px system-ui';ctx.fillText('ÁREA PROPUESTA / SIMULACIÓN',18,112,478);ctx.fillText('Inspeccionar en panel de estación',18,171,478);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const board=new T.Mesh(new T.PlaneGeometry(2.8,1.4),new T.MeshBasicMaterial({map:tx,side:T.DoubleSide}));board.position.set(f.w*.27,2.35,-f.d/2-.45);board.rotation.y=Math.PI;wg.add(board);signs.push(board);
 }
 // Deterministic grass patches inside the reserved meadow; not production or a grazing-area compliance claim.
 const meadow=PADDOCKS.find(p=>p.id==='green-reserve').corners.map(point),blade=new T.BufferGeometry();blade.setAttribute('position',new T.Float32BufferAttribute([-.05,0,0,.05,0,0,.02,.32,.025,0,0,-.05,0,0,.05,.025,.29,0],3));blade.computeVertexNormals();
 const grass=new T.InstancedMesh(blade,new T.MeshStandardMaterial({color:'#69814b',roughness:1,side:T.DoubleSide}),2400),tmp=new T.Object3D();root.add(grass);grass.name='PROPOSED_MEADOW';let grassCount=0,rnd=451;
 const random=()=>{rnd=(rnd*1664525+1013904223)>>>0;return rnd/4294967296};const xs=meadow.map(p=>p[0]),zs=meadow.map(p=>p[1]);
 for(let i=0;i<8000&&grassCount<2400;i++){const x=Math.min(...xs)+random()*(Math.max(...xs)-Math.min(...xs)),z=Math.min(...zs)+random()*(Math.max(...zs)-Math.min(...zs));if(!inside([x,z],meadow))continue;tmp.position.set(x,.3,z);tmp.scale.setScalar(1+random()*1.5);tmp.rotation.y=random()*Math.PI;tmp.updateMatrix();grass.setMatrixAt(grassCount++,tmp.matrix)}grass.count=grassCount;grass.instanceMatrix.needsUpdate=true;grass.computeBoundingSphere();
 function configure(view,a){assumptions={...a};plans=herdPlan(view,assumptions);const isPreview=!view?.ready;
  for(const b of batches){const plan=plans.find(p=>p.species===b.species);let members=plan.members;
   if(isPreview){members=placements(b.species).filter((p,i)=>i%7===0).slice(0,b.species==='BOVINE'?24:36).map((p,i)=>({...p,id:'PREVIEW-'+b.species+'-'+i,index:i,weight:null,scale:.92+(i%5)*.02,morphologySeed:i%3,preview:true}));}
   b.setMembers(members.filter(p=>p.morphologySeed===b.seed));
  }
  focusId=null;
 }
 function hiddenAndVisibility(){const snapshot=world.snapshot();oldActors.forEach(o=>o.visible=false);uniforms.forEach(u=>u.hidden.forEach(o=>o.visible=false));grass.visible=!snapshot.isolated;for(const b of batches)b.root.visible=!snapshot.isolated||snapshot.station===(b.species==='BOVINE'?1:2);}
 const representativeBatches={};for(const species of ['BOVINE','OVINE']){const b=createHerdBatch(T,root,anatomy,species,1,4);b.setMembers([{id:'PROCESS-'+species,scale:1}]);representativeBatches[species]=b;}
 let phase={title:'Sin tarea'},animalCount=0;
 function update(view,a=assumptions){latest=view;const key=JSON.stringify([view?.ready,view?.lots?.map(l=>[l.id,l.plannedL]),a]);if(key!==configurationKey){configurationKey=key;configure(view,a)}
  const milking=view?.tasks?.['FARM.MILKING'];phase=operationPhase(milking);const snapshot=world.snapshot();animalCount=0;
  for(const b of batches){const enabled=!(snapshot.isolated&&snapshot.station!==(b.species==='BOVINE'?1:2)),time=view?.seconds||0,same=view?.species===b.species,feeding=same&&view?.tasks?.['FARM.FEED'],feedActive=['RUNNING','HELD','UNAVAILABLE'].includes(feeding?.status);
   b.root.visible=enabled;const poses=b.members.map((a,i)=>{const yard=a.zone.includes('yard'),routine=yard&&(a.index%4===0),routinePhase=time*.09+a.index*.73,feedWalk=feedActive&&yard&&a.index%3===0,dx=yard?Math.sin(routinePhase)*(routine?.42:.08):0,dz=yard?Math.cos(routinePhase*.83)*(routine?.30:.05):0,moving=feedWalk||routine;return {x:a.position[0]+dx,y:yard?.33:.38,z:a.position[1]+dz,yaw:a.yaw+(moving?Math.sin(routinePhase)*.18:0),
    phase:(feedActive?feeding.elapsed*1.8:time*.8)+a.index,walk:moving?(feedWalk?.58:.22):0,headTilt:feedActive?-.48+Math.sin((feeding.elapsed||0)*.7+a.index)*.08:Math.sin(time*.18+a.index*5)*.11,headTurn:Math.sin(time*.11+a.index*2)*.16,tail:(feedActive||yard)?Math.sin(time*.55+a.index)*.22:Math.sin(time*.15+a.index)*.08}});
   b.update(poses);animalCount+=b.members.length;
  }
  for(const species of ['BOVINE','OVINE']){const b=representativeBatches[species],old=milestones[species],active=milking&&['RUNNING','HELD','UNAVAILABLE'].includes(milking.status)&&view.species===species;b.root.visible=!!active&&(!snapshot.isolated||snapshot.station===3);
   const p=milking?.progress||0,walking=active&&(p<.15||p>.78);b.update([{x:old?.position.x||0,y:.38,z:old?.position.z||0,yaw:old?.rotation.y||0,phase:milking?.elapsed*2||0,walk:walking?1:0,headTilt:phase.phase===1?-.32:0,headTurn:0,tail:0}]);}
  for(const u of uniforms){const task=view?.tasks?.[u.task],active=['RUNNING','HELD','UNAVAILABLE'].includes(task?.status)&&(u.id!=='SIM-FARM-OVI'||view.species==='OVINE')&&(u.id!=='SIM-FARM-02'||view.species==='BOVINE');
   u.joints.forEach(j=>{j.upper.rotation.x=active?-.45+Math.sin((task.elapsed||0)*1.5+j.side)*.16:0;j.lower.rotation.x=active?-.65:0;});
  }
  // Existing plant paths are maintained, but no CIP/product flow bead runs during the wrong visual sub-step.
  world.root.traverse(o=>{if(o.name==='FARM.MILKING'||o.name==='FARM.CIP'){const task=view?.tasks?.[o.name],flow=operationPhase(task).flow;o.children.filter(c=>c.geometry?.type==='SphereGeometry').forEach(c=>c.visible=flow)}});
  hiddenAndVisibility();
 }
 function inspect(species,index=0){const list=batches.filter(b=>b.species===species).flatMap(b=>b.members);const member=list[index%Math.max(1,list.length)];if(!member)return null;focusId=member.id;const cow=species==='BOVINE',s=cow?1:.66;
  return {member,species,position:[member.position[0]+5*s,2.65+1*s,member.position[1]+5*s],target:[member.position[0],1.1,member.position[1]]};
 }
 function hit(ray){const hits=ray.intersectObjects(batches.filter(b=>b.root.visible).map(b=>b.body));if(!hits.length)return null;const h=hits[0],b=batches.find(b=>b.body===h.object);const m=b.members[h.instanceId];focusId=m.id;return {...m,species:b.species};}
 return {update,inspect,hit,setDetail(value,station){for(const b of batches)b.setDetail(value&&station===(b.species==='BOVINE'?1:2));for(const b of Object.values(representativeBatches))b.setDetail(value&&station===3)},syncDisplay(){hiddenAndVisibility();const s=world.snapshot();for(const [species,b]of Object.entries(representativeBatches)){const t=latest?.tasks?.['FARM.MILKING'];b.root.visible=!!t&&['RUNNING','HELD','UNAVAILABLE'].includes(t.status)&&latest.species===species&&(!s.isolated||s.station===3)}},get plans(){return plans},snapshot(){return {schemaVersion:2,provenance:'SIMULATED_VISUAL_POPULATION',animalsRendered:animalCount,selectedAnimal:focusId,preview:!latest?.ready,plans:plans.map(({members,...p})=>p),uniformedStaff:uniforms.length,infoBoards:signs.length,grassTufts:grassCount,phase,assumptions:{...assumptions},anatomy:'ORIGINAL_PROCEDURAL_ARTICULATED_V2',drawBatchCount:batches.length*15,
   note:'El censo equivalente es un cálculo. Los animales visibles representan grupos; no existe aquí censo, alojamiento ni uniformes reales verificados.'}},
  dispose(){batches.forEach(b=>b.dispose());Object.values(representativeBatches).forEach(b=>b.dispose());const geos=new Set(),materials=new Set(),textures=new Set();for(const p of [...extra,...uniforms.map(u=>u.g),root])p.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of [].concat(o.material||[])){materials.add(m);if(m.map)textures.add(m.map)}});grass.dispose();geos.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());anatomy.dispose();world.site.remove(root);}
 };
}
