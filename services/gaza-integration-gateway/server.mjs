import http from 'node:http';
import { randomUUID } from 'node:crypto';

const HOST=process.env.GAZA_GATEWAY_HOST||'127.0.0.1';
const PORT=Number(process.env.GAZA_GATEWAY_PORT||20840);
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
 ['farm-delpro-reference','DelPro farm reference','FARM_DISCOVERY_REQUIRED']
].map(([id,authority,status])=>({id,authority,status,connected:false,writes:'DISABLED'}));
const events=[];
const snapshot={schemaVersion:1,generated_at:null,source_class:null,entities:{},note:'No authorised source adapters connected.'};

function json(res,status,data){const body=JSON.stringify(data,null,2);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'http://127.0.0.1:4173','x-content-type-options':'nosniff'});res.end(body)}
function route(req,res){
 const u=new URL(req.url,'http://'+(req.headers.host||HOST));
 if(req.method!=='GET')return json(res,405,{error:'READ_ONLY_GATEWAY',message:'Writes are disabled.',request_id:randomUUID()});
 if(u.pathname==='/health')return json(res,200,{status:'ok',mode:'READ_ONLY_DISCOVERY',startedAt,now:new Date().toISOString(),connectedAdapters:adapters.filter(x=>x.connected).length});
 if(u.pathname==='/v1/adapters')return json(res,200,{schemaVersion:1,adapters});
 if(u.pathname==='/v1/schema')return json(res,200,schema);
 if(u.pathname==='/v1/snapshot')return json(res,200,{...snapshot,generated_at:new Date().toISOString()});
 if(u.pathname==='/v1/events'){const limit=Math.max(1,Math.min(1000,Number(u.searchParams.get('limit')||100)));return json(res,200,{schemaVersion:1,count:Math.min(limit,events.length),events:events.slice(-limit)})}
 if(u.pathname==='/v1/stream'){
   res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','connection':'keep-alive','access-control-allow-origin':'http://127.0.0.1:4173'});
   const send=()=>res.write('event: heartbeat\ndata: '+JSON.stringify({at:new Date().toISOString(),mode:'READ_ONLY_DISCOVERY',connectedAdapters:adapters.filter(x=>x.connected).length})+'\n\n');
   send();const timer=setInterval(send,15000);req.on('close',()=>clearInterval(timer));return;
 }
 return json(res,404,{error:'NOT_FOUND'});
}
const server=http.createServer(route);
server.listen(PORT,HOST,()=>console.log('[GAZA Integration Gateway] http://'+HOST+':'+PORT+' · READ_ONLY_DISCOVERY'));
