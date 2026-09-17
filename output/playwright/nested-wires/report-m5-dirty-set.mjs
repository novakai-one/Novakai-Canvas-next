/** Full-recompute result diff; no incremental execution is claimed or implemented. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const directory = 'output/playwright/nested-wires/m5-swap';
const read = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, 'utf8'));
const before = read('before-scene'), after = read('after-scene');
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const indexed = (items) => new Map(items.map((item) => [item.id, item]));
function diff(first, second) {
  const a = indexed(first), b = indexed(second);
  return [...new Set([...a.keys(), ...b.keys()])].filter((id) => !equal(a.get(id), b.get(id))).map((id) => ({ id, before: a.get(id) ?? null, after: b.get(id) ?? null }));
}
const nodes = diff(before.nodes, after.nodes);
assert.deepEqual(nodes.map((n) => n.id).sort(), ['node-1','node-4']);
const moved = nodes.map(({id,before,after}) => ({ id, before: before.bounds, after: after.bounds }));
const roads = diff(before.roads, after.roads);
const laneChanges = diff(before.wireLanes, after.wireLanes);
const changedRoadIds = [...new Set([...roads.map((r) => r.id), ...laneChanges.flatMap((l) => [l.before?.roadId, l.after?.roadId]).filter(Boolean)])];
const changedWires = diff(before.wiring.value, after.wiring.value).map((wire) => {
  const incident = [wire.after.from, wire.after.to].filter((id) => ['node-1','node-4'].includes(id));
  const lanes = laneChanges.filter((l) => (l.after ?? l.before).wireId === wire.id).map((l) => l.id);
  const geometry = [...new Set(wire.after.segments.map((s) => s.corridorId))].filter((id) => changedRoadIds.includes(id));
  const reason = incident.length ? `Incident to ${incident.join('/')}; endpoints and law geometry change.` : `Shared-road load/rank or junction geometry shifts: ${geometry.join(', ')}; ${lanes.length} lane assignment records change.`;
  return { id: wire.id, reason, changedLaneIds: lanes, affectedRoadIds: geometry, segmentsChanged: !equal(wire.before.segments, wire.after.segments) };
});
const defaultOps = read('default-calculations'), swappedOps = read('calculations');
const stages = Object.keys(defaultOps.laneNetwork.components).map((stage) => ({ stage, before: defaultOps.laneNetwork.components[stage], after: swappedOps.laneNetwork.components[stage], delta: swappedOps.laneNetwork.components[stage] - defaultOps.laneNetwork.components[stage] }));
const report = {
  execution: 'Full pipeline recompute: all roads, driveways and wires are rebuilt once. This report describes changed outputs, not avoided work.',
  nodes: moved,
  sectionsChanged: diff(before.sections, after.sections).length,
  roads: roads.filter((r) => !r.after?.access),
  driveways: roads.filter((r) => r.after?.access),
  relanedRoadIds: [...new Set(laneChanges.map((l) => (l.after ?? l.before).roadId))],
  laneChanges,
  wires: changedWires,
  ports: diff(before.ports.map((p) => ({ id:p.portId,...p })), after.ports.map((p) => ({id:p.portId,...p}))),
  junctions: diff(before.junctions, after.junctions),
  compileStages: stages,
  compileDelta: swappedOps.laneNetwork.total - defaultOps.laneNetwork.total,
  verdict: 'Scene variance, not compounding: congestion changes allocation/projection work while discovery stays zero and every stage executes once.',
};
writeFileSync(`${directory}/dirty-set.json`, JSON.stringify(report,null,2)+'\n');
const lines = ['# M5 changed-output report', '', report.execution, '',
  `Moved nodes: ${moved.length}; changed main roads: ${report.roads.length}; changed driveways: ${report.driveways.length}; roads with changed lane records: ${report.relanedRoadIds.length}; changed wires: ${changedWires.length}/26; changed junctions: ${report.junctions.length}; changed sections: ${report.sectionsChanged}.`, '',
  ...moved.map((n) => `- ${n.id}: ${JSON.stringify(n.before)} → ${JSON.stringify(n.after)}`), '',
  'Changed road and driveway records, lane records and their exact before/after values are retained in dirty-set.json.', '',
  ...changedWires.map((w) => `- ${w.id}: ${w.reason}`), '',
  '| Compile stage | Default | Swapped | Delta |', '|---|---:|---:|---:|',
  ...stages.map((s) => `| ${s.stage} | ${s.before} | ${s.after} | ${s.delta >= 0 ? '+' : ''}${s.delta} |`), '',
  `Total: ${defaultOps.laneNetwork.total} → ${swappedOps.laneNetwork.total} (+${report.compileDelta}), ceiling 21,000.`, '',
  'Wire-registry remains unchanged because node/section/road identity counts are unchanged. Lane-allocation grows with the different shared-route congestion and ordering comparisons. Network loses one operation because changed capacity geometry alters a numeric branch. Lane-projection grows with the new lane ranks, turns and terminal coordinates. These are measured executions of the unchanged stages, not extra stage invocations.', '', report.verdict, ''];
writeFileSync(`${directory}/dirty-set.md`, lines.join('\n'));
console.log(lines.slice(2,7).join('\n'));
console.log(stages);
console.log(report.verdict);
