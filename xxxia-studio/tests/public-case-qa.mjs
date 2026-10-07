import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.BASE_URL||'http://127.0.0.1:4197';
const out='.qa/xxxia-public';
await fs.mkdir(out,{recursive:true});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});

const res=await page.goto(base+'/projects/xxxia-studio.html',{waitUntil:'domcontentloaded',timeout:45000});
if(!res?.ok())throw new Error('XXXIA public page HTTP '+res?.status());
await page.waitForFunction(()=>window.__XXXIA_PUBLIC_CASE__?.publicAssets===10,{timeout:30000});

const desktop=await page.evaluate(()=>({
  contract:window.__XXXIA_PUBLIC_CASE__,
  capabilityCards:document.querySelectorAll('.xx-cap').length,
  galleryCards:document.querySelectorAll('.xx-bounce-card').length,
  timeline:document.querySelectorAll('.xx-timeline article').length,
  videoCount:document.querySelectorAll('video').length,
  flow:[...document.querySelectorAll('img')].some(x=>x.src.includes('xxxia-production-flow.svg')),
  provenance:[...document.querySelectorAll('img')].some(x=>x.src.includes('xxxia-provenance.svg')),
  marSaladaLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='mar-salada.html'),
  consoleLink:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('../xxxia-studio/')),
  privateLeak:/C:\\Users|OMNIROUTE_KEY|api[_ -]?key|password/i.test(document.body.innerText),
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
}));
await page.screenshot({path:out+'/desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.reload({waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__XXXIA_PUBLIC_CASE__?.motionSegments===10,{timeout:30000});
const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
  capabilities:document.querySelectorAll('.xx-cap').length,
  gallery:document.querySelectorAll('.xx-bounce-card').length,
  timeline:document.querySelectorAll('.xx-timeline article').length
}));
await page.screenshot({path:out+'/mobile.png',fullPage:true});
await browser.close();

const failures=[];
if(desktop.contract?.studioId!=='XXXIA_STUDIO')failures.push('studio ID mismatch');
if(desktop.contract?.publicAssets!==10||desktop.contract?.boards!==4||desktop.contract?.plans!==3||desktop.contract?.details!==2||desktop.contract?.systems!==1)failures.push('public media inventory mismatch');
if(desktop.contract?.capabilities!==6||desktop.capabilityCards!==6)failures.push('capabilities mismatch');
if(desktop.contract?.gallery!==5||desktop.galleryCards!==5)failures.push('gallery mismatch');
if(desktop.contract?.motionSegments!==10||desktop.timeline!==10)failures.push('motion timeline mismatch');
if(desktop.contract?.motionStatus!=='PENDING_VERIFIED_GEOMETRY')failures.push('SC08 should remain pending verified geometry');
if(desktop.videoCount!==0)failures.push('pending public studio must not expose motion video');
if(!desktop.flow||!desktop.provenance||!desktop.marSaladaLink)failures.push('public studio visuals/selected case link missing');
if(desktop.consoleLink)failures.push('production console leaked into public studio page');
if(desktop.privateLeak)failures.push('private runtime details leaked');
if(desktop.overflow||mobile.overflow)failures.push('horizontal overflow');
if(mobile.capabilities!==6||mobile.gallery!==5||mobile.timeline!==10)failures.push('mobile inventory mismatch');
if(errors.length)failures.push('browser errors: '+errors.join(' | '));

if(failures.length){
  console.error(JSON.stringify({desktop,mobile,errors,failures},null,2));
  process.exit(2);
}
console.log('XXXIA PUBLIC CASE QA PASS',JSON.stringify({desktop,mobile}));
