/** Spain wall clock: network-backed when possible, deterministic fallback otherwise. No process quantities are written here. */
export const SPAIN_TZ='Europe/Madrid';
export const SPAIN_TIME_URL='https://timeapi.io/api/time/current/zone?timeZone=Europe%2FMadrid';
const fmt=new Intl.DateTimeFormat('es-ES',{timeZone:SPAIN_TZ,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const dateFmt=new Intl.DateTimeFormat('es-ES',{timeZone:SPAIN_TZ,weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
function minuteOf(date){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:SPAIN_TZ,hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(date);const h=Number(parts.find(p=>p.type==='hour')?.value||0),m=Number(parts.find(p=>p.type==='minute')?.value||0);return h*60+m}
function fromPayload(j){if(!j||!Number.isInteger(j.year)||!Number.isInteger(j.month)||!Number.isInteger(j.day)||!Number.isInteger(j.hour)||!Number.isInteger(j.minute)||!Number.isInteger(j.seconds))throw Error('Respuesta horaria incompleta');const wall=new Date(Date.UTC(j.year,j.month-1,j.day,j.hour,j.minute,j.seconds,j.milliSeconds||0));return {serverFields:{year:j.year,month:j.month,day:j.day,hour:j.hour,minute:j.minute,seconds:j.seconds},minute:j.hour*60+j.minute,display:String(j.hour).padStart(2,'0')+':'+String(j.minute).padStart(2,'0')+':'+String(j.seconds).padStart(2,'0'),date:String(j.day).padStart(2,'0')+'/'+String(j.month).padStart(2,'0')+'/'+j.year,wall}}
export function deviceSpainNow(now=new Date()){return {date,dateText:dateFmt.format(date=now),display:fmt.format(date),minute:minuteOf(date),source:'DEVICE_IANA_FALLBACK',timezone:SPAIN_TZ,verifiedAt:null,network:false}}
export function createSpainClock({fetchImpl=fetch,refreshMs=300000}={}){
 let base=null,basePerf=0,lastError=null,lastSync=0,closed=false,listeners=new Set();
 const snapshot=()=>{if(base){const elapsed=Math.max(0,performance.now()-basePerf),d=new Date(base.wall.getTime()+elapsed),m=(base.minute+elapsed/60000)%1440;return {display:fmt.format(d),dateText:dateFmt.format(d),minute:m,source:'TIMEAPI_IO',timezone:SPAIN_TZ,verifiedAt:lastSync,network:true,error:lastError}}const d=deviceSpainNow(new Date());return {...d,error:lastError}};
 const emit=()=>{const s=snapshot();for(const fn of listeners)try{fn(s)}catch{}return s};
 async function sync(){if(closed)return snapshot();try{const r=await fetchImpl(SPAIN_TIME_URL,{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json(),p=fromPayload(j);base={...p,wall:new Date()}; // local Date is only the ticking carrier; displayed Madrid fields come from server minute/date.
   base.wall.setHours(p.serverFields.hour,p.serverFields.minute,p.serverFields.seconds,p.wall.getUTCMilliseconds());basePerf=performance.now();lastSync=Date.now();lastError=null;
 }catch(e){lastError=e?.message||String(e)}return emit()}
 const timer=setInterval(sync,refreshMs),ticker=setInterval(emit,1000);sync();
 return {snapshot,sync,subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn)},close(){closed=true;clearInterval(timer);clearInterval(ticker);listeners.clear()}};
}
export function alignedStartMinute(realMinute,simSeconds=0){if(!Number.isFinite(realMinute)||!Number.isFinite(simSeconds)||simSeconds<0)throw Error('Hora España o tiempo SIM inválidos');return Math.round(((realMinute-simSeconds/60)%1440+1440)%1440)%1440}
