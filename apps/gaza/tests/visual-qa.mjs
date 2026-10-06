import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const headed=process.argv.includes('--headed');
const base=process.env.GAZA_URL || 'http://127.0.0.1:4173';
const out=path.resolve('.qa');
await fs.mkdir(out,{recursive:true});

const browser=await chromium.launch({headless:!headed});
const errors=[];
const targets=[
  ['strategy','/game.html',1600,900],
  ['plant','/plant-3d.html',1600,900],
  ['territory','/territory.html',1600,900],
  ['strategy-mobile','/game.html',390,844]
];

for(const [name,url,width,height] of targets){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('console',m=>{if(m.type()==='error')errors.push({surface:name,type:'console',text:m.text()})});
  page.on('pageerror',e=>errors.push({surface:name,type:'pageerror',text:e.message}));
  const response=await page.goto(base+url,{waitUntil:'networkidle',timeout:45000});
  if(!response?.ok()) errors.push({surface:name,type:'http',text:String(response?.status())});
  await page.waitForTimeout(1800);
  await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({base,checkedAt:new Date().toISOString(),errors},null,2));
if(errors.length){
  console.error(JSON.stringify(errors,null,2));
  process.exit(2);
}
console.log('GAZA visual QA OK:',targets.map(x=>x[0]).join(', '));
