import * as THREE from 'three';
import {projectViews} from './atlas-project-views.mjs?v=12';
// Fictional night atmosphere, kept separate from all source geometry and project evidence.
export const commercialVenues={
 'mar-salada':{count:84,center:[-21.2,.035,-12.5],size:[11.8,6.8],dj:'DJ NOVA · DJ LUMA',color:0xff49c3},
 'playa-soleil-bora-bora':{count:56,zone:'main-dance-floor',center:[13,.035,-11],size:[13,13],exclude:[[[11.4,-10.3],[14.5,-8.7]]],dj:'DJ SOLA · DJ ORBIT',color:0x4effd7}
};
export function createVenueCrowd({parent,id,origin=new THREE.Vector3(),reduced=false}){
 const venue=commercialVenues[id];if(!venue)return null;
 const group=new THREE.Group();group.name='Fictional venue crowd / presentation only';group.userData.classification='FICTIONAL_VENUE_LIFE';group.position.copy(origin).multiplyScalar(-1);parent.add(group);
 const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,8,6),mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,emissive:0xffffff,emissiveIntensity:.06}),skin=mat.clone();
 const body=new THREE.InstancedMesh(box,mat,venue.count),heads=new THREE.InstancedMesh(sphere,skin,venue.count),limbs=new THREE.InstancedMesh(box,mat,venue.count*4);for(const m of [body,heads,limbs]){m.frustumCulled=false;group.add(m)}
 const clothes=[0xf4d288,0xffa290,0x80dcdb,0xc0a3e8,0xf0ead9,0x91b897],skins=[0xd4a07c,0x8b6149,0xe6ba94,0xb27f59],dummy=new THREE.Object3D(),positions=[],columns=id==='mar-salada'?12:8;
 const cameras=projectViews[id].poses.map(p=>new THREE.Vector2(p.eye[0],p.eye[2])),delta=cameras[1].clone().sub(cameras[0]);
 const candidates=[],rows=Math.ceil(venue.count*2.5/columns);
 for(let j=0;j<columns*rows;j++){const x=venue.center[0]+((j%columns+.5)/columns-.5)*venue.size[0]+Math.sin(j*3.7)*.10,z=venue.center[2]+((Math.floor(j/columns)+.5)/rows-.5)*venue.size[1]+Math.cos(j*2.3)*.08,point=new THREE.Vector2(x,z),q=THREE.MathUtils.clamp(point.clone().sub(cameras[0]).dot(delta)/delta.lengthSq(),0,1),near=cameras[0].clone().addScaledVector(delta,q);const blocked=venue.exclude?.some(([lo,hi])=>x>lo[0]&&x<hi[0]&&z>lo[1]&&z<hi[1]);if(!blocked&&point.distanceTo(near)>1.45)candidates.push([x,venue.center[1],z]);}
 for(let i=0;i<venue.count;i++){positions.push(candidates[Math.min(candidates.length-1,Math.floor(i*candidates.length/venue.count))]);body.setColorAt(i,new THREE.Color(clothes[i%clothes.length]));heads.setColorAt(i,new THREE.Color(skins[i%4]));for(let k=0;k<4;k++)limbs.setColorAt(i*4+k,new THREE.Color(k<2?0x394454:clothes[i%6]));}

 function put(mesh,i,x,y,z,sx,sy,sz,ry=0,rz=0){dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(0,ry,rz);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}
 let enabled=true,last=0,clock=0,visible=false;
 function update(seconds,night=1,built=true){visible=enabled&&built&&night>.3;group.visible=visible;if(!visible)return false;if(enabled&&!reduced)clock+=Math.max(0,Math.min(.2,seconds-last));last=seconds;
  for(let i=0;i<positions.length;i++){const [x,y,z]=positions[i],beat=Math.sin(clock*2.5+i*.71),bounce=Math.abs(beat)*.055,turn=Math.sin(i*1.8)*1.4;put(body,i,x,y+.96+bounce,z,.37,.54,.24,turn,beat*.05);put(heads,i,x,y+1.42+bounce,z,.145,.19,.15,turn);for(let k=0;k<4;k++){const leg=k<2,side=k%2?1:-1,raise=!leg&&i%3===0;put(limbs,i*4+k,x+side*(leg?.1:.25),y+(leg?.43:raise?1.45:1.03)+bounce,z,leg?.105:.09,leg?.64:.53,.11,turn,leg?beat*.08:side*(raise?-.65:.15)+beat*.3)}}
  for(const m of [body,heads,limbs])m.instanceMatrix.needsUpdate=true;return enabled&&!reduced;
 }
 update(0,0,false);return {update,setEnabled(v){enabled=v},snapshot(){return {classification:'FICTIONAL_VENUE_LIFE',id,people:venue.count,zone:venue.zone||'venue-interior',sourceBounds:[['x',0],['y',1],['z',2]].map(([,axis])=>[Math.min(...positions.map(p=>p[axis])),Math.max(...positions.map(p=>p[axis]))]),visible,enabled,clock,dj:venue.dj}},group};
}
export function cityVenueForecourts(config){
 const parts=[],patrons=[],signs=[],events=[];
 for(const p of config.projects){const venue=commercialVenues[p.id];if(!venue)continue;const [cx,cz]=p.plot.center,z=cz-p.plot.size[1]/2+.7,x=cx-8.5;
  const add=(mat,dx,y,dz,w,h,d)=>parts.push({mat,x:x+dx,y,z:z+dz,w,h,d,rotation:0});
  // The entry is plot-side street furniture, never a replacement for source architecture.
  for(const dx of [-2.1,2.1]){add('iron',dx,1.6,0,.12,3.2,.12);add('cyan',dx,2.2,.09,.06,1.5,.06)}add('iron',0,3.1,0,4.35,.24,.25);add('pink',0,3.23,.16,4.2,.07,.06);
  for(let lane=0;lane<2;lane++)for(let k=0;k<6;k++){const dx=-4.9+k*1.35,dz=-1.8-lane*1.65;add('iron',dx,.48,dz,.08,1.05,.08);add('pink',dx+.64,.85,dz,1.28,.045,.045)}
  for(let i=0;i<28;i++){const lane=Math.floor(i/14),slot=i%14;patrons.push({x:x-4.4+slot*.47,z:z-2.3-lane*1.65,angle:lane?Math.PI/2:-Math.PI/2,mode:'queue',phase:i*.8,venueId:p.id,queueIndex:i,queueBaseX:x-4.4+slot*.47,queueBaseZ:z-2.3-lane*1.65});}
  for(let i=0;i<10;i++)patrons.push({x:cx+4+(i%5)*1.15,z:z+1.4+Math.floor(i/5)*1.5,angle:Math.PI*(i%3)/2,mode:'chat',phase:i,venueId:p.id});
  patrons.push({x:x-1.6,z:z+.4,angle:Math.PI,mode:'door',phase:0,venueId:p.id},{x:x+1.6,z:z+.4,angle:Math.PI,mode:'door',phase:1,venueId:p.id});
  signs.push({x,z:z+.12,yaw:0,side:1,width:4.5,name:'ENTRY',subtitle:'DJ SETS · TONIGHT',symbol:'note',color:p.id==='mar-salada'?'#ff49c3':'#4effd7',signStyle:'marquee',projectId:p.id});
  events.push({projectId:p.id,x:cx+10,z:z+.6,title:p.id==='mar-salada'?'CLUB DEL MAR':'PLAYA SOLEIL',dj:venue.dj,color:venue.color,queued:28,doorStaff:2,classification:'FICTIONAL_VENUE_LIFE'});
 }
 return {parts,patrons,signs,events};
}
