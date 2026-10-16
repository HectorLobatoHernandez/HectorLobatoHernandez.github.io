import * as THREE from 'three';
import {cityDescriptors,componentProgress,ramp} from './atlas-city-state.mjs';
export function createCity(config,dirty){
 const group=new THREE.Group();group.name='Ciudad conceptual / navegación';
 const materials={stone:new THREE.MeshStandardMaterial({color:0xd4d4ca,roughness:1}),concrete:new THREE.MeshStandardMaterial({color:0xdddccf,roughness:.9}),ivory:new THREE.MeshStandardMaterial({color:0xf5f2e9,roughness:.8}),glass:new THREE.MeshStandardMaterial({color:0x536574,metalness:.3,roughness:.3}),metal:new THREE.MeshStandardMaterial({color:0x656d6d,metalness:.65,roughness:.45}),roof:new THREE.MeshStandardMaterial({color:0xece8df,roughness:.9})};
 const groundMat=new THREE.MeshStandardMaterial({color:0xe3e0d5,roughness:1});
 const ground=new THREE.Mesh(new THREE.BoxGeometry(316,1.4,272),groundMat);ground.position.y=-1.4;ground.receiveShadow=true;group.add(ground);
 const trace=new THREE.GridHelper(280,56,0xbabfb8,0xcccec6);trace.position.y=-.68;trace.material.transparent=true;trace.material.opacity=.07;trace.visible=false;group.add(trace);
 Object.assign(materials,{ochre:new THREE.MeshStandardMaterial({color:0xc7a97b,roughness:.95}),brick:new THREE.MeshStandardMaterial({color:0x66524a,roughness:.93}),wood:new THREE.MeshStandardMaterial({color:0x382b25,roughness:.9}),tile:new THREE.MeshStandardMaterial({color:0x9b4b32,roughness:.88}),charcoal:new THREE.MeshStandardMaterial({color:0x333b43,roughness:.75}),awning:new THREE.MeshStandardMaterial({color:0x476655,roughness:.9}),window:new THREE.MeshStandardMaterial({color:0x4a3526,emissive:0xffaf63,emissiveIntensity:.8,roughness:.3}),coolglass:new THREE.MeshStandardMaterial({color:0x314353,metalness:.45,roughness:.22,emissive:0x8cbdd3,emissiveIntensity:.35})});
 // Small repeating masonry/plaster maps keep the street views legible without external assets.
 const masonry=document.createElement('canvas');masonry.width=masonry.height=256;const mc=masonry.getContext('2d');mc.fillStyle='#736057';mc.fillRect(0,0,256,256);
 for(let row=0;row<8;row++)for(let col=-1;col<5;col++){const x=col*64+(row%2)*32,y=row*32;mc.fillStyle=`rgb(${108+(row*13+col*7)%22},${85+(row*9+col*3)%16},${74+(row*7+col*5)%14})`;mc.fillRect(x+1,y+1,62,30);mc.fillStyle='#4a433d';mc.fillRect(x,y,64,1)}
 const brickMap=new THREE.CanvasTexture(masonry);brickMap.colorSpace=THREE.SRGBColorSpace;brickMap.wrapS=brickMap.wrapT=THREE.RepeatWrapping;brickMap.repeat.set(3,2);materials.brick.map=brickMap;materials.brick.color.set(0xffffff);
 const descriptors=cityDescriptors(),batches=[];const geometry=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 for(const phase of ['foundation','structure','envelope'])for(const [name,mat] of Object.entries(materials)){
  const pieces=descriptors.pieces.filter(p=>p.phase===phase&&p.material===name);if(!pieces.length)continue;
  const mesh=new THREE.InstancedMesh(geometry,mat,pieces.length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.name=phase+' / '+name;group.add(mesh);batches.push({mesh,pieces});
 }
 const site=new THREE.Group();group.add(site);
 const roadMat=new THREE.MeshStandardMaterial({color:0xbfc5bf,roughness:.82,metalness:.04}),pathMat=new THREE.MeshStandardMaterial({color:0xf1eee5,roughness:1});
 const box=(w,h,d,x,y,z,mat,parent=site)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o};
 for(const x of [-97,-46,0,46,97])box(x===0?8:5,.18,226,x,-.48,0,roadMat);
 for(const x of [-133,133])box(5,.18,226,x,-.48,0,roadMat);
 for(const z of [-113,110])box(270,.19,5,0,-.46,z,roadMat);
 for(const z of [-61,-9,49])box(270,.19,z===-9?8:5,0,-.46,z,roadMat);
 for(const z of [-56,-17,0,41])box(211,.12,1.5,0,-.31,z,pathMat);
 for(const x of [-91,-40,-6,6,40,91])box(1.1,.12,159,x,-.30,-2,pathMat);
 const paintPositions=[];for(const x of [-133,-97,-46,0,46,97,133])for(let z=-101;z<104;z+=9)if(![-61,-9,49].some(j=>Math.abs(j-z)<7))paintPositions.push([x,z,.12,3]);
 for(const z of [-113,-61,-9,49,110])for(let x=-123;x<125;x+=9)if(![-133,-97,-46,0,46,97,133].some(j=>Math.abs(j-x)<7))paintPositions.push([x,z,3,.12]);
 const paint=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:0xe5dbb9,roughness:.9,emissive:0xdbc69e,emissiveIntensity:.1}),paintPositions.length);paintPositions.forEach(([x,z,w,d],i)=>{dummy.position.set(x,-.34,z);dummy.scale.set(w,.018,d);dummy.updateMatrix();paint.setMatrixAt(i,dummy.matrix)});site.add(paint);
 const circle=new THREE.Mesh(new THREE.CylinderGeometry(11,11,.22,64),pathMat);circle.position.set(0,-.28,-9);site.add(circle);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(8.5,.055,4,64),new THREE.MeshBasicMaterial({color:0x9ca89e}));ring.rotation.x=Math.PI/2;ring.position.set(0,-.14,-9);site.add(ring);
 const park=new THREE.Group();group.add(park);
 const greens=new THREE.MeshStandardMaterial({color:0x9cae99,roughness:1}),trunks=new THREE.MeshStandardMaterial({color:0x9b998a,roughness:1});
 const positions=[];for(let x=-84;x<=84;x+=12)for(const z of [-54,42])positions.push([x,z]);for(const x of [-91,91])for(let z=-45;z<=33;z+=13)positions.push([x,z]);
 const trunkMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.2,.25,2,6),trunks,positions.length),canopyMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1.8,8,5),greens,positions.length);trunkMesh.castShadow=true;canopyMesh.castShadow=true;
 positions.forEach(([x,z],i)=>{dummy.position.set(x,.6,z);dummy.scale.set(1,1,1);dummy.updateMatrix();trunkMesh.setMatrixAt(i,dummy.matrix);dummy.position.y=2.7;dummy.scale.set(1,1.15,1);dummy.updateMatrix();canopyMesh.setMatrixAt(i,dummy.matrix)});park.add(trunkMesh,canopyMesh);
 const plots=new THREE.Group();group.add(plots);const pickables=[],anchors=new Map(),outlines=new Map(),planMaterials=[];
 const textureLoader=new THREE.TextureLoader();
 for(const project of config.projects){
  const [x,z]=project.plot.center,[w,d]=project.plot.size,ready=project.status==='ready';
  const slab=box(w+.7,.22,d+.7,x,-.18,z,new THREE.MeshStandardMaterial({color:ready?0xd7e0e4:0xd8d8ce,roughness:1}),plots);slab.userData.project=project.id;pickables.push(slab);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:ready?0xffffff:0xdfe0d8,side:THREE.DoubleSide}));plane.rotation.x=-Math.PI/2;plane.position.set(x,-.055,z);planMaterials.push(plane.material);plane.userData.project=project.id;plots.add(plane);pickables.push(plane);
  if(ready){const map=textureLoader.load(project.plan,()=>dirty());map.colorSpace=THREE.SRGBColorSpace;plane.material.map=map;plane.material.needsUpdate=true}
  else{const lines=new THREE.GridHelper(w,8,0xbac1b9,0xc8cdc5);lines.scale.z=d/w;lines.position.set(x,-.03,z);plots.add(lines)}
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w+.9,.35,d+.9)),new THREE.LineBasicMaterial({color:ready?0x2256a1:0xa6afa5,transparent:true,opacity:ready?1:.6}));edges.position.set(x,.04,z);plots.add(edges);outlines.set(project.id,edges);
  anchors.set(project.id,new THREE.Vector3(x,1.1,z));
  // Corner markers are navigation graphics; they are not project structures.
  if(ready)for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])box(.18,1.5,.18,x+dx,.68,z+dz,new THREE.MeshBasicMaterial({color:0x2256a1}),plots);
 }
 let previous=-1;
 return {group,pickables,anchors,buildings:descriptors.buildings.length,descriptors,
  setNight(value){const n=Number(value);greens.emissive.set(0x314329);greens.emissiveIntensity=n*.12;trunks.emissive.set(0x665044);trunks.emissiveIntensity=n*.06;materials.window.emissiveIntensity=n*.65;materials.coolglass.emissiveIntensity=n*.25;materials.glass.emissive.set(0xffaa57);materials.glass.emissiveIntensity=n*.025;roadMat.color.copy(new THREE.Color(0xbfc5bf).lerp(new THREE.Color(0x58616b),n));groundMat.color.copy(new THREE.Color(0x879a75).lerp(new THREE.Color(0x3b4c40),n));for(const mat of planMaterials)mat.color.setScalar(1-n*.74)},
  select(id){for(const [key,o] of outlines){o.material.color.set(key===id?0x2256a1:0xa6afa5);o.material.opacity=key===id?1:.55}dirty()},
  update(p){if(Math.abs(p-previous)<.00001)return;previous=p;site.scale.y=Math.max(.001,ramp(p,0,.16));site.visible=p>.005;park.scale.setScalar(Math.max(.001,ramp(p,.78,1)));park.visible=p>.78;
   for(const {mesh,pieces} of batches){for(let i=0;i<pieces.length;i++){
    const piece=pieces[i],q=componentProgress(p,piece.phase,piece.order),[x,y,z]=piece.position,[w,h,d]=piece.size;
    dummy.position.set(x,piece.phase==='structure'&&h<.5?y*q:y-h/2+h*q/2,z);dummy.rotation.set(...(piece.rotation||[0,0,0]));dummy.scale.set(w,Math.max(.0001,h*q),d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   }mesh.instanceMatrix.needsUpdate=true;mesh.visible=p>Math.min(...pieces.map(x=>x.phase==='foundation'?.08:x.phase==='structure'?.2:.49))}
  }
 };
}
