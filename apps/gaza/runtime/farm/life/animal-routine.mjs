/** Deliberately slow visual choreography; it is neither behaviour telemetry nor a welfare model. */
export function animalRoutine(member,time,water){
 const yard=member.zone?.includes('yard'),seed=member.index??0,base=member.position;
 const idle={x:base[0],z:base[1],yaw:member.yaw,walk:0,headTilt:-.08,headTurn:0,tail:0,activity:'DESCANSO SIM'};
 if(!yard)return idle;
 const waterVisit=seed%7===0&&Array.isArray(water),grazing=(seed%4)!==0;
 const target=waterVisit?[water[0]+(seed%3-1)*2.5,water[1]+(seed%2?3:-3)]:[base[0]+Math.cos(member.yaw)*1.4,base[1]-Math.sin(member.yaw)*1.4];
 const dx=target[0]-base[0],dz=target[1]-base[1],distance=Math.hypot(dx,dz),travel=waterVisit?Math.max(12,distance/.27):Math.max(14,distance/.27);
 const dwell=waterVisit?26:grazing?48:65,cycle=travel*2+dwell+44;
 const phase=((time+seed*19)%cycle+cycle)%cycle;
 let fraction=0,walking=false,activity='PASTO SIM';
 if(phase<travel){fraction=phase/travel;walking=true;activity=waterVisit?'HACIA AGUA SIM':'PASEO SIM'}
 else if(phase<travel+dwell){fraction=1;activity=waterVisit?'BEBIENDO SIM':'COMIENDO SIM'}
 else if(phase<travel*2+dwell){fraction=1-(phase-travel-dwell)/travel;walking=true;activity='REGRESO SIM'}
 const heading=Math.atan2(-dz,dx),returnHeading=heading+Math.PI;
 const smooth=t=>{const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u)};
 const turn=(from,to,t)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*smooth(t);
 let yaw=heading;
 if(phase<5)yaw=turn(member.yaw,heading,phase/5);
 else if(phase<travel+dwell-5)yaw=heading;
 else if(phase<travel+dwell)yaw=turn(heading,returnHeading,(phase-(travel+dwell-5))/5);
 else if(phase<travel*2+dwell+5)yaw=returnHeading;
 else yaw=turn(returnHeading,member.yaw,(phase-(travel*2+dwell+5))/5);
 const eased=fraction*fraction*(3-2*fraction);
 return {x:base[0]+dx*eased,z:base[1]+dz*eased,yaw,walk:walking?.16:0,
  headTilt:activity==='BEBIENDO SIM'?-.47:activity==='COMIENDO SIM'?-.36:-.06,
  headTurn:Math.sin(time*.08+seed)*.035,tail:Math.sin(time*.24+seed)*.07,activity};
}
