(()=>{
const projects=[
{n:'P01',name:'Mar Salada / Club del Mar',loc:'Palma de Mallorca',href:'./mar-salada.html',domain:'AV · acoustics · KNX/DALI',files:'9 source groups',media:'2 MP4 masters',desc:'Integrated hospitality systems: audio, acoustics, automation, mechanical integration and commissioning.'},
{n:'P02',name:'Casa Alain',loc:'Residential cinema',href:'./casa-alain.html',domain:'Cinema · acoustics · 3D',files:'95 files',media:'1 MP4 + 56 images',desc:'Private cinema with acoustic treatment, audio options, electrical coordination, SketchUp and final visualization.'},
{n:'P03',name:'Can Furnet Club',loc:'Private club',href:'./can-furnet-club.html',domain:'Isolation · room acoustics',files:'156 files',media:'105 PNG',desc:'Box-in-box isolation, structural decoupling, HVAC silencers, acoustic doors, cabling and final renders.'},
{n:'P04',name:'Playa Soleil / Bora Bora',loc:'Ibiza',href:'./playa-soleil-bora-bora.html',domain:'Professional AV · CAD',files:'65 files',media:'22 field photos',desc:'Cable books, club sections, speaker/data/power routes, CAD and acoustic / sonic SketchUp models.'},
{n:'P05',name:'Private Production Studio',loc:'Canada',href:'./private-production-studio-canada.html',domain:'Studio acoustics · CAD / 3D',files:'89 files',media:'73 PNG',desc:'Phased production-studio development with acoustic reinforcement, CAD, source model and field references.'},
{n:'P06',name:'Private Producer Studio',loc:'Confidential',href:'./private-production-studio-sta-eulalia.html',domain:'Studio acoustics · V-Ray',files:'104 files',media:'11 V-Ray + field',desc:'Professional studio package with CAD, source photographs, editable layouts, SketchUp and V-Ray presentation.'},
{n:'P07',name:'Acoustic Production Room',loc:'Italy',href:'./acoustic-studio-italy.html',domain:'RT prediction · mix room',files:'32 files',media:'24 renders + MP4',desc:'Small-room acoustic design with modal diagnosis, broadband treatment, diffusion and predicted RT60.'},
{n:'P08',name:'Private Producer Acoustic Concept',loc:'Confidential',href:'./private-producer-acoustic-concept.html',domain:'Acoustic pre-design',files:'6 documents',media:'EN + ES',desc:'Bilingual confidential pre-design using only supplied project documents; no invented room imagery.'}
];
const scene=document.getElementById('a3Scene'),counter=document.getElementById('a3Counter');if(!scene)return;
scene.innerHTML=projects.map((p,i)=>'<a class="a3-card" data-i="'+i+'" href="'+p.href+'"><small><span>'+p.n+' · '+p.domain+'</span><span>'+p.loc+'</span></small><h2>'+p.name+'</h2><p>'+p.desc+'</p><dl><div><dt>Archive</dt><dd>'+p.files+'</dd></div><div><dt>Media</dt><dd>'+p.media+'</dd></div></dl></a>').join('');
const cards=[...scene.querySelectorAll('.a3-card')];let current=0,drag=false,startX=0,startI=0;
function place(){
 const w=innerWidth<600?Math.min(innerWidth*.82,420):Math.min(innerWidth*.34,440);const radius=innerWidth<700?520:760;
 cards.forEach((c,i)=>{let delta=i-current;while(delta>projects.length/2)delta-=projects.length;while(delta<-projects.length/2)delta+=projects.length;const a=delta*.48;const x=Math.sin(a)*radius;const z=(Math.cos(a)-1)*radius*.72;const ry=-a*34;const scale=Math.max(.68,1-Math.abs(delta)*.08);c.style.width=w+'px';c.style.transform='translate3d(calc(-50% + '+x.toFixed(1)+'px),-50%,'+z.toFixed(1)+'px) rotateY('+ry.toFixed(1)+'deg) scale('+scale.toFixed(3)+')';c.style.opacity=Math.abs(delta)>3?'.08':String(Math.max(.22,1-Math.abs(delta)*.2));c.style.zIndex=String(20-Math.abs(delta));c.classList.toggle('is-front',delta===0)});counter.textContent=String(current+1).padStart(2,'0')+' / '+String(projects.length).padStart(2,'0')+' · '+projects[current].name;
}
function go(v){current=(v+projects.length)%projects.length;place()}
document.getElementById('a3Prev').onclick=()=>go(current-1);document.getElementById('a3Next').onclick=()=>go(current+1);
scene.closest('.a3-view').addEventListener('pointerdown',e=>{drag=true;startX=e.clientX;startI=current;e.currentTarget.setPointerCapture?.(e.pointerId)});
scene.closest('.a3-view').addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-startX;if(Math.abs(dx)>85){go(startI+(dx<0?1:-1));drag=false}});
scene.closest('.a3-view').addEventListener('pointerup',()=>drag=false);scene.closest('.a3-view').addEventListener('pointercancel',()=>drag=false);
addEventListener('keydown',e=>{if(e.key==='ArrowLeft')go(current-1);if(e.key==='ArrowRight')go(current+1)});
place();
window.__PROJECT_ATLAS_3D__={schemaVersion:1,mode:'SOURCE_BACKED_PROJECT_CAROUSEL',projectGeometry:false,projects:projects.length,mounted:true};
})();