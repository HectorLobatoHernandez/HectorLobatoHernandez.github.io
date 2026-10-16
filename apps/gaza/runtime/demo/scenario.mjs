import {initialState,reduce,validateState,gateEligibility} from '../processes/ledger.mjs';
import {networkConfig} from '../processes/farm-network.mjs';
/** Reproducible staging via legal demo transitions; no quality gate is approved here. */
export function createDemonstration({running=true,living=null}={}) {
 let state=initialState({...networkConfig(),...(living?{living}:{})});
 state=reduce(state,{type:'AUTO',enabled:true});
 for(let i=0;i<120;i++){
  state=reduce(state,{type:'TICK',seconds:1});
  if(state.lots['SIM-BOV-001'].tasks['FARM.MILKING'].status==='RUNNING')break;
 }
 if(state.lots['SIM-BOV-001'].tasks['FARM.MILKING'].status!=='RUNNING')throw Error('No se pudo preparar el escenario de ordeño.');
 state=reduce(state,{type:'TICK',seconds:6});
 state=reduce(state,{type:'CLOCK',running,rate:1});
 if(!validateState(state)||Object.values(state.lots).some(l=>Object.values(l.gates).some(g=>g.status==='APPROVED')))throw Error('Escenario de presentación inválido.');
 return state;
}
/** A stocked, auditable presentation state. Every litre reaches storage through
 * normal tasks and simulated human quality reviews, never direct mass edits. */
export function createWarehouseDemonstration({running=true,living=null}={}){
 let state=initialState({...networkConfig(),...(living?{living}:{})});
 state=reduce(state,{type:'AUTO',enabled:true});
 const ids=Object.keys(state.lots);
 for(let step=0;step<650;step++){
  for(const lotId of ids)for(const gate of ['admission','manufacturing'])
   if(state.lots[lotId].gates[gate].status==='PENDING'&&gateEligibility(state,lotId,gate).ok)
    state=reduce(state,{type:'REVIEW_GATE',lotId,gate,reviewer:'SIM-QA-01'});
  if(ids.every(id=>state.lots[id].tasks['WAREHOUSE.PUTAWAY'].status==='DONE'&&gateEligibility(state,id,'dispatch').ok))break;
  state=reduce(state,{type:'TICK',seconds:1});
 }
 if(!ids.every(id=>state.lots[id].tasks['WAREHOUSE.PUTAWAY'].status==='DONE'&&gateEligibility(state,id,'dispatch').ok))throw Error('No se pudo preparar el almacén SIM.');
 // Stop autonomous dispatch: loading is an explicit action from Plant.
 state=reduce(state,{type:'AUTO',enabled:false});
 state=reduce(state,{type:'CLOCK',running,rate:1});
 if(!validateState(state)||!ids.every(id=>state.lots[id].mass.packedL>0))throw Error('Escenario de almacén inválido.');
 return state;
}
