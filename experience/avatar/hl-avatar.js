export function createHLAvatar(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_V02';
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
  const hips=box(.34,.18,.22,mats.black2);hips.position.y=.92;root.add(hips);

  const torsoPivot=new THREE.Group();
  torsoPivot.position.y=1.34;
  root.add(torsoPivot);

  const torso=box(.46,.72,.25,mats.black);
  torsoPivot.add(torso);

  // Oversized black coat silhouette inspired by the supplied outfits.
  const coatL=box(.18,.82,.28,mats.black2);coatL.position.set(-.25,-.06,0);coatL.rotation.z=-.035;torsoPivot.add(coatL);
  const coatR=box(.18,.82,.28,mats.black2);coatR.position.set(.25,-.06,0);coatR.rotation.z=.035;torsoPivot.add(coatR);

  // Neck + head
  const neck=cyl(.105,.115,.2,mats.skin,10);neck.position.y=1.79;root.add(neck);

  const headPivot=new THREE.Group();
  headPivot.position.y=2.02;
  root.add(headPivot);

  const head=sphere(.22,mats.skin,18);
  head.scale.set(.96,1.08,.93);
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

  // Curly hair wraps the crown, sides, rear and nape.
  const curls=new THREE.Group();
  const frontAndTop=[
    [-.16,.14,.02],[-.08,.20,.04],[0,.225,.035],[.08,.205,.04],[.16,.15,.02],
    [-.19,.07,.03],[-.11,.12,.10],[-.03,.145,.12],[.055,.14,.12],[.13,.11,.095],[.19,.065,.03],
    [-.13,.23,-.03],[-.045,.255,-.02],[.05,.25,-.025],[.135,.205,-.035]
  ];
  const rearAndNape=[
    [-.17,.12,-.10],[-.08,.18,-.145],[0,.195,-.16],[.08,.18,-.145],[.17,.12,-.10],
    [-.20,.035,-.09],[-.11,.065,-.155],[0,.075,-.17],[.11,.065,-.155],[.20,.035,-.09],
    [-.15,-.045,-.10],[-.06,-.07,-.145],[.06,-.07,-.145],[.15,-.045,-.10],
    [0,-.105,-.12]
  ];
  [...frontAndTop,...rearAndNape].forEach(([x,y,z],i)=>{
    const curl=new THREE.Mesh(new THREE.IcosahedronGeometry(.07+(i%3)*.009,1),mats.hair);
    curl.position.set(x,.105+y*.58,z-.035);
    curls.add(curl);
  });
  headPivot.add(curls);

  const nape=sphere(.11,mats.hair,12);
  nape.scale.set(1.15,.72,.82);
  nape.position.set(0,-.155,-.12);
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
    shoulder.position.set(sx*.32,1.58,0);

    const upper=cyl(.075,.065,.48,mats.black,10);
    upper.position.y=-.22;
    shoulder.add(upper);

    const elbow=new THREE.Group();
    elbow.position.y=-.46;
    shoulder.add(elbow);

    const fore=cyl(.063,.055,.43,mats.skin,10);
    fore.position.y=-.2;
    elbow.add(fore);

    const tattooBand=cyl(.066,.058,.17,mats.tattooSoft,10);
    tattooBand.position.y=-.18;
    elbow.add(tattooBand);

    const tattooPanel=makeTattooStripe(.08,.18);
    tattooPanel.position.set(0,-.18,.061);
    tattooPanel.rotation.x=-.12;
    elbow.add(tattooPanel);

    const hand=sphere(.066,mats.skin,10);
    hand.position.y=-.43;
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
    const sole=box(.19,.065,.31,mats.shoeSole);
    sole.position.y=.015;
    g.add(sole);

    const mid=box(.17,.075,.25,mats.shoe);
    mid.position.set(0,.072,-.015);
    g.add(mid);

    const toe=sphere(.072,mats.shoe,10);
    toe.scale.set(1.25,.68,1.2);
    toe.position.set(0,.08,.105);
    g.add(toe);

    const heel=box(.15,.12,.10,mats.shoe);
    heel.position.set(0,.10,-.115);
    g.add(heel);

    return g;
  };

  for(const sx of [-1,1]){
    const hip=new THREE.Group();
    hip.position.set(sx*.115,.86,0);

    const thigh=cyl(.085,.072,.52,mats.denim,10);
    thigh.position.y=-.25;
    hip.add(thigh);

    const knee=new THREE.Group();
    knee.position.y=-.51;
    hip.add(knee);

    const shin=cyl(.072,.06,.48,mats.denim,10);
    shin.position.y=-.23;
    knee.add(shin);

    const sneaker=makeSneaker();
    sneaker.position.set(0,-.51,.075);
    knee.add(sneaker);

    root.add(hip);
    legs.push({hip,knee,sx,sneaker});
  }

  root.scale.setScalar(.78);

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

    torsoPivot.rotation.x=THREE.MathUtils.lerp(torsoPivot.rotation.x,moving?.07*dir:0,.18);
    torsoPivot.rotation.z=THREE.MathUtils.lerp(torsoPivot.rotation.z,moving?Math.sin(phase*.5)*.018:0,.18);
    headPivot.rotation.x=THREE.MathUtils.lerp(headPivot.rotation.x,moving?-.025*dir:0,.16);
    headPivot.rotation.y=Math.sin(time*.45)*.035;

    const bounce=moving?Math.abs(Math.sin(phase))*0.022:Math.sin(time*1.8)*.006;
    root.position.y=bounce;

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

  root.userData.setWalking=(walking)=>{
    if(!walking)root.userData.walkDirection=0;
  };

  return root;
}
