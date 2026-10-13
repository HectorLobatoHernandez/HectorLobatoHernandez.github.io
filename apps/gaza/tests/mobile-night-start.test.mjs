import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {environmentOf} from '../runtime/living/model.mjs';
import {initialState} from '../runtime/processes/ledger.mjs';
test('night preview is distinct from clock and has low ambient/solar energy',()=>{const s=initialState({living:{startMinute:480,environment:'night',schedule:false}}),e=environmentOf(s);assert(e.sunIntensity<.2);assert(e.ambientIntensity<.3);assert.equal(e.sourceHour,8);assert.equal(e.hour,23)});
test('initial plant lighting respects a pre-existing shared scenario',()=>{const t=fs.readFileSync(new URL('../runtime/site-real-app.mjs',import.meta.url),'utf8');assert(t.includes('if(!processState){scene.background='));assert(t.includes('else living?.update(true)'));const layer=fs.readFileSync(new URL('../runtime/living/scene.mjs',import.meta.url),'utf8');assert(layer.includes('const update=(force=false)=>{const changed=refresh(force)'))});
