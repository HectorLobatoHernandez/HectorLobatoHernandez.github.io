import * as THREE from 'three';
import {ramp} from './atlas-city-state.mjs';

// Presentation lighting. The urban maquette is conceptual, not an engineering simulation.
export function kelvinColor(k=2300){
 const t=Math.max(1000,Math.min(40000,k))/100;
 const r=t<=66?255:329.698727446*Math.pow(t-60,-.1332047592);
 const g=t<=66?99.4708025861*Math.log(t)-161.1195681661:288.1221695283*Math.pow(t-60,-.0755148492);
 const b=t>=66?255:t<=19?0:138.5177312231*Math.log(t-10)-305.0447927307;
 return new THREE.Color().setRGB(...[r,g,b].map(v=>Math.max(0,Math.min(255,v))/255),THREE.SRGBColorSpace);
}
export function createAtmosphere({scene,city,config,reduced}){
 const warm=kelvinColor(2300),group=new THREE.Group(),sky=new THREE.Group();
 group.name='Farolas, señales y rótulos / 2300 K';scene.add(group,sky);
 const metal=new THREE.MeshStandardMaterial({color:0x42484b,metalness:.75,roughness:.44});
 const stone=new THREE.MeshStandardMaterial({color:0xc7c3b8,roughness:1});
 const lampMat=new THREE.MeshStandardMaterial({color:0xffdfac,emissive:warm,emissiveIntensity:3});
 const items=[],dummy=new THREE.Object3D(),unit=new THREE.BoxGeometry(1,1,1);
 const add=(mat,x,y,z,w,h,d)=>items.push({mat,x,y,z,w,h,d});
 const lampPositions=[];
 for(const z of [-56,43])for(let x=-84;x<=84;x+=14)lampPositions.push([x,z]);
 for(const x of [-91,91])for(let z=-45;z<=33;z+=13)lampPositions.push([x,z]);
 for(const z of [-109,106])for(let x=-120;x<=120;x+=24)lampPositions.push([x,z]);
 for(const [x,z] of lampPositions){add(metal,x,2.6,z,.13,6,.13);add(metal,x+.55,5.6,z,1.25,.13,.13);add(lampMat,x+1.05,5.48,z,.6,.15,.6);add(stone,x,-.05,z,.5,.4,.5)}
 // Crossings, kerbs, benches and roof-scale street furniture are instanced.
 for(const x of [-46,0,46])for(const z of [-61,-9,49]){
  for(let i=-2;i<=2;i++)add(stone,x+i*.8,-.32,z+5,.4,.04,2.2);
 }
 for(const z of [-53,40])for(let x=-78;x<=78;x+=24){
  add(metal,x,.35,z,2,.13,.65);add(metal,x,.7,z-.3,2,.65,.09);
  for(const dx of [-.75,.75])add(metal,x+dx,.05,z,.12,.7,.5);
 }
 const signs=[],signMats=[],traffic=[];
 for(const p of config.projects){const [x,z]=p.plot.center,[w,d]=p.plot.size;for(let dx=-w/2+2;dx<w/2;dx+=5)add(lampMat,x+dx,.06,z+d/2-.5,.35,.12,.35)}
 for(const mat of [metal,stone,lampMat]){
  const rows=items.filter(x=>x.mat===mat),mesh=new THREE.InstancedMesh(unit,mat,rows.length);
  rows.forEach((r,i)=>{dummy.position.set(r.x,r.y,r.z);dummy.scale.set(r.w,r.h,r.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.castShadow=mat!==lampMat;mesh.receiveShadow=true;group.add(mesh);
 }
 // Soft pools provide many street fixtures without dozens of expensive shadow maps.
 const cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d'),gradient=cx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,207,134,.8)');gradient.addColorStop(.35,'rgba(255,183,86,.34)');gradient.addColorStop(1,'rgba(255,160,55,0)');cx.fillStyle=gradient;cx.fillRect(0,0,128,128);
 const poolMat=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 const pools=new THREE.InstancedMesh(new THREE.PlaneGeometry(15,15),poolMat,lampPositions.length+config.projects.length);
 [...lampPositions,...config.projects.map(p=>p.plot.center)].forEach(([x,z],i)=>{dummy.position.set(x,-.25,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(i<lampPositions.length?1:3);dummy.updateMatrix();pools.setMatrixAt(i,dummy.matrix)});group.add(pools);
 // A bounded set of real 2300 K lights illuminates adjacent architecture.
 const overviewLights=[[-90,-57],[-44,-57],[45,-57],[90,-57],[-90,43],[-44,43],[45,43],[90,43]],practicals=overviewLights.map(([x,z])=>{const light=new THREE.PointLight(warm,440,40,2);light.position.set(x,5.5,z);scene.add(light);return light});
 let seed=910;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const points=[];for(let i=0;i<1800;i++){const a=rand()*Math.PI*2,y=-1+rand()*2,r=Math.sqrt(1-y*y);points.push(Math.cos(a)*r*1000,y*1000,Math.sin(a)*r*1000)}
 const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xffe9c5,fog:false,size:1.6,sizeAttenuation:true,transparent:true,opacity:.8,depthWrite:false,toneMapped:false}));sky.add(stars);
 // Procedural lunar surface, no downloaded or generated image assets.
 const mc=document.createElement('canvas');mc.width=mc.height=512;const mx=mc.getContext('2d');mx.fillStyle='#d5d0bc';mx.fillRect(0,0,512,512);
 for(let i=0;i<150;i++){const x=rand()*512,y=rand()*512,r=2+rand()*24;mx.beginPath();mx.arc(x,y,r,0,Math.PI*2);mx.fillStyle=`rgba(65,62,57,${.04+rand()*.12})`;mx.fill();mx.strokeStyle='#efe7cf30';mx.lineWidth=2;mx.stroke()}
 const moonMap=new THREE.CanvasTexture(mc);moonMap.colorSpace=THREE.SRGBColorSpace;
 const moon=new THREE.Mesh(new THREE.SphereGeometry(7.5,32,24),new THREE.MeshBasicMaterial({fog:false,map:moonMap,color:0xffedcc,toneMapped:false,transparent:true}));sky.add(moon);
 // Construction scaffolds expose additional assembly detail while the city rises.
 const rods=[];for(const b of city.descriptors.buildings.filter((_,i)=>i%5===0))for(const side of [-1,1]){
  for(let f=0;f<=b.floors;f++)rods.push([b.x,b.height*f/b.floors,b.z+side*(b.depth/2+1),b.width+2,.09,.09]);
  for(const dx of [-b.width/2,0,b.width/2])rods.push([b.x+dx,b.height/2,b.z+side*(b.depth/2+1),.1,b.height,.1]);
 }
 const scaffold=new THREE.InstancedMesh(unit,new THREE.MeshStandardMaterial({color:0xb18141,metalness:.6,roughness:.4}),rods.length);
 rods.forEach(([x,y,z,w,h,d],i)=>{dummy.rotation.set(0,0,0);dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.updateMatrix();scaffold.setMatrixAt(i,dummy.matrix)});scene.add(scaffold);
 let night=true,nightLevel=1,clock=0,flicker=1,moonPosition=[];
 return {updateCamera(camera){const sites=camera.position.y>65?overviewLights:[...lampPositions].sort((a,b)=>(a[0]-camera.position.x)**2+(a[1]-camera.position.z)**2-((b[0]-camera.position.x)**2+(b[1]-camera.position.z)**2)).slice(0,8);sites.forEach(([x,z],i)=>practicals[i].position.set(x+1.05,5.5,z))},setNight(value){nightLevel=Number(value);night=nightLevel>.001;sky.visible=night;pools.visible=night;poolMat.opacity=nightLevel;stars.material.opacity=.8*nightLevel;moon.material.opacity=nightLevel;lampMat.emissiveIntensity=.03+nightLevel*3;for(const light of practicals)light.visible=night;city.setNight(nightLevel)},
  tick(now,p){clock=now/1000;const built=ramp(p,.74,.96);group.visible=p>.74;group.scale.y=Math.max(.001,built);for(const light of practicals)light.intensity=440*built*nightLevel;scaffold.visible=p>.22&&p<.9;
   stars.rotation.y=clock*.002;moon.position.set(-150+Math.sin(clock*.018)*90,62+Math.sin(clock*.009)*12,-170+Math.cos(clock*.018)*30);moon.rotation.y=clock*.012;moonPosition=moon.position.toArray();
   for(let i=0;i<signMats.length;i++){const wave=Math.sin(clock*.82+i*2.7)*Math.sin(clock*.31+i);const f=wave>.57?.57+.14*Math.sin(clock*4+i):1;signMats[i].color.setScalar(night?f:.8);if(i===0)flicker=f}
   for(const t of traffic){const phase=(clock+t.index*4)%18,state=phase<8?'red':phase<16?'green':'amber';t.state=state;for(let j=0;j<3;j++)t.bulbs[j].color.set(j===0?(state==='red'?0xff412b:0x29130e):j===1?(state==='amber'?0xffbc43:0x29200e):(state==='green'?0x75c28b:0x0e271b))}
   return night&&!reduced;
  },snapshot(){return {night,kelvin:2300,warmColor:'#'+warm.getHexString(),streetlights:lampPositions.length,activeStreetLights:practicals.length,streetLightPower:440,stars:1800,moon:moonPosition,signs:signs.length,neonIntensity:flicker,traffic:traffic.map(t=>t.state),scaffolding:scaffold.visible}}};
}
