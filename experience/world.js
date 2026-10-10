import * as THREE from 'three';
import { createGazaWorld } from './gaza/gaza-scene.js';

const DATA_URL='./data/world.json';
const canvas=document.getElementById('worldCanvas');
const loading=document.getElementById('worldLoading');
const indexRoot=document.getElementById('worldIndex');
const progressBar=document.getElementById('worldProgressBar');
const progressLabel=document.getElementById('worldProgressLabel');
const chapterLabel=document.getElementById('worldChapterLabel');
const panel=document.getElementById('projectPanel');
const panelImage=document.getElementById('projectPanelImage');
const panelKicker=document.getElementById('projectPanelKicker');
const panelTitle=document.getElementById('projectPanelTitle');
const panelSubtitle=document.getElementById('projectPanelSubtitle');
const panelBody=document.getElementById('projectPanelBody');
const panelActions=document.getElementById('projectPanelActions');

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=t=>t*t*(3-2*t);
const lerp=(a,b,t)=>a+(b-a)*t;

async function loadData(){
  const r=await fetch(DATA_URL,{cache:'no-store'});
  if(!r.ok)throw new Error('world manifest '+r.status);
  return r.json();
}

function createWorld(data){
  const chapters=data.chapters||[];
  const renderer=new THREE.WebGLRenderer({
    canvas,
    antialias:true,
    alpha:false,
    powerPreference:'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.45));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.82;

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x050706);
  scene.fog=new THREE.FogExp2(0x050706,.028);

  const camera=new THREE.PerspectiveCamera(44,1,.1,180);
  const clock=new THREE.Clock();

  const hemi=new THREE.HemisphereLight(0xaebcb4,0x101511,1.25);
  scene.add(hemi);
  const key=new THREE.DirectionalLight(0xffd39c,2.2);
  key.position.set(8,16,8);
  scene.add(key);
  const cool=new THREE.DirectionalLight(0x79d9d1,1.0);
  cool.position.set(-10,7,-12);
  scene.add(cool);

  const baseBgColor=new THREE.Color(0x050706);
  const gazaBgColor=new THREE.Color(0x172116);

  const terrainGeom=new THREE.PlaneGeometry(110,110,64,64);
  const pos=terrainGeom.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i);
    const edge=Math.min(1,Math.hypot(x,y)/55);
    const h=(Math.sin(x*.18)+Math.cos(y*.14)+Math.sin((x+y)*.09))*0.12*edge;
    pos.setZ(i,h);
  }
  terrainGeom.rotateX(-Math.PI/2);
  terrainGeom.computeVertexNormals();
  const terrain=new THREE.Mesh(
    terrainGeom,
    new THREE.MeshStandardMaterial({color:0x0b100d,roughness:.96,metalness:.02})
  );
  terrain.position.y=-.08;
  scene.add(terrain);

  const grid=new THREE.GridHelper(110,88,0x61523c,0x18201b);
  grid.material.transparent=true;
  grid.material.opacity=.22;
  grid.position.y=.005;
  scene.add(grid);

  const pathPoints=chapters.map(ch=>new THREE.Vector3(
    ch.world?.x||0,
    .055,
    (ch.world?.z||0)-3
  ));
  const curve=new THREE.CatmullRomCurve3(pathPoints,false,'catmullrom',.3);
  const pathMesh=new THREE.Mesh(
    new THREE.TubeGeometry(curve,180,.026,6,false),
    new THREE.MeshBasicMaterial({color:0xd6a467,transparent:true,opacity:.7})
  );
  scene.add(pathMesh);

  const ambientGeom=new THREE.BufferGeometry();
  const ambientCount=780;
  const ambient=new Float32Array(ambientCount*3);
  for(let i=0;i<ambientCount;i++){
    ambient[i*3]=(Math.random()-.5)*62;
    ambient[i*3+1]=.15+Math.random()*8;
    ambient[i*3+2]=12-Math.random()*70;
  }
  ambientGeom.setAttribute('position',new THREE.BufferAttribute(ambient,3));
  const ambientPoints=new THREE.Points(
    ambientGeom,
    new THREE.PointsMaterial({
      color:0xa6b8af,
      size:.028,
      transparent:true,
      opacity:.38,
      sizeAttenuation:true
    })
  );
  scene.add(ambientPoints);

  const monolithMat=new THREE.MeshStandardMaterial({
    color:0x111713,
    roughness:.82,
    metalness:.08
  });
  const accentMat=new THREE.MeshStandardMaterial({
    color:0x3b3124,
    emissive:0xd6a467,
    emissiveIntensity:.15,
    roughness:.55,
    metalness:.18
  });
  for(let i=0;i<18;i++){
    const h=.7+Math.random()*4.2;
    const m=new THREE.Mesh(new THREE.BoxGeometry(.12,h,.12),i%5===0?accentMat:monolithMat);
    m.position.set((Math.random()-.5)*34,h*.5,(Math.random()*-58)+7);
    m.rotation.y=Math.random()*.8;
    scene.add(m);
  }

  const textureLoader=new THREE.TextureLoader();
  const portals=[];
  for(const [idx,ch] of chapters.entries()){
    if(idx===0||ch.portal===false)continue;
    const group=new THREE.Group();
    const x=ch.world?.lookX||0;
    const z=(ch.world?.lookZ||-10)+1.5;
    group.position.set(x,1.9,z);

    const frameMat=new THREE.MeshStandardMaterial({
      color:0x222822,
      emissive:0xd6a467,
      emissiveIntensity:.08,
      roughness:.65,
      metalness:.18
    });
    const addFrame=(w,h,d,px,py)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),frameMat);
      mesh.position.set(px,py,0);
      group.add(mesh);
    };
    addFrame(4.9,.09,.13,0,1.65);
    addFrame(4.9,.09,.13,0,-1.65);
    addFrame(.09,3.3,.13,-2.405,0);
    addFrame(.09,3.3,.13,2.405,0);

    const back=new THREE.Mesh(
      new THREE.PlaneGeometry(4.7,3.08),
      new THREE.MeshBasicMaterial({color:0x090d0b})
    );
    back.position.z=-.04;
    group.add(back);

    if(ch.visual){
      textureLoader.load(ch.visual,texture=>{
        texture.colorSpace=THREE.SRGBColorSpace;
        texture.minFilter=THREE.LinearFilter;
        const media=new THREE.Mesh(
          new THREE.PlaneGeometry(4.58,2.94),
          new THREE.MeshBasicMaterial({
            map:texture,
            transparent:true,
            opacity:.82,
            toneMapped:false
          })
        );
        media.position.z=.012;
        group.add(media);
      },undefined,()=>{});
    }

    const beacon=new THREE.Mesh(
      new THREE.CylinderGeometry(.045,.045,5.1,8),
      new THREE.MeshBasicMaterial({color:idx===3?0x7fd8d0:0xd6a467,transparent:true,opacity:.6})
    );
    beacon.position.set(-2.72,.7,0);
    group.add(beacon);

    group.userData={chapterIndex:idx,frameMat};
    scene.add(group);
    portals.push(group);
  }

  // GAZA / Zamora procedural world set-piece.
  // Conceptual spatial composition only: not georeferenced and not as-built.
  const gazaSet=createGazaWorld(THREE,{detail:'world'});
  gazaSet.scale.setScalar(.48);
  gazaSet.position.set(4.3,.02,-26.4);
  gazaSet.rotation.y=-.11;
  const gazaIndices=chapters
    .map((ch,index)=>ch.environment==='gaza'?index:-1)
    .filter(index=>index>=0);
  gazaSet.userData.worldChapterStart=gazaIndices.length?Math.min(...gazaIndices):-1;
  gazaSet.userData.worldChapterEnd=gazaIndices.length?Math.max(...gazaIndices):-1;
  scene.add(gazaSet);

  const scaleFigure=new THREE.Group();
  const figureMat=new THREE.MeshStandardMaterial({
    color:0xd8ddd8,
    roughness:.7,
    emissive:0x303a34,
    emissiveIntensity:.2
  });
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.095,.13,.78,10),figureMat);
  body.position.y=.53;
  const head=new THREE.Mesh(new THREE.SphereGeometry(.125,14,10),figureMat);
  head.position.y=1.02;
  scaleFigure.add(body,head);
  scene.add(scaleFigure);

  const indexButtons=[];
  chapters.forEach((ch,i)=>{
    const b=document.createElement('button');
    b.type='button';
    b.innerHTML='<span>'+String(i).padStart(2,'0')+'</span><b>'+String(ch.navLabel||ch.id).toUpperCase().replaceAll('-',' ')+'</b>';
    b.addEventListener('click',()=>{
      const target=document.querySelector('[data-chapter="'+ch.id+'"]');
      target?.scrollIntoView({behavior:'smooth'});
    });
    indexRoot.appendChild(b);
    indexButtons.push(b);
  });

  let activeIndex=0;
  let targetProgress=0;
  let renderProgress=0;
  let pointerX=0,pointerY=0;

  function setPanel(index){
    const ch=chapters[index];
    activeIndex=index;
    indexButtons.forEach((b,i)=>b.classList.toggle('active',i===index));
    chapterLabel.textContent=String(ch?.navLabel||ch?.id||'ENTRY').toUpperCase().replaceAll('-',' ');

    if(!ch||index===0){
      panel.classList.remove('visible');
      return;
    }

    panel.classList.toggle('project-panel--gaza',ch.environment==='gaza');
    panelKicker.textContent=ch.kicker||'';
    panelTitle.textContent=ch.title||'';
    panelSubtitle.textContent=ch.subtitle||'';
    panelBody.textContent=ch.body||'';
    panelImage.alt=ch.title||'Project visual';
    panelImage.dataset.fallbackDone='';
    if(ch.visual){
      panelImage.src=ch.visual;
      panelImage.onerror=()=>{
        if(panelImage.dataset.fallbackDone)return;
        panelImage.dataset.fallbackDone='1';
        if(ch.visualFallback)panelImage.src=ch.visualFallback;
      };
    }

    panelActions.innerHTML='';
    if(ch.islandHref){
      const a=document.createElement('a');
      a.href=ch.islandHref;
      a.className='world-btn primary';
      a.textContent='ENTER GAZA WORLD ↗';
      panelActions.appendChild(a);
    }
    if(ch.caseHref){
      const a=document.createElement('a');
      a.href=ch.caseHref;
      a.className='world-btn'+(ch.islandHref?'':' primary');
      a.textContent='OPEN CASE STUDY ↗';
      panelActions.appendChild(a);
    }
    if(ch.liveHref){
      const a=document.createElement('a');
      a.href=ch.liveHref;
      a.className='world-btn';
      a.textContent='OPEN LIVE SYSTEM ↗';
      panelActions.appendChild(a);
    }
    panel.classList.add('visible');
  }

  function updateScroll(){
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    targetProgress=clamp(scrollY/max,0,1);
    const chapterFloat=targetProgress*(chapters.length-1);
    const nextActive=clamp(Math.round(chapterFloat),0,chapters.length-1);
    if(nextActive!==activeIndex)setPanel(nextActive);
    progressBar.style.transform='scaleX('+targetProgress.toFixed(5)+')';
    progressLabel.textContent=String(Math.round(targetProgress*100)).padStart(3,'0')+'%';
  }

  function resize(){
    const w=innerWidth,h=innerHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/Math.max(1,h);
    camera.updateProjectionMatrix();
  }

  addEventListener('resize',resize);
  addEventListener('scroll',updateScroll,{passive:true});
  addEventListener('pointermove',e=>{
    pointerX=(e.clientX/Math.max(1,innerWidth)-.5)*2;
    pointerY=(e.clientY/Math.max(1,innerHeight)-.5)*2;
  },{passive:true});

  function sampleChapter(t){
    const maxIndex=chapters.length-1;
    const f=clamp(t,0,1)*maxIndex;
    const a=Math.min(maxIndex-1,Math.floor(f));
    const b=Math.min(maxIndex,a+1);
    const u=smooth(f-a);
    const A=chapters[a].world,B=chapters[b].world;
    return {
      x:lerp(A.x,B.x,u),
      y:lerp(A.y,B.y,u),
      z:lerp(A.z,B.z,u),
      lookX:lerp(A.lookX,B.lookX,u),
      lookY:lerp(A.lookY,B.lookY,u),
      lookZ:lerp(A.lookZ,B.lookZ,u)
    };
  }

  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(.05,clock.getDelta());
    renderProgress+=(targetProgress-renderProgress)*Math.min(1,dt*4.2);
    const p=sampleChapter(renderProgress);
    const time=clock.elapsedTime;

    camera.position.set(
      p.x+pointerX*.12,
      p.y-pointerY*.05+Math.sin(time*.35)*.025,
      p.z
    );
    camera.lookAt(
      p.lookX+pointerX*.08,
      p.lookY-pointerY*.04,
      p.lookZ
    );

    const figureT=clamp(renderProgress+.045,0,1);
    const fp=curve.getPointAt(figureT);
    scaleFigure.position.set(fp.x,0,fp.z);
    scaleFigure.position.y=.02+Math.abs(Math.sin(time*3.4))*.018;
    scaleFigure.rotation.y=Math.sin(time*.3)*.08;

    ambientPoints.rotation.y=time*.004;

    const chapterFloat=renderProgress*(chapters.length-1);
    const gazaStart=gazaSet.userData.worldChapterStart;
    const gazaEnd=gazaSet.userData.worldChapterEnd;
    const distanceToGaza=chapterFloat<gazaStart
      ? gazaStart-chapterFloat
      : chapterFloat>gazaEnd
        ? chapterFloat-gazaEnd
        : 0;
    const gazaBlend=clamp(1-distanceToGaza/.85,0,1);
    gazaSet.visible=gazaBlend>.001;

    if(gazaSet.visible){
      try{gazaSet.userData.update?.(time)}catch(err){console.error('GAZA set update',err)}
      gazaSet.scale.setScalar(.48*(1+gazaBlend*.025));
    }

    scene.background.copy(baseBgColor).lerp(gazaBgColor,gazaBlend);
    scene.fog.color.copy(baseBgColor).lerp(gazaBgColor,gazaBlend);
    scene.fog.density=lerp(.028,.012,gazaBlend);
    hemi.intensity=lerp(1.25,2.0,gazaBlend);
    key.intensity=lerp(2.2,4.0,gazaBlend);
    cool.intensity=lerp(1.0,.55,gazaBlend);
    renderer.toneMappingExposure=lerp(.82,1.02,gazaBlend);

    portals.forEach(portal=>{
      const idx=portal.userData.chapterIndex;
      const distance=Math.abs(idx-(renderProgress*(chapters.length-1)));
      portal.userData.frameMat.emissiveIntensity=.05+Math.max(0,1-distance)*.42;
      portal.scale.setScalar(1+Math.max(0,.06-distance*.04));
    });

    renderer.render(scene,camera);
  }

  resize();
  updateScroll();
  setPanel(0);
  animate();

  setTimeout(()=>loading.classList.add('hide'),500);
}

loadData().then(createWorld).catch(err=>{
  console.error(err);
  loading.innerHTML='<span>HL / WORLD</span><b>Scene load failed</b>';
});
