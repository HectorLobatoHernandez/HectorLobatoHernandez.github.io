import * as THREE from 'three';
import { createGazaWorld } from './gaza/gaza-scene.js?v=9';
import { createRhbWorld } from './rhb/rhb-scene.js?v=9';
import { createHLAvatar } from './avatar/hl-avatar.js?v=11';
import { createKnowledgeFall } from './intro/knowledge-fall.js?v=9';
import { createLandingImpact } from './intro/landing-impact.js?v=9';
import { createZamoraWall } from './zamora/zamora-wall.js?v=9';

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
  const spaceBgColor=new THREE.Color(0x02040b);
  const zamoraBgColor=new THREE.Color(0x191815);
  const rhbBgColor=new THREE.Color(0x17130f);
  const gazaBgColor=new THREE.Color(0x172116);

  const knowledgeFall=createKnowledgeFall(THREE);
  knowledgeFall.position.set(0,6,0);
  scene.add(knowledgeFall);

  const landingImpact=createLandingImpact(THREE);
  scene.add(landingImpact);

  const spaceIndices=chapters
    .map((ch,index)=>ch.environment==='space'?index:-1)
    .filter(index=>index>=0);
  const spaceEnd=spaceIndices.length?Math.max(...spaceIndices):-1;

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

  const monolithGroup=new THREE.Group();
  scene.add(monolithGroup);

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
    monolithGroup.add(m);
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

  // Human-scale Zamora gateway for the climb sequence.
  const zamoraWall=createZamoraWall(THREE);
  zamoraWall.position.set(.2,.02,-16.8);
  zamoraWall.rotation.y=.02;
  scene.add(zamoraWall);
  zamoraWall.updateMatrixWorld(true);
  const climbStartWorld=zamoraWall.localToWorld(zamoraWall.userData.climb.start.clone());
  const climbEndWorld=zamoraWall.localToWorld(zamoraWall.userData.climb.end.clone());
  const climbTopWorld=zamoraWall.localToWorld(zamoraWall.userData.climb.top.clone());
  const climbIndex=chapters.findIndex(ch=>ch.motion==='climb');
  const landingIndex=chapters.findIndex(ch=>ch.id==='landing');
  const landingT=landingIndex>=0?clamp(landingIndex/(chapters.length-1),0,1):0;
  const landingPoint=curve.getPointAt(landingT);
  landingImpact.position.set(landingPoint.x,0,landingPoint.z);

  // RHB family metalworking workshop / RHB STUDIO evolution.
  const rhbSet=createRhbWorld(THREE,{detail:'world'});
  rhbSet.scale.setScalar(.34);
  rhbSet.position.set(1.2,.04,-21.2);
  rhbSet.rotation.y=.08;
  const rhbIndices=chapters
    .map((ch,index)=>ch.environment==='rhb'?index:-1)
    .filter(index=>index>=0);
  rhbSet.userData.worldChapterStart=rhbIndices.length?Math.min(...rhbIndices):-1;
  rhbSet.userData.worldChapterEnd=rhbIndices.length?Math.max(...rhbIndices):-1;
  scene.add(rhbSet);

  // GAZA / Zamora procedural world set-piece.
  // Conceptual spatial composition only: not georeferenced and not as-built.
  const gazaSet=createGazaWorld(THREE,{detail:'world'});
  gazaSet.scale.setScalar(.48);
  gazaSet.position.set(4.3,.02,-26.4);
  gazaSet.rotation.y=-.11;
  const gazaIndices=chapters
    .map((ch,index)=>['zamora','rhb','gaza'].includes(ch.environment)?index:-1)
    .filter(index=>index>=0);
  gazaSet.userData.worldChapterStart=gazaIndices.length?Math.min(...gazaIndices):-1;
  gazaSet.userData.worldChapterEnd=gazaIndices.length?Math.max(...gazaIndices):-1;
  scene.add(gazaSet);

  const scaleFigure=createHLAvatar(THREE);
  scaleFigure.userData.role='WORLD_TRAVELLER';
  scene.add(scaleFigure);

  // Character lights: keep dark clothes readable against the dossier background.
  const avatarKey=new THREE.PointLight(0xffd7b0,3.2,8,2);
  const avatarFill=new THREE.PointLight(0x9bc8d8,1.55,7,2);
  scene.add(avatarKey,avatarFill);

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
  let lastScrollY=scrollY;
  let scrollDirection=1;
  let lastScrollAt=0;
  let scrollImpulse=0;

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
    panel.classList.toggle('project-panel--rhb',ch.environment==='rhb');
    panel.classList.toggle('project-panel--space',ch.environment==='space');
    panel.classList.toggle('project-panel--zamora',['zamora','landing'].includes(ch.environment));
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
      a.textContent=ch.environment==='rhb'?'ENTER RHB WORKSHOP ↗':'ENTER GAZA WORLD ↗';
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
    const currentY=scrollY;
    const deltaY=currentY-lastScrollY;
    if(Math.abs(deltaY)>.5){
      scrollDirection=deltaY>0?1:-1;
      scrollImpulse=Math.min(1,Math.abs(deltaY)/80);
      lastScrollAt=performance.now();
    }
    lastScrollY=currentY;

    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    targetProgress=clamp(currentY/max,0,1);
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

    const chapterFloat=renderProgress*(chapters.length-1);
    const figureT=clamp(renderProgress+.045,0,1);
    const fp=curve.getPointAt(figureT);
    const ahead=curve.getPointAt(clamp(figureT+.006,0,1));
    const tangentX=ahead.x-fp.x;
    const tangentZ=ahead.z-fp.z;
    const forwardYaw=Math.atan2(tangentX,tangentZ);

    const scrollVelocity=Math.abs(targetProgress-renderProgress);
    const recentlyScrolled=(performance.now()-lastScrollAt)<190;
    const moving=recentlyScrolled||scrollVelocity>.00022;
    const walkSpeed=.75+Math.min(1.65,scrollVelocity*36+scrollImpulse*.9);

    const fallEnd=landingIndex>=0?landingIndex-.22:spaceEnd+.4;
    const inFall=landingIndex>=0&&chapterFloat<fallEnd;
    const landingWindow=landingIndex>=0&&chapterFloat>=fallEnd&&chapterFloat<(landingIndex+.72);
    const climbWindow=climbIndex>=0&&chapterFloat>(climbIndex-.52)&&chapterFloat<(climbIndex+.58);

    if(inFall){
      const fallProgress=clamp(chapterFloat/Math.max(.001,fallEnd),0,1);
      const gravity=fallProgress*fallProgress;

      // Camera-relative framing: the avatar remains large and readable during the whole fall.
      const camDir=new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const camRight=new THREE.Vector3().crossVectors(camDir,camera.up).normalize();
      const camUp=camera.up.clone().normalize();

      const distance=lerp(3.45,4.15,fallProgress);
      const anchor=camera.position.clone()
        .add(camDir.clone().multiplyScalar(distance))
        .add(camUp.clone().multiplyScalar(1.0));

      const verticalOffset=lerp(2.3,-.65,gravity);
      const lateralDrift=Math.sin(time*.72)*(1-fallProgress)*.18;

      scaleFigure.position.copy(anchor);
      scaleFigure.position.add(camRight.multiplyScalar(lateralDrift));
      scaleFigure.position.y+=verticalOffset;
      scaleFigure.scale.setScalar(1.48);

      const faceCameraYaw=Math.atan2(
        camera.position.x-scaleFigure.position.x,
        camera.position.z-scaleFigure.position.z
      );
      scaleFigure.rotation.y=faceCameraYaw;
      scaleFigure.rotation.x=-.10+fallProgress*.16;
      scaleFigure.rotation.z=Math.sin(time*.86)*(1-fallProgress)*.055;
      scaleFigure.userData.updateFall?.(time,fallProgress);
      landingImpact.visible=false;
    }else if(landingWindow){
      const local=clamp((chapterFloat-fallEnd)/Math.max(.001,(landingIndex+.72)-fallEnd),0,1);
      const impactAt=.22;
      const descent=clamp(local/impactAt,0,1);
      const recover=clamp((local-impactAt)/(1-impactAt),0,1);

      // Final drop lands exactly on the dossier path.
      const dropY=1.45*(1-smooth(descent));
      scaleFigure.position.set(landingPoint.x,dropY,landingPoint.z);
      scaleFigure.scale.setScalar(1.14);
      scaleFigure.rotation.x=0;
      scaleFigure.rotation.z=0;

      // Face the viewer/camera during impact and recovery.
      const toCameraX=camera.position.x-scaleFigure.position.x;
      const toCameraZ=camera.position.z-scaleFigure.position.z;
      const faceCameraYaw=Math.atan2(toCameraX,toCameraZ);
      const landingYawDelta=Math.atan2(
        Math.sin(faceCameraYaw-scaleFigure.rotation.y),
        Math.cos(faceCameraYaw-scaleFigure.rotation.y)
      );
      scaleFigure.rotation.y+=landingYawDelta*Math.min(1,dt*12);

      scaleFigure.userData.updateLanding?.(time,recover);

      if(local>=impactAt){
        landingImpact.visible=true;
        landingImpact.userData.update?.(recover);
      }else{
        landingImpact.visible=false;
      }
    }else if(climbWindow){
      scaleFigure.scale.setScalar(.95);
      const local=clamp((chapterFloat-(climbIndex-.52))/1.10,0,1);
      const vertical=clamp(local/.78,0,1);
      if(local<.78){
        scaleFigure.position.lerpVectors(climbStartWorld,climbEndWorld,smooth(vertical));
      }else{
        scaleFigure.position.lerpVectors(climbEndWorld,climbTopWorld,smooth((local-.78)/.22));
      }
      scaleFigure.rotation.y=Math.PI;
      scaleFigure.rotation.z=0;
      scaleFigure.userData.updateClimb?.(time,local);
    }else{
      landingImpact.visible=false;
      scaleFigure.scale.setScalar(.95);
      scaleFigure.position.set(fp.x,0,fp.z);
      scaleFigure.rotation.z=0;

      const targetYaw=scrollDirection>=0?forwardYaw:forwardYaw+Math.PI;
      const yawDelta=Math.atan2(
        Math.sin(targetYaw-scaleFigure.rotation.y),
        Math.cos(targetYaw-scaleFigure.rotation.y)
      );
      scaleFigure.rotation.y+=yawDelta*Math.min(1,dt*9.0);
      scaleFigure.userData.update?.(time,moving?1:0,walkSpeed);
    }

    // Follow the avatar with readable key/fill lighting.
    avatarKey.position.set(
      scaleFigure.position.x+1.15,
      scaleFigure.position.y+1.7,
      scaleFigure.position.z+1.5
    );
    avatarFill.position.set(
      scaleFigure.position.x-1.4,
      scaleFigure.position.y+1.0,
      scaleFigure.position.z-.7
    );

    scrollImpulse*=.88;
    ambientPoints.rotation.y=time*.004;

    const spaceFadeStart=landingIndex>=0?landingIndex-.65:spaceEnd;
    const spaceBlend=spaceEnd>=0?clamp(1-Math.max(0,chapterFloat-spaceFadeStart)/.82,0,1):0;
    knowledgeFall.visible=spaceBlend>.001;
    if(knowledgeFall.visible){
      try{knowledgeFall.userData.update?.(time,1-spaceBlend*.35)}catch(err){console.error('Knowledge fall update',err)}
    }

    const approachIndex=chapters.findIndex(ch=>ch.id==='zamora-approach');
    const rhbLastIndex=chapters.findIndex(ch=>ch.id==='rhb-studio');
    const wallDistance=chapterFloat<approachIndex
      ? approachIndex-chapterFloat
      : chapterFloat>rhbLastIndex
        ? chapterFloat-rhbLastIndex
        : 0;
    const wallBlend=clamp(1-wallDistance/.75,0,1);
    zamoraWall.visible=wallBlend>.001;

    const groundVisible=spaceBlend<.88;
    terrain.visible=groundVisible;
    grid.visible=groundVisible;
    pathMesh.visible=groundVisible;
    monolithGroup.visible=groundVisible;
    ambientPoints.visible=groundVisible;

    const rhbStart=rhbSet.userData.worldChapterStart;
    const rhbEnd=rhbSet.userData.worldChapterEnd;
    const distanceToRhb=chapterFloat<rhbStart
      ? rhbStart-chapterFloat
      : chapterFloat>rhbEnd
        ? chapterFloat-rhbEnd
        : 0;
    const rhbBlend=clamp(1-distanceToRhb/.85,0,1);
    rhbSet.visible=rhbBlend>.001;
    if(rhbSet.visible){
      try{
        const localProgress=clamp((chapterFloat-rhbStart)/Math.max(1,rhbEnd-rhbStart),0,1);
        rhbSet.userData.update?.(time,localProgress);
      }catch(err){console.error('RHB set update',err)}
      rhbSet.scale.setScalar(.34*(1+rhbBlend*.02));
    }

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

    const currentChapter=chapters[clamp(Math.round(chapterFloat),0,chapters.length-1)];
    const zamoraActive=['zamora','landing'].includes(currentChapter?.environment);
    const zamoraBlend=zamoraActive?1:0;

    const worldBg=baseBgColor.clone();
    if(spaceBlend>0)worldBg.lerp(spaceBgColor,spaceBlend);
    if(zamoraBlend>0)worldBg.lerp(zamoraBgColor,zamoraBlend*.82);
    if(rhbBlend>0)worldBg.lerp(rhbBgColor,rhbBlend);
    if(gazaBlend>0)worldBg.lerp(gazaBgColor,gazaBlend);
    scene.background.copy(worldBg);
    scene.fog.color.copy(worldBg);

    scene.fog.density=lerp(.028,.006,spaceBlend);
    scene.fog.density=lerp(scene.fog.density,.018,zamoraBlend);
    scene.fog.density=lerp(scene.fog.density,.019,rhbBlend);
    scene.fog.density=lerp(scene.fog.density,.012,gazaBlend);

    hemi.intensity=1.25-spaceBlend*.7+zamoraBlend*.45+rhbBlend*.35+gazaBlend*.75;
    key.intensity=2.2-spaceBlend*1.1+zamoraBlend*.8+rhbBlend*1.15+gazaBlend*1.8;
    cool.intensity=1.0+spaceBlend*.75-zamoraBlend*.15-rhbBlend*.12-gazaBlend*.45;
    renderer.toneMappingExposure=.82-spaceBlend*.15+zamoraBlend*.08+rhbBlend*.12+gazaBlend*.20;

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
  loading.classList.add('hide');
  animate();
}

loadData().then(createWorld).catch(err=>{
  console.error(err);
  loading.innerHTML='<span>HL / WORLD</span><b>Scene load failed</b><small style="display:block;margin-top:12px;color:#8c9690;font:11px monospace">'+String(err?.message||err)+'</small>';
});
