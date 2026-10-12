import {createAnatomy} from '../farm/life/anatomy.mjs';
/** Original procedural details with reused GAZA reference graphic; not manufacturer CAD. */
export function livingAssets(T){
 const anatomy=createAnatomy(T),geometries=new Set(),materials=new Set(),textures=new Set();
 const keepG=g=>(geometries.add(g),g),keepM=m=>(materials.add(m),m);
 const cube=keepG(new T.BoxGeometry(1,1,1)),cylinder=keepG(new T.CylinderGeometry(1,1,1,10)),sphere=keepG(new T.SphereGeometry(1,10,7));
 const mat=(color,extra={})=>keepM(new T.MeshStandardMaterial({color,roughness:.65,...extra}));
 const m={metal:mat(0x9cabad,{metalness:.65,roughness:.32}),dark:mat(0x1c2b34),white:mat(0xe1e5dc),wood:mat(0xb49967),glass:mat(0x183c52,{metalness:.3}),lamp:mat(0xffdeab,{emissive:0xffd29b,emissiveIntensity:0}),screen:mat(0x195b77,{emissive:0x258a99,emissiveIntensity:.4}),red:mat(0xb54c3b,{emissive:0xd6512d,emissiveIntensity:0})};
 function part(parent,geo,material,position,scale=[1,1,1],rotation=[0,0,0]){const o=new T.Mesh(geo,material);o.position.set(...position);o.scale.set(...scale);o.rotation.set(...rotation);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(p,pos,size,material=m.metal)=>part(p,cube,material,pos,size);
 function tube(p,a,b,r=.035,material=m.metal){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=part(p,cylinder,material,av.clone().add(bv).multiplyScalar(.5).toArray(),[r,av.distanceTo(bv),r]);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
 function texture(draw,w=512,h=256){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;textures.add(t);return t;}
 const logo=new T.TextureLoader().load(new URL('../../assets/gaza-logo.svg',import.meta.url).href);logo.colorSpace=T.SRGBColorSpace;textures.add(logo);
 const logoMaterial=keepM(new T.MeshBasicMaterial({map:logo,transparent:true,side:T.DoubleSide}));
 function logoPlate(p,pos,w=1.1,h=.48,yaw=0){return part(p,keepG(new T.PlaneGeometry(w,h)),logoMaterial,pos,[1,1,1],[0,yaw,0]);}
 const poolTexture=texture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,1,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,210,145,0.35)');g.addColorStop(.4,'rgba(255,210,145,0.12)');g.addColorStop(1,'rgba(255,210,145,0)');c.fillStyle=g;c.fillRect(0,0,w,h)},64,64);
 const poolMaterial=keepM(new T.MeshBasicMaterial({map:poolTexture,transparent:true,depthWrite:false,opacity:0,blending:T.AdditiveBlending}));
 const cartonLabel=texture((c,w,h)=>{c.fillStyle='#f1f0df';c.fillRect(0,0,w,h);c.fillStyle='#204985';c.font='bold 100px Georgia';c.fillText('gaza',30,120);c.fillStyle='#729447';c.fillRect(25,140,w-50,14);c.fillStyle='#264355';c.font='28px system-ui';c.fillText('LECHE · ENVASE SIM',25,202);c.font='18px monospace';c.fillText('LOTE / TRAZABILIDAD',25,234)});
 const labelMat=keepM(new T.MeshStandardMaterial({map:cartonLabel,roughness:.85}));
 function worker(old,role,profile='farm'){
  const hidden=[...old.children],g=new T.Group();g.name='LIVING_UNIFORM_'+role;g.userData={role,provenance:'SIMULATED_EMPLOYEE'};old.add(g);const a=anatomy.human(profile),arms=[];
  part(g,a.body,anatomy.material,[0,0,0]);part(g,a.head,anatomy.material,[0,1.71,0]);
  for(const sign of [-1,1]){const upper=new T.Group();upper.position.set(sign*.27,1.46,0);g.add(upper);part(upper,a.upperArm,anatomy.material,[0,0,0]);const lower=new T.Group();lower.position.y=-.29;upper.add(lower);part(lower,a.lowerArm,anatomy.material,[0,0,0]);arms.push({upper,lower,sign});part(g,a.thigh,anatomy.material,[sign*.12,.92,0]);part(g,a.shin,anatomy.material,[sign*.12,.48,0]);part(g,a.boot,anatomy.material,[sign*.12,.08,0]);}
  logoPlate(g,[.09,1.4,.18],.15,.075);hidden.forEach(o=>o.visible=false);
  return {old,g,hidden,arms,role};
 }
 function transport(v){const g=new T.Group();g.name='LIVE_TRANSPORT_DETAILS';v.tractor.add(g);box(g,[3.01,.65,0],[.18,.19,2.55]);box(g,[3.02,1.45,0],[.06,.6,1.1],m.dark);
  for(let j=0;j<5;j++)box(g,[3.06,1.2+j*.09,0],[.025,.03,1],m.metal);
  for(const side of [-1,1]){box(g,[3.04,1,side*.87],[.05,.25,.44],m.lamp);box(g,[1.9,2.62,side*1.48],[.15,.4,.23],m.dark);tube(g,[2.05,2.6,side*1.2],[1.9,2.7,side*1.46]);box(g,[1,.65,side*1.27],[1,.12,.33]);logoPlate(g,[1.22,1.64,side*1.21],1.2,.55,side>0?0:Math.PI);box(v.load,[-4.56,1,side*.9],[.07,.18,.32],m.red);}
  const rear=new T.Group();rear.name='TRAILER_ACCESS_DETAILS';v.load.add(rear);for(const side of [-1,1]){tube(rear,[-4.54,1,side*1.1],[-4.54,3.2,side*1.1]);box(rear,[-4.6,.55,side*.6],[.2,.18,.5]);}
  if(v.id==='SIM-TRAILER-1'){for(const side of [-1,1]){box(v.load,[0,.82,side*1.34],[8.8,.12,.07]);box(v.load,[0,3.5,side*1.34],[8.8,.10,.07]);}board(v.load,'EXPEDICIÓN / LOTE SIM',[-4.56,2.1,0],1.6).rotation.y=-Math.PI/2;}
  return {group:g,rear};
 }
 function cargo(parent,positions){
  const g=new T.Group();g.name='GAZA_CARTON_GLYPHS';parent.add(g);const matrix=new T.Object3D(),pallet=new T.InstancedMesh(cube,m.wood,positions.length),body=new T.InstancedMesh(cube,m.white,positions.length*24),caps=new T.InstancedMesh(cylinder,m.white,positions.length*24),labels=new T.InstancedMesh(keepG(new T.PlaneGeometry(.12,.18)),labelMat,positions.length*24);
  const layer=new T.Group();g.add(layer);layer.add(pallet,body,caps,labels);let b=0;
  positions.forEach((p,i)=>{matrix.position.set(...p);matrix.scale.set(1.1,.17,1.12);matrix.rotation.set(0,0,0);matrix.updateMatrix();pallet.setMatrixAt(i,matrix.matrix);
   for(let row=0;row<3;row++)for(let col=0;col<4;col++)for(let y=0;y<2;y++){
    const x=p[0]-.37+col*.245,z=p[2]-.3+row*.3,yy=p[1]+.24+y*.35;
    matrix.position.set(x,yy,z);matrix.scale.set(.20,.30,.23);matrix.rotation.set(0,0,0);matrix.updateMatrix();body.setMatrixAt(b,matrix.matrix);
    matrix.position.set(x+.04,yy+.165,z);matrix.scale.set(.025,.03,.025);matrix.updateMatrix();caps.setMatrixAt(b,matrix.matrix);
    matrix.position.set(x,yy,z+.116);matrix.scale.set(1,1,1);matrix.updateMatrix();labels.setMatrixAt(b,matrix.matrix);b++;
   }
  });for(const o of [pallet,body,caps,labels]){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;o.instanceMatrix.needsUpdate=true;}
  return {g,setCount(n){const c=Math.max(0,Math.min(positions.length,n));pallet.count=c;body.count=c*24;caps.count=c*24;labels.count=c*24;g.visible=c>0},dispose(){for(const o of [pallet,body,caps,labels])o.dispose();g.removeFromParent();}};
 }
 function board(parent,title,position,width=2){const tx=texture((c,w,h)=>{c.fillStyle='#102c37';c.fillRect(0,0,w,h);c.fillStyle='#e0e8d9';c.font='bold 35px system-ui';c.fillText(title,22,64,w-44);c.fillStyle='#74bba2';c.fillRect(22,83,w-44,4);c.font='25px system-ui';c.fillText('OPERACIÓN / PERSONAL SIM',22,140,w-44);c.font='19px monospace';c.fillText('Inspección en GAZA OPS',22,210,w-44)});return part(parent,keepG(new T.PlaneGeometry(width,width/2)),keepM(new T.MeshBasicMaterial({map:tx,side:T.DoubleSide})),position);}
 return {m,cube,cylinder,sphere,box,tube,part,worker,transport,cargo,board,logoPlate,poolMaterial,keepG,keepM,dispose(){anatomy.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose())}};
}
