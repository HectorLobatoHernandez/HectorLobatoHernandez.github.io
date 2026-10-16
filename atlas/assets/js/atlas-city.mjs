import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createAtmosphere} from './atlas-city-atmosphere.mjs';
import {createUrbanLife} from './atlas-urban-life.mjs?v=12';
import {createParcelModels} from './atlas-parcel-models.mjs?v=12';
import {createProjectProjection} from './atlas-project-projection.mjs';
import {createCityPhotography} from './atlas-city-photography.mjs';
import {lightingSequence,duskDuration} from './atlas-cinematic-state.mjs';
import {createCity} from './atlas-city-model.mjs';
import {validateCity,clamp,smooth,phases,cityPhase,focusPose,districts} from './atlas-city-state.mjs';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const config=validateCity(await fetch('../assets/projects/atlas/city.json').then(r=>{if(!r.ok)throw Error('No se pudo cargar el atlas');return r.json()}));
let dirty=true,p=reduced?1:0,playing=!reduced,selected=config.projects.find(x=>x.status==='ready'),mode='city',transition=null,projectReady=false,frameProject=null,pendingProject=null,last=performance.now(),elapsed=0,approachStart=0,approachProgress=0;
const host=$('atlas-canvas'),labels=$('atlas-labels'),shell=$('atlas-project-shell'),frame=$('atlas-project-frame');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xeeebe3);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
renderer.localClippingEnabled=true;renderer.shadowMap.enabled=innerWidth>760;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Ciudad de proyectos. Arrastra para girar y usa la rueda para acercar.');
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.5,1600);
scene.background=new THREE.Color(0xeeebe3);const hemi=new THREE.HemisphereLight(0xffffff,0x949d91,2.6);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2d9,3.2);sun.position.set(-70,140,85);sun.castShadow=renderer.shadowMap.enabled;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-155,right:155,top:140,bottom:-145,near:1,far:400});sun.shadow.bias=-.00015;sun.shadow.normalBias=.15;scene.add(sun);
const city=createCity(config,()=>{dirty=true});scene.add(city.group);
const atmosphere=createAtmosphere({scene,city,config,reduced});let night=false,nightFactor=-1,autoLighting=true,completedMs=0;const life=createUrbanLife({scene,city,config,reduced}),parcels=createParcelModels({scene,city,config,dirty:()=>dirty=true}),photography=createCityPhotography(scene),projection=createProjectProjection({scene,config,parcels,reduced});
function applyLighting(level,elevation=.5){
 if(Math.abs(level-nightFactor)<.001)return;nightFactor=level;night=level>.5;
 const color=(a,b)=>new THREE.Color(a).lerp(new THREE.Color(b),level);
 document.body.classList.toggle('atlas-night',night);scene.background=color(0xc9d9df,0x080e19);hemi.color.copy(color(0xd5e6f2,0x7e92b4));hemi.groundColor.copy(color(0x7e8262,0x222028));hemi.intensity=THREE.MathUtils.lerp(2.15,1.12,level);sun.color.copy(color(0xffefcf,0xa6b8df));sun.intensity=THREE.MathUtils.lerp(3.4,.48,level);sun.position.set(-90,140*(1-level)+20,75);renderer.toneMappingExposure=THREE.MathUtils.lerp(1.04,1.12,level);renderer.shadowMap.enabled=level<.96&&innerWidth>760;atmosphere.setNight(level);life.setNight(level);parcels.setNight(level);projection.setNight(level);photography.update(level,elevation);scene.fog=new THREE.Fog(color(0xc6d1d0,0x080e19),230,900);
 $('atlas-night').setAttribute('aria-pressed',String(night));$('atlas-night').textContent=autoLighting?(night?'Noche · auto':'Día · auto'):(night?'Noche · 2300 K':'Día');$('atlas-lighting-auto').setAttribute('aria-pressed',String(autoLighting));dirty=true;
}
function setNight(value){autoLighting=false;applyLighting(value?1:0)}
$('atlas-night').onclick=()=>setNight(!night);$('atlas-lighting-auto').onclick=()=>{autoLighting=true;completedMs=0;nightFactor=-1;applyLighting(0)};applyLighting(0);
$('atlas-cutaway').onclick=()=>{const value=!parcels.snapshot().cutaway;parcels.setCutaway(value);$('atlas-cutaway').setAttribute('aria-pressed',String(value));dirty=true};
$('atlas-capture').onclick=()=>{const size=new THREE.Vector2();renderer.getSize(size);const ratio=renderer.getPixelRatio(),aspect=camera.aspect;try{renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=16/9;camera.updateProjectionMatrix();renderer.render(scene,camera);const a=document.createElement('a');a.download='Atlas-ciudad-3840x2160.png';a.href=renderer.domElement.toDataURL('image/png');a.click()}finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();dirty=true}};
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.dampingFactor=.1;orbit.minDistance=1.2;orbit.maxDistance=800;orbit.maxPolarAngle=Math.PI*.62;orbit.autoRotateSpeed=.45;orbit.addEventListener('change',()=>{dirty=true});
const overviewPose=()=>{const fit=Math.max(1,1.35/camera.aspect);return {position:[205*fit,192*fit,245*fit],target:[0,0,-4]}};
function moveTo(pose,duration=1800){transition={from:camera.position.clone(),fromTarget:orbit.target.clone(),to:new THREE.Vector3(...pose.position),toTarget:new THREE.Vector3(...pose.target),start:performance.now(),duration:reduced?1:duration};orbit.enabled=false;orbit.autoRotate=false;$('atlas-orbit').setAttribute('aria-pressed','false');dirty=true}
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(1,h);scene.userData.viewport={width:w,height:h};camera.updateProjectionMatrix();if(mode==='city'&&!transition){const pose=overviewPose();camera.position.set(...pose.position);orbit.target.set(...pose.target);orbit.update()}dirty=true}
new ResizeObserver(resize).observe(host);resize();
const labelNodes=new Map();
for(const project of config.projects){
 const ready=project.status==='ready',button=document.createElement('button');button.dataset.project=project.id;button.className=ready?'ready':'';
 const no=document.createElement('span');no.textContent=project.number;const title=document.createElement('b');title.textContent=project.name;const dot=document.createElement('i');dot.setAttribute('aria-hidden','true');button.append(no,title,dot);button.onfocus=()=>{if(mode==='city'){pointerOver=false;projection.show(project.id);dirty=true}};button.onblur=()=>{projection.clear();dirty=true};button.onclick=()=>choose(project,true);$('atlas-projects').append(button);

}
$('atlas-ready-count').textContent=`${config.projects.filter(p=>p.status==='ready').length} / ${config.projects.length}`;
function choose(project,enter=false){
 selected=project;city.select(project.id);for(const b of $('atlas-projects').children)b.classList.toggle('selected',b.dataset.project===project.id);
 for(const [id,l] of labelNodes)l.classList.toggle('selected',id===project.id);
 $('atlas-selection-state').textContent=project.status==='ready'?(project.kind==='documents'?'ARCHIVO / REFERENCIAS DOCUMENTALES':'PROYECTO ACTIVO / MODELO FUENTE'):'PARCELA RESERVADA';$('atlas-selection-name').textContent=project.name;
 $('atlas-selection-copy').textContent=project.status==='ready'?(project.kind==='documents'?'Figuras del preproyecto. Sin modelo 3D disponible. ':'Plano, construcción, capas e interiores. ')+project.domain.join(' · '):project.domain.join(' · ')+'. El modelo de este proyecto está pendiente de integrar.';
 $('atlas-enter').disabled=project.status!=='ready';$('atlas-enter').textContent=project.status==='ready'?'Entrar en el proyecto ↗':'Modelo pendiente';
 if(enter&&project.status==='ready')enterProject(project);else if(enter){playing=false;moveTo(focusPose(project,camera.aspect))}dirty=true;
}
choose(selected);
for(const phase of phases){const button=document.createElement('button');button.textContent=phase.title.replace('La ciudad de proyectos','Ciudad');button.dataset.phase=phase.id;button.onclick=()=>{p=phase.to;playing=false;dirty=true};$('atlas-phase-nav').append(button)}
function send(type){if(frame.contentWindow&&frameProject)frame.contentWindow.postMessage({type,version:1,projectId:frameProject,night:autoLighting||night},location.origin)}
function enterProject(project){
 if(mode!=='city'||project.status!=='ready')return;
 projection.clear();touchProject=null;pointerOver=false;playing=false;approachProgress=p;approachStart=performance.now();mode='approach';pendingProject=project;elapsed=0;$('atlas-loading').hidden=false;$('atlas-loading-text').textContent='Acercándonos al plano…';
 moveTo(focusPose(project,camera.aspect),2300);
 if(frameProject!==project.id){projectReady=false;frameProject=project.id;const url=new URL(project.entry,document.baseURI);if(url.origin!==location.origin)throw Error('La entrada debe pertenecer al atlas');url.searchParams.set('atlas','1');url.searchParams.set('project',project.id);url.searchParams.set('night',night?'1':'0');frame.src=url.href}
 dirty=true;
}
function showProject(){
 if(mode!=='approach'||transition||!projectReady)return;
 mode='project';shell.hidden=false;$('atlas-project-title').textContent=pendingProject.name;$('atlas-loading').hidden=true;
 requestAnimationFrame(()=>shell.classList.add('visible'));send('ATLAS_PROJECT_START');history.replaceState(null,'','#'+(pendingProject.shareSlug||pendingProject.id));dirty=true;
}
function returnCity(){
 send('ATLAS_PROJECT_PAUSE');shell.classList.remove('visible');shell.hidden=true;mode='city';pendingProject=null;transition=null;$('atlas-loading').hidden=true;orbit.enabled=true;p=1;playing=false;moveTo(overviewPose(),1500);history.replaceState(null,'',location.pathname+location.search);dirty=true;
}
window.addEventListener('message',event=>{
 if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.version!==1||event.data.projectId!==frameProject)return;
 if(event.data.type==='ATLAS_PROJECT_READY'){projectReady=true;showProject()}
 if(event.data.type==='ATLAS_RETURN')returnCity();
 if(event.data.type==='ATLAS_PROJECT_ERROR'){$('atlas-loading-text').textContent='No se pudo cargar el modelo. Puedes volver y reintentar.';projectReady=false;frameProject=null}
});
$('atlas-enter').onclick=()=>enterProject(selected);$('atlas-return').onclick=returnCity;$('atlas-cancel').onclick=returnCity;$('atlas-restart-project').onclick=()=>send('ATLAS_PROJECT_START');
$('atlas-overview').onclick=()=>{playing=false;moveTo(overviewPose())};$('atlas-top').onclick=()=>{playing=false;moveTo({position:[0,300*Math.max(1,1.3/camera.aspect),.01],target:[0,0,0]})};
$('atlas-orbit').onclick=()=>{if(mode!=='city')return;transition=null;orbit.enabled=true;orbit.autoRotate=!orbit.autoRotate;$('atlas-orbit').setAttribute('aria-pressed',String(orbit.autoRotate));dirty=true};
$('atlas-play').onclick=()=>{if(p>=.999){p=0;completedMs=0;autoLighting=true;nightFactor=-1;applyLighting(0)}playing=!playing;dirty=true};$('atlas-replay').onclick=()=>{p=0;completedMs=0;autoLighting=true;nightFactor=-1;applyLighting(0);playing=true;dirty=true;moveTo(overviewPose(),800)};
$('atlas-build').oninput=e=>{p=Number(e.target.value)/1000;playing=false;dirty=true};
$('atlas-help-open').onclick=()=>$('atlas-help').showModal();$('atlas-help-close').onclick=()=>$('atlas-help').close();
$('atlas-fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('atlas-fullscreen').textContent='No disponible'}};
document.addEventListener('fullscreenchange',()=>{$('atlas-fullscreen').textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa';resize()});
for(const district of districts){const b=document.createElement('button');b.textContent=district.name;b.dataset.district=district.id;b.onclick=()=>{playing=false;p=1;moveTo({position:district.position,target:district.target},1800)};$('atlas-districts').append(b)}
$('atlas-life').onclick=()=>{const enabled=!life.snapshot().enabled;life.setEnabled(enabled);parcels.setLife(enabled);$('atlas-life').setAttribute('aria-pressed',String(enabled));dirty=true};
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),groundHit=new THREE.Vector3();let down=null,pointerOver=false,pointerClient=null,touchProject=null,hoverAt=0,multiTouch=false;const activePointers=new Set();
function projectAt(x,y){
 const r=renderer.domElement.getBoundingClientRect();pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
 if(raycaster.ray.intersectPlane(groundPlane,groundHit)){const p=config.projects.find(p=>Math.abs(groundHit.x-p.plot.center[0])<=p.plot.size[0]/2+.3&&Math.abs(groundHit.z-p.plot.center[1])<=p.plot.size[1]/2+.3);if(p)return p.id}
 const visible=city.pickables.filter(o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true}),hit=raycaster.intersectObjects(visible,false)[0];return hit?.object.userData.project||null;
}
function hover(id){projection.show(id);renderer.domElement.style.cursor=id?'pointer':'';const hint=document.querySelector('.atlas-mouse-hint');hint.textContent=id?config.projects.find(p=>p.id===id).name+' · pulsa para entrar':'Arrastra para girar · señala una parcela para descubrir su proyecto';dirty=true}
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointerClient=[e.clientX,e.clientY];pointerOver=true;if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])>5){projection.clear();dirty=true}});
renderer.domElement.addEventListener('pointerleave',e=>{if(e.pointerType==='touch')return;pointerOver=false;hover(null)});
renderer.domElement.addEventListener('pointercancel',()=>{activePointers.clear();multiTouch=false;down=null;pointerOver=false;touchProject=null;hover(null)});
renderer.domElement.addEventListener('pointerdown',e=>{if(mode!=='city')return;activePointers.add(e.pointerId);if(activePointers.size>1){multiTouch=true;projection.clear();touchProject=null}transition=null;orbit.enabled=true;down=[e.clientX,e.clientY]});
renderer.domElement.addEventListener('pointerup',e=>{
 activePointers.delete(e.pointerId);const gesture=multiTouch;if(activePointers.size===0)multiTouch=false;const start=down;down=null;if(gesture)return;if(mode!=='city'||!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;
 const id=projectAt(e.clientX,e.clientY);if(!id){touchProject=null;hover(null);return}
 const project=config.projects.find(p=>p.id===id);
 if(e.pointerType==='touch'&&touchProject!==id){touchProject=id;choose(project);hover(id);return}
 touchProject=null;choose(project,true);
});
renderer.domElement.addEventListener('keydown',e=>{if(e.key==='Escape'){projection.clear();touchProject=null;pointerOver=false;moveTo(overviewPose())}if(e.key==='Enter')enterProject(selected)});
function placeLabels(){const w=host.clientWidth,h=host.clientHeight;for(const [id,anchor] of city.anchors){const q=anchor.clone().project(camera),node=labelNodes.get(id);if(!node)continue;node.style.left=(q.x*.5+.5)*w+'px';node.style.top=(-q.y*.5+.5)*h+'px';node.hidden=q.z>1||q.z<0||Math.abs(q.x)>1.05||Math.abs(q.y)>1.05||mode!=='city'}}
let phaseId='',ambientFrame=0,ambientClock=0,ambientMotion=!reduced;
$('atlas-motion').setAttribute('aria-pressed',String(ambientMotion));$('atlas-motion').textContent=ambientMotion?'Pausar ambiente':'Animar ambiente';
$('atlas-motion').onclick=()=>{ambientMotion=!ambientMotion;$('atlas-motion').setAttribute('aria-pressed',String(ambientMotion));$('atlas-motion').textContent=ambientMotion?'Pausar ambiente':'Animar ambiente';dirty=true};
function tick(now){const dt=Math.min(100,now-last);last=now;
 if(mode!=='project'){
  if(playing){p=clamp(p+dt/12000);if(p===1)playing=false;dirty=true}
  if(mode==='approach')p=approachProgress+(1-approachProgress)*smooth((now-approachStart)/(reduced?1:2300));
  if(p<.999)completedMs=0;else if(ambientMotion||reduced)completedMs=reduced?duskDuration:Math.min(duskDuration,completedMs+dt);
  if(autoLighting){const sequence=lightingSequence(p,completedMs);applyLighting(sequence.night,sequence.sunElevation);$('atlas-sequence-state').textContent=sequence.stage}
  else $('atlas-sequence-state').textContent=night?'Noche · modo manual':'Día · modo manual';
  city.update(p);if(now-ambientFrame>80){if(ambientMotion)ambientClock+=now-ambientFrame;atmosphere.tick(ambientClock,p);life.update(ambientClock,p);parcels.update(ambientClock,p);if(ambientMotion)dirty=true;ambientFrame=now}
  if(transition){const t=smooth((now-transition.start)/transition.duration);camera.position.lerpVectors(transition.from,transition.to,t);orbit.target.lerpVectors(transition.fromTarget,transition.toTarget,t);camera.lookAt(orbit.target);dirty=true;if(t===1){transition=null;orbit.enabled=mode==='city'}}
  else if(mode==='city'&&orbit.update()){camera.position.y=Math.max(.7,camera.position.y);dirty=true}
  if(mode==='approach'){elapsed+=dt;showProject();if(elapsed>3500)$('atlas-loading-text').textContent='Preparando el modelo original y sus galerías…';if(elapsed>90000){$('atlas-loading-text').textContent='La carga está tardando. Puedes volver a la ciudad y reintentar.'}}
  const phase=cityPhase(p);if(phaseId!==phase.id){phaseId=phase.id;$('atlas-phase').textContent=phase.title;for(const b of $('atlas-phase-nav').children){if(b.dataset.phase===phase.id)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')}}
  $('atlas-percentage').textContent=Math.round(p*100)+' %';$('atlas-build').value=String(Math.round(p*1000));$('atlas-play').textContent=playing?'Pausa':p>=.999?'Construir':'Continuar';$('atlas-play').setAttribute('aria-label',playing?'Pausar construcción':'Continuar construcción');
  if(mode==='city'&&pointerOver&&pointerClient&&!down&&now-hoverAt>80){const id=projectAt(...pointerClient);if(id!==projection.snapshot().projectId)hover(id);hoverAt=now}
  life.updateCamera(camera);atmosphere.updateCamera(camera);
  if(projection.update(now,camera,mode==='city'&&p>.12))dirty=true;
  if(dirty){placeLabels();renderer.render(scene,camera);dirty=false}
 }
 requestAnimationFrame(tick);
}
window.__ATLAS_CITY__={get state(){return {p,playing,selected:selected.id,mode,projectReady,buildings:city.buildings,phase:cityPhase(p).id,frameProject,night,nightFactor,autoLighting,completedMs,ambientMotion}},snapshot(){return {camera:camera.position.toArray(),target:orbit.target.toArray(),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,atmosphere:atmosphere.snapshot(),life:life.snapshot(),parcels:parcels.snapshot(),projection:projection.snapshot(),businesses:city.descriptors.buildings.filter(b=>b.business).map(b=>b.business),photography:photography.snapshot()}},projectScreenPoint(id){const project=config.projects.find(p=>p.id===id);if(!project)return null;const q=new THREE.Vector3(project.plot.center[0],0,project.plot.center[1]).project(camera),r=renderer.domElement.getBoundingClientRect();return {x:r.left+(q.x*.5+.5)*r.width,y:r.top+(-q.y*.5+.5)*r.height,visible:Math.abs(q.x)<=1&&Math.abs(q.y)<=1&&q.z<1}},config};
requestAnimationFrame(tick);
const deep=config.projects.find(p=>(p.id===decodeURIComponent(location.hash.slice(1))||p.shareSlug===decodeURIComponent(location.hash.slice(1)))&&p.status==='ready');if(deep)enterProject(deep);

async function shareAtlas(){
 const url=new URL('../',document.baseURI);if(mode==='project'&&pendingProject)url.hash=pendingProject.shareSlug||pendingProject.id;
 const button=$('atlas-share'),label=button.textContent;
 try {await navigator.clipboard.writeText(url.href);button.textContent='Link copied ✓';}
 catch {const input=document.createElement('textarea');input.value=url.href;input.style.cssText='position:fixed;top:0;left:0';document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();button.textContent=ok?'Link copied ✓':'Copy from address bar';}
 setTimeout(()=>button.textContent=label,2400);
}
$('atlas-share').onclick=shareAtlas;
const shareProject=document.createElement('button');shareProject.id='atlas-share-project';shareProject.textContent='Copy project link ↗';shareProject.onclick=shareAtlas;document.querySelector('.atlas-project-bar').append(shareProject);
