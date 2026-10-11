import {TASKS,TESTS,GATES,ROLES,DEFAULT_LOTS} from './catalog.mjs';
export const SCHEMA=2;
export const KEY='gaza:process-ledger:v2';
const taskById=Object.fromEntries(TASKS.map(t=>[t.id,t]));
const testById=Object.fromEntries(TESTS.map(t=>[t.id,t]));
const clone=x=>structuredClone(x);
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const massKeys=['segregatedL','farmTankL','tankerL','siloL','wipL','packedL','shippingL','deliveredL','lossL'];
function event(s,type,lotId,detail,data={}){
 const entry={id:'EV-'+String(++s.sequence).padStart(7,'0'),atSimSeconds:s.clock.seconds,type,lotId,detail,...data};
 s.events.push(entry);return entry.id;
}
export function initialState(config={}){
 const definitions=config.lots||DEFAULT_LOTS;
 assert(Array.isArray(definitions)&&definitions.length>0&&definitions.length<=20,'Lotes iniciales inválidos');
 const s={schemaVersion:SCHEMA,provenance:'SIMULATED',revision:0,sequence:0,clock:{seconds:0,running:false,rate:1},autoTasks:false,
  config:{processingYieldBasisPoints:9700,palletCapacityL:720,plan:'DEMO_DAIRY_V2_NOT_GAZA_SOP'},
  lots:{},equipment:{},events:[]};
 for(const def of definitions){
  assert(typeof def.id==='string'&&/^SIM-[A-Z0-9-]+$/.test(def.id)&&!s.lots[def.id],'ID de lote inválido o duplicado');
  assert(['BOVINE','OVINE'].includes(def.species),'Especie inválida');
  assert(integer(def.plannedL)&&def.plannedL>0&&integer(def.excludedL)&&def.excludedL<def.plannedL,'Cantidades iniciales inválidas');
  s.lots[def.id]={...clone(def),tasks:Object.fromEntries(TASKS.map(t=>[t.id,{status:'PENDING',startedAt:null,completedAt:null}])),
   mass:Object.fromEntries(['producedL',...massKeys].map(k=>[k,0])),samples:{},tests:[],issues:[],holds:false,recall:false,
   gates:Object.fromEntries(Object.keys(GATES).map(k=>[k,{status:'PENDING',reviewer:null,at:null}])),
   genealogy:[{id:def.id,parentIds:[],kind:'RAW_ORIGIN',species:def.species}],deliveredPallets:0};
 }
 for(const r of [...TASKS,...TESTS].map(x=>x.resource))s.equipment[r]={valid:true,revision:0};
 event(s,'CREATED',null,'Escenario creado con dos circuitos de especie independientes; sin datos reales');
 assertState(s);return s;
}
export function latestTest(lot,id){return lot.tests.filter(t=>t.testId===id).at(-1)||null}
function lotOf(s,id){assert(s.lots[id],'Lote desconocido');return s.lots[id]}
function recordIssue(s,lot,reason,source){
 const issue={id:'NC-'+String(s.sequence+1).padStart(7,'0'),source,reason,status:'OPEN',evidence:null,reviewer:null};
 lot.issues.push(issue);lot.holds=true;
 if(lot.mass.shippingL>0||lot.mass.deliveredL>0)lot.recall=true;
 for(const gate of Object.values(lot.gates))if(gate.status==='APPROVED')gate.status='REVOKED';
 event(s,'HOLD',lot.id,reason,{issueId:issue.id,source});
}
function resourceBusy(s,resource){
 return Object.values(s.lots).some(l=>TASKS.some(t=>t.resource===resource&&l.tasks[t.id].status==='RUNNING')||l.tests.some(t=>t.resource===resource&&t.status==='RUNNING'));
}
export function taskEligibility(s,lotId,taskId){
 const lot=s.lots[lotId],def=taskById[taskId];
 if(!lot||!def)return {ok:false,reason:'Lote o tarea desconocido'};
 if(lot.tasks[taskId].status!=='PENDING')return {ok:false,reason:'Tarea ya iniciada o terminada'};
 if(lot.holds&&!def.qualityIndependent)return {ok:false,reason:'Lote retenido'};
 if(def.after.some(id=>lot.tasks[id].status!=='DONE'))return {ok:false,reason:'Faltan tareas precedentes'};
 if(def.gate&&lot.gates[def.gate].status!=='APPROVED')return {ok:false,reason:'Falta decisión: '+GATES[def.gate].title};
 if(!s.equipment[def.resource]?.valid)return {ok:false,reason:'Equipo fuera de servicio'};
 if(resourceBusy(s,def.resource))return {ok:false,reason:'Recurso ocupado por otra tarea/lote'};
 return {ok:true,reason:''};
}
export function testEligibility(s,lotId,testId){
 const lot=s.lots[lotId],def=testById[testId];
 if(!lot||!def)return {ok:false,reason:'Ensayo desconocido'};
 const sample=lot.samples[def.sample];
 if(!sample||sample.status!=='RECEIVED')return {ok:false,reason:'Muestra ausente o custodia no válida'};
 if(!s.equipment[def.resource]?.valid)return {ok:false,reason:'Equipo no apto'};
 if(lot.tests.some(t=>t.testId===testId&&t.status==='RUNNING'))return {ok:false,reason:'Ensayo ya en curso'};
 if(resourceBusy(s,def.resource))return {ok:false,reason:'Equipo ocupado'};
 return {ok:true,reason:''};
}
export function gateEligibility(s,lotId,gateId){
 const lot=s.lots[lotId],plan=GATES[gateId];
 if(!lot||!plan)return {ok:false,reason:'Decisión desconocida'};
 if(lot.holds)return {ok:false,reason:'Retención activa: revisar investigación'};
 if((plan.requires||[]).some(t=>lot.tasks[t].status!=='DONE'))return {ok:false,reason:'Registros/tareas incompletos'};
 for(const id of plan.tests){
  const t=latestTest(lot,id),def=testById[id];
  if(!t||t.status!=='COMPLETE'||t.result!=='PASS')return {ok:false,reason:'Resultado no conforme o pendiente: '+def.title};
  if(!s.equipment[t.resource]?.valid||s.equipment[t.resource].revision!==t.equipmentRevision)return {ok:false,reason:'Reevaluar ensayo tras cambio metrológico: '+def.title};
  if(lot.samples[def.sample]?.status!=='RECEIVED')return {ok:false,reason:'Custodia de muestra no válida'};
 }
 return {ok:true,reason:''};
}
function move(lot,from,to,amount=lot.mass[from]){assert(integer(amount)&&lot.mass[from]>=amount,'Transferencia fuera de balance');lot.mass[from]-=amount;lot.mass[to]+=amount}
function node(lot,id,parent,kind){
 assert(!lot.genealogy.some(n=>n.id===id),'Nodo de genealogía duplicado');
 assert(lot.genealogy.some(n=>n.id===parent),'Origen no registrado');
 lot.genealogy.push({id,parentIds:[parent],kind,species:lot.species});
}
function sample(s,lot,kind,nodeId){
 const id=lot.id+'-S-'+kind.toUpperCase();
 lot.samples[kind]={id,lotId:lot.id,nodeId,kind,status:'RECEIVED',custody:[{at:s.clock.seconds,actor:'SIM-SAMPLER-01',action:'SEALED'},{at:s.clock.seconds,actor:'SIM-LAB-01',action:'RECEIVED'}]};
 event(s,'SAMPLE_RECEIVED',lot.id,'Muestra registrada con origen y custodia',{sampleId:id,kind});
}
function finishTask(s,lot,def){
 const id=lot.id,m=lot.mass;
 switch(def.id){
 case 'FARM.MILKING':m.producedL=lot.plannedL;m.segregatedL=lot.excludedL;m.farmTankL=lot.plannedL-lot.excludedL;node(lot,id+'-TANK',id,'BULK_TANK');break;
 case 'COLLECTION.LOAD':move(lot,'farmTankL','tankerL');node(lot,id+'-LOAD',id+'-TANK','TANKER_COMPARTMENT');sample(s,lot,'origin',id+'-TANK');break;
 case 'RECEPTION.SAMPLE':sample(s,lot,'raw',id+'-LOAD');break;
 case 'RECEPTION.UNLOAD':move(lot,'tankerL','siloL');node(lot,id+'-SILO',id+'-LOAD','RECEIVED_MATERIAL');break;
 case 'PLANT.PROCESS':{
  const output=Math.floor(m.siloL*s.config.processingYieldBasisPoints/10000),loss=m.siloL-output;
  move(lot,'siloL','lossL',loss);move(lot,'siloL','wipL',output);node(lot,id+'-BATCH',id+'-SILO','MANUFACTURED_BATCH');break;}
 case 'PLANT.PACK':move(lot,'wipL','packedL');node(lot,id+'-PACK',id+'-BATCH','FINISHED_LOT');sample(s,lot,'finished',id+'-PACK');break;
 case 'DISPATCH.LOAD':{
  const units=Math.floor(m.packedL/s.config.palletCapacityL);move(lot,'packedL','shippingL',units*s.config.palletCapacityL);node(lot,id+'-SHIP',id+'-PACK','SHIPMENT');break;}
 case 'DELIVERY.ARRIVE':lot.deliveredPallets+=m.shippingL/s.config.palletCapacityL;move(lot,'shippingL','deliveredL');break;
 }
 lot.tasks[def.id].status='DONE';lot.tasks[def.id].completedAt=s.clock.seconds;
 event(s,'TASK_COMPLETED',lot.id,def.title,{taskId:def.id,station:def.station,module:def.module});
}
function tick(s,seconds){
 assert(typeof seconds==='number'&&Number.isFinite(seconds)&&seconds>=0&&seconds<=3600,'Paso temporal inválido');
 const target=s.clock.seconds+seconds;
 // Finish in chronological order. All quantities move only at task completion, never on frame count.
 while(s.clock.seconds<target){
  let next=target;
  for(const lot of Object.values(s.lots)){
   for(const def of TASKS){const t=lot.tasks[def.id];if(t.status==='RUNNING'&&(!lot.holds||def.qualityIndependent)&&s.equipment[def.resource].valid&&(!def.gate||lot.gates[def.gate].status==='APPROVED'))next=Math.min(next,s.clock.seconds+Math.max(0,def.durationSimSeconds-t.elapsed));}
   for(const t of lot.tests)if(t.status==='RUNNING')next=Math.min(next,t.readyAt);
  }
  const dt=Math.max(0,next-s.clock.seconds);s.clock.seconds=next;
  for(const lot of Object.values(s.lots)){
   for(const def of TASKS){const t=lot.tasks[def.id];if(t.status!=='RUNNING')continue;
    if((lot.holds&&!def.qualityIndependent)||!s.equipment[def.resource].valid||(def.gate&&lot.gates[def.gate].status!=='APPROVED'))continue;
    t.elapsed+=dt;if(t.elapsed+1e-8>=def.durationSimSeconds)finishTask(s,lot,def);
   }
   for(const t of lot.tests)if(t.status==='RUNNING'&&s.clock.seconds+1e-8>=t.readyAt){
    t.status='COMPLETE';t.completedAt=s.clock.seconds;
    t.result=s.equipment[t.resource].valid&&s.equipment[t.resource].revision===t.equipmentRevision?t.scenarioResult:'INVALID';
    delete t.scenarioResult;
    event(s,'TEST_COMPLETED',lot.id,testById[t.testId].title+' · '+t.result,{testRecordId:t.id,testId:t.testId});
    if(t.result!=='PASS')recordIssue(s,lot,'Resultado '+t.result+': '+testById[t.testId].title,t.id);
   }
  }
  if(dt===0&&s.clock.seconds<target)throw new Error('Evento temporal sin progreso');
 }
}
export function reduce(input,action){
 assertState(input);assert(action&&typeof action.type==='string','Acción inválida');
 const s=clone(input);s.revision++;
 const fail=(reason)=>{event(s,'ACTION_BLOCKED',action.lotId||null,reason,{action:action.type});return s};
 if(action.type==='AUTO'){assert(typeof action.enabled==='boolean','Planificador inválido');s.autoTasks=action.enabled;return s}
 if(action.type==='CLOCK'){assert(typeof action.running==='boolean'&&[1,4,8].includes(action.rate),'Reloj inválido');s.clock.running=action.running;s.clock.rate=action.rate;return s}
 if(action.type==='TICK'){tick(s,action.seconds);assertState(s);return s.autoTasks?planReady(s):s}
 if(action.type==='EQUIPMENT'){
  const eq=s.equipment[action.resource];assert(eq&&typeof action.valid==='boolean','Equipo inválido');assert(typeof action.reason==='string'&&action.reason.trim().length>=5,'Registrar motivo metrológico');
  eq.valid=action.valid;eq.revision++;event(s,'EQUIPMENT_CHANGED',null,action.reason,{resource:action.resource,valid:action.valid});
  if(!action.valid)for(const lot of Object.values(s.lots))if(lot.tests.some(t=>t.resource===action.resource)||TASKS.some(t=>t.resource===action.resource&&lot.tasks[t.id].status==='RUNNING'))recordIssue(s,lot,'Equipo fuera de servicio: '+action.resource,action.resource);
  assertState(s);return s;
 }
 const lot=lotOf(s,action.lotId);
 switch(action.type){
 case 'START_TASK':{
  const e=taskEligibility(s,lot.id,action.taskId);if(!e.ok)return fail(e.reason);
  lot.tasks[action.taskId]={status:'RUNNING',startedAt:s.clock.seconds,completedAt:null,elapsed:0};
  event(s,'TASK_STARTED',lot.id,taskById[action.taskId].title,{taskId:action.taskId,role:taskById[action.taskId].role});break;}
 case 'START_TEST':{
  const e=testEligibility(s,lot.id,action.testId);if(!e.ok)return fail(e.reason);
  const previous=latestTest(lot,action.testId);
  if(previous&&(!action.reason||action.reason.trim().length<5))return fail('El reensayo necesita justificación; se conserva el resultado anterior');
  assert(['PASS','FAIL'].includes(action.scenarioResult),'Resultado de escenario inválido');
  const def=testById[action.testId],recordId=lot.id+'-TEST-'+String(s.sequence+1);
  lot.tests.push({id:recordId,testId:def.id,resource:def.resource,sampleId:lot.samples[def.sample].id,status:'RUNNING',result:null,scenarioResult:action.scenarioResult,
   startedAt:s.clock.seconds,readyAt:s.clock.seconds+def.durationSimSeconds,completedAt:null,equipmentRevision:s.equipment[def.resource].revision,
   replaces:previous?.id||null,reason:action.reason||null,technician:'SIM-LAB-01'});
  event(s,'TEST_STARTED',lot.id,def.title,{testId:def.id,testRecordId:recordId});break;}
 case 'REVIEW_GATE':{
  if(action.reviewer!=='SIM-QA-01')return fail('Selecciona el perfil de revisión de calidad demo');
  const e=gateEligibility(s,lot.id,action.gate);if(!e.ok)return fail(e.reason);
  lot.gates[action.gate]={status:'APPROVED',reviewer:action.reviewer,at:s.clock.seconds};
  event(s,'QUALITY_REVIEW',lot.id,GATES[action.gate].title+' · aprobación ficticia',{gate:action.gate,reviewer:action.reviewer});break;}
 case 'INCIDENT':assert(typeof action.reason==='string'&&action.reason.trim().length>=5,'Falta motivo de la incidencia');recordIssue(s,lot,action.reason,'OPERATOR');break;
 case 'CORRECT_ISSUE':{
  const issue=lot.issues.find(i=>i.id===action.issueId);assert(issue&&issue.status!=='CLOSED','Incidencia no disponible');
  assert(typeof action.evidence==='string'&&action.evidence.trim().length>=8,'Documenta la acción correctiva');
  issue.status='CORRECTED';issue.evidence=action.evidence;event(s,'CORRECTION',lot.id,action.evidence,{issueId:issue.id});break;}
 case 'REVIEW_HOLD':{
  if(action.reviewer!=='SIM-QA-01')return fail('Revisión humana simulada requerida');
  if(lot.issues.some(i=>i.status==='OPEN'))return fail('Faltan evidencias de corrección');
  for(const t of TESTS){const last=latestTest(lot,t.id);if(last&&(last.status!=='COMPLETE'||last.result!=='PASS'||!s.equipment[last.resource].valid||s.equipment[last.resource].revision!==last.equipmentRevision))return fail('Ensayo pendiente/no válido: '+t.title)}
  if(Object.values(lot.samples).some(x=>x.status!=='RECEIVED'))return fail('Custodia de muestra no válida');
  for(const issue of lot.issues)if(issue.status==='CORRECTED'){issue.status='CLOSED';issue.reviewer=action.reviewer}
  lot.holds=false;event(s,'HOLD_REVIEW',lot.id,'Retención levantada en escenario; las autorizaciones revocadas requieren nueva revisión. Cantidades conservadas.');break;}
 case 'SAMPLE_CUSTODY':{
  const x=lot.samples[action.sample];assert(x&&['RECEIVED','REJECTED'].includes(action.status),'Muestra no válida');
  assert(typeof action.reason==='string'&&action.reason.trim().length>=5,'Falta registro de custodia');
  x.status=action.status;x.custody.push({at:s.clock.seconds,actor:'SIM-LAB-01',action:action.status,reason:action.reason});
  event(s,'CUSTODY',lot.id,action.reason,{sampleId:x.id});if(action.status==='REJECTED')recordIssue(s,lot,'Cadena de custodia no válida: '+x.id,x.id);break;}
 default:return fail('Acción no reconocida');
 }
 assertState(s);return s;
}
export function validateState(s){try{assertState(s);return true}catch{return false}}
export function assertState(s){
 assert(s&&s.schemaVersion===SCHEMA&&s.provenance==='SIMULATED','Estado o procedencia incompatible');
 assert(integer(s.revision)&&integer(s.sequence)&&s.clock&&Number.isFinite(s.clock.seconds)&&s.clock.seconds>=0&&typeof s.clock.running==='boolean'&&[1,4,8].includes(s.clock.rate),'Reloj/revisión inválidos');
 assert(s.config?.plan==='DEMO_DAIRY_V2_NOT_GAZA_SOP'&&integer(s.config.processingYieldBasisPoints)&&s.config.processingYieldBasisPoints<=10000&&integer(s.config.palletCapacityL)&&s.config.palletCapacityL>0,'Configuración incompatible');
 assert(s.lots&&Object.keys(s.lots).length>0&&Object.keys(s.lots).length<=20&&s.equipment&&Array.isArray(s.events),'Estructura de estado inválida');
 const resources=new Set();
 for(const lot of Object.values(s.lots)){
  assert(lot&&s.lots[lot.id]===lot&&['BOVINE','OVINE'].includes(lot.species)&&integer(lot.plannedL)&&integer(lot.excludedL)&&lot.excludedL<lot.plannedL,'Lote inválido');
  assert(typeof lot.holds==='boolean'&&typeof lot.recall==='boolean'&&Array.isArray(lot.tests)&&Array.isArray(lot.issues)&&Array.isArray(lot.genealogy),'Datos de lote incompletos');
  for(const k of ['producedL',...massKeys])assert(integer(lot.mass?.[k]),'Balance negativo o no numérico: '+k);
  assert(lot.mass.producedL===massKeys.reduce((v,k)=>v+lot.mass[k],0),'Balance de masa incumplido');
  assert(lot.mass.producedL===0||lot.mass.producedL===lot.plannedL,'Producción creada indebidamente');
  const known=new Set();for(const n of lot.genealogy){assert(n.species===lot.species&&!known.has(n.id)&&n.parentIds.every(p=>known.has(p)),'Genealogía inválida/mezcla de especies');known.add(n.id)}
  for(const def of TASKS){const t=lot.tasks?.[def.id];assert(t&&['PENDING','RUNNING','DONE'].includes(t.status),'Tarea inválida');
   if(t.status==='RUNNING'){assert(!resources.has(def.resource),'Doble ocupación de equipo');resources.add(def.resource);assert(Number.isFinite(t.elapsed)&&t.elapsed>=0,'Progreso inválido')}
   if(t.status==='DONE')assert(Number.isFinite(t.completedAt)&&t.completedAt<=s.clock.seconds,'Finalización temporal inválida');
  }
  for(const t of lot.tests){assert(testById[t.testId]&&['RUNNING','COMPLETE'].includes(t.status)&&Number.isFinite(t.startedAt)&&Number.isFinite(t.readyAt)&&t.readyAt>=t.startedAt,'Registro analítico inválido');
   assert(Object.values(lot.samples).some(x=>x.id===t.sampleId),'Ensayo sin muestra');
   if(t.status==='RUNNING'){assert(t.result===null&&!resources.has(t.resource),'Resultado prematuro/equipo duplicado');resources.add(t.resource)}
   else assert(['PASS','FAIL','INVALID'].includes(t.result)&&t.completedAt>=t.readyAt&&t.completedAt<=s.clock.seconds,'Resultado prematuro');
  }
  for(const id of Object.keys(GATES))assert(['PENDING','APPROVED','REVOKED'].includes(lot.gates?.[id]?.status),'Decisión inválida');
  assert(!lot.issues.some(i=>['OPEN','CORRECTED'].includes(i.status))||lot.holds,'Incidencia abierta sin retención');
  assert(integer(lot.deliveredPallets)&&lot.deliveredPallets*s.config.palletCapacityL===lot.mass.deliveredL,'Palés/entregas incoherentes');
 }
 for(const def of [...TASKS,...TESTS])assert(s.equipment[def.resource]&&typeof s.equipment[def.resource].valid==='boolean'&&integer(s.equipment[def.resource].revision),'Equipo no registrado');
 let seq=0;for(const e of s.events){assert(typeof e.id==='string'&&Number(e.id.slice(3))>seq&&Number.isFinite(e.atSimSeconds)&&e.atSimSeconds<=s.clock.seconds,'Registro de auditoría no secuencial');seq=Number(e.id.slice(3));}
 assert(seq===s.sequence,'Secuencia de eventos incoherente');return s;
}
export function lotSummary(s,id){
 const l=lotOf(s,id),active=TASKS.filter(t=>l.tasks[t.id].status==='RUNNING').map(t=>t.title),tests=l.tests.filter(t=>t.status==='RUNNING');
 return {id,species:l.species,held:l.holds,recall:l.recall,active,testsPending:tests.length,mass:clone(l.mass),gates:clone(l.gates)};
}
export function visualSnapshot(s,id){
 const l=lotOf(s,id),active=TASKS.filter(t=>l.tasks[t.id].status==='RUNNING');
 return {schemaVersion:2,provenance:'SIMULATED',lotId:id,species:l.species,simSeconds:s.clock.seconds,held:l.holds,
  active:active.map(t=>({id:t.id,module:t.module,station:t.station,role:t.role,progress:l.tasks[t.id].elapsed/t.durationSimSeconds,qualityIndependent:!!t.qualityIndependent})),
  tests:l.tests.filter(t=>t.status==='RUNNING').map(t=>({id:t.testId,station:testById[t.testId].station,progress:(s.clock.seconds-t.startedAt)/(t.readyAt-t.startedAt)})),
  tankerMoving:!l.holds&&l.tasks['LOGISTICS.TRANSIT'].status==='RUNNING',
  outboundMoving:!l.holds&&l.gates.dispatch.status==='APPROVED'&&l.tasks['DELIVERY.ARRIVE'].status==='RUNNING',
  gates:clone(l.gates),levels:{farm:l.mass.farmTankL/l.plannedL,tanker:l.mass.tankerL/l.plannedL,silo:l.mass.siloL/l.plannedL},roles:ROLES};
}

/** Autoplan schedules tasks and conforming demo assays, but NEVER approves a quality gate. */
export function planReady(input){
 let s=input;
 for(const lotId of Object.keys(s.lots)){
  for(const t of TASKS)if(taskEligibility(s,lotId,t.id).ok)s=reduce(s,{type:'START_TASK',lotId,taskId:t.id});
  for(const t of TESTS)if(!latestTest(s.lots[lotId],t.id)&&testEligibility(s,lotId,t.id).ok)s=reduce(s,{type:'START_TEST',lotId,testId:t.id,scenarioResult:'PASS'});
 }
 return s;
}
