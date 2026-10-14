import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=(process.env.GAZA_URL||'http://127.0.0.1:4173').replace(/\/$/,''),out=path.resolve('.qa/presentation-v2');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']}),errors=[];let page;
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('https://timeapi.io/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({year:2026,month:10,day:14,hour:21,minute:53,seconds:7,milliSeconds:0})}));
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/mission-control.html?demo=company&qa=1&view=farm',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__GAZA_SPAIN_TIME__?.display==='21:53:07',{timeout:30000});
 async function frameFor(part){for(let i=0;i<300;i++){const f=page.frames().find(f=>f.url().includes(part));if(f)return f;await page.waitForTimeout(50)}throw Error('Missing frame '+part)}
 const farm=await frameFor('mode=farm');assert(farm);await farm.waitForFunction(()=>window.__GAZA_FARM_DETAIL__?.render?.calls>0,{},{timeout:90000});
 await page.locator('#quickInterior').click();await farm.waitForFunction(()=>document.getElementById('farmCutaway')?.getAttribute('aria-pressed')==='true');
 await page.locator('#quickNight').click();await farm.waitForFunction(()=>window.__GAZA_LIVING_FARM__?.environment?.phase==='Noche');
 await farm.waitForFunction(()=>window.__GAZA_LIVING_FARM__?.heritageLighting>=4&&window.__GAZA_LIVING_FARM__?.vehicleLights>=2);
 await page.screenshot({path:path.join(out,'01-desktop-farm-night-interior.png')});
 const before=await page.evaluate(()=>JSON.stringify(window.__GAZA_PROCESS_STATE__?.lots));
 await page.locator('#livingDetails').click();await page.locator('#livingSyncSpain').click();await page.waitForFunction(()=>window.__GAZA_PROCESS_STATE__?.config?.living?.startMinute!==480);
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__GAZA_PROCESS_STATE__?.lots)),before);
 await page.locator('#livingClose').click();
 await page.locator('.tabs [data-view="labs"]').click();const labs=await frameFor('mode=labs');await labs.waitForFunction(()=>window.__GAZA_LIVING_LABS__?.brandingDetails>=3&&window.__GAZA_LIVING_LABS__?.actualLights>0,{},{timeout:90000});await page.screenshot({path:path.join(out,'02-labs-branded-night.png')});
 await page.locator('.tabs [data-view="site"]').click();const site=await frameFor('site-real-preview');await site.waitForFunction(()=>window.__GAZA_LIVING_SITE__?.vehicleLights>=4&&window.__GAZA_LIVING_SITE__?.actualLights>0,{},{timeout:90000});await page.screenshot({path:path.join(out,'03-plant-night-headlights.png')});
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/mission-control.html?demo=company&qa=1&ui=mobile&view=farm',{waitUntil:'domcontentloaded'});const mf=await frameFor('mode=farm');await mf.waitForFunction(()=>window.__GAZA_MOBILE_SCENE__?.active&&window.__GAZA_FARM_DETAIL__?.render?.calls>0,{},{timeout:90000});const roof=mf.locator('#touchRoof');const rb=await roof.boundingBox();assert(rb&&rb.width>=43&&rb.height>=43);await roof.click();await mf.waitForFunction(()=>document.getElementById('farmCutaway')?.getAttribute('aria-pressed')==='true');assert((await mf.locator('canvas').boundingBox()).height>844*.65);await page.screenshot({path:path.join(out,'04-mobile-interior-button.png')});
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:true,checks:['Spain network clock','desktop interior/night quick controls','castle and vehicle lighting','SIM alignment preserves lots','lab branding','plant headlights','mobile permanent interior button'],errors},null,2));
 console.log('PRESENTATION V2 BROWSER QA PASS');
}catch(e){if(page)await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:false,error:String(e),errors},null,2));throw e}finally{await browser.close()}
