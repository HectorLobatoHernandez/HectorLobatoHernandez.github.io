// GAZA Training Operations — deterministic cross-department digital thread.
// Synthetic demonstration; NEVER production authorization or live GAZA telemetry.
export const departments=['GRANJA','RECOGIDA','LOGÍSTICA ENTRADA','RECEPCIÓN','LABORATORIO','CALIDAD','FABRICACIÓN','ENVASADO','ALMACÉN ASRS','EXPEDICIÓN'];
export const scenarioDefaults={lotId:'DEMO-GAZA-0001',volumeL:12000,temperatureC:3.6,routeKm:38,processingYield:.97,palletCapacityL:720};
const iso=()=>new Date().toISOString();
export function initialOperations(overrides={}){
 const cfg={...scenarioDefaults,...overrides};
 return {schemaVersion:1,provenance:'SIMULATED',config:cfg,stage:0,status:'RUNNING',quality:'PENDING',events:[{type:'CREATED',department:departments[0],at:iso(),detail:'Lote sintético creado'}],analyses:[],departments:departments.map((name,i)=>({name,status:i===0?'ACTIVE':'PENDING'})),inventory:{rawMilkL:cfg.volumeL,processedL:0,packedL:0,pallets:0,dispatchedPallets:0},revision:1};
}
function append(s,type,detail){s.events.push({type,detail,department:departments[s.stage],at:iso()})}
export function transition(current,action){
 if(action.type==='RESET')return initialOperations(current.config);
 const s=structuredClone(current);s.revision++;
 if(action.type==='INCIDENT'){s.status='HOLD';s.quality='ON_HOLD';append(s,'INCIDENT',action.reason||'Incidencia simulada');return s}
 if(action.type==='RESOLVE'){if(s.status==='HOLD'){s.status='RUNNING';s.quality='PENDING';if(s.stage>5){s.stage=5;s.departments=s.departments.map((d,i)=>({...d,status:i<5?'DONE':i===5?'ACTIVE':'PENDING'}));s.inventory.processedL=0;s.inventory.packedL=0;s.inventory.pallets=0;s.inventory.dispatchedPallets=0;append(s,'SIMULATION_ROLLBACK','Escenario retrocedido a calidad para revisión; volúmenes calculados reiniciados')}append(s,'INVESTIGATION_CLOSED','Cierre ficticio: requiere verificación humana real')}return s}
 if(action.type==='TEST'){
  if(s.stage!==4||s.status!=='RUNNING')return s;
  if(!['FISICOQUÍMICA','MICROBIOLOGÍA','INHIBIDORES'].includes(action.test))return s;
  s.analyses=s.analyses.filter(x=>x.name!==action.test).concat({name:action.test,result:action.pass?'PASS':'FAIL',simulated:true});
  append(s,'ANALYSIS',action.test+' '+(action.pass?'PASS':'FAIL'));
  if(!action.pass){s.status='HOLD';s.quality='ON_HOLD'}
  return s;
 }
 if(action.type==='QUALITY_APPROVAL'){
  if(s.stage!==5||s.status!=='RUNNING'||s.analyses.length!==3||s.analyses.some(t=>t.result!=='PASS')){append(s,'BLOCKED','Revisión incompleta: 3 ensayos conformes requeridos');return s}
  s.quality='SIMULATED_APPROVAL';append(s,'QUALITY_APPROVED','Revisión ficticia (no liberación real)');return s;
 }
 if(action.type!=='NEXT')return s;
 if(s.status==='HOLD'){append(s,'BLOCKED','Lote retenido');return s}
 if(s.stage===4&&(s.analyses.length!==3||s.analyses.some(t=>t.result!=='PASS'))){append(s,'BLOCKED','Esperando ensayos');return s}
 if(s.stage===5&&s.quality!=='SIMULATED_APPROVAL'){append(s,'BLOCKED','Aprobación simulada pendiente');return s}
 if(s.stage===departments.length-1){s.status='COMPLETE';append(s,'COMPLETE','Entrega ficticia concluida');return s}
 s.departments[s.stage].status='DONE';s.stage++;
 s.departments[s.stage].status='ACTIVE';
 if(s.stage===6)s.inventory.processedL=Math.round(s.inventory.rawMilkL*s.config.processingYield);
 if(s.stage===7){s.inventory.packedL=s.inventory.processedL;s.inventory.pallets=Math.floor(s.inventory.packedL/s.config.palletCapacityL)}
 if(s.stage===9)s.inventory.dispatchedPallets=s.inventory.pallets;
 append(s,'STAGE_ENTER',departments[s.stage]);return s;
}
export function checkInvariants(s){return s.provenance==='SIMULATED'&&s.inventory.processedL<=s.inventory.rawMilkL&&s.inventory.packedL<=s.inventory.processedL&&s.inventory.dispatchedPallets<=s.inventory.pallets&&!(s.stage>5&&s.status!=='HOLD'&&s.quality!=='SIMULATED_APPROVAL')}
