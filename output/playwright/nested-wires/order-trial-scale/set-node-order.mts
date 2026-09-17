/** Human-override replica: apply an explicit per-section node order to a nested
 * scene spec, then rebuild through the real layout builder (`createNestedRoadScene`,
 * the same public contract the app calls in apps/web/cli/templates-scene.ts).
 *
 * The spec `nodes` array order is the placement-order field: the placement pass
 * (`gridNodes` in capability/layout/core/prototype-nested-placement.ts) lays nodes
 * row-major from top-left in exactly that order. Reordering it simulates a human
 * dragging nodes into this order, without pointer events.
 *
 * Usage:
 *   node --import tsx output/playwright/nested-wires/order-trial/set-node-order.mts \
 *     --spec <scene-spec.json> --order <order.json> --out <output-dir>
 *
 * Order map format (JSON object):
 *   { "section-1": ["node-6", "node-2", ...], "3": [10, 9], ... }
 * Section keys accept "section-N" or "N" (the spec's `number` field).
 * Node entries accept N, "node-N", or a label like "index.ts" (labels resolve
 * within the named section only). Each listed section's list must be an exact
 * permutation of its current nodes; unlisted sections keep their order. Requests
 * and wire metadata are never touched.
 *
 * Outputs (in --out, created if missing):
 *   scene-spec.json  rewritten spec (2-space JSON, trailing newline)
 *   scene.json       rebuilt scene from the real builder
 * Exits 1 if the rebuilt scene is not deterministic (two builds, byte-identical)
 * or if the order map is not an exact permutation for every listed section.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createNestedRoadScene } from '../../../../capability/layout/contract/index.ts';
import type {
  NestedNodeSpec,
  NestedSceneSpec,
  NestedSectionSpec,
} from '../../../../capability/layout/contract/index.ts';

interface SpecFile extends NestedSceneSpec {
  readonly wires?: readonly unknown[];
}

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0 || process.argv[index + 1] === undefined) {
    console.error(`missing ${name}; usage: --spec <spec.json> --order <order.json> --out <dir>`);
    process.exit(1);
  }
  return process.argv[index + 1] as string;
}

function sectionNumber(key: string): number {
  const number = Number(key.startsWith('section-') ? key.slice('section-'.length) : key);
  if (!Number.isInteger(number)) throw new Error(`unrecognized section key ${key}`);
  return number;
}

function nodeReference(reference: number | string, section: NestedSectionSpec): number {
  if (typeof reference === 'number') return reference;
  if (reference.startsWith('node-')) return Number(reference.slice('node-'.length));
  const byLabel = section.nodes.filter((node) => node.label === reference);
  if (byLabel.length !== 1) throw new Error(`label ${reference} not unique in section ${section.number}`);
  return (byLabel[0] as NestedNodeSpec).number;
}

function findSection(sections: readonly NestedSectionSpec[], number: number): NestedSectionSpec {
  for (const section of sections) {
    if (section.number === number) return section;
    try {
      return findSection(section.children, number);
    } catch {
      // keep searching siblings
    }
  }
  throw new Error(`section ${number} not found`);
}

function reorderSection(
  section: NestedSectionSpec,
  orders: ReadonlyMap<number, readonly number[]>,
): NestedSectionSpec {
  const wanted = orders.get(section.number);
  let nodes = section.nodes;
  if (wanted !== undefined) {
    const current = section.nodes.map((node) => node.number);
    const sameSet =
      wanted.length === current.length &&
      new Set(wanted).size === wanted.length &&
      wanted.every((number) => current.includes(number));
    if (!sameSet) {
      throw new Error(
        `section ${section.number}: order ${JSON.stringify(wanted)} is not an exact permutation of ${JSON.stringify(current)}`,
      );
    }
    nodes = wanted.map((number) => {
      const node = section.nodes.find((item) => item.number === number);
      if (node === undefined) throw new Error(`section ${section.number}: node ${number} missing`);
      return node;
    });
  }
  return {
    number: section.number,
    nodes,
    children: section.children.map((child) => reorderSection(child, orders)),
  };
}

const specPath = argument('--spec');
const orderPath = argument('--order');
const outDirectory = argument('--out');
const spec = JSON.parse(readFileSync(specPath, 'utf8')) as SpecFile;
const rawOrder = JSON.parse(readFileSync(orderPath, 'utf8')) as Record<
  string,
  readonly (number | string)[]
>;

const orders = new Map<number, readonly number[]>();
for (const [key, references] of Object.entries(rawOrder)) {
  const number = sectionNumber(key);
  const section = findSection(spec.sections, number);
  orders.set(
    number,
    references.map((reference) => nodeReference(reference, section)),
  );
}

const rewritten: SpecFile = {
  ...spec,
  sections: spec.sections.map((section) => reorderSection(section, orders)),
};

/** Same builder call shape as apps/web/cli/templates-scene.ts. */
function build() {
  return createNestedRoadScene({
    spec: {
      sections: rewritten.sections,
      requests: rewritten.requests.map(([from = 0, to = 0]) => [from, to] as const),
    },
  });
}

const first = build();
const second = build();
const firstJson = JSON.stringify(first);
const deterministic = firstJson === JSON.stringify(second);
if (!deterministic) {
  console.error('FAIL determinism: two complete builds differ');
  process.exit(1);
}
if (first.wiring?.ok !== true) {
  console.error(`FAIL routing: ${JSON.stringify(first.wiring)}`);
  process.exit(1);
}

mkdirSync(outDirectory, { recursive: true });
writeFileSync(join(outDirectory, 'scene-spec.json'), `${JSON.stringify(rewritten, null, 2)}\n`);
writeFileSync(join(outDirectory, 'scene.json'), `${JSON.stringify(first, null, 2)}\n`);

const summary = rewritten.sections.flatMap(function flatten(section: NestedSectionSpec): string[] {
  const own = `section-${section.number}: [${section.nodes.map((node) => `${node.number}:${node.label}`).join(', ')}]`;
  return [own, ...section.children.flatMap(flatten)];
});
console.log(`SPEC ${specPath}`);
console.log(`ORDER ${orderPath}`);
for (const line of summary) console.log(`APPLIED ${line}`);
console.log(
  `DETERMINISM byte-identical two builds: true (scene.json ${Buffer.byteLength(firstJson)} bytes)`,
);
console.log(`WROTE ${join(outDirectory, 'scene-spec.json')} and scene.json`);
