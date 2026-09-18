import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync,gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
const source=readFileSync('output/playwright/nested-wires/ownership/verify.mjs','utf8');
const verifier=execFileSync('git',['show','1ff0be8:output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs'],{encoding:'utf8'});
const helpers=source.slice(source.indexOf('const inside ='),source.indexOf('function metadataChanges'));
import * as api from '../../../../capability/layout/contract/index.ts';
const receipts={};
for(const name of ['authoring']){
 const value=JSON.parse(gunzipSync(readFileSync(`output/playwright/nested-wires/embedding/increment-c-${name}-candidate.json.gz`)));
 const results={};
 for(const [phase,scene] of [['before',JSON.parse(gunzipSync(readFileSync(`output/playwright/nested-wires/embedding/increment-b-${name}-active.json.gz`))).result.value.scene],['after',value.scene]]) {
  const details=runInNewContext(helpers+';({catalogs:catalogs(scene),...supplementary(scene)});',{verifier,scene,assert,runInNewContext,json:JSON.stringify});
  const inspection=api.inspectNestedWires(scene,scene.wiring.value);
  results[phase]={corridors:inspection.corridors.length,continuity:inspection.continuity.length,bodies:inspection.nodeBodies.length,boundaries:inspection.boundaries.length,overlaps:details.catalogs.overlaps.length,reversed:details.reversed.length,gateOmissions:details.missingGates.length,uncertified:details.catalogs.certification.uncovered.length};
  writeFileSync(`output/playwright/nested-wires/embedding/increment-c-${name}-${phase}-catalogs.json.gz`,gzipSync(JSON.stringify({inspection,...details})));
 }
 assert.deepEqual(results.before,{corridors:2,continuity:0,bodies:0,boundaries:0,overlaps:3,reversed:0,gateOmissions:0,uncertified:951});
 for(const key of Object.keys(results.before))assert(results.after[key]<=results.before[key],`${key}: catalog regression`);
 assert.equal(results.after.corridors,0,'C requires corridors 2 to 0');
 receipts[name]=results;
}
writeFileSync('output/playwright/nested-wires/embedding/increment-c-catalog-transitions.json',JSON.stringify(receipts,null,2));
console.log(JSON.stringify(receipts,null,2));
