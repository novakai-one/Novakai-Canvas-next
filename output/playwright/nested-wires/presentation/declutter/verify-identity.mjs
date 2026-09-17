/** M6.5b evidence: fail closed; Node reports failures, rerun replaces only current evidence. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createNestedRoadScene, fanInHubSceneSpec } from '../../../../../capability/layout/contract/index.ts';
import { buildTemplatesScene } from '../../../../../apps/web/cli/templates-scene.ts';
const baseline = (path) => execFileSync('git', ['show', `b20053d:${path}`], { maxBuffer: 32 * 1024 * 1024 });
const specPath = 'output/playwright/nested-wires/templates-scene/scene-spec.json';
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const { wires, ...semantic } = spec;
assert.deepEqual(semantic, JSON.parse(baseline(specPath)));
assert.equal(wires.length, spec.requests.length);
assert.equal(new Set(wires.map(wire => wire.id)).size, wires.length);
function identical(name, scene, path) {
  const fresh = Buffer.from(JSON.stringify(scene, null, 2) + '\n');
  assert.deepEqual(fresh, baseline(path));
  console.log(`PASS ${name}: fresh public builder byte-identical to M6 b20053d; sha256=${createHash('sha256').update(fresh).digest('hex')}`);
}
const scenePath = 'output/playwright/nested-wires/templates-scene/scene.json';
identical('templates from label-extended spec (no output exclusion)', createNestedRoadScene({ spec }), scenePath);
identical('nested (no exclusion)', createNestedRoadScene({ spec: fanInHubSceneSpec }), 'output/playwright/nested-wires/scene.json');
const hosted = buildTemplatesScene({ measure: (_stage, run) => run() });
assert(hosted.wiring.ok);
assert.deepEqual(hosted.wiring.value.map(({ id, label }) => ({ id, label })), wires);
const withoutLabels = structuredClone(hosted);
withoutLabels.wiring.value.forEach(wire => { delete wire.label; });
// Reproduce only the directory caption decoration already present in the committed M6 host.
const hostSource = baseline('apps/web/cli/templates-scene.ts').toString();
const directories = [...hostSource.match(/const directories = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
const expectedHost = JSON.parse(baseline(scenePath));
expectedHost.sections.forEach((section, index) => { section.label = directories[index]; });
assert.deepEqual(withoutLabels, expectedHost);
console.log('PASS templates host: every field equals M6 host output after deleting ONLY wiring.value[*].label; M6 directory captions retained');
assert.equal(wires.find(wire => wire.id === 'w22').label, 'hashContent + 4 more');
assert.deepEqual(spec.requests[21], [15, 12]);
const plan = readFileSync('capability/templates/core/admission/plan.ts', 'utf8');
assert.match(plan, /import \{ hashContent, validateCatalog, checkPayload, key, pinOf \} from '..\/validation\/catalog.js'/);
console.log('PASS catalog.ts -> plan.ts w22: hashContent, validateCatalog, checkPayload, key, pinOf => hashContent + 4 more');
execFileSync('git', ['diff', '--exit-code', 'b20053d', '--', 'capability/layout/core']);
assert.equal(execFileSync('git', ['diff', '--name-only', '--diff-filter=A', 'b20053d', '--', '*.test.ts'], { encoding: 'utf8' }).trim(), '');
assert.equal(execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', '*.test.ts'], { encoding: 'utf8' }).trim(), '');
const runner = 'apps/web/cli/verify-selection.mjs';
assert.deepEqual(readFileSync(runner), baseline(runner));
console.log('PASS layout core and inherited selection runner unchanged; zero new *.test.ts files');
