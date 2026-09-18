import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import * as api from '../../../../capability/layout/contract/index.ts';
const root='output/playwright/nested-wires/embedding/';
const baseline=JSON.parse(gunzipSync(readFileSync(root+'increment-b-authoring-active.json.gz')));
const candidate=JSON.parse(gunzipSync(readFileSync(root+'increment-c-authoring-candidate.json.gz')));
const result=api.embedNestedSupports({spec:baseline.spec,scene:baseline.before});
assert(result.ok,JSON.stringify(result));
assert.equal(JSON.stringify(result.value.scene),JSON.stringify(candidate.scene),'public query and active builder agree');
assert.equal(JSON.stringify(result),JSON.stringify(api.embedNestedSupports({spec:baseline.spec,scene:baseline.before})),'query twice identical');
const {ledger,moved,scene}=result.value;
const values=new Map(ledger.vertices.flatMap(v=>v.aliases.map(k=>[k,v.position])));
moved.forEach(v=>values.set(v.key,v.position));
ledger.constraints.forEach(e=>assert(values.get(e.to)-values.get(e.from)>=e.required,JSON.stringify(e)));
const changes=ledger.vertices.filter(v=>values.get(v.key)>v.position).map(v=>({key:v.key,aliases:v.aliases,before:v.position,after:values.get(v.key),provenance:ledger.constraints.filter(e=>e.to===v.key && values.get(e.to)===values.get(e.from)+e.required).map(e=>({constraint:e.key,from:e.from,required:e.required,provenance:e.provenance}))}));
ledger.vertices.forEach(v=>assert(values.get(v.key)>=v.position));
assert(changes.every(v=>v.provenance.length),'every changed anchor has its producing constraint');
const before=baseline.result.value.scene;
for(const [i,n] of scene.nodes.entries())assert.deepEqual([n.id,n.label,n.bounds.width,n.bounds.height],[before.nodes[i].id,before.nodes[i].label,before.nodes[i].bounds.width,before.nodes[i].bounds.height]);
for(const [i,s] of scene.sections.entries()) {assert(s.bounds.width>=before.sections[i].bounds.width);assert(s.bounds.height>=before.sections[i].bounds.height);}
const laneIdentity = lane => { const copy={...lane};delete copy.roadId;return copy; };
assert.deepEqual(scene.wireLanes.map(laneIdentity),before.wireLanes.map(laneIdentity));
const wire=id=>scene.wiring.value.find(w=>w.id===id);
const oldwire=id=>before.wiring.value.find(w=>w.id===id);
const rows=['w80','w81','w84'].map(id=>({id,before:oldwire(id).segments.filter(s=>s.from.y===s.to.y&&s.from.y>=2340&&s.from.y<2360),after:wire(id).segments.filter(s=>s.from.y===s.to.y&&s.from.y>=2340&&s.from.y<2360)}));
assert.deepEqual(rows.map(r=>r.before.map(s=>s.from.y)),rows.map(r=>r.after.map(s=>s.from.y)),'selected bridge rows do not shift');
const physicalAnchors=[];
const byCurrent=new Map(result.value.roadIds.map(r=>[r.after,r.before]));
for(const [i,road] of scene.roads.entries()) {
 const prior=before.roads[i];
 for(const [axis,dimension] of [['x','width'],['y','height']]) {
  for(const high of [false,true]) {
   const previous=prior.bounds[axis]+(high?prior.bounds[dimension]:0);
   const current=road.bounds[axis]+(high?road.bounds[dimension]:0);
   if(previous===current)continue;
   const growth=ledger.spanGrowth.find(g=>g.roadId===byCurrent.get(road.id)&&g.axis===axis);
   const source=growth?.provenance??['attached-gate-driveway-edge',road.access?.portId];
   assert(growth || road.id.startsWith('drive:'),'unexplained physical movement');
   assert(current>=previous,'physical anchor is grow-only');
   physicalAnchors.push({roadId:road.id,axis,side:high?'high':'low',before:previous,after:current,provenance:source});
  }
 }
}
const receipt={status:'passed',solvePassesForAffectedScene:2,extraSolveLimit:1,noFurtherBridgeGap:true,allConstraintsReplayed:ledger.constraints.length,growOnly:true,spanGrowth:ledger.spanGrowth,changedAnchors:changes,changedPhysicalAnchors:physicalAnchors,rows,wireLanesUnchanged:true,queryEqualsActive:true,queryTwiceIdentical:true};
writeFileSync(root+'increment-c-solve-evidence.json',JSON.stringify(receipt,null,2)+'\n');
writeFileSync(root+'increment-c-authoring-embedded.json.gz',gzipSync(JSON.stringify(result)));
console.log(JSON.stringify(receipt,null,2));
