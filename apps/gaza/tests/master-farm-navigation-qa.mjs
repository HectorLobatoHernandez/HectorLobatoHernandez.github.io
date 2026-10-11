import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),threeRoot=path.dirname(path.dirname(require.resolve('three')));
const base=process.env.GAZA_URL||'http://127.0.0.1:4173',browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async r=>{const rel=r.request().url().split('/three@0.180.0/')[1];if(!rel||rel.includes('..'))return r.abort();return r.fulfill({body:await fs.readFile(path.join(threeRoot,rel)),contentType:'text/javascript'})});
 assert((await page.goto(base+'/mission-control.html?view=plant&qa=1')).ok());
 const plant=page.frameLocator('iframe[title="GAZA Plant 3D"]');
 await plant.locator('#enterMasterFarm').click();await page.locator('[data-pane="farm"].on').waitFor();
 const farm=page.frameLocator('iframe[title*="GAZA Farm 3D"]');
 await farm.locator('[data-process-panel] #start').click();await farm.locator('#steps button').nth(2).click();assert.equal(await farm.locator('#steps button').count(),7);
 await page.locator('[data-view="plant"]').click();await plant.locator('#enterQualityLab').click();
 await page.locator('[data-pane="labs"].on').waitFor();const labs=page.frameLocator('iframe[title*="GAZA Quality Labs"]');
 await labs.locator('#steps button').nth(2).click();assert.match(await labs.locator('#stationProcedure').textContent(),/aséptica/);
 await page.locator('[data-view="workflow"]').click();await page.locator('[data-pane="workflow"].on').waitFor();
 const workflow=page.frameLocator('iframe[title="GAZA End-to-End Workflow"]');
 await workflow.locator('[data-process-panel] [data-task="FARM.BIOSECURITY"] button').click();
 await workflow.locator('[data-process-panel] #step').click();
 assert.match(await workflow.locator('[data-process-panel] [data-task="FARM.BIOSECURITY"]').textContent(),/DONE/);
 console.log('GAZA master navigation to unified process departments: PASS');
}finally{await browser.close()}
// This file is already invoked by the existing GitHub Actions workflow.
await import('./process-browser-qa.mjs');
