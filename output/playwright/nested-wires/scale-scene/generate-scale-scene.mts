/** Fixed-seed semantic fixture. Node owns I/O errors; rerun replaces the same bytes. */
import { writeFileSync } from 'node:fs';
import type { NestedSectionSpec } from '../../../../capability/layout/contract/index.ts';

const seed = 7007;
function nodes(first: number, names: readonly string[]) {
  return names.map((label, index) => ({ number: first + index, label: `${label}.ts` }));
}
const sections: readonly NestedSectionSpec[] = [
  {
    number: 1,
    nodes: nodes(1, ['kernel', 'brands', 'errors', 'types', 'api', 'index']),
    children: [
      { number: 2, nodes: nodes(7, ['store-port', 'clock-port']), children: [] },
      { number: 3, nodes: nodes(9, ['request', 'receipt']), children: [] },
    ],
  },
  {
    number: 4,
    nodes: [],
    children: [
      { number: 5, nodes: nodes(11, ['admit', 'normalize', 'authorize', 'plan']), children: [] },
      { number: 6, nodes: nodes(15, ['discover', 'catalog', 'match', 'select']), children: [] },
      { number: 7, nodes: nodes(19, ['expand', 'instantiate', 'bind', 'assemble']), children: [] },
      { number: 8, nodes: nodes(23, ['validate', 'diagnose', 'check', 'result']), children: [] },
    ],
  },
  {
    number: 9,
    nodes: nodes(27, ['memory-store', 'disk-store', 'system-clock', 'registry']),
    children: [],
  },
  { number: 10, nodes: nodes(31, ['resource', 'transaction', 'endpoint', 'server']), children: [] },
  { number: 11, nodes: nodes(35, ['client', 'presenter', 'shell']), children: [] },
  { number: 12, nodes: nodes(38, ['parse', 'execute', 'main']), children: [] },
];
function flatten(section: NestedSectionSpec): readonly NestedSectionSpec[] {
  return [section, ...section.children.flatMap(flatten)];
}
const groups = sections.flatMap(flatten);
const provider = [2, 3, 4, 5, 7, 9, 11, 15, 19, 23].map((to) => [1, to]);
const reexports = [5, 7, 8, 9, 10, 14, 18, 22, 26].map((from) => [from, 6]);
const chains = [
  [14, 15],
  [18, 19],
  [22, 23],
  [26, 27],
  [30, 31],
  [34, 35],
  [37, 38],
  [1, 31],
  [5, 35],
  [7, 38],
  [10, 40],
];
const localChains = groups.flatMap((section) =>
  section.nodes.slice(1).map((node, i) => [section.nodes[i].number, node.number]),
);
const candidates = groups.flatMap((section) =>
  section.nodes.flatMap((node, i) =>
    section.nodes.slice(i + 1).map((target) => [node.number, target.number]),
  ),
);
function priority(pair: readonly number[]) {
  return ((pair[0] * 73856093) ^ (pair[1] * 19349663) ^ seed) >>> 0;
}
const unique = new Map(
  [
    ...provider,
    ...reexports,
    ...chains,
    ...localChains,
    ...candidates.toSorted((a, b) => priority(a) - priority(b)),
  ].map((pair) => [pair.join('/'), pair]),
);
const requests = [...unique.values()].slice(0, 75);
const spec = { seed, sections, requests };
writeFileSync(
  new URL('scale-scene-spec.json', import.meta.url),
  JSON.stringify(spec, null, 2) + '\n',
);
console.log(
  `GENERATED seed=${seed}; top=${sections.length}; sections=${groups.length}; nodes=${groups.reduce((sum, group) => sum + group.nodes.length, 0)}; wires=${requests.length}; zero coordinates`,
);
