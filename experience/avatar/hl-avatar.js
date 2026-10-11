export function createHLAvatar(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_V11';
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

  // Carhartt chest patch — uses the real white logo supplied by the user.
  const patchTexture=new THREE.TextureLoader().load(
    'data:image/png;base64,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',
    tex=>{
      tex.colorSpace=THREE.SRGBColorSpace;
      tex.minFilter=THREE.LinearFilter;
    }
  );
  const patch=new THREE.Mesh(
    new THREE.PlaneGeometry(.16,.17),
    new THREE.MeshBasicMaterial({map:patchTexture,transparent:true,toneMapped:false,depthWrite:false})
  );
  patch.position.set(.145,.17,.203);
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

  // Clean-shaven face so the mouth remains visible.
  const mouthMat=new THREE.MeshStandardMaterial({color:0x7a443c,roughness:.72});
  const mouth=new THREE.Mesh(new THREE.BoxGeometry(.085,.012,.012),mouthMat);
  mouth.position.set(0,-.083,.192);
  headPivot.add(mouth);

  // Very subtle chin shadow only; no beard volume.
  const chinShadow=new THREE.Mesh(
    new THREE.CircleGeometry(.058,18),
    new THREE.MeshBasicMaterial({color:0x352b27,transparent:true,opacity:.07})
  );
  chinShadow.position.set(0,-.145,.178);
  chinShadow.scale.set(1,.48,1);
  headPivot.add(chinShadow);

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
