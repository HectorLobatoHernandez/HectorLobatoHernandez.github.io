import {initialState,reduce,validateState} from '../processes/ledger.mjs';
import {networkConfig} from '../processes/farm-network.mjs';
/** Reproducible staging via legal demo transitions; no quality gate is approved here. */
export function createDemonstration({running=true}={}) {
 let state=initialState(networkConfig());
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
