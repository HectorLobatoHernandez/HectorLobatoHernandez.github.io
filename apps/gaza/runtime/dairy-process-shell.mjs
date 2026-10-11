import {subscribeProcess} from './dairy-process-store.mjs';
import {STAGES} from './dairy-process-core.mjs';
// Same-origin iframe bridge, read-only. The existing shell also consumes the v1 projection.
function updateShell(s,error){
 try{
  const doc=window.parent.document,box=doc.getElementById('qualityBridge'),label=doc.getElementById('qualityBridgeState');if(!box||!label)return;
  box.querySelector('span').textContent='TRAZABILIDAD CONECTADA · SIMULACIÓN v2';
  label.textContent=s?`${s.active} · ${STAGES[s.batches[s.active].stage].name} · ${s.batches[s.active].hold?'RETENIDO':'DEMO'} · ${s.batches[s.active].inventory.dispatchedPallets} palés`:error||'Inicia la simulación desde Workflow, Granja o Labs';
 }catch{/* Embedding on another origin never grants access or trusts foreign messages. */}
}
subscribeProcess(updateShell);
