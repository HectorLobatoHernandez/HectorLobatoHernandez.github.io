import {processStore} from '../processes/store.mjs';

// Read-only projection of the same ledger used by Farm, Labs and Workflow.
// No vehicle identity is assigned to a lot without an authorised transport source.
export function mountMaterialFlow(host){
 const inbound=document.createElement('div'),outbound=document.createElement('div'),note=document.createElement('p');
 const title=document.createElement('h2');title.textContent='Materia prima y expedición';
 inbound.className='flowCard';outbound.className='flowCard out';note.className='flowNote';
 const link=document.createElement('a');link.href='mission-control.html?view=workflow';link.target='_top';link.textContent='Abrir proceso y lotes →';
 const docks=document.createElement('a');docks.href='mission-control.html?view=site&dock=1'+(new URLSearchParams(location.search).get('demo')==='company'?'&demo=company':'');docks.target='_top';docks.textContent='Ver muelles y stock por producto →';host.append(title,inbound,outbound,note,link,document.createElement('br'),docks);
 const litres=n=>Number(n||0).toLocaleString('es-ES')+' L';
 const render=({state})=>{
  if(!state?.lots){inbound.innerHTML='<b>Entrada · sin escenario activo</b><small>Inicia un lote en Proceso y lotes para ver recogida, recepción y calidad.</small>';outbound.innerHTML='<b>Salida · sin escenario activo</b><small>La expedición requiere fabricación y liberación del lote de demostración.</small>';note.textContent='Los camiones del plano son ilustrativos y no están asignados a un lote real.';return}
  const lots=Object.values(state.lots),total=key=>lots.reduce((n,l)=>n+Number(l.mass?.[key]||0),0);
  const arrivals=lots.map(l=>l.tasks?.['LOGISTICS.TRANSIT']?.status).filter(Boolean),dispatch=lots.map(l=>l.tasks?.['DISPATCH.LOAD']?.status).filter(Boolean);
  const held=lots.filter(l=>l.holds).length,ready=lots.filter(l=>l.gates?.dispatch?.status==='APPROVED').length;
  inbound.replaceChildren();
  const a=document.createElement('b'),b=document.createElement('small');a.textContent='Entrada · leche cruda agregada';b.textContent='Granja '+litres(total('farmTankL'))+' · cisterna '+litres(total('tankerL'))+' · recepción '+litres(total('siloL'))+' · tránsito '+(arrivals.includes('RUNNING')?'en curso SIM':'pendiente SIM');inbound.append(a,b);
  outbound.replaceChildren();
  const c=document.createElement('b'),d=document.createElement('small');c.textContent='Salida · producto envasado';d.textContent='Almacén '+litres(total('packedL'))+' · en transporte '+litres(total('shippingL'))+' · entregado '+litres(total('deliveredL'))+' · liberados '+ready+'/'+lots.length+' · carga '+(dispatch.includes('RUNNING')?'en curso SIM':'pendiente SIM');outbound.append(c,d);
  note.textContent=(held?held+' lote(s) retenido(s) · ':'')+'Registro común SIM. Los vehículos del mapa no representan asignaciones, importaciones aduaneras ni exportaciones verificadas.';
 };
 return processStore.subscribe(render);
}
