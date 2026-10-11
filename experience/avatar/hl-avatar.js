export function createHLAvatar(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_V01';
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
    shoe:new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:.88}),
    glass:new THREE.MeshPhysicalMaterial({color:0x30382f,roughness:.1,metalness:.0,transparent:true,opacity:.72}),
    orange:new THREE.MeshStandardMaterial({color:0xa65c2e,roughness:.55,metalness:.08}),
    metal:new THREE.MeshStandardMaterial({color:0x77736c,roughness:.34,metalness:.65}),
    tattoo:new THREE.MeshStandardMaterial({color:0x2c3432,roughness:.98})
  };

  const box=(w,h,d,mat)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.castShadow=true;m.receiveShadow=true;return m;
  };
  const cyl=(r1,r2,h,mat,seg=10)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);
    m.castShadow=true;m.receiveShadow=true;return m;
  };

  // Pelvis / torso
  const hips=box(.34,.18,.22,mats.black2);hips.position.y=.92;root.add(hips);
  const torso=box(.46,.72,.25,mats.black);torso.position.y=1.34;root.add(torso);

  // Oversized black coat silhouette inspired by reference outfits.
  const coatL=box(.18,.82,.28,mats.black2);coatL.position.set(-.25,1.28,0);coatL.rotation.z=-.035;root.add(coatL);
  const coatR=box(.18,.82,.28,mats.black2);coatR.position.set(.25,1.28,0);coatR.rotation.z=.035;root.add(coatR);

  // Neck + head
  const neck=cyl(.105,.115,.2,mats.skin,10);neck.position.y=1.79;root.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.22,18,14),mats.skin);head.scale.set(.92,1.12,.9);head.position.y=2.02;head.castShadow=true;root.add(head);

  // Beard / goatee forms
  const beard=new THREE.Mesh(new THREE.SphereGeometry(.205,16,10,0,Math.PI*2,Math.PI*.45,Math.PI*.48),mats.beard);
  beard.scale.set(.92,.58,.94);beard.position.set(0,1.955,.035);beard.rotation.x=.05;root.add(beard);
  const goatee=cyl(.045,.025,.16,mats.beard,10);goatee.position.set(0,1.84,.195);goatee.rotation.x=Math.PI/2;root.add(goatee);

  // Curly dark hair as clustered low-poly curls.
  const curls=new THREE.Group();
  const curlPositions=[
    [-.16,.16,.00],[-.08,.205,.02],[0,.22,.015],[.08,.205,.02],[.16,.16,.00],
    [-.19,.08,.02],[-.105,.12,.095],[-.03,.145,.11],[.055,.14,.11],[.13,.11,.085],[.19,.07,.02],
    [-.13,.23,-.06],[-.045,.26,-.045],[.05,.25,-.05],[.135,.21,-.06]
  ];
  curlPositions.forEach(([x,y,z],i)=>{
    const curl=new THREE.Mesh(new THREE.IcosahedronGeometry(.075+(i%3)*.008,1),mats.hair);
    curl.position.set(x,2.12+y*.55,z-.04);curls.add(curl);
  });
  root.add(curls);

  // Round orange glasses with dark lenses.
  const glasses=new THREE.Group();
  const ringGeom=new THREE.TorusGeometry(.115,.018,8,24);
  const leftRing=new THREE.Mesh(ringGeom,mats.orange);leftRing.position.set(-.125,2.055,.195);glasses.add(leftRing);
  const rightRing=leftRing.clone();rightRing.position.x=.125;glasses.add(rightRing);
  const lensGeom=new THREE.CircleGeometry(.102,24);
  const leftLens=new THREE.Mesh(lensGeom,mats.glass);leftLens.position.set(-.125,2.055,.202);glasses.add(leftLens);
  const rightLens=leftLens.clone();rightLens.position.x=.125;glasses.add(rightLens);
  const bridge=box(.07,.018,.018,mats.orange);bridge.position.set(0,2.055,.202);glasses.add(bridge);
  root.add(glasses);

  // Ear hoops / plugs.
  for(const sx of [-1,1]){
    const plug=new THREE.Mesh(new THREE.TorusGeometry(.045,.012,6,16),mats.metal);
    plug.position.set(sx*.215,1.99,.005);plug.rotation.y=Math.PI/2;root.add(plug);
  }

  // Arms, forearms with tattoo bands.
  const arms=[];
  for(const sx of [-1,1]){
    const shoulder=new THREE.Group();
    shoulder.position.set(sx*.32,1.58,0);
    const upper=cyl(.075,.065,.48,mats.black,10);upper.position.y=-.22;shoulder.add(upper);
    const elbow=new THREE.Group();elbow.position.y=-.46;shoulder.add(elbow);
    const fore=cyl(.063,.055,.43,mats.skin,10);fore.position.y=-.2;elbow.add(fore);
    const tattoo=cyl(.066,.058,.18,mats.tattoo,10);tattoo.position.y=-.17;elbow.add(tattoo);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),mats.skin);hand.position.y=-.43;elbow.add(hand);
    root.add(shoulder);
    arms.push({shoulder,elbow,sx});
  }

  // Legs.
  const legs=[];
  for(const sx of [-1,1]){
    const hip=new THREE.Group();hip.position.set(sx*.115,.86,0);
    const thigh=cyl(.085,.072,.52,mats.denim,10);thigh.position.y=-.25;hip.add(thigh);
    const knee=new THREE.Group();knee.position.y=-.51;hip.add(knee);
    const shin=cyl(.072,.06,.48,mats.denim,10);shin.position.y=-.23;knee.add(shin);
    const foot=box(.14,.1,.26,mats.shoe);foot.position.set(0,-.49,.075);knee.add(foot);
    root.add(hip);
    legs.push({hip,knee,sx});
  }

  // Neck tattoo mark.
  const tattooMark=new THREE.Mesh(new THREE.RingGeometry(.035,.052,8),mats.tattoo);
  tattooMark.position.set(0,1.81,.118);root.add(tattooMark);

  root.scale.setScalar(.78);

  root.userData.update=(time,speed=1)=>{
    const stride=Math.sin(time*4.4*speed);
    const stride2=Math.sin(time*4.4*speed+Math.PI);
    legs[0].hip.rotation.x=stride*.36;
    legs[1].hip.rotation.x=stride2*.36;
    legs[0].knee.rotation.x=Math.max(0,-stride)*.4;
    legs[1].knee.rotation.x=Math.max(0,-stride2)*.4;
    arms[0].shoulder.rotation.x=stride2*.24;
    arms[1].shoulder.rotation.x=stride*.24;
    root.position.y=.015+Math.abs(stride)*.018;
    head.rotation.y=Math.sin(time*.42)*.035;
    curls.rotation.y=Math.sin(time*.31)*.02;
  };

  root.userData.setWalking=(walking)=>{
    root.userData.walking=Boolean(walking);
  };

  return root;
}
