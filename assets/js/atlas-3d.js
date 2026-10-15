(async()=>{
let reg;try{reg=await fetch('../docs/project-atlas/project-registry.json').then(r=>r.ok?r.json():Promise.reject(r.status))}catch(e){document.getElementById('a3Counter').textContent='Registry unavailable';return}
const projects=reg.projects||[];
const scene=document.getElementById('a3Scene'),counter=document.getElementById('a3Counter');if(!scene)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
scene.innerHTML=projects.map((p,i)=>'<a class="a3-card '+(p.hero?'has-media':'doc-only')+'" data-i="'+i+'" href="..'+p.href+'">'+(p.hero?'<div class="a3-card-media"><img src="..'+esc(p.hero)+'" alt="'+esc(p.name)+' real project media"><span>'+esc(p.heroClass)+'</span></div>':'<div class="a3-card-doc">DOCUMENTARY CASE<br>NO PUBLIC VISUAL SOURCE</div>')+'<div class="a3-card-body"><small><span>'+esc(p.id)+' · '+esc(p.domain.slice(0,3).join(' · '))+'</span><span>'+esc(p.location)+'</span></small><h2>'+esc(p.name)+'</h2><p>'+esc(p.media)+'</p><dl><div><dt>Archive</dt><dd>'+esc(p.sourceCount)+'</dd></div><div><dt>Media</dt><dd>'+(p.reel?'Video + image':'Documents')+'</dd></div></dl></div></a>').join('');
const cards=[...scene.querySelectorAll('.a3-card')];let current=0,drag=false,startX=0,startI=0;
function place(){
 const w=innerWidth<600?Math.min(innerWidth*.84,430):Math.min(innerWidth*.36,470),radius=innerWidth<700?540:790;
 cards.forEach((c,i)=>{let delta=i-current;while(delta>projects.length/2)delta-=projects.length;while(delta<-projects.length/2)delta+=projects.length;const a=delta*.48,x=Math.sin(a)*radius,z=(Math.cos(a)-1)*radius*.72,ry=-a*34,scale=Math.max(.66,1-Math.abs(delta)*.08);c.style.width=w+'px';c.style.transform='translate3d(calc(-50% + '+x.toFixed(1)+'px),-50%,'+z.toFixed(1)+'px) rotateY('+ry.toFixed(1)+'deg) scale('+scale.toFixed(3)+')';c.style.opacity=Math.abs(delta)>3?'.08':String(Math.max(.22,1-Math.abs(delta)*.2));c.style.zIndex=String(20-Math.abs(delta));c.classList.toggle('is-front',delta===0)});
 counter.textContent=String(current+1).padStart(2,'0')+' / '+String(projects.length).padStart(2,'0')+' · '+projects[current].name;
}
function go(v){current=(v+projects.length)%projects.length;place()}
document.getElementById('a3Prev').onclick=()=>go(current-1);document.getElementById('a3Next').onclick=()=>go(current+1);
const view=scene.closest('.a3-view');view.addEventListener('pointerdown',e=>{drag=true;startX=e.clientX;startI=current;view.setPointerCapture?.(e.pointerId)});view.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-startX;if(Math.abs(dx)>85){go(startI+(dx<0?1:-1));drag=false}});view.addEventListener('pointerup',()=>drag=false);view.addEventListener('pointercancel',()=>drag=false);
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')go(current-1);if(e.key==='ArrowRight')go(current+1)});
place();
window.__PROJECT_ATLAS_3D__={schemaVersion:2,mode:'REAL_MEDIA_SOURCE_BACKED_CAROUSEL',projectGeometry:false,projects:projects.length,visualProjects:projects.filter(x=>x.hero).length,generatedProjectImages:false,mounted:true};
})();