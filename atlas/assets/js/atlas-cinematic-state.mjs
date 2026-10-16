import {clamp,smooth} from './atlas-city-state.mjs';
export const duskDuration=6500;
export function lightingSequence(progress,completedMs=0){
 const q=progress<.999?0:clamp(completedMs/duskDuration),night=smooth(clamp((q-.1)/.85));
 return {night,stage:q<.05?'Construcción al sol':q<.96?'Atardecer · encendiendo la ciudad':'Noche · ciudad habitada',sunElevation:progress<.999?.65-progress*.12:.53-q*.72,complete:q>=1};
}
// Slow, staggered outages: saturated tube cores remain separate from their broad halo.
export function neonPulse(seconds,index=0,reduced=false){if(reduced)return 1;const t=((seconds+index*.73)%6.4+6.4)%6.4;if(t<.16)return .06;if(t<.42)return 1.2;if(t<.61)return .22;return .94+.12*Math.sin(seconds*1.8+index)}
export function residentPose(seconds,index=0,club=false){
 const t=((seconds+index*3.1)%38+38)%38,walking=t<12||t>=26,blend=t<12?smooth(t/12):t<26?1:1-smooth((t-26)/12);
 return {blend,walking,activity:walking?'Pasear':club?'Escuchar / bailar':'Descansar / escuchar',swing:walking?Math.sin(seconds*4.5+index)*.33:club?Math.sin(seconds*2.1+index)*.13:0};
}
