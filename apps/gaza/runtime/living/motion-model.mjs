import {TASKS,TESTS} from '../processes/catalog.mjs';
import {taskState,roleActivity} from './model.mjs';
/** Pure visual calculations: no dispatch, fabricated quantities or completion of tasks. */
export function walkingCycle(seconds,{length=3,speed=1,wait=1.5,phase=0}={}){
 if(!Number.isFinite(seconds)||!Number.isFinite(length)||length<=0||!Number.isFinite(speed)||speed<=0||!Number.isFinite(wait)||wait<0)throw Error('Invalid pedestrian timing');
 const travel=length/speed,period=2*(travel+wait),t=((seconds+phase)%period+period)%period;
 if(t<travel)return {distance:t*speed,direction:1,moving:true};
 if(t<travel+wait)return {distance:length,direction:1,moving:false};
 if(t<2*travel+wait)return {distance:length-(t-travel-wait)*speed,direction:-1,moving:true};
 return {distance:0,direction:-1,moving:false};
}
export function routePose(points,seconds,speed=6,phase=0){
 if(points.length<2||!points.every(p=>p.length===2&&p.every(Number.isFinite))||!Number.isFinite(seconds)||!Number.isFinite(speed)||speed<=0)throw Error('Invalid visual traffic route');
 const lens=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=lens.reduce((a,b)=>a+b,0);if(!total)throw Error('Empty route');
 let d=((seconds*speed+phase)%total+total)%total;for(let i=0;i<lens.length;i++){if(d<=lens[i]||i===lens.length-1){const a=points[i],b=points[i+1],t=lens[i]?d/lens[i]:0;return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,yaw:-Math.atan2(b[1]-a[1],b[0]-a[0]),distance:d}}d-=lens[i]}
}
export function operationActivity(s,role,station=null){
 const a=roleActivity(s,role);const tasks=a.tasks.filter(t=>{if(station===null||role!=='SIM-LAB-01')return true;return TESTS.find(d=>d.id===t.id)?.station===station});
 for(const t of tasks){const l=s?.lots?.[t.lotId],test=TESTS.find(x=>x.id===t.id);if(test&&(l?.holds||!s?.equipment?.[test.resource]?.valid))t.status='HELD';}
 return {...a,tasks,status:tasks.some(t=>t.status==='RUNNING')?(a.onDuty?'WORKING':'HANDOVER'):tasks.length?'HELD':a.onDuty?'AVAILABLE':'OFF_SHIFT'};
}
/** Interpolate only poses up to the next expected tick. Immutable and never saved. */
export function interpolateForDisplay(s,delta=0){
 if(!s||!s.clock.running||delta<=0)return s;
 const dt=Math.min(.3,Math.max(0,delta))*s.clock.rate;
 return {...s,clock:{...s.clock,seconds:s.clock.seconds+dt},lots:Object.fromEntries(Object.entries(s.lots).map(([id,l])=>[id,{...l,tasks:Object.fromEntries(Object.entries(l.tasks).map(([key,t])=>{const d=TASKS.find(x=>x.id===key);return [key,d&&taskState(s,l,d)==='RUNNING'?{...t,elapsed:Math.min(d.durationSimSeconds-1e-7,t.elapsed+dt)}:t]}))}]))};
}
export function activeOperations(s){
 return Object.values(s?.lots||{}).flatMap(l=>[
  ...TASKS.filter(d=>l.tasks[d.id].status==='RUNNING').map(d=>({id:d.id,title:d.title,module:d.module,station:d.station,lotId:l.id,role:d.role,status:taskState(s,l,d)})),
  ...l.tests.filter(t=>t.status==='RUNNING').map(t=>{const d=TESTS.find(x=>x.id===t.testId);return {id:d.id,title:d.title,module:'labs',station:d.station,lotId:l.id,role:'SIM-LAB-01',status:l.holds||!s.equipment[d.resource].valid?'HELD':'RUNNING'}})
 ]);
}
