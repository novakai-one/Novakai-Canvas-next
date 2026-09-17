/** Derive the Variant A ordering map for a nested scene spec, deterministically:
 * in every section, `index.ts` first (top-left) — or the highest in+out-degree
 * node when the section has no index.ts — then remaining nodes by descending
 * request connectivity to already-placed nodes (greedy; ties by ascending node
 * number). Requests count in both directions and with multiplicity.
 *
 * Usage:
 *   node --import tsx output/playwright/nested-wires/order-trial/derive-variant-a-order.mts \
 *     --spec <scene-spec.json> --out <order.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type {
  NestedSceneSpec,
  NestedSectionSpec,
} from '../../../../capability/layout/contract/index.ts';

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0 || process.argv[index + 1] === undefined) {
    console.error(`missing ${name}; usage: --spec <spec.json> --out <order.json>`);
    process.exit(1);
  }
  return process.argv[index + 1] as string;
}

const spec = JSON.parse(readFileSync(argument('--spec'), 'utf8')) as NestedSceneSpec;

const degrees = new Map<number, number>();
const adjacency = new Map<number, Map<number, number>>();
for (const [from, to] of spec.requests) {
  degrees.set(from, (degrees.get(from) ?? 0) + 1);
  degrees.set(to, (degrees.get(to) ?? 0) + 1);
  for (const [a, b] of [
    [from, to],
    [to, from],
  ] as const) {
    const row = adjacency.get(a) ?? new Map<number, number>();
    row.set(b, (row.get(b) ?? 0) + 1);
    adjacency.set(a, row);
  }
}

function orderSection(section: NestedSectionSpec): readonly number[] {
  const remaining = section.nodes.map((node) => node.number);
  const hub =
    section.nodes.find((node) => node.label === 'index.ts')?.number ??
    remaining
      .slice()
      .sort((a, b) => (degrees.get(b) ?? 0) - (degrees.get(a) ?? 0) || a - b)[0];
  if (hub === undefined) return [];
  const placed: number[] = [hub];
  remaining.splice(remaining.indexOf(hub), 1);
  while (remaining.length > 0) {
    const next = remaining
      .slice()
      .sort((a, b) => {
        const score = (candidate: number) =>
          placed.reduce(
            (sum, placedNode) => sum + (adjacency.get(candidate)?.get(placedNode) ?? 0),
            0,
          );
        return score(b) - score(a) || a - b;
      })[0] as number;
    placed.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }
  return placed;
}

const order: Record<string, readonly number[]> = {};
const readable: string[] = [];
(function walk(sections: readonly NestedSectionSpec[]) {
  for (const section of sections) {
    if (section.nodes.length > 0) {
      const placed = orderSection(section);
      order[`section-${section.number}`] = placed;
      const labels = placed.map(
        (number) => section.nodes.find((node) => node.number === number)?.label ?? '?',
      );
      readable.push(`section-${section.number}: ${placed.map((n, i) => `${n}:${labels[i]}`).join(', ')}`);
    }
    walk(section.children);
  }
})(spec.sections);

writeFileSync(argument('--out'), `${JSON.stringify(order, null, 2)}\n`);
for (const line of readable) console.log(`ORDER ${line}`);
console.log(`WROTE ${argument('--out')}`);
