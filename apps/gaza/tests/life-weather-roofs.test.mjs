import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initialState,reduce} from '../runtime/processes/ledger.mjs';
import {environmentOf,LIVE_RELEASE,settingsOf} from '../runtime/living/model.mjs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('artificial lighting is enabled only in the Noche phase',()=>{
 let s=initialState();
 s=reduce(s,{type:'LIVING_SETTINGS',environment:'day'});assert.equal(environmentOf(s).lamps,false);assert.equal(environmentOf(s).phase,'Día');
 s=reduce(s,{type:'LIVING_SETTINGS',environment:'dusk'});assert.equal(environmentOf(s).lamps,false);assert.equal(environmentOf(s).phase,'Crepúsculo');
 s=reduce(s,{type:'LIVING_SETTINGS',environment:'night'});assert.equal(environmentOf(s).lamps,true);assert.equal(environmentOf(s).phase,'Noche');
});

test('simulated weather is visual state and preserves lots/quality',()=>{
 let s=initialState(),before=JSON.stringify(s.lots);s=reduce(s,{type:'LIVING_SETTINGS',weather:'rain'});assert.equal(settingsOf(s).weather,'rain');assert.equal(JSON.stringify(s.lots),before);assert.throws(()=>reduce(s,{type:'LIVING_SETTINGS',weather:'snowstorm'}));
});

test('release and presentation controls are upgraded',()=>{
 assert.equal(LIVE_RELEASE,'gaza-vida-20261015-v11');
 const mission=read('../mission-control.html');
 assert(mission.includes('zTemp'));assert(mission.includes('zWind'));assert(mission.includes('Quitar cubiertas / ver interior'));
 assert(mission.includes('CORESES · PLANTA'));assert(mission.includes('ZAMORA · GRANJA'));
});

test('roof controls expose both remove and restore actions',()=>{
 const farm=read('../runtime/farm/viewer.mjs'),lab=read('../runtime/labs/viewer.mjs'),site=read('../site-real-preview.html');
 assert.match(farm,/Poner cubiertas/);assert.match(farm,/Quitar cubiertas/);
 assert.match(lab,/Poner cubierta/);assert.match(lab,/Quitar cubierta/);
 assert.match(site,/id="cutawayToggle"/);assert.match(site,/Quitar cubierta/);
});

test('farm life includes water points and ambient birds without touching census',()=>{
 const src=read('../runtime/farm/life/layer.mjs');
 assert.match(src,/SIM-DRINKING-WATER-'\+species/);assert.match(src,/\['BOVINE','OVINE'\]/);assert.match(src,/SIM-AMBIENT-BIRDS/);
 assert.match(src,/waterPoints:waterPoints.length/);assert.match(src,/birds:birds.length/);
});

test('all staff cars use the shared SIM clock patrol route',()=>{
 const src=read('../runtime/living/motion.mjs');
 assert.match(src,/SIM-STAFF-CAR-\\d\+/);assert.match(src,/SIMULATED_ROAD_TRAFFIC_NO_CARGO/);
});

test('day mode forces pools, lamp emissive and real lights off',()=>{
 const src=read('../runtime/living/scene.mjs');
 assert.match(src,/assets\.m\.lamp\.emissiveIntensity=night\?3\.8:0/);
 assert.match(src,/for\(const p of pools\)p\.visible=night/);
 assert.match(src,/const allowed=night&&/);
});
