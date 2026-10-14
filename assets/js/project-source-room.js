(()=>{
const data=window.PROJECT_SOURCE_MEDIA;if(!data||!Array.isArray(data.items)||!data.items.length)return;
const host=document.querySelector('main.pa-page');if(!host)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const section=document.createElement('section');section.className='sr-section';section.id='source-room';
section.innerHTML='<div class="sr-shell"><div class="sr-head"><div><p class="sr-kicker">SOURCE ROOM / REAL PROJECT REFERENCES</p><h2>'+esc(data.title||'Project source room')+'</h2></div><p>'+esc(data.intro||'Every visual shown here comes from the supplied project archive. The depth and motion belong to the portfolio interface, not to invented project geometry.')+'</p></div><div class="sr-room"><div class="sr-stage"></div><div class="sr-controls"><div class="sr-nav"><button type="button" data-prev aria-label="Previous source">←</button><button type="button" data-next aria-label="Next source">→</button></div><div class="sr-dots"></div><div class="sr-counter"></div></div></div><div class="sr-meta"><div class="sr-active"></div><div class="sr-sources"></div></div><div class="sr-archive"></div><div class="sr-notice"><b>Evidence policy.</b> '+esc(data.boundary||'Source media is shown as supplied/derived from the project archive. Interface perspective is only presentation. No unverified geometry or performance is introduced.')+'</div></div>';
const first=host.querySelector('.pa-section');host.insertBefore(section,first);
const stage=section.querySelector('.sr-stage'),dots=section.querySelector('.sr-dots'),counter=section.querySelector('.sr-counter'),activeBox=section.querySelector('.sr-active'),sources=section.querySelector('.sr-sources'),archive=section.querySelector('.sr-archive');
let index=0;
const cards=data.items.map((item,i)=>{
 const fig=document.createElement('figure');fig.className='sr-card';fig.dataset.kind=item.kind||'image';fig.tabIndex=0;
 let media;
 if(item.kind==='video'){media=document.createElement('video');media.src=item.src;media.controls=true;media.preload='metadata';media.playsInline=true;if(item.poster)media.poster=item.poster;}
 else {media=document.createElement('img');media.src=item.src;media.alt=item.title||'Project source';media.loading=i<2?'eager':'lazy';media.decoding='async';}
 fig.append(media);
 const cap=document.createElement('figcaption');cap.innerHTML='<b>'+esc(item.title)+'</b><span>'+esc(item.classification||item.kind||'SOURCE')+'</span>';fig.append(cap);
 fig.addEventListener('click',()=>{index=i;render()});fig.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();index=i;render()}});
 stage.append(fig);
 const dot=document.createElement('button');dot.className='sr-dot';dot.type='button';dot.setAttribute('aria-label','Source '+(i+1));dot.addEventListener('click',()=>{index=i;render()});dots.append(dot);
 return fig;
});
function render(){
 cards.forEach((card,i)=>{
  let d=i-index;const n=cards.length;if(d>n/2)d-=n;if(d<-n/2)d+=n;
  const ad=Math.abs(d),x=d*23,y=ad*4,z=-ad*125,ry=-d*8,scale=1-ad*.07;
  card.style.transform='translate(-50%,-50%) translate3d('+x+'%,'+y+'%,'+z+'px) rotateY('+ry+'deg) scale('+Math.max(.72,scale)+')';
  card.style.opacity=ad>3?'0':String(Math.max(.18,1-ad*.22));card.style.zIndex=String(20-ad);card.classList.toggle('is-active',d===0);card.style.pointerEvents=ad>2?'none':'auto';
  if(d!==0){const v=card.querySelector('video');if(v&&!v.paused)v.pause()}
 });
 [...dots.children].forEach((d,i)=>d.classList.toggle('is-active',i===index));counter.textContent=String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
 const item=data.items[index];activeBox.innerHTML='<small>'+esc(item.classification||'SOURCE')+'</small><h3>'+esc(item.title)+'</h3><p>'+esc(item.caption||'')+'</p>';
 sources.innerHTML=[['TYPE',item.kind||'image'],['SOURCE',item.source||'Project archive'],['STATUS',item.status||'SOURCE-BACKED'],['FILE',item.file||'curated derivative']].map(x=>'<div class="sr-source"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join('');
}
section.querySelector('[data-prev]').onclick=()=>{index=(index-1+cards.length)%cards.length;render()};section.querySelector('[data-next]').onclick=()=>{index=(index+1)%cards.length;render()};
if(data.archive?.length)archive.innerHTML=data.archive.map(x=>'<article><small>'+esc(x.type||'SOURCE SET')+'</small><b>'+esc(x.title)+'</b><p>'+esc(x.detail||'')+'</p></article>').join('');else archive.remove();
render();
const hero=data.items.find(x=>x.kind!=='video'&&x.hero!==false);if(hero){const main=document.querySelector('.pa-stage-card.main');if(main){const img=document.createElement('img');img.className='sr-hero-img';img.src=hero.src;img.alt='';main.prepend(img)}}
window.__PROJECT_SOURCE_ROOM__={schemaVersion:1,items:data.items.length,mode:'REAL_SOURCE_MEDIA_ONLY',presentationDepth:'UI_ONLY_NOT_PROJECT_GEOMETRY',mounted:true};
})();