/**
 * Visual-detail overlay for GAZA virtual farm and in-plant training lab.
 * All geometry and workers are synthetic. No actual layout/measurements.
 */
export function enrichTrainingWorld(THREE, scene, mode, {freeze=false}={}){
 const dynamic=[], colliders=[];
 const mat=(hex,metalness=0,roughness=.82)=>new THREE.MeshStandardMaterial({color:hex,metalness,roughness});
 const metal=mat('#95a9b2',.68,.28),glass=new THREE.MeshPhysicalMaterial({color:'#9dc6da',transparent:true,opacity:.55,roughness:.14}),white=mat('#e9f2f2'),blue=mat('#1d5794'),soil=mat('#93775c'),green=mat('#567b42'),rubber=mat('#262e31');
 function mesh(geometry,material,x,y,z,parent=scene){
  const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
 }
 const block=(x,y,z,w,h,d,m,parent)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
 const pole=(x,y,z,r,h,m,parent)=>mesh(new THREE.CylinderGeometry(r,r,h,8),m,x,y,z,parent);
 const rail=(x,y,z,len,orientation,m=metal)=>block(x,y,z,orientation==='x'?len:.08,.09,orientation==='z'?len:.08,m);
 function fence(x1,z1,x2,z2){const dx=x2-x1,dz=z2-z1,d=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(d/2));for(let i=0;i<=n;i++){const t=i/n;pole(x1+dx*t,.72,z1+dz*t,.045,1.44,metal)}for(const y of [.55,1.1]){const r=block((x1+x2)/2,y,(z1+z2)/2,d,.055,.06,metal);r.rotation.y=-Math.atan2(dz,dx)}}
 function tree(x,z,h=3){pole(x,h*.28,z,.15,h*.56,soil);let c=mesh(new THREE.IcosahedronGeometry(h*.31,1),green,x,h*.72,z);return c}
 function tank(x,z,height=3,radius=.75){const t=mesh(new THREE.CylinderGeometry(radius,radius,height,20),metal,x,height/2,z);mesh(new THREE.CylinderGeometry(radius+.04,radius+.04,.13,20),white,x,height+.06,z);for(let i=0;i<3;i++)pole(x+.35+i*.16,.9,z+radius+.05,.035,1.8,metal);return t}
 function lights(x,z){pole(x,2.4,z,.045,4.8,metal);block(x,4.76,z,.85,.16,.42,white)}
 if(mode==='farm'){
  // Roads, yard and perimeter mimic the old urban parcel as a CONCEPT, not a survey.
  block(0,.21,-11,34,.12,2.2,mat('#545d5c'));
  block(0,.23,11.5,34,.13,2.5,mat('#606a6b'));
  fence(-18,-13,18,-13);fence(-18,13,18,13);fence(-18,-13,-18,13);fence(18,-13,18,13);
  // Paddocks and animal handling: clear walking alleys and fenced rows.
  for(const x of [-16,-8,0,8,16]){fence(x,7,x,12.5)}
  fence(-17,7,17,7);
  for(let i=0;i<5;i++){block(-15+i*7,.24,9.1,1.3,.08,.6,soil)}
  // Stainless milk cooling and transfer stations.
  tank(14,-11,3.5,1.15);tank(11,-11,2.8,.9);tank(8,-11,2.2,.75);
  for(let i=0;i<9;i++)tree(-17+i*4,15,2.5+(i%2)*.5);
  for(let i=0;i<7;i++)tree(-17+i*5,-15,2.1+(i%3)*.6);
  for(const x of [-15,-5,6,15])lights(x,-11.4);
  // A synthetic articulated tractor+tanker follows a short internal lane.
  const vehicle=new THREE.Group();vehicle.position.set(-14,.56,11.5);scene.add(vehicle);
  block(0,.3,0,3.1,.62,1.4,blue,vehicle);
  const cylinder=mesh(new THREE.CylinderGeometry(.58,.58,2.8,18),metal,2.5,.87,0,vehicle);cylinder.rotation.z=Math.PI/2;
  for(const x of [-1.1,.75,2,3.5])for(const z of [-.6,.6]){let w=mesh(new THREE.CylinderGeometry(.29,.29,.16,14),rubber,x,.1,z,vehicle);w.rotation.x=Math.PI/2}
  dynamic.push(t=>{vehicle.position.x=-14+((t*.42)%27);vehicle.rotation.y=0});
 }else{
  // Room-like arrangement for the proposed lab. Transparent panels preserve visibility.
  for(const x of [-17,-9,-1,7,16]){block(x,1.6,-1,.12,3.2,23,glass)}
  for(const z of [-11,1,12])block(0,1.6,z,34,3.2,.12,glass);
  for(let i=0;i<7;i++){
   const x=-13+(i%4)*8.4,z=-7+Math.floor(i/4)*12;
   // Work benches, sinks, monitor and sample racks at each procedure cell.
   block(x-.6,.86,z,3.8,.17,.85,white);
   for(const xx of [-1.8,1.8])block(x+xx,.4,z,.14,.8,.7,metal);
   block(x-1,1.33,z-.3,.8,.68,.12,blue);
   block(x-1,1.32,z-.22,.68,.51,.025,glass);
   for(let k=0;k<4;k++)pole(x+.2+k*.28,1.1,z,.075,.34,mat(['#f3debb','#b8dcec','#c0ebcc','#f3debb'][k]));
   lights(x+1,z+1.6);
  }
  // Microscopy and incubation, dedicated sample cold storage, PPE line.
  for(const x of [-9.6,-7.9,-6.2])block(x,1.45,-10.2,1.25,2.45,.85,metal);
  for(const x of [9.5,11.2,12.9])block(x,1.1,10.4,1.25,1.75,.8,white);
  for(let i=0;i<8;i++)pole(-15+i*.5,1.8,12,.1,.65,white);
 }
 let tick=0;
 function update(dt=.016){if(freeze)return;tick+=Math.min(.05,Math.max(0,dt));for(const fn of dynamic)fn(tick)}
 return {update,staticObjectCount:scene.children.length,provenance:'SIMULATED',mode};
}
