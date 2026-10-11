import * as THREE from 'three';
import {AREAS,EQUIPMENT,sampleRoute} from './layout.mjs';
/** Reusable procedural interior. Layout/equipment are proposals, never an as-built claim. */
export function buildLabWorld(scene){
 const root=new THREE.Group();root.name='GAZA_LAB_PROPOSED_INTERIOR';scene.add(root);
 const mats={},geometries=new Set(),textures=new Set(),batches=new Map(),picks=[],rooms=[],staff=[],devices=new Map(),tokens=new Map();
 const material=(name,color,extra={})=>mats[name]||(mats[name]=new THREE.MeshStandardMaterial({color,roughness:.65,...extra}));
 const m={white:material('white',0xe8eef0),wall:material('wall',0xc2cdd0),navy:material('navy',0x163a57),steel:material('steel',0x879eab,{metalness:.58,roughness:.3}),top:material('top',0x3b5361),glass:material('glass',0x8fc5d4,{transparent:true,opacity:.4,depthWrite:false}),dark:material('dark',0x23323e),blue:material('blue',0x358fcb),red:material('red',0xcd6656),green:material('green',0x378d79),paper:material('paper',0xfff6df),wood:material('wood',0xac9673),skin:material('skin',0xbf947e)};
 const cube=new THREE.BoxGeometry(1,1,1),cylinder=new THREE.CylinderGeometry(1,1,1,14),sphere=new THREE.SphereGeometry(1,12,8);[cube,cylinder,sphere].forEach(g=>geometries.add(g));
 const staticPart=(parent,mat,pos,scale,shape='box',rz=0)=>{
  const key=parent.uuid+'|'+mat.uuid+'|'+shape;let b=batches.get(key);if(!b){b={parent,mat,geom:shape==='cylinder'?cylinder:shape==='sphere'?sphere:cube,items:[]};batches.set(key,b)}
  b.items.push({pos,scale,rz});
 };
 const box=(p,x,y,z,w,h,d,mat=m.white)=>staticPart(p,mat,[x,y,z],[w,h,d]);
 const cyl=(p,x,y,z,r,h,mat=m.steel,rz=0)=>staticPart(p,mat,[x,y,z],[r,h,r],'cylinder',rz);
 const group=(name,parent=root)=>{const g=new THREE.Group();g.name=name;parent.add(g);return g};
 function mesh(parent,geom,mat,x,y,z,scale=[1,1,1]){const o=new THREE.Mesh(geom,mat);o.position.set(x,y,z);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 function label(parent,text,x,y,z,width=5){
  const cv=document.createElement('canvas');cv.width=640;cv.height=104;const ctx=cv.getContext('2d');ctx.fillStyle='#102e42';ctx.fillRect(0,0,640,104);ctx.fillStyle='#def0f3';ctx.font='bold 30px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,320,54,608);
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;textures.add(tx);const mat=new THREE.SpriteMaterial({map:tx,depthTest:false});const s=new THREE.Sprite(mat);s.position.set(x,y,z);s.scale.set(width,width*104/640,1);parent.add(s);return s;
 }
 function bench(p,x,z,w=3){box(p,x,.89,z,w,.11,.9,m.top);box(p,x,.43,z,w-.12,.79,.76,m.white);for(let k=0;k<Math.round(w/.7);k++){box(p,x-w/2+.38+k*.7,.68,z+.395,.36,.035,.03,m.steel);box(p,x-w/2+.7+k*.7,.4,z+.394,.018,.72,.01,m.wall)}}
 function monitor(p,x,z,y=.98){box(p,x,y+.48,z,.86,.58,.08,m.dark);box(p,x,y+.48,z+.05,.72,.44,.015,m.blue);box(p,x,y+.13,z,.08,.28,.08,m.steel);box(p,x,y+.01,z+.05,.4,.035,.28,m.dark);box(p,x,y+.04,z+.4,.58,.035,.2,m.dark);for(let i=0;i<4;i++)box(p,x-.25+i*.16,y+.046,z+.4,.012,.012,.18,m.wall)}
 function vialRack(p,x,z,y=1){box(p,x,y,z,1,.11,.52,m.blue);for(let i=0;i<5;i++)for(let j=0;j<2;j++){cyl(p,x-.4+i*.2,y+.22,z-.14+j*.28,.045,.35,m.glass);cyl(p,x-.4+i*.2,y+.41,z-.14+j*.28,.054,.055,m.white)}}
 function chair(p,x,z){box(p,x,.54,z,.56,.09,.5,m.navy);box(p,x,.9,z-.22,.56,.68,.09,m.navy);cyl(p,x,.28,z,.05,.5,m.steel);for(const dx of [-.24,.24])for(const dz of [-.2,.2])cyl(p,x+dx,.09,z+dz,.05,.12,m.dark)}
 function sink(p,x,z){bench(p,x,z,2.2);box(p,x,.96,z,.9,.04,.57,m.steel);box(p,x,1,z,.65,.02,.36,m.dark);cyl(p,x,1.18,z-.28,.033,.44,m.steel);box(p,x,1.39,z-.15,.06,.06,.32,m.steel)}
 function technician(parent,area){
  const g=group('SIM-LAB-STAFF-'+area.station,parent);g.position.set(area.x+.95,0,area.z>0?4.4:-4.4);
  mesh(g,cylinder,m.white,0,1.13,0,[.25,.82,.22]);mesh(g,sphere,m.skin,0,1.79,0,[.17,.21,.16]);mesh(g,sphere,m.blue,0,1.93,0,[.18,.08,.17]);mesh(g,cube,m.blue,.11,1.22,.224,[.12,.16,.012]);
  const limbs=[];for(const side of [-1,1]){const arm=group('arm',g);arm.position.set(side*.26,1.5,0);mesh(arm,cylinder,m.white,0,-.23,0,[.072,.48,.07]);mesh(arm,sphere,m.blue,0,-.5,0,[.08,.095,.075]);limbs.push(arm);mesh(g,cylinder,m.navy,side*.13,.45,0,[.085,.82,.085]);mesh(g,cube,m.dark,side*.13,.08,.1,[.19,.13,.34])}
  staff.push({g,limbs,station:area.station});
 }
 const floor=mesh(root,cube,material('floor',0x708592),0,-.18,0,[33,.35,21]);floor.name='Laboratorio propuesto';
 box(root,0,.015,0,32,.03,3.5,material('corridor',0x68848e));
 for(let x=-15;x<=15;x+=2)box(root,x,.038,0,.9,.02,.045,m.paper);
 const shell=group('outer-walls');box(shell,-16,1.8,0,.2,3.6,20,m.wall);box(shell,16,1.8,0,.2,3.6,20,m.wall);box(shell,0,1.8,-10,32,3.6,.2,m.wall);box(shell,0,1.8,10,32,3.6,.2,m.wall);
 const roomFloors=AREAS.map(a=>{
  const rg=group('station-'+a.station),wg=group('walls-'+a.station,rg),roof=group('roof-'+a.station,rg);
  const fm=material('floor-'+a.station,a.station===2?0xc2d9d3:a.station===5?0xcbd5dc:0xdbe1de);
  const f=mesh(rg,cube,fm,a.x,.04,a.z,[a.w,.06,a.d]);f.userData={station:a.station,kind:'LAB_AREA'};picks.push(f);
  for(const sign of [-1,1])box(wg,a.x+sign*a.w/2,1.6,a.z,.13,3.2,a.d,m.white);
  const front=a.z>0?a.z-a.d/2:a.z+a.d/2,back=a.z>0?a.z+a.d/2:a.z-a.d/2;
  box(wg,a.x,1.6,back,a.w,3.2,.15,m.white);
  const flank=(a.w-1.8)/2;for(const sign of [-1,1])box(wg,a.x+sign*(.9+flank/2),1.6,front,flank,3.2,.12,m.wall);
  box(wg,a.x,2.9,front,1.8,.6,.12,m.white);box(wg,a.x,1.24,front+.08,1.35,2.35,.04,m.glass);
  box(roof,a.x,3.4,a.z,a.w,.16,a.d,m.white);roof.visible=false;
  label(rg,(a.station+1)+' · '+a.name,a.x,3.6,a.z,6.7);
  box(rg,a.x,.09,front+(a.z>0?.25:-.25),1.75,.03,.45,m.green);
  technician(rg,a);
  rooms.push({g:rg,walls:wg,roof,floor:f,station:a.station});return f;
 });
 const deviceMats=new Map();
 for(const e of EQUIPMENT){
  const p=rooms[e.station].g,x=e.x,z=e.z;const tall=['fridge','incubator','shelves','autoclave'].includes(e.type);
  if(!tall)bench(p,x,z,e.type==='cabinet'?3:2.3);
  let h=tall?2.1:.6,w=tall?1.1:1.15,d=.72,y=tall?1.12:1.3;
  if(e.type==='cabinet'){h=1.5;w=2.2;y=1.72}
  if(e.type==='ph'||e.type==='microscope'||e.type==='balance'){h=.32;w=.66;y=1.12;d=.5}
  const bodyMat=material('case-'+e.id,0xdde6e9);const body=mesh(p,cube,bodyMat,x,y,z,[w,h,d]);body.userData={station:e.station,equipmentId:e.id,kind:'LAB_EQUIPMENT'};picks.push(body);
  const statusMat=new THREE.MeshBasicMaterial({color:0x547785});deviceMats.set(e.id,statusMat);const status=mesh(p,sphere,statusMat,x+w*.43,y+h*.5+.12,z+.25,[.075,.075,.075]);devices.set(e.id,{body,status});
  if(e.type==='computer'){monitor(p,x,z-.05);box(p,x+.65,1.08,z+.24,.3,.22,.4,m.dark);box(p,x+.65,1.22,z+.26,.28,.035,.24,m.paper);chair(p,x,z+1);vialRack(p,x-.55,z+.12)}
  if(e.type==='analyzer'){box(p,x,1.6,z+.37,.62,.26,.02,m.blue);cyl(p,x,1.66,z-.12,.42,.05,m.steel);for(let i=0;i<8;i++){const t=i*Math.PI/4;cyl(p,x+Math.cos(t)*.32,1.84,z-.12+Math.sin(t)*.32,.037,.27,m.glass)}vialRack(p,x+.65,z+.42)}
  if(e.type==='reader'){box(p,x,1.6,z+.38,.65,.2,.02,m.blue);box(p,x,1.18,z+.52,.55,.06,.45,m.navy);for(let i=0;i<4;i++)for(let j=0;j<3;j++)cyl(p,x-.2+i*.13,1.22,z+.4+j*.11,.035,.025,m.white)}
  if(['fridge','incubator'].includes(e.type)){box(p,x,y,z+.375,.9,1.78,.04,m.navy);box(p,x,y+.1,z+.405,.63,1.1,.025,m.glass);box(p,x+.39,y,z+.43,.045,.64,.06,m.steel);for(let k=0;k<4;k++){box(p,x,.55+k*.4,z+.425,.7,.025,.05,m.steel);for(let j=0;j<4;j++)cyl(p,x-.25+j*.17,.6+k*.4,z+.42,.07,.055,m.paper)}}
  if(e.type==='cabinet'){box(p,x,y,z+.38,2,1.15,.04,m.glass);box(p,x,2.6,z,2.1,.2,.75,m.navy);vialRack(p,x-.4,z+.4,1.04)}
  if(e.type==='ph'){cyl(p,x-.22,1.55,z-.2,.025,.9,m.steel);box(p,x,1.95,z-.2,.46,.025,.025,m.steel);cyl(p,x+.19,1.64,z-.2,.02,.6,m.blue);cyl(p,x+.19,1.16,z-.2,.12,.3,m.glass);box(p,x,1.28,z+.26,.3,.16,.018,m.blue)}
  if(e.type==='microscope'){cyl(p,x,1.53,z-.12,.055,.64,m.white);box(p,x,1.55,z+.08,.38,.06,.35,m.dark);box(p,x,1.84,z+.08,.1,.09,.35,m.white);cyl(p,x,1.93,z+.2,.055,.17,m.dark)}
  if(e.type==='balance'){box(p,x,1.51,z,.65,.6,.52,m.glass);cyl(p,x,1.28,z,.19,.035,m.steel);for(let i=0;i<4;i++)cyl(p,x+.5+i*.14,1.04,z,.045,.1+i*.03,m.steel)}
  if(e.type==='packaging'){for(let i=0;i<4;i++){box(p,x-.35+i*.24,1.95,z,.17,.47,.18,m.paper);box(p,x-.35+i*.24,1.97,z+.095,.15,.16,.012,m.blue)}box(p,x,1.57,z+.4,.6,.2,.02,m.blue)}
  if(e.type==='shelves'){for(let k=0;k<5;k++){box(p,x,.3+k*.39,z+.4,1.16,.045,.54,m.steel);for(let j=0;j<4;j++)box(p,x-.4+j*.25,.47+k*.39,z+.42,.14,.28,.25,j%2?m.paper:m.navy)}}
  if(e.type==='sink')sink(p,x,z+.3);
  if(e.type==='autoclave'){const door=mesh(p,cylinder,m.steel,x,1.15,z+.5,[.42,.12,.42]);door.rotation.x=Math.PI/2;const center=mesh(p,cylinder,m.dark,x,1.15,z+.58,[.29,.06,.29]);center.rotation.x=Math.PI/2;box(p,x,1.94,z+.4,.5,.14,.03,m.blue)}
 }
 for(const a of AREAS){const p=rooms[a.station].g;box(p,a.x,3.1,a.z,2.4,.04,.55,m.paper);if(a.station!==6)vialRack(p,a.x+.6,a.z>0?7.5:-7.5);else{monitor(p,8.5,7);chair(p,8.5,8.3)}}
 const gateLamps=[];for(let i=0;i<3;i++){const mm=new THREE.MeshBasicMaterial({color:0x586b78});const lamp=mesh(rooms[6].g,sphere,mm,8.1+i*.45,1.5,6.3,[.14,.14,.14]);gateLamps.push(lamp)}
 label(root,'PASILLO DE MUESTRAS · DISTRIBUCIÓN PROPUESTA',0,.6,0,12);
 const routes=group('visual-sample-routes');for(const a of AREAS){const pts=sampleRoute(a.station).map(([x,z])=>new THREE.Vector3(x,.12,z));const geom=new THREE.BufferGeometry().setFromPoints(pts);geometries.add(geom);const line=new THREE.Line(geom,new THREE.LineDashedMaterial({color:0x328dab,dashSize:.25,gapSize:.18}));line.computeLineDistances();routes.add(line)}
 const badgeGeometry=new THREE.CylinderGeometry(.11,.11,.32,10);geometries.add(badgeGeometry);
 for(const e of EQUIPMENT.filter(e=>e.testId)){const token=mesh(root,badgeGeometry,m.blue,0,1.1,0);token.visible=false;tokens.set(e.testId,token)}
 // Batch repeated static primitives, keeping the seven room roots individually switchable.
 const helper=new THREE.Object3D();for(const b of batches.values()){const inst=new THREE.InstancedMesh(b.geom,b.mat,b.items.length);b.items.forEach((t,i)=>{helper.position.set(...t.pos);helper.scale.set(...t.scale);helper.rotation.set(0,0,t.rz);helper.updateMatrix();inst.setMatrixAt(i,helper.matrix)});inst.instanceMatrix.needsUpdate=true;inst.castShadow=true;inst.receiveShadow=true;b.parent.add(inst)}
 const selection=mesh(root,cube,new THREE.MeshBasicMaterial({color:0xf5c56f,wireframe:true}),AREAS[0].x,.35,AREAS[0].z,[AREAS[0].w+.12,.55,AREAS[0].d+.12]);
 let selected=0,isolate=false,cutaway=true,roofs=false,lastProjection=null;
 function visibility(){rooms.forEach(r=>{r.g.visible=!isolate||r.station===selected;r.walls.scale.y=cutaway?.32:1;r.roof.visible=roofs});shell.scale.y=cutaway?.3:1;routes.visible=!isolate&&routes.userData.enabled!==false}
 function focus(i){selected=i;const a=AREAS[i];selection.position.set(a.x,.35,a.z);selection.scale.set(a.w+.12,.55,a.d+.12);visibility()}
 function update(projection){lastProjection=projection;
  for(const e of projection.instruments){const color={RUNNING:0x2acfa5,BUSY_OTHER_LOT:0x63a7d6,UNAVAILABLE:0xe35b57,FAIL:0xe35b57,INVALID:0xd99c46,PASS:0x66bd8d,READY:0x7793a3,ILLUSTRATIVE:0x91a0ad,NO_SCENARIO:0x647985}[e.status]||0x647985;deviceMats.get(e.id).color.setHex(color)}
  for(const t of tokens.values())t.visible=false;
  for(const t of projection.tokens){const o=tokens.get(t.id);if(!o)continue;o.visible=!isolate||t.station===selected;o.position.set(t.position[0],1.15,t.position[1]);o.material=t.eligible?m.blue:m.red}
  for(const person of staff){const active=projection.rooms[person.station]?.active;person.limbs.forEach((l,i)=>{l.rotation.x=active?-.5+Math.sin(projection.seconds*1.5+i)*.2:0});person.g.rotation.y=person.station<4?Math.PI:0}
  ['admission','manufacturing','dispatch'].forEach((id,i)=>gateLamps[i].material.color.setHex(projection.gates[id]==='APPROVED'?0x3bc399:projection.gates[id]==='REVOKED'?0xe26458:0x778798));
 }
 visibility();
 return {root,picks,focus,update,rooms,devices,staff,
  setCutaway(v){cutaway=!!v;visibility()},setRoof(v){roofs=!!v;visibility()},setIsolation(v){isolate=!!v;visibility()},setRoutes(v){routes.userData.enabled=!!v;visibility()},
  snapshot(){return {rooms:rooms.length,instruments:devices.size,staff:staff.length,selected,isolate,cutaway,roofs,sampleMarkers:lastProjection?.tokens.length||0,provenance:'SIMULATED_LAYOUT'}},
  dispose(){const materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.isInstancedMesh)o.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.remove(root)}
 };
}
