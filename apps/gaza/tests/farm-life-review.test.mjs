import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sizeHerd} from '../runtime/farm/life/herd-model.mjs';
test('extreme positive tiny yields fail closed rather than returning unsafe census integers',()=>{
 for(const yieldL of [1e-100,1e-300])assert.throws(()=>sizeHerd(150120,yieldL,1,.8),/rango numérico/);
 assert.equal(sizeHerd(150120,30,1,.8).productive,5004);
});
test('async 3D boot preserves a station already selected by the user',()=>{
 const html=fs.readFileSync(new URL('../farm-labs.html',import.meta.url),'utf8');
 const marker='// Preserve a station selected while the 3D module was loading.';
 const start=html.indexOf(marker);assert(start>=0,'Late-load completion block must be present');
 const code=html.slice(start,html.indexOf('</script>',start));
 assert.match(code,/select\(selectedStation\);/);
 // Test the actual late-boot statements, including new demo-link and readiness hooks.
 // Requiring select() to be the final HTML statement is not the behavioral contract.
 for(const selectedStation of [0,2,6])for(const mode of ['farm','labs'])for(const demo of [false,true]){
  const calls=[],events=[];
  vm.runInNewContext(code,{selectedStation,mode,visual:{},processStore:{scope:{demo}},
   select(i){calls.push(i)},document:{querySelectorAll(){return []}},
   window:{dispatchEvent(e){events.push({event:e.type,selected:calls.at(-1)})}},
   CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},URL,
   location:{href:'https://example.invalid/apps/gaza/farm-labs.html',origin:'https://example.invalid'}});
  assert.deepEqual(calls,[selectedStation],'The earlier user selection must not reset to station zero');
  if(mode==='labs')assert.deepEqual(events,[{event:'gaza-scene-ready',selected:selectedStation}]);
 }
});
