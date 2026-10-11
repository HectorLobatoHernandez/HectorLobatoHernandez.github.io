import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),threeRoot=path.dirname(path.dirname(require.resolve('three')));
const base=process.env.GAZA_URL||'http://127.0.0.1:4173',out=path.resolve('.qa/process-flow');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});const errors=[],checks=[];
try{
 const ctx=await browser.newContext({viewport:{width:1500,height:1000}});
 await ctx.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async r=>{const rel=r.request().url().split('/three@0.180.0/')[1];if(!rel||rel.includes('..'))return r.abort();await r.fulfill({body:await fs.readFile(path.join(threeRoot,rel)),contentType:'text/javascript'})});
 const pages={};for(const [name,url]of Object.entries({workflow:'/operations-thread.html?qa=1',farm:'/farm-labs.html?mode=farm&qa=1',labs:'/farm-labs.html?mode=labs&qa=1',site:'/site-real-preview.html?qa=1',plant:'/plant-3d.html?qa=1&freeze=1'})){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(name+': '+e.message));const r=await p.goto(base+url,{waitUntil:'domcontentloaded'});assert(r.ok());pages[name]=p;}
 const {workflow:w,farm:f,labs:l,site,plant}=pages;
 await w.locator('[data-action="init"]').click();await w.locator('.rail span').first().waitFor();
 const id=await w.locator('.dpr').getAttribute('data-batch-id');await l.waitForFunction(id=>document.querySelector('.dpr')?.dataset.batchId===id,id);await f.waitForFunction(id=>document.querySelector('.dpr')?.dataset.batchId===id,id);
 await site.waitForFunction(()=>window.__GAZA_PROCESS_BINDING__?.active);await plant.waitForFunction(()=>window.__GAZA_PROCESS_BINDING__?.active);
 await l.waitForFunction(()=>window.__GAZA_RENDER_STATS__?.calls>0);await f.waitForFunction(()=>window.__GAZA_RENDER_STATS__?.calls>0);
 checks.push('all-five-surfaces-same-session-and-WebGL');
 const command=async(a,p=w)=>p.evaluate(async action=>(await import('./runtime/dairy-process-store.mjs')).sendProcess(action),a);
 const advance=async target=>{await command({type:'PLAY'});await command({type:'AUTO',value:true});await w.evaluate(async target=>{const store=await import('./runtime/dairy-process-store.mjs');for(let i=0;i<400&&store.getProcess().batches[store.getProcess().active].stage<target;i++)await store.sendProcess({type:'TICK',seconds:1});await store.sendProcess({type:'PAUSE'});},target);assert.equal(await w.locator('.dpr').getAttribute('data-stage'),String(target));};
 await w.locator('[data-action="play"]').click();await w.locator('[data-action="auto"]').click();
 await f.waitForFunction(()=>window.__GAZA_PROCESS_STATE__?.clock.seconds>0);const t=await w.evaluate(()=>window.__GAZA_PROCESS_STATE__.clock.seconds);await w.waitForTimeout(1100);const t2=await w.evaluate(()=>window.__GAZA_PROCESS_STATE__.clock.seconds);assert(t2-t<2.5,'Opening five tabs must not multiply the clock');checks.push('shared-clock-no-tab-multiplication');
 await advance(5);await l.waitForFunction(()=>document.querySelector('.dpr').dataset.stage==='5');
 await l.locator('#steps button').nth(2).click();assert.equal(await w.locator('.dpr').getAttribute('data-stage'),'5');checks.push('inspection-does-not-advance-material');
 await l.locator('[data-action="custody"][data-accept="true"]').click();
 async function assay(key,phase='raw'){await l.locator(`[data-action="test"][data-method="${key}"]:not([data-outcome])`).click();await command({type:'PLAY'});for(let i=0;i<6;i++)await command({type:'TICK',seconds:10});await command({type:'PAUSE'});await l.waitForFunction(({key,phase,id})=>window.__GAZA_PROCESS_STATE__.samples[id+'-S-'+phase].attempts.filter(a=>a.method===key).at(-1).status==='PASS',{key,phase,id});}
 await assay('temperature');await assay('inhibitors');
 await l.locator('[data-action="approve"][data-gate="receipt"]').click();await advance(7);assert(await l.locator('[data-action="approve"][data-gate="manufacture"]').isDisabled());checks.push('receipt-is-not-manufacture-approval');
 await assay('composition');await l.locator('[data-action="approve"][data-gate="manufacture"]').click();await advance(10);await l.waitForFunction(()=>document.querySelectorAll('[data-action="custody"][data-accept="true"]').length===1);await l.locator('[data-action="custody"][data-accept="true"]').click();
 await l.locator('[data-action="test"][data-method="microbiology"][data-outcome="FAIL"]').click();await command({type:'PLAY'});for(let i=0;i<5;i++)await command({type:'TICK',seconds:10});await command({type:'PAUSE'});
 await l.waitForFunction(()=>document.querySelector('.dpr').dataset.held==='true');await site.waitForFunction(()=>window.__GAZA_SITE_REAL__?.ledger?.held);const held=await site.evaluate(()=>window.__GAZA_SITE_REAL__.actors[0].position);await site.waitForTimeout(600);assert.deepEqual(await site.evaluate(()=>window.__GAZA_SITE_REAL__.actors[0].position),held);checks.push('adverse-result-holds-line-and-3D-tanker');
 await l.screenshot({path:path.join(out,'01-lab-hold.png'),fullPage:true});
 await l.locator('[aria-label="Nota documentada"]').fill('Investigación y repetición documentadas en demo');await assay('microbiology','finished');await assay('packaging','finished');
 await l.locator('.dpr details summary').click();await l.locator('[data-action="resolve"]').click();await l.waitForFunction(()=>document.querySelector('.dpr').dataset.held==='false');
 for(const gate of ['receipt','manufacture','dispatch'])await l.locator(`[data-action="approve"][data-gate="${gate}"]`).click();
 await advance(13);const final=await w.evaluate(()=>window.__GAZA_PROCESS_STATE__);assert.equal(final.batches[id].inventory.dispatchedPallets,16);assert.equal(final.batches[id].inventory.packedL,120);assert.equal(final.batches[id].lotIds.length,5);assert.equal(final.samples[id+'-S-finished'].attempts.filter(a=>a.method==='microbiology').length,2);checks.push('retest-keeps-history-and-reapproval-required');
 assert.equal(await w.evaluate(()=>localStorage.getItem('gaza:quality-training:v1')),null);checks.push('no-second-authoritative-training-lot');
 await w.screenshot({path:path.join(out,'02-workflow-delivery.png'),fullPage:true});await f.screenshot({path:path.join(out,'03-farm-process.png'),fullPage:true});await site.screenshot({path:path.join(out,'04-site-process.png')});
 await l.setViewportSize({width:390,height:844});await l.waitForTimeout(200);assert(await l.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await l.screenshot({path:path.join(out,'05-lab-mobile.png'),fullPage:true});checks.push('mobile-no-overflow');
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:true,checks,errors,finalStage:13},null,2));console.log('DAIRY PROCESS BROWSER QA PASS',checks);
}catch(error){await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:false,checks,errors,error:String(error)},null,2));throw error}finally{await browser.close()}
