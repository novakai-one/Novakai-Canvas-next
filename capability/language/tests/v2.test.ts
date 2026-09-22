import { readFile } from 'node:fs/promises';
import { assert, describe, expect, it } from 'vitest';
import type { Collection } from '@novakai/canvas-model';
import type { LoweredIntent, Result } from '../contract/index.js';
import { checked, language, resources, section, value } from './fixtures.js';

const examples = new URL('../../../resources/examples/', import.meta.url);
const after = 'agent-diagrams/dsl-target/after.canvas';

async function source(path: string): Promise<string> {
  return readFile(new URL(path, examples), 'utf8');
}
function lowered(text: string): Result<LoweredIntent> {
  return language.lower({ source: text, mode: 'create', snapshot: null, resources });
}
async function collectionOf(path: string): Promise<Collection> {
  return value(lowered(await source(path))).collection;
}
function firstMessage(result: Result<unknown>): string {
  assert(!result.ok, 'Expected a typed rejection');
  return result.error.diagnostics[0].message;
}
/** Objects appearing in more than one section (folders lower to groups, not appearances), with counts. */
function repeated(collection: Collection): Record<string, number> {
  const shown = collection.sections.flatMap((view) => [
    ...new Set(view.appearances.map((item) => item.object)),
  ]);
  const counts = [...new Set(shown)].map(
    (id) => [id, shown.filter((item) => item === id).length] as const,
  );
  return Object.fromEntries(counts.filter(([, count]) => count > 1));
}

describe('after.canvas fixture', () => {
  it('lowers five sections and one change block, and Model accepts the collection', async () => {
    const result = lowered(await source(after));
    expect(result).not.toHaveProperty('error');
    const { collection } = value(result);
    expect(collection.id).toBe('ordering');
    expect(collection.sections.map((view) => [view.id, view.mode])).toEqual([
      ['s-tree', 'tree'],
      ['s-mod', 'modules'],
      ['s-er', 'er'],
      ['s-state', 'state'],
      ['s-seq', 'sequence'],
    ]);
    expect(collection.changes).toHaveLength(1);
    expect(collection.changes[0]?.entries.map((entry) => entry.status)).toEqual([
      'new',
      'new',
      'changed',
      'changed',
      'locked',
    ]);
    // corpus.test.ts proves a lowered collection by printing and re-lowering it; the v2 printer is
    // deferred (row 6), so this proves it through Model's public validate instead.
    expect(checked(collection)).toEqual(collection);
  });
});

const modes = ['tree', 'modules', 'er', 'state', 'flow', 'grid', 'story', 'sequence'];
it.each([
  ...modes.map((mode) => [`${mode}.canvas`, [mode], 0, {}] as const),
  ['all-modes.canvas', modes, 1, { orders: 3, pricing: 3 }] as const,
  ['er-three.canvas', ['er', 'er', 'er'], 0, { Order: 3 }] as const,
])('v2 fixture %s lowers to modes %j', async (file, expected, changeBlocks, shared) => {
  const result = lowered(await source(`language/v2/${file}`));
  expect(result).not.toHaveProperty('error');
  const { collection } = value(result);
  expect(collection.sections.map((view) => view.mode)).toEqual(expected);
  expect(collection.changes).toHaveLength(changeBlocks);
  expect(repeated(collection)).toEqual(shared);
});

const separatedAlts = `canvas 2
declare @d {
  node @user participant "User"
  node @orders module "orders.ts" {
    signature @placeOrder parameters=["lines": string] returns=string
  }
  scenario @place "Place" {
    alt "a" { call @user -> @orders.@placeOrder }
    call @user -> @orders.@placeOrder
    alt "b" { call @user -> @orders.@placeOrder }
  }
}
collection @c "C" uses=@d {
  section @s "S" mode=sequence { show @place }
}`;

describe('scenario lowers to a sequence section', () => {
  it('carries the scenario, labels arrows with the signature id and folds alts into fragments', async () => {
    const single = section(await collectionOf('language/v2/sequence.canvas'), 's');
    expect(single.scenario).toEqual({ id: 'place', title: 'Place an order' });
    expect(single.appearances.map((item) => item.object)).toEqual(['user', 'orders', 'pricing']);
    expect(single.sequence).toMatchObject([
      { kind: 'event', message: 'call', source: 'user', target: 'orders', label: 'placeOrder' },
      { kind: 'event', message: 'call', source: 'orders', target: 'pricing', label: 'priceOrder' },
      {
        kind: 'event',
        message: 'return',
        source: 'pricing',
        target: 'orders',
        label: 'priceOrder',
      },
      { id: 'place-fragment-1', kind: 'fragment', operator: 'opt', label: 'invalid lines' },
      { kind: 'event', parent: 'place-fragment-1', label: 'priceOrder' },
    ]);
    const all = section(await collectionOf('language/v2/all-modes.canvas'), 's-seq');
    expect(all.scenario).toEqual({ id: 'reprice', title: 'Reprice an order' });
    const fragment = 'reprice-fragment-1';
    expect(all.sequence).toMatchObject([
      { kind: 'event', message: 'call', source: 'shopper', target: 'orders', label: 'getOrder' },
      { kind: 'event', message: 'return', source: 'orders', target: 'shopper', label: 'getOrder' },
      { id: fragment, kind: 'fragment', operator: 'alt', label: 'priced / no price' },
      { message: 'call', parent: fragment, branch: `${fragment}-branch-1`, label: 'priceOrder' },
      { message: 'return', parent: fragment, branch: `${fragment}-branch-1`, label: 'priceOrder' },
      { message: 'call', parent: fragment, branch: `${fragment}-branch-2`, label: 'priceOrder' },
    ]);
    const separated = section(value(lowered(separatedAlts)).collection, 's');
    expect(separated.sequence).toMatchObject([
      { id: 'place-fragment-1', kind: 'fragment', label: 'a' },
      { parent: 'place-fragment-1' },
      { kind: 'event', message: 'call' },
      { id: 'place-fragment-2', kind: 'fragment', label: 'b' },
      { parent: 'place-fragment-2' },
    ]);
  });
});

const changedTwice = `canvas 2
declare @d {
  node @a step "A"
  change @one "One" { deleted @a }
  change @two "Two" { changed @a }
}
collection @c "C" uses=@d {
  section @s "S" mode=flow { show @a }
}`;

describe('delta: change block', () => {
  it('lowers each entry with its declared status and rejects one target in two blocks', async () => {
    const collection = await collectionOf(after);
    expect(collection.changes).toEqual([
      {
        id: 'pricing-split',
        title: 'Move pricing out of orders',
        entries: [
          { status: 'new', target: { kind: 'object', object: 'pricing' } },
          { status: 'new', target: { kind: 'relationship', relationship: 'i1' } },
          { status: 'changed', target: { kind: 'object', object: 'orders' } },
          { status: 'changed', target: { kind: 'object', object: 'Order', member: 'total' } },
          { status: 'locked', target: { kind: 'object', object: 'Customer' } },
        ],
      },
    ]);
    expect(firstMessage(lowered(changedTwice))).toMatch(/^E112 /u);
  });
});
