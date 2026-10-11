import {TASKS} from '../processes/catalog.mjs';
import {validateState,taskEligibility} from '../processes/ledger.mjs';
export function taskView(s,lot,id){const d=TASKS.find(t=>t.id===id),t=lot.tasks[id];if(!d||!t)return null;let status=t.status,reason='';if(status==='RUNNING'){if(!s.equipment[d.resource].valid){status='UNAVAILABLE';reason='Equipo no apto'}else if(lot.holds&&!d.qualityIndependent){status='HELD';reason='Retención activa'}}else if(status==='PENDING'){const e=taskEligibility(s,lot.id,id);status=e.ok?'READY':'WAITING';reason=e.reason}return {id,status,resource:d.resource,role:d.role,station:d.station,elapsed:t.elapsed||0,progress:t.status==='DONE'?1:Math.max(0,Math.min(1,(t.elapsed||0)/d.durationSimSeconds)),reason};}
export function projectFarm(s,selected){
 const empty={ready:false,error:null,lotId:null,species:null,seconds:0,tasks:{},lots:[],sources:[],total:{plannedL:0,producedL:0,excludedL:0,farmTankL:0,tankerL:0,deliveredL:0},samples:[],sourceCount:0,held:false};
 if(!s)return empty;if(!validateState(s)||!s.lots[selected])return {...empty,error:'Registro incompatible: escena sin actividad'};
 const l=s.lots[selected],lots=Object.values(s.lots),ids=TASKS.filter(t=>t.module==='farm'||t.id==='LOGISTICS.TRANSIT').map(t=>t.id);
 const total=lots.reduce((r,l)=>({plannedL:r.plannedL+l.plannedL,producedL:r.producedL+l.mass.producedL,excludedL:r.excludedL+l.mass.segregatedL,farmTankL:r.farmTankL+l.mass.farmTankL,tankerL:r.tankerL+l.mass.tankerL,deliveredL:r.deliveredL+l.mass.deliveredL}),empty.total);
 return {...empty,ready:true,lotId:l.id,species:l.species,seconds:s.clock.seconds,held:l.holds,tasks:Object.fromEntries(ids.map(id=>[id,taskView(s,l,id)])),total,
  lots:lots.map(l=>({id:l.id,species:l.species,plannedL:l.plannedL,excludedL:l.excludedL,mass:{...l.mass},held:l.holds,sourceCount:l.sourceContributions?.length||0,cooled:l.tasks['FARM.COOL'].status==='DONE',coolerValid:s.equipment['bulk-cooler'].valid})),
  sources:(l.sourceContributions||[]).map(r=>({...r,status:l.tasks['FARM.MILKING'].status==='DONE'?'APORTACIÓN SIM REGISTRADA':'PREVISTA SIM'})),
  sourceCount:lots.reduce((n,l)=>n+(l.sourceContributions?.length||0),0),samples:Object.values(l.samples).map(x=>({id:x.id,origin:x.nodeId,status:x.status})),genealogy:l.genealogy.map(n=>({...n,parentIds:[...n.parentIds]}))};
}
