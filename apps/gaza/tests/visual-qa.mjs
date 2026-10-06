import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const headed=process.argv.includes('--headed');
const base=process.env.GAZA_URL || 'http://127.0.0.1:4173';
const out=path.resolve('.qa');
await fs.mkdir(out,{recursive:true});

const browser=await chromium.launch({headless:!headed});
const errors=[],checks=[];
const targets=[
  {name:'strategy',url:'/game.html',width:1600,height:900,dsf:2},
  {name:'strategy-docks',url:'/game.html',width:1600,height:900,dsf:2,action:async page=>page.locator('[data-focus="dock"]').click()},
  {name:'plant',url:'/plant-3d.html',width:1600,height:900,dsf:2},
  {name:'plant-asrs',url:'/plant-3d.html',width:1600,height:900,dsf:2,action:async page=>page.locator('[data-camera="asrs"]').click()},
  {name:'plant-docks',url:'/plant-3d.html',width:1600,height:900,dsf:2,action:async page=>page.locator('[data-camera="docks"]').click()},
  {name:'territory',url:'/territory.html',width:1600,height:900,dsf:1},
  {name:'strategy-mobile',url:'/game.html',width:390,height:844,dsf:2}
];

for(const target of targets){
  const {name,url,width,height,dsf=1,action}=target;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dsf});
  const page=await context.newPage();
  page.on('console',m=>{if(m.type()==='error')errors.push({surface:name,type:'console',text:m.text()})});
  page.on('pageerror',e=>errors.push({surface:name,type:'pageerror',text:e.message}));
  const response=await page.goto(base+url,{waitUntil:'networkidle',timeout:45000});
  if(!response?.ok()) errors.push({surface:name,type:'http',text:String(response?.status())});
  await page.waitForTimeout(1600);

  if(url.includes('game.html')||url.includes('plant-3d.html')){
    const canvasSelector=url.includes('game.html')?'#scene':'#twin3d';
    const metrics=await page.locator(canvasSelector).evaluate((canvas)=>{
      const r=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
      return {cssW:r.width,cssH:r.height,bufferW:canvas.width,bufferH:canvas.height,dpr,ratioX:r.width?canvas.width/r.width:0,ratioY:r.height?canvas.height/r.height:0};
    });
    const expected=Math.min(Math.max(metrics.dpr,1),2.5);
    const sharp=metrics.cssW>0&&metrics.cssH>0&&metrics.ratioX>=expected-.08&&metrics.ratioY>=expected-.08;
    checks.push({surface:name,check:'webgl-backing-resolution',ok:sharp,metrics});
    if(!sharp)errors.push({surface:name,type:'quality',text:'WebGL backing store below expected DPR: '+JSON.stringify(metrics)});

    const logo=await page.locator('img[src="assets/gaza-logo.svg"]').first().evaluate(img=>({complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
    const logoOk=logo.complete&&logo.naturalWidth>0&&logo.naturalHeight>0;
    checks.push({surface:name,check:'brand-svg-load',ok:logoOk,metrics:logo});
    if(!logoOk)errors.push({surface:name,type:'asset',text:'GAZA SVG did not load: '+JSON.stringify(logo)});
  }

  if(action){await action(page);await page.waitForTimeout(900)}
  await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({base,checkedAt:new Date().toISOString(),targets:targets.map(({action,...x})=>x),checks,errors},null,2));
if(errors.length){
  console.error(JSON.stringify({checks,errors},null,2));
  process.exit(2);
}
console.log('GAZA visual QA OK:',targets.map(x=>x.name).join(', '));
