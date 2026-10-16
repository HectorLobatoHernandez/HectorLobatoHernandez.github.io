import * as THREE from 'three';
import {createTraffic,signalAt,pedestrianGreen,intersections} from './atlas-life-state.mjs';
import {businessPoint,businessFixtures} from './atlas-business-state.mjs';
import {vintageNeonTexture} from './atlas-vintage-neon.mjs';
import {neonPulse} from './atlas-cinematic-state.mjs';
import {ramp} from './atlas-city-state.mjs';

export function createUrbanLife({scene,city,config,reduced=false}){
 const group=new THREE.Group();group.name='Barrios y vida urbana / simulación conceptual';scene.add(group);
 const unit=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D(),parts=[],animated=[];
 const palette={iron:0x292e36,wood:0x694e37,stone:0x92948a,grass:0x456c43,leaf:0x527b4d,red:0xad3b32,cream:0xd1b77f,cyan:0x2bdad0,pink:0xf255ad,warm:0xffd1a0};
 const materials=Object.fromEntries(Object.entries(palette).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color,roughness:key==='iron'?.4:.9,metalness:key==='iron'?.6:0})]));
 materials.warm.emissive.set(0xffb16b);materials.warm.emissiveIntensity=0;materials.cream.emissive.set(0xffb16b);
 const add=(mat,x,y,z,w,h,d,rotation=0)=>parts.push({mat,x,y,z,w,h,d,rotation});
 const sphere=new THREE.SphereGeometry(1,10,7),cylinder=new THREE.CylinderGeometry(1,1,1,10);
 function instances(geometry,material,count,parent=group){const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.frustumCulled=false;parent.add(mesh);return mesh}
 function matrix(mesh,index,x,y,z,sx,sy,sz,rotation=0,tilt=0){dummy.position.set(x,y,z);dummy.rotation.set(tilt,rotation,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix)}
 const neons=[],glows=[],lights=[];let night=true,nightLevel=1,enabled=true,lastClock=null,accumulator=0,clock=0;
 const radial=document.createElement('canvas');radial.width=radial.height=128;const rx=radial.getContext('2d'),g=rx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffffff99');g.addColorStop(.35,'#ffffff22');g.addColorStop(1,'#ffffff00');rx.fillStyle=g;rx.fillRect(0,0,128,128);const radialMap=new THREE.CanvasTexture(radial);
 function pool(x,z,color,size=10){const mat=new THREE.MeshBasicMaterial({map:radialMap,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),mat);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,-.26,z);group.add(mesh);glows.push(mesh);return mat}
 function neon(b,index){
  const texture=vintageNeonTexture(b,index),material=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});
  const width=Math.min(8,b.width+.6),[x,z]=businessPoint(b,0,.9),mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width*640/2048),material);mesh.position.set(x,3.22,z);mesh.rotation.y=b.yaw;group.add(mesh);neons.push(mesh);
  const [gx,gz]=businessPoint(b,0,2.3),glow=pool(gx,gz,b.color,width*1.5),haloMat=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending,opacity:0}),halo=new THREE.Mesh(mesh.geometry,haloMat);halo.position.copy(mesh.position);halo.position.z+=b.side*.015;halo.rotation.copy(mesh.rotation);halo.scale.setScalar(1.02);group.add(halo);animated.push({material,glow,halo:haloMat,index});
 }
 const venues=city.descriptors.buildings.filter(b=>b.business).map(b=>b.business),patrons=[];
 for(const [index,b] of venues.entries()){
  const fixtures=businessFixtures(b);parts.push(...fixtures.parts);patrons.push(...fixtures.patrons);
  neon(b,index);
  {const [x,z]=businessPoint(b,0,-1.1),light=new THREE.PointLight(0xffac5c,65,12,2);light.position.set(x,2.3,z);group.add(light);lights.push(light)}
 }
 // Pocket lawns and a continuous canal promenade, without occupying project plans.
 for(const z of [-54,42])for(let x=-82;x<84;x+=24)add('grass',x,-.19,z,8,.12,2.3);
 add('grass',-153,-.22,0,6,.18,246);add('stone',-137,-.25,0,3,.16,246);
 for(const z of [-61,-9,49]){add('wood',-145,.02,z,15,.2,4);for(const side of [-1,1]){add('iron',-145,.8,z+side*1.8,15,.08,.08);for(let x=-151;x<-138;x+=2)add('iron',x,.35,z+side*1.8,.08,1,.08)}}
 const waterMat=new THREE.ShaderMaterial({uniforms:{time:{value:0},night:{value:1}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform float time;uniform float night;void main(){float wave=sin(v.y*380.+time*.9+sin(v.x*22.+time)*2.);float glint=pow(max(0.,wave),14.);vec3 deep=mix(vec3(.04,.28,.31),vec3(.015,.09,.14),night);gl_FragColor=vec4(deep+glint*vec3(.07,.16,.15),1.);}'});
 const canal=new THREE.Mesh(new THREE.PlaneGeometry(10,246),waterMat);canal.rotation.x=-Math.PI/2;canal.position.set(-145,-.31,0);group.add(canal);
 const basin=new THREE.Mesh(new THREE.CylinderGeometry(4.8,5,.5,32),materials.stone);basin.position.set(0,-.1,-9);group.add(basin);const fountain=new THREE.Mesh(new THREE.CircleGeometry(4.4,40),waterMat);fountain.rotation.x=-Math.PI/2;fountain.position.set(0,.17,-9);group.add(fountain);
 const drops=instances(sphere,new THREE.MeshBasicMaterial({color:0x75cfdc,transparent:true,opacity:.55}),64);
 const shrubs=instances(sphere,materials.leaf,96);for(let i=0;i<96;i++){const x=i<60?-153:(i%2?-91:91),z=i<60?-116+i*4:-46+Math.floor((i-60)/2)*5;matrix(shrubs,i,x,.3,z,.65,.7,.7)}
 const blades=instances(unit,materials.grass,460);for(let i=0;i<460;i++){const x=-155+(i%11)*.32,z=-119+Math.floor(i/11)*5.7;matrix(blades,i,x,.12,z,.07,.7,.04,i*.5,.1)}
 // Sagging utility cables and red lanterns through the older lanes.
 const lanternMat=new THREE.MeshStandardMaterial({color:0xe65028,emissive:0xff3819,emissiveIntensity:2,roughness:.75}),lanternPositions=[];
 for(let x=-120;x<=-20;x+=20){
  const points=[new THREE.Vector3(x-7,6,-88),new THREE.Vector3(x,5.1,-88),new THREE.Vector3(x+7,6,-88)];const wire=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),16,.035,4,false),materials.iron);group.add(wire);
  for(let j=-2;j<=2;j++)lanternPositions.push([x+j*2.7,5.1+Math.abs(j)*.18,-88]);
 }
 const lanterns=instances(sphere,lanternMat,lanternPositions.length);lanternPositions.forEach(([x,y,z],i)=>matrix(lanterns,i,x,y-.5,z,.34,.5,.34));
 // Static geometry uses material batches rather than one draw call per chair or leaf.
 for(const [name,mat] of Object.entries(materials)){const rows=parts.filter(p=>p.mat===name);if(!rows.length)continue;const mesh=instances(unit,mat,rows.length);rows.forEach((p,i)=>matrix(mesh,i,p.x,p.y,p.z,p.w,p.h,p.d,p.rotation));mesh.castShadow=true;mesh.receiveShadow=true}
 const traffic=createTraffic(32),carGroup=new THREE.Group();group.add(carGroup);const body=instances(unit,new THREE.MeshStandardMaterial({color:0xffffff,metalness:.45,roughness:.27}),32,carGroup),cab=instances(unit,new THREE.MeshStandardMaterial({color:0x152c39,metalness:.4,roughness:.2}),32,carGroup),wheels=instances(unit,materials.iron,128,carGroup),fronts=instances(unit,new THREE.MeshBasicMaterial({color:0xffe6b0,toneMapped:false}),64,carGroup),tails=instances(unit,new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),64,carGroup);
 const carColors=[0xffd779,0x8edfe5,0xec645b,0xf4eee0,0x739cc9,0xbec3c6];for(let i=0;i<32;i++)body.setColorAt(i,new THREE.Color(carColors[i%6]));
 const headPools=instances(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:radialMap,color:0xffe6b0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.65,toneMapped:false}),32,carGroup);
 const walkingRoutes=[[-103,-55,-40,42],[-40,-55,40,42],[40,-55,91,42],[-155,-105,-138,103],[-128,-88,-18,-87.5]].map(([x0,z0,x1,z1])=>({x0,z0,x1,z1,length:2*(x1-x0+z1-z0)}));
 const walkers=Array.from({length:128},(_,i)=>({route:walkingRoutes[i%5],s:i*8.37,speed:.8+(i%7)*.07,x:0,z:0,mode:'walk',phase:i*.73}));const people=[...walkers,...patrons];
 const torso=instances(unit,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9}),people.length),heads=instances(sphere,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95}),people.length),limbs=instances(unit,new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),people.length*4);const clothes=[0xe4c994,0x9ca6b2,0x8eaa85,0xcf8967,0xd3d9df,0xae9cbe],skins=[0xc58e65,0xe8b991,0x835c43,0xaa7856];
 for(let i=0;i<people.length;i++){torso.setColorAt(i,new THREE.Color(clothes[i%6]));heads.setColorAt(i,new THREE.Color(skins[i%4]));for(let j=0;j<4;j++)limbs.setColorAt(i*4+j,new THREE.Color(j<2?0x303642:clothes[i%6]))}
 const signalMats={red:new THREE.MeshBasicMaterial({color:0xff4434,toneMapped:false}),amber:new THREE.MeshBasicMaterial({color:0xffbe54,toneMapped:false}),green:new THREE.MeshBasicMaterial({color:0x65dfa1,toneMapped:false}),off:new THREE.MeshBasicMaterial({color:0x241e1c})},signals=[];
 for(const junction of intersections)for(const axis of ['x','z']){
  const x=junction.x+(axis==='x'?4:-4),z=junction.z+(axis==='x'?-4:4),pole=new THREE.Mesh(new THREE.CylinderGeometry(.09,.11,4,6),materials.iron);pole.position.set(x,1.5,z);group.add(pole);const housing=new THREE.Mesh(new THREE.BoxGeometry(.45,1.25,.4),materials.iron);housing.position.set(x,3.5,z);group.add(housing);const bulbs=[];
  for(let j=0;j<3;j++){const bulb=new THREE.Mesh(new THREE.SphereGeometry(.135,7,5),signalMats.off);bulb.position.set(x,3.89-j*.39,z+.23);group.add(bulb);bulbs.push(bulb)}signals.push({axis,bulbs});
 }
 function walkSample(person,dt){const r=person.route;let s=person.s%r.length;const w=r.x1-r.x0,h=r.z1-r.z0;let x,z,angle;if(s<w){x=r.x0+s;z=r.z0;angle=Math.PI/2}else if((s-=w)<h){x=r.x1;z=r.z0+s;angle=0}else if((s-=h)<w){x=r.x1-s;z=r.z1;angle=-Math.PI/2}else{x=r.x0;z=r.z1-(s-w);angle=Math.PI}
  const nearRoad=intersections.some(j=>Math.hypot(j.x-x,j.z-z)<8);if(!nearRoad)person.crossing=false;if(nearRoad&&!person.crossing&&pedestrianGreen(traffic.time)&&traffic.time%40<26)person.crossing=true;person.wait=nearRoad&&!person.crossing;if(!person.wait)person.s+=person.speed*dt;person.x=x;person.z=z;person.angle=angle;
 }
 walkers.forEach(person=>walkSample(person,0));
 function update(now,p){const t=now/1000,elapsed=lastClock===null?0:Math.max(0,Math.min(.2,t-lastClock));lastClock=t;if(enabled&&p>.999&&nightLevel>.15){accumulator+=elapsed;while(accumulator>=1/30){traffic.step(1/30);for(const walker of walkers)walkSample(walker,1/30);accumulator-=1/30}clock=t}
  group.visible=p>.74;group.scale.y=Math.max(.001,ramp(p,.74,.98));waterMat.uniforms.time.value=clock;
  for(const a of animated){const f=neonPulse(clock,a.index,reduced);a.material.color.setScalar(.14+nightLevel*2.65*f);a.halo.opacity=nightLevel*.72*f;a.glow.opacity=nightLevel*1.3*f}
  for(const mesh of [body,cab,wheels,fronts,tails,torso,heads,limbs])mesh.visible=p>.995;
  headPools.visible=p>.995&&nightLevel>.01;
  for(const s of signals){const state=signalAt(traffic.time,s.axis);s.bulbs.forEach((bulb,i)=>bulb.material=signalMats[['red','amber','green'][i]===state?state:'off'])}
  for(const c of traffic.cars){const {x,z,heading:a}=c,offset=(dx,dz)=>[x+Math.cos(a)*dx+Math.sin(a)*dz,z-Math.sin(a)*dx+Math.cos(a)*dz];matrix(body,c.id,x,.36,z,1.65,.58,3.6,a);const glow=offset(0,5.6);dummy.position.set(glow[0],-.31,glow[1]);dummy.rotation.set(-Math.PI/2,0,a);dummy.scale.set(3.2,8.5,1);dummy.updateMatrix();headPools.setMatrixAt(c.id,dummy.matrix);const roof=offset(0,-.15);matrix(cab,c.id,roof[0],.85,roof[1],1.35,.55,1.9,a);for(let j=0;j<4;j++){const q=offset(j%2?-.83:.83,j<2?-1.1:1.1);matrix(wheels,c.id*4+j,q[0],.05,q[1],.2,.5,.65,a)}for(let j=0;j<2;j++){let q=offset(j?-.52:.52,1.83);matrix(fronts,c.id*2+j,q[0],.48,q[1],.33,.14,.06,a);q=offset(j?-.52:.52,-1.83);matrix(tails,c.id*2+j,q[0],.48,q[1],.33,.14,.06,a);tails.setColorAt(c.id*2+j,new THREE.Color(c.speed<.2?0xff301f:0x7c1e18))}}
  for(let i=0;i<people.length;i++){const person=people[i],dance=person.mode==='dance',sit=person.mode==='sit',walk=person.mode==='walk'&&!person.wait,cycle=clock*5.2+person.phase,swing=walk?Math.sin(cycle)*.48:dance?Math.sin(clock*2.5+person.phase)*.25:0,y=(person.baseY||0)+(sit?-.25:dance?Math.abs(Math.sin(clock*2+person.phase))*.05:walk?Math.abs(Math.sin(cycle))*.025:0),a=person.angle||0;const pos=(dx,dz)=>[person.x+Math.cos(a)*dx+Math.sin(a)*dz,person.z-Math.sin(a)*dx+Math.cos(a)*dz];matrix(torso,i,person.x,.94+y,person.z,.38,.53,.25,a);matrix(heads,i,person.x,1.4+y,person.z,.15,.19,.15,a);for(let j=0;j<4;j++){const leg=j<2,dx=leg?(j?-.105:.105):(j===2?-.27:.27),q=pos(dx,0);matrix(limbs,i*4+j,q[0],(leg?.43:1.0)+y,q[1],leg?.11:.095,leg?.63:.51,.12,a,sit&&leg?1.3:swing*(j%2?1:-1)*(leg?1:-1))}}
  for(let i=0;i<64;i++){const a=i/8*Math.PI/4,q=((clock*.65+i/64)%1),r=q*3.7;matrix(drops,i,Math.cos(a)*r,.3+Math.sin(q*Math.PI)*3,-9+Math.sin(a)*r,.04,.11,.04)}
  for(const mesh of [body,cab,wheels,fronts,tails,torso,heads,limbs,drops,headPools])mesh.instanceMatrix.needsUpdate=true;tails.instanceColor.needsUpdate=true;
 }
 return {group,update,updateCamera(camera){for(const light of lights){const factor=1-THREE.MathUtils.smoothstep(camera.position.distanceTo(light.position),40,85);light.visible=night&&factor>.001;light.intensity=65*nightLevel*factor}},setEnabled(v){enabled=v},setNight(v){nightLevel=Number(v);headPools.visible=nightLevel>.01;body.material.emissive.set(0xb4a58c);body.material.emissiveIntensity=nightLevel*.08;cab.material.color.set(0x597788);cab.material.emissive.set(0x597788);cab.material.emissiveIntensity=nightLevel*.1;torso.material.emissive.set(0xffffff);torso.material.emissiveIntensity=nightLevel*.035;heads.material.emissive.set(0xffbf8e);heads.material.emissiveIntensity=nightLevel*.1;limbs.material.emissive.set(0xaaa5a0);limbs.material.emissiveIntensity=nightLevel*.045;materials.warm.emissiveIntensity=nightLevel*3;materials.cream.emissiveIntensity=nightLevel*.12;night=nightLevel>.01;waterMat.uniforms.night.value=nightLevel;lanternMat.emissiveIntensity=.04+nightLevel*4;for(const light of lights){light.visible=night;light.intensity=65*nightLevel}for(const glow of glows)glow.visible=night;fronts.visible=night},snapshot(){return {enabled,classification:'CONCEPTUAL_URBAN_LIFE',neons:neons.length,signStyles:venues.map(b=>b.signStyle),projectNeons:0,integratedBusinesses:venues.map(b=>({id:b.id,buildingId:b.buildingId,name:b.name,type:b.type,district:b.district,facade:[b.x,b.z],symbol:b.symbol,classification:b.classification})),nightLevel,neonPowers:animated.map(a=>a.material.color.r),people:people.length,walkers:walkers.length,dancers:patrons.filter(p=>p.mode==='dance').length,venues:venues.length,activeBusinessLights:lights.filter(l=>l.visible).length,lanterns:lanternPositions.length,water:true,traffic:traffic.snapshot()}}};
}
