import http from 'node:http';
import { randomUUID } from 'node:crypto';

const HOST=process.env.GAZA_GATEWAY_HOST||'127.0.0.1';
const PORT=Number(process.env.GAZA_GATEWAY_PORT||20840);
const AEMET_API_KEY=process.env.AEMET_API_KEY||'';
const AEMET_MUNICIPALITY=process.env.AEMET_MUNICIPALITY||'49053'; // Coreses
const AEMET_STATION=process.env.AEMET_STATION||'2565'; // Coreses observation station
const AEMET_WARNING_AREA=process.env.AEMET_WARNING_AREA||'';
const startedAt=new Date().toISOString();
const schema={
 schemaVersion:1,
 required:['event_id','source','source_class','observed_at','entity_type','entity_id','event_type','quality','payload'],
 source_class:['REAL_AUTHORIZED','PUBLIC_REFERENCE','SIMULATED'],
 quality:['GOOD','STALE','UNCERTAIN','BAD']
};
const adapters=[
 ['erp','Solmicro ERP','DISCOVERY_REQUIRED'],
 ['gazacontrol','GAZACONTROL','DISCOVERY_REQUIRED'],
 ['intergaza','INTERGAZA','DISCOVERY_REQUIRED'],
 ['tetrapak','Tetra Pak','DISCOVERY_REQUIRED'],
 ['asrs','Esnova / Signode StorFast','DISCOVERY_REQUIRED'],
 ['utilities','Veolia','DISCOVERY_REQUIRED'],
 ['fleet','TMS / GPS','NOT_PUBLIC'],
 ['farm-delpro-reference','DelPro farm reference','FARM_DISCOVERY_REQUIRED'],
 ['aemet-official','AEMET OpenData',AEMET_API_KEY?'CONFIGURED_UNVERIFIED':'API_KEY_REQUIRED']
].map(([id,authority,status])=>({id,authority,status,connected:false,writes:'DISABLED'}));
const events=[];
const snapshot={schemaVersion:1,generated_at:null,source_class:null,entities:{},note:'No authorised private source adapters connected.'};
const cache=new Map();

function json(res,status,data){const body=JSON.stringify(data,null,2);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'http://127.0.0.1:4173','x-content-type-options':'nosniff'});res.end(body)}
function aemetStatus(){
 return {
   provider:'AEMET OpenData',
   configured:Boolean(AEMET_API_KEY),
   keyExposed:false,
   municipality:{id:AEMET_MUNICIPALITY,name:'Coreses'},
   observationStation:{idema:AEMET_STATION,name:'Coreses'},
   warningArea:AEMET_WARNING_AREA||null,
   mode:'READ_ONLY_PUBLIC_AUTHORITY',
   note:AEMET_API_KEY?'API key configured server-side; upstream not assumed healthy until a successful request.':'Set AEMET_API_KEY in the gateway process environment. Never expose it in GitHub Pages.'
 };
}
async function fetchJson(url,headers={}){
 const response=await fetch(url,{headers,signal:AbortSignal.timeout(10000),cache:'no-store'});
 if(!response.ok)throw new Error('HTTP '+response.status+' '+response.statusText);
 const text=await response.text();
 try{return JSON.parse(text)}catch{return {raw:text,contentType:response.headers.get('content-type')||null}}
}
async function aemetResource(pathname,ttlMs=300000){
 if(!AEMET_API_KEY){const e=new Error('AEMET_API_KEY_NOT_CONFIGURED');e.code='AEMET_API_KEY_NOT_CONFIGURED';throw e}
 const cacheKey=pathname,now=Date.now(),hit=cache.get(cacheKey);
 if(hit&&now-hit.at<ttlMs)return {...hit.value,cache:'HIT'};
 const meta=await fetchJson('https://opendata.aemet.es/opendata'+pathname,{'api_key':AEMET_API_KEY,'accept':'application/json'});
 if(!meta||typeof meta!=='object'||!meta.datos)throw new Error('AEMET_METADATA_WITHOUT_DATOS');
 const data=await fetchJson(meta.datos,{'accept':'application/json, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5'});
 const value={provider:'AEMET OpenData',fetchedAt:new Date().toISOString(),cache:'MISS',metadata:{descripcion:meta.descripcion??null,estado:meta.estado??null,metadatos:meta.metadatos??null},data};
 cache.set(cacheKey,{at:now,value});
 const aemet=adapters.find(x=>x.id==='aemet-official');if(aemet){aemet.connected=true;aemet.status='LIVE_READ_ONLY'}
 return value;
}
async function route(req,res){
 const u=new URL(req.url,'http://'+(req.headers.host||HOST));
 if(req.method!=='GET')return json(res,405,{error:'READ_ONLY_GATEWAY',message:'Writes are disabled.',request_id:randomUUID()});
 if(u.pathname==='/health')return json(res,200,{status:'ok',mode:'READ_ONLY_DISCOVERY',startedAt,now:new Date().toISOString(),connectedAdapters:adapters.filter(x=>x.connected).length,aemet:aemetStatus()});
 if(u.pathname==='/v1/adapters')return json(res,200,{schemaVersion:1,adapters});
 if(u.pathname==='/v1/schema')return json(res,200,schema);
 if(u.pathname==='/v1/snapshot')return json(res,200,{...snapshot,generated_at:new Date().toISOString()});
 if(u.pathname==='/v1/weather/aemet/status')return json(res,200,{schemaVersion:1,...aemetStatus()});
 try{
   if(u.pathname==='/v1/weather/aemet/forecast')return json(res,200,{schemaVersion:1,classification:'OFFICIAL_PUBLIC_REFERENCE',scope:'Coreses municipality',...(await aemetResource('/api/prediccion/especifica/municipio/horaria/'+encodeURIComponent(AEMET_MUNICIPALITY)))});
   if(u.pathname==='/v1/weather/aemet/observation')return json(res,200,{schemaVersion:1,classification:'OFFICIAL_PUBLIC_OBSERVATION',scope:'Coreses station',...(await aemetResource('/api/observacion/convencional/datos/estacion/'+encodeURIComponent(AEMET_STATION),180000))});
   if(u.pathname==='/v1/weather/aemet/warnings'){
     if(!AEMET_WARNING_AREA)return json(res,503,{schemaVersion:1,error:'AEMET_WARNING_AREA_NOT_CONFIGURED',message:'Set AEMET_WARNING_AREA after confirming the official CAP area code for the plant warning zone.'});
     return json(res,200,{schemaVersion:1,classification:'OFFICIAL_PUBLIC_WARNING',scope:'AEMET CAP area',...(await aemetResource('/api/avisos_cap/ultimoelaborado/area/'+encodeURIComponent(AEMET_WARNING_AREA),120000))});
   }
 }catch(e){
   const status=e?.code==='AEMET_API_KEY_NOT_CONFIGURED'?503:502;
   return json(res,status,{schemaVersion:1,error:e?.code||'AEMET_UPSTREAM_ERROR',message:String(e?.message||e),provider:'AEMET OpenData',configured:Boolean(AEMET_API_KEY),keyExposed:false});
 }
 if(u.pathname==='/v1/events'){const limit=Math.max(1,Math.min(1000,Number(u.searchParams.get('limit')||100)));return json(res,200,{schemaVersion:1,count:Math.min(limit,events.length),events:events.slice(-limit)})}
 if(u.pathname==='/v1/stream'){
   res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','connection':'keep-alive','access-control-allow-origin':'http://127.0.0.1:4173'});
   const send=()=>res.write('event: heartbeat\ndata: '+JSON.stringify({at:new Date().toISOString(),mode:'READ_ONLY_DISCOVERY',connectedAdapters:adapters.filter(x=>x.connected).length,aemetConfigured:Boolean(AEMET_API_KEY)})+'\n\n');
   send();const timer=setInterval(send,15000);req.on('close',()=>clearInterval(timer));return;
 }
 return json(res,404,{error:'NOT_FOUND'});
}
const server=http.createServer((req,res)=>{route(req,res).catch(e=>json(res,500,{error:'GATEWAY_INTERNAL_ERROR',message:String(e?.message||e),request_id:randomUUID()}))});
server.listen(PORT,HOST,()=>console.log('[GAZA Integration Gateway] http://'+HOST+':'+PORT+' · READ_ONLY_DISCOVERY · AEMET '+(AEMET_API_KEY?'configured':'not configured')));
