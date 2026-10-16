import {processStore as store} from '../processes/store.mjs?release=gaza-warehouse-v24';
import {gateEligibility} from '../processes/ledger.mjs';
import {GATES} from '../processes/catalog.mjs';
import {RELEASE} from './session.mjs';
/** Presentation controls navigate the existing app. Only explicit QA clicks approve a gate. */
export function mountDemoHub(show) {
 const launch=document.getElementById('demoLaunch');
 const link=new URL(location.href);link.searchParams.set('demo','company');link.searchParams.set('view','farm');link.searchParams.set('release',RELEASE);link.searchParams.delete('guide');
 launch.href=link.pathname+link.search;
 const badge=document.getElementById('releaseBadge');badge.textContent='ESCENAS v21 · PROCESOS '+RELEASE;
 if(!store.scope.demo)return;
 document.body.classList.add('company-demo');launch.textContent='DEMO EMPRESA ACTIVA';launch.removeAttribute('target');
 const dock=document.createElement('div');dock.id='companyDemoDock';dock.innerHTML='<div class="demo-nav"><strong>DEMOSTRACIÓN · SIN DATOS REALES</strong><button data-demo-view="farm" data-focus="herds">Rebaños</button><button data-demo-view="farm" data-focus="cow">Vaca</button><button data-demo-view="farm" data-focus="sheep">Oveja</button><button data-demo-view="farm" data-focus="milking">Ordeño</button><button data-demo-view="labs">Laboratorio</button><button data-demo-view="site">Planta / Logística</button><button data-demo-view="workflow">Trazabilidad</button></div><div class="demo-nav"><button id="demoPause">Pausar</button><button id="demoRestart">Repetir demo de ordeño</button><button id="demoReview" disabled>Sin revisión disponible</button><span id="demoStatus" role="status"></span><button id="demoDiagnostics">Copiar diagnóstico</button></div><div id="demoMessage" role="status"></div>';
 dock.classList.add('compact');const expand=document.createElement('button');expand.id='demoExpand';expand.type='button';expand.textContent='Controles ▾';expand.setAttribute('aria-expanded','false');dock.querySelector('.demo-nav').append(expand);expand.onclick=()=>{const open=dock.classList.toggle('compact')===false;expand.setAttribute('aria-expanded',String(open));expand.textContent=open?'Ocultar controles ▴':'Controles ▾'};
 document.querySelector('.footer').replaceWith(dock);
 let pending=null,decision=null;const ready=new Map();
 const activeFrame=()=>document.querySelector('.pane.on iframe');
 function loadStatus(frame){try{return frame?.contentWindow?.__GAZA_SCENE_LOAD__||null}catch{return null}}
 function sendFocus(){const frame=activeFrame();if(!pending||!frame)return;const status=loadStatus(frame);if(status?.status==='ready'&&status.release===RELEASE)ready.set(frame.contentWindow,status);if(!ready.has(frame.contentWindow))return;frame.contentWindow.postMessage({type:'GAZA_DEMO_FOCUS',focus:pending},location.origin);pending=null;}
 dock.querySelectorAll('[data-demo-view]').forEach(b=>b.onclick=()=>{pending=b.dataset.focus||null;show(b.dataset.demoView);sendFocus()});
 window.addEventListener('message',e=>{const frames=[...document.querySelectorAll('.pane iframe')];if(e.origin!==location.origin||!frames.some(f=>f.contentWindow===e.source))return;if(e.data?.type==='GAZA_SCENE_READY'){ready.set(e.source,e.data);sendFocus()}});
 const error=e=>{document.getElementById('demoMessage').textContent=e.message||String(e)};
 document.getElementById('demoPause').onclick=()=>store.state&&store.dispatch({type:'CLOCK',running:!store.state.clock.running,rate:store.state.clock.rate}).catch(error);
 document.getElementById('demoRestart').onclick=()=>store.restartDemonstration().then(()=>{store.setLot('SIM-BOV-001');pending='milking';show('farm');sendFocus()}).catch(error);
 document.getElementById('demoReview').onclick=async()=>{if(!decision)return;const d=decision;await store.dispatch({type:'REVIEW_GATE',...d,reviewer:'SIM-QA-01'}).catch(error)};
 document.getElementById('demoDiagnostics').onclick=async()=>{const frame=activeFrame(),data={release:RELEASE,view:new URLSearchParams(location.search).get('view'),scope:store.scope.id,stateRevision:store.state?.revision||null,frameSource:frame?.getAttribute('src'),sceneLoad:loadStatus(frame),ready:ready.get(frame?.contentWindow)||null,error:store.error};const raw=JSON.stringify(data,null,2);try{await navigator.clipboard.writeText(raw);document.getElementById('demoMessage').textContent='Diagnóstico copiado (sin contenido del registro).';}catch{document.getElementById('demoMessage').textContent=raw;}};
 store.subscribe(({state,error:e})=>{if(e){error(e);return}if(!state)return;
  document.getElementById('demoPause').textContent=state.clock.running?'Pausar':'Reanudar';decision=null;
  for(const lotId of Object.keys(state.lots))for(const gate of Object.keys(GATES))if(!decision&&state.lots[lotId].gates[gate].status!=='APPROVED'&&gateEligibility(state,lotId,gate).ok)decision={lotId,gate};
  const b=document.getElementById('demoReview');b.disabled=!decision;b.textContent=decision?'Revisar '+GATES[decision.gate].title+' · '+decision.lotId+' (SIM)':'Sin revisión disponible';
  const tasks=Object.values(state.lots).flatMap(l=>Object.entries(l.tasks).filter(([,t])=>t.status==='RUNNING').map(([id])=>id));
  document.getElementById('demoStatus').textContent='SIM '+state.clock.seconds.toFixed(0)+' s · '+(decision?'Pendiente de revisión explícita':tasks.length?tasks.join(' / '):'Sin tareas activas')+' · registro de trabajo intacto';
 });
 window.__GAZA_COMPANY_DEMO__={release:RELEASE,key:store.scope.key,isolated:true};
}
