import {processStore as store} from './store.mjs';
import {TASKS,TESTS,GATES,DATA_BOUNDARY,STATIONS,ROLES} from './catalog.mjs';
import {taskEligibility,testEligibility,gateEligibility,latestTest} from './ledger.mjs';
const dom=(tag,text,attributes={})=>{const n=document.createElement(tag);if(text!==null)n.textContent=text;for(const [k,v] of Object.entries(attributes))n.setAttribute(k,String(v));return n};
const styles=`:host{display:block;color:#dfebf4;font:12px/1.55 system-ui,sans-serif;background:#101e2b;border:1px solid #35536b;border-radius:10px;margin:12px 0;overflow:hidden}*{box-sizing:border-box;overflow-wrap:anywhere}header{padding:13px 15px;background:#162c40}h2{overflow-wrap:anywhere;margin:0;font-size:16px;color:#eef6fe}p{margin:6px 0;color:#a7bed0}.inside{padding:13px}button,select,input{font:inherit;max-width:100%;border:1px solid #4c6d84;border-radius:5px;background:#1d3b52;color:#eef7ff;padding:7px 9px}input{width:100%;background:#0c1b27}button{cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}.row{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:8px 0}.title{font-weight:750}small,.muted{font-size:10px;color:#aac0d2}.error{color:#ffd2a0;white-space:pre-line}.gate,.task,.issue{border:1px solid #355268;padding:9px;margin:8px 0;border-radius:6px}.gate.ok{border-color:#67a788}.status{white-space:pre-line;color:#cce2f2;padding:8px;background:#132c40}.metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.metrics div{border:1px solid #314c61;padding:7px}.metrics b{display:block;font-size:16px}details{border-top:1px solid #385269;margin-top:12px;padding-top:9px}summary{cursor:pointer;font-weight:700}progress{width:100%;height:8px}ul{margin:6px 0;padding-left:17px}li{margin:3px 0}#audit{max-height:190px;overflow:auto;font:10px/1.6 ui-monospace,monospace}#audit div{padding:6px;border-bottom:1px solid #334d61}#error{white-space:pre-line}label{display:block;margin:8px 0}a{color:#b4d9ff}`;
export function mountProcessPanel(parent,{module='workflow',station=null}={}){
 const host=dom('section',null,{'data-process-panel':module});parent.append(host);const shadow=host.attachShadow({mode:'open'});
 shadow.innerHTML=`<style>${styles}</style><header><h2>Procesos enlazados · ${module.toUpperCase()}</h2><p>Un registro común. Especies y decisiones separadas.</p></header><div class="inside"><div id="error" class="error" role="status"></div><div class="row"><button id="start">Iniciar escenario compartido</button><select id="lot" aria-label="Lote y especie"></select></div><p id="status" class="status" aria-live="polite"></p><div id="running"><div class="row"><button id="clock">Reanudar</button><select id="rate" aria-label="Velocidad"><option>1</option><option>4</option><option>8</option></select><button id="step">+10 s SIM</button><button id="auto">Autoplan: no</button></div><p class="muted">Autoplan ejecuta tareas y ensayos conformes de ejemplo; nunca aprueba calidad. Los tiempos están comprimidos, no son métodos de laboratorio.</p><div id="metrics" class="metrics"></div><details open><summary>Decisiones independientes</summary><div id="gates"></div></details><details open><summary>Tareas y recursos</summary><div id="station" class="muted"></div><div id="tasks"></div></details><details open><summary>Muestras y ensayos</summary><div id="samples"></div><label>Resultado del siguiente ensayo de entrenamiento <select id="result"><option value="PASS">Conforme simulado</option><option value="FAIL">Adverso simulado</option></select></label><div id="tests"></div></details><details><summary>Incidencias, custodia y metrología</summary><label>Motivo / evidencia documentada <input id="reason" placeholder="Describe la desviación o acción correctiva" maxlength="300"></label><div class="row"><button id="hold">Retener lote</button><button id="reviewHold">Revisar levantamiento</button></div><select id="issue" aria-label="Incidencia"></select><button id="correct">Registrar corrección</button><div id="issues"></div><label>Equipo <select id="equipment"></select></label><div class="row"><button id="eqInvalid">Fuera de servicio</button><button id="eqValid">Verificar equipo</button></div><label>Muestra <select id="sample"></select></label><div class="row"><button id="sampleBad">Invalidar custodia</button><button id="sampleGood">Registrar custodia válida</button></div><p class="muted">Un cambio metrológico requiere reensayo justificado. Un resultado adverso nunca se borra. Después de una corrección se necesita revisión del responsable ficticio.</p></details><details><summary>Genealogía y auditoría</summary><div id="genealogy"></div><div id="audit"></div></details><div class="row"><button id="export">Exportar registro</button><button id="reset">Archivar y reiniciar DEMO</button></div></div><p class="muted" id="boundary"></p></div>`;
 const $=id=>shadow.getElementById(id);let activeStation=station,busy=false;
 $('boundary').textContent=DATA_BOUNDARY;
 const reason=()=>$('reason').value.trim();
 const action=async a=>{if(busy)return;busy=true;$('error').textContent='';try{return await store.dispatch({...a,lotId:store.selected})}catch(e){$('error').textContent=e.message}finally{busy=false}};
 const call=async fn=>{try{await fn()}catch(e){$('error').textContent=e.message}};
 $('start').onclick=()=>call(()=>store.start());$('lot').onchange=()=>store.setLot($('lot').value);
 $('clock').onclick=()=>action({type:'CLOCK',running:!store.state.clock.running,rate:Number($('rate').value)});
 $('rate').onchange=()=>action({type:'CLOCK',running:store.state.clock.running,rate:Number($('rate').value)});
 $('step').onclick=()=>action({type:'TICK',seconds:10});
 $('auto').onclick=()=>action({type:'AUTO',enabled:!store.state.autoTasks});
 $('hold').onclick=()=>action({type:'INCIDENT',reason:reason()});
 $('correct').onclick=()=>action({type:'CORRECT_ISSUE',issueId:$('issue').value,evidence:reason()});
 $('reviewHold').onclick=()=>action({type:'REVIEW_HOLD',reviewer:'SIM-QA-01'});
 $('eqInvalid').onclick=()=>action({type:'EQUIPMENT',resource:$('equipment').value,valid:false,reason:reason()});
 $('eqValid').onclick=()=>action({type:'EQUIPMENT',resource:$('equipment').value,valid:true,reason:reason()});
 $('sampleBad').onclick=()=>action({type:'SAMPLE_CUSTODY',sample:$('sample').value,status:'REJECTED',reason:reason()});
 $('sampleGood').onclick=()=>action({type:'SAMPLE_CUSTODY',sample:$('sample').value,status:'RECEIVED',reason:reason()});
 $('reset').onclick=()=>{if(confirm('Archivar los registros existentes y reiniciar solo la simulación v2. ¿Continuar?'))call(()=>store.reset())};
 $('export').onclick=()=>{const raw=store.export();if(!raw)return;const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})),a=dom('a',null,{href:url,download:'GAZA-process-ledger-v2.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),500)};
 function options(el,entries){const value=el.value;el.replaceChildren(...entries.map(([id,label])=>dom('option',label,{value:id})));if(entries.some(x=>x[0]===value))el.value=value}
 function render({state:s,error,selected}){
  $('start').hidden=!!s;$('lot').hidden=!s;$('running').hidden=!s;$('start').disabled=!store.writable;
  if(error)$('error').textContent=error;
  if(!s){$('status').textContent='No hay registro v2 activo. La navegación 3D no crea producción ni sustituye registros históricos.';return}
  const l=s.lots[selected];options($('lot'),Object.values(s.lots).map(x=>[x.id,x.id+' · '+(x.species==='BOVINE'?'VACUNO':'OVINO')]));$('lot').value=selected;
  $('clock').textContent=s.clock.running?'Pausar':'Reanudar';$('rate').value=String(s.clock.rate);$('step').disabled=s.clock.running;
  $('auto').textContent='Autoplan: '+(s.autoTasks?'activo':'no');
  $('status').textContent=`${selected} · ${l.holds?'RETENIDO':'EN ESCENARIO'}${l.recall?' · REVISIÓN DE RETIRADA':''}\nSIM ${s.clock.seconds.toFixed(1)} s · revisión ${s.revision} · ${s.config.plan}`;
  const metrics=[['Tanque granja',l.mass.farmTankL],['Cisterna',l.mass.tankerL],['Silo recepción',l.mass.siloL],['En proceso',l.mass.wipL],['Envasado / almacén',l.mass.packedL],['En transporte',l.mass.shippingL],['Entregado',l.mass.deliveredL],['Segregado + merma',l.mass.segregatedL+l.mass.lossL]];
  $('metrics').replaceChildren(...metrics.map(([title,n])=>{const d=dom('div',title);d.append(dom('b',n.toLocaleString('es-ES')+' L'));return d}));
  $('gates').replaceChildren(...Object.entries(GATES).map(([id,g])=>{
   const e=gateEligibility(s,selected,id),d=dom('div',null,{class:'gate'+(l.gates[id].status==='APPROVED'?' ok':'')});
   d.append(dom('div',g.title,{class:'title'}),dom('p',l.gates[id].status));
   const b=dom('button','Revisar · SIM-QA-01',{'data-gate':id});b.disabled=!e.ok||l.gates[id].status==='APPROVED';b.onclick=()=>action({type:'REVIEW_GATE',gate:id,reviewer:'SIM-QA-01'});d.append(b,dom('p',e.reason||'Evidencias del plan completas',{class:'muted'}));return d;
  }));
  const filter=t=>(module==='workflow'||module==='site'||module==='mission'||(module==='plant'?['plant','logistics','warehouse'].includes(t.module):t.module===module))&&(activeStation===null||t.station===activeStation||(module==='farm'&&activeStation===2&&t.id==='FARM.FEED'));
  $('station').textContent=activeStation===null?'Vista de departamento; seleccionar no modifica fases.':STATIONS[module]?.[activeStation]||'Estación seleccionada';
  $('tasks').replaceChildren(...TASKS.filter(filter).map(t=>{
   const record=l.tasks[t.id],e=taskEligibility(s,selected,t.id),d=dom('div',null,{class:'task','data-task':t.id});
   d.append(dom('div',t.title,{class:'title'}),dom('p',ROLES[t.role]+' · '+record.status,{class:'muted'}));
   if(record.status==='RUNNING')d.append(dom('progress',null,{max:t.durationSimSeconds,value:record.elapsed}));
   const list=dom('ul',null);list.append(...t.steps.map(x=>dom('li',x)));d.append(list);
   const b=dom('button','Iniciar tarea');b.disabled=!e.ok;b.title=e.reason;b.onclick=()=>action({type:'START_TASK',taskId:t.id});d.append(b,dom('p',e.ok?`${t.durationSimSeconds} s SIM · equipo ${t.resource}`:e.reason,{class:'muted'}));return d;
  }));
  $('samples').replaceChildren(...Object.values(l.samples).map(x=>dom('p',x.id+' · '+x.status+' · origen '+x.nodeId,{class:'muted'})));
  $('tests').replaceChildren(...TESTS.filter(t=>module!=='labs'||activeStation===null||t.station===activeStation).map(t=>{
   const e=testEligibility(s,selected,t.id),last=latestTest(l,t.id),d=dom('div',null,{class:'task','data-test':t.id});
   d.append(dom('div',t.title,{class:'title'}),dom('p',last?last.status+' · '+(last.result||'pendiente de tiempo y lectura'):'Sin ejecución'));
   if(last?.status==='RUNNING')d.append(dom('progress',null,{max:last.readyAt-last.startedAt,value:s.clock.seconds-last.startedAt}));
   const b=dom('button',last?'Reensayar con justificación':'Iniciar ensayo');b.disabled=!e.ok;b.onclick=()=>action({type:'START_TEST',testId:t.id,scenarioResult:$('result').value,reason:reason()});d.append(b,dom('p',e.ok?`Tiempo comprimido ${t.durationSimSeconds} s SIM`:e.reason,{class:'muted'}));return d;
  }));
  options($('equipment'),Object.keys(s.equipment).map(id=>[id,id+' · '+(s.equipment[id].valid?'APTO':'FUERA DE SERVICIO')]));
  options($('sample'),Object.keys(l.samples).map(id=>[id,l.samples[id].id]));
  options($('issue'),l.issues.filter(i=>i.status!=='CLOSED').map(i=>[i.id,i.id+' · '+i.status]));
  $('issues').replaceChildren(...l.issues.map(i=>dom('p',i.id+' · '+i.status+' · '+i.reason,{class:'issue'})));
  $('genealogy').replaceChildren(...l.genealogy.map(n=>dom('p',(n.parentIds[0]||'ORIGEN')+' → '+n.id+' · '+n.kind,{class:'muted'})));
  $('audit').replaceChildren(...s.events.filter(e=>!e.lotId||e.lotId===selected).slice(-35).reverse().map(e=>dom('div',`${e.id} · ${e.atSimSeconds.toFixed(1)} s · ${e.type} · ${e.detail}`)));
 }
 const unsubscribe=store.subscribe(render);
 return {host,setStation(id){activeStation=id;render({state:store.state,error:store.error,selected:store.selected})},dispose(){unsubscribe();host.remove()}};
}
