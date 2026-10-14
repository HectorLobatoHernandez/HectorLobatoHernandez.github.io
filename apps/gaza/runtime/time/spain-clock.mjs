/** Spain wall clock: network-backed when possible, deterministic fallback otherwise. No process quantities are written here. */
export const SPAIN_TZ='Europe/Madrid';
export const SPAIN_TIME_URL='https://timeapi.io/api/Time/current/zone?timeZone=Europe%2FMadrid';
const fmt=new Intl.DateTimeFormat('es-ES',{timeZone:SPAIN_TZ,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const dateFmt=new Intl.DateTimeFormat('es-ES',{timeZone:SPAIN_TZ,weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
const utcDateFmt=new Intl.DateTimeFormat('es-ES',{timeZone:'UTC',weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
function minuteOf(date){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:SPAIN_TZ,hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(date);const h=Number(parts.find(p=>p.type==='hour')?.value||0),m=Number(parts.find(p=>p.type==='minute')?.value||0);return h*60+m}
function parsePayload(j){if(!j||![j.year,j.month,j.day,j.hour,j.minute,j.seconds].every(Number.isInteger))throw Error('Respuesta horaria incompleta');return {year:j.year,month:j.month,day:j.day,secondOfDay:j.hour*3600+j.minute*60+j.seconds+(Number(j.milliSeconds)||0)/1000}}
export function deviceSpainNow(now=new Date()){return {dateText:dateFmt.format(now),display:fmt.format(now),minute:minuteOf(now),source:'DEVICE_IANA_FALLBACK',timezone:SPAIN_TZ,verifiedAt:null,network:false}}
export function createSpainClock({fetchImpl=fetch,refreshMs=300000,nowPerf=()=>performance.now()}={}){
 let base=null,basePerf=0,lastError=null,lastSync=0,closed=false,listeners=new Set();
 const snapshot=()=>{if(base){const elapsed=Math.max(0,nowPerf()-basePerf)/1000,total=base.secondOfDay+elapsed,dayDelta=Math.floor(total/86400),seconds=((total%86400)+86400)%86400,h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),sec=Math.floor(seconds%60),date=new Date(Date.UTC(base.year,base.month-1,base.day+dayDelta));return {display:String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'),dateText:utcDateFmt.format(date),minute:h*60+m+sec/60,source:'TIMEAPI_IO',timezone:SPAIN_TZ,verifiedAt:lastSync,network:true,error:lastError}}const d=deviceSpainNow(new Date());return {...d,error:lastError}};
 const emit=()=>{const s=snapshot();for(const fn of listeners)try{fn(s)}catch{}return s};
 async function sync(){if(closed)return snapshot();try{const r=await fetchImpl(SPAIN_TIME_URL,{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('HTTP '+r.status);base=parsePayload(await r.json());basePerf=nowPerf();lastSync=Date.now();lastError=null}catch(e){lastError=e?.message||String(e)}return emit()}
 const timer=setInterval(sync,refreshMs),ticker=setInterval(emit,1000);sync();
 return {snapshot,sync,subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn)},close(){closed=true;clearInterval(timer);clearInterval(ticker);listeners.clear()}};
}
export function alignedStartMinute(realMinute,simSeconds=0){if(!Number.isFinite(realMinute)||!Number.isFinite(simSeconds)||simSeconds<0)throw Error('Hora España o tiempo SIM inválidos');return Math.round(((realMinute-simSeconds/60)%1440+1440)%1440)%1440}
