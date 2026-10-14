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
const sourceCard=(x,i)=>{
 const pos=[
  [-210,-135,40,-4],[170,-145,-10,4],[-245,55,-35,3],[220,65,20,-3],[-65,145,70,2],[70,-5,110,-1],[-5,-190,-70,1],[5,205,-90,-2]
 ][i%8];
 return '<article class="pa-source-card" data-source-i="'+i+'" style="--sx:'+pos[0]+'px;--sy:'+pos[1]+'px;--sz:'+pos[2]+'px;--sr:'+pos[3]+'deg"><small><span>'+esc(x.type||'SOURCE')+'</span><em>'+esc(x.status||'ARCHIVE')+'</em></small><b>'+esc(x.name)+'</b><p>'+esc(x.role||'Project source')+'</p></article>';
};
const sourceSection=()=>{
 const a=d.sourceArchive;
 if(!a||!(a.items||[]).length)return '';
 const stats=(a.stats||[]).map(s=>'<div class="pa-source-stat"><b>'+esc(s.value)+'</b><span>'+esc(s.label)+'</span></div>').join('');
 const cards=a.items.map(sourceCard).join('');
 const idx=a.items.map((x,i)=>'<button type="button" data-source-jump="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><span>'+esc(x.name)+'</span><em>'+esc(x.type||'')+'</em></button>').join('');
 return '<section class="pa-shell pa-section" id="source-archive"><div class="pa-head pa-reveal"><div><p class="pa-kicker">03 / SOURCE ARCHIVE 3D</p><h2 class="pa-title">The project, as files.</h2></div><p>'+esc(a.intro||'This 3D index is built only from actual supplied source files. Card position is interface layout, not project geometry.')+'<span class="pa-source-legend"><span>NO GENERATED PROJECT GEOMETRY</span><span>REAL SOURCE FILENAMES</span><span>PROVENANCE VISIBLE</span></span></p></div><div class="pa-source3d"><div class="pa-source-stage pa-reveal"><div class="pa-source-stage-label"><b>SOURCE ARCHIVE</b> / UI DEPTH ONLY · NOT PROJECT GEOMETRY</div><div class="pa-source-scene" id="paSourceScene">'+cards+'</div></div><aside class="pa-source-side pa-reveal"><header><p class="pa-kicker">'+esc(a.package||'PROJECT SOURCE SET')+'</p><h3>'+esc(a.title||'Archive inventory')+'</h3><p>'+esc(a.note||'Only public-safe metadata is shown. Source files remain private unless explicitly published.')+'</p></header><div class="pa-source-stats">'+stats+'</div><div class="pa-source-index">'+idx+'</div><div class="pa-source-note">'+esc(a.boundary||'Editable source files, client-private material and credentials are not embedded in the public site.')+'</div></aside></div></section>';
};
const mediaSlice=(m,index,label)=>{
 const cols=Math.max(1,Number(m.cols)||3),rows=Math.max(1,Number(m.rows)||3),col=index%cols,row=Math.floor(index/cols);
 const px=cols===1?0:(col/(cols-1))*100,py=rows===1?0:(row/(rows-1))*100;
 const style='background-image:url(&quot;'+esc(m.montage)+'&quot;);background-size:'+(cols*100)+'% '+(rows*100)+'%;background-position:'+px+'% '+py+'%;';
 return '<figure class="pa-real-slice pa-reveal"><div style="'+style+'"></div><figcaption><b>'+esc(label||('Source view '+String(index+1).padStart(2,'0')))+'</b><span>DIRECT CROP FROM SUPPLIED PROJECT CONTACT SHEET</span></figcaption></figure>';
};
const realMediaSection=()=>{
 const m=d.realMedia;
 if(!m)return '';
 if(m.documentOnly){
  const docs=(m.documents||d.sourceArchive?.items||[]).slice(0,8).map((x,i)=>'<article class="pa-real-doc pa-reveal"><small>'+String(i+1).padStart(2,'0')+' / '+esc(x.type||'DOCUMENT')+'</small><b>'+esc(x.name)+'</b><p>'+esc(x.role||x.note||'Supplied source document')+'</p><span>'+esc(x.status||'SOURCE DOCUMENT')+'</span></article>').join('');
  return '<section class="pa-shell pa-section" id="real-media"><div class="pa-head pa-reveal"><div><p class="pa-kicker">02 / REAL SOURCE MEDIA</p><h2 class="pa-title">Document-first case.</h2></div><p>'+esc(m.note||'The supplied source package contains documents rather than publishable project imagery. No substitute renders or invented visuals are used.')+'</p></div><div class="pa-real-docs">'+docs+'</div></section>';
 }
 const stills=(m.stills||[]).map((s,i)=>'<figure class="pa-real-still pa-reveal"><img loading="lazy" src="'+esc(s.src||s)+'" alt="'+esc(s.alt||d.name+' source image '+(i+1))+'"><figcaption><b>'+esc(s.label||('SOURCE IMAGE '+String(i+1).padStart(2,'0')))+'</b><span>'+esc(s.classification||'USER-SUPPLIED / SOURCE-DERIVED')+'</span></figcaption></figure>').join('');
 const slices=(m.slices||[]).map((idx,i)=>mediaSlice(m,idx,(m.sliceLabels||[])[i])).join('');
 const montage=m.montage?'<figure class="pa-real-montage pa-reveal"><img loading="lazy" src="'+esc(m.montage)+'" alt="'+esc(m.montageAlt||d.name+' supplied project montage')+'"><figcaption><b>'+esc(m.montageLabel||'SUPPLIED PROJECT CONTACT SHEET')+'</b><span>'+esc(m.montageClass||'USER-SUPPLIED / SOURCE-DERIVED CONTACT SHEET')+'</span></figcaption></figure>':'';
 const secondary=m.secondary?'<figure class="pa-real-montage pa-real-secondary pa-reveal"><img loading="lazy" src="'+esc(m.secondary.src)+'" alt="'+esc(m.secondary.alt||d.name+' secondary source montage')+'"><figcaption><b>'+esc(m.secondary.label||'SECONDARY SOURCE VIEW')+'</b><span>'+esc(m.secondary.classification||'USER-SUPPLIED / SOURCE-DERIVED')+'</span></figcaption></figure>':'';
 const video=m.reel?'<article class="pa-real-video pa-reveal"><video controls preload="metadata" playsinline'+(m.poster?' poster="'+esc(m.poster)+'"':'')+'><source src="'+esc(m.reel)+'" type="video/mp4"></video><div><small>REAL-MEDIA MOTION DERIVATIVE</small><h3>'+esc(m.reelTitle||'Source media reel')+'</h3><p>'+esc(m.reelNote||'A lightweight motion derivative created only from the supplied project imagery; no synthetic project imagery is introduced.')+'</p></div></article>':'';
 const sourceVideo=m.sourceVideo?'<article class="pa-real-video pa-reveal"><video controls preload="metadata" playsinline><source src="'+esc(m.sourceVideo.src)+'" type="video/mp4"></video><div><small>'+esc(m.sourceVideo.classification||'SOURCE VIDEO')+'</small><h3>'+esc(m.sourceVideo.title||'Project source video')+'</h3><p>'+esc(m.sourceVideo.note||'Direct user-supplied source video.')+'</p></div></article>':'';
 return '<section class="pa-shell pa-section" id="real-media"><div class="pa-head pa-reveal"><div><p class="pa-kicker">02 / REAL SOURCE MEDIA</p><h2 class="pa-title">See the project.</h2></div><p>'+esc(m.note||'The following media comes directly from the supplied project archive or from lightweight web derivatives of those exact files. No substitute project artwork is used.')+'</p></div><div class="pa-real-feature">'+video+sourceVideo+montage+secondary+'</div>'+(stills?'<div class="pa-real-stills">'+stills+'</div>':'')+(slices?'<div class="pa-real-slices">'+slices+'</div>':'')+'</section>';
};
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
'<div class="pa-hero-stage" id="paStage"><div class="pa-stage-card back"><div class="pa-stage-grid"></div><div class="pa-stage-backcopy"><b>'+esc(d.type||'Technical project')+'</b>'+esc(d.role||'Engineering / integration')+'</div></div>'<div class="pa-stage-card main '+(d.heroImage?'has-real-media':'')+'">'+(d.heroImage?'<img class="pa-stage-real" src="'+esc(d.heroImage)+'" alt="'+esc(d.heroAlt||d.name)+'">':'')+'<div class="pa-stage-grid"></div><div class="pa-stage-main"><span class="pa-stage-code">'+esc(d.code||'PROJECT / ARCHIVE')+'</span><div class="pa-stage-lines"><i></i><i></i><i></i><i></i></div><div class="pa-stage-name">'+esc(d.stageTitle||d.name)+'<small>'+esc((d.domains||[]).join(' · '))+'</small></div></div></div><div class="pa-stage-card floor"><div class="pa-stage-grid"></div><div class="pa-stage-floorcopy">'+(d.floorTags||['SURVEY','DESIGN','HANDOVER']).slice(0,3).map(x=>'<span>'+esc(x)+'</span>').join('')+'</div></div></div>'+
'</section>'+
'<section class="pa-shell pa-section"><div class="pa-head pa-reveal"><div><p class="pa-kicker">01 / PROJECT FRAME</p><h2 class="pa-title">What was solved.</h2></div><p>'+esc(d.frame||d.summary)+'</p></div><div class="pa-metrics">'+(d.metrics||[]).map(metric).join('')+'</div></section>'+realMediaSection()+
sourceSection()+
'<section class="pa-shell pa-section" id="systems"><div class="pa-head pa-reveal"><div><p class="pa-kicker">04 / ENGINEERING</p><h2 class="pa-title">Systems, layers, decisions.</h2></div><p>'+esc(d.engineeringIntro||'The public case study keeps the technical chain visible: input conditions, design logic, interfaces, implementation constraints and evidence boundary.')+'</p></div><div class="pa-chapters">'+(d.chapters||[]).map(chapter).join('')+'</div></section>'+
'<section class="pa-shell pa-section" id="evidence"><div class="pa-head pa-reveal"><div><p class="pa-kicker">05 / EVIDENCE</p><h2 class="pa-title">Proof of work.</h2></div><p>Evidence is labelled by what the source archive actually supports. Concept, calculated, designed, installed and commissioned are not treated as equivalent states.</p></div><div class="pa-evidence">'+(d.evidence||[]).map(evidence).join('')+'</div></section>'+
'<section class="pa-shell pa-section" id="media"><div class="pa-head pa-reveal"><div><p class="pa-kicker">06 / MEDIA & SOURCE MODELS</p><h2 class="pa-title">Project media registry.</h2></div><p>'+esc(d.mediaIntro||'Master video, 3D and render assets are tracked separately from the public page. The web layer only exposes public-safe derivatives.')+'</p></div><div class="pa-media">'+(d.media||[]).map(media).join('')+'</div></section>'+
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
const srcScene=document.getElementById('paSourceScene');
if(srcScene){
 const cards=[...srcScene.querySelectorAll('.pa-source-card')];
 let raf2=0,tx=0,ty=0;
 const sourcePaint=()=>{raf2=0;srcScene.style.transform='rotateX('+(-ty*4).toFixed(2)+'deg) rotateY('+(tx*6).toFixed(2)+'deg)';};
 const stage=srcScene.closest('.pa-source-stage');
 if(stage&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5;if(!raf2)raf2=requestAnimationFrame(sourcePaint)});
  stage.addEventListener('pointerleave',()=>{tx=ty=0;if(!raf2)raf2=requestAnimationFrame(sourcePaint)});
 }
 document.querySelectorAll('[data-source-jump]').forEach(btn=>btn.addEventListener('click',()=>{
   const i=Number(btn.dataset.sourceJump)||0;
   document.querySelectorAll('[data-source-jump]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');
   cards.forEach((card,j)=>{card.style.opacity=j===i?'1':'.34';card.style.borderColor=j===i?'color-mix(in srgb,var(--accent) 68%,transparent)':'';card.style.zIndex=j===i?'25':'';});
   setTimeout(()=>cards.forEach((card,j)=>{if(j!==i)card.style.opacity='';}),950);
 }));
}
window.__PROJECT_ATLAS_SOURCE3D__={schemaVersion:1,mode:'SOURCE_ARCHIVE_UI_DEPTH',geometryClaim:false,sourceCount:(d.sourceArchive?.items||[]).length,mounted:Boolean(srcScene)};

})();