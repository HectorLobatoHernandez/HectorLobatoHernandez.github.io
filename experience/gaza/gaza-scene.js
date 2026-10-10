export function createGazaWorld(THREE,{detail='world'}={}){
  const root=new THREE.Group();
  root.name='GAZA_ZAMORA_WORLD';
  root.userData.classification='CONCEPTUAL_SPATIAL_WORLD_NOT_GEOREFERENCED';

  const mats={
    ground:new THREE.MeshStandardMaterial({color:0x496337,roughness:.96}),
    field:new THREE.MeshStandardMaterial({color:0x668044,roughness:.96}),
    field2:new THREE.MeshStandardMaterial({color:0x7a8748,roughness:.96}),
    soil:new THREE.MeshStandardMaterial({color:0x51402b,roughness:1}),
    stone:new THREE.MeshStandardMaterial({color:0xa99879,roughness:.94}),
    stoneDark:new THREE.MeshStandardMaterial({color:0x786b57,roughness:.96}),
    plaster:new THREE.MeshStandardMaterial({color:0xc7b996,roughness:.92}),
    roof:new THREE.MeshStandardMaterial({color:0x6f3b28,roughness:.9}),
    roofDark:new THREE.MeshStandardMaterial({color:0x4d2d24,roughness:.94}),
    water:new THREE.MeshPhysicalMaterial({color:0x315d62,roughness:.2,metalness:.05,transmission:.15,transparent:true,opacity:.82}),
    factory:new THREE.MeshStandardMaterial({color:0xc3c7c5,roughness:.58,metalness:.18}),
    factoryDark:new THREE.MeshStandardMaterial({color:0x505a58,roughness:.55,metalness:.22}),
    glass:new THREE.MeshPhysicalMaterial({color:0x5a8e86,transparent:true,opacity:.48,roughness:.18,metalness:.05}),
    green:new THREE.MeshStandardMaterial({color:0x315b30,roughness:.92}),
    green2:new THREE.MeshStandardMaterial({color:0x4f7137,roughness:.94}),
    bark:new THREE.MeshStandardMaterial({color:0x4a3826,roughness:1}),
    black:new THREE.MeshStandardMaterial({color:0x171918,roughness:.78}),
    white:new THREE.MeshStandardMaterial({color:0xe5e0cf,roughness:.86}),
    metal:new THREE.MeshStandardMaterial({color:0x87908e,roughness:.4,metalness:.72}),
    accent:new THREE.MeshStandardMaterial({color:0x5f7d35,emissive:0x203412,emissiveIntensity:.18,roughness:.7}),
    worker:new THREE.MeshStandardMaterial({color:0x294a63,roughness:.9}),
    skin:new THREE.MeshStandardMaterial({color:0xb58462,roughness:.95})
  };

  const box=(w,h,d,mat=mats.stone)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.castShadow=true;m.receiveShadow=true;return m;
  };
  const cyl=(rt,rb,h,mat=mats.stone,seg=12)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);
    m.castShadow=true;m.receiveShadow=true;return m;
  };

  // Base landscape
  const ground=box(30,.18,22,mats.ground);
  ground.position.y=-.12;
  root.add(ground);

  const fieldA=box(10,.035,7,mats.field);fieldA.position.set(-9,.01,5.6);root.add(fieldA);
  const fieldB=box(9,.035,7,mats.field2);fieldB.position.set(10,.012,5.7);root.add(fieldB);
  const pasture=box(10,.04,6.6,mats.field);pasture.position.set(6.7,.018,-6.8);root.add(pasture);

  // Duero — broad river through the middle
  const river=new THREE.Mesh(new THREE.PlaneGeometry(29,3.2),mats.water);
  river.rotation.x=-Math.PI/2;
  river.rotation.z=-.05;
  river.position.set(0,.045,.25);
  root.add(river);

  // Stone bridge
  const bridge=new THREE.Group();
  const deck=box(5.7,.18,.8,mats.stoneDark);deck.position.y=.55;bridge.add(deck);
  for(let i=-2;i<=2;i++){
    const pier=box(.28,.62,.78,mats.stone);pier.position.set(i*1.12,.25,0);bridge.add(pier);
  }
  bridge.position.set(-2.2,0,.15);
  root.add(bridge);

  // Walled Zamora on the left bank
  const city=new THREE.Group();city.name='HISTORIC_ZAMORA';
  const wall=box(10,.95,.28,mats.stoneDark);wall.position.set(-1.2,.46,2.6);city.add(wall);
  const sideWallL=box(.28,.95,5.2,mats.stoneDark);sideWallL.position.set(-6.1,.46,.15);city.add(sideWallL);
  const sideWallR=box(.28,.95,4.6,mats.stoneDark);sideWallR.position.set(3.7,.46,.4);city.add(sideWallR);

  const gateL=cyl(.52,.62,1.55,mats.stoneDark,12);gateL.position.set(-2.05,.78,2.35);city.add(gateL);
  const gateR=cyl(.52,.62,1.55,mats.stoneDark,12);gateR.position.set(-.55,.78,2.35);city.add(gateR);
  const gateTop=box(1.55,.35,.48,mats.stoneDark);gateTop.position.set(-1.3,1.15,2.35);city.add(gateTop);

  // Opening illusion at gate
  const gateVoid=box(.8,.82,.16,mats.black);gateVoid.position.set(-1.3,.42,2.21);city.add(gateVoid);

  const addHouse=(x,z,s=1)=>{
    const g=new THREE.Group();
    const body=box(1.0*s,.72*s,.78*s,mats.plaster);body.position.y=.36*s;g.add(body);
    const roof=box(1.08*s,.16*s,.9*s,mats.roof);roof.rotation.z=.09;roof.position.y=.78*s;g.add(roof);
    g.position.set(x,0,z);city.add(g);
  };
  const houses=[
    [-4.9,1.55,.8],[-3.8,1.55,.75],[-2.65,1.4,.72],[-.1,1.45,.76],[1.1,1.4,.7],[2.3,1.5,.8],
    [-4.6,.3,.72],[-3.4,.15,.68],[-2.25,.15,.68],[-1.05,.2,.72],[.4,.2,.66],[1.7,.2,.72],[2.8,.25,.65],
    [-4.3,-1.1,.68],[-3.0,-1.15,.7],[-1.65,-1.0,.66],[-.2,-1.05,.7],[1.2,-1.0,.65],[2.55,-.95,.72]
  ];
  houses.forEach(h=>addHouse(...h));

  const addChurch=(x,z,scale=1,spire=false)=>{
    const g=new THREE.Group();
    const nave=box(1.35*scale,.82*scale,.82*scale,mats.stone);nave.position.y=.41*scale;g.add(nave);
    const apse=cyl(.35*scale,.35*scale,.82*scale,mats.stone,16);apse.rotation.z=Math.PI/2;apse.position.set(.74*scale,.42*scale,0);g.add(apse);
    const tower=box(.48*scale,1.7*scale,.48*scale,mats.stoneDark);tower.position.set(-.42*scale,.85*scale,0);g.add(tower);
    const top=spire
      ? new THREE.Mesh(new THREE.ConeGeometry(.38*scale,.65*scale,4),mats.roofDark)
      : box(.55*scale,.18*scale,.55*scale,mats.roofDark);
    top.position.set(-.42*scale,1.75*scale,0);top.rotation.y=Math.PI/4;g.add(top);
    g.position.set(x,0,z);city.add(g);
  };
  addChurch(-4.6,-2.0,.95,false);
  addChurch(-2.2,-2.2,.82,true);
  addChurch(.4,-2.0,1.05,false);
  addChurch(2.55,-1.9,.78,true);
  city.position.set(-6.7,.06,3.4);
  root.add(city);

  // Entrance road toward the ancient gate
  const road=box(3.0,.028,8.2,mats.stoneDark);road.position.set(-8.0,.04,7.35);road.rotation.y=-.08;root.add(road);

  // Factory / GAZA plant on the right side
  const plant=new THREE.Group();plant.name='GAZA_PLANT_CONCEPT';
  const main=box(5.8,1.3,3.2,mats.factory);main.position.y=.65;plant.add(main);
  const annex=box(2.2,.85,2.5,mats.factoryDark);annex.position.set(3.25,.425,.1);plant.add(annex);
  const glassBand=box(4.8,.45,.055,mats.glass);glassBand.position.set(-.25,.82,1.63);plant.add(glassBand);
  for(let i=0;i<4;i++){
    const silo=cyl(.42,.46,2.65,mats.metal,20);silo.position.set(-2.0+i*1.05,1.33,-1.9);plant.add(silo);
  }
  const stack=cyl(.18,.22,3.1,mats.metal,16);stack.position.set(2.45,1.55,-1.7);plant.add(stack);

  const makeLabelTexture=(text)=>{
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#e8ebe6';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#19315a';ctx.font='bold 132px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,120);
    ctx.fillStyle='#6a8b35';ctx.fillRect(250,198,268,16);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  };
  const signMat=new THREE.MeshBasicMaterial({map:makeLabelTexture('GAZA'),toneMapped:false});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.5,.82),signMat);sign.position.set(-.5,.9,1.666);plant.add(sign);
  plant.position.set(6.4,.07,3.8);
  root.add(plant);

  // Loading yard / trucks
  for(let i=0;i<3;i++){
    const truck=new THREE.Group();
    const cab=box(.65,.62,.75,mats.factoryDark);cab.position.set(-.78,.35,0);truck.add(cab);
    const trailer=box(1.75,.72,.78,mats.white);trailer.position.set(.45,.42,0);truck.add(trailer);
    for(const wx of [-.85,.15,.85]) for(const wz of [-.42,.42]){
      const wheel=cyl(.11,.11,.12,mats.black,10);wheel.rotation.x=Math.PI/2;wheel.position.set(wx,.08,wz);truck.add(wheel);
    }
    truck.position.set(5.3+i*1.5,.08,6.25+i*.1);truck.rotation.y=-.08;root.add(truck);
  }

  // Vineyards / rural rows
  const vines=new THREE.Group();vines.name='VINEYARDS';
  for(let row=0;row<9;row++){
    for(let col=0;col<14;col++){
      const vine=cyl(.035,.045,.34,mats.bark,6);vine.position.set(col*.42,.17,row*.46);vines.add(vine);
      const crown=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),mats.green2);crown.scale.set(1.35,.55,.75);crown.position.set(col*.42,.38,row*.46);vines.add(crown);
    }
  }
  vines.position.set(-2.4,.03,-9.6);
  vines.rotation.y=.08;
  root.add(vines);

  // Old farm / stone complex
  const farm=new THREE.Group();farm.name='GAZA_FARM_CONCEPT';
  const barn=box(4.8,1.15,1.75,mats.stone);barn.position.y=.58;farm.add(barn);
  const barnRoof=box(5.05,.22,1.95,mats.roof);barnRoof.rotation.z=.08;barnRoof.position.y=1.22;farm.add(barnRoof);
  const wing=box(2.7,.85,1.5,mats.stoneDark);wing.position.set(2.9,.43,.7);farm.add(wing);
  const wingRoof=box(2.9,.18,1.7,mats.roofDark);wingRoof.position.set(2.9,.92,.7);farm.add(wingRoof);
  const tower=cyl(.42,.5,1.65,mats.stoneDark,12);tower.position.set(-2.7,.83,.25);farm.add(tower);
  farm.position.set(5.7,.05,-7.4);
  root.add(farm);

  const addFence=(parent,x,z,len,rot=0)=>{
    const g=new THREE.Group();
    for(let i=0;i<=Math.floor(len/.6);i++){
      const p=box(.045,.48,.045,mats.bark);p.position.set(i*.6,.24,0);g.add(p);
    }
    const rail1=box(len,.035,.035,mats.bark);rail1.position.set(len*.5,.18,0);g.add(rail1);
    const rail2=box(len,.035,.035,mats.bark);rail2.position.set(len*.5,.36,0);g.add(rail2);
    g.position.set(x,0,z);g.rotation.y=rot;parent.add(g);
  };
  addFence(root,1.5,-4.2,10,0);
  addFence(root,1.5,-9.8,10,0);
  addFence(root,1.5,-4.2,5.6,-Math.PI/2);
  addFence(root,11.5,-4.2,5.6,-Math.PI/2);

  const animated=[];

  // Cows and sheep
  const addCow=(x,z,rot=0)=>{
    const g=new THREE.Group();
    const torso=box(.58,.34,.26,mats.white);torso.position.y=.42;g.add(torso);
    const patch=box(.19,.35,.27,mats.black);patch.position.set(.05,.43,0);g.add(patch);
    const head=box(.22,.24,.22,mats.black);head.position.set(.38,.48,0);g.add(head);
    for(const lx of [-.2,.2])for(const lz of [-.09,.09]){
      const leg=box(.045,.3,.045,mats.black);leg.position.set(lx,.17,lz);g.add(leg);
    }
    g.position.set(x,0,z);g.rotation.y=rot;root.add(g);
    animated.push({type:'graze',obj:g,phase:Math.random()*10});
  };
  const addSheep=(x,z,rot=0)=>{
    const g=new THREE.Group();
    const wool=new THREE.Mesh(new THREE.SphereGeometry(.23,10,8),mats.white);wool.scale.set(1.4,.9,.8);wool.position.y=.34;g.add(wool);
    const head=box(.14,.16,.15,mats.black);head.position.set(.3,.36,0);g.add(head);
    for(const lz of [-.08,.08]){
      const leg=box(.035,.22,.035,mats.black);leg.position.set(-.08,.12,lz);g.add(leg);
      const leg2=box(.035,.22,.035,mats.black);leg2.position.set(.13,.12,lz);g.add(leg2);
    }
    g.position.set(x,0,z);g.rotation.y=rot;root.add(g);
    animated.push({type:'graze',obj:g,phase:Math.random()*10});
  };
  [[4,-5.2,.2],[6.3,-5.4,-.4],[8.5,-6.1,.5],[3.8,-7.8,-.2],[9,-8,.3]].forEach(a=>addCow(...a));
  [[2.3,-6.3,.4],[3,-8.5,-.2],[7.4,-8.3,.6],[10,-5.2,-.5],[5,-6.9,.1],[8,-7.2,-.3]].forEach(a=>addSheep(...a));

  // Tractor
  const tractor=new THREE.Group();tractor.name='TRACTOR';
  const bodyT=box(.85,.45,.55,mats.accent);bodyT.position.y=.46;tractor.add(bodyT);
  const hood=box(.55,.32,.48,mats.green);hood.position.set(.68,.42,0);tractor.add(hood);
  const cabin=box(.52,.72,.48,mats.glass);cabin.position.set(-.25,.76,0);tractor.add(cabin);
  for(const [x,r] of [[-.42,.28],[.55,.2]]) for(const z of [-.31,.31]){
    const w=cyl(r,r,.15,mats.black,14);w.rotation.x=Math.PI/2;w.position.set(x,r,z);tractor.add(w);
  }
  tractor.position.set(10.1,.04,-8.6);tractor.rotation.y=-.35;root.add(tractor);

  const addWorker=(x,z,rot=0)=>{
    const g=new THREE.Group();
    const torsoW=cyl(.11,.13,.48,mats.worker,10);torsoW.position.y=.52;g.add(torsoW);
    const headW=new THREE.Mesh(new THREE.SphereGeometry(.095,10,8),mats.skin);headW.position.y=.86;g.add(headW);
    const leg1=box(.05,.38,.06,mats.black);leg1.position.set(-.055,.2,0);g.add(leg1);
    const leg2=box(.05,.38,.06,mats.black);leg2.position.set(.055,.2,0);g.add(leg2);
    g.position.set(x,0,z);g.rotation.y=rot;root.add(g);
    animated.push({type:'worker',obj:g,phase:Math.random()*10});
  };
  addWorker(8.9,-5.3,.8);addWorker(10.4,-8.1,-.5);addWorker(4.8,-8.9,.2);

  // Trees and riverbank vegetation
  const addTree=(x,z,s=1)=>{
    const g=new THREE.Group();
    const trunk=cyl(.06*s,.08*s,.52*s,mats.bark,7);trunk.position.y=.26*s;g.add(trunk);
    const crown=new THREE.Mesh(new THREE.SphereGeometry(.35*s,9,7),mats.green);crown.scale.set(1,.8,1);crown.position.y=.75*s;g.add(crown);
    g.position.set(x,0,z);root.add(g);
  };
  for(let i=0;i<28;i++){
    const x=-13+i*.95;
    addTree(x,-1.15+(i%3)*.22,.75+(i%4)*.08);
  }
  for(let i=0;i<20;i++) addTree(-13+i*1.3,1.65+(i%4)*.18,.68+(i%5)*.06);

  // Hotspot anchors returned to UI
  const hotspots=[
    {id:'zamora',label:'ZAMORA · HISTORIC CORE',position:new THREE.Vector3(-7.8,1.7,4.5)},
    {id:'duero',label:'RÍO DUERO',position:new THREE.Vector3(-1.2,.45,.4)},
    {id:'plant',label:'GAZA · PLANT 3D',position:new THREE.Vector3(6.3,1.8,3.9)},
    {id:'farm',label:'GAZA · FARM',position:new THREE.Vector3(6.0,1.45,-7.5)},
    {id:'vineyards',label:'FIELDS · VINEYARDS',position:new THREE.Vector3(-.4,.8,-7.9)}
  ];

  root.userData.update=(time)=>{
    for(const a of animated){
      if(a.type==='graze'){
        a.obj.rotation.z=Math.sin(time*.65+a.phase)*.018;
      }else{
        a.obj.position.y=Math.abs(Math.sin(time*1.3+a.phase))*.008;
      }
    }
    water.opacity=.78+Math.sin(time*.45)*.035;
  };

  root.userData.hotspots=hotspots;
  root.userData.plant=plant;
  root.userData.city=city;
  root.userData.farm=farm;
  return root;
}
