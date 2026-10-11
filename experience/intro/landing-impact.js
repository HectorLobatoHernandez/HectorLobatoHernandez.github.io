export function createLandingImpact(THREE){
  const root=new THREE.Group();
  root.name='LANDING_IMPACT_FX';
  root.visible=false;

  const ringMat=new THREE.MeshBasicMaterial({
    color:0xd6a467,
    transparent:true,
    opacity:.0,
    side:THREE.DoubleSide,
    depthWrite:false
  });
  const ring=new THREE.Mesh(new THREE.RingGeometry(.15,.2,64),ringMat);
  ring.rotation.x=-Math.PI/2;
  ring.position.y=.018;
  root.add(ring);

  const dustGeo=new THREE.BufferGeometry();
  const count=110;
  const pts=new Float32Array(count*3);
  const dirs=[];
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2;
    const r=.05+Math.random()*.18;
    pts[i*3]=Math.cos(a)*r;
    pts[i*3+1]=.02+Math.random()*.04;
    pts[i*3+2]=Math.sin(a)*r;
    dirs.push({
      x:Math.cos(a)*(.55+Math.random()*1.35),
      y:.18+Math.random()*.55,
      z:Math.sin(a)*(.55+Math.random()*1.35),
      phase:Math.random()
    });
  }
  dustGeo.setAttribute('position',new THREE.BufferAttribute(pts,3));
  const dustMat=new THREE.PointsMaterial({
    color:0xb8a483,
    size:.045,
    transparent:true,
    opacity:0,
    depthWrite:false
  });
  const dust=new THREE.Points(dustGeo,dustMat);
  root.add(dust);

  const verticalGeo=new THREE.BufferGeometry();
  const v=[];
  for(let i=0;i<20;i++){
    const x=(Math.random()-.5)*.5;
    const z=(Math.random()-.5)*.5;
    v.push(x,.03,z,x,.7+Math.random()*1.2,z);
  }
  verticalGeo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  const streakMat=new THREE.LineBasicMaterial({
    color:0xe0c08c,
    transparent:true,
    opacity:0
  });
  const streaks=new THREE.LineSegments(verticalGeo,streakMat);
  root.add(streaks);

  root.userData.update=(progress=0)=>{
    const p=Math.min(1,Math.max(0,progress));
    root.visible=p>0&&p<1;

    const burst=Math.sin(Math.min(1,p*1.35)*Math.PI);
    ring.scale.setScalar(.5+p*7.5);
    ringMat.opacity=.55*(1-p);

    const arr=dustGeo.attributes.position.array;
    for(let i=0;i<count;i++){
      const d=dirs[i];
      const q=Math.max(0,p-d.phase*.08);
      arr[i*3]=d.x*q*1.2;
      arr[i*3+1]=Math.max(.02,d.y*q-1.15*q*q);
      arr[i*3+2]=d.z*q*1.2;
    }
    dustGeo.attributes.position.needsUpdate=true;
    dustMat.opacity=.65*burst*(1-p*.65);

    streakMat.opacity=.30*(1-p);
    streaks.scale.y=.4+p*1.6;
  };

  return root;
}
