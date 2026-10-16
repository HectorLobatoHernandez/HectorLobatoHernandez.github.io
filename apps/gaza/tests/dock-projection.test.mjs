import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../runtime/processes/ledger.mjs';
import {FLEET,projectDocks} from '../runtime/docks/model.mjs';
import {TASKS} from '../runtime/processes/catalog.mjs';

test('dock occupancy derives from common ledger and does not mutate it',()=>{
 const state=initialState(),lot=state.lots['SIM-BOV-001'];
 lot.mass.packedL=2880+360;lot.mass.tankerL=720;
 const before=JSON.stringify(state),view=projectDocks(state,'SIM-FLT-02');
 assert.equal(view.families.find(f=>f.id===lot.id).full,4);
 assert.equal(view.families.find(f=>f.id===lot.id).partial,360);
 assert.equal(view.families.find(f=>f.id===lot.id).partialPct,50);
 assert.equal(view.families.find(f=>f.id===lot.id).usedSlots,5);
 assert.equal(view.stockPallets,4);
 assert.equal(view.operation,'CARGA PALÉS');
 assert.equal(view.canLoad,false);
 assert.equal(JSON.stringify(state),before);
 const tanker=projectDocks(state,'SIM-FLT-01');assert.equal(tanker.operation,'DESCARGA CISTERNA');assert.equal(tanker.inboundL,720);
 assert.equal(FLEET.length,10);
});

test('empty store never displays invented pallets or an assigned shipment',()=>{
 const view=projectDocks(null,'SIM-FLT-10');
 assert.equal(view.stockPallets,0);assert.equal(view.hasLedger,false);assert.equal(view.revision,null);
});

test('loading progress is read from the dispatch task, not from already departed stock',()=>{
 const state=initialState(),lot=state.lots['SIM-BOV-001'];
 lot.mass.packedL=8*state.config.palletCapacityL;
 const task=lot.tasks['DISPATCH.LOAD'];task.status='RUNNING';task.elapsed=TASKS.find(t=>t.id==='DISPATCH.LOAD').durationSimSeconds/2;
 const f=projectDocks(state,'SIM-FLT-02').families.find(f=>f.id===lot.id);
 assert.equal(f.loadingProgress,.5);assert.equal(f.full,8);assert.equal(f.shippingL,0);
 task.status='HELD';assert.equal(projectDocks(state,'SIM-FLT-02').families.find(row=>row.id===lot.id).loadingProgress,.5);
});
