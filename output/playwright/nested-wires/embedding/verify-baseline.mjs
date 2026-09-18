/** Offline public-contract byte gate. No builder, fixture, or baseline writes. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import * as current from '../../../../capability/layout/contract/index.ts';
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('tsx/package.json'))('esbuild');
const base = 'b9e098aab6bb66c3359211efecd721023c59f06f';
const bundle = await build({
  stdin: { contents: "export { createNestedRoadScene, defaultNestedSceneSpec, fanInHubSceneSpec, inspectNestedWires } from './capability/layout/contract/index.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false,
  plugins: [{ name: 'committed-baseline', setup(builder) {
    builder.onLoad({ filter: /\/capability\/.*\.ts$/ }, ({ path }) => ({
      contents: execFileSync('git', ['show', `${base}:${relative(process.cwd(), path)}`], { encoding: 'utf8' }),
      loader: 'ts', resolveDir: dirname(path),
    }));
  } }],
});
const baseline = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const root = 'output/playwright/nested-wires/';
const read = (path) => JSON.parse(readFileSync(root + path, 'utf8'));
const specs = { default: baseline.defaultNestedSceneSpec, hub: baseline.fanInHubSceneSpec,
  templates: read('templates-scene/scene-spec.json'), scale: read('scale-scene/scale-scene-spec.json'), authoring: read('authoring-scene/scene-spec.json') };
const hash = (text) => createHash('sha256').update(text).digest('hex');
const inspect = (api, scene) => Object.fromEntries(Object.entries(api.inspectNestedWires(scene, scene.wiring.value)).map(([key, value]) => [key, value.length]));
const scenes = Object.fromEntries(Object.entries(specs).map(([name, spec]) => {
  const old = baseline.createNestedRoadScene({ spec }), now = current.createNestedRoadScene({ spec });
  const oldText = JSON.stringify(old), nowText = JSON.stringify(now);
  assert.equal(oldText, JSON.stringify(baseline.createNestedRoadScene({ spec })), `${name}: baseline twice`);
  assert.equal(nowText, JSON.stringify(current.createNestedRoadScene({ spec })), `${name}: current twice`);
  assert.equal(nowText, oldText, `${name}: b9e098a bytes`);
  return [name, { baselineSha256: hash(oldText), currentSha256: hash(nowText), baselineBytes: Buffer.byteLength(oldText), currentBytes: Buffer.byteLength(nowText),
    byteEqual: true, baselineDeterministic: true, currentDeterministic: true,
    baselineInspection: inspect(baseline, old), currentInspection: inspect(current, now) }];
}));
assert.equal(scenes.authoring.currentInspection.nodeBodies, 40);
const report = { status: 'baseline-admitted', base,
  head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), scenes };
writeFileSync(root + 'embedding/increment-a-baseline-gate.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
