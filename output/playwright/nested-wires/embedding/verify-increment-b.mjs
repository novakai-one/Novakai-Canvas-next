/** Public active-builder/replay gate. Baseline captures are immutable run-2 reservation evidence. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import * as api from '../../../../capability/layout/contract/index.ts';
const root = 'output/playwright/nested-wires/';
const read = p => JSON.parse(readFileSync(root + p));
const hash = v => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const specs = {default:api.defaultNestedSceneSpec,hub:api.fanInHubSceneSpec,
  templates:read('templates-scene/scene-spec.json'),scale:read('scale-scene/scale-scene-spec.json'),authoring:read('authoring-scene/scene-spec.json')};
const metadata = wire => { const copy={...wire};delete copy.segments;return copy; };
const result = {};
for (const [name,spec] of Object.entries(specs)) {
  const baseline = JSON.parse(gunzipSync(readFileSync(root+`embedding/increment-b-${name}-admission.json.gz`)));
  const before = baseline.scene;
  const embedded = api.embedNestedSupports({spec,scene:before});
  assert(embedded.ok, JSON.stringify(embedded));
  assert.equal(JSON.stringify(embedded),JSON.stringify(api.embedNestedSupports({spec,scene:before})),`${name}: embedding twice`);
  const after = api.createNestedRoadScene({spec});
  assert(!after.embeddingFailure,JSON.stringify(after.embeddingFailure));
  assert.equal(JSON.stringify(after),JSON.stringify(api.createNestedRoadScene({spec})),`${name}: complete active builds twice`);
  assert.equal(JSON.stringify(after),JSON.stringify(embedded.value.scene),`${name}: builder support observation equals independent reservation query`);
  if(['default','hub'].includes(name)) assert.equal(JSON.stringify(after),JSON.stringify(before),`${name}: retained bytes`);
  const ledger = embedded.value.ledger;
  if(name!=='authoring') {
    assert.deepEqual(ledger.equalities,[]);
    assert.deepEqual(ledger.vertices,baseline.graph.vertices);
    assert.deepEqual(ledger.constraints,baseline.graph.constraints);
  }
  assert.deepEqual(before.nodes.map(n=>[n.id,n.label,n.sectionId,n.bounds.width,n.bounds.height,n.ports]),after.nodes.map(n=>[n.id,n.label,n.sectionId,n.bounds.width,n.bounds.height,n.ports]));
  assert.deepEqual(before.wiring.value.map(metadata),after.wiring.value.map(metadata));
  const idMap = new Map(embedded.value.roadIds.map(r=>[r.before,r.after]));
  assert.deepEqual(before.wireLanes.map(l=>({...l,roadId:idMap.get(l.roadId)})),after.wireLanes);
  assert.deepEqual(before.roads.map(r=>r.wireLaneCount),after.roads.map(r=>r.wireLaneCount));
  for (const [i,section] of before.sections.entries()) {
    assert(after.sections[i].bounds.width>=section.bounds.width);
    assert(after.sections[i].bounds.height>=section.bounds.height);
  }
  const inspection=api.inspectNestedWires(after,after.wiring.value);
  assert.equal(inspection.boundaries.length,0,`${name}: zero unplanned wall incidences`);
  writeFileSync(root+`embedding/increment-b-${name}-active.json.gz`,gzipSync(JSON.stringify({spec,before,result:embedded})));
  result[name]={activeBuildsTwiceByteIdentical:true,queryTwiceByteIdentical:true,builderEqualsQuery:true,beforeSha256:hash(before),afterSha256:hash(after),beforeBytes:Buffer.byteLength(JSON.stringify(before)),afterBytes:Buffer.byteLength(JSON.stringify(after)),unchanged:hash(before)===hash(after),equalityGroups:ledger.equalities.length,admissionGraphUnchanged:name!=='authoring',movedAliases:embedded.value.moved.length,counts:ledger.counts,inspection:Object.fromEntries(Object.entries(inspection).map(([k,v])=>[k,v.length]))};
  console.log(`${name}: two complete active builds BYTE-IDENTICAL; before=${result[name].beforeBytes}, after=${result[name].afterBytes}, unchanged=${result[name].unchanged}`);
}
writeFileSync(root+'embedding/increment-b-active-builds.json',JSON.stringify(result,null,2)+'\n');
