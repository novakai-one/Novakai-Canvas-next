/** Increment A public-contract audit: admission is never a scene-legality certificate. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import * as api from '../../../../capability/layout/contract/index.ts';

const root = 'output/playwright/nested-wires/';
const read = (file) => JSON.parse(readFileSync(root + file, 'utf8'));
const specs = { default: api.defaultNestedSceneSpec, hub: api.fanInHubSceneSpec,
  templates: read('templates-scene/scene-spec.json'), scale: read('scale-scene/scale-scene-spec.json'),
  authoring: read('authoring-scene/scene-spec.json') };
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const expected = read('embedding/increment-a-retained-inputs.json');
const adjustments = read('embedding/increment-a-template-gate.json');
function verifyGraph(ledger) {
  const order = new Map(ledger.order.map((key, ordinal) => [key, ordinal]));
  assert.equal(order.size, ledger.vertices.length);
  const vertices = new Map(ledger.vertices.map((v) => [v.key, v]));
  ledger.constraints.forEach((c) => {
    assert(vertices.has(c.from) && vertices.has(c.to));
    assert.equal(vertices.get(c.from).axis, vertices.get(c.to).axis);
    assert.equal(c.available, vertices.get(c.to).position - vertices.get(c.from).position);
    assert.equal(c.deficit, Math.max(0, c.required - c.available));
    assert(c.from === c.to ? c.required <= 0 : order.get(c.from) < order.get(c.to), 'every edge admits retained ordering');
  });
  assert.deepEqual([...new Set(ledger.constraints.map((c) => c.kind))].sort(), ['body-fan','envelope','gate-normal','gate-tangent','structure','travel']);
  // Independent longest-path feasibility replay; local numbers only, never product geometry.
  const incoming = Map.groupBy(ledger.constraints.filter((c) => c.from !== c.to), (c) => c.to);
  const positions = new Map();
  ledger.order.forEach((key) => positions.set(key, Math.max(vertices.get(key).position,
    ...(incoming.get(key) ?? []).map((c) => positions.get(c.from) + c.required))));
  ledger.constraints.forEach((c) => assert(positions.get(c.to) >= positions.get(c.from) + c.required));
  return positions;
}
function verifyAccounting(name, scene, ledger) {
  assert.equal(new Set(ledger.populations.map((p) => p.key)).size, scene.roads.length);
  assert.equal(new Set(ledger.travels.map((t) => t.key)).size, ledger.travels.length);
  assert.equal(new Set(ledger.contacts.map((c) => c.key)).size, ledger.contacts.length);
  assert.equal(ledger.counts.T, expected[name].T);
  assert.equal(ledger.counts.C, expected[name].C);
  assert.equal(ledger.counts.G, expected[name].G);
  const visits = Map.groupBy(ledger.travels, (t) => t.roadKey);
  const populations = new Map(ledger.populations.map((p) => [p.key, p]));
  ledger.populations.forEach((p) => {
    assert.equal(p.demand, (visits.get(p.key) ?? []).length);
    assert.equal(p.width, 12 + 12 * p.demand);
    assert.deepEqual([p.roadId, p.demand, p.width], Object.values(expected[name].population.find((row) => row.roadId === p.roadId)).slice(0, 3));
  });
  const ranks = Map.groupBy(ledger.travels, (t) => JSON.stringify([t.roadKey, t.direction]));
  ranks.forEach((group) => {
    assert.deepEqual(group.map((t) => t.rank).sort((a,b) => a-b), Array.from({length:group.length}, (_,i)=>i));
    assert(group.every((t) => t.count === group.length));
  });
  const logicalContacts = ledger.contacts.map((c) => JSON.stringify([populations.get(c.a).roadId, populations.get(c.b).roadId].sort()));
  assert.deepEqual(logicalContacts, expected[name].contacts);
  assert.deepEqual(ledger.envelopeSpills, expected[name].envelopeSpills);
  assert.equal(ledger.footprints.filter((f) => f.kind === 'turn').length, ledger.counts.T - specs[name].requests.length);
  assert.equal(ledger.footprints.filter((f) => f.kind !== 'turn').length, specs[name].requests.length * 2);
  ledger.footprints.forEach((f) => assert(f.roadKeys.every((key) => populations.has(key))));
  scene.roads.filter((r) => r.kind === 'street' && r.sectionId !== null).forEach((road) =>
    assert.equal(ledger.constraints.filter(c=>c.kind==='envelope' && c.provenance[0]===road.id).length,4,'each owned full envelope has four containment relations'));
  scene.ports.filter((p) => p.nodeId !== p.sectionId).forEach((port) =>
    assert(ledger.constraints.some(c=>c.kind==='body-fan' && c.provenance.includes(port.portId)),'each terminal side has its body/fan support'));
  ledger.travels.forEach((travel) => assert.equal(ledger.constraints.filter(c=>c.kind==='travel' && c.provenance.length===2 && c.provenance[0]===travel.wireId && c.provenance[1]===String(travel.first)).length,1,'each retained travel has exactly one longitudinal constraint'));
  ledger.gates.forEach((gate) => {
    assert(gate.interval[0] <= gate.interval[1]);
    assert.equal(gate.normalConstraints.length, 2);
    gate.normalConstraints.forEach((id) => assert(ledger.constraints.some((c) => c.key === id && c.kind === 'gate-normal')));
  });
}
function verifyAdjustments(name, ledger) {
  const fields = ['wireId','nominalAnchor','requiredAnchor','deficit','resolutionTemplate','byteIdentityConsequence'];
  const select = (a) => Object.fromEntries(fields.map((field) => [field,a[field]]));
  assert.deepEqual(ledger.adjustments.map(select), adjustments.scenes[name].adjustments.map(select));
  if(name !== 'authoring') assert(ledger.adjustments.every((a)=>a.resolutionTemplate === 'supported-orthogonal-forward-stem'));
}
function run(name, spec) {
  const scene = api.createNestedRoadScene({spec}), before = JSON.stringify(scene);
  const result = api.preflightNestedSupports({spec,scene});
  assert(result.ok, JSON.stringify(result));
  const second = api.preflightNestedSupports({spec,scene});
  assert.equal(JSON.stringify(result),JSON.stringify(second));
  assert.equal(JSON.stringify(scene),before, 'request scene is read-only');
  const ledger = result.value;
  verifyAccounting(name,scene,ledger); verifyAdjustments(name,ledger);
  const replay = verifyGraph(ledger);
  const deficits = ledger.constraints.filter((c)=>c.deficit > 0);
  if (['default','hub'].includes(name)) {
    assert.equal(deficits.length,0);
    ledger.vertices.forEach((v)=>assert.equal(replay.get(v.key),v.position));
  }
  writeFileSync(root + `embedding/increment-a-${name}-ledger.json.gz`,gzipSync(JSON.stringify(result)));
  return {status:ledger.status, counts:ledger.counts, ledgerSha256:hash(result), sceneSha256:hash(scene),
    deterministic:true, inputUnchanged:true, completeGraphOrdered:true,
    constraintsByKind:Object.fromEntries([...Map.groupBy(ledger.constraints,(c)=>c.kind)].map(([kind,values])=>[kind,values.length])),
    deficits:deficits.length, minimumNonstructuralSlack:Math.min(...ledger.constraints.filter(c=>!['structure','travel'].includes(c.kind)).map(c=>c.available-c.required)),
    adjustments:ledger.adjustments.length, unsupportedAdjustments:ledger.adjustments.filter(a=>a.resolutionTemplate==='unsupported-retained-adjustment'),
    envelopeSpills:ledger.envelopeSpills};
}
function negative(reason, mutate) {
  const spec = specs.hub, scene = structuredClone(api.createNestedRoadScene({spec}));
  mutate(scene);
  const result = api.preflightNestedSupports({spec,scene});
  assert.equal(result.ok,false,reason);
  assert.equal(result.error.reason,reason);
  assert.equal(JSON.stringify(result),JSON.stringify(api.preflightNestedSupports({spec,scene})));
  return result;
}
function insufficientPins(scene) {
  const drive = scene.roads.find(r=>r.kind==='driveway' && r.access.nodeId !== r.sectionId && r.wireLaneCount >= 2);
  assert(drive, 'negative control targets an actual multiple-pin population');
  const node = scene.nodes.find(n=>n.id===drive.access.nodeId);
  const axis = drive.axis==='horizontal' ? 'y' : 'x', dimension = drive.axis==='horizontal' ? 'height' : 'width';
  node.bounds[axis] += (node.bounds[dimension] - 1) / 2;
  node.bounds[dimension] = 1;
}
const scenes = Object.fromEntries(Object.entries(specs).map(([name,spec])=>[name,run(name,spec)]));
const negativeControls = {
  missingContact:negative('missing-contact',(scene)=>scene.roads.splice(0,1)),
  mismatchedContact:negative('mismatched-contact',(scene)=>{scene.roads[0].bounds.x+=1;}),
  pins:negative('insufficient-terminal-pins', insufficientPins),
  emptyInterval:negative('empty-interval',(scene)=>{scene.sections[0].bounds.width=1;}),
};
assert([252,336,480].every(width=>JSON.parse(gunzipSync(readFileSync(root+'embedding/increment-a-authoring-ledger.json.gz'))).value.populations.some(p=>p.width===width)));
writeFileSync(root+'embedding/increment-a-preflight-gate.json',JSON.stringify({scope:'Constraint admission only; no legality claim',scenes,negativeControls},null,2)+'\n');
console.log(JSON.stringify({scenes:Object.fromEntries(Object.entries(scenes).map(([n,r])=>[n,{...r.counts,deficits:r.deficits,spills:r.envelopeSpills.length}])),negativeControls},null,2));
