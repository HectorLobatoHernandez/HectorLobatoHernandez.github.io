
(()=>{
const $=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), ramp=(p,a,b)=>clamp((p-a)/(b-a)), ease=t=>1-Math.pow(1-t,3), lerp=(a,b,t)=>a+(b-a)*t;
const prog=$('#cqProgress'), city=$('#cqCity'), plan=$('#cqPlan'), focus=$('#cqFocus'), focusLabel=$('#cqFocusLabel'), wire=$('#cqWire'), walls=all('#cqWire i'), media=$('#cqMedia'), video=$('#cqVideo'), still=$('#cqStill'), stillImg=$('#cqStill img'), chapter=$('#cqChapter'), planThumb=$('#cqPlanThumb'), system=$('#cqSystem'), archive=$('#cqArchive');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const MONTAGE='https://d2ol7oe51mr4n9.cloudfront.net/user_3I3SzGDcpPFtcj4NduumHmHAuKs/3ae0229c-71c2-4359-a777-095b30f70f9d.jpg';
const ACOUSTIC='https://d2ol7oe51mr4n9.cloudfront.net/user_3I3SzGDcpPFtcj4NduumHmHAuKs/5d2cdf5c-42f4-4ad4-9707-cf87b1c849db.jpg';
const HERO='../assets/projects/casa-alain/hero.webp';
const chapters=[
 {a:.43,b:.53,k:'04 / ARCHITECTURE',t:'Room organization.',p:'The real house plan remains the reference while the design sequence moves through access, DJ position, cinema wall and the listening zone.',img:MONTAGE,label:'FULL SOURCE RENDER CONTACT SHEET · NO CROPPED UPSCALING'},
 {a:.53,b:.63,k:'05 / ACOUSTICS',t:'Treatment by function.',p:'Low-frequency control, rear diffusion/absorption, side reflections, ceiling treatment and variable curtains are presented as one acoustic system.',img:ACOUSTIC,label:'ACOUSTIC / PLAN SOURCE BOARD · NO CROPPED UPSCALING'},
 {a:.63,b:.72,k:'06 / CINEMA / AV',t:'KEF architectural cinema.',p:'The documented cinema system uses a Ci4100QL-THX LCR front stage, architectural surrounds and heights, Kube 12 MIE and Denon AVR-X2800H.',img:HERO,label:'USER-SUPPLIED PROJECT RENDER'},
 {a:.72,b:.81,k:'07 / DJ LISTENING',t:'A second listening condition.',p:'The DJ position is treated as a distinct listening position with local reflection control rather than as a decorative object.',img:MONTAGE,label:'FULL SOURCE RENDER BOARD · NO CROP'},
 {a:.81,b:.88,k:'08 / CEILING + VARIABLE ACOUSTICS',t:'Control without over-damping.',p:'Ceiling diffusers, broadband clouds and heavy curtains provide reflection control and adaptable absorption between cinema and music use.',img:ACOUSTIC,label:'SOURCE ACOUSTIC BOARD · NO CROP'}
];
let target=0,shown=0,last=performance.now(),seekPending=false;
function op(el,v){if(el)el.style.opacity=String(clamp(v))}
function paint(p){
 prog.style.width=(p*100).toFixed(2)+'%';
 // city
 const cOut=ease(ramp(p,.055,.12));op(city,1-cOut);city.style.transform='scale('+lerp(1,1.16,cOut)+') translate('+lerp(0,-3,cOut)+'%,'+lerp(0,-2,cOut)+'%)';
 // plan board
 const pin=ramp(p,.075,.13),pout=1-ramp(p,.34,.39);op(plan,pin*pout);
 const z=ease(ramp(p,.12,.26));plan.style.transform='translate(-50%,-50%) scale('+lerp(.88,1.05,z)+')';
 op(focus,ramp(p,.14,.20)*(1-ramp(p,.34,.39)));op(focusLabel,ramp(p,.16,.21)*(1-ramp(p,.33,.38)));
 // wire walls
 const wb=ramp(p,.22,.32)*(1-ramp(p,.37,.42));op(wire,wb);const rise=ease(ramp(p,.235,.315));
 walls.forEach(w=>{if(w.classList.contains('n'))w.style.transform='rotateX(-90deg) scaleY('+rise+')';if(w.classList.contains('s'))w.style.transform='rotateX(90deg) scaleY('+rise+')';if(w.classList.contains('e'))w.style.transform='rotateY(-90deg) scaleX('+rise+')';if(w.classList.contains('w'))w.style.transform='rotateY(90deg) scaleX('+rise+')'});
 // media film transition
 const min=ramp(p,.36,.42)*(1-ramp(p,.91,.94));op(media,min);
 op(video,ramp(p,.38,.44)*(1-ramp(p,.90,.93)));
 // seek derivative video with scroll; if decode fails, still board stays
 if(video?.duration && Number.isFinite(video.duration) && !video.seeking){
   const q=clamp((p-.38)/.50);const desired=q*Math.max(0,video.duration-.06);
   if(Math.abs(video.currentTime-desired)>.06){try{video.currentTime=desired}catch(e){}}
 }
 // category stills on top: whole boards only, never zoomed/cropped
 let active=null;for(const ch of chapters)if(p>=ch.a&&p<ch.b)active=ch;
 if(active){
   op(still,ramp(p,active.a,active.a+.025)*(1-ramp(p,active.b-.025,active.b)));
   if(stillImg.dataset.src!==active.img){stillImg.src=active.img;stillImg.dataset.src=active.img;still.querySelector('small').textContent=active.label}
   chapter.innerHTML='<small>'+active.k+'</small><h2>'+active.t+'</h2><p>'+active.p+'</p>';
   op(chapter,ramp(p,active.a,active.a+.035)*(1-ramp(p,active.b-.035,active.b)));
   chapter.style.transform='translateY('+(18*(1-ramp(p,active.a,active.a+.035)))+'px)';
 }else{op(still,0);op(chapter,0)}
 op(planThumb,ramp(p,.44,.49)*(1-ramp(p,.87,.90)));planThumb.style.transform='rotateX(58deg) rotateZ('+lerp(-8,6,ramp(p,.44,.88))+'deg)';
 op(system,ramp(p,.64,.675)*(1-ramp(p,.715,.74)));
 op(archive,ramp(p,.905,.94));
}
function loop(now){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);target=clamp(scrollY/max);
 if(reduced)shown=target; else {const dt=Math.min(64,now-last),s=1-Math.pow(1-.11,dt/16.667);shown+=(target-shown)*s}
 last=now;paint(shown);requestAnimationFrame(loop)
}
video?.addEventListener('loadedmetadata',()=>paint(shown));
requestAnimationFrame(loop);
window.__CASA_ALAIN_QUALITY__={schemaVersion:4,sourceBacked:true,noCroppedUpscaling:true,scrollVideoSeek:true,planBuild:'WIREFRAME_PERIMETER_ONLY',syntheticProjectImagery:false,mounted:true};
})();
