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
await page.waitForTimeout(4200);

const result=await page.evaluate(()=>({
  title:document.title,
  rootChildren:document.getElementById('root')?.children.length||0,
  nodes:document.querySelectorAll('.node').length,
  pixels:document.querySelectorAll('.pixel').length,
  decrypt:document.querySelectorAll('.decrypt').length,
  dock:!!document.querySelector('.dock'),
  projectText:document.body.textContent.includes('GAZA Operations Intelligence'),
  rhbText:document.body.textContent.includes('RHB STUDIO'),
  missionText:document.body.textContent.includes('FROM AMBIGUITY'),
  imageLoaded:(()=>{const i=document.querySelector('.photo img');return !!i&&i.complete&&i.naturalWidth>0})()
}));

if(result.rootChildren<1)errors.push('React root did not render');
if(result.nodes<6)errors.push('Expected >=6 technical nodes, got '+result.nodes);
if(result.pixels<3)errors.push('Expected >=3 pixel project cards, got '+result.pixels);
if(result.decrypt<2)errors.push('DecryptedText instances missing');
if(!result.dock)errors.push('Proximity dock missing');
if(!result.projectText||!result.rhbText||!result.missionText)errors.push('Core CV content missing');
if(!result.imageLoaded)errors.push('Portrait image failed to load');

const card=page.locator('.pixel').first();
await card.hover();
await page.waitForTimeout(700);
const decoded=await card.locator('.px-back').evaluate(el=>getComputedStyle(el).display!=='none');
if(!decoded)errors.push('PixelTransition did not reveal decoded project face');

const node=page.locator('.node').first();
await node.hover();
const transform=await node.locator('..').evaluate(el=>getComputedStyle(el).transform);
if(!transform)errors.push('Tilt card transform unavailable');

await page.screenshot({path:'.qa/cv-wow.png',fullPage:true});
await fs.writeFile('.qa/cv-wow-report.json',JSON.stringify({checkedAt:new Date().toISOString(),result,decoded,transform,errors},null,2));
await browser.close();

if(errors.length){console.error(JSON.stringify({result,decoded,transform,errors},null,2));process.exit(2)}
console.log('CV WOW QA OK',result);
