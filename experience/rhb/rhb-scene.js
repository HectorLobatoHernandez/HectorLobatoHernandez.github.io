export function createRhbWorld(THREE,{detail='world'}={}){
  const root=new THREE.Group();
  root.name='RHB_WORKSHOP_WORLD';
  root.userData.classification='CONCEPTUAL_WORKSHOP_WORLD_FUTURE_DETAIL_PENDING';

  const mats={
    floor:new THREE.MeshStandardMaterial({color:0x4c4b47,roughness:.96}),
    wall:new THREE.MeshStandardMaterial({color:0xa89b84,roughness:.92}),
    brick:new THREE.MeshStandardMaterial({color:0x7b4e3a,roughness:.96}),
    steel:new THREE.MeshStandardMaterial({color:0x363b3d,roughness:.52,metalness:.62}),
    steel2:new THREE.MeshStandardMaterial({color:0x666e70,roughness:.42,metalness:.72}),
    black:new THREE.MeshStandardMaterial({color:0x121414,roughness:.82}),
    wood:new THREE.MeshStandardMaterial({color:0x765036,roughness:.84}),
    orange:new THREE.MeshStandardMaterial({color:0xd98d48,emissive:0x6a2d09,emissiveIntensity:.22,roughness:.68}),
    blue:new THREE.MeshStandardMaterial({color:0x2e4659,roughness:.7}),
    white:new THREE.MeshStandardMaterial({color:0xe6e2d8,roughness:.82}),
    cad:new THREE.MeshBasicMaterial({color:0xd6a467,transparent:true,opacity:.78})
  };

  const box=(w,h,d,mat)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.castShadow=true;m.receiveShadow=true;return m;
  };
  const cyl=(r1,r2,h,mat,seg=12)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);m.castShadow=true;m.receiveShadow=true;return m;
  };

  // Workshop shell / nave
  const floor=box(12,.16,7,mats.floor);floor.position.y=-.08;root.add(floor);
  const rear=box(12,3.7,.18,mats.wall);rear.position.set(0,1.85,-3.4);root.add(rear);
  const left=box(.18,3.7,7,mats.wall);left.position.set(-5.9,1.85,0);root.add(left);
  const right=box(.18,3.7,7,mats.wall);right.position.set(5.9,1.85,0);root.add(right);

  // Saw-tooth industrial roof cues.
  for(let i=0;i<6;i++){
    const beam=box(11.7,.12,.12,mats.steel);beam.position.set(0,3.4,-2.8+i*1.1);root.add(beam);
  }
  for(const x of [-5.1,-2.55,0,2.55,5.1]){
    const truss=box(.12,.12,7,mats.steel);truss.position.set(x,3.32,0);root.add(truss);
  }

  // Front portal + sliding steel doors.
  for(const x of [-4.2,4.2]){
    const pier=box(.38,3.3,.38,mats.brick);pier.position.set(x,1.65,3.25);root.add(pier);
  }
  const lintel=box(8.8,.4,.38,mats.brick);lintel.position.set(0,3.12,3.25);root.add(lintel);
  const doorL=box(2.0,2.6,.12,mats.steel2);doorL.position.set(-3.0,1.3,3.18);root.add(doorL);
  const doorR=box(2.0,2.6,.12,mats.steel2);doorR.position.set(3.0,1.3,3.18);root.add(doorR);

  // Profile racks.
  const rack=new THREE.Group();rack.name='STEEL_PROFILE_RACK';
  for(let y=0;y<4;y++){
    const shelf=box(4.8,.08,.65,mats.steel);shelf.position.set(0,.45+y*.58,0);rack.add(shelf);
    for(let i=0;i<7;i++){
      const profile=box(4.45,.055,.055,i%2?mats.steel2:mats.black);
      profile.position.set(0,.55+y*.58,-.24+i*.08);rack.add(profile);
    }
  }
  for(const x of [-2.25,2.25]){
    const post=box(.1,2.55,.75,mats.steel);post.position.set(x,1.27,0);rack.add(post);
  }
  rack.position.set(-3.0,0,-2.55);root.add(rack);

  // Main fabrication tables.
  const addBench=(x,z,w=2.2)=>{
    const g=new THREE.Group();
    const top=box(w,.12,1.05,mats.steel2);top.position.y=.92;g.add(top);
    for(const sx of [-w*.42,w*.42])for(const sz of [-.4,.4]){
      const leg=box(.09,.88,.09,mats.steel);leg.position.set(sx,.44,sz);g.add(leg);
    }
    g.position.set(x,0,z);root.add(g);return g;
  };
  addBench(-1.1,-1.2,2.5);
  addBench(2.0,-1.2,2.0);
  addBench(.2,1.4,2.8);

  // Cold saw.
  const saw=new THREE.Group();saw.name='COLD_SAW';
  const sawBase=box(1.2,.75,.9,mats.blue);sawBase.position.y=.38;saw.add(sawBase);
  const arm=box(.18,1.25,.18,mats.steel);arm.position.set(-.25,1.05,0);arm.rotation.z=-.55;saw.add(arm);
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.06,28),mats.steel2);disc.rotation.x=Math.PI/2;disc.position.set(.08,1.34,0);saw.add(disc);
  saw.position.set(4.35,0,-2.0);root.add(saw);

  // Drill press.
  const drill=new THREE.Group();drill.name='DRILL_PRESS';
  const drillBase=box(.72,.12,.58,mats.steel);drillBase.position.y=.06;drill.add(drillBase);
  const column=cyl(.07,.08,1.55,mats.steel2,12);column.position.set(-.18,.82,0);drill.add(column);
  const head=box(.7,.35,.45,mats.blue);head.position.set(.02,1.48,0);drill.add(head);
  const drillTable=box(.58,.07,.45,mats.steel2);drillTable.position.set(.05,.82,0);drill.add(drillTable);
  drill.position.set(4.2,0,.7);root.add(drill);

  // Welding station with curtain and animated sparks.
  const weld=new THREE.Group();weld.name='WELDING_BAY';
  const screen=box(1.9,2.0,.045,new THREE.MeshPhysicalMaterial({color:0x7b281d,transparent:true,opacity:.58,roughness:.42}));
  screen.position.set(0,1.15,-.5);weld.add(screen);
  const welder=box(.55,.72,.45,mats.orange);welder.position.set(-.55,.4,.25);weld.add(welder);
  weld.position.set(3.8,0,2.0);root.add(weld);

  const sparksGeom=new THREE.BufferGeometry();
  const sparkCount=42;
  const sparks=new Float32Array(sparkCount*3);
  for(let i=0;i<sparkCount;i++){
    sparks[i*3]=0;sparks[i*3+1]=.8;sparks[i*3+2]=0;
  }
  sparksGeom.setAttribute('position',new THREE.BufferAttribute(sparks,3));
  const sparksPoints=new THREE.Points(sparksGeom,new THREE.PointsMaterial({color:0xffa14d,size:.045,transparent:true,opacity:.9}));
  sparksPoints.position.set(4.0,0,2.0);root.add(sparksPoints);

  // Overhead hoist / crane rail.
  const rail=box(9.5,.16,.2,mats.steel);rail.position.set(0,3.05,.2);root.add(rail);
  const trolley=box(.65,.28,.52,mats.orange);trolley.position.set(1.3,2.92,.2);root.add(trolley);
  const chain=cyl(.022,.022,1.25,mats.black,8);chain.position.set(1.3,2.22,.2);root.add(chain);
  const hook=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,8,14,Math.PI*1.55),mats.steel2);hook.position.set(1.3,1.58,.2);hook.rotation.z=.4;root.add(hook);

  // Sample architectural steel frame under fabrication.
  const frame=new THREE.Group();frame.name='ARCHITECTURAL_STEEL_FRAME';
  for(const x of [-1.2,1.2]){
    const post=box(.12,2.2,.12,mats.steel2);post.position.set(x,1.1,0);frame.add(post);
  }
  const topF=box(2.55,.12,.12,mats.steel2);topF.position.y=2.15;frame.add(topF);
  const diag=box(2.4,.08,.08,mats.steel2);diag.rotation.z=.72;diag.position.y=1.08;frame.add(diag);
  frame.position.set(-3.7,0,1.6);root.add(frame);

  // Heritage sign, intentionally textual until exact supplied logo asset is wired.
  const makeSign=(title,subtitle)=>{
    const cv=document.createElement('canvas');cv.width=1024;cv.height=420;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#f1eee5';ctx.fillRect(0,0,cv.width,cv.height);
    ctx.fillStyle='#555';ctx.font='700 180px Georgia';ctx.textAlign='center';ctx.fillText(title,512,205);
    ctx.font='42px Georgia';ctx.fillText(subtitle,512,300);
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  };
  const heritageSign=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.48),new THREE.MeshBasicMaterial({map:makeSign('RHB','Rufino Hernández Barba'),toneMapped:false}));
  heritageSign.position.set(0,2.0,-3.29);root.add(heritageSign);

  // RHB STUDIO digital layer.
  const digital=new THREE.Group();digital.name='RHB_STUDIO_FUTURE_LAYER';
  const panelMat=new THREE.MeshBasicMaterial({color:0x0b1110,transparent:true,opacity:.82});
  const lineMat=new THREE.LineBasicMaterial({color:0xd6a467,transparent:true,opacity:.7});
  for(let i=0;i<4;i++){
    const panel=box(1.65,1.0,.04,panelMat);panel.position.set(-2.7+i*1.8,2.0,-2.95);digital.add(panel);
    const geo=new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-.65,-.26,.03),new THREE.Vector3(.55,-.26,.03),
      new THREE.Vector3(.55,.22,.03),new THREE.Vector3(-.3,.22,.03)
    ]);
    const l=new THREE.Line(geo,lineMat);l.position.copy(panel.position);digital.add(l);
  }
  digital.visible=false;root.add(digital);

  const hotspots=[
    {id:'heritage',label:'RHB · HERITAGE WORKSHOP'},
    {id:'profiles',label:'STEEL / PROFILE STORAGE'},
    {id:'fabrication',label:'FABRICATION BENCHES'},
    {id:'machines',label:'SAW / DRILL / WELDING'},
    {id:'architecture',label:'ARCHITECTURAL STEELWORK'},
    {id:'studio',label:'RHB STUDIO · FUTURE LAYER'}
  ];

  root.userData.hotspots=hotspots;
  root.userData.digital=digital;
  root.userData.update=(time,progress=0)=>{
    const arr=sparksGeom.attributes.position.array;
    for(let i=0;i<sparkCount;i++){
      const phase=(time*1.8+i*.173)%1;
      arr[i*3]=Math.sin(i*8.2)*phase*.65;
      arr[i*3+1]=.72+phase*.75;
      arr[i*3+2]=Math.cos(i*5.7)*phase*.48;
    }
    sparksGeom.attributes.position.needsUpdate=true;
    sparksPoints.material.opacity=.3+Math.abs(Math.sin(time*3.4))*.65;
    digital.visible=progress>.54;
    if(digital.visible){
      digital.position.y=Math.sin(time*.7)*.025;
      lineMat.opacity=.45+Math.sin(time*1.3)*.2;
    }
  };

  return root;
}
