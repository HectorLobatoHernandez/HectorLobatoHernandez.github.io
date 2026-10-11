import {KEY,createProcess,reduceProcess,assertProcess,legacyProjection} from './dairy-process-core.mjs';
const listeners=new Set();let state=null,lastError='',timer=null;
const emit=()=>{window.__GAZA_PROCESS_STATE__=state;window.__GAZA_PROCESS_ERROR__=lastError;for(const fn of listeners)fn(state,lastError);window.dispatchEvent(new CustomEvent('gaza-process-state',{detail:state}));};
export function readProcess(){try{const raw=localStorage.getItem(KEY);if(!raw)return null;const value=JSON.parse(raw);assertProcess(value);return value}catch(e){lastError='Registro no válido o almacenamiento inaccesible: '+e.message;return null}}
function refresh(){state=readProcess();emit()}
function publish(next){
  // Write the canonical snapshot before notifying any scene. Legacy key is a read-only compatibility projection.
  localStorage.setItem(KEY,JSON.stringify(next));state=next;lastError='';
  try{localStorage.setItem('gaza:operations-thread:v1',JSON.stringify(legacyProjection(next)))}catch{}
  emit();
  if(window.parent!==window)window.parent.postMessage({type:'GAZA_OPERATIONS_STATE_V1',provenance:'SIMULATED',revision:next.revision},location.origin);
}
async function locked(fn){if(!navigator.locks?.request)throw new Error('Modo lectura: Web Locks requiere HTTPS y navegador compatible');return navigator.locks.request(KEY,{mode:'exclusive'},fn)}
export async function sendProcess(action){try{return await locked(()=>{
  const current=readProcess();if(!current)throw new Error('Inicia una sesión de simulación');
  const next=reduceProcess(current,{...action,commandId:action.commandId||crypto.randomUUID()});
  next.wallAt=Date.now();publish(next);return next;
})}catch(e){lastError=e.message;emit();throw e}}
export async function startProcess(){try{return await locked(()=>{
  if(localStorage.getItem(KEY)!==null)throw new Error('Ya existe una sesión. Usa cerrar/archivar antes de iniciar otra');
  // Preserve old demos as evidence; never silently promote legacy OK buttons to validated v2 results.
  for(const key of ['gaza:operations-thread:v1','gaza:quality-training:v1']){const old=localStorage.getItem(key);if(old)localStorage.setItem(key+':before-v2',old)}
  const next=createProcess({epoch:'SIM-'+Date.now().toString(36)});next.wallAt=Date.now();publish(next);return next;
})}catch(e){lastError=e.message;emit();throw e}}
export async function archiveProcess(){return locked(()=>{const current=readProcess();if(!current)throw new Error('No hay sesión');localStorage.setItem(KEY+':archive:'+current.epoch,JSON.stringify(current));localStorage.removeItem(KEY);localStorage.removeItem('gaza:operations-thread:v1');state=null;lastError='Sesión archivada localmente';emit()})}
export function subscribeProcess(fn){listeners.add(fn);if(!state)state=readProcess();fn(state,lastError);return()=>listeners.delete(fn)}
export function getProcess(){return state}
function startClock(){if(timer)return;timer=setInterval(async()=>{
  if(document.hidden)return;
  try{await locked(()=>{const s=readProcess(),now=Date.now();if(!s?.clock.playing)return;const gap=now-(s.wallAt||now);if(gap<400)return;
    // No catch-up of hours while the computer sleeps; live display is browser-local training only.
    const next=reduceProcess(s,{type:'TICK',seconds:gap>2500?0:Math.min(1,gap/1000)});next.wallAt=now;publish(next);
  })}catch(e){lastError=e.message}},500)}
window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null)refresh()});window.addEventListener('focus',refresh);
refresh();startClock();
