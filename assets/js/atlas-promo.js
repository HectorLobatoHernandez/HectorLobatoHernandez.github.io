(async()=>{
const base='../docs/project-atlas/project-registry.json';
let reg;try{reg=await fetch(base).then(r=>r.ok?r.json():Promise.reject(r.status))}catch(e){return}
const projects=reg.projects||[];
const orbit=document.getElementById('apOrbit');
if(orbit){
 orbit.innerHTML='<div class="ap-center"><div><b>PROJECT ATLAS</b><span>SOURCE-BACKED / 2026</span></div></div>'+projects.map((p,i)=>'<a class="ap-orbit-card" href="..'+p.href+'" data-i="'+i+'"><small>'+p.id+' · '+p.sourceCount+'</small><b>'+p.name+'</b></a>').join('');
 const cards=[...orbit.querySelectorAll('.ap-orbit-card')];
 const place=()=>{const rx=orbit.clientWidth/2.7,ry=orbit.clientHeight/2.8;cards.forEach((c,i)=>{const a=(i/cards.length)*Math.PI*2-Math.PI/2;const x=Math.cos(a)*rx,y=Math.sin(a)*ry,z=Math.cos(a*2)*70-55;c.style.transform='translate3d(calc(-50% + '+x.toFixed(1)+'px),calc(-50% + '+y.toFixed(1)+'px),'+z.toFixed(1)+'px) rotateY('+(-Math.cos(a)*10).toFixed(1)+'deg)';c.style.opacity=String(.62+((z+125)/195)*.38);c.style.zIndex=String(Math.round(z+130))})};
 place();addEventListener('resize',place);
}
const root=document.getElementById('apDomains');
const domains=[
 ['01','SPACE / ARCHITECTURE',['casa-alain','can-furnet-club','playa-soleil-bora-bora']],
 ['02','SOUND / ACOUSTICS',['mar-salada','can-furnet-club','private-production-studio-canada','private-production-studio-sta-eulalia','acoustic-studio-italy']],
 ['03','CONTROL / AUTOMATION',['mar-salada']],
 ['04','CAD / FABRICATION',['mar-salada','can-furnet-club','playa-soleil-bora-bora','private-production-studio-canada']],
 ['05','STUDIOS / CRITICAL LISTENING',['casa-alain','private-production-studio-canada','private-production-studio-sta-eulalia','acoustic-studio-italy','private-producer-acoustic-concept']]
];
if(root)root.innerHTML=domains.map(([n,name,slugs])=>'<section class="ap-domain ap-reveal"><aside><span>'+n+' / DOMAIN</span><h3>'+name+'</h3></aside><div class="ap-domain-grid">'+slugs.map(slug=>{const p=projects.find(x=>x.slug===slug);return p?'<a class="ap-project" href="..'+p.href+'"><strong>'+p.id+'</strong><small>'+p.location+' · '+p.sourceCount+'</small><h4>'+p.name+'</h4><p>'+p.domain.join(' · ')+'</p></a>':''}).join('')+'</div></section>').join('');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.07,rootMargin:'0px 0px -5%'});
document.querySelectorAll('.ap-reveal').forEach(x=>io.observe(x));
window.__ATLAS_PROMO__={schemaVersion:1,projects:projects.length,sourceBacked:true,generatedProjectImagery:false,mounted:true};
})();