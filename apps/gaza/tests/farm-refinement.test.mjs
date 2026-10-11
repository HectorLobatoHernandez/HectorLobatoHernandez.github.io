import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {buildFarmWorld} from '../runtime/farm/world.mjs';
import {refineFarmWorld} from '../runtime/farm/refinements.mjs';
function withWorld(fn){globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},fillText(){}})})};const Mock={...T,TextureLoader:class{load(url,fn){fn(new T.Texture())}}};const world=buildFarmWorld(Mock,new T.Scene());try{const fixes=refineFarmWorld(Mock,world);fn(world,fixes)}finally{world.dispose();delete globalThis.document}}
test('logos face outwards on both sides rather than mirroring the artwork',()=>withWorld((w,f)=>{assert.equal(f.snapshot().signsFixed,3);for(const b of w.buildings.values())for(const o of b.walls.children)if(o.geometry?.type==='PlaneGeometry'&&o.material?.map)assert.equal(o.rotation.y,o.position.z<0?Math.PI:0)}));
test('invisible picking volumes never cast architectural shadows',()=>withWorld((w,f)=>{let count=0;w.root.traverse(o=>{if(o.isMesh&&o.material?.opacity===0){count++;assert.equal(o.castShadow,false)}});assert.equal(count,7);assert(f.snapshot().shadowCorrections>=7)}));
test('relief is an explicitly proposed finite irregular surface',()=>withWorld(w=>{const r=w.context.getObjectByName('PROPOSED_RELIEF_NOT_LIDAR');assert(r);assert.equal(r.geometry.attributes.position.count,20);assert([...r.geometry.attributes.position.array].every(Number.isFinite));assert.equal(w.context.children.find(o=>o.geometry?.parameters?.radiusTop===118).visible,false)}));
test('refinements preserve station mappings, cutaway and isolated interiors',()=>withWorld(w=>{w.setCutaway(true);w.focus(3);w.setIsolation(true);assert.equal([...w.buildings.values()].filter(b=>b.shell.visible).length,1);assert([...w.buildings.values()].every(b=>!b.roof.visible));assert.equal(w.snapshot().animals,26)}));
