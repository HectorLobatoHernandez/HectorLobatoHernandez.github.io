import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSpainClock,alignedStartMinute,deviceSpainNow,SPAIN_TZ} from '../runtime/time/spain-clock.mjs';
import {initialState,reduce} from '../runtime/processes/ledger.mjs';
import {LIVE_RELEASE} from '../runtime/living/model.mjs';
import {MOBILE_RELEASE,safeSceneAction} from '../runtime/mobile/policy.mjs';

test('presentation release is consistent',()=>{assert.equal(LIVE_RELEASE,'gaza-vida-20261015-v5');assert.equal(MOBILE_RELEASE,LIVE_RELEASE)});
test('Spain fallback always formats Europe/Madrid',()=>{const x=deviceSpainNow(new Date('2026-01-15T12:00:00Z'));assert.equal(x.timezone,SPAIN_TZ);assert.match(x.display,/^13:00:00$/)});
test('network Spain clock advances from server fields independent of runner timezone',async()=>{let perf=1000;const payload={year:2026,month:10,day:14,hour:21,minute:53,seconds:7,milliSeconds:0};const clock=createSpainClock({refreshMs:999999,nowPerf:()=>perf,fetchImpl:async()=>({ok:true,json:async()=>payload})});await clock.sync();assert.equal(clock.snapshot().display,'21:53:07');perf+=62000;assert.equal(clock.snapshot().display,'21:54:09');assert(clock.snapshot().network);clock.close()});
test('SIM schedule can align to Spain without changing elapsed process time',()=>{let s=initialState();s=reduce(s,{type:'TICK',seconds:300});const before=JSON.stringify(s.lots),elapsed=s.clock.seconds,start=alignedStartMinute(22*60+15,elapsed);s=reduce(s,{type:'LIVING_SETTINGS',startMinute:start,environment:'auto'});assert.equal(s.clock.seconds,elapsed);assert.equal(JSON.stringify(s.lots),before);assert.equal(s.config.living.startMinute,start)});
test('mobile exposes a permanent roof action',()=>{assert(safeSceneAction('roof'));const src=fs.readFileSync(new URL('../runtime/mobile/scene.mjs',import.meta.url),'utf8');assert.match(src,/touchRoof/);assert.match(src,/farmCutaway/);assert.match(src,/labRoof/);assert.match(src,/getElementById\('cutaway'\)/)});
test('desktop presentation exposes direct interior, activity and night controls',()=>{const html=fs.readFileSync(new URL('../mission-control.html',import.meta.url),'utf8');for(const id of ['quickInterior','quickOverview','quickActivity','quickNight','quickAutoLight'])assert(html.includes('id="'+id+'"'),id);assert.match(html,/Europe\/Madrid/)});
test('living scene carries lab branding, heritage lighting and vehicle lighting',()=>{const src=fs.readFileSync(new URL('../runtime/living/scene.mjs',import.meta.url),'utf8');assert.match(src,/GAZA · RECEPCIÓN DE MUESTRAS/);assert.match(src,/GAZA · CONTROL DE ENVASE/);assert.match(src,/Zamora-castle/);assert.match(src,/heritage:true/);assert.match(src,/vehicle:true/)});
test('farm animals keep cubicles fixed while outdoor representatives move from SIM time',()=>{const src=fs.readFileSync(new URL('../runtime/farm/life/layer.mjs',import.meta.url),'utf8');assert.match(src,/yard\?Math\.sin\(routinePhase\)/);assert.match(src,/x:a\.position\[0\]\+dx/);assert.match(src,/dx=yard\?/);});
