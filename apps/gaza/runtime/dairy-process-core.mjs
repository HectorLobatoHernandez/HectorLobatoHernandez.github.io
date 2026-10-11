/** GAZA OPS process contract v2. Pure, deterministic TRAINING engine, never an SOP or release system. */
export const KEY = 'gaza:process-flow:v2';
export const PLAN = 'DAIRY-TRAINING-2';
export const STAGES = [
  ['FARM.PREPARE','Preparación / sanidad','farm',12,'FARM-01','MILKING'],
  ['FARM.MILKING','Ordeño y segregación','farm',22,'FARM-01','MILKING'],
  ['FARM.COOLING','Refrigeración de tanque','farm',18,'FARM-02','COOLING'],
  ['LOGISTICS.COLLECTION','Carga y custodia','farm',15,'DRIVER-01','TANKER'],
  ['LOGISTICS.TRANSIT','Transporte · acceso 2','plant',28,'DRIVER-01','TANKER'],
  ['PLANT.RECEIPT','Muestreo / aceptación recepción','labs',0,'QUALITY-01',null],
  ['PLANT.UNLOAD','Descarga a silo segregado','plant',16,'RECEPTION-01','TRANSFER'],
  ['QUALITY.MANUFACTURE','Revisión para fabricar','labs',0,'QUALITY-01',null],
  ['PLANT.MANUFACTURE','Fabricación','plant',30,'PRODUCTION-01','PROCESS'],
  ['PLANT.PACK','Envasado y genealogía','plant',20,'PACK-01','PACKER'],
  ['QUALITY.DISPATCH','Control producto / liberación','labs',0,'QUALITY-01',null],
  ['WAREHOUSE.PALLETIZE','Paletizado / almacén','plant',15,'WAREHOUSE-01','ASRS'],
  ['LOGISTICS.DISPATCH','Carga / entrega · acceso 1','plant',25,'DRIVER-02','OUTBOUND'],
  ['COMPLETE','Entregado · demo','plant',0,'WAREHOUSE-01',null]
].map(([id,name,surface,seconds,owner,equipment])=>({id,name,surface,seconds,owner,equipment}));
export const METHODS = {
  temperature:{name:'Temperatura / recepción',phase:'raw',gate:'receipt',seconds:5,equipment:'THERMOMETER',station:1},
  inhibitors:{name:'Cribado de inhibidores',phase:'raw',gate:'receipt',seconds:12,equipment:'SCREENING',station:1},
  composition:{name:'Fisicoquímica / composición',phase:'raw',gate:'manufacture',seconds:18,equipment:'ANALYSER',station:1},
  microbiology:{name:'Microbiología producto',phase:'finished',gate:'dispatch',seconds:45,equipment:'INCUBATOR',station:2},
  packaging:{name:'Integridad y documentación envase',phase:'finished',gate:'dispatch',seconds:10,equipment:'INSPECTION',station:3}
};
export const EQUIPMENT = {
  MILKING:'Circuito de ordeño',COOLING:'Tanque de frío',TANKER:'Cisterna / compartimentos',TRANSFER:'Bomba de recepción',
  PROCESS:'Línea de proceso',PACKER:'Envasadora',ASRS:'Almacén y paletizado',OUTBOUND:'Camión expedición',
  THERMOMETER:'Termómetro verificado',SCREENING:'Equipo de cribado',ANALYSER:'Analizador fisicoquímico',INCUBATOR:'Incubadora',INSPECTION:'Puesto de control de envase'
};
export const OWNERS = {
  'FARM-01':'Operación ordeño','FARM-02':'Frío e higiene','DRIVER-01':'Recogida / cisterna','RECEPTION-01':'Recepción',
  'LAB-01':'Técnico de laboratorio','QUALITY-01':'Responsable de calidad','PRODUCTION-01':'Producción',
  'PACK-01':'Envasado','WAREHOUSE-01':'Almacén','DRIVER-02':'Expedición','MAINTENANCE-01':'Mantenimiento'
};
const round=n=>Math.round(n*1000)/1000;
const copy=x=>structuredClone(x);
const requireCondition=(value,message)=>{if(!value)throw new Error(message)};
function positive(n,max=1e7){return Number.isFinite(n)&&n>0&&n<=max}
export function createProcess({epoch='DEMO',bovineL=12000,ovineL=1800,yieldRatio=.97,palletL=720}={}) {
  requireCondition(/^[A-Za-z0-9_-]{1,40}$/.test(epoch),'Identificador de sesión inválido');
  requireCondition(positive(bovineL)&&positive(ovineL)&&positive(yieldRatio,1)&&positive(palletL),'Parámetros de escenario inválidos');
  const batches={};
  for(const [species,inputL,code] of [['BOVINE',bovineL,'BOV'],['OVINE',ovineL,'OVI']]) {
    const id=`${epoch}-${code}`;
    batches[id]={id,species,inputL,withheldL:0,yieldRatio,palletL,stage:0,task:null,auto:false,hold:false,
      gates:{receipt:null,manufacture:null,dispatch:null},lotIds:[],samples:[],
      inventory:{unmilkedL:inputL,tankL:0,tankerL:0,siloL:0,processedL:0,packedL:0,deliveredL:0,lossL:0,withheldL:0,pallets:0,dispatchedPallets:0}};
  }
  const s={schemaVersion:2,provenance:'SIMULATED',plan:PLAN,epoch,revision:0,active:Object.keys(batches)[0],
    clock:{seconds:0,playing:false,rate:1},batches,lots:{},samples:{},equipment:Object.fromEntries(Object.entries(EQUIPMENT).map(([id,name])=>[id,{id,name,ready:true,version:1}])),
    incidents:[],events:[],decisions:[],commands:[],nextId:1};
  record(s,'SESSION_CREATED','Dos circuitos separados; cantidades y tiempos ficticios');return s;
}
function record(s,type,detail,batchId=null,extra={}) {
  s.events.push({id:`${s.epoch}-E${s.nextId++}`,at:s.clock.seconds,type,detail,batchId,...extra});
}
function batchOf(s,id=s.active){const b=s.batches[id];requireCondition(b,'Lote de trabajo no encontrado');return b}
function lastLot(s,b){return s.lots[b.lotIds.at(-1)]}
function createLot(s,b,kind,volumeL) {
  const parent=lastLot(s,b),id=`${b.id}-${kind}`;
  requireCondition(!s.lots[id],'No se puede producir dos veces el mismo lote');
  s.lots[id]={id,batchId:b.id,species:b.species,kind,volumeL,parentIds:parent?[parent.id]:[],createdAt:s.clock.seconds};
  b.lotIds.push(id);record(s,'LOT_CREATED',`${kind}: ${volumeL} L`,b.id,{lotId:id,parentIds:parent?[parent.id]:[]});
  return id;
}
function createSample(s,b,phase){const id=`${b.id}-S-${phase}`;requireCondition(!s.samples[id],'Muestra ya creada');
  s.samples[id]={id,batchId:b.id,phase,sourceLotId:b.lotIds.at(-1),custody:'AWAITING_RECEPTION',createdAt:s.clock.seconds,attempts:[]};b.samples.push(id);
  record(s,'SAMPLE_COLLECTED',`Muestra ${phase}; pendiente de custodia`,b.id,{sampleId:id,lotId:b.lotIds.at(-1)});
}
export function latestAttempt(sample,method){return sample?.attempts.filter(x=>x.method===method).at(-1)||null}
export function gateReady(s,b,gate){const needed=Object.entries(METHODS).filter(([,m])=>m.gate===gate);
  return !b.hold&&needed.every(([method,m])=>{const sample=s.samples[`${b.id}-S-${m.phase}`],a=latestAttempt(sample,method);return sample?.custody==='ACCEPTED'&&a?.status==='PASS'&&s.equipment[a.equipment]?.ready&&a.equipmentVersion===s.equipment[a.equipment].version});
}
export function openIncidents(s,b){return s.incidents.filter(i=>i.batchId===b.id&&i.status==='OPEN')}
export function permitsTask(b){return (b.stage<6||!!b.gates.receipt)&&(b.stage<8||!!b.gates.manufacture)&&(b.stage<11||!!b.gates.dispatch)}
export function canStart(s,b){const st=STAGES[b.stage];if(b.hold||b.task||!st.seconds)return false;
  if(st.equipment&&!s.equipment[st.equipment].ready)return false;
  return !Object.values(s.batches).some(other=>other.id!==b.id&&(other.task?.equipment===st.equipment||(st.equipment==='TANKER'&&other.inventory.tankerL>0)))&&
    !(b.stage>=8&&!b.gates.manufacture)&&!(b.stage>=11&&!b.gates.dispatch)&&!(b.stage>=6&&!b.gates.receipt);
}
function startTask(s,b){requireCondition(canStart(s,b),'Tarea bloqueada: revisar etapa, equipo, ocupación o autorización');const st=STAGES[b.stage];
  b.task={id:st.id,owner:st.owner,equipment:st.equipment,elapsed:0,duration:st.seconds};record(s,'TASK_STARTED',st.name,b.id,{owner:st.owner});
}
function completeTask(s,b){const stage=b.stage,v=b.inventory;
  if(stage===1){v.withheldL=b.withheldL;v.tankL=round(v.unmilkedL-b.withheldL);v.unmilkedL=0;createLot(s,b,'TANK',v.tankL);}
  if(stage===3){v.tankerL=v.tankL;v.tankL=0;createLot(s,b,'COMPARTMENT',v.tankerL);}
  if(stage===4)createSample(s,b,'raw');
  if(stage===6){v.siloL=v.tankerL;v.tankerL=0;createLot(s,b,'RECEIPT',v.siloL);}
  if(stage===8){v.processedL=round(v.siloL*b.yieldRatio);v.lossL=round(v.lossL+v.siloL-v.processedL);v.siloL=0;createLot(s,b,'MANUFACTURED',v.processedL);}
  if(stage===9){v.packedL=v.processedL;v.processedL=0;createLot(s,b,'FINISHED',v.packedL);createSample(s,b,'finished');}
  if(stage===11)v.pallets=Math.floor((v.packedL+1e-8)/b.palletL);
  if(stage===12){v.dispatchedPallets=v.pallets;v.deliveredL=round(v.pallets*b.palletL);v.packedL=round(v.packedL-v.deliveredL);record(s,'DISPATCHED',`${v.dispatchedPallets} palés; remanente ${v.packedL} L`,b.id);}
  record(s,'TASK_COMPLETED',STAGES[stage].name,b.id);b.task=null;b.stage++;
}
function incident(s,b,reason,{sampleId=null,attemptId=null,equipment=null}={}) {
  const id=`${s.epoch}-NC${s.nextId++}`;s.incidents.push({id,batchId:b.id,reason,status:'OPEN',createdAt:s.clock.seconds,sampleId,attemptId,equipment,closure:null});
  b.hold=true;b.auto=false;
  // A result/incident never silently erases previous approvals: record their revocation.
  for(const gate of ['receipt','manufacture','dispatch'])if(b.gates[gate]){record(s,'APPROVAL_REVOKED',gate,b.id,{decisionId:b.gates[gate],incidentId:id});b.gates[gate]=null;}
  record(s,b.stage===13?'POST_DISPATCH_ALERT':'HOLD',reason,b.id,{incidentId:id});return id;
}
function tick(s,seconds){requireCondition(Number.isFinite(seconds)&&seconds>=0&&seconds<=10,'Tick fuera de rango');if(!s.clock.playing)return;
  // Bounded steps make the same elapsed time deterministic independent of rendering FPS.
  for(let remaining=round(seconds*s.clock.rate);remaining>1e-8;){const dt=Math.min(.25,remaining);remaining=round(remaining-dt);s.clock.seconds=round(s.clock.seconds+dt);
    for(const sample of Object.values(s.samples))for(const a of sample.attempts)if(a.status==='RUNNING'){
      const eq=s.equipment[a.equipment];
      if(!eq.ready||eq.version!==a.equipmentVersion){a.status='INVALID';incident(s,batchOf(s,sample.batchId),'Ensayo invalidado por metrología',{sampleId:sample.id,attemptId:a.id,equipment:eq.id});continue;}
      a.elapsed=round(a.elapsed+dt);if(a.elapsed>=a.duration){a.elapsed=a.duration;a.completedAt=s.clock.seconds;a.status=a.expected;record(s,'TEST_COMPLETED',`${METHODS[a.method].name}: ${a.status}`,sample.batchId,{sampleId:sample.id,attemptId:a.id});
        if(a.status==='FAIL')incident(s,batchOf(s,sample.batchId),'Resultado adverso: '+METHODS[a.method].name,{sampleId:sample.id,attemptId:a.id});}
    }
    for(const b of Object.values(s.batches)){
      if(b.auto&&!b.task&&canStart(s,b))startTask(s,b);
      if(!b.task||b.hold||!permitsTask(b))continue;
      if(!s.equipment[b.task.equipment].ready)continue;
      b.task.elapsed=round(b.task.elapsed+dt);if(b.task.elapsed>=b.task.duration)completeTask(s,b);
    }
  }
}
export function reduceProcess(current,action){
  assertProcess(current);requireCondition(action&&typeof action.type==='string','Acción inválida');
  if(action.commandId&&current.commands.includes(action.commandId))return current;
  const s=copy(current),b=batchOf(s,action.batchId||s.active);
  switch(action.type){
    case 'SELECT':batchOf(s,action.id);s.active=action.id;break;
    case 'PLAY':s.clock.playing=true;record(s,'CLOCK','Reanudar');break;
    case 'PAUSE':s.clock.playing=false;record(s,'CLOCK','Pausar');break;
    case 'RATE':requireCondition([1,4,8].includes(action.rate),'Velocidad no permitida');s.clock.rate=action.rate;break;
    case 'TICK':tick(s,action.seconds);break;
    case 'AUTO':b.auto=Boolean(action.value);if(b.auto&&canStart(s,b))startTask(s,b);break;
    case 'START_TASK':startTask(s,b);break;
    case 'SEGREGATE':requireCondition(b.stage<2&&!b.task,'Segregación antes del ordeño, sin tarea activa');requireCondition(Number.isFinite(action.litres)&&action.litres>=0&&action.litres<b.inputL,'Volumen segregado inválido');b.withheldL=action.litres;record(s,'SEGREGATION',`${action.litres} L excluidos del circuito comercial`,b.id);break;
    case 'RECEIVE_SAMPLE':{const sample=s.samples[action.sampleId];requireCondition(sample&&sample.batchId===b.id,'Muestra incorrecta');requireCondition(sample.custody==='AWAITING_RECEPTION','Custodia ya registrada');sample.custody=action.accept===false?'REJECTED':'ACCEPTED';sample.receivedAt=s.clock.seconds;record(s,'CUSTODY',sample.custody,b.id,{sampleId:sample.id});if(sample.custody==='REJECTED')incident(s,b,'Muestra rechazada; recoger nueva muestra',{sampleId:sample.id});break;}
    case 'REPLACE_SAMPLE':{const sample=s.samples[action.sampleId];requireCondition(sample&&sample.batchId===b.id&&sample.custody==='REJECTED','Solo sustituir muestra rechazada');requireCondition(typeof action.note==='string'&&action.note.trim().length>=8,'Documentar nueva toma');sample.rejections=sample.rejections||[];sample.rejections.push({createdAt:sample.createdAt,receivedAt:sample.receivedAt,note:action.note});sample.createdAt=s.clock.seconds;sample.custody='AWAITING_RECEPTION';record(s,'SAMPLE_RECOLLECTED',action.note,b.id,{sampleId:sample.id});break;}
    case 'START_TEST':{const method=METHODS[action.method],sample=s.samples[action.sampleId];requireCondition(method&&sample&&sample.batchId===b.id&&sample.phase===method.phase&&sample.custody==='ACCEPTED','Muestra, fase o custodia no válida');
      const eq=s.equipment[method.equipment],prior=latestAttempt(sample,action.method);requireCondition(eq.ready,'Equipo no apto');requireCondition(!prior||['FAIL','INVALID'].includes(prior.status),'Ensayo ya en curso o conforme');
      if(prior)requireCondition(typeof action.note==='string'&&action.note.trim().length>=8,'Documentar investigación del reensayo');
      requireCondition(!Object.values(s.samples).some(x=>x.attempts.some(a=>a.status==='RUNNING'&&a.equipment===eq.id)),'Equipo ocupado');
      const a={id:`${s.epoch}-A${s.nextId++}`,method:action.method,equipment:eq.id,equipmentVersion:eq.version,owner:'LAB-01',status:'RUNNING',expected:action.outcome==='FAIL'?'FAIL':'PASS',elapsed:0,duration:method.seconds,startedAt:s.clock.seconds,note:action.note||'',supersedes:prior?.id||null};sample.attempts.push(a);record(s,'TEST_STARTED',method.name,b.id,{sampleId:sample.id,attemptId:a.id});break;}
    case 'APPROVE':{const gate=action.gate,stage={receipt:5,manufacture:7,dispatch:10}[gate];requireCondition(stage!==undefined&&b.stage>=stage,'Decisión aún no aplicable');requireCondition(action.actor==='QUALITY-01','Rol de calidad requerido (simulado)');requireCondition(!b.gates[gate]&&gateReady(s,b,gate),'Controles pendientes, no válidos o retención abierta');
      if(gate!=='receipt')requireCondition(b.gates.receipt,'Falta aceptación recepción');if(gate==='dispatch')requireCondition(b.gates.manufacture,'Falta revisión de fabricación');
      const id=`${s.epoch}-D${s.nextId++}`;b.gates[gate]=id;s.decisions.push({id,batchId:b.id,gate,actor:action.actor,at:s.clock.seconds,plan:PLAN,attemptIds:Object.entries(METHODS).filter(([,m])=>m.gate===gate).map(([key,m])=>latestAttempt(s.samples[`${b.id}-S-${m.phase}`],key).id)});record(s,'APPROVED',gate+' · solo simulación',b.id,{decisionId:id});if(b.stage===stage)b.stage++;break;}
    case 'HOLD':requireCondition(typeof action.note==='string'&&action.note.trim().length>=8,'Indicar motivo de retención');incident(s,b,action.note);break;
    case 'RESOLVE':{const i=s.incidents.find(x=>x.id===action.incidentId&&x.batchId===b.id&&x.status==='OPEN');requireCondition(i,'Incidencia no disponible');requireCondition(action.actor==='QUALITY-01'&&typeof action.note==='string'&&action.note.trim().length>=8,'Cierre documentado por calidad');
      if(i.equipment)requireCondition(s.equipment[i.equipment].ready,'Equipo aún fuera de servicio');
      if(i.sampleId){const sample=s.samples[i.sampleId];requireCondition(sample.custody==='ACCEPTED','Custodia pendiente');if(i.attemptId){const old=sample.attempts.find(a=>a.id===i.attemptId),latest=latestAttempt(sample,old.method);requireCondition(latest&&latest.id!==old.id&&latest.status==='PASS','Resultado no resuelto; un fallo no se borra');}}
      i.status='CLOSED';i.closure={actor:action.actor,note:action.note,at:s.clock.seconds};b.hold=openIncidents(s,b).length>0;record(s,'INCIDENT_CLOSED',action.note,b.id,{incidentId:i.id});break;}
    case 'EQUIPMENT':{const eq=s.equipment[action.id];requireCondition(eq&&typeof action.note==='string'&&action.note.trim().length>=8,'Equipo y motivo documentado requeridos');requireCondition(typeof action.ready==='boolean'&&action.ready!==eq.ready,'El equipo ya tiene ese estado');eq.ready=action.ready;eq.version++;record(s,'EQUIPMENT',`${eq.name}: ${eq.ready?'APTO':'FUERA DE SERVICIO'} · ${action.note}`);
      for(const bb of Object.values(s.batches))if(bb.task?.equipment===eq.id&&!eq.ready)incident(s,bb,'Equipo de proceso no apto: '+eq.name,{equipment:eq.id});
      // Historical tests retain their record but become invalid when evidence of invalid equipment is supplied.
      for(const sample of Object.values(s.samples))for(const a of sample.attempts)if(a.equipment===eq.id&&['RUNNING','PASS'].includes(a.status)&&!eq.ready){a.previousStatus=a.status;a.status='INVALID';incident(s,batchOf(s,sample.batchId),'Resultado invalidado: '+eq.name,{sampleId:sample.id,attemptId:a.id,equipment:eq.id});}
      break;}
    default:throw new Error('Acción no admitida: '+action.type);
  }
  s.revision++;if(action.commandId)s.commands=[...s.commands.slice(-499),action.commandId];assertProcess(s);return s;
}
export function assertProcess(s){
  requireCondition(s?.schemaVersion===2&&s.provenance==='SIMULATED'&&s.plan===PLAN,'Contrato v2 inválido');
  requireCondition(s.batches&&Object.keys(s.batches).length===2&&s.batches[s.active],'Circuitos incompletos');
  requireCondition(Array.isArray(s.events)&&Array.isArray(s.decisions)&&Array.isArray(s.incidents)&&Array.isArray(s.commands)&&s.samples&&s.lots,'Registros incompletos');
  requireCondition(Number.isInteger(s.revision)&&s.revision>=0&&Number.isInteger(s.nextId)&&s.nextId>0,'Revisión inválida');
  for(const id of Object.keys(EQUIPMENT)){const eq=s.equipment?.[id];requireCondition(eq&&eq.id===id&&typeof eq.ready==='boolean'&&Number.isInteger(eq.version)&&eq.version>0,'Registro de equipo inválido')}
  for(const sm of Object.values(s.samples)){
    requireCondition(sm&&['raw','finished'].includes(sm.phase)&&['AWAITING_RECEPTION','ACCEPTED','REJECTED'].includes(sm.custody)&&Array.isArray(sm.attempts),'Muestra inválida');
    for(const a of sm.attempts)requireCondition(METHODS[a.method]&&a.equipment===METHODS[a.method].equipment&&Number.isFinite(a.elapsed)&&a.elapsed>=0&&a.elapsed<=a.duration&&a.duration===METHODS[a.method].seconds&&['RUNNING','PASS','FAIL','INVALID'].includes(a.status)&&['PASS','FAIL'].includes(a.expected),'Ensayo corrupto');
  }

  requireCondition(Number.isFinite(s.clock.seconds)&&s.clock.seconds>=0&&[1,4,8].includes(s.clock.rate)&&typeof s.clock.playing==='boolean','Reloj inválido');
  for(const b of Object.values(s.batches)){
    requireCondition(['BOVINE','OVINE'].includes(b.species)&&positive(b.inputL)&&positive(b.yieldRatio,1)&&positive(b.palletL),'Especie/cantidad inválida');
    requireCondition(Number.isInteger(b.stage)&&b.stage>=0&&b.stage<STAGES.length&&typeof b.hold==='boolean'&&Array.isArray(b.lotIds)&&Array.isArray(b.samples),'Etapa inválida');const v=b.inventory;
    for(const x of Object.values(v))requireCondition(Number.isFinite(x)&&x>=-1e-7,'Inventario inválido');
    const balance=['unmilkedL','tankL','tankerL','siloL','processedL','packedL','deliveredL','lossL','withheldL'].reduce((a,k)=>a+v[k],0);
    requireCondition(Math.abs(balance-b.inputL)<.01,'Balance de volumen incumplido');requireCondition(Number.isInteger(v.pallets)&&Number.isInteger(v.dispatchedPallets)&&v.dispatchedPallets<=v.pallets,'Palés inválidos');
    requireCondition(Math.abs(v.deliveredL-v.dispatchedPallets*b.palletL)<.01,'Entrega sin balance de palés');
    for(const id of b.lotIds){const lot=s.lots[id];requireCondition(lot?.batchId===b.id&&lot.species===b.species,'Genealogía cruzada');for(const p of lot.parentIds)requireCondition(s.lots[p]?.species===b.species&&s.lots[p]?.batchId===b.id&&p!==id&&b.lotIds.indexOf(p)<b.lotIds.indexOf(id),'Mezcla de especies o parent inválido');}
    for(const sid of b.samples){const sample=s.samples[sid];requireCondition(sample?.batchId===b.id&&s.lots[sample.sourceLotId]?.batchId===b.id,'Muestra huérfana');}
    if(b.task)requireCondition(b.task.id===STAGES[b.stage].id&&b.task.duration>0&&Number.isFinite(b.task.elapsed),'Tarea corrupta');
  }
  return true;
}
export function legacyProjection(s){const b=s.batches[s.active],stage=[0,0,0,1,2,3,3,5,6,7,5,8,9,9][b.stage],v=b.inventory;
  return {schemaVersion:1,provenance:'SIMULATED',derivedFrom:KEY,revision:s.revision,stage,status:b.hold?'HOLD':b.stage===13?'COMPLETE':'RUNNING',quality:b.gates.dispatch?'SIMULATED_APPROVAL':b.hold?'ON_HOLD':'PENDING',
    config:{lotId:b.id,volumeL:b.inputL},departments:Array.from({length:10},()=>({name:STAGES[b.stage].name})),inventory:{rawMilkL:b.inputL,processedL:v.processedL+v.packedL+v.deliveredL,packedL:v.packedL+v.deliveredL,pallets:v.pallets,dispatchedPallets:v.dispatchedPallets}};
}
export function sceneStatus(s,surface){const b=s?.batches?.[s.active];if(!b)return null;const stage=STAGES[b.stage],paused=!s.clock.playing;
  return {batchId:b.id,species:b.species,stage:stage.id,name:stage.name,index:b.stage,held:b.hold,playing:!paused,
    progress:b.task?Math.min(1,b.task.elapsed/b.task.duration):0,activeSurface:stage.surface,rate:s.clock.rate,
    manufactureAllowed:!!b.gates.manufacture,dispatchAllowed:!!b.gates.dispatch,seconds:s.clock.seconds,
    moving:!paused&&!b.hold&&permitsTask(b)&&!!b.task&&s.equipment[b.task.equipment].ready&&(surface===stage.surface||surface==='site'),sampleCount:b.samples.length};
}
