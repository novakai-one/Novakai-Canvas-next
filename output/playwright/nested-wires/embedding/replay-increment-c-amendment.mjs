import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import * as api from '../../../../capability/layout/contract/index.ts';
const root='output/playwright/nested-wires/embedding/';
const receipt={};
for(const name of ['default','hub','templates','scale','authoring']) {
 const saved=JSON.parse(gunzipSync(readFileSync(root+`increment-b-${name}-active.json.gz`)));
 const before=saved.result.value.scene;
 const scene=api.createNestedRoadScene({spec:saved.spec});
 const hash=s=>createHash('sha256').update(JSON.stringify(s)).digest('hex');
 const current={before:hash(before),after:hash(scene),identical:JSON.stringify(before)===JSON.stringify(scene),failure:scene.embeddingFailure,inspection:scene.wiring?.ok ? api.inspectNestedWires(scene,scene.wiring.value):null};
 receipt[name]=current;
 writeFileSync(root+'increment-c-amendment-replay.json',JSON.stringify(receipt,null,2)+'\n');
 writeFileSync(root+`increment-c-${name}-candidate.json.gz`,gzipSync(JSON.stringify({spec:saved.spec,scene})));
 console.log(name,JSON.stringify(current));
 if(scene.embeddingFailure || (name!=='authoring'&&!current.identical)) { console.log('STOP');process.exitCode=1;break; }
 assert.deepEqual(current.inspection,{corridors:[],nodeBodies:[],boundaries:[],continuity:[]},`${name}: C zero-defect inspection`);
 assert.equal(JSON.stringify(scene),JSON.stringify(api.createNestedRoadScene({spec:saved.spec})),`${name}: twice identical`);
}
