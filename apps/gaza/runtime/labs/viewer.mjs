import * as THREE from 'three';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js';
import {AREAS,EQUIPMENT,CAMERAS,LAB_BOUNDARY,projectLab} from './layout.mjs';
import {buildLabWorld} from './world.mjs';
const text=(tag,content)=>{const el=document.createElement(tag);el.textContent=content;return el};
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true};
/** No writes to ledger. All actions here are camera/display/inspection only. */
export function mountLabViewer({mount,side,onSelect,getState,getLotId}){
 document.body.classList.add('lab-detail-mode');
 const style=document.createElement('style');style.textContent=`.lab-detail-mode #world{background:#152d3b}.lab-detail-mode header{flex-wrap:wrap;height:auto;min-height:58px;padding:9px 18px}.lab-detail-mode #label{z-index:3;max-width:calc(100% - 28px);font-size:11px}.lab-detail-mode #label span{font-size:10px}.lab-detail-mode #steps{grid-template-columns:1fr 1fr}.lab-detail-mode #steps button{font-size:11px;padding:8px}.lab-tools{position:absolute;top:78px;left:12px;right:12px;display:flex;gap:5px;flex-wrap:wrap;z-index:4;pointer-events:none}.lab-tools>*{pointer-events:auto}.lab-tools button{font-size:11px;background:#133044ed;border:1px solid #648496;padding:7px 9px;min-height:34px}.lab-tools button[aria-pressed=true]{background:#337976}.lab-evidence{position:absolute;left:12px;right:12px;bottom:44px;padding:6px 9px;background:#102c3de0;border:1px solid #597783;font-size:10px;z-index:2;color:#e2e8de;pointer-events:none}.lab-detail-card{padding:12px;margin:12px 0;border:1px solid #456677;border-radius:9px;background:#102b3b;font-size:11px}.lab-detail-card h3{margin:0 0 8px;color:#a8dad3}.lab-detail-card p{margin:6px 0;font-size:11px;line-height:1.6}.lab-detail-card select{width:100%;padding:8px;background:#152e40;border:1px solid #4d7183;color:#eef5f8}.lab-detail-card dl{display:grid;grid-template-columns:1fr 1fr;gap:6px}.lab-detail-card dt{font-size:10px;color:#a1bfcf}.lab-detail-card dd{margin:0;color:#e4f3ff}.lab-detail-mode #weatherDisplay{font-size:10px}@media(max-width:820px){.lab-detail-mode #world{height:58vh;min-height:420px}.lab-detail-mode main{height:auto}.lab-detail-mode header strong{font-size:11px}.lab-tools{top:72px}.lab-tools button{padding:5px 7px;font-size:10px}.lab-evidence{font-size:9px;bottom:40px}.lab-detail-mode #steps{grid-template-columns:1fr 1fr}}`;
 document.head.append(style);
 document.querySelector('#areaLabel').textContent='LABS 3D · INTERIOR PROPUESTO';
 const sub=document.querySelector('#label span');if(sub)sub.textContent='7 áreas · equipos genéricos · mismo registro de procesos';
 const toolbar=document.createElement('div');toolbar.className='lab-tools';toolbar.id='labTools';mount.append(toolbar);
 const buttons={};function button(id,title,fn,toggle=false){const b=text('button',title);b.id=id;b.type='button';if(toggle)b.setAttribute('aria-pressed','false');b.onclick=()=>fn(b);toolbar.append(b);buttons[id]=b;return b}
 const evidence=text('div',LAB_BOUNDARY);evidence.className='lab-evidence';mount.append(evidence);
 const info=document.createElement('section');info.id='labInspector';info.className='lab-detail-card';info.innerHTML='<h3>Equipo y muestra seleccionados</h3><select id="labEquipment" aria-label="Equipo del laboratorio"></select><p id="labEquipmentDescription"></p><dl><div><dt>Estado</dt><dd id="labEquipmentState"></dd></div><div><dt>Lote seleccionado</dt><dd id="labLot"></dd></div></dl><p id="labSample"></p><p id="labQueue"></p><p>Inventario y distribución propuestos. Los equipos sin recurso asociado son ilustrativos: no ejecutan ensayos ni generan resultados.</p>';
 side.insertBefore(info,side.querySelector('#steps'));
 const $=id=>info.querySelector('#'+id),chooser=$('labEquipment');
 EQUIPMENT.forEach(e=>{const o=text('option',e.name);o.value=e.id;chooser.append(o)});
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x193442);
 const perspective=new THREE.PerspectiveCamera(44,1,.1,200),ortho=new THREE.OrthographicCamera(-19,19,12,-12,.1,200);
 let camera=perspective,cameraName='overview';
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;mount.prepend(renderer.domElement);
 renderer.domElement.style.touchAction='none';renderer.domElement.setAttribute('aria-label','Plano 3D del laboratorio propuesto. Usar botones de estaciones para navegación por teclado.');
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.12;controls.minDistance=5;controls.maxDistance=65;controls.maxPolarAngle=Math.PI*.47;
 scene.add(new THREE.HemisphereLight(0xf1f8ff,0x5e707b,2.3));const sun=new THREE.DirectionalLight(0xfff4db,2.7);sun.position.set(-12,28,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.normalBias=.025;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xc3eaff,1.25);fill.position.set(16,12,-15);scene.add(fill);
 const world=buildLabWorld(scene);let selection=0,selectedEquipment=EQUIPMENT[0].id,projection=projectLab(null,null),revisionKey='',isolate=false,roof=false,cutaway=true,routes=true,closed=false,raf=0;
 function resize(){const w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight),aspect=w/h;perspective.aspect=aspect;perspective.updateProjectionMatrix();const half=Math.max(12,18/aspect);ortho.left=-half*aspect;ortho.right=half*aspect;ortho.top=half;ortho.bottom=-half;ortho.updateProjectionMatrix();renderer.setSize(w,h)}
 const observer=new ResizeObserver(resize);observer.observe(mount);resize();
 function preset(name){const p=CAMERAS[name];camera=name==='plan'?ortho:perspective;cameraName=name;controls.object=camera;controls.enableRotate=name!=='plan';camera.up.set(0,1,0);if(name==='plan')camera.up.set(0,0,-1);camera.position.set(...p.position);controls.target.set(...p.target);camera.lookAt(controls.target);controls.update();resize()}
 function zoomStation(){const a=AREAS[selection];camera=perspective;cameraName='station';controls.object=camera;controls.enableRotate=true;camera.up.set(0,1,0);camera.position.set(a.x+7,11,a.z+10);controls.target.set(a.x,.8,a.z);controls.update()}
 const states={NO_SCENARIO:'Sin escenario',READY:'Disponible',RUNNING:'En ensayo / tarea',BUSY_OTHER_LOT:'Ocupado · otro lote',UNAVAILABLE:'Fuera de servicio',ILLUSTRATIVE:'Ilustrativo · sin ensayo',PASS:'Conforme SIM',FAIL:'Adverso SIM',INVALID:'Resultado no válido'};
 function refreshInfo(){const e=projection.instruments.find(x=>x.id===selectedEquipment)||projection.instruments[0];chooser.value=e.id;$('labEquipmentDescription').textContent=e.name+' · '+AREAS[e.station].name+(e.resource?' · recurso '+e.resource:'');$('labEquipmentState').textContent=states[e.status]||e.status;$('labLot').textContent=projection.lotId||'Sin iniciar';$('labSample').textContent=e.sampleId?'Muestra vinculada: '+e.sampleId:'Sin muestra vinculada a este equipo.';$('labQueue').textContent='Muestras registradas: '+projection.samples.length+' · ensayos activos del lote: '+projection.tokens.length+(projection.held?' · MATERIAL RETENIDO; ensayos según plan':'')+(projection.recall?' · REVISIÓN DE RETIRADA':'')}
 function focus(i){if(!AREAS[i])return;selection=i;world.focus(i);if(EQUIPMENT.find(e=>e.id===selectedEquipment)?.station!==i)selectedEquipment=EQUIPMENT.find(e=>e.station===i).id;refreshInfo()}
 chooser.onchange=()=>{const e=EQUIPMENT.find(e=>e.id===chooser.value);if(!e)return;selectedEquipment=e.id;onSelect(e.station);focus(e.station)};
 button('labOverview','Vista general',()=>preset('overview'));
 button('labPlan','Plano cenital',()=>preset('plan'));
 button('labReception','Recepción',()=>{onSelect(0);preset('reception')});
 button('labMicro','Microbiología',()=>{onSelect(2);preset('micro')});
 button('labZoom','Acercar al puesto',zoomStation);
 button('labCutaway','Muros bajos',b=>{cutaway=!cutaway;world.setCutaway(cutaway);b.setAttribute('aria-pressed',String(cutaway))},true).setAttribute('aria-pressed','true');
 button('labRoof','Cubierta',b=>{roof=!roof;world.setRoof(roof);b.setAttribute('aria-pressed',String(roof))},true);
 button('labIsolate','Aislar área',b=>{isolate=!isolate;world.setIsolation(isolate);b.setAttribute('aria-pressed',String(isolate))},true);
 button('labRoutes','Recorrido de muestras',b=>{routes=!routes;world.setRoutes(routes);b.setAttribute('aria-pressed',String(routes))},true).setAttribute('aria-pressed','true');
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
 renderer.domElement.addEventListener('click',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set(2*(e.clientX-rect.left)/rect.width-1,1-2*(e.clientY-rect.top)/rect.height);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(world.picks.filter(visible))[0];if(!hit)return;const data=hit.object.userData;if(data.equipmentId)selectedEquipment=data.equipmentId;onSelect(data.station);focus(data.station)});
 preset('overview');focus(0);world.update(projection);
 function frame(){if(closed)return;const state=getState(),lotId=getLotId(),key=(state?.revision??'none')+':'+(lotId||'none');if(key!==revisionKey){revisionKey=key;projection=projectLab(state,lotId);world.update(projection);refreshInfo()}controls.update();renderer.render(scene,camera);
  const render={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};window.__GAZA_RENDER_STATS__=render;
  window.__GAZA_LAB_DETAIL__={schemaVersion:1,...world.snapshot(),camera:cameraName,render,lotId:projection.lotId,held:projection.held,simSeconds:projection.seconds,equipment:projection.instruments.map(e=>({id:e.id,resource:e.resource,status:e.status,sampleId:e.sampleId,owner:e.owner,progress:e.progress})),samples:projection.samples,markers:projection.tokens.map(t=>({id:t.id,sampleId:t.sampleId,station:t.station,position:t.position,eligible:t.eligible})),source:'READ_ONLY_PROCESS_LEDGER_V2'};
  raf=requestAnimationFrame(frame);
 }frame();
 const fallback=document.querySelector('#fallback');fallback.textContent='WebGL · arrastra, acerca y selecciona equipos · plano y modelo propuestos';
 const dispose=()=>{if(closed)return;closed=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();world.dispose();renderer.dispose();renderer.domElement.remove();toolbar.remove();evidence.remove();info.remove();style.remove()};
 window.addEventListener('pagehide',e=>{if(!e.persisted)dispose()});
 return {focus,dispose};
}
