/** Full serialization and runner identity gates; Node owns fail-fast recovery. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createNestedRoadScene, fanInHubSceneSpec } from '../../../../capability/layout/contract/index.ts';
const root = 'output/playwright/nested-wires/';
const baseline = (path) => execFileSync('git', ['show', `f77907c:${path}`], {maxBuffer: 16 * 1024 * 1024, encoding: 'utf8'});
const templates = JSON.parse(readFileSync(root + 'templates-scene/scene-spec.json', 'utf8'));
for (const [name, path, spec] of [['nested', 'scene.json', fanInHubSceneSpec], ['templates', 'templates-scene/scene.json', templates]]) {
  const bytes = JSON.stringify(createNestedRoadScene({spec}), null, 2) + '\n';
  assert.equal(bytes, baseline(root + path));
  assert.equal(bytes, readFileSync(root + path, 'utf8'));
  console.log(`PASS ${name}: full fresh scene and committed artifact byte-identical to f77907c; sha256=${createHash('sha256').update(bytes).digest('hex')}`);
}
const runner = 'apps/web/cli/verify-selection.mjs';
const body = readFileSync(runner);
assert.equal(body.toString(), baseline(runner));
console.log(`PASS selection runner byte-identical; sha256=${createHash('sha256').update(body).digest('hex')}`);
assert.equal(execFileSync('git', ['diff', '--name-only', '--diff-filter=A', '8082038', '--', '*.test.ts'], {encoding:'utf8'}), '');
assert.equal(execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', '*.test.ts'], {encoding:'utf8'}), '');
assert.equal(execFileSync('git', ['branch', '--show-current'], {encoding:'utf8'}).trim(), 'feat/m7-scale');
console.log('PASS zero new tracked/untracked *.test.ts; branch feat/m7-scale');
const scaleSpec = JSON.parse(readFileSync(root + 'scale-scene/scale-scene-spec.json', 'utf8'));
const scaleBytes = execFileSync('git', ['show', `fb86264:${root}scale-scene/scene.json`], {encoding:'utf8',maxBuffer:16*1024*1024});
assert.equal(JSON.stringify(createNestedRoadScene({spec:scaleSpec}),null,2)+'\n', scaleBytes);
for (const spec of [fanInHubSceneSpec, templates, scaleSpec]) {
  assert.equal(JSON.stringify(createNestedRoadScene({spec,sectionInPortsLeft:false})), JSON.stringify(createNestedRoadScene({spec})));
}
console.log('PASS sectionInPortsLeft omitted == false for all three scenes; scale bytes unchanged from Part B fb86264');
for (const path of ['nested-wire-law.ts','nested-wire-routing.ts','nested-wire-registry.ts','prototype-road-junction-union.ts']) {
  const file = `capability/layout/core/${path}`;
  assert.equal(readFileSync(file,'utf8'),baseline(file));
}
console.log('PASS routing law, gate routing, registry and junction-union bodies unchanged from f77907c');
