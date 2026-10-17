import * as THREE from 'three';

/* ATLAS AI District V2: procedural urban detail and structural campus.
   Conceptual visualization; never interpreted as GAZA as-built plant. */
export function createDistrictV2({scene, camera, controls, projects, structures}) {
  const root = new THREE.Group();
  root.name = 'ATLAS AI / FINANCIAL DISTRICT V2';
  scene.add(root);
  const steel = new THREE.MeshStandardMaterial({color:0x8193a8,metalness:.66,roughness:.34});
  const glass = new THREE.MeshStandardMaterial({color:0x19374b,metalness:.58,roughness:.19,transparent:true,opacity:.83});
  const gold = new THREE.MeshBasicMaterial({color:0xffb16b});
  const cyan = new THREE.MeshBasicMaterial({color:0x50c4ff});
  const green = new THREE.MeshBasicMaterial({color:0x71e9aa});
  const violet = new THREE.MeshBasicMaterial({color:0xab8fff});
  const ground = new THREE.MeshStandardMaterial({color:0x152437,roughness:.93});
  const sharedBox = new THREE.BoxGeometry(1,1,1);
  const dummy = new THREE.Object3D();
  const plotLayers = [];
  const moving = [];
  const cranes = [];
  const boards = [];
  const groundGroup = new THREE.Group(), architecture = new THREE.Group();
  root.add(groundGroup,architecture);
  let night = true, quality = 'high', mode = 'city', tour = false, tourStart = 0;
  function cube(parent,x,y,z,w,h,d,material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    m.position.set(x,y,z);parent.add(m);return m;
  }
  function batch(name,points,material) {
    const m=new THREE.InstancedMesh(sharedBox,material,points.length);
    m.name=name;
    points.forEach((q,i)=>{dummy.position.set(q[0],q[1],q[2]);dummy.scale.set(q[3],q[4],q[5]);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)});
    m.instanceMatrix.needsUpdate=true;m.frustumCulled=false;root.add(m);return m;
  }
  let seed=8461;
  const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const windows=[],windowsBlue=[],pavement=[];
  // The adjacent skyline is deterministic, allowing repeatable camera tours.
  for(let x=-140;x<=140;x+=17)for(let z=-112;z<=112;z+=20){
    if(Math.abs(x)<112&&Math.abs(z)<90)continue;
    const w=8+rand()*5,d=9+rand()*4,h=18+rand()*96;
    cube(architecture,x,h/2,z,w,h,d,glass);
    for(let f=1;f<h/5;f++){
      const y=f*5;
      for(let col=-w/2+1.1;col<w/2-1;col+=2.3)
        if(rand()>.28)(rand()>.25?windows:windowsBlue).push([x+col,y-2,z+d/2+.12,1.15,1.65,.08]);
      pavement.push([x,y,z+d/2+.09,w,.09,.14]);
    }
  }
  const warmWindows=batch('warm office windows',windows,gold);
  const coldWindows=batch('cool office windows',windowsBlue,cyan);
  batch('floor facade trims',pavement,steel);
  // Dynamic waterfront / transport infrastructure.
  const water=new THREE.MeshStandardMaterial({color:0x0b263d,roughness:.28,metalness:.44,emissive:0x0d2541,emissiveIntensity:.25});
  cube(groundGroup,-126,-.11,0,22,.2,208,water);
  cube(groundGroup,126,-.11,0,22,.2,208,water);
  for(const z of [-58,18,73]){
    cube(groundGroup,-126,2,z,30,.6,7,steel);
    cube(groundGroup,126,2,z,30,.6,7,steel);
  }
  const ripples=[];
  for(let i=0;i<90;i++){
    const x=i%2?-126:126,z=-100+rand()*200;
    const o=cube(groundGroup,x+(rand()-.5)*18,.12,z,.12,.012,.5+rand()*2,i%3?cyan:gold);
    ripples.push({o,z,a:rand()*6.28});
  }
  // Per-plot architecture, assembled by floor and by subsystem.
  for(const p of projects) {
    const g = new THREE.Group(), struct=new THREE.Group(),sys=new THREE.Group(),site=new THREE.Group();
    root.add(g);g.add(struct,sys,site);
    const [x,z]=[p.x,p.z],w=p.w,d=p.d,h=p.h;
    cube(site,x,0,z,w+2,.45,d+2,ground);
    const beams=[],heightStep=p.id==='logistica'?5:7;
    const floors=Math.floor(h/heightStep);
    for(let f=0;f<floors;f++){
      const y=f*heightStep+1;
      const m=cube(struct,x,y,z,w-2,.32,d-2,steel);
      beams.push({mesh:m,y,order:f/floors});
      for(const sx of [-1,1])for(const sz of [-1,1]){
        const cx=x+sx*(w/2-2),cz=z+sz*(d/2-2);
        const col=cube(struct,cx,y+heightStep/2,cz,.48,heightStep,.48,steel);
        beams.push({mesh:col,y:y+heightStep/2,order:f/floors});
      }
    }
    // Vertical service nucleus and technical risers.
    const core=cube(struct,x,h/2,z,Math.min(w*.22,7),h,Math.min(d*.22,7),steel);
    beams.push({mesh:core,y:h/2,order:.16});
    for(const sx of [-1,1]){
      const m=cube(sys,x+sx*w*.24,h*.45,z+d/2+1,.18,h*.76,.18,p.id==='granja'?green:cyan);
      m.material=m.material.clone();m.material.transparent=true;sys.add(m);
    }
    if(p.id==='planta'){
      // ASRS nine-level racks with aisles, conveyor lanes and a gantry crane.
      for(let tier=0;tier<9;tier++)for(const aisle of [-1,1]){
        const shelf=cube(struct,x+aisle*8,3+tier*3.2,z,9,.24,22,steel);
        beams.push({mesh:shelf,y:shelf.position.y,order:tier/9});
      }
      cube(sys,x,3,z,2,2,25,gold);
    }else if(p.id==='laboratorio'){
      for(let f=1;f<6;f++){
        const capsule=new THREE.Mesh(new THREE.SphereGeometry(1.4,10,8),new THREE.MeshBasicMaterial({color:0x5fd1ff}));
        capsule.position.set(x-8+f*2.6,f*9,z+d/2+1.2);sys.add(capsule);
      }
    }else if(p.id==='granja'){
      for(let level=0;level<7;level++)
        for(const sx of [-1,1])cube(sys,x+sx*9,5+level*5,z,9,.45,16,green);
    }else if(p.id==='logistica'){
      for(let dock=0;dock<6;dock++){
        cube(struct,x-w/2+4+dock*5,3,z+d/2,4.3,5,.6,steel);
        cube(sys,x-w/2+4+dock*5,1,z+d/2+5,5,1.7,2.3,dock%2?gold:cyan);
      }
    }else if(p.id==='gaza'){
      for(let f=1;f<12;f++)cube(sys,x,5+f*7,z+d/2+1,w*.7,.16,.22,f%3?gold:cyan);
    }else{
      // Under-construction buildings: fixed local crane pivots.
      const crane=new THREE.Group();crane.position.set(x+w/2+3,0,z-d/2);
      cube(crane,0,h*.48,0,.8,h*.96,.8,steel);
      const jib=new THREE.Group();jib.position.y=h*.92;crane.add(jib);
      cube(jib,9,0,0,27,.44,.44,gold);
      cube(jib,21,-4,0,.2,8,.2,steel);
      root.add(crane);cranes.push({crane,jib,p});
    }
    plotLayers.push({p,g,struct,sys,site,beams,core});
  }
  // Animated advertising screens on the financial perimeter.
  function ad(x,y,z,label,angle=0) {
    const c=document.createElement('canvas');c.width=512;c.height=256;
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(16,9),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
    m.position.set(x,y,z);m.rotation.y=angle;root.add(m);
    boards.push({m,c,texture,label});
  }
  ad(-136,45,-90,'ATLAS / INDUSTRIAL AI',Math.PI/2);
  ad(136,58,-68,'INTELLIGENT OPERATIONS',-Math.PI/2);
  ad(136,49,76,'GAZA OPS / DIGITAL TWIN',-Math.PI/2);
  let lastBoard=-999;
  function updateBoards(t){
    if(t-lastBoard<400)return;lastBoard=t;
    for(const [i,b] of boards.entries()){
      const q=b.c.getContext('2d');q.fillStyle='#061221';q.fillRect(0,0,512,256);
      q.strokeStyle=i%2?'#55bfff':'#ffb66f';q.lineWidth=5;q.strokeRect(10,10,492,236);
      q.fillStyle='#fff';q.font='bold 30px Arial';q.textAlign='center';q.fillText(b.label,256,72,485);
      q.beginPath();for(let x=0;x<52;x++){
        const y=160-30*Math.sin(x*.2+t*.001)-14*Math.cos(x*.57+t*.0005);
        if(x===0)q.moveTo(22,y);else q.lineTo(22+x*9,y);
      }
      q.stroke();q.fillStyle='#eebc83';q.font='14px monospace';q.fillText('ATLAS AI / SIMULATED TELEMETRY',256,222);b.texture.needsUpdate=true;
    }
  }
  function setMode(next){
    mode=next;
    for(const {p,struct,sys} of plotLayers){
      struct.visible=next!=='city';
      sys.visible=next==='systems';
    }
    for(const obj of structures){
      if(!obj.facade)continue;
      if(!obj.facade.userData.v2Material) {
        obj.facade.material=obj.facade.material.clone();
        obj.facade.userData.v2Material=true;
      }
      obj.facade.material.transparent=next!=='city';
      obj.facade.material.opacity=next==='city'?1:next==='structure'?.13:.18;
      obj.facade.material.depthWrite=next==='city';
    }
  }
  function startTour(t){tour=true;tourStart=t;}
  function stopTour(){tour=false;}
  const poses=[
    [[152,144,183],[0,24,0]],
    [[100,78,44],[0,40,-39]],
    [[-94,60,62],[-58,19,0]],
    [[64,65,86],[33,18,4]],
    [[152,144,183],[0,24,0]]
  ];
  function update(t,build) {
    architecture.visible=build>.55;groundGroup.visible=build>.12;
    warmWindows.visible=coldWindows.visible=night&&quality!=='low'&&build>.72;
    for(const item of plotLayers) {
      item.struct.visible=mode!=='city'&&build>.2;
      item.sys.visible=mode==='systems'&&build>.73;
      for(const b of item.beams) {
        const q=Math.max(0,Math.min(1,(build-.20-b.order*.18)/.46));
        const eased=q*q*(3-2*q);
        b.mesh.visible=eased>.02;
        b.mesh.position.y=b.y+30*(1-eased);
        b.mesh.scale.y=Math.max(.002,eased);
      }
    }
    for(const {crane,jib,p} of cranes){
      crane.visible=build>.26 && (build<.93||!p.ready);
      jib.rotation.y=t*.0001;
    }
    for(const {o,z,a} of ripples) {
      o.visible=build>.84&&night&&quality!=='low';
      if(o.visible)o.position.z=z+Math.sin(t*.001+a)*.45;
    }
    boards.forEach(b=>b.m.visible=build>.84&&night);
    if(build>.84)updateBoards(t);
    if(tour){
      const q=((t-tourStart)%42000)/42000*(poses.length-1);
      const index=Math.min(poses.length-2,Math.floor(q)),fraction=q-index;
      const ease=fraction*fraction*(3-2*fraction);
      const p0=poses[index],p1=poses[index+1];
      const nextPos=new THREE.Vector3(...p0[0]).lerp(new THREE.Vector3(...p1[0]),ease);
      const nextTarget=new THREE.Vector3(...p0[1]).lerp(new THREE.Vector3(...p1[1]),ease);
      camera.position.lerp(nextPos,.08);controls.target.lerp(nextTarget,.08);
    }
  }
  function setNight(next){night=next;}
  function setQuality(next){quality=next;}
  setMode('city');
  return {update,setMode,setNight,setQuality,startTour,stopTour,get touring(){return tour},stats:{windows:windows.length+windowsBlue.length,structures:plotLayers.length}};
}
