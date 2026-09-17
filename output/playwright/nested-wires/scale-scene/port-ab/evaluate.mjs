/** Summarize actual A/B outputs. Null means no compiled graph, never zero crossings. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createNestedRoadScene } from '../../../../../capability/layout/contract/index.ts';
const directory = new URL('./', import.meta.url);
const json = (file) => JSON.parse(readFileSync(new URL(file, directory), 'utf8'));
const output = (file) => readFileSync(new URL(file, directory), 'utf8');
const specs = { templates: json('../../templates-scene/scene-spec.json'), scale: json('../scale-scene-spec.json') };
function audit(file) {
  const text = output(file);
  const crossing = text.match(/^CROSSINGS (.+)$/m);
  const certificate = text.match(/^CERTIFICATION (\d+) certified \/ (\d+) uncertified$/m);
  return {
    perSectionCrossings: crossing ? JSON.parse(crossing[1]) : null,
    certification: certificate ? {certified:Number(certificate[1]),uncertified:Number(certificate[2])} : null,
    failures: text.split('\n').filter((line) => line.startsWith('FAIL ')),
  };
}
function metrics(name, left, operationsFile, auditFile) {
  const scene = createNestedRoadScene({spec:specs[name],sectionInPortsLeft:left});
  assert.deepEqual(scene, createNestedRoadScene({spec:specs[name],sectionInPortsLeft:left}));
  const ops = json(operationsFile);
  if (!scene.wiring.ok) return {
    name,sectionInPortsLeft:left,status:'FAIL',routing:scene.wiring,
    totalWireLength:null,perSectionCrossings:null,certification:null,compileOperations:null,
    completedCompileOperations:ops.completedCompileOperations,
    reason:'No compiled wire graph: routing fails before lane allocation, network and projection.',
  };
  const inspection = audit(auditFile);
  return {
    name,sectionInPortsLeft:left,status:inspection.failures.length ? 'FAIL' : 'PASS',
    totalWireLength:scene.wiring.value.reduce((sum,wire) => sum + wire.segments.reduce((n,s) => n + Math.abs(s.to.x-s.from.x)+Math.abs(s.to.y-s.from.y),0),0),
    ...inspection,compileOperations:ops.compile.total,routingOperations:ops.wireRouting.total,
  };
}
const cases = [
  metrics('templates',false,'../templates-operations.json','../ruling5-templates.txt'),
  metrics('templates',true,'templates-ports-left-operations.json','templates-left-invariants.txt'),
  metrics('scale',false,'../operations.json','../ruling5-invariants.txt'),
  metrics('scale',true,'scale-ports-left-operations.json','scale-left-ops-output.txt'),
];
const report = {
  interpretation:'Top entrance moved to left edge at height/3; existing left entrance at 2*height/3. Stable port identities retained. Evaluation only, default false.',
  cases,
  recommendation:'Do not adopt the left-edge variant. Templates increases crossings and wire length and fails forward-lane/gate-mouth/topological certification. Scale cannot route w27 (kernel.ts to resource.ts) under the unchanged law. Retain current entrances and revisit topology before adoption. Moving a top-edge mouth leftward is a different experiment requiring clarified intent.',
  complete:false,
};
writeFileSync(new URL('comparison.json',directory),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
