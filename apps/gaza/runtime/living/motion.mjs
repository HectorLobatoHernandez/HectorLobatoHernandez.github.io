import {walkingCycle,routePose,operationActivity} from './motion-model.mjs';
/** Paths are short illustrated patrols in existing aisles, not measured staff tracking. */
export function createActivityMotion({kind,world,uniforms}){
 const homes=new Map(uniforms.map(u=>[u.old.uuid,u.old.position.clone()])),lastPoses=new Map();
 function capture(u){return {position:u.old.position.clone(),rotation:u.old.rotation.clone(),arms:u.arms.map(j=>[j.upper.rotation.x,j.lower.rotation.x]),legs:(u.legs||[]).map(j=>[j.thigh.rotation.x,j.shin.rotation.x])}}
 function restore(u,p){u.old.position.copy(p.position);u.old.rotation.copy(p.rotation);u.arms.forEach((j,i)=>{j.upper.rotation.x=p.arms[i][0];j.lower.rotation.x=p.arms[i][1]});(u.legs||[]).forEach((j,i)=>{j.thigh.rotation.x=p.legs[i][0];j.shin.rotation.x=p.legs[i][1]})}
 const cars=kind==='site'?world.actors.children.filter(o=>/^SIM-STAFF-CAR-\d+$/.test(o.name)):[];
 const road=[[-97,-175],[-97,175],[-94,178],[-91,175],[-91,-175],[-94,-178],[-97,-175]];
 let snapshot={kind,people:[],traffic:[],source:'READ_ONLY_SIM_CLOCK',routeProvenance:'PROPOSED_NOT_SURVEYED'};
 function update(s){const t=s?.clock?.seconds||0,people=[],traffic=[];
  for(const [i,u]of uniforms.entries()){
   const lab=kind==='labs'?Number(u.old.name.match(/(\d)$/)?.[1]):null,a=operationActivity(s,u.role,lab),home=homes.get(u.old.uuid),blocked=a.status==='HELD',task=a.tasks.find(t=>t.status==='RUNNING'),yard=/SIM-YARD-STAFF/.test(u.old.name),plant=/SIM-PLANT-STAFF/.test(u.old.name);
   const routine=!!s&&a.onDuty&&!a.tasks.length,range=yard?6:plant?2:kind==='labs'?.9:1.2;
   // Farm machinery actors already own their routes. Only station personnel move here.
   const canWalk=!!s&&!blocked&&(routine||!!task)&&!u.role.includes('DRIVER');
   const clock=task?task.progress*12:t,walk=walkingCycle(clock,{length:range,speed:yard?1.1:.65,wait:2,phase:i*1.17});
   if(yard){const index=Number(u.old.name.split('-').at(-1));u.old.position.set(-42,0,-43+index*17+(canWalk?walk.distance:0));u.old.rotation.y=walk.direction>0?0:Math.PI;}
   else if(plant){u.old.position.copy(home);u.old.position.z+=canWalk?walk.distance-range/2:0;u.old.rotation.y=walk.direction>0?0:Math.PI;}
   else if(kind==='labs'){u.old.position.copy(home);u.old.position.x+=canWalk?walk.distance-range/2:0;u.old.rotation.y=canWalk&&walk.moving?(walk.direction>0?Math.PI/2:-Math.PI/2):(lab<4?Math.PI:0);}
   const walking=canWalk&&walk.moving&&(yard||plant||kind==='labs');
   for(const j of u.legs||[]){const phase=clock*4+i+j.sign*Math.PI/2;j.thigh.rotation.x=walking?Math.sin(phase)*.32:0;j.shin.rotation.x=walking?Math.max(0,-Math.sin(phase))*.35:0;}
   for(const j of u.arms){j.upper.rotation.x=walking?-Math.sin(clock*4+i+j.sign*Math.PI/2)*.25:task?-.5+Math.sin(clock*2+j.sign)*.14:blocked?-.4:0;j.lower.rotation.x=walking?-.12:task?-.6:blocked?-.58:0;}
   // Holds retain the last actual pose, rather than teleporting staff to a home position.
   if(blocked){const retained=lastPoses.get(u.old.uuid);if(retained)restore(u,retained)}else lastPoses.set(u.old.uuid,capture(u));
   u.hidden.forEach(o=>o.visible=false);u.g.visible=!s||a.onDuty||a.tasks.length>0;
   people.push({id:u.old.name,role:u.role,status:a.status,action:walking?(task?'Desplazamiento de tarea SIM':'Ronda de puesto SIM'):task?'Trabajo de puesto':blocked?'Retenido':a.onDuty?'Disponible':'Fuera de turno',position:u.old.position.toArray(),walk:walking});
  }
  for(const [i,c]of cars.entries()){if(!s)continue;const p=routePose(road,t,4.8,i*115);c.position.set(p.x,0,p.z);c.rotation.y=p.yaw;c.userData.motionKind='TRAFFIC_SCENARIO_NO_CARGO';traffic.push({id:c.name,position:c.position.toArray(),yaw:p.yaw,provenance:'SIMULATED_ROAD_TRAFFIC_NO_CARGO'});}
  snapshot={...snapshot,seconds:t,people,traffic};return snapshot;
 }
 return {update,snapshot:()=>snapshot};
}
