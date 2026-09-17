/** M6.5a audit: fail closed on any serialized geometry or frozen-source delta. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createNestedRoadScene, fanInHubSceneSpec } from '../../../../../capability/layout/contract/index.ts';
const baseline = (path) => execFileSync('git', ['show', `b20053d:${path}`], { maxBuffer: 32 * 1024 * 1024 });
const spec = JSON.parse(baseline('output/playwright/nested-wires/templates-scene/scene-spec.json'));
function identical(name, scene, path) {
  const fresh = Buffer.from(JSON.stringify(scene, null, 2) + '\n');
  assert.deepEqual(fresh, baseline(path));
  console.log(`PASS ${name}: fresh public builder byte-identical to M6 b20053d; sha256=${createHash('sha256').update(fresh).digest('hex')}`);
}
identical('templates', createNestedRoadScene({ spec }), 'output/playwright/nested-wires/templates-scene/scene.json');
identical('nested', createNestedRoadScene({ spec: fanInHubSceneSpec }), 'output/playwright/nested-wires/scene.json');
execFileSync('git', ['diff', '--exit-code', 'b20053d', '--', 'capability/layout', 'apps/web', 'output/playwright/nested-wires/templates-scene/scene-spec.json']);
console.log('PASS all layout, routing, host sources and semantic scene spec unchanged from M6');
assert.equal(execFileSync('git', ['diff', '--name-only', '--diff-filter=A', 'b20053d', '--', '*.test.ts'], { encoding: 'utf8' }).trim(), '');
assert.equal(execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', '*.test.ts'], { encoding: 'utf8' }).trim(), '');
console.log('PASS zero new tracked or untracked *.test.ts files');
