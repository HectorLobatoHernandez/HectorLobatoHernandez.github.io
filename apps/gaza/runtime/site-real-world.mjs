import {makePath,samplePath,sampleTrip,ribbon} from './site-real-core.mjs';
/** Photographic interpretation; dimensions and internal traffic are editable scenario parameters, NOT surveyed geometry. */
export function buildExterior(THREE,{logoUrl='assets/gaza-logo.svg'}={}){
  const root=new THREE.Group(),shell=new THREE.Group(),interior=new THREE.Group(),labels=new THREE.Group(),routes=new THREE.Group(),actors=new THREE.Group();
  root.name='COResES_PHOTO_STUDY_NOT_GEOREREFERENCED';root.add(shell,interior,labels,routes,actors);interior.visible=false;
  const selectable=[],moving=[],barriers=[],materials=new Map(),cube=new THREE.BoxGeometry(1,1,1),geoCylinder=new THREE.CylinderGeometry(1,1,1,10),geoSphere=new THREE.SphereGeometry(1,10,7),boxColliders=[];
  function mat(color,metalness=0,roughness=.8){const key=[color,metalness,roughness].join('/');if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness,roughness}));return materials.get(key)}
  const steel=mat('#abb5b9',.48,.42),grey=mat('#91999c',.18,.7),red=mat('#b94149',.1,.65),white=mat('#e6e7df'),blue=mat('#204c83'),black=mat('#243039'),rubber=mat('#17212a'),glass=mat('#354f5c',.35,.28),yellow=mat('#ddbd59'),grass=mat('#63784d'),asphalt=mat('#5b6264'),wood=mat('#a96d3c');
  function mesh(geo,m,x,y,z,sx=1,sy=1,sz=1,parent=root){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
  const box=(x,y,z,w,h,d,m=grey,parent=root)=>mesh(cube,m,x,y,z,w,h,d,parent);
  const cylinder=(x,y,z,r,h,m=steel,parent=root)=>mesh(geoCylinder,m,x,y,z,r,h,r,parent);
  function tag(object,id,title,description,target=null){object.userData={id,title,description,target,provenance:'INFERRED_RECONSTRUCTION',geometry:'DIMENSIONS_AND_POSITIONS_UNSURVEYED'};selectable.push(object);return object}
  function textSprite(text,x,y,z,scale=26){const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#102538ee';ctx.fillRect(0,0,768,128);ctx.fillStyle='#e3edf1';ctx.font='bold 34px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,65);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false,transparent:true}));s.position.set(x,y,z);s.scale.set(scale,scale/6,1);labels.add(s);return s}
  function flatPath(points,width,material=asphalt,parent=root){const raw=ribbon(points.map(([x,z])=>[x,-z]),width),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(raw.positions,3));g.setIndex(raw.indices);g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.material.side=THREE.DoubleSide;m.receiveShadow=true;parent.add(m);return m}
  function line(points,color='#d4d9da',parent=root){const geom=new THREE.BufferGeometry().setFromPoints(points.map(([x,z])=>new THREE.Vector3(x,.31,z))),m=new THREE.Line(geom,new THREE.LineBasicMaterial({color}));parent.add(m);return m}
  function instanceBoxes(placements,material,parent=root){if(!placements.length)return;const inst=new THREE.InstancedMesh(cube,material,placements.length),dummy=new THREE.Object3D();placements.forEach((p,i)=>{dummy.position.set(...p.slice(0,3));dummy.scale.set(...p.slice(3,6));dummy.rotation.set(0,p[6]??0,0);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)});inst.castShadow=true;inst.receiveShadow=true;inst.instanceMatrix.needsUpdate=true;parent.add(inst)}
  // Own local scene coordinates. Deliberately kept separate from real OSM geometry.
  box(0,-.6,0,360,1,400,grass);box(8,-.02,0,169,.15,296,mat('#a2a59d'));
  flatPath([[-94,-190],[-94,187]],17);flatPath([[-150,170],[-94,170],[130,170]],15);
  flatPath([[-94,-111],[-58,-111]],14);flatPath([[-94,106],[-58,106]],14);
  flatPath([[-58,-139],[-58,137],[75,137],[75,-139],[-58,-139]],13);
  // Sidewalk and protected pedestrian route; no virtual roadway crosses the building.
  box(-80,.2,0,5,.3,320,mat('#c1c0b4'));box(-43,.23,30,3,.25,240,mat('#c5c3b8'));
  for(let z=-178;z<180;z+=13)box(-94,.22,z,.18,.025,5,white);
  tag(box(17,7.5,0,66,15,220,grey,shell),'main','Nave longitudinal · gris metálico','Aspecto exterior observado en las capturas. Huella, altura y posición de este estudio no están medidas.');
  tag(box(17,22,-76,66,14,68,red,shell),'highbay','Volumen elevado rojo','Coronación roja observada; correspondencia funcional con almacén pendiente de validación.');
  box(17,15.25,25,66.6,.5,170,steel,shell);box(17,29.3,-76,66.6,.4,68.5,red,shell);
  // Corrugation/ribs rendered with instancing, not hundreds of draw calls.
  const ribs=[];for(let y=.5;y<15;y+=.48){ribs.push([-16.07,y,0,.12,.07,220],[50.07,y,0,.12,.07,220],[17,y,110.07,66,.07,.12],[17,y,-110.07,66,.07,.12])}instanceBoxes(ribs,mat('#737e84',.2),shell);
  for(let z=-105;z<107;z+=16){box(-16.2,7.5,z,.35,15,.32,steel,shell);box(50.2,7.5,z,.35,15,.32,steel,shell)}
  // Grey glazed office projection and low red services block, as in user photographs.
  tag(box(-26,4,-13,20,8,48,grey,shell),'offices','Oficinas · acceso 1','Anexo acristalado reconocido en las fotos; distribución interior no documentada.');
  box(-36.15,5.2,-13,.2,2.3,44,glass,shell);for(let z=-34;z<10;z+=3)box(-36.32,5.2,z,.12,2.5,.14,black,shell);
  box(-26,8.2,-13,21,.4,49,steel,shell);
  tag(box(-26,2.7,72,20,5.4,70,red,shell),'services','Anexo bajo rojo','Bloque exterior observado. Uso de cada estancia pendiente de validación.');
  for(let z=44;z<105;z+=10)box(-36.15,2.65,z,.15,1.5,2,glass,shell);
  // Photographic timber pavilion is a reference feature, not a current construction claim.
  box(-28,.35,-83,20,.6,22,mat('#c3b6a3'));const timber=[];for(const x of [-37,-19])for(const z of [-92,-74])timber.push([x,2.4,z,.32,4.8,.32]);for(let z=-94;z<-71;z+=2.5)timber.push([-28,5,z,22,.25,.26]);instanceBoxes(timber,wood);
  tag(box(-28,2.4,-83,18,3.7,18,mat('#b38454')),'pavilion','Pabellón de madera · referencia fotográfica','Presente en capturas de 2025; estado actual y medidas no confirmados.');
  // Existing repository logo, no embedded Street View texture or imitation wordmark.
  const loader=new THREE.TextureLoader();loader.load(logoUrl,tx=>{tx.colorSpace=THREE.SRGBColorSpace;const gm=new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide});const panel=new THREE.Mesh(new THREE.PlaneGeometry(20,9),gm);panel.position.set(-16.25,22,-76);panel.rotation.y=-Math.PI/2;shell.add(panel)},undefined,()=>{});
  // Fence segments have actual openings at both scenario gates.
  const fence=[];function fenceRun(a,b){const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),n=Math.ceil(l/3.2),angle=Math.atan2(-dz,dx);for(let i=0;i<=n;i++)fence.push([a[0]+dx*i/n,1.6,a[1]+dz*i/n,.1,3.2,.1]);for(let i=0;i<l;i+=.55)fence.push([a[0]+dx*i/l,1.7,a[1]+dz*i/l,.045,2.6,.045]);for(const y of [.5,2.9])fence.push([(a[0]+b[0])/2,y,(a[1]+b[1])/2,l,.075,.075,angle])}
  fenceRun([-74,-151],[-74,-123]);fenceRun([-74,-99],[-74,94]);fenceRun([-74,118],[-74,151]);fenceRun([-74,-151],[94,-151]);fenceRun([94,-151],[94,151]);fenceRun([94,151],[-74,151]);instanceBoxes(fence,white);
  function sign(text,x,z,shape='circle'){
    const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#bb3b44';ctx.beginPath();if(shape==='stop'){for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4;ctx.lineTo(64+59*Math.cos(a),64+59*Math.sin(a))}}else ctx.arc(64,64,58,0,Math.PI*2);ctx.fill();ctx.fillStyle=shape==='stop'?'#ffffff':'#efeee7';if(shape!=='stop'){ctx.beginPath();ctx.arc(64,64,46,0,Math.PI*2);ctx.fill();ctx.fillStyle='#26303a'}ctx.font='bold 35px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,64,65);const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide}));m.position.set(x,3.4,z);m.rotation.y=-Math.PI/2;root.add(m);cylinder(x,1.4,z,.065,2.8);return m;
  }
  for(const [i,z] of [-111,106].entries()){
    const target=i?'labs':'workflow';tag(box(-74,.8,z-7,1.1,1.6,1.1,black),'access'+(i+1),'Acceso '+(i+1)+(i?' · leche / báscula':' · muelles / oficinas'),'Función legible en el cartel aportado; ubicación exacta y circuitos por validar.',target);
    const pivot=new THREE.Group();pivot.position.set(-74,1.2,z-7);root.add(pivot);box(0,.15,4,.26,.3,8,white,pivot);for(let j=1;j<8;j+=2)box(0,.15,j,.27,.32,.8,red,pivot);barriers.push(pivot);
    for(let j=0;j<8;j++)box(-66,.25,z-5+j*1.45,4,.035,.7,white);
    sign('20',-77,z-10);sign('STOP',-77,z+10,'stop');textSprite('ACCESO '+(i+1)+(i?' · LECHE':' · EXPEDICIÓN'),-75,6,z,29);
  }
  // Lamps, trees, curb detailing and neighboring industrial volume.
  const poles=[];for(let z=-145;z<148;z+=35){poles.push([-80,5,z,.16,10,.16],[-79,10,z,2.2,.14,.55]);cylinder(-110,6,z,.22,12,mat('#aaa391'));const cable=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-110,11,z),new THREE.Vector3(-110,10.5,z+17),new THREE.Vector3(-110,11,z+35)]);root.add(new THREE.Line(cable,new THREE.LineBasicMaterial({color:'#414948'})))}instanceBoxes(poles,steel);
  const treeMat=mat('#496640');for(let i=0;i<17;i++){const x=i<9?-69:90,z=-140+(i%9)*33;cylinder(x,2,z,.25,4,wood);mesh(geoSphere,treeMat,x,5,z,2.6,2.8,2.6)}
  box(-139,7,-55,50,14,100,mat('#7d8985'));box(-139,14.1,-55,51,.3,101,steel);
  // Proposed reception/cooling and docks. Selected objects open existing department views.
  for(let z=30;z<=56;z+=10){cylinder(58,5,z,3.2,10,steel);cylinder(58,10,z,3.25,.25,white)}
  tag(box(75,.32,107,8,.5,20,black),'weighbridge','Báscula · acceso 2','Elemento documentado en cartel. Posición y capacidad de este escenario son propuestas.','workflow');
  tag(box(55,2,22,5,4,12,blue),'reception','Recepción de leche','Entrada de cisternas vía acceso 2; muestreo y liberación en Workflow.','labs');
  for(let z=-94;z<=-48;z+=15){box(50.35,3,z,.3,6,7,black,shell);box(54,.65,z,7,1.3,7,mat('#b2afa0'));for(const dz of [-4,4])cylinder(56,1.2,z+dz,.15,2.4,yellow)}
  textSprite('MUELLES · ACCESO 1',59,9,-74);textSprite('LECHE / MUESTREO',60,13,35);textSprite('COResES · EXTERIOR INFERIDO',16,32,-76,56);
  // Cutaway stations are deliberately marked proposed, not hidden-room reconstructions.
  box(17,.2,0,65,.3,218,mat('#d6d6c9'),interior);
  const stations=[[-1,75,'Laboratorio · interior propuesto','labs'],[26,55,'Recepción / frío · esquema','workflow'],[13,10,'Fabricación · esquema','workflow'],[22,-25,'Envasado · esquema','workflow'],[20,-77,'Almacén · esquema','workflow']];
  for(const [x,z,title,target] of stations){tag(box(x,1.25,z,16,2.5,22,blue,interior),'process-'+z,title,'Distribución interior hipotética para entrenamiento. No es el plano interno de GAZA.',target);for(let j=0;j<3;j++)cylinder(x-5+j*5,3.5,z+3,1.8,4.5,steel,interior)}
  // Simple finite-task trips. +X is the shared vehicle asset forward-axis contract.
  const tankerPath=makePath([[-94,183],[-94,106],[-58,106],[-58,137],[75,137],[75,23],[75,137],[-58,137],[-58,106],[-94,106],[-94,-180]]);
  const trailerPath=makePath([[-94,-183],[-94,-111],[-58,-111],[-58,-137],[75,-137],[75,-78],[75,-137],[-58,-137],[-58,-111],[-94,-111],[-94,183]]);
  const carPath=makePath([[-94,-185],[-94,185]]);
  for(const p of [tankerPath,trailerPath])line([p.segments[0].a,...p.segments.map(s=>s.b)],p===tankerPath?'#57aac9':'#d9b366',routes);
  function makeVehicle(type,color){
    const tractor=new THREE.Group(),load=new THREE.Group(),wheels=[];actors.add(tractor,load);
    box(1.4,1.7,0,3.1,2.6,2.4,mat(color),tractor);box(3,2.1,0,.08,1.1,2.1,glass,tractor);box(0,.65,0,6,.3,2,black,tractor);box(2,3.12,0,2.2,.18,2.5,white,tractor);
    if(type==='tanker'){const tank=mesh(new THREE.CylinderGeometry(1.35,1.35,8,20),steel,0,2,0,1,1,1,load);tank.rotation.z=Math.PI/2;for(let i=-3;i<=3;i+=3)cylinder(i,3.45,0,.35,.15,black,load)}else box(0,2.05,0,9,3,2.65,white,load);
    box(0,.6,0,9,.3,2,black,load);
    const wheelGeometry=new THREE.CylinderGeometry(.52,.52,.3,12);wheelGeometry.rotateX(Math.PI/2);
    for(const [group,xs] of [[tractor,[-1.5,2]],[load,[-2.6,-1.3]]])for(const x of xs)for(const z of [-1.2,1.2]){const w=mesh(wheelGeometry,rubber,x,.55,z,1,1,1,group);wheels.push(w)}
    const logo=loader.load(logoUrl,tx=>tx.colorSpace=THREE.SRGBColorSpace,undefined,()=>{});const pm=new THREE.MeshBasicMaterial({map:logo,side:THREE.DoubleSide});for(const z of [-1.38,1.38]){const p=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.3),pm);p.position.set(0,2.1,z);if(z<0)p.rotation.y=Math.PI;load.add(p)}
    return {tractor,load,wheels};
  }
  for(const [i,path] of [tankerPath,trailerPath].entries()){
    const v=makeVehicle(i?'box':'tanker',i?'#c9d3d5':'#dce3df'),stops=i?[{distance:85,seconds:5,label:'Control acceso 1'},{distance:326,seconds:16,label:'Espera muelle / expedición'}]:[{distance:89,seconds:5,label:'Control acceso 2'},{distance:307,seconds:10,label:'Báscula / registro de entrada'},{distance:391,seconds:16,label:'Muestreo / recepción de leche'}];
    moving.push({...v,id:i?'SIM-TRAILER-1':'SIM-TANKER-1',path,stops,speed:i?5:4,elapsed:i?8:0,previousDistance:0,phase:'Preparado'});
  }
  // Light vehicles and workers remain clearly synthetic; pedestrian paths are separate.
  for(let i=0;i<7;i++){const c=new THREE.Group();actors.add(c);box(0,.8,0,4,1.1,1.8,mat(['#d9dedf','#344a63','#99363e'][i%3]),c);box(0,1.5,0,2.1,.7,1.65,glass,c);c.position.set(-48,0,-6+i*9);c.rotation.y=Math.PI/2}
  const walkers=[];for(let i=0;i<8;i++){const g=new THREE.Group(),legs=[],arms=[];actors.add(g);box(0,1.05,0,.52,.65,.3,i%3?yellow:blue,g);mesh(geoSphere,mat('#b3886d'),0,1.62,0,.2,.22,.2,g);for(const sign of [-1,1]){const leg=new THREE.Group();leg.position.set(sign*.14,.76,0);g.add(leg);box(0,-.35,0,.15,.7,.16,black,leg);legs.push(leg);const arm=new THREE.Group();arm.position.set(sign*.33,1.36,0);g.add(arm);box(0,-.25,0,.12,.55,.14,i%3?yellow:blue,arm);arms.push(arm)}walkers.push({g,legs,arms,phase:i*.8,z:-43+i*17})}
  let time=0;
  function update(dt,{held=false,process=null}={}){
    time+=dt;
    for(const m of moving){
      const taskId=m.id==='SIM-TANKER-1'?'LOGISTICS.TRANSIT':'DELIVERY.ARRIVE',task=process?.state.lots[process.lotId]?.tasks[taskId];
      if(process){const duration=m.path.length/m.speed+m.stops.reduce((a,x)=>a+x.seconds,0)+8;const fraction=task?.status==='DONE'?1:task?.status==='RUNNING'?task.elapsed/24:0;m.elapsed=Math.max(0,Math.min(1,fraction))*duration;}else if(!held)m.elapsed+=dt;
      let p=sampleTrip(m.path,m.elapsed,{speed:m.speed,stops:m.stops});
      if(p.complete&&!held&&!process){m.elapsed=0;p=sampleTrip(m.path,0,{speed:m.speed,stops:m.stops});m.previousDistance=0}
      m.tractor.position.set(p.x,.15,p.z);m.tractor.rotation.y=p.yaw;
      const rear=samplePath(m.path,Math.max(0,p.distance-6.5));if(p.distance<6.5){rear.x-=rear.tangent[0]*(6.5-p.distance);rear.z-=rear.tangent[1]*(6.5-p.distance)}m.load.position.set(rear.x,.15,rear.z);m.load.rotation.y=rear.yaw;
      const travel=p.distance-m.previousDistance;m.previousDistance=p.distance;for(const w of m.wheels)w.rotation.z-=Math.max(0,travel)/.52;
      m.phase=held?'HOLD del lote · Workflow':process?(task?.status==='RUNNING'?taskId:task?.status==='DONE'?'Tarea terminada':'Esperando tarea autorizada'):p.phase;m.position=[p.x,p.z];m.heading=p.tangent;
    }
    for(const [i,b] of barriers.entries()){const m=moving[i===0?1:0],open=!held&&m.previousDistance>m.stops[0].distance+.1&&m.phase!=='Control acceso '+(i+1);b.rotation.x=THREE.MathUtils.damp(b.rotation.x,open?-1.45:0,3,dt)}
    for(const w of walkers){w.g.position.set(-42,0,w.z+Math.sin(time*.025+w.phase)*4);w.g.rotation.y=Math.cos(time*.025+w.phase)>0?0:Math.PI;w.legs.forEach((l,i)=>l.rotation.x=Math.sin(time*3+w.phase+i*Math.PI)*.36);w.arms.forEach((a,i)=>a.rotation.x=-Math.sin(time*3+w.phase+i*Math.PI)*.25)}
  }
  update(0);
  return {root,shell,interior,labels,routes,actors,selectable,update,moving,boxColliders,
    meta:{version:2,geometry:'PHOTO_INFERRED_STUDY',alignment:'NOT_GEOREREFERENCED',vehicles:2,workers:8,access1:'MUELLES_OFICINAS_AULA',access2:'LECHE_BASCULA_SERVICIOS'},
    setCutaway(value){shell.visible=!value;interior.visible=value},
    dispose(){const geometries=new Set(),mats=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material||[])){mats.add(m);if(m.map)textures.add(m.map)}});geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}
  };
}
