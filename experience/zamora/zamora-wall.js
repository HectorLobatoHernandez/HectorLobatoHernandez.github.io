export function createZamoraWall(THREE){
  const root=new THREE.Group();
  root.name='ZAMORA_ENTRY_WALL';

  const stone=new THREE.MeshStandardMaterial({color:0x9f8f74,roughness:.96});
  const stoneDark=new THREE.MeshStandardMaterial({color:0x746955,roughness:.97});
  const earth=new THREE.MeshStandardMaterial({color:0x3d3124,roughness:1});
  const grass=new THREE.MeshStandardMaterial({color:0x53633f,roughness:.98});
  const black=new THREE.MeshStandardMaterial({color:0x101110,roughness:.9});

  const box=(w,h,d,mat)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    m.castShadow=true;m.receiveShadow=true;return m;
  };
  const cyl=(rt,rb,h,mat,seg=14)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);
    m.castShadow=true;m.receiveShadow=true;return m;
  };

  const terrace=box(16,.3,7,earth);terrace.position.set(0,-.15,0);root.add(terrace);
  const turf=box(16,.04,7,grass);turf.position.set(0,.02,0);root.add(turf);

  const wall=box(13.5,3.5,.75,stoneDark);
  wall.position.set(0,1.75,-1.6);
  root.add(wall);

  for(const x of [-5.8,5.8]){
    const tower=cyl(1.0,1.15,4.5,stoneDark,16);
    tower.position.set(x,2.25,-1.55);
    root.add(tower);

    const cap=cyl(1.08,1.08,.28,stone,16);
    cap.position.set(x,4.55,-1.55);
    root.add(cap);
  }

  const gateVoid=box(2.6,2.5,.85,black);
  gateVoid.position.set(0,1.25,-1.55);
  root.add(gateVoid);

  const gateArch=new THREE.Mesh(
    new THREE.TorusGeometry(1.32,.24,10,28,Math.PI),
    stone
  );
  gateArch.rotation.z=Math.PI;
  gateArch.position.set(0,2.45,-1.11);
  root.add(gateArch);

  const gateTop=box(3.05,.5,.8,stone);
  gateTop.position.set(0,2.58,-1.55);
  root.add(gateTop);

  for(let i=0;i<13;i++){
    const merlon=box(.62,.55,.72,stone);
    merlon.position.set(-6+i,3.78,-1.55);
    root.add(merlon);
  }

  // Climbable stone projections / ledges.
  const ledges=[];
  const coords=[
    [-.9,.48],[-.35,.92],[.3,1.34],[-.25,1.82],[.55,2.23],[.05,2.72],[.72,3.08]
  ];
  coords.forEach(([x,y],i)=>{
    const l=box(.5,.13,.26,stone);
    l.position.set(x,y,-1.05);
    root.add(l);
    ledges.push(l);
  });

  // Wall walk / adarve.
  const walk=box(11.8,.18,1.25,stone);
  walk.position.set(0,3.45,-.85);
  root.add(walk);

  // Interior street behind the wall.
  const street=box(11,.06,7,stoneDark);
  street.position.set(0,.04,-5.3);
  root.add(street);

  root.userData.climb={
    start:new THREE.Vector3(-1.0,.08,-.82),
    end:new THREE.Vector3(.72,3.52,-.72),
    top:new THREE.Vector3(.8,3.52,-2.35)
  };
  root.userData.ledges=ledges;

  return root;
}
