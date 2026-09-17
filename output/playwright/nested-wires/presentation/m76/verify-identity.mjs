/** Fail closed on any serialized scene, verifier, layout or selection-runner drift. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createNestedRoadScene, fanInHubSceneSpec, auditRoadCoverage } from '../../../../../capability/layout/contract/index.ts';
const baseline = path => execFileSync('git', ['show', `d720e7f:${path}`], {maxBuffer: 32*1024*1024});
for (const [name, specPath, scenePath] of [
  ['nested', null, 'output/playwright/nested-wires/scene.json'],
  ['templates','output/playwright/nested-wires/templates-scene/scene-spec.json','output/playwright/nested-wires/templates-scene/scene.json'],
  ['scale','output/playwright/nested-wires/scale-scene/scale-scene-spec.json','output/playwright/nested-wires/scale-scene/scene.json'],
]) {
  const spec = specPath ? JSON.parse(readFileSync(specPath)) : fanInHubSceneSpec;
  const scene = createNestedRoadScene({spec});
  const bytes = Buffer.from(JSON.stringify(scene,null,2)+'\n');
  assert.deepEqual(bytes,baseline(scenePath));
  assert.deepEqual(readFileSync(scenePath),bytes);
  const coverage = auditRoadCoverage(scene);
  assert.equal(coverage.uncoveredArea,0);
  assert.equal(coverage.multiplyOwnedArea,0);
  assert.equal(coverage.outsideRoadArea,0);
  console.log(`PASS ${name}: full fresh bytes identical to d720e7f; sha256=${createHash('sha256').update(bytes).digest('hex')}; offline road audit=${JSON.stringify(coverage)}`);
}
for (const path of ['capability/layout','apps/web/cli/verify-selection.mjs', 'apps/web/cli/templates-scene.ts', 'apps/web/cli/scale-scene.ts', 'output/playwright/nested-wires/verify-invariants.mjs', 'output/playwright/nested-wires/verify-m45-topological-bound.py','output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs','output/playwright/nested-wires/scale-scene/verify-scale-scene.mjs']) {
  execFileSync('git',['diff','--exit-code','d720e7f','--',path]);
}
assert.equal(execFileSync('git',['diff','--name-only','--diff-filter=A','d720e7f','--','*.test.ts'],{encoding:'utf8'}).trim(),'');
assert.equal(execFileSync('git',['ls-files','--others','--exclude-standard','--','*.test.ts'],{encoding:'utf8'}).trim(),'');
console.log('PASS layout, scene decorators, invariant suites and selection runner untouched; zero new *.test.ts');
