import * as THREE from 'three';
import {symbolPaths} from './atlas-business-state.mjs';
// Hand-drawn tube layouts, with no generated raster assets or opaque advertising boards.
export function vintageNeonTexture(b,index){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=640;const c=canvas.getContext('2d');c.scale(2,2);c.lineCap='round';c.lineJoin='round';
 function tube(draw,color=b.color,w=4){c.strokeStyle=color;c.lineWidth=w+10;c.shadowColor=color;c.shadowBlur=36;c.globalAlpha=.22;draw();c.globalAlpha=.8;c.lineWidth=w+3;c.shadowBlur=17;draw();c.globalAlpha=1;c.lineWidth=w;c.shadowBlur=8;draw();c.shadowBlur=0;c.strokeStyle='#fff4e8';c.lineWidth=.9;draw()}
 const path=points=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.stroke()};
 const style=b.signStyle;
 tube(()=>{if(style==='oval'){c.beginPath();c.ellipse(512,158,480,135,0,0,Math.PI*2);c.stroke()}else if(style==='diamond')path([[26,160],[150,34],[855,34],[998,160],[855,286],[150,286]]);else if(style==='arrow')path([[28,40],[805,40],[994,160],[805,280],[28,280]]);else if(style==='ticket'){c.beginPath();c.moveTo(75,30);c.lineTo(948,30);c.lineTo(948,95);c.bezierCurveTo(880,95,880,225,948,225);c.lineTo(948,290);c.lineTo(75,290);c.lineTo(75,225);c.bezierCurveTo(143,225,143,95,75,95);c.closePath();c.stroke()}else if(style==='wing'){c.beginPath();c.roundRect(180,44,665,230,90);c.stroke();for(const side of [-1,1])for(let k=0;k<3;k++){c.beginPath();c.moveTo(512+side*340,90+k*58);c.lineTo(512+side*(475-k*18),70+k*78);c.stroke()}}else{c.beginPath();c.roundRect(30,32,964,256,25);c.stroke()}},b.color,5);
 if(style==='marquee')for(let j=0;j<30;j++){const x=50+j*31;for(const y of [45,275])tube(()=>{c.beginPath();c.arc(x,y,2.4,0,Math.PI*2);c.stroke()},'#ffc96d',1.5)}
 const ix=style==='wing'?240:155,iy=83,sz=115;
 tube(()=>{for(const points of symbolPaths(b.symbol)){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(ix+x*sz,iy+y*sz):c.moveTo(ix+x*sz,iy+y*sz));c.stroke()}},index%2?'#7dfff0':'#ffd272',4);
 c.textAlign='center';const textX=style==='arrow'?560:style==='wing'?585:590,max=style==='wing'?445:650;c.font=(index%3===1?'bold 77px Georgia':'italic bold 85px Georgia');
 tube(()=>c.strokeText(b.name,textX,163,max),b.color,3);c.font='25px Courier New';tube(()=>c.strokeText(b.subtitle,textX,211,max*.94),'#ffe2a3',1.7);
 // Small asymmetrical spark and a direction arrow recall bent glass rather than a screen.
 tube(()=>{c.beginPath();c.moveTo(880,96);c.lineTo(880,125);c.moveTo(865,110);c.lineTo(895,110);c.moveTo(912,229);c.lineTo(950,229);c.lineTo(937,217);c.moveTo(950,229);c.lineTo(937,241);c.stroke()},'#ff6fb7',2.6);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
