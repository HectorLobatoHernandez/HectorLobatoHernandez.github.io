/** One operational projection. No telemetry, animal census or employee shift is claimed as real. */
import {TASKS,TESTS,ROLES} from '../processes/catalog.mjs';
export const LIVE_RELEASE='gaza-live-20261012-v1';
export const DEFAULT_LIVING=Object.freeze({startMinute:480,environment:'auto',schedule:false});
export const EXTRA_ROLES=Object.freeze({'SIM-ADMIN-DEMO':'Administración y planificación','SIM-RECEPTION-DESK':'Recepción de personas','SIM-MAINT-DEMO':'Mantenimiento','SIM-MATERIALS-DEMO':'Materiales de envase','SIM-ACCESS-DEMO':'Accesos','SIM-STAFF-DEMO':'Personal y vestuarios'});
const continuous=new Set(['SIM-CLEAN-01','SIM-CLEAN-02','SIM-PROD-01','SIM-PACK-01','SIM-WMS-01','SIM-RECEPTION-01','SIM-MAINT-DEMO','SIM-ACCESS-DEMO']);
export function validateLiving(v){
 if(!v||!Number.isInteger(v.startMinute)||v.startMinute<0||v.startMinute>=1440||!['auto','day','dusk','night'].includes(v.environment)||typeof v.schedule!=='boolean')throw Error('Horario o iluminación de escenario inválidos');
 return {...v};
}
export function settingsOf(s){return s?.config?.living?validateLiving(s.config.living):{...DEFAULT_LIVING};}
export function clockOf(s){const cfg=settingsOf(s),seconds=s?.clock?.seconds||0,total=cfg.startMinute*60+seconds,minute=((total/60)%1440+1440)%1440;return {seconds,minute,hour:minute/60,day:1+Math.floor(total/86400),text:String(Math.floor(minute/60)).padStart(2,'0')+':'+String(Math.floor(minute%60)).padStart(2,'0'),rate:s?.clock?.rate||1,running:!!s?.clock?.running};}
export function windowContains(minute,start,end){return start===end?true:start<end?minute>=start&&minute<end:minute>=start||minute<end;}
export function shiftFor(role,s){
 const {minute,day}=clockOf(s),all=continuous.has(role),farm=role.startsWith('SIM-FARM')||role==='SIM-DRIVER-01',office=['SIM-ADMIN-DEMO','SIM-RECEPTION-DESK','SIM-STAFF-DEMO','SIM-MATERIALS-DEMO'].includes(role),vet=role==='SIM-VET-01';
 const start=office?8*60:vet?6*60:farm?5*60:6*60,end=office?18*60:vet?20*60:22*60;
 const onDuty=all||windowContains(minute,start,end),shift=minute>=22*60||minute<6*60?'Noche':minute<14*60?'Mañana':'Tarde';
 return {role,title:ROLES[role]||EXTRA_ROLES[role]||role,onDuty,shift,day,continuous:all,start,end,untilNextMinute:onDuty?0:(start-minute+1440)%1440,policy:'ROSTER_SCENARIO_NOT_GAZA_SHIFTS',label:all?'Cobertura SIM 24 h / relevos 06–14–22':String(start/60).padStart(2,'0')+':00–'+String(end/60).padStart(2,'0')+':00 SIM'};
}
export function roleEligibility(s,role){const shift=shiftFor(role,s);return !settingsOf(s).schedule||shift.onDuty?{ok:true,reason:''}:{ok:false,reason:'Fuera de turno SIM: '+shift.title+' · próximo relevo en '+Math.ceil(shift.untilNextMinute)+' min'};}
const clamp=x=>Math.min(1,Math.max(0,x));
export function environmentOf(s){
 const cfg=settingsOf(s),clock=clockOf(s),hour=cfg.environment==='night'?23:cfg.environment==='day'?13:cfg.environment==='dusk'?19.4:clock.hour;
 // Artistic solar envelope, not astronomical ephemerides or a lux calculation.
 const elevation=Math.sin((hour-6.5)*Math.PI/13),daylight=clamp((elevation+.12)/.62),darkness=1-daylight;
 return {...clock,hour,sourceHour:clock.hour,preview:cfg.environment!=='auto',mode:cfg.environment,daylight,darkness,lamps:darkness>.12,sunIntensity:.055+1.65*daylight,ambientIntensity:.10+.95*daylight,phase:daylight>.8?'Día':daylight>.12?'Crepúsculo':'Noche',provenance:'SIMULATED_LIGHTING_NOT_PHOTOMETRY'};
}
export function taskState(s,l,def){const t=l?.tasks?.[def.id];if(!t)return 'PENDING';if(t.status==='RUNNING'){if(!s.equipment[def.resource]?.valid)return 'UNAVAILABLE';if(l.holds&&!def.qualityIndependent)return 'HELD';if(def.gate&&l.gates[def.gate]?.status!=='APPROVED')return 'WAIT_GATE';}return t.status;}
export function roleActivity(s,role){
 const tasks=[];for(const l of Object.values(s?.lots||{})){for(const d of TASKS)if(d.role===role&&l.tasks[d.id].status==='RUNNING')tasks.push({id:d.id,title:d.title,lotId:l.id,status:taskState(s,l,d),progress:clamp((l.tasks[d.id].elapsed||0)/d.durationSimSeconds)});if(role==='SIM-LAB-01')for(const t of l.tests)if(t.status==='RUNNING')tasks.push({id:t.testId,title:TESTS.find(d=>d.id===t.testId)?.title,lotId:l.id,status:'RUNNING',progress:clamp((s.clock.seconds-t.startedAt)/(t.readyAt-t.startedAt))});}
 const shift=shiftFor(role,s);return {...shift,tasks,status:tasks.some(t=>t.status==='RUNNING')?(shift.onDuty?'WORKING':'HANDOVER'):tasks.length?'HELD':shift.onDuty?'AVAILABLE':'OFF_SHIFT'};
}
/** Cartons are display glyphs. Their representative amounts sum to ledger stock exactly. */
export function cargoOf(s,lotId,where='shipping',maxGlyphs=12){
 if(!Number.isInteger(maxGlyphs)||maxGlyphs<0||maxGlyphs>64||!['shipping','stock','wip'].includes(where))throw Error('Límite visual de carga inválido');
 const l=s?.lots?.[lotId],key=where==='shipping'?'shippingL':where==='stock'?'packedL':'wipL',litres=l?.mass?.[key]||0,cap=s?.config?.palletCapacityL||720;
 const pallets=Math.floor(litres/cap),remainderL=litres%cap,visible=Math.min(maxGlyphs,pallets),weights=Array.from({length:visible},(_,i)=>Math.floor(pallets/visible)+(i<pallets%visible?1:0));
 return {lotId:l?.id||null,species:l?.species||null,where,litres,pallets,remainderL,visible,weights,representedL:weights.reduce((n,v)=>n+v*cap,0),blocked:!!l&&(l.holds||l.gates.dispatch.status!=='APPROVED'),label:'ENVASE GAZA ILUSTRATIVO · LOTE SIM',provenance:'READ_ONLY_LEDGER_GLYPHS'};
}
export function opsView(s,lotId){
 const lot=s?.lots?.[lotId]||null,staff=Object.keys({...ROLES,...EXTRA_ROLES}).map(r=>roleActivity(s,r)),active=[],pending=[];
 for(const l of Object.values(s?.lots||{}))for(const d of TASKS){const t=l.tasks[d.id],state=taskState(s,l,d);if(t.status==='RUNNING')active.push({id:d.id,title:d.title,lotId:l.id,module:d.module,role:d.role,state,progress:clamp((t.elapsed||0)/d.durationSimSeconds)});else if(t.status==='PENDING'&&d.after.every(id=>l.tasks[id].status==='DONE'))pending.push({id:d.id,title:d.title,lotId:l.id,gate:d.gate||null,shift:roleEligibility(s,d.role),resource:d.resource});}
 return {release:LIVE_RELEASE,ready:!!s,clock:clockOf(s),environment:environmentOf(s),staff,active,pending,lotId:lot?.id||null,cargo:cargoOf(s,lotId),stock:cargoOf(s,lotId,'stock'),openIssues:Object.values(s?.lots||{}).flatMap(l=>l.issues.filter(i=>i.status!=='CLOSED').map(i=>({...i,lotId:l.id}))),events:s?.events?.slice(-12)||[],shiftPolicy:settingsOf(s).schedule?'ENFORCED_AT_START':'ILLUSTRATIVE',boundary:'SIMULACIÓN EN VIVO · DURACIONES COMPRIMIDAS · NO TELEMETRÍA'};
}
