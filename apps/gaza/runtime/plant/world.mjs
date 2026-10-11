import {DEPARTMENTS,SIGN_PLACEMENTS} from './model.mjs';
/** All geometry is proposed. Source-grounded functional areas do not imply measured interiors. */
export function buildPlantDetail(T,world){
 const retired=[...world.interior.children];retired.forEach(o=>o.visible=false);
 const root=new T.Group();root.name='PLANT_DEPARTMENTS_PROPOSED';world.interior.add(root);
 const outdoor=new T.Group();outdoor.name='PARKING_PROPOSAL';world.root.add(outdoor);
 const boxes=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,16),ball=new T.SphereGeometry(1,10,8),cache=new Map(),batches=new Map(),areas=new Map(),picks=[],workers=[],machines=[],flows=[],dynamic=[];
 const material=(key,color,extra={})=>{if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness:.66,...extra}));return cache.get(key)};
 const m={steel:material('steel',0xa9bbc3,{metalness:.62,roughness:.27}),floor:material('floor',0xbdcbc9),cream:material('cream',0xf1ede0),dark:material('dark',0x253a49),blue:material('blue',0x34779a),red:material('red',0xbd4e56),yellow:material('yellow',0xe4bd52),glass:material('glass',0x75a9b7,{transparent:true,opacity:.46,depthWrite:false}),wood:material('wood',0xb49b72),rubber:material('rubber',0x273136),green:material('green',0x468d7a),wall:material('wall',0xe0e6e4)};
 function part(p,mat,geo,pos,scale,rotation=[0,0,0]){const key=p.uuid+mat.uuid+geo.uuid;let batch=batches.get(key);if(!batch){batch={p,mat,geo,items:[]};batches.set(key,batch)}batch.items.push({pos,scale,rotation})}
 const box=(p,x,y,z,w,h,d,mat=m.steel)=>part(p,mat,boxes,[x,y,z],[w,h,d]);
 const tube=(p,x,y,z,r,h,mat=m.steel,rx=0,rz=0)=>part(p,mat,cyl,[x,y,z],[r,h,r],[rx,0,rz]);
 function mesh(p,geo,mat,pos,scale){const o=new T.Mesh(geo,mat);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
 function name(p,title,x,y,z,w=14){const cv=document.createElement('canvas');cv.width=640;cv.height=96;const c=cv.getContext('2d');c.fillStyle='#163243e8';c.fillRect(0,0,640,96);c.fillStyle='#e3eef0';c.font='bold 27px system-ui';c.textBaseline='middle';c.textAlign='center';c.fillText(title,320,48,606);const tx=new T.CanvasTexture(cv);tx.colorSpace=T.SRGBColorSpace;const o=new T.Sprite(new T.SpriteMaterial({map:tx,depthTest:true}));o.position.set(x,y,z);o.scale.set(w,w*.15,1);p.add(o);return o}
 function equipment(p,dept,id,title,type,x,z,taskId=null){const group=new T.Group();group.name=id;p.add(group);group.userData={deptId:dept,id,title,description:type+' · modelo genérico; no equipo real identificado',provenance:'SIMULATED_EQUIPMENT',geometry:'NOT_AS_BUILT'};
  const body=mesh(group,boxes,m.steel,[x,1.4,z],[2.4,2.4,1.6]);body.userData=group.userData;picks.push(body);const ledMat=new T.MeshBasicMaterial({color:0x667b84});const led=mesh(group,ball,ledMat,[x+1.05,2.85,z+.6],[.2,.2,.2]);machines.push({id,dept,taskId,led,group});
  return {g:group,body};
 }
 function tank(p,x,z,r=2,h=7){tube(p,x,h/2+.25,z,r,h);tube(p,x,h+.33,z,r+.08,.17,m.cream);for(const s of [-1,1])box(p,x+s*r*.6,.8,z,.16,1.6,.2);box(p,x+r+.35,h/2,z,.08,h,.08);for(let j=0;j<h;j+=.55)box(p,x+r+.35,j+.25,z,.5,.05,.06);tube(p,x,.45,z+r+.7,.13,1.4,m.steel,Math.PI/2);}
 function pipe(points,color,taskId){const p=new T.Group();root.add(p);const mat=material('line-'+color,color,{metalness:.3,roughness:.45});for(let i=1;i<points.length;i++){const a=new T.Vector3(...points[i-1]),b=new T.Vector3(...points[i]),o=mesh(p,cyl,mat,a.clone().add(b).multiplyScalar(.5).toArray(),[.18,a.distanceTo(b),.18]);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize())}const bead=mesh(p,ball,new T.MeshBasicMaterial({color}),points[0],[.48,.48,.48]);bead.visible=false;flows.push({p,bead,points,taskId})}
 function monitor(p,x,z,y=1.2){box(p,x,y,z,1.6,.1,.9,m.wood);box(p,x,y/2,z,1.45,y,.7,m.cream);box(p,x,y+.6,z-.14,.85,.58,.07,m.dark);box(p,x,y+.6,z-.095,.72,.46,.018,m.blue);box(p,x,y+.2,z-.14,.06,.3,.05);box(p,x,y+.08,z+.25,.65,.06,.25,m.dark);box(p,x,.65,z+1,.6,.13,.6,m.dark);box(p,x,1,z+1.26,.6,.65,.1,m.dark);}
 function conveyor(p,x,z,w,len){box(p,x,.8,z,w,.32,len,m.dark);for(let j=-len/2+.5;j<len/2;j+=.55)tube(p,x,1,z+j,.085,w-.2,m.steel,0,Math.PI/2);for(const s of [-1,1])box(p,x+s*w/2,1.1,z,.09,.25,len,m.blue);for(let j=-len/2+1;j<len/2;j+=3)for(const s of [-1,1])box(p,x+s*w*.4,.4,z+j,.12,.7,.15)}
 function pallet(p,x,y,z,loaded=true){box(p,x,y+.14,z,1.2,.27,1,m.wood);for(let j=0;j<5;j++)box(p,x,y+.3,z-.4+j*.2,1.2,.04,.14,m.cream);if(loaded){box(p,x,y+.95,z,1.1,1.25,.95,m.cream);box(p,x,y+.95,z+.485,.75,.35,.025,m.blue)}}
 function person(p,d){const o=new T.Group();p.add(o);o.position.set(d.x-(d.w/2-1.8),0,d.z);const white=['frontdesk','administration','meeting'].includes(d.id)?m.blue:m.cream;mesh(o,cyl,white,[0,1.1,0],[.27,.85,.23]);mesh(o,ball,material('skin',0xbd967e),[0,1.78,0],[.19,.23,.18]);mesh(o,ball,m.blue,[0,1.93,0],[.2,.09,.19]);const arms=[];for(const s of [-1,1]){mesh(o,cyl,m.dark,[s*.15,.43,0],[.09,.85,.09]);const a=new T.Group();a.position.set(s*.3,1.45,0);o.add(a);mesh(a,cyl,white,[0,-.26,0],[.075,.5,.075]);arms.push(a)}workers.push({o,arms,dept:d.id});}
 for(const d of DEPARTMENTS){const g=new T.Group();g.name=d.id;(d.id==='parking'?outdoor:root).add(g);const fm=material('floor-'+d.id,['asrs','pallet','shipping'].includes(d.id)?0xaaa99b:['frontdesk','administration','meeting'].includes(d.id)?0xc7c0ae:0xbfcecb);const f=mesh(g,boxes,fm,[d.x,.27,d.z],[d.w,.22,d.d]);f.userData={id:'dept-'+d.id,deptId:d.id,title:d.title,description:d.steps.join(' → '),target:d.target,provenance:'SIMULATED_LAYOUT'};picks.push(f);const label=name(g,d.title,d.x,5,d.z,Math.min(22,d.w+8));areas.set(d.id,{g,f,label,d});
  if(!['shipping','parking'].includes(d.id)){for(const s of [-1,1])box(g,d.x+s*d.w/2,.9,d.z,.12,1.3,d.d,m.wall);box(g,d.x,.9,d.z+d.d/2,d.w,1.3,.12,m.wall)}
  if(['reception','process','pack','pallet','administration','maintenance','frontdesk','cip'].includes(d.id))person(g,d);
 }
 let p=areas.get('reception').g;equipment(p,'reception','REC.PUMP','Bomba de descarga','Bombas / colector',40,83,'RECEPTION.UNLOAD');for(let i=0;i<3;i++){tube(p,37+i*1.5,1.1,80,.12,7,m.steel,Math.PI/2);box(p,37+i*1.5,1.2,76.8,.5,.5,.5,m.blue)}monitor(p,34,91);name(p,'Muestra → LABS',35,3,100,12);
 p=areas.get('raw').g;for(const [i,x] of [9,22].entries()){tank(p,x,88,3,9);equipment(p,'raw','RAW.TANK.'+i,'Silo SIM '+(i+1),'Capacidad real desconocida',x,82,'RECEPTION.UNLOAD')}
 p=areas.get('process').g;
 let e=equipment(p,'process','PROC.SEPARATOR','Separación / preparación','Representación de proceso genérico',-1,55,'PLANT.PROCESS');tank(p,-1,55,1.9,4.2);
 e=equipment(p,'process','PROC.HOMOGENIZER','Homogeneización ilustrativa','Skid genérico',16,54,'PLANT.PROCESS');for(let i=0;i<3;i++)tube(p,14.9+i*1.1,2,54.8,.28,1.8,m.steel,Math.PI/2);
 e=equipment(p,'process','PROC.THERMAL','Tratamiento térmico','Sublínea genérica, sin receta atribuida',2,30,'PLANT.PROCESS');for(let i=0;i<22;i++)box(p,-3+i*.3,2.1,30,.16,3.5,4,m.steel);for(let i=0;i<4;i++){tube(p,14+i,3.3,32,.18,12,m.steel,Math.PI/2);tube(p,14+i,3.3,20,.18,3,m.steel,0,Math.PI/2)}
 tank(p,23,14,2.4,6);equipment(p,'process','PROC.BUFFER','Buffer de proceso','Depósito ilustrativo',23,9,'PLANT.PROCESS');monitor(p,-5,12);
 p=areas.get('cip').g;for(let z=22;z<=52;z+=10)tank(p,40,z,2,5);equipment(p,'cip','CIP.SKID','CIP / retorno','No concentra ni dosifica productos reales',40,61,'PLANT.CIP');
 p=areas.get('pack').g;for(let x=12;x<40;x+=19){equipment(p,'pack','PACK.FILL.'+x,'Llenadora / cerradora genérica','Sin proveedor/modelo atribuido',x,-10,'PLANT.PACK');box(p,x,3,-11,5,5,7,m.cream);box(p,x,3,-7.45,4.5,3,.12,m.glass);tube(p,x-2.5,4,-13,1.3,.8,m.cream,0,Math.PI/2);conveyor(p,x,-23,1.8,18);for(let k=0;k<12;k++)box(p,x,1.6,-15-k,.65,1,.55,m.cream)}
 const carton=mesh(areas.get('pack').g,boxes,m.blue,[12,1.6,-14],[.66,1,.58]);dynamic.push({o:carton,taskId:'PLANT.PACK',from:[12,1.6,-14],to:[12,1.6,-32]});
 p=areas.get('materials').g;for(let z=-26;z<=-8;z+=6)for(const x of [-10,-3])pallet(p,x,.4,z);name(p,'Stock auxiliar no medido',-6,4,-7,16);
 p=areas.get('pallet').g;conveyor(p,17,-43,2,12);equipment(p,'pallet','PALLET.ROBOT','Paletizado ilustrativo','Movimiento vinculado a almacenaje',28,-43,'WAREHOUSE.PUTAWAY');const arm=new T.Group();arm.position.set(28,1,-43);p.add(arm);box(arm,0,1.8,0,.6,3.6,.6,m.yellow);box(arm,1.7,3.4,0,3.4,.4,.5,m.yellow);dynamic.push({o:arm,taskId:'WAREHOUSE.PUTAWAY',rotation:true});
 p=areas.get('asrs').g;
 // Open steel frames and pallet runners, not solid plates. Bay/occupancy counts remain illustrative.
 for(const x of [-6,7,27,40]){
  for(let z=-104;z<=-55;z+=7)for(const side of [-1,1]){box(p,x+side*2.8,13,z,.25,26,.25,m.blue);for(let y=2;y<25;y+=5)box(p,x+side*2.8,y,z+.35,.16,.16,.7,m.steel)}
  for(let level=0;level<9;level++){
   const y=.8+level*2.8;
   for(const side of [-1,1])box(p,x+side*2.8,y,-79.5,.18,.23,49,m.yellow);
   for(let z=-100.5;z<-55;z+=7){
    for(const dz of [-2.6,0,2.6])box(p,x,y,z+dz,5.6,.16,.14,m.yellow);
    for(const side of [-1,1])for(const dz of [-1.8,0,1.8])pallet(p,x+side*1.35,y+.05,z+dz,true);
   }
  }
 }
 const lift=mesh(p,boxes,m.red,[17,1.1,-81],[4,.6,4]);dynamic.push({o:lift,taskId:'WAREHOUSE.PUTAWAY',from:[17,1.1,-81],to:[17,23.5,-81]});name(p,'9 niveles · referencia Esnova / calles propuestas',17,28,-81,46);
 p=areas.get('shipping').g;for(let z=-99;z<=-49;z+=15){pallet(p,61,.5,z);box(p,61,1.6,z,3,.1,5,m.yellow)}equipment(p,'shipping','SHIP.CONTROL','Control de salida','Verifica decisión de expedición',62,-49,'DISPATCH.LOAD');
 for(const id of ['frontdesk','administration','meeting']){p=areas.get(id).g;const d=areas.get(id).d;if(id==='meeting'){box(p,-26,1.1,d.z,10,.2,2.5,m.wood);for(let i=0;i<5;i++)box(p,-30+i*2,.7,d.z-2,.7,.15,.6,m.blue)}else{for(let z=d.z-d.d/2+3;z<d.z+d.d/2-1;z+=4)for(const x of [-31,-24])monitor(p,x,z);equipment(p,id,'ADMIN.'+id,d.title,'Dossier derivado; no réplica de ERP',-20,d.z)}}
 p=areas.get('staff').g;for(let i=0;i<10;i++){box(p,-33,.9,42+i*2.5,1.5,1.8,1,m.blue);box(p,-32.15,1,42+i*2.5,.05,.2,.05,m.steel)}box(p,-25,.6,55,2,.2,16,m.wood);
 p=areas.get('maintenance').g;box(p,-26,1,90,10,.2,2,m.wood);for(let i=0;i<8;i++)box(p,-31+i*1.5,2.5,102,1.2,2.8,1,m.blue);equipment(p,'maintenance','MAINT.BENCH','Puesto de mantenimiento','Consulta de recursos no aptos',-26,80);
 p=areas.get('lab').g;monitor(p,-7,88);equipment(p,'lab','LAB.PORTAL','Entrar en laboratorio','Abre la vista Labs existente',-7,81);name(p,'LABS →',-7,4,97,12);
 // Bay count and car occupancy are deliberately scenario values, not a survey.
 p=areas.get('parking').g;for(let i=0;i<18;i++){const z=-25+i*3.7;box(p,-48,.41,z,7,.025,.08,m.cream);if(i%3!==1){box(p,-48,1,z+1.5,4.4,1.1,1.8,i%2?m.blue:m.dark);box(p,-48,1.8,z+1.5,2.3,.65,1.6,m.glass)}}
 pipe([[40,1.5,83],[35,1.5,83],[35,4.5,88],[22,4.5,88]],0x78b6d7,'RECEPTION.UNLOAD');
 pipe([[22,6,88],[24,6,63],[0,6,63],[0,4,55],[16,4,55],[16,4,30],[23,4,14]],0xe9e7ce,'PLANT.PROCESS');
 pipe([[23,4,14],[23,4,0],[12,4,0],[12,3,-10]],0x89cdb7,'PLANT.PACK');
 pipe([[40,2,61],[32,2,61],[32,3,27],[2,3,27]],0xe9b460,'PLANT.CIP');
 const helper=new T.Object3D();for(const b of batches.values()){const inst=new T.InstancedMesh(b.geo,b.mat,b.items.length);b.items.forEach((t,i)=>{helper.position.set(...t.pos);helper.scale.set(...t.scale);helper.rotation.set(...t.rotation);helper.updateMatrix();inst.setMatrixAt(i,dummyFix(helper))});inst.castShadow=true;inst.receiveShadow=true;b.p.add(inst)}
 function dummyFix(helper){return helper.matrix}
 const outline=mesh(root,boxes,new T.MeshBasicMaterial({color:0xf2c564,wireframe:true}),[17,1,0],[66,1,220]);
 function pathAt(points,t){let lengths=points.slice(1).map((b,i)=>new T.Vector3(...b).distanceTo(new T.Vector3(...points[i]))),dist=t*lengths.reduce((a,b)=>a+b,0);for(let i=0;i<lengths.length;i++){if(dist<=lengths[i]||i===lengths.length-1)return new T.Vector3(...points[i]).lerp(new T.Vector3(...points[i+1]),lengths[i]?Math.min(1,dist/lengths[i]):0);dist-=lengths[i]}}
 let selected='process',isolated=false,flowVisible=true,last=null,signsApplied=false;
 function resolveSigns(){if(signsApplied)return;const old=world.shell.children.find(o=>o.geometry?.type==='PlaneGeometry'&&o.material?.map&&Math.abs(o.position.x+16.25)<.01&&Math.abs(o.position.y-22)<.01);if(!old)return;SIGN_PLACEMENTS.forEach((d,i)=>{const o=i===0?old:new T.Mesh(new T.PlaneGeometry(...d.size),old.material);o.position.set(...d.position);o.rotation.y=d.rotationY;o.name=d.id;o.userData={id:d.id,title:d.surface,description:'Posición fotointerpretada, sin medida. SVG existente de referencia, no vector oficial verificado.',provenance:'INFERRED_RECONSTRUCTION'};if(i)world.shell.add(o);world.selectable.push(o)});signsApplied=true;}
 function visibility(){for(const [id,a]of areas)a.g.visible=!isolated||id===selected;for(const f of flows)f.p.visible=flowVisible&&!isolated;const a=areas.get(selected).d;outline.position.set(a.x,.7,a.z);outline.scale.set(a.w+.2,.6,a.d+.2);outline.visible=world.interior.visible&&selected!=='parking'}
 function update(v){last=v;for(const device of machines){const status=v.tasks?.[device.taskId]?.state;device.led.material.color.setHex(status==='RUNNING'?0x3ebd91:['HELD','UNAVAILABLE','WAIT_GATE'].includes(status)?0xd45d55:status==='DONE'?0x67b892:0x657b86)}for(const a of dynamic){const t=v.tasks?.[a.taskId],progress=t?.progress||0;if(a.rotation)a.o.rotation.y=-progress*Math.PI*.7;else a.o.position.lerpVectors(new T.Vector3(...a.from),new T.Vector3(...a.to),progress);a.o.visible=!!t&&t.state!=='PENDING'&&t.progress>0}
  for(const f of flows){const t=v.tasks?.[f.taskId];f.bead.visible=t?.state==='RUNNING';if(t)f.bead.position.copy(pathAt(f.points,t.progress))}for(const person of workers){const d=v.departments.find(d=>d.id===person.dept);person.arms.forEach((arm,i)=>arm.rotation.x=d?.status==='RUNNING'?.25+Math.sin(v.seconds*1.8+i)*.22:0)}visibility();
 }
 world.selectable.push(...picks);
 return {root,outdoor,picks,areas,machines,update,resolveSigns,focus(id){if(!areas.has(id))return;selected=id;visibility()},isolate(value){isolated=!!value;visibility()},flows(value){flowVisible=!!value;visibility()},camera(id){const a=areas.get(id)?.d;if(!a)return null;const height=id==='asrs'?56:Math.max(15,a.w*.65);return {p:[a.x-12,height,a.z+22],t:[a.x,id==='asrs'?10:1,a.z]};},snapshot(){return {provenance:'SIMULATED_LAYOUT',signsApplied,selected,isolated,flowVisible,departments:areas.size,equipment:machines.length,staff:workers.length,warehouseLevels:9,visible:world.interior.visible,active:machines.filter(a=>last?.tasks?.[a.taskId]?.state==='RUNNING').map(a=>a.id),motion:dynamic.map(a=>({taskId:a.taskId,position:a.o.position.toArray(),rotation:a.o.rotation.y}))}}};
}
