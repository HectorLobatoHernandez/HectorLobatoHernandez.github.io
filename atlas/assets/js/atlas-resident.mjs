import * as THREE from 'three';
import {residentPose} from './atlas-cinematic-state.mjs';
export function createResident({parent,id='resident',a,b,index=0,scale=1,club=false}){
 const group=new THREE.Group();group.name='Habitante ficticio / rutina de demostración';group.userData.classification='FICTIONAL_RESIDENT';group.scale.setScalar(scale);parent.add(group);
 const shirt=new THREE.MeshStandardMaterial({color:[0x424a42,0x5b4258,0x5d6557,0x526371,0x745341,0x433d52,0x676350,0x424853][index%8],roughness:.88}),skin=new THREE.MeshStandardMaterial({color:[0xbc8964,0xd6a67c,0x9a7156][index%3],roughness:.95}),trousers=new THREE.MeshStandardMaterial({color:0x242b32,roughness:.9});
 const box=new THREE.BoxGeometry(1,1,1),parts=[];
 function piece(material,x,y,z,w,h,d){const mesh=new THREE.Mesh(box,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;group.add(mesh);return mesh}
 const body=piece(shirt,0,.96,0,.4,.55,.26),head=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),skin);head.scale.set(.145,.19,.15);head.position.y=1.42;group.add(head);
 for(const [x,y,h,mat] of [[-.105,.43,.65,trousers],[.105,.43,.65,trousers],[-.27,1,.5,shirt],[.27,1,.5,shirt]])parts.push(piece(mat,x,y,0,.105,h,.12));
 const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from),heading=Math.atan2(delta.x,delta.z);let enabled=true,lastPose;
 function update(seconds=0){const pose=residentPose(seconds,index,club);group.position.lerpVectors(from,to,pose.blend);group.rotation.y=heading+(seconds%38>=26?Math.PI:0);parts.forEach((p,i)=>p.rotation.x=pose.swing*(i%2?1:-1)*(i<2?1:-1));body.rotation.z=pose.walking?0:Math.sin(seconds*.8+index)*.025;head.rotation.y=pose.walking?0:Math.sin(seconds*.35)*.12;lastPose=pose;return pose}
 update(0);
 return {group,update,setVisible(v){group.visible=v},setEnabled(v){enabled=v},get enabled(){return enabled},snapshot(){return {id,classification:'FICTIONAL_RESIDENT',activity:lastPose?.activity,position:group.position.toArray(),visible:group.visible}}};
}
