import test from 'node:test';
import assert from 'node:assert/strict';
import {createWarehouseDemonstration} from '../runtime/demo/scenario.mjs';
import {reduce,validateState} from '../runtime/processes/ledger.mjs';
import {projectDocks} from '../runtime/docks/model.mjs';

test('stocked demonstration has two traceable families and loading conserves litres',()=>{
 let state=createWarehouseDemonstration({running:false});
 assert.equal(validateState(state),true);
 const before=projectDocks(state);
 assert.equal(before.stockL,11484);
 assert.equal(before.stockPallets,15);
 assert.deepEqual(before.families.map(f=>[f.usedSlots,f.occupancy]),[[13,81],[4,25]]);
 assert.equal(before.canLoad,true);
 for(const lot of Object.values(state.lots)){
  assert.equal(lot.tasks['WAREHOUSE.PUTAWAY'].status,'DONE');
  assert.equal(lot.gates.dispatch.status,'PENDING');
  assert.ok(lot.genealogy.some(n=>n.kind==='FINISHED_LOT'));
 }
 const lotId='SIM-BOV-001';
 state=reduce(state,{type:'REVIEW_GATE',lotId,gate:'dispatch',reviewer:'SIM-QA-01'});
 state=reduce(state,{type:'START_TASK',lotId,taskId:'DISPATCH.LOAD'});
 state=reduce(state,{type:'TICK',seconds:18});
 assert.equal(validateState(state),true);
 const after=projectDocks(state);
 assert.equal(after.stockL+after.shippingL,before.stockL);
 assert.equal(after.shippingL,8640);
 assert.equal(after.families[0].storedL,555);
 assert.equal(state.lots[lotId].tasks['DISPATCH.LOAD'].status,'DONE');
 assert.equal(after.canDeliver,true);
 state=reduce(state,{type:'START_TASK',lotId,taskId:'DELIVERY.ARRIVE'});
 state=reduce(state,{type:'TICK',seconds:24});
 const delivered=projectDocks(state);
 assert.equal(validateState(state),true);
 assert.equal(delivered.shippingL,0);
 assert.equal(delivered.deliveredL,8640);
 assert.equal(delivered.stockL+delivered.deliveredL,before.stockL);
});
