import test from 'node:test';
import assert from 'node:assert/strict';
import {sizeHerd} from '../runtime/farm/life/herd-model.mjs';
test('extreme positive tiny yields fail closed rather than returning unsafe census integers',()=>{
 for(const yieldL of [1e-100,1e-300])assert.throws(()=>sizeHerd(150120,yieldL,1,.8),/rango numérico/);
 assert.equal(sizeHerd(150120,30,1,.8).productive,5004);
});
