import {mountMobileScene} from './mobile/scene.mjs';
import {processStore} from './processes/store.mjs';
import {mountLivingScene} from './living/scene.mjs';
import {propagateMode} from './demo/session.mjs';
const LEGACY_KEY=processStore.scope.legacy;
import {mountProcessPanel} from './processes/panel.mjs';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildExterior} from './site-real-world.mjs?release=gaza-site-docks-v23';
import {mountPlantDetail} from './plant/panel.mjs?release=gaza-site-docks-v23';
import {mountSiteDockPanel} from './docks/site-panel.mjs?release=gaza-site-docks-v23';
import {normalizeGeoJSON,overpassToGeoJSON,ribbon,readLedger,ORIGIN} from './site-real-core.mjs';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search),qa=params.get('qa')==='1',frozen=params.get('freeze')==='1';
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.4,6000),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.domElement.id='siteCanvas';$('viewport').prepend(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.485;controls.minDistance=8;controls.maxDistance=2500;
const sun=new THREE.DirectionalLight('#fff6e4',3);sun.position.set(-180,230,80);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-230,right:230,top:260,bottom:-260,near:1,far:900});sun.shadow.normalBias=.15;scene.add(sun,new THREE.HemisphereLight('#e5eff6','#575440',2.2));
const world=buildExterior(THREE);scene.add(world.root);const gisGroup=new THREE.Group();scene.add(gisGroup);gisGroup.visible=false;const gisSelectable=[];
let processState=null,processView=null,processError=null,living=null;const requestedLight=params.get('light');let initialLightApplied=false;let lightingChoice=['auto','sim','day','night','dusk'].includes(requestedLight)?requestedLight:'auto';
mountProcessPanel(document.querySelector('aside'),{module:'site'});
const startup={phase:'initializing',startedAt:performance.now(),compileMs:null,firstFrameMs:null,error:null};
let geometryQA=[],mode='study',geo=null,paused=qa||frozen||matchMedia('(prefers-reduced-motion: reduce)').matches,follow=false,ledger=null,dirty=true,last=performance.now(),elapsed=0,frameCount=0,selected=null;
processStore.subscribe(({state,error})=>{processState=state;processError=error;processView=processStore.view();if(state?.config?.living?.environment){if(requestedLight&&!initialLightApplied&&['auto','sim','day','night','dusk'].includes(requestedLight)){initialLightApplied=true;queueMicrotask(()=>chooseLight(requestedLight))}else lightingChoice=state.config.living.environment}dirty=true;syncLedger();syncLightButtons();});
const cameras={overview:{p:[-245,170,268],t:[0,6,0]},facade:{p:[-162,46,58],t:[-14,8,-13]},access1:{p:[-120,24,-167],t:[-43,7,-91]},access2:{p:[-133,26,149],t:[-33,5,82]},top:{p:[-8,440,2],t:[0,0,0]}};
function cameraTo(name){const c=cameras[name]||cameras.overview;follow=false;camera.position.set(...c.p);controls.target.set(...c.t);controls.update();dirty=true;$('follow').setAttribute('aria-pressed','false')}
cameraTo(params.get('camera')||'overview');
function resize(){const w=$('viewport').clientWidth,h=$('viewport').clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);dirty=true}new ResizeObserver(resize).observe($('viewport'));resize();controls.addEventListener('change',()=>dirty=true);
function setMode(next){mode=next;world.root.visible=next==='study';gisGroup.visible=next==='gis';$('study').setAttribute('aria-pressed',String(next==='study'));$('gis').setAttribute('aria-pressed',String(next==='gis'));$('boundary').textContent=next==='study'?'EXTERIOR INFERIDO · fachada basada en las fotos. Cotas, posición, interiores y tráfico de este estudio son propuestas, no as-built.':'CONTEXTO CARTOGRÁFICO · X este / Y altura / Z sur. Ancla aproximada. Geometría OSM cuando se carga; anchos y alturas inferidos se indican por objeto.';follow=false;cameraTo('overview');if(next==='gis'){camera.position.set(-600,650,700);controls.target.set(0,0,0);controls.update()}dirty=true;publish()}
const plantDetail=mountPlantDetail({THREE,world,camera,controls,ensureStudy:()=>{if(mode!=='study')setMode('study');follow=false;},dirty:()=>dirty=true,getState:()=>processState,getLotId:()=>processStore.selected});
const dockPanel=mountSiteDockPanel({onOpen:area=>{plantDetail.open(area);$('docksQuick').setAttribute('aria-pressed','true');$('docksQuick').textContent=area==='asrs'?'Almacén abierto · ver muelles':'Muelles abiertos · ver almacén';world.setDockPreview(true);dirty=true},onTruck:truck=>{world.setDockTruck(truck);dirty=true},onPractice:active=>{world.setDockPractice(active);dirty=true}});
living=mountLivingScene(THREE,{scene,world,kind:'site',camera,controls,getState:()=>processState,getLotId:()=>processStore.selected,dirty:()=>dirty=true});window.__GAZA_LIVING_ACTIONS__=living;
const links=document.createElement('div');links.className='row';links.innerHTML='<button id="enterMasterFarm">Granja proveedora →</button><button id="enterQualityLab">Laboratorio de calidad →</button>';document.querySelector('aside').prepend(links);for(const [id,target]of [['enterMasterFarm','farm'],['enterQualityLab','labs']])document.getElementById(id).onclick=()=>{if(parent!==window)parent.postMessage({type:'GAZA_NAVIGATE_V1',target},location.origin);else location.href=propagateMode('mission-control.html?view='+target,location.search)};
$('study').onclick=()=>setMode('study');$('gis').onclick=()=>setMode('gis');document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{if(mode!=='study')setMode('study');cameraTo(b.dataset.camera)});
$('follow').onclick=()=>{if(mode!=='study')setMode('study');follow=!follow;$('follow').setAttribute('aria-pressed',String(follow));dirty=true};
function syncCutawayUI(){const open=$('cutaway').checked,t=$('cutawayToggle'),q=$('roofQuick');if(t){t.textContent=open?'Poner cubiertas':'Quitar cubiertas';t.setAttribute('aria-pressed',String(open))}if(q){q.textContent=open?'Poner cubiertas':'Quitar cubiertas · ver procesos';q.setAttribute('aria-pressed',String(open))}}$('cutaway').onchange=()=>{if($('cutaway').checked&&mode!=='study')setMode('study');world.setCutaway($('cutaway').checked);syncCutawayUI();dirty=true;publish()};$('cutawayToggle').onclick=()=>{$('cutaway').checked=!$('cutaway').checked;$('cutaway').dispatchEvent(new Event('change',{bubbles:true}))};$('roofQuick').onclick=()=>$('cutawayToggle').click();syncCutawayUI();$('labels').onchange=()=>{world.labels.visible=$('labels').checked;dirty=true};$('routes').onchange=()=>{world.routes.visible=$('routes').checked;dirty=true};
try{if(parent!==window&&!qa&&!frozen)paused=parent.document.getElementById('livingMotion')?.getAttribute('aria-pressed')!=='true'}catch{}function pauseUI(){$('pause').textContent=paused?'Reanudar':'Pausar';$('pause').setAttribute('aria-pressed',String(paused))}pauseUI();$('pause').onclick=()=>{paused=!paused;pauseUI();publish()};$('reset').onclick=()=>{world.moving.forEach((v,i)=>{v.elapsed=i?8:0;v.previousDistance=0});elapsed=0;world.update(0,{held:ledger?.held});dirty=true;publish()};
const rainGeo=new THREE.BufferGeometry(),rainArray=new Float32Array(1500*3);for(let i=0;i<1500;i++){rainArray[i*3]=Math.sin(i*13.37)*155;rainArray[i*3+1]=(i*7.91)%90;rainArray[i*3+2]=Math.cos(i*8.37)*183}rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:'#bed3df',size:.32,transparent:true,opacity:.65}));scene.add(rain);
function ambience(){const env=living?.snapshot()?.environment;const hour=lightingChoice==='night'?23:lightingChoice==='day'?13:lightingChoice==='dusk'?19:Number($('hour').value);$('hourLabel').textContent=String(Math.floor(env?.hour??hour)).padStart(2,'0')+':00';living?.update(true);rain.visible=$('weather').value==='rain';dirty=true;publish()}
function syncLightButtons(){document.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light===lightingChoice)));$('lightStatus').textContent=(lightingChoice==='night'?'Noche con luminarias encendidas':lightingChoice==='day'?'Vista diurna':lightingChoice==='auto'?'Hora real de España':'Horario del escenario')+' · SIMULADO · hora real independiente';}
async function chooseLight(choice,persist=true){lightingChoice=choice;syncLightButtons();living?.setLightMode(choice);if(persist&&processState){try{await processStore.dispatch({type:'LIVING_SETTINGS',environment:choice})}catch(e){$('lightStatus').textContent='Vista '+choice+' · registro no modificado: '+e.message}}else if(!processState)ambience();dirty=true;publish()}
document.querySelectorAll('[data-light]').forEach(b=>b.onclick=()=>chooseLight(b.dataset.light));syncLightButtons();
window.addEventListener('message',e=>{if(e.source!==parent||e.origin!==location.origin)return;if(e.data?.type==='GAZA_SCENE_LIGHT_V1')chooseLight(e.data.mode,false);if(e.data?.type==='GAZA_SCENE_MOTION_V1'&&!qa&&!frozen){paused=!e.data.active;pauseUI();dirty=true}});try{if(parent!==window)chooseLight(parent.document.getElementById('livingEnvironment')?.value||'auto',false)}catch{}
$('hour').oninput=()=>{const h=Number($('hour').value);chooseLight(h<7||h>=20?'night':h>=18?'dusk':'day')};$('weather').onchange=ambience;
function syncLedger(){try{ledger=readLedger(JSON.parse(localStorage.getItem(LEGACY_KEY)||'null'))}catch{ledger=null}$('ledger').textContent=ledger?`${processStore.scope.label}\n${ledger.lotId}\n${ledger.department} · ${ledger.status}\n${ledger.quality} · SIMULADO`:'Sin lote de Workflow. Circulación escénica autónoma; no son entregas reales.';dirty=true;publish()}
addEventListener('storage',e=>{if(e.key===LEGACY_KEY)syncLedger()});addEventListener('focus',syncLedger);syncLedger();
let pointerStart=null;const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();renderer.domElement.addEventListener('pointerdown',e=>pointerStart=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);const items=(mode==='study'?world.selectable:gisSelectable).filter(o=>{let p=o;while(p){if(!p.visible)return false;p=p.parent}return true});const hit=ray.intersectObjects(items,false)[0];if(hit)inspect(hit.object.userData)});
function inspect(data){selected=data;plantDetail.inspect(data);$('inspection').textContent=[data.title||data.name||data.id,data.description||'',data.provenance||'',data.height?`Altura: ${data.height.meters} m · ${data.height.source}`:'',data.width?`Ancho: ${data.width.meters} m · ${data.width.source}`:''].filter(Boolean).join('\n');$('openDepartment').hidden=!data.target;publish()}
$('openDepartment').onclick=()=>{if(!['labs','workflow'].includes(selected?.target))return;window.top.location.href=propagateMode('mission-control.html?view='+selected.target,location.search)};
function disposeGIS(){const materials=new Set();gisGroup.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material)});materials.forEach(m=>m.dispose());gisGroup.clear();gisSelectable.length=0}
function applyGeo(input,source){const next=normalizeGeoJSON(input,{source});if(!next.roads.length&&!next.buildings.length)throw new Error('No hay viales o edificios válidos en el área. Se mantiene la escena anterior.');disposeGIS();geometryQA=[];geo=next;const roadMat=new THREE.MeshStandardMaterial({color:'#465966',roughness:1,side:THREE.DoubleSide});const floor=new THREE.Mesh(new THREE.PlaneGeometry(4500,4500),new THREE.MeshStandardMaterial({color:'#6c805f'}));floor.rotation.x=-Math.PI/2;floor.position.y=-.03;gisGroup.add(floor);
 for(const road of geo.roads){const r=ribbon(road.points,road.width.meters),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(r.positions,3));g.setIndex(r.indices);g.computeVertexNormals();const m=new THREE.Mesh(g,roadMat);m.userData={...road,title:road.name,provenance:source,description:'Eje de la geometría importada sin spline. No confirma señales ni acceso privado.'};gisGroup.add(m);gisSelectable.push(m)}
 const material=new THREE.MeshStandardMaterial({color:'#bcc5c3',roughness:.8});
 for(const b of geo.buildings){const shape=new THREE.Shape(b.rings[0].map(([east,north])=>new THREE.Vector2(east,north)));for(const hole of b.rings.slice(1))shape.holes.push(new THREE.Path(hole.map(([e,n])=>new THREE.Vector2(e,n))));const g=new THREE.ExtrudeGeometry(shape,{depth:b.height.meters,bevelEnabled:false});g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,material);m.userData={...b,title:b.name,provenance:source,description:'Huella cartográfica; sin validación de interior o fachada.'};m.castShadow=true;gisGroup.add(m);gisSelectable.push(m);if(qa){const bnd=new THREE.Box3().setFromObject(m);geometryQA.push({id:b.id,min:bnd.min.toArray(),max:bnd.max.toArray()})}}
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,15,10),new THREE.MeshStandardMaterial({color:'#bc4149'}));pole.position.set(0,7.5,0);gisGroup.add(pole);
 $('status').textContent=`${source}: ${geo.roads.length} viales · ${geo.buildings.length} edificios · ${geo.rejected} descartados. Anchos/alturas se inspeccionan por elemento.`;$('export').disabled=false;setMode('gis');publish();}
let busy=false;
$('load').onclick=async()=>{if(busy)return;busy=true;$('load').disabled=true;$('status').textContent='Consultando Overpass… (límite 30 s; sin reintentos automáticos)';const box='41.5163635,-5.6095288,41.5307365,-5.5903312',query=`[out:json][timeout:25];(way["highway"](${box});way["building"](${box}););out geom;`;try{const response=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(query),{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error('HTTP '+response.status);applyGeo(overpassToGeoJSON(await response.json()),'OSM_PUBLIC_REFERENCE')}catch(e){$('status').textContent='OSM no disponible: '+e.message+'. Se conserva lo que ya estaba cargado. Puedes importar GeoJSON local.'}finally{busy=false;$('load').disabled=false;publish()}};
$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>10*1024*1024)throw new Error('Archivo mayor de 10 MB');applyGeo(JSON.parse(await f.text()),'IMPORTED_GEOJSON_SOURCE_TO_VALIDATE')}catch(err){$('status').textContent='Importación rechazada: '+err.message}finally{e.target.value=''}};
$('export').onclick=()=>{if(!geo)return;const payload={...geo.original,siteReal:{anchor:ORIGIN,source:geo.source,geometryCRS:'EPSG:4326',renderAxes:'X_EAST_Y_UP_Z_SOUTH',derivedWidthsAndHeights:'INFERRED_NOT_SURVEYED',attribution:geo.source==='OSM_PUBLIC_REFERENCE'?'© OpenStreetMap contributors / ODbL':'See original file; source not verified'}},url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/geo+json'})),a=document.createElement('a');a.href=url;a.download='gaza-site-context.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
function publish(){window.__GAZA_SITE_REAL__={schemaVersion:2,startup:{...startup},processScope:processStore.scope.id,living:living?.snapshot()||null,lighting:{mode:lightingChoice,background:scene.background?.getHexString(),sunIntensity:sun.intensity},state:startup.phase==='ready'?'ready':startup.phase,mode,paused,freeze:frozen,qa,cutaway:world.interior.visible,roofAction:$('cutaway').checked?'PONER_CUBIERTA':'QUITAR_CUBIERTA',geometryQA,source:geo?.source||'NO_REMOTE_GEODATA',roads:geo?.roads.length||0,buildings:geo?.buildings.length||0,axes:'X_EAST_Y_UP_Z_SOUTH',geometry:world.meta,ledger,weatherMode:'SIMULATED',elapsed,selected:selected?.id||null,process:processView,actors:world.moving.map(m=>({id:m.id,position:m.position,heading:m.heading,phase:m.phase,forwardAxis:'+X'})),render:window.__GAZA_SITE_RENDER_STATS__||null};dispatchEvent(new CustomEvent('gaza-site-real-state',{detail:window.__GAZA_SITE_REAL__}))}
// Bound visual work independently of ledger writes. A paused scene renders on demand.
// Shader compilation is prepared asynchronously below; no readiness is published before a real draw.
const mobile=mountMobileScene({T:THREE,kind:'site',renderer,controls,mount:$('viewport'),side:document.querySelector('aside'),getState:()=>processState,onOverview:()=>cameraTo('overview'),onDetail:()=>plantDetail.open('process')});
 document.addEventListener('gaza-scene-invalidate',()=>dirty=true);
 function frame(now){
 requestAnimationFrame(frame);
 if(!mobile.visible){last=now;return;}
 if(now-last<1000/30)return;
 const raw=Math.min(.08,(now-last)/1000);last=now;
 const dt=(!paused&&!frozen&&mode==='study')?raw*Number($('speed').value):0;elapsed+=dt;
 if(processState?.clock.running&&!qa&&!frozen)dirty=true;
 const displayState=living?.displayState()||processState;
 const processDt=dt; // Ambient yard traffic uses scene time; ledger tasks retain their own authoritative clock.
 // UI handlers and the process observer invalidate the scene. Idle frames must not traverse
 // hundreds of machines and materials while another GAZA map is compiling/rendering.
 if(dirty||dt>0){
  plantDetail.update();if(displayState!==processState)plantDetail.animate(displayState);
  const activeTrip=processState&&['LOGISTICS.TRANSIT','DELIVERY.ARRIVE'].some(id=>processState.lots?.[processStore.selected]?.tasks?.[id]?.status==='RUNNING');
  world.update(processDt,{held:processView?processView.held:!!ledger?.held,process:activeTrip?{state:displayState,lotId:processStore.selected}:null});
  living?.update();
  if(rain.visible&&dt){for(let i=1;i<rainArray.length;i+=3)rainArray[i]=(rainArray[i]-dt*35+90)%90;rainGeo.attributes.position.needsUpdate=true}
 }
 if(follow){const v=world.moving[0].tractor.position;camera.position.lerp(v.clone().add(new THREE.Vector3(-26,16,24)),.05);controls.target.lerp(v,.08)}
 controls.update();
 if(dirty||dt>0){
  const drawStart=performance.now();renderer.render(scene,camera);dirty=false;frameCount++;
  if(startup.firstFrameMs===null){startup.firstFrameMs=Math.round(performance.now()-startup.startedAt);startup.phase='ready';$('loading').hidden=true;}
  window.__GAZA_SITE_RENDER_STATS__={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawMs:Math.round(performance.now()-drawStart),frames:frameCount};
  $('stats').textContent=`GPU: ${renderer.info.render.calls} draws · ${renderer.info.render.triangles.toLocaleString('es-ES')} triángulos · ${renderer.info.memory.geometries} geometrías`;
  $('tankerStatus').textContent='CISTERNA / ACCESO 2 · '+world.moving[0].phase;
  $('trailerStatus').textContent='TRÁILER / ACCESO 1 · '+world.moving[1].phase;
  publish();
 }
}
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;startup.phase='context-lost';publish();$('loading').hidden=false;$('loading').textContent='Contexto gráfico perdido. Recarga para recuperar la escena.'});
setInterval(()=>{if(lightingChoice==='auto'){living?.update(true);dirty=true}},30000);ambience();if(params.has('dept'))plantDetail.open(params.get('dept'));
$('loading').hidden=false;$('loading').textContent='Preparando planta, materiales e iluminación…';publish();
async function startRendering(){
 try{
  const compileStart=performance.now();startup.phase='compiling';publish();
  // Three r180 uses KHR_parallel_shader_compile when available. This avoids a synchronous
  // first-draw compilation stall while Farm/Labs remain connected to the same ledger.
  // https://threejs.org/docs/pages/WebGLRenderer.html#compileAsync
  await renderer.compileAsync(scene,camera);
  startup.compileMs=Math.round(performance.now()-compileStart);startup.phase='first-frame';
  dirty=true;last=performance.now()-1000/30;publish();requestAnimationFrame(frame);
 }catch(error){startup.phase='error';startup.error=String(error?.message||error);$('loading').hidden=false;$('loading').textContent='No se pudo preparar el motor 3D: '+startup.error;publish();console.error('GAZA plant graphics initialization',error);}
}
void startRendering();
