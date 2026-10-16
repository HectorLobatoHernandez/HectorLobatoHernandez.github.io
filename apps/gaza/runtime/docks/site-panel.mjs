import {processStore} from '../processes/store.mjs';
import {FLEET,projectDocks} from './model.mjs?release=gaza-site-docks-v23';

/** The dock controls live in the Plant viewer and read the common SIM ledger. */
export function mountSiteDockPanel({onOpen=()=>{},onTruck=()=>{},onPractice=()=>{}}={}){
 const host=document.createElement('section');host.className='panel';host.id='siteDockPanel';
 host.innerHTML='<h2>Muelles y almacén · dentro de Planta</h2><p>Abre la cubierta de la fábrica y enfoca el área sin cambiar de escena.</p><div class="row"><button id="dockFocus" type="button">Ver muelles sin cubierta</button><button id="rackFocus" type="button">Ver almacén 9 niveles</button></div><label class="field"><span>Vehículo SIM en el muelle</span><select id="dockVehicle" aria-label="Camión del muelle"></select></label><button id="dockPractice" type="button" aria-pressed="false">Ensayar carga / descarga</button><p id="dockOperation" class="status"></p><h3>Palés y ocupación del registro SIM</h3><div id="dockStock"></div><p id="dockTotals" class="status"></p><p class="small">Ocupación calculada sobre 16 posiciones visuales por familia. No es el aforo real de GAZA. Los vehículos no están asignados a expediciones reales; sin conexión WMS, báscula o sensores.</p>';
 const style=document.createElement('style');style.textContent='#siteDockPanel{border-color:#82bbc2}#siteDockPanel h3{font-size:12px;margin:12px 0 5px}#siteDockPanel .small{font-size:10px;line-height:1.45;color:#acc4cd}#siteDockPanel select{width:100%}#siteDockPanel .dockFamily{padding:8px;margin:7px 0;background:#0b2939;border-radius:5px;font-size:11px}#siteDockPanel .dockFamily b{display:block}#siteDockPanel .meter{height:7px;background:#345362;border-radius:9px;margin:5px 0;overflow:hidden}#siteDockPanel .meter span{display:block;height:100%;background:var(--family);width:var(--fill)}';document.head.append(style);
 document.querySelector('aside').prepend(host);
 const $=id=>host.querySelector('#'+id),selector=$('dockVehicle');
 for(const v of FLEET){const option=document.createElement('option');option.value=v.id;option.textContent=v.id+' · '+v.name+' · '+v.kind;selector.append(option)}
 const key='gaza:docks:truck:v1';let selected=localStorage.getItem(key)||FLEET[0].id;if(!FLEET.some(v=>v.id===selected))selected=FLEET[0].id;selector.value=selected;
 let state=null,practice=false,view=projectDocks(null,selected);
 function render(){view=projectDocks(state,selected);$('dockOperation').textContent=view.truck.name+' · '+view.operation+' · '+view.operationState+(practice?' · ENSAYO VISUAL':'');
  const rows=view.families.map(f=>{const row=document.createElement('div');row.className='dockFamily';const title=document.createElement('b'),meter=document.createElement('div'),fill=document.createElement('span'),text=document.createElement('small');title.textContent=f.name+' · '+f.occupancy+' %';meter.className='meter';fill.style.cssText='--family:'+f.color+';--fill:'+f.occupancy+'%';meter.append(fill);text.textContent=f.full+' palés completos · '+f.partial+' L parciales ('+f.partialPct+' %) · '+f.usedSlots+'/'+f.capacity+' posiciones SIM · '+(f.released?'liberado':'pendiente');row.append(title,meter,text);return row});$('dockStock').replaceChildren(...rows);
  $('dockTotals').textContent=view.stockPallets+' palés completos en stock · '+view.shippingL.toLocaleString('es-ES')+' L en transporte · '+view.inboundL.toLocaleString('es-ES')+' L en cisterna · revisión '+(view.revision??'—')+'.';
  onTruck(view.truck,view);window.__GAZA_SITE_DOCKS__={selected,practice,revision:view.revision,families:view.families.map(f=>({id:f.id,full:f.full,partial:f.partial,occupancy:f.occupancy})),provenance:view.provenance};
 }
 processStore.subscribe(({state:next})=>{state=next;render()});
 selector.onchange=()=>{selected=selector.value;localStorage.setItem(key,selected);render()};
 $('dockPractice').onclick=()=>{practice=!practice;$('dockPractice').setAttribute('aria-pressed',String(practice));$('dockPractice').textContent=practice?'Detener ensayo visual':'Ensayar carga / descarga';onPractice(practice,view)};
 $('dockFocus').onclick=()=>onOpen('shipping');$('rackFocus').onclick=()=>onOpen('asrs');
 const quick=document.getElementById('docksQuick');quick.onclick=()=>onOpen('shipping');if(new URLSearchParams(location.search).get('dock')==='1')queueMicrotask(()=>onOpen('shipping'));
 render();return {open:area=>onOpen(area),get view(){return view},get practice(){return practice}};
}
