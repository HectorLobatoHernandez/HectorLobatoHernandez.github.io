import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.PRESENTATION_URL||'http://127.0.0.1:4174/apps/presentation-lab/';
await fs.mkdir('.qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
if(!response?.ok())errors.push('http: '+String(response?.status()));
await page.waitForTimeout(4000);

const result=await page.evaluate(()=>({
  title:document.title,
  rootChildren:document.getElementById('root')?.children.length||0,
  cards:document.querySelectorAll('.spotlight-card').length,
  words:document.querySelectorAll('.rb-word').length,
  projectText:document.body.textContent.includes('GAZA Operations Intelligence'),
  rhbText:document.body.textContent.includes('RHB STUDIO'),
  attribution:document.body.textContent.includes('React Bits components used'),
  imageLoaded:(()=>{const i=document.querySelector('.portrait-wrap img');return !!i&&i.complete&&i.naturalWidth>0})()
}));

if(result.rootChildren<1)errors.push('React root did not render');
if(result.cards<6)errors.push('Expected >=6 SpotlightCard instances, got '+result.cards);
if(result.words<8)errors.push('ScrollReveal words missing: '+result.words);
if(!result.projectText||!result.rhbText)errors.push('Portfolio example content missing');
if(!result.attribution)errors.push('React Bits attribution missing');
if(!result.imageLoaded)errors.push('Portrait image failed to load');

const first=page.locator('.spotlight-card').first();
await first.hover();
await page.mouse.move(360,500);
const spotlight=await first.evaluate(el=>({
  x:getComputedStyle(el).getPropertyValue('--mouse-x').trim(),
  y:getComputedStyle(el).getPropertyValue('--mouse-y').trim()
}));
if(!spotlight.x||!spotlight.y)errors.push('SpotlightCard pointer variables not updated');

await page.screenshot({path:'.qa/presentation-lab.png',fullPage:true});
await fs.writeFile('.qa/presentation-lab-report.json',JSON.stringify({checkedAt:new Date().toISOString(),result,spotlight,errors},null,2));
await browser.close();

if(errors.length){
  console.error(JSON.stringify({result,spotlight,errors},null,2));
  process.exit(2);
}
console.log('Presentation Lab QA OK',result);
