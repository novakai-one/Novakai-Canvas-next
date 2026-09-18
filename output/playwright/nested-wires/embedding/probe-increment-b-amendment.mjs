/** Stop diagnostic: observe the public preflight without changing any result or admission rule. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
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
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('tsx/package.json'))('esbuild');
function observe({ path }) {
  const source = readFileSync(path, 'utf8');
  const target = 'return { vertices: points, constraints, order: ordered(points, constraints) };';
  assert.equal(source.split(target).length, 2, 'one admission observation point');
  return { loader: 'ts', contents: source.replace(target,
    'globalThis.__m10fBGraph = { vertices: points, constraints };\n  ' + target) };
}
const bundle = await build({
  stdin: { contents: "export { preflightNestedSupports } from './capability/layout/contract/index.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false,
  plugins: [{ name: 'observe-admission', setup(builder) {
    builder.onLoad({ filter: /nested-support-graph\.ts$/ }, observe);
  } }],
});
const observed = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
function inspect(name, spec) {
  const scene = api.createNestedRoadScene({ spec });
  const text = JSON.stringify(scene);
  assert.equal(text, JSON.stringify(api.createNestedRoadScene({ spec })));
  assert.equal(hash(scene), baseline.scenes[name].currentSha256, `${name}: accepted A bytes`);
  const request = { spec, scene };
  const result = api.preflightNestedSupports(request);
  assert.deepEqual(result, api.preflightNestedSupports(request));
  assert.deepEqual(observed.preflightNestedSupports(request), result);
  const graph = structuredClone(globalThis.__m10fBGraph);
  assert.deepEqual(observed.preflightNestedSupports(request), result);
  assert.deepEqual(globalThis.__m10fBGraph, graph);
  assert.equal(JSON.stringify(scene), text, 'preflight leaves source scene unchanged');
  writeFileSync(root + `embedding/increment-b-${name}-admission.json.gz`,
    gzipSync(JSON.stringify({ scene, result, graph })));
  return { baselineBuildsByteIdentical: true, baselineEqualsA: true, baselineBytes: Buffer.byteLength(text),
    baselineSha256: hash(scene), preflightsByteIdentical: true, observedEqualsOrdinary: true,
    graphSha256: hash(graph), vertices: graph.vertices.length, constraints: graph.constraints.length,
    result, embeddingActiveInBuilder: false };
}
const scenes = Object.fromEntries(Object.entries(specs).map(([name, spec]) => [name, inspect(name, spec)]));
assert.equal(scenes.authoring.result.ok, false, 'reproduce the reported admission STOP');
assert.equal(scenes.authoring.result.error.code, 'infeasible-embedding');
assert.equal(scenes.authoring.result.error.reason, 'cyclic-constraints');
const receipt = { status: 'STOP-cyclic-admission',
  scope: 'Read-only prerequisite. No materialized candidate or active B builder. The observer records the rejected graph without changing public output.',
  scenes: Object.fromEntries(Object.entries(scenes).map(([name, value]) => [name,
    { ...value, result: value.result.ok ? { ok: true, counts: value.result.value.counts } : value.result }])) };
writeFileSync(root + 'embedding/increment-b-amendment-stop.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ status: receipt.status, scenes: Object.fromEntries(Object.entries(scenes).map(([name, s]) => [name, {
  admitted: s.result.ok, unchangedBuildsTwice: s.baselineBuildsByteIdentical, equalsA: s.baselineEqualsA,
  preflightTwice: s.preflightsByteIdentical, vertices: s.vertices, constraints: s.constraints,
}])) }, null, 2));
delete globalThis.__m10fBGraph;
