import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.CV_BASE_URL||'http://127.0.0.1:4186';
const failures=[];const results=[];
await fs.mkdir('.qa/cv-editorial',{recursive:true});
const browser=await chromium.launch({headless:true});

const cases=[
  {id:'chooser',path:'/cv/',title:'Currículum',theme:'gallery',links:4},
  {id:'dossier',path:'/cv/dossier.html',title:'Dossier',theme:'dossier',project:'Club Mar Salada'},
  {id:'present',path:'/cv/present.html',title:'Presentation Route',theme:null,project:'Club Mar Salada'},
  {id:'ats',path:'/cv/ats.html',title:'CV ATS',theme:null,project:'Club Mar Salada'},
  {id:'atelier',path:'/cv/atelier.html',title:'Atelier',theme:'atelier',project:'GAZA Operations Intelligence'},
  {id:'swiss',path:'/cv/swiss.html',title:'Swiss',theme:'swiss',project:'Mar Salada.'},
  {id:'monograph',path:'/cv/monograph.html',title:'Monograph',theme:'monograph',project:'GAZA Operations Intelligence'},
  {id:'world',path:'/cv/world.html',title:'Scroll World',theme:null,project:'El espacio es el comienzo.'}
];
for(const viewport of [{id:'desktop',width:1440,height:950},{id:'mobile',width:390,height:844}]){
  for(const test of cases){
    const page=await browser.newPage({viewport,deviceScaleFactor:1});
    page.on('pageerror',e=>failures.push(test.id+'/'+viewport.id+' pageerror: '+e.message));
    const r=await page.goto(base+test.path,{waitUntil:'domcontentloaded',timeout:30000});
    if(!r?.ok())failures.push(test.id+'/'+viewport.id+' HTTP '+r?.status());
    await page.waitForTimeout(test.id==='world'?1900:450);
    if(test.id==='dossier'){
      try{await page.waitForFunction(()=>window.__CV_HERO__?.mounted===true,{timeout:8000})}catch{failures.push('dossier React hero did not mount')}
      await page.waitForTimeout(500);
    }
    const state=await page.evaluate(()=>({
      title:document.title,bodyClass:document.body.className,
      h1:document.querySelector('h1')?.textContent||'',
      projects:document.body.textContent.includes('GAZA Operations Intelligence'),
      galleryCards:document.querySelectorAll('.variant').length,
      linkCount:document.querySelectorAll('a[href]').length,
      documentOverflow:document.documentElement.scrollWidth-innerWidth,
      world:window.__CV_SCROLL_WORLD__||null,
      sceneCount:document.querySelectorAll('.sw-scene').length,
      sceneLoaded:[...document.querySelectorAll('.sw-scene__still')].map(i=>i.complete&&i.naturalWidth>0),
      currentChapter:[...document.querySelectorAll('.sw-route__dot')].findIndex(x=>x.classList.contains('is-active')),
      dossier:window.__CV_DOSSIER__||null,
      dossierProjects:document.querySelectorAll('.project-chapter').length,
      dossierArchive:document.querySelectorAll('.archive a').length,
      ats:window.__CV_ATS__||null,
      atsSections:document.querySelectorAll('main.cv section').length,
      atsH2:[...document.querySelectorAll('main.cv h2')].map(x=>x.textContent.trim()),
      present:window.__CV_PRESENT__||null,
      presentSteps:document.querySelectorAll('.step').length,
      evidenceCards:document.querySelectorAll('#evidence .archive a').length,
      hero:window.__CV_HERO__||null,
      heroRoot:!!document.querySelector('[data-reactbits-hero="true"]'),
      orbitCards:document.querySelectorAll('.rb-orbit-card').length,
      menuTrigger:!!document.querySelector('.rb-menu-trigger'),
      latticeCells:document.querySelectorAll('.rb-cell').length,
      imageLoaded:(()=>{const i=document.querySelector('.atelier-photo img');return i?i.complete&&i.naturalWidth>0:null})(),
      asset404:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)
    }));
    results.push({id:test.id,viewport:viewport.id,...state});
    if(!state.title.includes(test.title))failures.push(test.id+' title mismatch: '+state.title);
    if(test.theme&&!state.bodyClass.includes(test.theme))failures.push(test.id+' wrong design theme');
    if(state.linkCount<2)failures.push(test.id+' insufficient navigation');
    if(state.documentOverflow>3)failures.push(test.id+'/'+viewport.id+' horizontal overflow '+state.documentOverflow);
    if(state.asset404.length)failures.push(test.id+' broken image(s): '+state.asset404.join(','));
    if(test.links&&state.galleryCards!==test.links)failures.push('chooser must offer four distinct variants');
    if(test.id==='atelier'&&state.imageLoaded!==true)failures.push('Atelier portrait not loaded');
    if(test.id==='dossier'){
      if(state.dossier?.schemaVersion!==2||state.dossier.projects!==7||state.dossier.featured!==3||state.dossier.visualEvidence!==3||state.dossier.evidenceCards!==4||state.dossier.presentationRoute!==true||state.dossier.ats!==false||state.dossier.print!==true)failures.push('Dossier contract mismatch');
      if(state.dossierProjects!==3||state.dossierArchive!==8||state.evidenceCards!==4)failures.push('Dossier project/evidence inventory mismatch');
      const expectedBits=['Waves','Particles','TechText','DitherVeil','CircularCarousel','StaggeredMenu','LatticeLoader'];
      if(state.hero?.schemaVersion!==1||state.hero?.engine!=='REACT_18_UMD'||state.hero?.mounted!==true||state.hero?.heroOnly!==true||state.hero?.photoVariants!==5||state.hero?.generatedPortraits!==0||!expectedBits.every(x=>state.hero?.components?.includes(x)))failures.push('Dossier React Bits hero contract mismatch');
      if(!state.heroRoot||state.orbitCards!==5||!state.menuTrigger||state.latticeCells!==16)failures.push('Dossier React hero UI missing');
      await page.click('.rb-menu-trigger');await page.waitForTimeout(350);
      const menu=await page.evaluate(()=>({open:document.querySelector('.rb-stagger')?.classList.contains('is-open'),links:document.querySelectorAll('.rb-stagger-link').length}));
      if(!menu.open||menu.links!==7)failures.push('Staggered menu did not open correctly');
      await page.click('.rb-menu-close');await page.waitForTimeout(120);
    }
    if(test.id==='present'){
      if(state.present?.schemaVersion!==1||state.present.steps!==5||state.present.targetMinutes!==5||state.present.dossier!==true||state.present.ats!==true||state.present.proofLinks!==true||state.presentSteps!==5)failures.push('Presentation route contract mismatch');
    }
    if(test.id==='ats'){
      if(state.ats?.schemaVersion!==1||state.ats.format!=='PROJECT_BASED_ATS'||state.ats.print!==true||state.ats.employmentChronology!==false||state.ats.selectedProjects!==7||state.ats.featuredProjects!==3)failures.push('ATS contract mismatch');
      const required=['Perfil profesional','Competencias principales','Experiencia técnica seleccionada','Formación','Certificaciones y formación técnica'];
      if(state.atsSections<5||!required.every(x=>state.atsH2.includes(x)))failures.push('ATS semantic sections missing');
    }
    if(test.id==='world'){
      if(state.world?.mode!=='STORYBOARD_SVG_NO_GENERATED_VIDEO'||state.world.scenes!==4||state.world.videoClips!==0)failures.push('Scroll World provenance mismatch');
      if(state.sceneCount!==4||state.sceneLoaded.some(v=>!v))failures.push('Scroll World scenes missing or unloaded');
      await page.evaluate(()=>window.scrollTo(0,window.innerHeight*2.6));
      await page.waitForTimeout(500);
      const moved=await page.evaluate(()=>[...document.querySelectorAll('.sw-route__dot')].findIndex(x=>x.classList.contains('is-active')));
      if(moved<1)failures.push('Scroll World did not react to scroll: '+moved);
    }
    await page.screenshot({path:'.qa/cv-editorial/'+test.id+'-'+viewport.id+'.png',fullPage:test.id!=='world'});
    await page.close();
  }
}
const other=await browser.newPage();
await other.goto(base+'/start/cv.html',{waitUntil:'domcontentloaded'});
const start=await other.evaluate(()=>({
  routes:['../cv/atelier.html','../cv/swiss.html','../cv/monograph.html','../cv/world.html','../cv/dossier.html','../cv/ats.html','../cv/present.html'].every(u=>!!document.querySelector('a[href="'+u+'"]')),
  legacy:!!document.querySelector('a[href="../apps/presentation-lab/"]')
}));
if(!start.routes||!start.legacy)failures.push('sector CV entry links incomplete');
await other.close();

const reduce=await browser.newPage({reducedMotion:'reduce'});
reduce.on('pageerror',e=>failures.push('reduced-motion: '+e.message));
await reduce.goto(base+'/cv/world.html',{waitUntil:'domcontentloaded'});
await reduce.waitForTimeout(400);
const reduced=await reduce.evaluate(()=>({scenes:document.querySelectorAll('.sw-scene').length,vids:document.querySelectorAll('.sw-scene video').length}));
if(reduced.scenes!==4||reduced.vids!==0)failures.push('reduced motion fallback broken');
await reduce.close();
await browser.close();
await fs.writeFile('.qa/cv-editorial/result.json',JSON.stringify({results,start,reduced,failures},null,2));
if(failures.length){console.error(JSON.stringify({failures,results},null,2));process.exitCode=2}
else console.log('CV EDITORIAL QA PASS / React Bits hero + presentation route + dossier + ATS + 4 variants / desktop + mobile / scroll-world storyboard / reduced motion / sector entry');
