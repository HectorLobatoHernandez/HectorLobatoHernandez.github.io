import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.BASE_URL||'http://127.0.0.1:4194';
const out='.qa/sound-club-visuals';
await fs.mkdir(out,{recursive:true});

const browser=await chromium.launch({headless:true});
const errors=[];
const requestFailures=[];
const page=await browser.newPage({viewport:{width:1600,height:1000}});
page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
page.on('requestfailed',r=>requestFailures.push(r.url()+' :: '+(r.failure()?.errorText||'failed')));

const response=await page.goto(base+'/projects/sound-club-visuals.html',{waitUntil:'domcontentloaded',timeout:45000});
if(!response?.ok())throw new Error('React Visuals HTTP '+response?.status());

await page.waitForFunction(()=>window.__SOUND_CLUB_VISUALS__?.total===10,{timeout:30000});
const state=await page.evaluate(()=>({
  contract:window.__SOUND_CLUB_VISUALS__,
  assets:document.querySelectorAll('.rv-asset').length,
  filters:document.querySelectorAll('.rv-filter').length,
  viewer:!!document.querySelector('.rv-viewer'),
  warning:document.body.textContent.includes('NOT AS-BUILT'),
  skillLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('skills/mar-salada-react-scroll/SKILL.md')),
  mediaLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('project-media.json')),
  caseLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='mar-salada.html'),
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
}));

const localAssets=[
  '/assets/visuals/sound-club-zone-plan.svg',
  '/assets/visuals/sound-club-audio-plan.svg',
  '/assets/visuals/sound-club-control-plan.svg',
  '/assets/visuals/sound-club-system.svg',
  '/assets/visuals/mar-salada-suspension-detail.svg',
  '/assets/visuals/mar-salada-dj-booth-plan.svg',
  '/assets/css/mar-salada-case.css',
  '/assets/js/mar-salada-case.js',
  '/xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json'
];
for(const asset of localAssets){
  const r=await page.request.get(base+asset);
  if(!r.ok())errors.push(asset+' HTTP '+r.status());
}
await page.screenshot({path:out+'/react-visuals-desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.reload({waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__SOUND_CLUB_VISUALS__?.details===2,{timeout:30000});
const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
  boards:window.__SOUND_CLUB_VISUALS__?.boards,
  plans:window.__SOUND_CLUB_VISUALS__?.plans,
  details:window.__SOUND_CLUB_VISUALS__?.details,
  videos:window.__SOUND_CLUB_VISUALS__?.videos
}));
await page.screenshot({path:out+'/react-visuals-mobile.png',fullPage:true});

const casePage=await browser.newPage({viewport:{width:1440,height:1000}});
const caseErrors=[];
casePage.on('pageerror',e=>caseErrors.push(String(e)));
casePage.on('console',m=>{if(m.type()==='error')caseErrors.push('console: '+m.text())});
const caseRes=await casePage.goto(base+'/projects/mar-salada.html',{waitUntil:'domcontentloaded',timeout:45000});
if(!caseRes?.ok())caseErrors.push('public case HTTP '+caseRes?.status());
await casePage.waitForFunction(()=>window.__MAR_SALADA_CASE__?.storyScenes===10,{timeout:30000});
const publicState=await casePage.evaluate(()=>({
  contract:window.__MAR_SALADA_CASE__||null,
  storySteps:document.querySelectorAll('.ms-story-step').length,
  storyRoot:!!document.querySelector('.ms-story-shell'),
  videoCount:document.querySelectorAll('video').length,
  reactLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='sound-club-visuals.html'),
  suspension:[...document.querySelectorAll('img')].some(x=>x.src.includes('mar-salada-suspension-detail.svg')),
  djPlan:[...document.querySelectorAll('img')].some(x=>x.src.includes('mar-salada-dj-booth-plan.svg')),
  privateMediaText:document.body.textContent.includes('PRIVATE_REFERENCE_ONLY'),
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
}));
await casePage.screenshot({path:out+'/mar-salada-case-desktop.png',fullPage:true});

await casePage.setViewportSize({width:390,height:844});
await casePage.reload({waitUntil:'domcontentloaded',timeout:45000});
await casePage.waitForFunction(()=>window.__MAR_SALADA_CASE__?.storyScenes===10,{timeout:30000});
const caseMobile=await casePage.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,storyScenes:window.__MAR_SALADA_CASE__?.storyScenes}));
await casePage.screenshot({path:out+'/mar-salada-case-mobile.png',fullPage:true});

const legacy=await casePage.request.get(base+'/projects/sound-club-palma.html');
const legacyText=await legacy.text();
await browser.close();

const failures=[];
if(state.contract?.schemaVersion!==2)failures.push('visual contract schema mismatch');
if(state.contract?.total!==10)failures.push('expected 10 media registry items');
if(state.contract?.boards!==4)failures.push('expected 4 generated boards');
if(state.contract?.plans!==3)failures.push('expected 3 plans');
if(state.contract?.details!==2)failures.push('expected 2 details');
if(state.contract?.videos!==0)failures.push('expected zero public videos');
if(state.assets!==10)failures.push('expected 10 React asset cards');
if(state.filters!==5)failures.push('expected 5 filters');
if(!state.viewer||!state.warning||!state.skillLink||!state.mediaLink||!state.caseLink)failures.push('React Visuals contract links/viewer missing');
if(state.overflow||mobile.overflow)failures.push('React Visuals horizontal overflow');
if(mobile.boards!==4||mobile.plans!==3||mobile.details!==2||mobile.videos!==0)failures.push('mobile media counts mismatch');
if(publicState.contract?.projectId!=='MAR_SALADA_CDM'||publicState.contract?.storyScenes!==10)failures.push('MAR SALADA case contract mismatch');
if(publicState.storySteps!==10||!publicState.storyRoot)failures.push('MAR SALADA story structure mismatch');
if(publicState.videoCount!==0)failures.push('public case must not expose source video');
if(!publicState.reactLink||!publicState.suspension||!publicState.djPlan)failures.push('MAR SALADA links/technical diagrams missing');
if(publicState.overflow||caseMobile.overflow)failures.push('MAR SALADA case horizontal overflow');
if(!legacy.ok()||!legacyText.includes('mar-salada.html'))failures.push('legacy route redirect missing');
if(errors.length)failures.push('visual browser/request errors: '+errors.join(' | '));
if(caseErrors.length)failures.push('case browser errors: '+caseErrors.join(' | '));

if(failures.length){
  console.error(JSON.stringify({state,mobile,publicState,caseMobile,requestFailures,failures},null,2));
  process.exit(2);
}
console.log('MAR SALADA REACT CASE QA PASS',JSON.stringify({visuals:state.contract,mobile,publicState,caseMobile,requestFailures}));
