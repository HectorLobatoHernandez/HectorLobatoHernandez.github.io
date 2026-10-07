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

await page.waitForFunction(()=>window.__SOUND_CLUB_VISUALS__?.total===6,{timeout:30000});
const state=await page.evaluate(()=>({
  contract:window.__SOUND_CLUB_VISUALS__,
  assets:document.querySelectorAll('.rv-asset').length,
  filters:document.querySelectorAll('.rv-filter').length,
  viewer:!!document.querySelector('.rv-viewer'),
  warning:document.body.textContent.includes('NOT AS-BUILT'),
  skillLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('skills/sound-club-project/SKILL.md')),
  mediaLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('project-media.json')),
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
}));

const localAssets=[
  '/assets/visuals/sound-club-zone-plan.svg',
  '/assets/visuals/sound-club-audio-plan.svg',
  '/assets/visuals/sound-club-control-plan.svg',
  '/assets/visuals/sound-club-system.svg',
  '/assets/css/sound-club-react-visuals.css',
  '/assets/js/sound-club-react-visuals.js'
];
for(const asset of localAssets){
  const r=await page.request.get(base+asset);
  if(!r.ok())errors.push(asset+' HTTP '+r.status());
}
await page.screenshot({path:out+'/react-visuals-desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.reload({waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__SOUND_CLUB_VISUALS__?.plans===3,{timeout:30000});
const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
  plans:window.__SOUND_CLUB_VISUALS__?.plans,
  videos:window.__SOUND_CLUB_VISUALS__?.videos
}));
await page.screenshot({path:out+'/react-visuals-mobile.png',fullPage:true});

const casePage=await browser.newPage({viewport:{width:1440,height:1000}});
const caseErrors=[];
casePage.on('pageerror',e=>caseErrors.push(String(e)));
const caseRes=await casePage.goto(base+'/projects/sound-club-palma.html',{waitUntil:'domcontentloaded',timeout:45000});
if(!caseRes?.ok())caseErrors.push('public case HTTP '+caseRes?.status());
const publicState=await casePage.evaluate(()=>({
  planImages:[...document.querySelectorAll('img')].filter(x=>x.src.includes('sound-club-')&&x.src.includes('-plan.svg')).length,
  videoCount:document.querySelectorAll('video').length,
  controls:document.querySelector('video')?.controls===true,
  autoplay:document.querySelector('video')?.autoplay===true,
  preload:document.querySelector('video')?.preload,
  videoSrc:document.querySelector('video')?.getAttribute('src')||'',
  reactLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='sound-club-visuals.html')
}));
await casePage.screenshot({path:out+'/public-case.png',fullPage:true});
await browser.close();

const failures=[];
if(state.contract?.schemaVersion!==1)failures.push('visual contract schema mismatch');
if(state.contract?.total!==6)failures.push('expected 6 media registry items');
if(state.contract?.plans!==3)failures.push('expected 3 project plans');
if(state.contract?.videos!==1)failures.push('expected 1 documented video');
if(state.assets!==6)failures.push('expected 6 React asset cards');
if(state.filters!==5)failures.push('expected 5 filters');
if(!state.viewer)failures.push('viewer missing');
if(!state.warning)failures.push('NOT AS-BUILT warning missing');
if(!state.skillLink)failures.push('project skill link missing');
if(!state.mediaLink)failures.push('media registry link missing');
if(state.overflow||mobile.overflow)failures.push('horizontal overflow');
if(publicState.planImages!==3)failures.push('public case must embed 3 plan SVGs');
if(publicState.videoCount<1)failures.push('public case MP4 missing');
if(!publicState.controls)failures.push('public MP4 controls missing');
if(publicState.autoplay)failures.push('public MP4 must not autoplay');
if(publicState.preload!=='metadata')failures.push('public MP4 preload must be metadata');
if(!publicState.videoSrc.includes('0b5631c4-2cec-44af-b6fe-2f1d48cf5409'))failures.push('documented MP4 media id mismatch');
if(!publicState.reactLink)failures.push('React Visuals link missing from public case');
if(errors.length)failures.push('browser/request errors: '+errors.join(' | '));
if(caseErrors.length)failures.push('public-case errors: '+caseErrors.join(' | '));

if(failures.length){
  console.error(JSON.stringify({state,mobile,publicState,requestFailures,failures},null,2));
  process.exit(2);
}
console.log('SOUND CLUB REACT VISUALS V2 QA PASS',JSON.stringify({state:state.contract,mobile,publicState,requestFailures}));
