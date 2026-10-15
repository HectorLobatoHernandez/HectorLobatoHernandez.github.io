/** Deliberately slow visual choreography; it is neither behaviour telemetry nor a welfare model. */
export function animalRoutine(member,time,water){
 const yard=member.zone?.includes('yard'),seed=member.index??0,base=member.position;
 const idle={x:base[0],z:base[1],yaw:member.yaw,walk:0,headTilt:-.08,headTurn:0,tail:0,activity:'DESCANSO SIM'};
 if(!yard)return idle;
 const waterVisit=seed%11===0&&Array.isArray(water),grazing=(seed%4)!==0;
 const target=waterVisit?[water[0]+(seed%3-1)*2.5,water[1]+(seed%2?3:-3)]:[base[0]+Math.cos(member.yaw)*1.4,base[1]-Math.sin(member.yaw)*1.4];
 const dx=target[0]-base[0],dz=target[1]-base[1],distance=Math.hypot(dx,dz),travel=waterVisit?Math.max(12,distance/.35):14;
 const dwell=waterVisit?26:grazing?48:65,cycle=travel*2+dwell+44;
 const phase=((time+seed*19)%cycle+cycle)%cycle;
 let fraction=0,walking=false,activity='PASTO SIM';
 if(phase<travel){fraction=phase/travel;walking=true;activity=waterVisit?'HACIA AGUA SIM':'PASEO SIM'}
 else if(phase<travel+dwell){fraction=1;activity=waterVisit?'BEBIENDO SIM':'COMIENDO SIM'}
 else if(phase<travel*2+dwell){fraction=1-(phase-travel-dwell)/travel;walking=true;activity='REGRESO SIM'}
 const heading=Math.atan2(-dz,dx)+(phase>=travel+dwell&&walking?Math.PI:0);
 return {x:base[0]+dx*fraction,z:base[1]+dz*fraction,yaw:walking?heading:member.yaw,walk:walking?.24:0,
  headTilt:activity==='BEBIENDO SIM'?-.47:activity==='COMIENDO SIM'?-.36:-.06,
  headTurn:Math.sin(time*.08+seed)*.035,tail:Math.sin(time*.24+seed)*.07,activity};
}
