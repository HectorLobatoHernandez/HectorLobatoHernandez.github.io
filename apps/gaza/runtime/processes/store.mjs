import {KEY,initialState,reduce,validateState,visualSnapshot,lotSummary} from './ledger.mjs';
import {TASKS} from './catalog.mjs';
const listeners=new Set();
let snapshot=null,error=null,selected=null,closed=false,busyClock=false;
const LEGACY='gaza:operations-thread:v1';
const locks=globalThis.navigator?.locks;
const qa=typeof location!=='undefined'&&new URLSearchParams(location.search).get('qa')==='1';
function read(){
 const raw=localStorage.getItem(KEY);if(!raw)return null;
 if(raw.length>8*1024*1024)throw new Error('Registro demasiado grande: exportar y revisar antes de continuar');
 const value=JSON.parse(raw);if(!validateState(value))throw new Error('Registro v2 incompatible; no se ha sustituido ni fabricado un estado nuevo');return value;
}
function notify(){
 try{snapshot=read();error=null}catch(e){error=e.message;snapshot=null}
 if(snapshot&&!snapshot.lots[selected])selected=Object.keys(snapshot.lots)[0];
 window.__GAZA_PROCESS_STATE__=snapshot;window.__GAZA_PROCESS_ERROR__=error;
 const detail={state:snapshot,error,selected};
 for(const fn of listeners)try{fn(detail)}catch(e){console.error('GAZA process observer',e)}
 window.dispatchEvent(new CustomEvent('gaza-process-state',{detail}));
}
/** Legacy key is a read-only derived projection, never another balance engine. */
function project(s){
 const lot=s.lots[Object.keys(s.lots)[0]],m=lot.mass;
 const names=['GRANJA','RECOGIDA','LOGÍSTICA ENTRADA','RECEPCIÓN','LABORATORIO','CALIDAD','FABRICACIÓN','ENVASADO','ALMACÉN ASRS','EXPEDICIÓN'];
 let stage=0;
 for(const [id,n] of [['COLLECTION.LOAD',1],['LOGISTICS.TRANSIT',2],['RECEPTION.SAMPLE',3],['RECEPTION.UNLOAD',3],['PLANT.CIP',5],['PLANT.PROCESS',6],['PLANT.PACK',7],['WAREHOUSE.PUTAWAY',8],['DISPATCH.LOAD',9]])if(lot.tasks[id].status!=='PENDING')stage=n;
 if(lot.tests.some(t=>t.status==='RUNNING')&&stage<6)stage=4;
 const processedL=m.wipL+m.packedL+m.shippingL+m.deliveredL,packedL=m.packedL+m.shippingL+m.deliveredL;
 return {schemaVersion:1,provenance:'SIMULATED',source:'DERIVED_FROM_PROCESS_LEDGER_V2_READ_ONLY',revision:s.revision,stage,
  status:lot.holds?'HOLD':lot.tasks['DELIVERY.ARRIVE'].status==='DONE'?'COMPLETE':'RUNNING',
  quality:lot.holds?'ON_HOLD':lot.gates.manufacturing.status==='APPROVED'?'SIMULATED_APPROVAL':'PENDING',
  config:{lotId:lot.id,volumeL:lot.plannedL,palletCapacityL:s.config.palletCapacityL},
  departments:names.map((name,i)=>({name,status:i<stage?'DONE':i===stage?'ACTIVE':'PENDING'})),analyses:lot.tests,
  inventory:{rawMilkL:m.producedL,processedL,packedL,pallets:Math.floor(packedL/s.config.palletCapacityL),dispatchedPallets:(m.shippingL+m.deliveredL)/s.config.palletCapacityL},events:s.events};
}
const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('gaza-process-v2'):null;
function commit(s){
 localStorage.setItem(KEY,JSON.stringify(s));
 try{localStorage.setItem(LEGACY,JSON.stringify(project(s)))}catch{/* The canonical v2 remains intact; projection is optional. */}
 notify();channel?.postMessage({type:'UPDATED',revision:s.revision});
 if(window.parent!==window)window.parent.postMessage({type:'GAZA_PROCESS_UPDATED_V2'},location.origin);
 return s;
}
async function transaction(fn){
 if(!locks)throw new Error('Escritura desactivada: Web Locks requiere un origen seguro. Usa GitHub Pages o localhost.');
 return locks.request(KEY,async()=>{const current=read(),next=fn(current);if(!next)return current;if(!validateState(next))throw new Error('Invariantes incumplidas; no se guardó la acción');return commit(next)});
}
function archive(){
 for(const key of [KEY,LEGACY,'gaza:quality-training:v1']){const raw=localStorage.getItem(key);if(raw)localStorage.setItem(key+':archive:'+Date.now(),raw)}
}
export const processStore={
 get state(){return snapshot},get error(){return error},get selected(){return selected},get writable(){return !!locks},
 setLot(id){if(!snapshot?.lots[id])return;selected=id;notify()},
 subscribe(fn){listeners.add(fn);fn({state:snapshot,error,selected});return()=>listeners.delete(fn)},
 start(){return transaction(s=>{if(s)return s;archive();const n=initialState();n.clock.wallAt=Date.now();return n})},
 reset(){return transaction(()=>{archive();const n=initialState();n.clock.wallAt=Date.now();return n})},
 dispatch(action){return transaction(s=>{if(!s)throw new Error('Inicia el escenario compartido');const n=reduce(s,action);if(action.type==='CLOCK')n.clock.wallAt=Date.now();return n})},
 view(id=selected){return snapshot?.lots[id]?visualSnapshot(snapshot,id):null},
 summary(id=selected){return snapshot?.lots[id]?lotSummary(snapshot,id):null},
 export(){return snapshot?JSON.stringify(snapshot,null,2):null},
 async pulse(){if(closed||busyClock||qa||document.hidden)return;busyClock=true;try{await transaction(s=>{
  if(!s||!s.clock.running)return null;
  const now=Date.now(),elapsed=Math.max(0,Math.min(1,(now-(s.clock.wallAt??now))/1000));
  if(elapsed<.08)return null;const n=reduce(s,{type:'TICK',seconds:elapsed*s.clock.rate});n.clock.wallAt=now;return n;
 })}catch(e){error=e.message;window.__GAZA_PROCESS_ERROR__=error}finally{busyClock=false}},
 close(){closed=true;clearInterval(timer);channel?.close()}
};
channel&&(channel.onmessage=()=>notify());
window.addEventListener('storage',e=>{if(e.key===KEY)notify()});
window.addEventListener('pageshow',notify);window.addEventListener('pagehide',e=>{if(!e.persisted)processStore.close()});
notify();const timer=setInterval(()=>processStore.pulse(),250);
