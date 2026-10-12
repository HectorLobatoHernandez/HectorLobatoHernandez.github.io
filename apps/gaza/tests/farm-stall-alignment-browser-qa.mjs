import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const publicBase=process.env.GAZA_PUBLIC_BASE||'',base=(publicBase||'http://127.0.0.1:4173').replace(/\/$/,''),patch='bovine-cubicles-20261012-v1';
const out=path.resolve('.qa/stall-alignment',publicBase?'public':'local');await fs.mkdir(out,{recursive:true});
if(publicBase){let ready=false;for(let i=0;i<40;i++){try{const r=await fetch(base+'/runtime/farm/life/herd-model.mjs?verify='+Date.now(),{signal:AbortSignal.timeout(10000)});if(r.ok&&(await r.text()).includes(patch)){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,3000))}assert(ready,'Published alignment correction not yet available')}
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']}),checks=[],errors=[];let page;
try{
 const context=await browser.newContext({viewport:{width:1600,height:1100}});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/farm-labs.html?mode=farm&demo=company&qa=1&verify='+patch,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__GAZA_FARM_DETAIL__?.life?.animalsRendered===360,{},{timeout:90000});
 const before=await page.evaluate(()=>JSON.stringify(window.__GAZA_PROCESS_STATE__));
 const alignment=await page.evaluate(async()=>{const {placements,INDOOR_ALIGNMENT}=await import('./runtime/farm/life/herd-model.mjs');const {BUILDINGS,frame}=await import('./runtime/farm/site.mjs');const f=frame(BUILDINGS.find(b=>b.id==='bovine')),slots=placements('BOVINE').filter(p=>p.zone==='bovine');return {patch:INDOOR_ALIGNMENT,count:slots.length,failures:slots.filter(p=>{const dx=p.position[0]-f.x,dz=p.position[1]-f.z,x=Math.cos(f.yaw)*dx-Math.sin(f.yaw)*dz,z=Math.sin(f.yaw)*dx+Math.cos(f.yaw)*dz,a=p.yaw-f.yaw;return Math.abs(Math.cos(a))>1e-6||-Math.sin(a)*z>=0||Math.abs(x-(-f.w/2+3+p.stallIndex*3.2))>1e-6}).length};});
 assert.equal(alignment.patch,patch);assert.equal(alignment.count,46);assert.equal(alignment.failures,0);checks.push('loaded-app-uses-corrected-inward-heading-and-bed-centers');
 await page.locator('#steps button').nth(1).click();await page.locator('#farmEnter').click();await page.locator('#farmIsolate').click();
 await page.waitForFunction(()=>window.__GAZA_FARM_DETAIL__.station===1&&window.__GAZA_FARM_DETAIL__.isolated&&window.__GAZA_FARM_DETAIL__.cutaway);
 await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'01-two-cattle-rows-aligned.png')});
 await page.locator('#lifeCow').click();await page.waitForFunction(()=>window.__GAZA_FARM_DETAIL__.camera==='animal');await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'02-cow-centered-in-cubicle.png')});
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__GAZA_PROCESS_STATE__)),before);checks.push('inspection-preserves-ledger-and-census');
 await page.locator('#farmIsolate').click();await page.locator('#farmPlan').click();await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'03-farm-plan-preserved.png')});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push('webgl-selection-and-mobile-regression');
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:true,patch,publicBase:publicBase||null,checks,alignment,errors},null,2));console.log('FARM STALL ALIGNMENT QA PASS',checks);
}catch(e){if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:false,patch,publicBase:publicBase||null,checks,errors,error:String(e)},null,2));throw e}finally{await browser.close()}
