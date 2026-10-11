export function createHectorAvatar(THREE,{scale=1}={}){
  const root=new THREE.Group();
  root.name='HECTOR_AVATAR_STYLIZED';
  root.userData.reference='USER_SUPPLIED_PHOTOS_2026_10_11';

  const skin=new THREE.MeshStandardMaterial({color:0xb67d5e,roughness:.9});
  const black=new THREE.MeshStandardMaterial({color:0x111313,roughness:.86});
  const black2=new THREE.MeshStandardMaterial({color:0x242625,roughness:.78});
  const hair=new THREE.MeshStandardMaterial({color:0x171614,roughness:.95});
  const glass=new THREE.MeshPhysicalMaterial({color:0x5b3a24,transparent:true,opacity:.72,roughness:.18,metalness:.05});
  const tattoo=new THREE.MeshStandardMaterial({color:0x2b3432,roughness:.9});
  const metal=new THREE.MeshStandardMaterial({color:0x777b79,roughness:.35,metalness:.65});

  const box=(w,h,d,mat)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.castShadow=true;return m;
  };
  const cyl=(r1,r2,h,mat,seg=12)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,seg),mat);m.castShadow=true;return m;
  };
  const sph=(r,mat,seg=16)=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.max(8,seg/2)),mat);m.castShadow=true;return m;
  };

  const torso=cyl(.20,.24,.72,black,14);torso.position.y=1.0;root.add(torso);
  const hips=box(.37,.18,.22,black2);hips.position.y=.59;root.add(hips);

  for(const x of [-.11,.11]){
    const leg=cyl(.07,.085,.68,black2,10);leg.position.set(x,.28,0);root.add(leg);
    const shoe=box(.16,.09,.28,black);shoe.position.set(x,-.06,.06);root.add(shoe);
  }

  for(const side of [-1,1]){
    const arm=cyl(.055,.065,.64,skin,10);
    arm.position.set(side*.26,.94,0);arm.rotation.z=side*.08;root.add(arm);

    const sleeve=cyl(.075,.085,.28,black,10);
    sleeve.position.set(side*.25,1.16,0);root.add(sleeve);

    const tattooBand=cyl(.058,.058,.24,tattoo,10);
    tattooBand.position.set(side*.26,.77,0);
    tattooBand.material=tattoo;
    root.add(tattooBand);
  }

  const neck=cyl(.095,.11,.18,skin,12);neck.position.y=1.45;root.add(neck);
  const head=sph(.205,skin,18);head.scale.set(.86,1.06,.86);head.position.y=1.67;root.add(head);

  // Hair — clustered curls for a recognizable silhouette.
  const hairGroup=new THREE.Group();
  const curls=[
    [-.13,.10,.00],[0,.14,.02],[.13,.11,.0],[-.17,.02,.02],[-.07,.04,.13],[.06,.06,.14],[.17,.02,.03],
    [-.12,.02,-.12],[.02,.05,-.15],[.14,.03,-.10],[-.04,.16,-.08],[.07,.17,-.05]
  ];
  curls.forEach(([x,y,z],i)=>{
    const c=sph(.075+(i%3)*.008,hair,10);c.position.set(x,y,z);hairGroup.add(c);
  });
  hairGroup.position.set(0,1.83,0);root.add(hairGroup);

  // Beard / goatee
  const beard=cyl(.105,.13,.15,hair,12);beard.scale.z=.7;beard.position.set(0,1.55,.145);root.add(beard);
  const moustache=box(.20,.035,.035,hair);moustache.position.set(0,1.64,.185);root.add(moustache);

  // Round glasses, warm amber frame.
  const eyeY=1.72,eyeZ=.175;
  for(const x of [-.09,.09]){
    const ring=new THREE.Mesh(
      new THREE.TorusGeometry(.075,.012,8,20),
      new THREE.MeshStandardMaterial({color:0x9a5b32,roughness:.45,metalness:.18})
    );
    ring.position.set(x,eyeY,eyeZ);root.add(ring);
    const lens=new THREE.Mesh(new THREE.CircleGeometry(.067,20),glass);
    lens.position.set(x,eyeY,eyeZ+.004);root.add(lens);
  }
  const bridge=box(.07,.018,.018,new THREE.MeshStandardMaterial({color:0x9a5b32,roughness:.45}));bridge.position.set(0,eyeY,eyeZ);root.add(bridge);

  // Ear gauges / hoops.
  for(const side of [-1,1]){
    const e=new THREE.Mesh(new THREE.TorusGeometry(.032,.008,7,14),metal);
    e.rotation.y=Math.PI/2;e.position.set(side*.19,1.63,.02);root.add(e);
  }

  // Neck tattoo cues — abstract, intentionally not literal copies.
  const neckTattoo=box(.13,.07,.01,tattoo);neckTattoo.position.set(0,1.43,.103);root.add(neckTattoo);

  root.scale.setScalar(scale);
  return root;
}
