import {processStore as store} from '../processes/store.mjs';
import {clockOf,environmentOf} from './model.mjs';
import {propagateMode} from '../demo/session.mjs';
/** Cartography remains a reference layer; shipment quantities and time come from the common ledger. */
export function mountContextStatus({scene=null,THREE=null,kind='territory'}={}){
 const bar=document.createElement('section');bar.id='livingContext';bar.style.cssText='position:fixed;z-index:999;left:12px;bottom:10px;max-width:calc(100vw - 24px);padding:8px 12px;border:1px solid #547f78;border-radius:5px;background:#071e2cf2;color:#d9e9e4;font:11px system-ui;display:flex;gap:9px;flex-wrap:wrap';
 const label=document.createElement('span');bar.append(label);for(const [target,title]of [['site','Planta'],['farm','Granja'],['labs','Laboratorio']]){const a=document.createElement('a');a.textContent=title;a.href=propagateMode('mission-control.html?view='+target,location.search);a.style.color='#aaceba';a.onclick=e=>{if(parent!==window){e.preventDefault();parent.postMessage({type:'GAZA_NAVIGATE_V1',target},location.origin)}};bar.append(a)}document.body.append(bar);
 const lights=[];scene?.traverse(o=>{if(o.isLight)lights.push(o)});
 const off=store.subscribe(({state,selected,error})=>{const c=clockOf(state),env=environmentOf(state),l=state?.lots?.[selected];label.textContent=(error?'Registro no disponible':c.text+' SIM · '+(l?l.id+' · cisterna '+l.mass.tankerL+' L · expedición '+l.mass.shippingL+' L':'sin lote'))+' · mapa de contexto, no posición telemétrica';
  if(scene&&THREE){scene.background=new THREE.Color(0x071221).lerp(new THREE.Color(0x718793),env.daylight);for(const light of lights)light.intensity=light.isDirectionalLight?env.sunIntensity:env.ambientIntensity;}
  window.__GAZA_CONTEXT_OPS__={kind,scope:store.scope.id,clockSeconds:c.seconds,lotId:selected,environment:env,quantitySource:'PROCESS_LEDGER_V2',positionSource:'CONTEXT_NOT_LIVE_TRACKING'};
 });return {dispose(){off();bar.remove()}};
}
