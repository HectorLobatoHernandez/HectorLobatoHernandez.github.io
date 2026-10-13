import {environmentOf,roleActivity,cargoOf,LIVE_RELEASE} from './model.mjs';
import {createActivityMotion} from './motion.mjs';
import {interpolateForDisplay} from './motion-model.mjs';
import {livingAssets} from './assets.mjs';
import {PARCEL,BUILDINGS,point,frame as farmFrame} from '../farm/site.mjs';
import {DEPARTMENTS} from '../plant/model.mjs';
import {AREAS} from '../labs/layout.mjs';
/** Rendering is a read-only projection. Neither frame rate nor lights can write milk or quality. */
export function mountLivingScene(T,{scene,world,kind,getState,getLotId,camera=null,controls=null,renderer=null,dirty=()=>{}}){
 const priorLights=[];scene.traverse(o=>{if(o.isLight)priorLights.push(o)});
 // UI/ledger updates remain immediate. Only repeated pixel draws are budgeted.
 let renderDirty=true,renderAt=-Infinity,renderCamera='',draws=0,skippedDraws=0,parentActive=true;
 const invalidate=()=>{renderDirty=true;};
 const activation=e=>{if(e.source===window.parent&&e.origin===location.origin&&e.data?.type==='GAZA_VIEW_VISIBILITY_V1'){parentActive=!!e.data.active;if(parentActive)invalidate();}};
 // Redraw when actual resources finish loading, not once per second forever.
 // A single paused farm redraw can block a software GPU for seconds while Labs/Plant boot.
 const manager=T.DefaultLoadingManager,previousLoad=manager.onLoad;
 const resourcesLoaded=(...args)=>{if(typeof previousLoad==='function')previousLoad(...args);invalidate();dirty();};
 manager.onLoad=resourcesLoaded;
 document.fonts?.ready.then(()=>{invalidate();dirty();});
 const originalRender=renderer?.render;
 if(renderer){
  renderer.render=function(s,c){
   const now=performance.now(),key=[...c.position.toArray(),...c.quaternion.toArray(),c.zoom,...c.projectionMatrix.elements,renderer.domElement.width,renderer.domElement.height].join(',');
   const shown=parentActive&&!document.hidden&&renderer.domElement.getClientRects().length>0;
   if(draws&&(!shown||now-renderAt<1000/30||(!renderDirty&&key===renderCamera))){skippedDraws++;return;}
   originalRender.call(this,s,c);draws++;renderAt=now;renderCamera=key;renderDirty=false;
  };
  for(const type of ['click','input','change','pointerdown','pointerup','gaza-scene-invalidate'])document.addEventListener(type,invalidate,true);
  window.addEventListener('message',activation);document.addEventListener('visibilitychange',invalidate);
 }
 const assets=livingAssets(T),root=new T.Group();root.name='LIVING_SCENE_'+kind;(kind==='farm'?world.site:world.root).add(root);
 const pools=[],lights=[],uniforms=[],batches=new Map(),machineScreens=[],transportLayers=[];let lastKey='',last=null,cargoOpen=false,inspection='',cartons=null,stock=null,fixtureCount=0;const stockDetails=[],outboundPanels=[];
 function batch(parent,geo,material,pos,scale,rotation=[0,0,0]){const k=parent.uuid+geo.uuid+material.uuid;let b=batches.get(k);if(!b){b={parent,geo,material,items:[]};batches.set(k,b)}b.items.push({pos,scale,rotation});}
 function lamp(parent,x,z,height=7,inside=false){fixtureCount++;
  if(!inside){batch(parent,assets.cylinder,assets.m.dark,[x,height/2,z],[.09,height,.09]);batch(parent,assets.cube,assets.m.dark,[x+.65,height,z],[1.4,.10,.18]);}
  batch(parent,assets.cube,assets.m.lamp,[x+(inside?0:1.18),height-.08,z],[inside?1.5:.6,.10,inside?.4:.3]);
  const g=assets.keepG(new T.PlaneGeometry(inside?8:19,inside?8:19));const pool=new T.Mesh(g,assets.poolMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(x,.58,z);pool.renderOrder=2;parent.add(pool);pools.push(pool);
  if(lights.filter(p=>p.inside===inside).length<(inside?(kind==='labs'?7:4):3)){const light=new T.PointLight(inside?0xe1eeff:0xffd5a4,0,inside?18:42,2);light.position.set(x,height-.2,z);parent.add(light);lights.push({light,inside});}
 }
 if(kind==='farm'){
  const ring=PARCEL.map(point);for(let i=0;i<ring.length;i+=2){const a=ring[i],b=ring[(i+1)%ring.length];lamp(root,(a[0]+b[0])/2,(a[1]+b[1])/2);}
  for(const b of world.buildings.values()){for(const x of [-b.f.w*.3,b.f.w*.3])lamp(b.inside,x,0,b.height-.65,true);}
 }else if(kind==='site'){
  for(const z of [-120,-75,-25,25,75,120]){lamp(root,-60,z);lamp(root,69,z);}
  for(const d of DEPARTMENTS.filter(d=>d.id!=='parking')){const g=world.root.getObjectByName(d.id);if(g)lamp(g,d.x,d.z,Math.min(8,d.id==='asrs'?26:5),true);}
 }else{
  for(const r of world.rooms){const a=AREAS[r.station];lamp(r.g,a.x,a.z,3.1,true);}
 }
 // Replace the render of existing people, not their identity, task or path.
 const people=[];world.root.traverse(o=>{
  if(kind==='farm'&&/^SIM-(FARM-01|FARM-02|FARM-03|FARM-OVI|VET-01|DRIVER-01|CLEAN-01|COLD)$/.test(o.name))people.push({old:o,role:o.name==='SIM-COLD'?'SIM-FARM-03':o.name==='SIM-FARM-OVI'?'SIM-FARM-02':o.name});
  if(kind==='labs'&&/^SIM-LAB-STAFF-\d$/.test(o.name))people.push({old:o,role:o.name.endsWith('6')?'SIM-QA-01':o.name.endsWith('0')?'SIM-SAMPLER-01':'SIM-LAB-01'});
  if(kind==='site'&&o.userData?.livingRole)people.push({old:o,role:o.userData.livingRole});
 });
 for(const p of people){const profile=p.role.includes('DRIVER')||p.role.includes('SHIPPING')?'driver':p.role.includes('LAB')||p.role.includes('QA')||p.role.includes('SAMPLER')?'vet':p.role.includes('CLEAN')?'clean':p.role==='SIM-FARM-03'||p.role.includes('PACK')||p.role.includes('PROD')?'milk':'farm';const u=assets.worker(p.old,p.role,profile);uniforms.push(u);}
 if(kind==='site'){
  for(const v of world.moving)transportLayers.push(assets.transport(v));
  const outbound=world.moving.find(v=>v.id==='SIM-TRAILER-1');
  for(const child of outbound.load.children)if(child.geometry?.type==='PlaneGeometry'&&child.material?.map){child.material.side=T.FrontSide;outboundPanels.push(child);}
  const worklight=new T.PointLight(0xe4efff,0,15,2);worklight.position.set(0,4.3,0);outbound.load.add(worklight);lights.push({light:worklight,inside:true,cargo:true});
  const solid=outbound.load.children.find(o=>o.geometry?.type==='BoxGeometry'&&Math.abs(o.scale.y-3)<.01);if(solid)solid.name='OUTBOUND_CLOSED_BODY';
  cartons=assets.cargo(outbound.load,Array.from({length:12},(_,i)=>[-3.15+Math.floor(i/2)*1.26,.8,i%2?.62:-.62]));cartons.setCount(0);
  const glyphs=[];world.root.traverse(o=>{if(o.name==='SELECTED_LOT_PALLET_GLYPH')glyphs.push(o)});world.root.updateMatrixWorld(true);for(const g of glyphs){const before=[...g.children],bounds=new T.Box3().setFromObject(g),pos=bounds.getCenter(new T.Vector3());g.worldToLocal(pos);const detail=assets.cargo(g,[[pos.x,bounds.min.y+.1,pos.z]]);detail.setCount(1);before.forEach(o=>o.visible=false);stockDetails.push({g,before,detail})}
  world.root.traverse(o=>{if(o.userData?.deptId&&o.userData?.id&&o.isGroup){const p=o.children.find(c=>c.isMesh&&c.geometry?.type==='BoxGeometry');if(p){const screen=assets.box(o,[p.position.x,p.position.y+.6,p.position.z+.82],[.55,.35,.03],assets.m.screen);machineScreens.push({screen,dept:o.userData.deptId});assets.box(o,[p.position.x-.7,p.position.y-.1,p.position.z+.85],[.23,.09,.06],assets.m.dark);}}});
  world.actors.children.filter(o=>o.name.startsWith('SIM-STAFF-CAR')).forEach((c,i)=>{for(const sign of [-1,1]){assets.box(c,[2.04,.84,sign*.65],[.08,.18,.40],assets.m.lamp);assets.box(c,[-2.04,.84,sign*.65],[.08,.17,.33],assets.m.red);for(const x of [-1.18,1.18]){const w=assets.part(c,assets.cylinder,assets.m.dark,[x,.4,sign*.93],[.35,.19,.35],[Math.PI/2,0,0]);}}assets.box(c,[0,1.86,0],[1.2,.07,1.3],assets.m.dark);assets.box(c,[1.1,1.35,1],[.3,.15,.16],assets.m.dark);assets.box(c,[1.1,1.35,-1],[.3,.15,.16],assets.m.dark);});
  assets.board(root,'ACCESOS · PLANTA / CALIDAD',[-54,2.5,104],4).rotation.y=-Math.PI/2;
 }
 const dummy=new T.Object3D(),instances=[];for(const b of batches.values()){const o=new T.InstancedMesh(b.geo,b.material,b.items.length);b.items.forEach((p,i)=>{dummy.position.set(...p.pos);dummy.scale.set(...p.scale);dummy.rotation.set(...p.rotation);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix)});o.castShadow=false;o.receiveShadow=true;o.instanceMatrix.needsUpdate=true;b.parent.add(o);instances.push(o);}
 const activityMotion=createActivityMotion({kind,world,uniforms});let tickRevision=null,tickSeenAt=0,lastMotionKey='';
 function displayState(){const s=getState();if(s?.revision!==tickRevision){tickRevision=s?.revision;tickSeenAt=performance.now()}return interpolateForDisplay(s,(performance.now()-tickSeenAt)/1000)}
 const sceneKey='__GAZA_LIVING_'+kind.toUpperCase()+'__';
 function refresh(force=false){const s=getState(),lot=getLotId(),key=JSON.stringify([s?.revision,lot,cargoOpen]);if(!force&&key===lastKey)return false;lastKey=key;invalidate();const env=environmentOf(s),dark=env.darkness;last=env;
  const bg=new T.Color(0x07101f).lerp(new T.Color(0x839da9),env.daylight);scene.background=bg;if(scene.fog)scene.fog.color.copy(bg);
  for(const light of priorLights){if(light.isHemisphereLight)light.intensity=env.ambientIntensity;else if(light.isDirectionalLight)light.intensity=(light.castShadow?1:.4)*env.sunIntensity;}
  assets.m.lamp.emissiveIntensity=dark*3.8;assets.m.red.emissiveIntensity=dark*1.8;assets.poolMaterial.opacity=dark*.9;
  for(const p of pools)p.visible=dark>.08;
  for(const {light,inside,cargo:bay}of lights){light.visible=bay?cargoOpen:(inside||dark>.45);light.intensity=bay?(cargoOpen?180:0):(inside?85:550)*dark;}
  const staff=uniforms.map(u=>{u.hidden.forEach(o=>o.visible=false);const a=roleActivity(s,u.role),active=a.tasks.find(t=>t.status==='RUNNING'),paused=a.tasks.length&&!active;u.g.visible=a.onDuty||a.tasks.length>0||!s;
   const t=active?active.progress*12:0;u.arms.forEach(j=>{j.upper.rotation.x=active?-.4+Math.sin(t+j.sign)*.17:paused?-.4:0;j.lower.rotation.x=active||paused?-.58:0});return {role:u.role,status:a.status,shift:a.shift};});
  const cargo=cargoOf(s,lot),stockPlan=cargoOf(s,lot,'stock',8);
  if(cartons){cartons.setCount(cargo.visible);const out=world.moving.find(v=>v.id==='SIM-TRAILER-1');const body=out.load.getObjectByName('OUTBOUND_CLOSED_BODY');if(body)body.visible=!cargoOpen;for(const panel of outboundPanels)panel.visible=!cargoOpen;cartons.g.visible=cargoOpen&&cargo.visible>0;}
  for(const item of stockDetails)item.before.forEach(o=>o.visible=false);
  window[sceneKey]={release:LIVE_RELEASE,kind,clockSeconds:s?.clock?.seconds||0,environment:env,streetAndIndoorFixtures:fixtureCount,actualLights:lights.length,staff,cargo,stock:stockPlan,cargoOpen,cartonsRendered:cartons&&cargoOpen?cargo.visible*24:0,assetProvenance:'SIMULATED_ASSET_DETAILS',renderBudget:renderer?'DIRTY_30FPS_NO_IDLE_REPAINT_HIDDEN_SUSPENDED':'HOST_MANAGED',inspection};dirty();return true;
 }
 const bar=document.createElement('div');bar.className='living-scene-bar';bar.innerHTML='<span data-env>Horario del registro común</span>'+(kind==='site'?'<button type="button" id="livingCargo">Ver carga de briks</button>':'');
 const mount=document.getElementById(kind==='site'?'viewport':'world');mount?.append(bar);
 if(kind==='site')for(const a of document.querySelectorAll('header a'))if(a.textContent==='Planta original')a.textContent='Vista de planta';
 const style=document.createElement('style');style.textContent='.living-scene-bar{position:absolute;z-index:5;right:12px;bottom:8px;display:flex;gap:8px;align-items:center;background:#071926ee;border:1px solid #4a716f;border-radius:5px;padding:5px 9px;max-width:88%;font:11px system-ui;color:#dbe9e4}.living-scene-bar button{font:11px system-ui;padding:5px;background:#20463e;color:#e2ece5;border:1px solid #5c8b7d;cursor:pointer}@media(max-width:600px){.living-scene-bar{bottom:4px;font-size:9px;right:4px}}';document.head.append(style);
 if(kind==='site')bar.querySelector('button').onclick=()=>{cargoOpen=!cargoOpen;bar.querySelector('button').textContent=cargoOpen?'Cerrar transporte':'Ver carga de briks';if(cargoOpen&&camera&&controls){const p=world.moving.find(v=>v.id==='SIM-TRAILER-1').load.position;camera.position.copy(p).add(new T.Vector3(-12,7,12));controls.target.copy(p).add(new T.Vector3(0,1.5,0));controls.update()}refresh(true)};
 const update=()=>{const changed=refresh(),pose=displayState(),key=(pose?.revision??'none')+':'+(pose?.clock.seconds??0).toFixed(2);const motionChanged=key!==lastMotionKey;if(motionChanged){lastMotionKey=key;activityMotion.update(pose);invalidate();dirty()}window['__GAZA_ACTIVITY_'+kind.toUpperCase()+'__']=activityMotion.snapshot();if(changed)bar.querySelector('[data-env]').textContent=last.text+' SIM · '+last.phase+(last.preview?' · vista lumínica':'');return changed||motionChanged};update();
 return {update,displayState,snapshot:()=>window[sceneKey],openCargo(value=true){cargoOpen=!!value;refresh(true)},dispose(){if(manager.onLoad===resourcesLoaded)manager.onLoad=previousLoad;if(renderer){renderer.render=originalRender;for(const type of ['click','input','change','pointerdown','pointerup','gaza-scene-invalidate'])document.removeEventListener(type,invalidate,true);window.removeEventListener('message',activation);document.removeEventListener('visibilitychange',invalidate)}uniforms.forEach(u=>u.g.removeFromParent());instances.forEach(o=>{o.dispose();o.removeFromParent()});cartons?.dispose();stock?.dispose();stockDetails.forEach(i=>i.detail.dispose());pools.forEach(o=>o.removeFromParent());lights.forEach(o=>o.light.removeFromParent());root.removeFromParent();assets.dispose();bar.remove();style.remove()}};
}
