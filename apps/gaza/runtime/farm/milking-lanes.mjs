import {pointOnRoute} from './site.mjs';

// Two independent, straight access lanes inside the illustrative milking room.
// Coordinates are in the proposed building frame; these are not surveyed doors.
export function milkingLanes(frame){
 const at=(x,z)=>[frame.x+Math.cos(frame.yaw)*x+Math.sin(frame.yaw)*z,frame.z-Math.sin(frame.yaw)*x+Math.cos(frame.yaw)*z];
 return {
  BOVINE:{localX:3.2,route:[at(3.2,-frame.d/2-1),at(3.2,-frame.d/2+.8),at(3.2,-5.5),at(3.2,-2.1)]},
  OVINE:{localX:-3.2,route:[at(-3.2,frame.d/2+1),at(-3.2,frame.d/2-.8),at(-3.2,5.5),at(-3.2,2.1)]}
 };
}

export function milkingLanePose(lane,progress){
 const p=Math.max(0,Math.min(1,progress));
 const easing=t=>t*t*(3-2*t);
 const entering=p<.15,leaving=p>.78;
 const t=entering?easing(p/.15):leaving?easing(1-(p-.78)/.22):1;
 const pose=pointOnRoute(lane.route,t);
 // The parked animal faces along its own lane. On exit, reverse its direction.
 const end=pointOnRoute(lane.route,.999);
 return {position:pose.position,yaw:leaving?pose.yaw+Math.PI:entering?pose.yaw:end.yaw,walking:entering||leaving};
}
