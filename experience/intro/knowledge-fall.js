export function createKnowledgeFall(THREE){
  const root=new THREE.Group();
  root.name='KNOWLEDGE_FALL_PROLOGUE';

  const starGeo=new THREE.BufferGeometry();
  const starCount=1500;
  const stars=new Float32Array(starCount*3);
  const speeds=new Float32Array(starCount);
  for(let i=0;i<starCount;i++){
    const r=3+Math.random()*22;
    const a=Math.random()*Math.PI*2;
    stars[i*3]=Math.cos(a)*r;
    stars[i*3+1]=(Math.random()-.5)*42;
    stars[i*3+2]=Math.sin(a)*r;
    speeds[i]=.5+Math.random()*1.7;
  }
  starGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));
  const starMat=new THREE.PointsMaterial({
    color:0xdde8ff,
    size:.045,
    transparent:true,
    opacity:.9,
    depthWrite:false
  });
  const starField=new THREE.Points(starGeo,starMat);
  root.add(starField);

  const streakGeo=new THREE.BufferGeometry();
  const streakVerts=[];
  for(let i=0;i<180;i++){
    const r=2.5+Math.random()*14;
    const a=Math.random()*Math.PI*2;
    const x=Math.cos(a)*r,z=Math.sin(a)*r,y=(Math.random()-.5)*30;
    streakVerts.push(x,y,z,x,y-1.4-Math.random()*2.8,z);
  }
  streakGeo.setAttribute('position',new THREE.Float32BufferAttribute(streakVerts,3));
  const streakMat=new THREE.LineBasicMaterial({
    color:0xa9c6ff,
    transparent:true,
    opacity:.24
  });
  const streaks=new THREE.LineSegments(streakGeo,streakMat);
  root.add(streaks);

  const props=new THREE.Group();
  root.add(props);

  const makeLabel=(text,color='#e8e6df')=>{
    const cv=document.createElement('canvas');
    cv.width=1024;cv.height=256;
    const ctx=cv.getContext('2d');
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.fillStyle='rgba(8,10,14,.78)';
    ctx.fillRect(18,18,988,220);
    ctx.strokeStyle='rgba(214,164,103,.6)';
    ctx.lineWidth=3;
    ctx.strokeRect(18,18,988,220);
    ctx.fillStyle=color;
    ctx.font='700 74px Arial';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(text,512,128);
    const tex=new THREE.CanvasTexture(cv);
    tex.colorSpace=THREE.SRGBColorSpace;
    return new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  };

  const knowledge=[
    {label:'MUSIC / PIANO',kind:'piano',pos:[-2.4,4.0,-1.0],scale:1.0},
    {label:'PHYSICS / TECHNICAL THINKING',kind:'formula',pos:[2.8,1.0,-2.2],scale:1.1},
    {label:'AUDIO SYSTEMS',kind:'book',pos:[-3.0,-2.0,1.0],scale:.9},
    {label:'LIGHTING / CONTROL',kind:'book',pos:[2.1,-4.3,.3],scale:.95},
    {label:'CAD / 3D',kind:'cad',pos:[-1.2,-6.5,-2.8],scale:1.0},
    {label:'FABRICATION',kind:'steel',pos:[3.1,-8.5,1.7],scale:1.0},
    {label:'SOFTWARE / AI',kind:'data',pos:[-2.4,-10.5,2.0],scale:1.0},
    {label:'PROJECT DELIVERY',kind:'book',pos:[1.7,-12.7,-1.2],scale:.9}
  ];

  const dark=new THREE.MeshStandardMaterial({color:0x171a1e,roughness:.72,metalness:.08});
  const paper=new THREE.MeshStandardMaterial({color:0xe7e0cf,roughness:.93});
  const wood=new THREE.MeshStandardMaterial({color:0x4b2f22,roughness:.86});
  const ivory=new THREE.MeshStandardMaterial({color:0xe7dfc7,roughness:.84});
  const black=new THREE.MeshStandardMaterial({color:0x0b0c0d,roughness:.78});
  const steel=new THREE.MeshStandardMaterial({color:0x778085,roughness:.42,metalness:.72});
  const cyan=new THREE.MeshBasicMaterial({color:0x8ec8da,transparent:true,opacity:.72});

  const box=(w,h,d,mat)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);

  const animated=[];
  for(const [i,item] of knowledge.entries()){
    const g=new THREE.Group();
    g.position.set(...item.pos);

    if(item.kind==='book'){
      const cover=box(1.0,.12,.72,dark);g.add(cover);
      const pages=box(.92,.09,.66,paper);pages.position.y=.09;g.add(pages);
      const cover2=box(1.0,.08,.72,dark);cover2.position.y=.17;g.add(cover2);
    }else if(item.kind==='piano'){
      const body=box(1.7,.28,.92,black);g.add(body);
      const keys=box(1.35,.08,.38,ivory);keys.position.set(.12,-.04,.56);g.add(keys);
      for(let k=0;k<10;k++){
        const key=box(.055,.055,.22,black);
        key.position.set(-.42+k*.095,.02,.63);g.add(key);
      }
      const leg1=box(.09,.8,.09,wood);leg1.position.set(-.55,-.5,.2);g.add(leg1);
      const leg2=leg1.clone();leg2.position.x=.55;g.add(leg2);
    }else if(item.kind==='formula'){
      const plane=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.0),cyan);
      g.add(plane);
      const label=makeLabel('E = mc²   F = ma   λ = v/f','#c8eeff');
      label.scale.set(2.1,.55,1);label.position.z=.03;g.add(label);
    }else if(item.kind==='cad'){
      const frame=box(1.8,.06,1.1,steel);g.add(frame);
      const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.88),cyan);
      screen.rotation.x=-Math.PI/2;screen.position.y=.04;g.add(screen);
    }else if(item.kind==='steel'){
      for(let n=0;n<4;n++){
        const p=box(1.55,.08,.08,steel);p.position.set(0,n*.12,0);g.add(p);
      }
    }else{
      for(let n=0;n<32;n++){
        const p=new THREE.Mesh(new THREE.SphereGeometry(.025,6,5),cyan);
        p.position.set((Math.random()-.5)*1.4,(Math.random()-.5)*.9,(Math.random()-.5)*.8);g.add(p);
      }
    }

    const label=makeLabel(item.label);
    label.scale.set(2.1,.54,1);
    label.position.set(0,.95,0);
    g.add(label);
    g.scale.setScalar(item.scale);
    props.add(g);
    animated.push({g,phase:i*.73+Math.random(),spin:(i%2?1:-1)*(.18+Math.random()*.18)});
  }

  root.userData.update=(time,progress=0)=>{
    const arr=starGeo.attributes.position.array;
    for(let i=0;i<starCount;i++){
      arr[i*3+1]-=.12*speeds[i]*(1+progress*4.5);
      if(arr[i*3+1]<-22)arr[i*3+1]+=44;
    }
    starGeo.attributes.position.needsUpdate=true;

    streaks.scale.y=1+progress*7;
    streakMat.opacity=.18+progress*.34;
    starMat.opacity=.88-progress*.2;

    for(const item of animated){
      item.g.rotation.x=time*.22*item.spin+item.phase;
      item.g.rotation.y=time*.34*item.spin+item.phase*.5;
      item.g.position.y-=.006*(1+progress*3);
      if(item.g.position.y<-15)item.g.position.y+=20;
    }
  };

  root.userData.props=props;
  return root;
}
