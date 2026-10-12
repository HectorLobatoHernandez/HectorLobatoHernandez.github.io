import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {RELEASE} from '../runtime/demo/session.mjs';
const remote=process.env.GAZA_PUBLIC_ORIGIN||'',base=(remote||'http://127.0.0.1:4173').replace(/\/$/,''),out=path.resolve('.qa/selfhost-demo/'+(remote?'public':'local'));
await fs.mkdir(out,{recursive:true});
if(remote){let ready=false;for(let i=0;i<30;i++){try{const r=await fetch(base+'/apps/gaza/runtime/demo/import-map.js?verify='+Date.now(),{signal:AbortSignal.timeout(10000)});const s=await r.text();if(r.ok&&s.includes(RELEASE)&&s.includes('SAME_ORIGIN_R180')){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,4000))}assert(ready,'Published R2 engine not available; do not claim deployment verified')}
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']}),checks=[],errors=[],cdnRequests=[],failedLocal=[],engineResponses=[];let page;
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('https://cdn.jsdelivr.net/**',r=>{cdnRequests.push(r.request().url());return r.abort()});
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>{if(r.url().startsWith(base)&&/\.(m?js)(\?|$)/.test(r.url()))failedLocal.push({url:r.url(),error:r.failure()?.errorText})});
 page.on('response',r=>{if(r.url().includes('/vendor/three-r180/'))engineResponses.push({url:r.url(),status:r.status()})});
 await page.goto(base+'/apps/gaza/operations-thread.html?qa=1');await page.locator('[data-process-panel] #start').click();await page.waitForFunction(()=>window.__GAZA_PROCESS_STATE__?.schemaVersion===2);
 const working=await page.evaluate(()=>localStorage.getItem('gaza:process-ledger:v2'));
 await page.goto(base+'/start/gaza.html');assert.equal(await page.locator('#company-demo-entry').getAttribute('href'),'../apps/gaza/demostracion.html');
 await page.locator('#company-demo-entry').click();await page.waitForURL('**/mission-control.html?**');
 async function frameFor(part){for(let i=0;i<200;i++){const f=page.frames().find(f=>f.url().includes(part));if(f)return f;await page.waitForTimeout(50)}throw Error('Frame not found: '+part)}
 const farm=await frameFor('mode=farm');
 await farm.waitForFunction(r=>window.__GAZA_FARM_DETAIL__?.release===r&&window.__GAZA_FARM_DETAIL__?.life?.animalsRendered===360&&window.__GAZA_FARM_DETAIL__?.screenPopulation?.inFrame>=20,RELEASE,{timeout:90000});
 assert.equal(await farm.evaluate(()=>window.__GAZA_ENGINE_DELIVERY__),'SAME_ORIGIN_R180');
 assert.equal(await farm.evaluate(async()=>{const a=await import('three'),b=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');return a===b&&a.REVISION==='180'}),true);
 checks.push('dossier-real-primary-link-r2-360-herd-symbols-in-frame-with-cdn-blocked');
 await page.screenshot({path:path.join(out,'01-dossier-to-herds.png')});
 const start=await farm.evaluate(()=>window.__GAZA_FARM_DETAIL__.simSeconds);
 await farm.waitForFunction(t=>window.__GAZA_FARM_DETAIL__.simSeconds>t,start,{timeout:15000});checks.push('public-demo-clock-progresses-without-manual-console-seeding');
 await page.locator('#companyDemoDock [data-focus="cow"]').click();await farm.waitForFunction(()=>window.__GAZA_FARM_DETAIL__.camera==='animal');await page.screenshot({path:path.join(out,'02-visible-animal.png')});
 await page.locator('#companyDemoDock [data-demo-view="labs"]').click();const labs=await frameFor('mode=labs');
 await labs.waitForFunction(()=>window.__GAZA_LAB_DETAIL__?.rooms===7&&window.__GAZA_LAB_DETAIL__?.render.calls>0,{},{timeout:90000});assert.equal(await labs.evaluate(()=>window.__GAZA_ENGINE_DELIVERY__),'SAME_ORIGIN_R180');checks.push('laboratory-renders-from-same-origin');
 await page.locator('#companyDemoDock [data-demo-view="site"]').click();const site=await frameFor('site-real-preview.html');
 await site.waitForFunction(()=>window.__GAZA_SITE_REAL__?.render?.calls>0&&window.__GAZA_SITE_REAL__?.processScope==='company-demo',{},{timeout:90000});assert.equal(await site.evaluate(()=>window.__GAZA_ENGINE_DELIVERY__),'SAME_ORIGIN_R180');checks.push('plant-renders-from-same-origin-in-demo-namespace');
 await page.screenshot({path:path.join(out,'03-linked-plant.png')});
 assert.equal(await page.evaluate(()=>localStorage.getItem('gaza:process-ledger:v2')),working);checks.push('working-ledger-preserved-byte-for-byte');
 assert(engineResponses.some(r=>r.url().includes('three.module.min.js')));assert(engineResponses.some(r=>r.url().includes('three.core.min.js')));assert(engineResponses.some(r=>r.url().includes('OrbitControls.js')));
 assert(engineResponses.every(r=>r.status>=200&&r.status<400));assert.deepEqual(cdnRequests,[]);assert.deepEqual(errors,[]);assert.deepEqual(failedLocal,[]);checks.push('no-cdn-requests-no-page-errors-no-failed-local-modules');
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:true,publicOrigin:remote||null,release:RELEASE,checks,errors,cdnRequests,failedLocal,engineResponses},null,2));console.log('SELFHOST DEMO QA PASS',checks);
}catch(e){if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:false,publicOrigin:remote||null,release:RELEASE,checks,errors,cdnRequests,failedLocal,engineResponses,error:String(e)},null,2));throw e}finally{await browser.close()}
