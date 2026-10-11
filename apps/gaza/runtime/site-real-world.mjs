import {buildExterior as buildGeometry} from './site-real-world-geometry-v2.mjs';
import {samplePath} from './site-real-core.mjs';
import {getProcess} from './dairy-process-store.mjs';
import {sceneStatus} from './dairy-process-core.mjs';
import {bindProcessWorld} from './dairy-process-scene.mjs';
/** Original geometry retained verbatim. Only the movement adapter and process overlay are new. */
export function buildExterior(THREE,options={}){
 const world=buildGeometry(THREE,options),originalUpdate=world.update;
 bindProcessWorld(THREE,{scene:world.root,surface:'site',dock:true});
 world.update=(dt,env={})=>{
  const canonical=sceneStatus(getProcess(),'site');originalUpdate(canonical?0:dt,env);
  if(!canonical)return;
  for(const m of world.moving){
   const i=canonical.index,p=canonical.progress,tanker=m.id==='SIM-TANKER-1';
   const d=tanker?(i<4?0:i===4?391*p:i<=6?391:m.path.length):(i<12?0:i===12?m.path.length*p:m.path.length);
   const front=samplePath(m.path,d),rear=samplePath(m.path,Math.max(0,d-6.5));
   if(d<6.5){rear.x-=rear.tangent[0]*(6.5-d);rear.z-=rear.tangent[1]*(6.5-d)}
   m.tractor.position.set(front.x,.15,front.z);m.tractor.rotation.y=front.yaw;m.load.position.set(rear.x,.15,rear.z);m.load.rotation.y=rear.yaw;
   const travel=Math.max(0,d-(m.processDistance||0));m.processDistance=d;for(const w of m.wheels)w.rotation.z-=travel/.52;
   m.position=[front.x,front.z];m.heading=front.tangent;m.phase=(canonical.held?'RETENIDO · ':canonical.playing?'':'PAUSA · ')+canonical.name;
  }
 };
 return world;
}
