// Actual published Pages URL, no CDN interception or fabricated WebGL data.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {RELEASE} from '../runtime/demo/session.mjs';
const base='https://hectorlobatohernandez.github.io/apps/gaza',out=path.resolve('.qa/company-public');await fs.mkdir(out,{recursive:true});
let detected=false;
for(let i=0;i<24;i++){
 try{const r=await fetch(base+'/runtime/demo/session.mjs?publish='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(15000)});detected=r.ok&&(await r.text()).includes(RELEASE);if(detected)break}catch{}
 await new Promise(r=>setTimeout(r,10000));
}
assert(detected,'Current release not yet served by GitHub Pages');
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']}),errors=[];let p;
try{
 p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));
 const started=Date.now();await p.goto(base+'/demostracion.html?release='+RELEASE,{waitUntil:'domcontentloaded'});await p.waitForURL('**/mission-control.html?**');
 let f;for(let i=0;i<200;i++){f=p.frames().find(x=>x.url().includes('mode=farm'));if(f)break;await p.waitForTimeout(100)}assert(f,'Farm iframe not opened');
 await f.waitForFunction(r=>window.__GAZA_FARM_DETAIL__?.release===r&&window.__GAZA_FARM_DETAIL__.life.animalsRendered===360,RELEASE,{timeout:120000});
 await f.waitForFunction(()=>window.__GAZA_FARM_DETAIL__.screenPopulation.inFrame>=20,{},{timeout:30000});
 const before=await f.evaluate(()=>window.__GAZA_FARM_DETAIL__.simSeconds);await f.waitForFunction(t=>window.__GAZA_FARM_DETAIL__.simSeconds>t+.2,before,{timeout:30000});
 assert.equal(await p.evaluate(()=>localStorage.getItem('gaza:process-ledger:v2')),null);
 await p.screenshot({path:path.join(out,'live-published-demo.png')});const live=await f.evaluate(()=>({release:window.__GAZA_FARM_DETAIL__.release,animals:window.__GAZA_FARM_DETAIL__.life.animalsRendered,camera:window.__GAZA_FARM_DETAIL__.camera,inFrame:window.__GAZA_FARM_DETAIL__.screenPopulation.inFrame,seconds:window.__GAZA_FARM_DETAIL__.simSeconds}));
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:true,url:p.url(),frameURL:f.url(),elapsedMs:Date.now()-started,cdnIntercepted:false,live,errors},null,2));
}catch(e){if(p)await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:false,error:String(e),errors},null,2));throw e}finally{await browser.close()}
