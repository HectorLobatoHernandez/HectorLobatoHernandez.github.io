import {loadAtlasModel} from './atlas-model-loader.mjs';
import * as THREE from 'three';
import {createProjectResident} from './atlas-project-resident.mjs';
import {createProjectLighting} from './atlas-project-lighting.mjs';
import {kelvinColor} from './atlas-city-atmosphere.mjs';
import {createAtlasBridge} from './alain-atlas-bridge.mjs';
import {createGallery} from './alain-gallery.mjs';
import {rotatePosition,zoomPosition,fitDistance} from './alain-camera-state.mjs';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {chapters,starts,layerState,buildForLayer,galleryByLayer,clamp,ramp} from './alain-layer-state.mjs';
const $=id=>document.getElementById(id);
const base=new URL('../projects/casa-alain/pilot/',import.meta.url);
const modelBase=new URL('../projects/casa-alain/layers/',import.meta.url);
const hdBase=new URL('../projects/casa-alain/gallery/',import.meta.url);
const catalog=await fetch(new URL('catalog.json',hdBase)).then(r=>{if(!r.ok)throw Error('Falta el catálogo de galerías');return r.json()});
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const manifest=await fetch(new URL('layers.json',modelBase)).then(r=>{if(!r.ok)throw Error('Falta la configuración del modelo');return r.json()});
let dirty=true,lastVisual='',frozenProgress=0,capturing=false;
let shown=0,current=-1,last=performance.now(),manual=null,selected=null,free=false,viewMode='overview',focusTransition=null;
const visibility=new Map(manifest.layers.map(l=>[l.id,true]));
const roots=new Map();const originals=new Map();
const stats={loaded:false,sourceClass:manifest.classification,actualSourceObjects:manifest.objectCount??manifest.objects?.length??0,layerCount:manifest.layers.length};
window.__ALAIN_LAYERS__={get state(){return {progress:shown,manual,selected,free,viewMode,autoRotate:orbit.autoRotate,visibility:Object.fromEntries(visibility),loaded:stats.loaded}},stats,
 snapshot(){return {camera:camera.position.toArray(),target:orbit.target.toArray(),canvas:[renderer.domElement.width,renderer.domElement.height],lighting:lighting.snapshot(),resident:occupant.snapshot(),layers:Object.fromEntries([...roots].map(([id,o])=>[id,{position:o.position.toArray(),scale:o.scale.toArray(),visible:o.visible}]))}}};
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=false;
$('canvas-host').append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e6e3db');
const camera=new THREE.PerspectiveCamera(38,1,.025,250);camera.position.set(16,13,18);
const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;orbit.enabled=false;orbit.maxDistance=85;orbit.minDistance=.3;orbit.maxPolarAngle=Math.PI*.65;orbit.target.set(0,1.3,0);orbit.autoRotateSpeed=.65;orbit.screenSpacePanning=true;orbit.addEventListener('change',()=>{dirty=true});
renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Entorno 3D. Arrastra para girar; rueda para acercar; flechas y + o menos para mover la cámara.');
const hemi=new THREE.HemisphereLight(0xffffff,0x71695e,2.3);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1dc,2.8);sun.position.set(8,20,12);scene.add(sun);
const fill=new THREE.DirectionalLight(0xdde8ff,1.7);fill.position.set(-12,10,-8);scene.add(fill);
const occupant=createProjectResident(scene,'casa-alain');const lighting=createProjectLighting(scene,'casa-alain');lighting.fit(new THREE.Vector3(10,3,8),0);
const practical=new THREE.PointLight(kelvinColor(2300),70,18,2);practical.position.set(0,2.6,0);scene.add(practical);let night=new URLSearchParams(location.search).get('night')==='1';
function setNight(value){const n=Number(value);night=n>.5;const color=(a,b)=>new THREE.Color(a).lerp(new THREE.Color(b),n);scene.background.copy(color(0xe6e3db,0x10151e));hemi.intensity=THREE.MathUtils.lerp(2.3,.36,n);hemi.color.copy(color(0xffffff,0x9caac1));sun.color.copy(color(0xfff1dc,0xb0c4e0));sun.intensity=THREE.MathUtils.lerp(2.8,.08,n);fill.intensity=THREE.MathUtils.lerp(1.7,.12,n);renderer.toneMappingExposure=THREE.MathUtils.lerp(1.1,.95,n);practical.visible=false;lighting.setNight(n);document.body.classList.toggle('project-night',night);$('project-night').textContent=night?'Noche · 2300 K':'Día';$('project-night').setAttribute('aria-pressed',String(night));dirty=true}
$('resident-toggle').onclick=()=>{const active=occupant.toggle();$('resident-toggle').setAttribute('aria-pressed',String(active));dirty=true};
$('project-light-level').oninput=e=>{lighting.setLevel(Number(e.target.value)/100);dirty=true};$('project-ambience').onclick=()=>{const value=!lighting.snapshot().ambience;lighting.setAmbience(value);$('project-ambience').setAttribute('aria-pressed',String(value));dirty=true};
$('project-night').onclick=()=>setNight(!night);setNight(night);
const planTexture=new THREE.TextureLoader().load(new URL('plan-map.webp',hdBase).href,()=>{dirty=true});planTexture.colorSpace=THREE.SRGBColorSpace;
const plan=new THREE.Mesh(new THREE.PlaneGeometry(32.565,23.393),new THREE.MeshBasicMaterial({map:planTexture,side:THREE.DoubleSide}));
plan.rotation.x=-Math.PI/2;plan.position.set(-2.615,-.185,.923);scene.add(plan);
const resize=()=>{const host=$('canvas-host'),w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true};
new ResizeObserver(resize).observe($('canvas-host'));resize();
const labels={
 'final-01.webp':'Tratamiento y techo','final-03.webp':'Iluminación indirecta','final-04.webp':'Acceso e interior',
 'final-11.webp':'Acústica lateral','final-14.webp':'Difusión y absorción','final-15.webp':'Detalle de techo',
 'final-16.webp':'Luz y relieve','final-18.webp':'Luminarias y materiales','final-19.webp':'Frente audiovisual',
 'final-21.webp':'Puesto DJ','final-22.webp':'Cine y zona DJ','final-26.webp':'Cortina y cerramientos',
 'final-28.webp':'Vista del interior','final-30.webp':'Zona de escucha','acoustic-01.webp':'Perspectiva del proyecto',
 'acoustic-06.webp':'Distribución interior','acoustic-10.webp':'Tratamiento acústico','plan-room.webp':'Plano original / Estancia 3'};
const gallery=createGallery({catalog,assetBase:hdBase,$,labels});
const selectionBox=new THREE.BoxHelper(undefined,0x2256a1);selectionBox.visible=false;scene.add(selectionBox);
function chooseLayer(id){
 selected=id;dirty=true;$('focus-layer').disabled=false;
 for(const row of $('layer-list').children)row.classList.toggle('selected',row.dataset.layer===id);
 const config=manifest.layers.find(l=>l.id===id);
 $('selection-note').textContent=config?config.name.replace(/^\d+ /,''):'';
 gallery(galleryByLayer[id]||['model-exploded','plan-room.webp','acoustic-01.webp','final-22.webp'],config?.name.replace(/^\d+ /,''));
}
function restoreLayers(){
 for(const id of visibility.keys())visibility.set(id,true);
 for(const input of $('layer-list').querySelectorAll('input'))input.checked=true;
 selected=null;dirty=true;selectionBox.visible=false;$('focus-layer').disabled=true;$('selection-note').textContent='';
 for(const row of $('layer-list').children)row.classList.remove('selected');
}
for(const config of manifest.layers){
 if(!config.objects)continue;
 const row=document.createElement('div');row.className='layer-row';row.dataset.layer=config.id;
 const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.setAttribute('aria-label','Mostrar '+config.name);
 checkbox.onchange=()=>{visibility.set(config.id,checkbox.checked);chooseLayer(config.id)};
 const name=document.createElement('button');name.className='layer-name';name.textContent=config.name.replace(/^\d+ /,'');name.onclick=()=>chooseLayer(config.id);
 const count=document.createElement('span');count.className='count';count.textContent=String(config.objects);
 const solo=document.createElement('button');solo.className='solo';solo.textContent='Aislar';solo.setAttribute('aria-label','Aislar '+config.name);
 solo.onclick=()=>{for(const id of visibility.keys())visibility.set(id,id===config.id||id==='floor');for(const r of $('layer-list').children)r.querySelector('input').checked=visibility.get(r.dataset.layer);chooseLayer(config.id);overview(false)};
 row.append(checkbox,name,count,solo);$('layer-list').append(row);
}
$('restore-layers').onclick=()=>{restoreLayers();if(current>=0)gallery(chapters[current].gallery)};
$('reset-selection').onclick=()=>{selected=null;dirty=true;selectionBox.visible=false;$('focus-layer').disabled=true;$('selection-note').textContent='';for(const row of $('layer-list').children)row.classList.remove('selected');gallery(chapters[Math.max(0,current)].gallery)};
function scrollToProgress(p){scrollTo({top:p*(document.documentElement.scrollHeight-innerHeight),behavior:'instant'})}
function jump(i){manual=null;overview();scrollToProgress(starts[clamp(i,0,7)]+.003)}
for(const [i,ch] of chapters.entries()){
 const section=document.createElement('section');section.id=ch.id;const h=document.createElement('h2');h.textContent=ch.title;section.append(h);$('scroll-chapters').append(section);
 const a=document.createElement('a');a.href='#'+ch.id;a.textContent=ch.nav;a.onclick=e=>{e.preventDefault();jump(i)};$('chapter-nav').append(a);
}
$('previous').onclick=()=>jump(current-1);$('next').onclick=()=>jump(current+1);
$('progress-range').oninput=e=>{manual=null;overview();scrollToProgress(Number(e.target.value)/1000)};
$('opening-range').oninput=e=>{manual=Number(e.target.value)/100;if(viewMode==='cinema'||viewMode==='dj'){restoreLayers();viewMode='free'}dirty=true;$('opening-value').textContent=Math.round(manual*100)+' %'};
$('auto-opening').onclick=()=>{manual=null;$('opening-value').textContent='Scroll';overview()};
function setFree(value){if(value&&!free)frozenProgress=shown;free=value;orbit.enabled=value;dirty=true;if(!value){orbit.autoRotate=false;$('auto-rotate').setAttribute('aria-pressed','false')}renderer.domElement.style.touchAction=value?'none':'pan-y';$('free-toggle').setAttribute('aria-pressed',String(value));$('free-toggle').textContent=value?'Volver al scroll':'Girar / mover'}
function explore(){if(!free){viewMode='free';setFree(true)}focusTransition=null;dirty=true}
$('free-toggle').onclick=()=>{if(free){overview(false)}else explore()};
renderer.domElement.addEventListener('pointerdown',explore,{capture:true});
renderer.domElement.addEventListener('wheel',explore,{capture:true,passive:true});
function overview(restore=true){
 viewMode='overview';setFree(false);camera.fov=38;camera.updateProjectionMatrix();
 focusTransition={from:camera.position.clone(),target:orbit.target.clone(),start:performance.now()};
 if(restore)restoreLayers();
}
$('overview').onclick=()=>overview();
function interior(which){
 orbit.autoRotate=false;$('auto-rotate').setAttribute('aria-pressed','false');
 viewMode=which;setFree(true);manual=0;$('opening-range').value='0';$('opening-value').textContent='Interior';
 for(const id of visibility.keys())visibility.set(id,!id.startsWith('wall_')&&!['roof','partition','acoustic_ceiling','lighting'].includes(id));
 for(const row of $('layer-list').children)row.querySelector('input').checked=visibility.get(row.dataset.layer);
 if(which==='cinema'){camera.position.set(2.7,1.6,.25);orbit.target.set(-3.3,1.4,-2);gallery(['model-cinema','final-19.webp','final-22.webp','final-28.webp'],'Interior cine')}
 else{camera.position.set(.3,1.65,-2.8);orbit.target.set(-2.3,1,-1.75);gallery(['model-dj','final-21.webp','final-04.webp','final-22.webp'],'Interior DJ')}
 camera.fov=65;camera.updateProjectionMatrix();orbit.update();
 $('selection-note').textContent=which==='cinema'?'Cámara interior / cine':'Cámara interior / DJ';
}
$('cinema-view').onclick=()=>interior('cinema');$('dj-view').onclick=()=>interior('dj');
function rotateView(angle){explore();camera.position.fromArray(rotatePosition(camera.position.toArray(),orbit.target.toArray(),angle));orbit.update();dirty=true}
function zoomView(factor){explore();camera.position.fromArray(zoomPosition(camera.position.toArray(),orbit.target.toArray(),factor));orbit.update();dirty=true}
function focusLayer(id=selected){
 const root=roots.get(id);if(!root)return;explore();chooseLayer(id);scene.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(root),sphere=bounds.getBoundingSphere(new THREE.Sphere());
 const direction=camera.position.clone().sub(orbit.target).normalize();
 if(direction.lengthSq()<.1)direction.set(1,.7,1).normalize();
 orbit.target.copy(sphere.center);camera.position.copy(sphere.center).addScaledVector(direction,Math.min(70,fitDistance(Math.max(.5,sphere.radius),camera.fov,camera.aspect)));
 orbit.update();dirty=true;
}
$('orbit-left').onclick=()=>rotateView(Math.PI/12);$('orbit-right').onclick=()=>rotateView(-Math.PI/12);
$('zoom-in').onclick=()=>zoomView(.8);$('zoom-out').onclick=()=>zoomView(1.25);$('focus-layer').onclick=()=>focusLayer();
$('auto-rotate').onclick=()=>{explore();orbit.autoRotate=!orbit.autoRotate;$('auto-rotate').setAttribute('aria-pressed',String(orbit.autoRotate));dirty=true};
$('top-view').onclick=()=>{explore();camera.fov=38;camera.updateProjectionMatrix();orbit.target.set(0,1,0);camera.position.set(0,Math.max(25,25/camera.aspect),.001);orbit.update();dirty=true};
renderer.domElement.addEventListener('keydown',e=>{
 if(e.key==='ArrowLeft'){e.preventDefault();rotateView(Math.PI/24)}
 if(e.key==='ArrowRight'){e.preventDefault();rotateView(-Math.PI/24)}
 if(e.key==='+'||e.key==='='){e.preventDefault();zoomView(.8)}
 if(e.key==='-'){e.preventDefault();zoomView(1.25)}
 if(e.key==='Escape'){overview(false)}
});
$('fullscreen-toggle').onclick=async()=>{
 try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}
 catch{$('selection-note').textContent='Pantalla completa no disponible en este navegador.'}
};
document.addEventListener('fullscreenchange',()=>{$('fullscreen-toggle').textContent=document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa';resize()});
$('capture-4k').onclick=()=>{
 if(!stats.loaded||capturing)return;
 capturing=true;const button=$('capture-4k'),size=new THREE.Vector2();renderer.getSize(size);
 const pixelRatio=renderer.getPixelRatio(),aspect=camera.aspect,helper=selectionBox.visible;
 button.disabled=true;button.textContent='Capturando…';
 try{
  selectionBox.visible=false;renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=16/9;camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  const data=renderer.domElement.toDataURL('image/png'),a=document.createElement('a');
  a.href=data;a.download='Casa-Alain-vista-3840x2160.png';a.click();
 }catch{$('selection-note').textContent='No se pudo capturar la vista. Puedes descargar las vistas 4K de la galería.'}
 finally{
  selectionBox.visible=helper;renderer.setPixelRatio(pixelRatio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();
  capturing=false;button.disabled=false;button.textContent='Capturar 4K';dirty=true;
 }
};
$('help-open').onclick=()=>$('help-dialog').showModal();$('help-close').onclick=()=>$('help-dialog').close();

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
 const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects([...roots.values()],true).find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent}return h.object.isMesh});
 if(hit){let obj=hit.object;while(obj&&!obj.userData.layer_id)obj=obj.parent;if(obj){chooseLayer(obj.userData.layer_id);$('selection-note').textContent=(manifest.layers.find(l=>l.id===obj.userData.layer_id)?.name.replace(/^\d+ /,'')||'Capa')+' seleccionada'}}
});
renderer.domElement.addEventListener('dblclick',()=>{if(selected)focusLayer()});
const atlasBridge=createAtlasBridge({onTheme:setNight,onStart:()=>{manual=null;overview();scrollToProgress(0);dirty=true},onProgress:p=>scrollToProgress(p),onPause:()=>{orbit.autoRotate=false;dirty=true}});
const draco=new DRACOLoader();draco.setDecoderPath(new URL('../vendor/three-r180/examples/jsm/libs/draco/gltf/',import.meta.url).href);draco.setWorkerLimit(2);
const loader=new GLTFLoader();loader.setDRACOLoader(draco);
try{
 const gltf=await loadAtlasModel(loader,new URL('model.parts.json',modelBase).href,e=>{$('loading-progress').textContent=e.total?Math.round(e.loaded/e.total*100)+' %':Math.round(e.loaded/1048576)+' MB'});
 gltf.scene.traverse(obj=>{
  if(obj.userData.layer_id&&Array.isArray(obj.userData.explode_vector)&&!obj.isMesh){
   const id=obj.userData.layer_id;roots.set(id,obj);
   originals.set(id,{position:obj.position.clone(),scale:obj.scale.clone()});
  }
  if(obj.isMesh){obj.castShadow=false;obj.receiveShadow=false}
 });
 scene.add(gltf.scene);
 stats.loaded=true;stats.meshes=0;stats.triangles=0;
 gltf.scene.traverse(o=>{if(o.isMesh){stats.meshes++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3}});
 $('loading').hidden=true;dirty=true;draco.dispose();atlasBridge.ready();
}catch(error){$('loading').textContent='No se pudo cargar el modelo: '+error.message;stats.error=String(error);atlasBridge.error();console.error(error)}
function paint(now){
 atlasBridge.tick(now);
 const target=free?frozenProgress:clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)),dt=Math.min(64,now-last);last=now;
 shown=reduced?target:shown+(target-shown)*(1-Math.exp(-dt/75));if(Math.abs(shown-target)<.00001)shown=target;
 const state=layerState(shown,manual);
 if(state.index!==current){
  current=state.index;const ch=state.chapter;$('chapter-number').textContent=String(current+1).padStart(2,'0')+' / 08';$('chapter-title').textContent=ch.title;$('chapter-copy').textContent=ch.copy;$('view-label').textContent=ch.nav;
  if(!selected&&viewMode==='overview')gallery(ch.gallery);
  [...$('chapter-nav').children].forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});
  $('previous').disabled=current===0;$('next').disabled=current===7;
 }
 const visual=[shown.toFixed(5),manual,viewMode,selected,...visibility.values()].join('|');
 if(visual!==lastVisual){dirty=true;lastVisual=visual;
 for(const [id,obj] of roots){
  const config=manifest.layers.find(l=>l.id===id),original=originals.get(id);
  let amount=id==='roof'?state.roof:id.startsWith('wall_')||id==='partition'||id==='openings'?state.walls:id.startsWith('acoustic')?state.acoustic:['av','lighting'].includes(id)?state.systems:0;
  if(viewMode!=='overview'&&viewMode!=='free')amount=0;
  const v=config.offset;obj.position.copy(original.position).addScaledVector(new THREE.Vector3(v[0],v[2],-v[1]),amount);
  obj.scale.copy(original.scale);obj.scale.y*=viewMode==='overview'&&manual===null?buildForLayer(id,shown):1;
  obj.visible=visibility.get(id)!==false;
 }
 if(selected&&roots.has(selected)){selectionBox.setFromObject(roots.get(selected));selectionBox.visible=visibility.get(selected)!==false}else selectionBox.visible=false;
 }
 if(!free){
  const opening=Math.max(state.roof,state.walls),pos=new THREE.Vector3(16,13,18).lerp(new THREE.Vector3(25,23,29),opening),look=new THREE.Vector3(0,1.3,0).lerp(new THREE.Vector3(0,3,0),opening);
  const fit=Math.max(1,1.15/camera.aspect);pos.sub(look).multiplyScalar(fit).add(look);
  if(focusTransition){const q=reduced?1:ramp((now-focusTransition.start)/700,0,1);pos.lerp(focusTransition.from,1-q);look.lerp(focusTransition.target,1-q);if(q===1)focusTransition=null}
  if(camera.position.distanceToSquared(pos)>.0000001||orbit.target.distanceToSquared(look)>.0000001)dirty=true;
  camera.position.copy(pos);camera.lookAt(look);orbit.target.copy(look);
 }else if(orbit.update())dirty=true;
 $('progress-fill').style.width=shown*100+'%';$('percentage').textContent=Math.round(shown*100)+' %';
 if(document.activeElement!==$('progress-range'))$('progress-range').value=String(Math.round(shown*1000));
 if(manual===null){$('opening-range').value=String(Math.round(Math.max(state.roof,state.walls)*100));$('opening-value').textContent='Scroll'}
 occupant.setBuilt(shown>=.19||manual!==null);if(!atlasBridge.suspended&&occupant.tick(now))dirty=true;
 if(dirty&&!capturing&&!atlasBridge.suspended){renderer.render(scene,camera);dirty=false}requestAnimationFrame(paint);
}
requestAnimationFrame(paint);
