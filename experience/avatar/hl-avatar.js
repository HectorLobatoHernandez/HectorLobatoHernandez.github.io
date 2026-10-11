export function createHLAvatar(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_V04';
  root.userData.reference='USER_SUPPLIED_PHOTOS_2026_10_11';
  root.userData.style='STYLIZED_LOW_POLY_REALTIME';

  const mats={
    skin:new THREE.MeshStandardMaterial({color:0xc08a6b,roughness:.9}),
    skinDark:new THREE.MeshStandardMaterial({color:0x8b5c47,roughness:.92}),
    hair:new THREE.MeshStandardMaterial({color:0x1d1a18,roughness:.98}),
    beard:new THREE.MeshStandardMaterial({color:0x2a2421,roughness:.98}),
    black:new THREE.MeshStandardMaterial({color:0x111212,roughness:.95}),
    black2:new THREE.MeshStandardMaterial({color:0x1d1d1d,roughness:.92}),
    denim:new THREE.MeshStandardMaterial({color:0x202327,roughness:.96}),
    shoe:new THREE.MeshStandardMaterial({color:0x151515,roughness:.9}),
    shoeSole:new THREE.MeshStandardMaterial({color:0x2a2a28,roughness:.94}),
    eyeWhite:new THREE.MeshStandardMaterial({color:0xf2eee6,roughness:.72}),
    iris:new THREE.MeshStandardMaterial({color:0x5a4635,roughness:.55}),
    pupil:new THREE.MeshStandardMaterial({color:0x090909,roughness:.35}),
    glass:new THREE.MeshPhysicalMaterial({
      color:0x5c3c2b,
      roughness:.08,
      metalness:0,
      transparent:true,
      opacity:.48,
      transmission:.06
    }),
    orange:new THREE.MeshStandardMaterial({color:0xa65c2e,roughness:.55,metalness:.08}),
    metal:new THREE.MeshStandardMaterial({color:0x77736c,roughness:.34,metalness:.65}),
    tattoo:new THREE.MeshBasicMaterial({color:0x27302f,transparent:true,opacity:.82}),
    tattooSoft:new THREE.MeshBasicMaterial({color:0x27302f,transparent:true,opacity:.62}),
    highlight:new THREE.MeshBasicMaterial({color:0xffffff})
  };

  const box=(w,h,d,mat)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.castShadow=true;m.receiveShadow=true;return m;
  };
  const cyl=(r1,r2,h,mat,seg=10)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);
    m.castShadow=true;m.receiveShadow=true;return m;
  };
  const sphere=(r,mat,seg=14)=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.max(8,Math.floor(seg*.72))),mat);
    m.castShadow=true;return m;
  };

  // Core body
  const hips=new THREE.Mesh(new THREE.CylinderGeometry(.205,.225,.20,10),mats.black2);
  hips.scale.z=.72;
  hips.position.y=.91;
  hips.castShadow=true;
  root.add(hips);

  const torsoPivot=new THREE.Group();
  torsoPivot.position.y=1.34;
  root.add(torsoPivot);

  // Tapered torso gives a much more human silhouette than the old rectangular block.
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(.26,.205,.66,12),mats.black);
  torso.scale.z=.63;
  torso.position.y=.02;
  torso.castShadow=true;
  torso.receiveShadow=true;
  torsoPivot.add(torso);

  // Rounded short sleeves bridge the torso into the upper arms.
  const shoulderL=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),mats.black);
  shoulderL.scale.set(1.08,.76,.82);
  shoulderL.position.set(-.285,.22,0);
  torsoPivot.add(shoulderL);
  const shoulderR=shoulderL.clone();
  shoulderR.position.x=.285;
  torsoPivot.add(shoulderR);

  // Carhartt chest patch requested by the user.
  const makeCarharttPatch=()=>{
    const cv=document.createElement('canvas');
    cv.width=320;cv.height=220;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#161616';ctx.fillRect(0,0,320,220);
    ctx.fillStyle='#c78a35';
    ctx.beginPath();ctx.arc(92,95,52,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#161616';
    ctx.beginPath();ctx.arc(112,82,42,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f0eee8';
    ctx.font='700 38px Arial';ctx.textAlign='center';ctx.fillText('Carhartt',170,185);
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;return tex;
  };
  const chestPatch=new THREE.Mesh(
    new THREE.PlaneGeometry(.14,.095),
    new THREE.MeshBasicMaterial({map:makeCarharttPatch(),transparent:false,toneMapped:false})
  );
  chestPatch.position.set(.125,.12,.171);
  torsoPivot.add(chestPatch);

  // Neck + head
  const neck=cyl(.095,.105,.18,mats.skin,12);neck.position.y=1.75;root.add(neck);

  const headPivot=new THREE.Group();
  headPivot.position.y=1.965;
  root.add(headPivot);

  const head=sphere(.205,mats.skin,20);
  head.scale.set(.98,1.08,.94);
  headPivot.add(head);

  // Slight jaw volume so the head reads less like an egg.
  const jaw=sphere(.16,mats.skinDark,14);
  jaw.scale.set(1.0,.48,.88);
  jaw.position.set(0,-.12,.025);
  headPivot.add(jaw);

  // Beard / moustache / goatee
  const beard=new THREE.Mesh(
    new THREE.SphereGeometry(.205,16,10,0,Math.PI*2,Math.PI*.45,Math.PI*.48),
    mats.beard
  );
  beard.scale.set(.94,.6,.96);
  beard.position.set(0,-.06,.04);
  beard.rotation.x=.05;
  headPivot.add(beard);

  const moustache=box(.205,.035,.035,mats.beard);
  moustache.position.set(0,-.018,.198);
  headPivot.add(moustache);

  const goatee=cyl(.045,.025,.16,mats.beard,10);
  goatee.position.set(0,-.18,.195);
  goatee.rotation.x=Math.PI/2;
  headPivot.add(goatee);

  // Curly hair wraps crown, sides, rear and nape with no bald seam.
  const curls=new THREE.Group();

  const frontAndTop=[
    [-.16,.14,.02],[-.08,.20,.04],[0,.225,.035],[.08,.205,.04],[.16,.15,.02],
    [-.19,.07,.03],[-.11,.12,.10],[-.03,.145,.12],[.055,.14,.12],[.13,.11,.095],[.19,.065,.03],
    [-.13,.23,-.03],[-.045,.255,-.02],[.05,.25,-.025],[.135,.205,-.035]
  ];

  // Dense bridge between crown and lower rear hair to remove the visible bald band.
  const midBackBridge=[
    [-.19,.115,-.055],[-.125,.135,-.085],[-.06,.145,-.11],[0,.15,-.12],[.06,.145,-.11],[.125,.135,-.085],[.19,.115,-.055],
    [-.205,.055,-.075],[-.14,.065,-.11],[-.075,.075,-.135],[0,.078,-.145],[.075,.075,-.135],[.14,.065,-.11],[.205,.055,-.075],
    [-.17,-.005,-.09],[-.10,.005,-.125],[0,.01,-.145],[.10,.005,-.125],[.17,-.005,-.09]
  ];

  const rearAndNape=[
    [-.18,.12,-.12],[-.09,.18,-.155],[0,.195,-.17],[.09,.18,-.155],[.18,.12,-.12],
    [-.205,.035,-.115],[-.12,.065,-.16],[0,.075,-.18],[.12,.065,-.16],[.205,.035,-.115],
    [-.16,-.05,-.115],[-.07,-.075,-.15],[.07,-.075,-.15],[.16,-.05,-.115],
    [0,-.11,-.125]
  ];

  [...frontAndTop,...midBackBridge,...rearAndNape].forEach(([x,y,z],i)=>{
    const curl=new THREE.Mesh(
      new THREE.IcosahedronGeometry(.072+(i%3)*.009,1),
      mats.hair
    );
    curl.position.set(x,.105+y*.58,z-.02);
    curls.add(curl);
  });
  headPivot.add(curls);

  // Continuous rear cap hidden under the curls. This guarantees there is no skin gap
  // even when the camera is directly behind the avatar.
  const backCap=sphere(.155,mats.hair,14);
  backCap.scale.set(1.12,.90,.82);
  backCap.position.set(0,.005,-.125);
  headPivot.add(backCap);

  const lowerBackCap=sphere(.125,mats.hair,12);
  lowerBackCap.scale.set(1.16,.80,.88);
  lowerBackCap.position.set(0,-.095,-.125);
  headPivot.add(lowerBackCap);

  const nape=sphere(.12,mats.hair,12);
  nape.scale.set(1.20,.78,.88);
  nape.position.set(0,-.165,-.115);
  headPivot.add(nape);

  // Large expressive cartoon-style eyes behind the glasses.
  const eyeGroups=[];
  for(const sx of [-1,1]){
    const eye=new THREE.Group();
    eye.position.set(sx*.118,.035,.181);

    const white=sphere(.056,mats.eyeWhite,14);
    white.scale.set(1.18,1.0,.72);
    eye.add(white);

    const iris=sphere(.028,mats.iris,12);
    iris.position.z=.041;
    iris.scale.z=.55;
    eye.add(iris);

    const pupil=sphere(.014,mats.pupil,10);
    pupil.position.z=.057;
    pupil.scale.z=.48;
    eye.add(pupil);

    const glint=sphere(.006,mats.highlight,8);
    glint.position.set(.010,.012,.069);
    eye.add(glint);

    headPivot.add(eye);
    eyeGroups.push(eye);
  }

  // Round amber glasses.
  const glasses=new THREE.Group();
  const ringGeom=new THREE.TorusGeometry(.118,.016,8,24);
  const leftRing=new THREE.Mesh(ringGeom,mats.orange);leftRing.position.set(-.125,.035,.214);glasses.add(leftRing);
  const rightRing=leftRing.clone();rightRing.position.x=.125;glasses.add(rightRing);

  const lensGeom=new THREE.CircleGeometry(.105,24);
  const leftLens=new THREE.Mesh(lensGeom,mats.glass);leftLens.position.set(-.125,.035,.216);glasses.add(leftLens);
  const rightLens=leftLens.clone();rightLens.position.x=.125;glasses.add(rightLens);

  const bridge=box(.072,.018,.018,mats.orange);
  bridge.position.set(0,.035,.216);
  glasses.add(bridge);
  headPivot.add(glasses);

  // Ear hoops / plugs.
  for(const sx of [-1,1]){
    const plug=new THREE.Mesh(new THREE.TorusGeometry(.045,.012,6,16),mats.metal);
    plug.position.set(sx*.215,-.03,.005);
    plug.rotation.y=Math.PI/2;
    headPivot.add(plug);
  }

  // Tattoo helpers
  const makeTattooStripe=(w,h)=>{
    const g=new THREE.Group();
    const line1=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mats.tattoo);
    g.add(line1);
    const line2=new THREE.Mesh(new THREE.PlaneGeometry(w*.55,h*.18),mats.tattooSoft);
    line2.position.set(w*.08,-h*.2,.002);
    line2.rotation.z=.55;
    g.add(line2);
    return g;
  };

  // Arms, forearms and hand tattoo cues.
  const arms=[];
  for(const sx of [-1,1]){
    const shoulder=new THREE.Group();
    shoulder.position.set(sx*.305,1.52,0);

    const upper=cyl(.082,.068,.35,mats.black,12);
    upper.position.y=-.16;
    shoulder.add(upper);

    const elbow=new THREE.Group();
    elbow.position.y=-.34;
    shoulder.add(elbow);

    const fore=cyl(.062,.052,.40,mats.skin,12);
    fore.position.y=-.19;
    elbow.add(fore);

    const tattooBand=cyl(.066,.058,.17,mats.tattooSoft,10);
    tattooBand.position.y=-.18;
    elbow.add(tattooBand);

    const tattooPanel=makeTattooStripe(.08,.18);
    tattooPanel.position.set(0,-.18,.061);
    tattooPanel.rotation.x=-.12;
    elbow.add(tattooPanel);

    const hand=sphere(.064,mats.skin,12);
    hand.scale.set(.86,1.18,.62);
    hand.position.y=-.41;
    elbow.add(hand);

    const handTattoo=new THREE.Mesh(new THREE.RingGeometry(.018,.034,7),mats.tattoo);
    handTattoo.position.set(0,-.43,.061);
    elbow.add(handTattoo);

    root.add(shoulder);
    arms.push({shoulder,elbow,sx});
  }

  // Neck tattoo — central geometric cue plus side marks.
  const neckTattoo=new THREE.Group();
  const central=new THREE.Mesh(new THREE.RingGeometry(.034,.053,8),mats.tattoo);
  central.position.set(0,1.81,.118);
  neckTattoo.add(central);

  const crossA=new THREE.Mesh(new THREE.PlaneGeometry(.09,.018),mats.tattooSoft);
  crossA.position.set(0,1.81,.121);
  neckTattoo.add(crossA);

  const crossB=new THREE.Mesh(new THREE.PlaneGeometry(.018,.09),mats.tattooSoft);
  crossB.position.set(0,1.81,.122);
  neckTattoo.add(crossB);

  for(const sx of [-1,1]){
    const sideTat=new THREE.Mesh(new THREE.PlaneGeometry(.035,.12),mats.tattooSoft);
    sideTat.position.set(sx*.095,1.79,.065);
    sideTat.rotation.y=sx*.7;
    root.add(sideTat);
  }
  root.add(neckTattoo);

  // Legs.
  const legs=[];
  const makeSneaker=()=>{
    const g=new THREE.Group();

    // Rounded, oversized sole inspired by modern knit sneakers.
    const sole=sphere(.095,mats.shoeSole,14);
    sole.scale.set(1.18,.42,2.05);
    sole.position.set(0,.025,.025);
    g.add(sole);

    const upper=sphere(.082,mats.shoe,14);
    upper.scale.set(1.02,.72,1.55);
    upper.position.set(0,.088,.025);
    g.add(upper);

    const heel=sphere(.072,mats.shoe,12);
    heel.scale.set(.96,1.05,.72);
    heel.position.set(0,.10,-.105);
    g.add(heel);

    const toe=sphere(.074,mats.shoe,12);
    toe.scale.set(1.06,.58,1.18);
    toe.position.set(0,.075,.135);
    g.add(toe);

    // Ribbed sole cues.
    for(let i=0;i<6;i++){
      const rib=new THREE.Mesh(
        new THREE.TorusGeometry(.085+i*.004,.008,6,14,Math.PI),
        mats.shoeSole
      );
      rib.rotation.x=Math.PI/2;
      rib.rotation.z=Math.PI/2;
      rib.position.set(0,.01,-.095+i*.045);
      rib.scale.set(1.04,.62,1);
      g.add(rib);
    }

    return g;
  };

  for(const sx of [-1,1]){
    const hip=new THREE.Group();
    hip.position.set(sx*.13,.86,0);

    const thigh=cyl(.09,.073,.56,mats.denim,12);
    thigh.position.y=-.25;
    hip.add(thigh);

    const knee=new THREE.Group();
    knee.position.y=-.55;
    hip.add(knee);

    const shin=cyl(.073,.058,.52,mats.denim,12);
    shin.position.y=-.25;
    knee.add(shin);

    const sneaker=makeSneaker();
    sneaker.position.set(0,-.535,.075);
    knee.add(sneaker);

    root.add(hip);
    legs.push({hip,knee,sx,sneaker});
  }

  root.scale.setScalar(.82);

  const rig={torsoPivot,headPivot,arms,legs,curls,eyeGroups};
  root.userData.rig=rig;
  root.userData.walkDirection=0;

  root.userData.update=(time,direction=0,speed=1)=>{
    const moving=Math.abs(direction)>.01;
    const dir=direction>=0?1:-1;
    const cadence=4.6*Math.max(.65,speed);
    const phase=time*cadence;

    const stride=moving?Math.sin(phase)*.46*dir:0;
    const strideOpp=moving?Math.sin(phase+Math.PI)*.46*dir:0;
    const armSwing=moving?Math.sin(phase)*.32*dir:0;
    const armSwingOpp=moving?Math.sin(phase+Math.PI)*.32*dir:0;

    legs[0].hip.rotation.x=THREE.MathUtils.lerp(legs[0].hip.rotation.x,stride,.25);
    legs[1].hip.rotation.x=THREE.MathUtils.lerp(legs[1].hip.rotation.x,strideOpp,.25);
    legs[0].knee.rotation.x=THREE.MathUtils.lerp(legs[0].knee.rotation.x,moving?Math.max(0,-Math.sin(phase))*0.42:0,.25);
    legs[1].knee.rotation.x=THREE.MathUtils.lerp(legs[1].knee.rotation.x,moving?Math.max(0,-Math.sin(phase+Math.PI))*0.42:0,.25);

    arms[0].shoulder.rotation.x=THREE.MathUtils.lerp(arms[0].shoulder.rotation.x,armSwingOpp,.22);
    arms[1].shoulder.rotation.x=THREE.MathUtils.lerp(arms[1].shoulder.rotation.x,armSwing,.22);
    arms[0].shoulder.rotation.z=THREE.MathUtils.lerp(arms[0].shoulder.rotation.z,0,.18);
    arms[1].shoulder.rotation.z=THREE.MathUtils.lerp(arms[1].shoulder.rotation.z,0,.18);

    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,moving?.07*dir:0,.18);
    torsoPivot.rotation.z=THREE.MathUtils.lerp(torsoPivot.rotation.z,moving?Math.sin(phase*.5)*.018:0,.18);
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,moving?-.025*dir:0,.16);
    headPivot.rotation.y=Math.sin(time*.45)*.035;

    const bounce=moving?Math.abs(Math.sin(phase))*0.022:Math.sin(time*1.8)*.006;
    root.position.y=bounce;
    torsoPivot.position.y=THREE.MathUtils.lerp(torsoPivot.position.y,0,.16);
    torsoPivot.scale.x=THREE.MathUtils.lerp(torsoPivot.scale.x,1,.12);
    torsoPivot.scale.y=THREE.MathUtils.lerp(torsoPivot.scale.y,1,.12);

    // Eyes subtly scan while idle and focus more centrally while walking.
    const eyeLookX=moving?0:Math.sin(time*.7)*.008;
    const eyeLookY=moving?0:Math.cos(time*.55)*.004;
    for(const eye of eyeGroups){
      eye.rotation.y=THREE.MathUtils.lerp(eye.rotation.y,eyeLookX,.12);
      eye.rotation.x=THREE.MathUtils.lerp(eye.rotation.x,eyeLookY,.12);
    }

    curls.rotation.y=Math.sin(time*.33)*.018;
    root.userData.walkDirection=direction;
  };

  root.userData.updateFall=(time,progress=0)=>{
    const flutter=Math.sin(time*3.2);
    arms[0].shoulder.rotation.x=THREE.MathUtils.lerp(arms[0].shoulder.rotation.x,-.65+flutter*.18,.18);
    arms[1].shoulder.rotation.x=THREE.MathUtils.lerp(arms[1].shoulder.rotation.x,-.65-flutter*.18,.18);
    arms[0].shoulder.rotation.z=THREE.MathUtils.lerp(arms[0].shoulder.rotation.z,-.72,.16);
    arms[1].shoulder.rotation.z=THREE.MathUtils.lerp(arms[1].shoulder.rotation.z,.72,.16);

    legs[0].hip.rotation.x=THREE.MathUtils.lerp(legs[0].hip.rotation.x,.18+flutter*.14,.18);
    legs[1].hip.rotation.x=THREE.MathUtils.lerp(legs[1].hip.rotation.x,-.12-flutter*.14,.18);
    legs[0].knee.rotation.x=THREE.MathUtils.lerp(legs[0].knee.rotation.x,.28,.18);
    legs[1].knee.rotation.x=THREE.MathUtils.lerp(legs[1].knee.rotation.x,.22,.18);

    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,-.12,.14);
    torsoPivot.rotation.z=Math.sin(time*.8)*.035;
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,.06,.14);
    headPivot.rotation.y=Math.sin(time*.55)*.08;
    torsoPivot.position.y=Math.sin(time*5.0)*.018;
  };

  root.userData.updateLanding=(time,progress=0)=>{
    const p=THREE.MathUtils.clamp(progress,0,1);
    // 0 = impact crouch, 1 = recovered upright.
    const recover=p*p*(3-2*p);

    arms[0].shoulder.rotation.x=THREE.MathUtils.lerp(arms[0].shoulder.rotation.x,-1.10+recover*.95,.22);
    arms[1].shoulder.rotation.x=THREE.MathUtils.lerp(arms[1].shoulder.rotation.x,.35-recover*.30,.22);
    arms[0].shoulder.rotation.z=THREE.MathUtils.lerp(arms[0].shoulder.rotation.z,-.48+recover*.46,.20);
    arms[1].shoulder.rotation.z=THREE.MathUtils.lerp(arms[1].shoulder.rotation.z,.58-recover*.55,.20);

    legs[0].hip.rotation.x=THREE.MathUtils.lerp(legs[0].hip.rotation.x,.88-recover*.84,.24);
    legs[1].hip.rotation.x=THREE.MathUtils.lerp(legs[1].hip.rotation.x,-.35+recover*.33,.24);
    legs[0].knee.rotation.x=THREE.MathUtils.lerp(legs[0].knee.rotation.x,1.12-recover*1.06,.24);
    legs[1].knee.rotation.x=THREE.MathUtils.lerp(legs[1].knee.rotation.x,.78-recover*.74,.24);

    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,-.34+recover*.34,.22);
    torsoPivot.rotation.z=THREE.MathUtils.lerp(torsoPivot.rotation.z,-.08+recover*.08,.18);
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,.18-recover*.18,.20);
    headPivot.rotation.y=THREE.MathUtils.lerp(headPivot.rotation.y,0,.18);
    torsoPivot.position.y=-.12*(1-recover);
  };

  root.userData.updateClimb=(time,progress=0)=>{
    const phase=time*4.1;
    const reach=Math.sin(phase);
    const reachOpp=Math.sin(phase+Math.PI);

    arms[0].shoulder.rotation.x=THREE.MathUtils.lerp(arms[0].shoulder.rotation.x,-1.15+reach*.32,.28);
    arms[1].shoulder.rotation.x=THREE.MathUtils.lerp(arms[1].shoulder.rotation.x,-1.15+reachOpp*.32,.28);
    arms[0].shoulder.rotation.z=THREE.MathUtils.lerp(arms[0].shoulder.rotation.z,-.22,.18);
    arms[1].shoulder.rotation.z=THREE.MathUtils.lerp(arms[1].shoulder.rotation.z,.22,.18);

    legs[0].hip.rotation.x=THREE.MathUtils.lerp(legs[0].hip.rotation.x,.52+reachOpp*.22,.24);
    legs[1].hip.rotation.x=THREE.MathUtils.lerp(legs[1].hip.rotation.x,.52+reach*.22,.24);
    legs[0].knee.rotation.x=THREE.MathUtils.lerp(legs[0].knee.rotation.x,.75,.24);
    legs[1].knee.rotation.x=THREE.MathUtils.lerp(legs[1].knee.rotation.x,.75,.24);

    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,-.18,.2);
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,.12,.2);
    headPivot.rotation.y=Math.sin(time*.35)*.03;
    torsoPivot.position.y=Math.sin(phase*2)*.008;
  };

  root.userData.setWalking=(walking)=>{
    if(!walking)root.userData.walkDirection=0;
  };

  return root;
}
