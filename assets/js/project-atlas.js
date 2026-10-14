(()=>{
const d=window.PROJECT_ATLAS_DATA||{};
const root=document.getElementById('projectAtlasRoot');
if(!root)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const list=x=>(x||[]).map(v=>'<li>'+esc(v)+'</li>').join('');
const chips=x=>(x||[]).map(v=>'<span class="pa-chip">'+esc(v)+'</span>').join('');
const metric=(x,i)=>'<article class="pa-metric pa-reveal"><small>'+esc(x.label||('Metric '+(i+1)))+'</small><b>'+esc(x.value)+'</b><span>'+esc(x.note||'')+'</span></article>';
const chapter=(x,i)=>'<article class="pa-chapter pa-reveal"><aside><span>'+String(i+1).padStart(2,'0')+' / '+esc(x.code||'SYSTEM')+'</span><b>'+esc(x.side||x.title)+'</b></aside><div><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p><ul>'+list(x.bullets)+'</ul></div></article>';
const evidence=x=>'<article class="pa-reveal"><small>'+esc(x.classification||'PROJECT ARCHIVE')+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.detail)+'</p><span class="pa-status">'+esc(x.status||'SOURCE-BACKED')+'</span></article>';
const sourceFile=x=>'<article class="pa-source-item pa-reveal"><small>'+esc(x.type||'SOURCE FILE')+'</small><b>'+esc(x.name)+'</b><span>'+esc(x.note||'')+'</span><em>'+esc(x.status||'SOURCE ARCHIVE')+'</em></article>';
const media=x=>{
 const isVideo=x.kind==='video';
 const vid=(isVideo&&x.publicSrc)?'<video controls preload="metadata"'+(x.poster?' poster="'+esc(x.poster)+'"':'')+'><source src="'+esc(x.publicSrc)+'" type="video/mp4"></video>':'';
 return '<article class="'+(isVideo?'video ':'')+'pa-reveal"><small>'+esc((x.kind||'media').toUpperCase())+'</small><h3>'+esc(x.title)+'</h3><p>'+esc(x.detail)+'</p><span class="pa-status">'+esc(x.status||'ARCHIVE READY')+'</span>'+vid+(isVideo&&!x.publicSrc?'<span class="play">▶</span>':'')+'</article>';
};
document.documentElement.style.setProperty('--accent',d.accent||'#b7a26b');
document.documentElement.style.setProperty('--accent2',d.accent2||'#d4c18d');
document.title=(d.name||'Project')+' — Héctor Lobato';
root.innerHTML=
'<div class="pa-progress" id="paProgress"></div>'+
'<header class="pa-top"><div class="pa-top-in"><a class="pa-brand" href="../index.html">HÉCTOR LOBATO<small>Project Atlas / Engineering portfolio</small></a><nav><a href="../index.html#proyectos">Dossier</a><a href="./index.html">All projects</a><a href="#evidence">Evidence</a><a href="#media">Media</a></nav></div></header>'+
'<main class="pa-page">'+
'<section class="pa-shell pa-hero">'+
'<div><p class="pa-kicker">'+esc(d.number||'PROJECT')+' · '+esc(d.eyebrow||'ENGINEERING CASE')+'</p><h1>'+esc(d.name)+'<span>'+esc(d.location||'')+'</span></h1><p class="pa-lead">'+esc(d.summary)+'</p><div class="pa-chips">'+chips(d.domains)+'</div><div class="pa-actions"><a class="pa-btn primary" href="#systems">Explore engineering ↓</a><a class="pa-btn" href="./index.html">Project atlas ↗</a></div><div class="pa-proof">'+esc(d.proof||'Source-backed project archive. Public view is sanitized and excludes credentials, secure keys and private client data.')+'</div></div>'+
'<div class="pa-hero-stage" id="paStage"><div class="pa-stage-card back"><div class="pa-stage-grid"></div><div class="pa-stage-backcopy"><b>'+esc(d.type||'Technical project')+'</b>'+esc(d.role||'Engineering / integration')+'</div></div><div class="pa-stage-card main '+(d.heroImage?'has-real-media':'')+'">'+(d.heroImage?'<img class="pa-stage-real" src="'+esc(d.heroImage)+'" alt="'+esc(d.heroAlt||d.name)+'">':'')+'<div class="pa-stage-grid"></div><div class="pa-stage-main"><span class="pa-stage-code">'+esc(d.code||'PROJECT / ARCHIVE')+'</span><div class="pa-stage-lines"><i></i><i></i><i></i><i></i></div><div class="pa-stage-name">'+esc(d.stageTitle||d.name)+'<small>'+esc((d.domains||[]).join(' · '))+'</small></div>'+(d.heroCaption?'<span class="pa-stage-caption">'+esc(d.heroCaption)+'</span>':'')+'</div></div><div class="pa-stage-card floor"><div class="pa-stage-grid"></div><div class="pa-stage-floorcopy">'+(d.floorTags||['SURVEY','DESIGN','HANDOVER']).slice(0,3).map(x=>'<span>'+esc(x)+'</span>').join('')+'</div></div></div>'+
'</section>'+
'<section class="pa-shell pa-section"><div class="pa-head pa-reveal"><div><p class="pa-kicker">01 / PROJECT FRAME</p><h2 class="pa-title">What was solved.</h2></div><p>'+esc(d.frame||d.summary)+'</p></div><div class="pa-metrics">'+(d.metrics||[]).map(metric).join('')+'</div></section>'+
'<section class="pa-shell pa-section" id="systems"><div class="pa-head pa-reveal"><div><p class="pa-kicker">02 / ENGINEERING</p><h2 class="pa-title">Systems, layers, decisions.</h2></div><p>'+esc(d.engineeringIntro||'The public case study keeps the technical chain visible: input conditions, design logic, interfaces, implementation constraints and evidence boundary.')+'</p></div><div class="pa-chapters">'+(d.chapters||[]).map(chapter).join('')+'</div></section>'+
(d.sourceRegistry?.length?'<section class="pa-shell pa-section" id="sources"><div class="pa-head pa-reveal"><div><p class="pa-kicker">03 / SOURCE ARCHIVE</p><h2 class="pa-title">Files behind the case.</h2></div><p>Exact source material used to build the public case study. The web page is a derivative; these filenames preserve the project provenance.</p></div><div class="pa-source-grid">'+d.sourceRegistry.map(sourceFile).join('')+'</div></section>':'')+
'<section class="pa-shell pa-section" id="evidence"><div class="pa-head pa-reveal"><div><p class="pa-kicker">04 / EVIDENCE</p><h2 class="pa-title">Proof of work.</h2></div><p>Evidence is labelled by what the source archive actually supports. Concept, calculated, designed, installed and commissioned are not treated as equivalent states.</p></div><div class="pa-evidence">'+(d.evidence||[]).map(evidence).join('')+'</div></section>'+
'<section class="pa-shell pa-section" id="media"><div class="pa-head pa-reveal"><div><p class="pa-kicker">05 / MEDIA & 3D</p><h2 class="pa-title">Project media registry.</h2></div><p>'+esc(d.mediaIntro||'Master video, 3D and render assets are tracked separately from the public page. The web layer only exposes public-safe derivatives.')+'</p></div><div class="pa-media">'+(d.media||[]).map(media).join('')+'</div></section>'+
'<section class="pa-shell pa-section"><div class="pa-boundary pa-reveal"><b>Evidence boundary.</b> '+esc(d.boundary||'This page is a sanitized technical case study built from the supplied project archive. Private identities, passwords, secure project files and commercial data are excluded from the public presentation.')+'</div></section>'+
'<section class="pa-shell pa-section"><div class="pa-next"><a href="'+esc(d.prev?.href||'./index.html')+'"><small>← PREVIOUS</small><b>'+esc(d.prev?.label||'Project atlas')+'</b></a><a href="'+esc(d.next?.href||'./index.html')+'"><small>NEXT →</small><b>'+esc(d.next?.label||'Project atlas')+'</b></a></div></section>'+
'</main><footer class="pa-shell pa-footer"><span>© 2026 Héctor Lobato · Systems Engineering</span><span>'+esc(d.footer||'Project Atlas · source-backed technical portfolio')+'</span></footer>';
const prog=document.getElementById('paProgress');
const update=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);prog.style.width=Math.min(100,scrollY/max*100)+'%'};
addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.08,rootMargin:'0px 0px -5%'});
document.querySelectorAll('.pa-reveal').forEach(el=>io.observe(el));
const stage=document.getElementById('paStage');
if(stage&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 let raf=0,rx=0,ry=0;
 const paint=()=>{raf=0;stage.querySelectorAll('.pa-stage-card').forEach((el,i)=>{const m=i===1?1:(i===0 ? .45 : .28);el.style.translate=(rx*m)+'px '+(ry*m)+'px';});};
 stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();rx=(e.clientX-r.left-r.width/2)/r.width*20;ry=(e.clientY-r.top-r.height/2)/r.height*14;if(!raf)raf=requestAnimationFrame(paint)});
 stage.addEventListener('pointerleave',()=>{rx=ry=0;if(!raf)raf=requestAnimationFrame(paint)});
}
})();