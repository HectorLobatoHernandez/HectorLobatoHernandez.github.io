import test from 'node:test';
import assert from 'node:assert/strict';
import {environmentOf,spainHour} from '../runtime/living/model.mjs';
import {initialState} from '../runtime/processes/ledger.mjs';
test('night preview is distinct from clock and has low ambient/solar energy',()=>{const s=initialState({living:{startMinute:480,environment:'night',schedule:false}}),e=environmentOf(s);assert(e.sunIntensity<.2);assert(e.ambientIntensity<.3);assert.equal(e.sourceHour,8);assert.equal(e.hour,23)});
test('automatic lighting follows the civil clock in Spain while the simulation remains at 08:00',()=>{const s=initialState(),at=new Date('2026-10-15T19:30:00Z'),e=environmentOf(s,{at});assert.equal(spainHour(at),21.5);assert.equal(e.phase,'Noche');assert.equal(e.timeBasis,'EUROPE_MADRID_CIVIL');assert.equal(e.sourceHour,8);assert.notEqual(environmentOf(s,{mode:'sim',at}).phase,'Noche');assert.equal(environmentOf(s,{at:new Date('2026-10-15T11:30:00Z')}).phase,'Día')});
