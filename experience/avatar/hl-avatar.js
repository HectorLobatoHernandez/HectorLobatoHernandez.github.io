export function createHLAvatar(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_V10';
  root.userData.reference='USER_SUPPLIED_PHOTOS_2026_10_11';
  root.userData.style='STYLIZED_REALTIME_HUMANOID';

  const bodyRoot=new THREE.Group();
  root.add(bodyRoot);

  const BASE={
    torsoY:1.33,
    pelvisY:1.13,
    hipY:1.11,
    neckY:1.74,
    headY:1.94
  };

  const mats={
    skin:new THREE.MeshStandardMaterial({color:0xb97f61,roughness:.88}),
    skin2:new THREE.MeshStandardMaterial({color:0x9d674f,roughness:.92}),
    hair:new THREE.MeshStandardMaterial({color:0x171514,roughness:.98}),
    beard:new THREE.MeshStandardMaterial({color:0x241f1c,roughness:.98}),
    shirt:new THREE.MeshStandardMaterial({color:0x242426,roughness:.92}),
    pants:new THREE.MeshStandardMaterial({color:0x202329,roughness:.92}),
    shoe:new THREE.MeshStandardMaterial({color:0x5b554b,roughness:.92}),
    sole:new THREE.MeshStandardMaterial({color:0x383733,roughness:.98}),
    shoeStripe:new THREE.MeshStandardMaterial({color:0xc66f4d,roughness:.88}),
    frame:new THREE.MeshStandardMaterial({color:0xa96032,roughness:.48,metalness:.08}),
    lens:new THREE.MeshPhysicalMaterial({color:0x5a4632,transparent:true,opacity:.34,roughness:.10,metalness:0}),
    eye:new THREE.MeshStandardMaterial({color:0xf1ede4,roughness:.7}),
    irisOuter:new THREE.MeshStandardMaterial({color:0x456b36,roughness:.42}),
    irisInner:new THREE.MeshStandardMaterial({color:0x86a95c,roughness:.38,emissive:0x17200f,emissiveIntensity:.10}),
    pupil:new THREE.MeshStandardMaterial({color:0x090909,roughness:.3}),
    metal:new THREE.MeshStandardMaterial({color:0x777876,roughness:.35,metalness:.62}),
    tattoo:new THREE.MeshBasicMaterial({color:0x263231,transparent:true,opacity:.82}),
    tattooSoft:new THREE.MeshBasicMaterial({color:0x3d4a47,transparent:true,opacity:.58}),
    white:new THREE.MeshBasicMaterial({color:0xffffff})
  };

  const sphere=(r,mat,seg=16)=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.max(10,Math.floor(seg*.75))),mat);
    m.castShadow=true;
    m.receiveShadow=true;
    return m;
  };
  const cyl=(r1,r2,h,mat,seg=14)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);
    m.castShadow=true;
    m.receiveShadow=true;
    return m;
  };
  const box=(w,h,d,mat)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.castShadow=true;
    m.receiveShadow=true;
    return m;
  };

  // --- torso / pelvis ---
  const pelvis=sphere(.22,mats.pants,16);
  pelvis.scale.set(1.15,.72,.72);
  pelvis.position.y=BASE.pelvisY;
  bodyRoot.add(pelvis);

  const torsoPivot=new THREE.Group();
  torsoPivot.position.y=BASE.torsoY;
  bodyRoot.add(torsoPivot);

  const abdomen=cyl(.205,.182,.36,mats.shirt,16);
  abdomen.scale.z=.70;
  abdomen.position.y=-.14;
  torsoPivot.add(abdomen);

  const chest=cyl(.285,.205,.42,mats.shirt,16);
  chest.scale.z=.68;
  chest.position.y=.22;
  torsoPivot.add(chest);

  const collar=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,8,22),mats.shirt);
  collar.rotation.x=Math.PI/2;
  collar.position.set(0,.43,.12);
  torsoPivot.add(collar);

  // shoulders / short sleeves
  for(const sx of [-1,1]){
    const shoulder=sphere(.145,mats.shirt,14);
    shoulder.scale.set(1.08,.80,.92);
    shoulder.position.set(sx*.30,.26,0);
    torsoPivot.add(shoulder);
  }

  // Carhartt chest patch
  const makePatch=()=>{
    const cv=document.createElement('canvas');
    cv.width=420;cv.height=260;
    const ctx=cv.getContext('2d');
    ctx.clearRect(0,0,420,260);
    ctx.fillStyle='#ffffff';
    ctx.beginPath();
    ctx.arc(122,92,62,0,Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation='destination-out';
    ctx.beginPath();
    ctx.arc(150,74,46,0,Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='#ffffff';
    ctx.font='700 42px Arial';
    ctx.textAlign='center';
    ctx.fillText('carhartt.',215,195);
    const tex=new THREE.CanvasTexture(cv);
    tex.colorSpace=THREE.SRGBColorSpace;
    return tex;
  };
  const patch=new THREE.Mesh(
    new THREE.PlaneGeometry(.17,.105),
    new THREE.MeshBasicMaterial({map:makePatch(),toneMapped:false})
  );
  patch.position.set(.145,.17,.202);
  torsoPivot.add(patch);

  // --- neck / head ---
  const neck=cyl(.087,.096,.16,mats.skin,14);
  neck.position.y=BASE.neckY;
  bodyRoot.add(neck);

  const headPivot=new THREE.Group();
  headPivot.position.y=BASE.headY;
  bodyRoot.add(headPivot);

  const head=sphere(.195,mats.skin,22);
  head.scale.set(.97,1.07,.93);
  headPivot.add(head);

  const jaw=sphere(.145,mats.skin2,18);
  jaw.scale.set(1.02,.52,.92);
  jaw.position.set(0,-.105,.02);
  headPivot.add(jaw);

  // ears
  for(const sx of [-1,1]){
    const ear=sphere(.042,mats.skin,12);
    ear.scale.set(.7,1.2,.5);
    ear.position.set(sx*.19,-.005,0);
    headPivot.add(ear);
    const plug=new THREE.Mesh(new THREE.TorusGeometry(.026,.008,6,16),mats.metal);
    plug.position.set(sx*.198,-.02,.01);
    plug.rotation.y=Math.PI/2;
    headPivot.add(plug);
  }

  // beard + moustache + goatee
  const beard=sphere(.165,mats.beard,16);
  beard.scale.set(.92,.44,.9);
  beard.position.set(0,-.105,.115);
  headPivot.add(beard);
  const moustache=box(.18,.026,.026,mats.beard);
  moustache.position.set(0,-.028,.187);
  headPivot.add(moustache);
  const goatee=cyl(.035,.022,.13,mats.beard,10);
  goatee.rotation.x=Math.PI/2;
  goatee.position.set(0,-.155,.18);
  headPivot.add(goatee);

  // full curly hair shell + curls
  const hairCap=sphere(.205,mats.hair,18);
  hairCap.scale.set(1.04,.77,.98);
  hairCap.position.set(0,.095,-.015);
  headPivot.add(hairCap);

  const curls=new THREE.Group();
  const curlPos=[];
  for(let row=0;row<4;row++){
    const n=8-row;
    for(let i=0;i<n;i++){
      const x=(i-(n-1)/2)*.052;
      const y=.115+row*.045;
      const z=.115-row*.04-Math.abs(x)*.12;
      curlPos.push([x,y,z]);
    }
  }
  const backRows=[
    [-.15,.12,-.10],[-.075,.15,-.145],[0,.16,-.16],[.075,.15,-.145],[.15,.12,-.10],
    [-.17,.05,-.12],[-.085,.06,-.16],[0,.07,-.18],[.085,.06,-.16],[.17,.05,-.12],
    [-.13,-.03,-.13],[0,-.045,-.165],[.13,-.03,-.13]
  ];
  [...curlPos,...backRows].forEach(([x,y,z],i)=>{
    const curl=new THREE.Mesh(new THREE.IcosahedronGeometry(.052+(i%3)*.007,1),mats.hair);
    curl.position.set(x,y,z);
    curls.add(curl);
  });
  headPivot.add(curls);

  // eyes
  const eyeGroups=[];
  for(const sx of [-1,1]){
    const eye=new THREE.Group();
    eye.position.set(sx*.086,.022,.178);

    const white=sphere(.036,mats.eye,14);
    white.scale.set(1.12,1,.62);
    eye.add(white);

    const irisOuter=sphere(.019,mats.irisOuter,14);
    irisOuter.scale.set(1,1,.58);
    irisOuter.position.z=.034;
    eye.add(irisOuter);

    const irisInner=sphere(.0125,mats.irisInner,14);
    irisInner.scale.set(1,1,.62);
    irisInner.position.z=.043;
    eye.add(irisInner);

    const pupil=sphere(.0072,mats.pupil,12);
    pupil.position.z=.052;
    eye.add(pupil);

    const glint=sphere(.0048,mats.white,8);
    glint.position.set(.009,.010,.058);
    eye.add(glint);

    headPivot.add(eye);
    eyeGroups.push(eye);
  }

  // glasses + bridge + side chains
  const glasses=new THREE.Group();
  for(const sx of [-1,1]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.078,.012,8,24),mats.frame);
    ring.position.set(sx*.086,.024,.198);
    glasses.add(ring);
    const lens=new THREE.Mesh(new THREE.CircleGeometry(.070,24),mats.lens);
    lens.position.set(sx*.086,.024,.201);
    glasses.add(lens);

    const chain=new THREE.Group();
    for(let i=0;i<7;i++){
      const link=new THREE.Mesh(new THREE.TorusGeometry(.012,.0035,5,10),mats.frame);
      link.scale.set(.72,1.25,1);
      link.position.set(sx*.196,-.02-i*.038,.03);
      link.rotation.y=Math.PI/2;
      chain.add(link);
    }
    headPivot.add(chain);
  }
  const bridge=box(.055,.012,.012,mats.frame);
  bridge.position.set(0,.024,.201);
  glasses.add(bridge);
  headPivot.add(glasses);

  // tattoo cues
  const neckTat=new THREE.Mesh(new THREE.RingGeometry(.03,.045,8),mats.tattoo);
  neckTat.position.set(0,1.755,.09);
  bodyRoot.add(neckTat);

  // --- articulated arms ---
  const arms=[];
  for(const sx of [-1,1]){
    const shoulderPivot=new THREE.Group();
    shoulderPivot.position.set(sx*.305,1.50,0);
    bodyRoot.add(shoulderPivot);

    const upper=cyl(.079,.067,.36,mats.skin,14);
    upper.position.y=-.17;
    shoulderPivot.add(upper);

    const sleeve=cyl(.094,.082,.18,mats.shirt,14);
    sleeve.position.y=-.055;
    shoulderPivot.add(sleeve);

    const elbow=sphere(.061,mats.skin,12);
    elbow.position.y=-.35;
    shoulderPivot.add(elbow);

    const elbowPivot=new THREE.Group();
    elbowPivot.position.y=-.35;
    shoulderPivot.add(elbowPivot);

    const fore=cyl(.064,.052,.37,mats.skin,14);
    fore.position.y=-.18;
    elbowPivot.add(fore);

    const tattooBand=cyl(.061,.050,.22,mats.tattooSoft,14);
    tattooBand.position.y=-.17;
    elbowPivot.add(tattooBand);

    const hand=sphere(.063,mats.skin,12);
    hand.scale.set(.82,1.15,.64);
    hand.position.y=-.38;
    elbowPivot.add(hand);

    const handTat=new THREE.Mesh(new THREE.RingGeometry(.016,.029,7),mats.tattoo);
    handTat.position.set(0,-.38,.054);
    elbowPivot.add(handTat);

    arms.push({shoulderPivot,elbowPivot,sx});
  }

  // --- articulated legs ---
  const legs=[];
  const makeSneaker=()=>{
    const g=new THREE.Group();

    const sole=sphere(.10,mats.sole,16);
    sole.scale.set(1.18,.42,2.0);
    sole.position.set(0,.025,.02);
    g.add(sole);

    const upper=sphere(.085,mats.shoe,16);
    upper.scale.set(1.02,.72,1.55);
    upper.position.set(0,.09,.02);
    g.add(upper);

    const heel=sphere(.07,mats.shoe,14);
    heel.scale.set(.95,1.05,.72);
    heel.position.set(0,.105,-.11);
    g.add(heel);

    const stripe=box(.018,.035,.26,mats.shoeStripe);
    stripe.position.set(.082,.105,.035);
    stripe.rotation.y=-.05;
    g.add(stripe);

    for(let i=0;i<5;i++){
      const rib=box(.17,.012,.014,mats.sole);
      rib.position.set(0,.01,-.07+i*.042);
      rib.rotation.x=.08;
      g.add(rib);
    }

    return g;
  };

  for(const sx of [-1,1]){
    const hipPivot=new THREE.Group();
    hipPivot.position.set(sx*.14,BASE.hipY,0);
    bodyRoot.add(hipPivot);

    const thigh=cyl(.085,.071,.52,mats.pants,14);
    thigh.position.y=-.25;
    hipPivot.add(thigh);

    const knee=sphere(.072,mats.pants,12);
    knee.position.y=-.52;
    hipPivot.add(knee);

    const kneePivot=new THREE.Group();
    kneePivot.position.y=-.52;
    hipPivot.add(kneePivot);

    const shin=cyl(.071,.056,.49,mats.pants,14);
    shin.position.y=-.235;
    kneePivot.add(shin);

    const shoe=makeSneaker();
    shoe.position.set(0,-.455,.085);
    kneePivot.add(shoe);

    legs.push({hipPivot,kneePivot,shoe,sx});
  }

  root.scale.setScalar(.82);

  const rig={bodyRoot,torsoPivot,headPivot,arms,legs,curls,eyeGroups};
  root.userData.rig=rig;

  const resetSecondary=(amt=.16)=>{
    torsoPivot.position.y=THREE.MathUtils.lerp(torsoPivot.position.y,BASE.torsoY,amt);
    torsoPivot.rotation.z=THREE.MathUtils.lerp(torsoPivot.rotation.z,0,amt);
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,0,amt);
    arms.forEach(a=>{
      a.shoulderPivot.rotation.z=THREE.MathUtils.lerp(a.shoulderPivot.rotation.z,0,amt);
      a.elbowPivot.rotation.x=THREE.MathUtils.lerp(a.elbowPivot.rotation.x,0,amt);
    });
  };

  root.userData.update=(time,direction=0,speed=1)=>{
    const moving=Math.abs(direction)>.01;
    const phase=time*4.5*Math.max(.7,speed);
    const swing=moving?Math.sin(phase)*.42:0;
    const swingOpp=moving?Math.sin(phase+Math.PI)*.42:0;

    legs[0].hipPivot.rotation.x=THREE.MathUtils.lerp(legs[0].hipPivot.rotation.x,swing,.25);
    legs[1].hipPivot.rotation.x=THREE.MathUtils.lerp(legs[1].hipPivot.rotation.x,swingOpp,.25);
    legs[0].kneePivot.rotation.x=THREE.MathUtils.lerp(legs[0].kneePivot.rotation.x,moving?Math.max(0,-Math.sin(phase))*.38:0,.25);
    legs[1].kneePivot.rotation.x=THREE.MathUtils.lerp(legs[1].kneePivot.rotation.x,moving?Math.max(0,-Math.sin(phase+Math.PI))*.38:0,.25);

    arms[0].shoulderPivot.rotation.x=THREE.MathUtils.lerp(arms[0].shoulderPivot.rotation.x,swingOpp*.72,.22);
    arms[1].shoulderPivot.rotation.x=THREE.MathUtils.lerp(arms[1].shoulderPivot.rotation.x,swing*.72,.22);

    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,moving?.05:0,.18);
    headPivot.rotation.y=Math.sin(time*.45)*.03;
    bodyRoot.position.y=moving?Math.abs(Math.sin(phase))*.018:Math.sin(time*1.7)*.004;

    resetSecondary(.15);
  };

  root.userData.updateFall=(time,progress=0)=>{
    const p=THREE.MathUtils.clamp(progress,0,1);
    const wind=Math.sin(time*3.0);

    arms[0].shoulderPivot.rotation.x=THREE.MathUtils.lerp(arms[0].shoulderPivot.rotation.x,-.72+wind*.10,.20);
    arms[1].shoulderPivot.rotation.x=THREE.MathUtils.lerp(arms[1].shoulderPivot.rotation.x,-.72-wind*.10,.20);
    arms[0].shoulderPivot.rotation.z=THREE.MathUtils.lerp(arms[0].shoulderPivot.rotation.z,-.52,.18);
    arms[1].shoulderPivot.rotation.z=THREE.MathUtils.lerp(arms[1].shoulderPivot.rotation.z,.52,.18);
    arms[0].elbowPivot.rotation.x=THREE.MathUtils.lerp(arms[0].elbowPivot.rotation.x,-.30,.18);
    arms[1].elbowPivot.rotation.x=THREE.MathUtils.lerp(arms[1].elbowPivot.rotation.x,-.30,.18);

    legs[0].hipPivot.rotation.x=THREE.MathUtils.lerp(legs[0].hipPivot.rotation.x,.18+wind*.10,.18);
    legs[1].hipPivot.rotation.x=THREE.MathUtils.lerp(legs[1].hipPivot.rotation.x,-.10-wind*.10,.18);
    legs[0].kneePivot.rotation.x=THREE.MathUtils.lerp(legs[0].kneePivot.rotation.x,.22,.18);
    legs[1].kneePivot.rotation.x=THREE.MathUtils.lerp(legs[1].kneePivot.rotation.x,.18,.18);

    torsoPivot.position.y=THREE.MathUtils.lerp(torsoPivot.position.y,BASE.torsoY,.18);
    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,-.12+p*.14,.16);
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,.05,.16);
    headPivot.rotation.y=Math.sin(time*.5)*.05;
    bodyRoot.position.y=Math.sin(time*4.8)*.012;
  };

  root.userData.updateLanding=(time,progress=0)=>{
    const p=THREE.MathUtils.clamp(progress,0,1);
    const r=p*p*(3-2*p);

    legs[0].hipPivot.rotation.x=THREE.MathUtils.lerp(legs[0].hipPivot.rotation.x,.84*(1-r),.24);
    legs[1].hipPivot.rotation.x=THREE.MathUtils.lerp(legs[1].hipPivot.rotation.x,.48*(1-r),.24);
    legs[0].kneePivot.rotation.x=THREE.MathUtils.lerp(legs[0].kneePivot.rotation.x,1.05*(1-r),.24);
    legs[1].kneePivot.rotation.x=THREE.MathUtils.lerp(legs[1].kneePivot.rotation.x,.82*(1-r),.24);

    arms[0].shoulderPivot.rotation.x=THREE.MathUtils.lerp(arms[0].shoulderPivot.rotation.x,-1.02*(1-r),.22);
    arms[1].shoulderPivot.rotation.x=THREE.MathUtils.lerp(arms[1].shoulderPivot.rotation.x,.32*(1-r),.22);
    arms[0].shoulderPivot.rotation.z=THREE.MathUtils.lerp(arms[0].shoulderPivot.rotation.z,-.40*(1-r),.20);
    arms[1].shoulderPivot.rotation.z=THREE.MathUtils.lerp(arms[1].shoulderPivot.rotation.z,.45*(1-r),.20);

    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,-.30*(1-r),.22);
    torsoPivot.position.y=BASE.torsoY-.10*(1-r);
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,.14*(1-r),.20);
    bodyRoot.position.y=0;
  };

  root.userData.updateClimb=(time,progress=0)=>{
    const phase=time*4.0;
    const a=Math.sin(phase);
    const b=Math.sin(phase+Math.PI);

    arms[0].shoulderPivot.rotation.x=THREE.MathUtils.lerp(arms[0].shoulderPivot.rotation.x,-1.10+a*.28,.26);
    arms[1].shoulderPivot.rotation.x=THREE.MathUtils.lerp(arms[1].shoulderPivot.rotation.x,-1.10+b*.28,.26);
    arms[0].shoulderPivot.rotation.z=THREE.MathUtils.lerp(arms[0].shoulderPivot.rotation.z,-.18,.18);
    arms[1].shoulderPivot.rotation.z=THREE.MathUtils.lerp(arms[1].shoulderPivot.rotation.z,.18,.18);

    legs[0].hipPivot.rotation.x=THREE.MathUtils.lerp(legs[0].hipPivot.rotation.x,.50+b*.18,.22);
    legs[1].hipPivot.rotation.x=THREE.MathUtils.lerp(legs[1].hipPivot.rotation.x,.50+a*.18,.22);
    legs[0].kneePivot.rotation.x=THREE.MathUtils.lerp(legs[0].kneePivot.rotation.x,.70,.22);
    legs[1].kneePivot.rotation.x=THREE.MathUtils.lerp(legs[1].kneePivot.rotation.x,.70,.22);

    torsoPivot.position.y=THREE.MathUtils.lerp(torsoPivot.position.y,BASE.torsoY,.18);
    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,-.17,.20);
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,.10,.18);
    bodyRoot.position.y=Math.sin(phase*2)*.006;
  };

  return root;
}
