/** Read-only B prerequisite replay. Public API only; no candidate projection or scene mutation. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import * as api from '../../../../capability/layout/contract/index.ts';

const root = 'output/playwright/nested-wires/';
const read = (path) => JSON.parse(readFileSync(root + path, 'utf8'));
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const baseline = read('embedding/increment-a-baseline-gate.json');
const specs = {
  default: api.defaultNestedSceneSpec,
  hub: api.fanInHubSceneSpec,
  templates: read('templates-scene/scene-spec.json'),
  scale: read('scale-scene/scale-scene-spec.json'),
  authoring: read('authoring-scene/scene-spec.json'),
};
function solve(ledger) {
  const vertices = new Map(ledger.vertices.map((v) => [v.key, v]));
  const incoming = Map.groupBy(ledger.constraints.filter((c) => c.from !== c.to), (c) => c.to);
  const positions = new Map(), causes = new Map();
  ledger.order.forEach((key) => {
    positions.set(key, vertices.get(key).position);
    (incoming.get(key) ?? []).forEach((constraint) => relax(constraint, positions, causes));
  });
  ledger.constraints.forEach((c) => assert(positions.get(c.to) >= positions.get(c.from) + c.required, c.key));
  const aliases = new Map(ledger.vertices.flatMap((v) => v.aliases.map((a) => [a, v.key])));
  function witness(alias) {
    const key = aliases.get(alias);
    assert(vertices.has(key), alias);
    const path = [];
    let cursor = key;
    while (causes.has(cursor)) {
      const constraint = causes.get(cursor);
      path.push(constraint);
      cursor = constraint.from;
    }
    return { alias, key, before: vertices.get(key).position, solved: positions.get(key), path };
  }
  return { positions, witness };
}
function sectionContractions(scene, replay) {
  return scene.sections.flatMap((section) => ['x', 'y'].flatMap((axis) => {
    const low = replay.witness(`${section.id}:${axis}:low`);
    const high = replay.witness(`${section.id}:${axis}:high`);
    const before = high.before - low.before, solved = high.solved - low.solved;
    return solved < before ? [{ sectionId: section.id, axis, before, solved, decrease: before - solved, low, high }] : [];
  }));
}
function relax(constraint, positions, causes) {
  const required = positions.get(constraint.from) + constraint.required;
  if (required > positions.get(constraint.to)) {
    positions.set(constraint.to, required);
    causes.set(constraint.to, constraint);
  }
}
function trackSplit(sectionId, axis, track, members, replay) {
  const points = members.map(({ node }) => ({ nodeId: node.id, ...replay.witness(`${node.id}:${axis}:center`) }));
  assert.equal(new Set(points.map((p) => p.before)).size, 1, 'retained grid centers share their structural track');
  if (new Set(points.map((p) => p.solved)).size > 1) return [{ sectionId, axis, track, points }];
  return [];
}
function axisSplits(sectionId, nodes, axis, replay) {
  const columns = Math.ceil(Math.sqrt(nodes.length));
  const groups = Map.groupBy(nodes.map((node, ordinal) => ({ node, ordinal })),
    ({ ordinal }) => axis === 'x' ? ordinal % columns : Math.floor(ordinal / columns));
  return [...groups].flatMap(([track, members]) => trackSplit(sectionId, axis, track, members, replay));
}
function gridTrackSplits(scene, replay) {
  return [...Map.groupBy(scene.nodes, (n) => n.sectionId)].flatMap(([sectionId, nodes]) =>
    ['x', 'y'].flatMap((axis) => axisSplits(sectionId, nodes, axis, replay)));
}
function inspectScene(name, spec) {
  const scene = api.createNestedRoadScene({ spec });
  const sceneText = JSON.stringify(scene);
  assert.equal(sceneText, JSON.stringify(api.createNestedRoadScene({ spec })), `${name}: baseline builds twice`);
  assert.equal(hash(scene), baseline.scenes[name].currentSha256, `${name}: accepted A bytes`);
  const result = api.preflightNestedSupports({ spec, scene });
  assert(result.ok, JSON.stringify(result));
  assert.equal(JSON.stringify(result), JSON.stringify(api.preflightNestedSupports({ spec, scene })), `${name}: preflight twice`);
  const retained = JSON.parse(gunzipSync(readFileSync(root + `embedding/increment-a-${name}-ledger.json.gz`)));
  assert.deepEqual(result, retained, `${name}: exact accepted A ledger`);
  const replay = solve(result.value), second = solve(result.value);
  assert.deepEqual([...replay.positions], [...second.positions], `${name}: numeric solve twice`);
  assert.equal(JSON.stringify(scene), sceneText, `${name}: input remains unchanged`);
  return {
    baselineBuildsByteIdentical: true,
    baselineEqualsA: true,
    baselineBytes: Buffer.byteLength(sceneText),
    baselineSha256: hash(scene),
    ledgerEqualsA: true,
    ledgerSha256: hash(result),
    numericSolvesIdentical: true,
    constraintsSatisfied: result.value.constraints.length,
    movedAnchors: result.value.vertices.filter((v) => replay.positions.get(v.key) !== v.position).length,
    sectionContractions: sectionContractions(scene, replay),
    gridTrackSplits: gridTrackSplits(scene, replay),
    candidateMaterialized: false,
    candidateProjected: false,
    embeddingActiveInBuilder: false,
  };
}
const scenes = Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, inspectScene(name, spec)]));
const receipt = {
  status: 'STOP-judgment-required',
  scope: 'Exact A ledger longest-path replay only. No active B builder, materialized candidate, catalog transition, or infeasible-embedding result is claimed.',
  scenes,
};
writeFileSync(root + 'embedding/increment-b-solve-stop.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ status: receipt.status, scenes: Object.fromEntries(Object.entries(scenes).map(([name, s]) => [name, {
  baselineBuildsByteIdentical: s.baselineBuildsByteIdentical,
  baselineEqualsA: s.baselineEqualsA,
  numericSolvesIdentical: s.numericSolvesIdentical,
  constraintsSatisfied: s.constraintsSatisfied,
  movedAnchors: s.movedAnchors,
  contractedSectionAxes: s.sectionContractions.length,
  splitGridTracks: s.gridTrackSplits.length,
  embeddingActiveInBuilder: false,
}])) }, null, 2));
