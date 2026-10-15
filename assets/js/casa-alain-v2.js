
(()=>{
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ramp=(p,a,b)=>clamp((p-a)/(b-a));
const ease=t=>1-Math.pow(1-t,3);
const lerp=(a,b,t)=>a+(b-a)*t;
const el=s=>document.querySelector(s);
const els=s=>[...document.querySelectorAll(s)];
const progress=el('#caProgress');
const city=el('#caCity');
const plan=el('#caPlan');
const grid=el('#caPlanGrid');
const mask=el('#caPlanMask');
const fp=el('#caFootprint');
const fpLabel=el('#caFootprintLabel');
const room=el('#caRoomBuild');
const walls=els('.ca-wall');
const roomLabel=el('#caRoomLabel');
const render=el('#caRender');
const acoustic=el('#caAcoustic');
const orbit=el('#caPlanOrbit');
const gallery=el('#caGallery');
const galleryFrames=els('.ca-gallery-frame');
const galleryLabel=el('#caGalleryLabel');
const galleryIndex=el('#caGalleryIndex');
const systemBand=el('#caSystemBand');
const film=el('#caFilm');
const filmTitle=el('#caFilmTitle');
const end=el('#caEnd');
const copies=els('.ca-stage-copy[data-scene]');
const video=film?.querySelector('video');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let target=0,shown=0,last=performance.now(),raf=0;

const scenes=[
  {a:.00,b:.105,id:'hero'},
  {a:.105,b:.215,id:'locate'},
  {a:.215,b:.315,id:'build'},
  {a:.315,b:.405,id:'enter'},
  {a:.405,b:.505,id:'architecture'},
  {a:.505,b:.605,id:'acoustics'},
  {a:.605,b:.695,id:'cinema'},
  {a:.695,b:.775,id:'dj'},
  {a:.775,b:.845,id:'ceiling'},
  {a:.845,b:.915,id:'film'},
  {a:.915,b:1.001,id:'end'}
];
const galleryData=[
  {id:'architecture',frame:0,title:'Architecture / room organization',copy:'The private cinema is developed from the actual house plan and supplied SketchUp / render archive, preserving the relationship between access, DJ booth, screen wall and listening zone.',index:'01 / 05'},
  {id:'acoustics',frame:4,title:'Acoustic strategy',copy:'Low-frequency control, rear-wall diffusion/absorption, side reflection treatment and variable curtains are coordinated around cinema and music use.',index:'02 / 05'},
  {id:'cinema',frame:1,title:'Cinema / AV system',copy:'KEF architectural cinema with a Ci4100QL-THX front stage, surrounds, overhead channels, subwoofer integration and Denon AVR processing.',index:'03 / 05'},
  {id:'dj',frame:3,title:'DJ / secondary listening position',copy:'The DJ position is treated as a second listening condition with local absorption and reflection control rather than a decorative booth.',index:'04 / 05'},
  {id:'ceiling',frame:5,title:'Ceiling / variable acoustics',copy:'Ceiling diffusers and broadband clouds control vertical reflections; high-density curtains provide variable absorption over the room openings.',index:'05 / 05'}
];

function setOpacity(node,v){if(node)node.style.opacity=String(clamp(v))}
function showCopy(id,o,y=0){
 const node=copies.find(x=>x.dataset.scene===id); if(!node)return;
 node.style.opacity=String(clamp(o));node.style.transform='translateY('+y+'px)';
}
function galleryFrame(i,o,scale=1){
 galleryFrames.forEach((f,j)=>{f.style.opacity=j===i?String(clamp(o)):'0';if(j===i)f.style.transform='scale('+scale+')'});
}
function paint(p){
 progress.style.width=(p*100).toFixed(3)+'%';
 copies.forEach(n=>{n.style.opacity='0';n.style.transform='translateY(20px)'});

 // 00 abstract Project Atlas city -> real plan. The city is interface, not geography.
 const cityOut=ease(ramp(p,.045,.105));setOpacity(city,1-cityOut);
 if(city)city.style.transform='scale('+lerp(1,1.22,cityOut)+') translate('+lerp(0,-5,cityOut)+'%,'+lerp(0,-3,cityOut)+'%)';
 // hero / source plan
 const h=1-ramp(p,.06,.125);
 const heroLift=ease(ramp(p,.03,.12));
 showCopy('hero',h,-44*heroLift);
 const locate=ramp(p,.095,.16)*(1-ramp(p,.205,.235));
 showCopy('locate',locate,14*(1-locate));

 // real source plan crop and camera move
 let planOp=ramp(p,.055,.105)*(1-ramp(p,.31,.37)); setOpacity(plan,planOp);
 const zoom=ease(ramp(p,.08,.215));
 const sx=lerp(1,2.25,zoom);
 const tx=lerp(0,-7.2,zoom), ty=lerp(0,6.4,zoom);
 plan.style.transform='translate('+tx+'%,'+ty+'%) scale('+sx+')';
 plan.style.filter='saturate('+(0.78-zoom*.18)+') contrast(1.03) brightness('+(0.92-zoom*.17)+')';
 setOpacity(grid,ramp(p,.08,.16)*(1-ramp(p,.29,.34)));
 setOpacity(mask,ramp(p,.135,.205)*(1-ramp(p,.29,.34))*.42);

 // plan footprint and plan-derived walls
 const fpo=ramp(p,.12,.175)*(1-ramp(p,.305,.35));
 setOpacity(fp,fpo); setOpacity(fpLabel,fpo);
 const build=ramp(p,.205,.295)*(1-ramp(p,.33,.37));setOpacity(room,build);
 const rise=ease(ramp(p,.215,.285));
 walls.forEach(w=>{
   if(w.classList.contains('n'))w.style.transform='rotateX(-90deg) scaleY('+rise+')';
   if(w.classList.contains('s'))w.style.transform='rotateX(90deg) scaleY('+rise+')';
   if(w.classList.contains('e'))w.style.transform='rotateY(-90deg) scaleX('+rise+')';
   if(w.classList.contains('w'))w.style.transform='rotateY(90deg) scaleX('+rise+')';
 });
 setOpacity(roomLabel,ramp(p,.25,.285)*(1-ramp(p,.315,.34)));
 showCopy('build',ramp(p,.205,.255)*(1-ramp(p,.31,.35)),8*(1-ramp(p,.205,.255)));

 // enter real render
 const ro=ramp(p,.305,.37)*(1-ramp(p,.40,.43));setOpacity(render,ro);
 render.style.transform='scale('+lerp(1.09,1,ease(ramp(p,.305,.405)))+')';
 showCopy('enter',ramp(p,.325,.37)*(1-ramp(p,.395,.43)),10*(1-ramp(p,.325,.37)));

 // rotating source plan accompanies category story
 const story=ramp(p,.39,.43)*(1-ramp(p,.835,.875));setOpacity(orbit,story);
 orbit.style.transform='translateY(-50%) rotateY('+(lerp(-7,13,ramp(p,.405,.84))).toFixed(2)+'deg) rotateZ('+(lerp(-2,5,ramp(p,.405,.84))).toFixed(2)+'deg)';
 setOpacity(gallery,story);
 let active=-1, local=0;
 const spans=[[.405,.505],[.505,.605],[.605,.695],[.695,.775],[.775,.845]];
 spans.forEach((sp,i)=>{if(p>=sp[0]&&p<sp[1]){active=i;local=ramp(p,sp[0],sp[1])}});
 if(active>=0){
   const d=galleryData[active];galleryFrame(d.frame,1,lerp(1.045,1,ease(local)));
   galleryLabel.innerHTML='<small>'+d.index+'</small><h2>'+d.title+'</h2><p>'+d.copy+'</p>';
   galleryLabel.style.opacity=String(ramp(local,0,.18)*(1-ramp(local,.82,1)));
   galleryLabel.style.transform='translateY('+(18*(1-ramp(local,0,.18)))+'px)';
   galleryIndex.textContent=d.index;
 } else {galleryFrames.forEach(f=>f.style.opacity='0');galleryLabel.style.opacity='0'}
 
 // exact source crops positions: 3x3 montage + 2x2 acoustic contact sheet
 galleryFrames.forEach(f=>{
   const pos=f.dataset.pos?.split(',').map(Number)||[0,0];
   f.style.backgroundPosition=pos[0]+'% '+pos[1]+'%';
 });
 setOpacity(systemBand,ramp(p,.615,.655)*(1-ramp(p,.688,.71)));

 // project film
 const fo=ramp(p,.835,.875)*(1-ramp(p,.915,.945));setOpacity(film,fo);setOpacity(filmTitle,ramp(p,.855,.89)*(1-ramp(p,.91,.94)));
 if(video){
   if(fo>.04 && video.paused && !reduced)video.play().catch(()=>{});
   if(fo<=.02 && !video.paused)video.pause();
 }

 setOpacity(end,ramp(p,.925,.98));
}
function loop(now){
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 target=clamp(scrollY/max);
 if(reduced)shown=target;
 else{
  const dt=Math.min(64,now-last);const smoothing=1-Math.pow(1-.11,dt/16.667);
  shown+=(target-shown)*smoothing;
 }
 last=now;paint(shown);raf=requestAnimationFrame(loop);
}
raf=requestAnimationFrame(loop);
addEventListener('keydown',e=>{
 if(e.key==='Home')scrollTo({top:0,behavior:reduced?'auto':'smooth'});
 if(e.key==='End')scrollTo({top:document.documentElement.scrollHeight,behavior:reduced?'auto':'smooth'});
});
window.__CASA_ALAIN_CINEMATIC__={
 schemaVersion:1,
 sourceBacked:true,
 globalReference:'CIVORA_SCROLL_LOGIC_ADAPTED',
 projectGeometry:'PLAN_DERIVED_FOOTPRINT_ONLY',
 syntheticProjectImagery:false,
 acousticSupplierBrandHidden:true,
 chapters:galleryData.map(x=>x.id),
 mounted:true
};
})();