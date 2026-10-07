import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.BASE_URL||'http://127.0.0.1:4196';
const out='.qa/rhb-studio';
await fs.mkdir(out,{recursive:true});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});

const res=await page.goto(base+'/projects/rhb-studio.html',{waitUntil:'domcontentloaded',timeout:45000});
if(!res?.ok())throw new Error('RHB page HTTP '+res?.status());
await page.waitForFunction(()=>window.__RHB_STUDIO_CASE__?.modules===6,{timeout:30000});

const desktop=await page.evaluate(()=>({
  contract:window.__RHB_STUDIO_CASE__,
  moduleCards:document.querySelectorAll('.rhb-card').length,
  modelOptions:document.querySelectorAll('.rhb-model-option').length,
  bounceCards:document.querySelectorAll('.rhb-bounce-card').length,
  logoMarks:document.querySelectorAll('.rhb-logo-track span').length,
  monogram:[...document.querySelectorAll('img')].some(x=>x.src.includes('rhb-monogram.svg')),
  workflow:[...document.querySelectorAll('img')].some(x=>x.src.includes('rhb-studio-workflow.svg')),
  routing:[...document.querySelectorAll('img')].some(x=>x.src.includes('rhb-agent-routing.svg')),
  privateLeak:/C:\\Users|OMNIROUTE_KEY|api[_ -]?key|password|20128|18789|20800/i.test(document.body.innerText),
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
}));
await page.screenshot({path:out+'/desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.reload({waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__RHB_STUDIO_CASE__?.models===3,{timeout:30000});
const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
  moduleCards:document.querySelectorAll('.rhb-card').length,
  modelOptions:document.querySelectorAll('.rhb-model-option').length,
  bounceCards:document.querySelectorAll('.rhb-bounce-card').length
}));
await page.screenshot({path:out+'/mobile.png',fullPage:true});
await browser.close();

const failures=[];
if(desktop.contract?.projectId!=='RHB_STUDIO')failures.push('projectId mismatch');
if(desktop.contract?.publicShowcase!==true)failures.push('public showcase boundary missing');
if(desktop.contract?.modules!==6||desktop.moduleCards!==6)failures.push('module inventory mismatch');
if(desktop.contract?.models!==3||desktop.modelOptions!==3||desktop.contract?.modelReady!==0)failures.push('model viewer fallback mismatch');
if(desktop.contract?.referenceProjects!==2||desktop.bounceCards!==4)failures.push('reference/gallery mismatch');
if(desktop.logoMarks<16)failures.push('logo loop missing');
if(!desktop.monogram||!desktop.workflow||!desktop.routing)failures.push('RHB visual assets missing');
if(desktop.privateLeak)failures.push('private runtime details leaked to public case');
if(desktop.overflow||mobile.overflow)failures.push('horizontal overflow');
if(mobile.moduleCards!==6||mobile.modelOptions!==3||mobile.bounceCards!==4)failures.push('mobile inventory mismatch');
if(errors.length)failures.push('browser errors: '+errors.join(' | '));

if(failures.length){
  console.error(JSON.stringify({desktop,mobile,errors,failures},null,2));
  process.exit(2);
}
console.log('RHB STUDIO QA PASS',JSON.stringify({desktop,mobile}));
