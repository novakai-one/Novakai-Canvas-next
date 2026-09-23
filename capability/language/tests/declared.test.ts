import { readdirSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assert, describe, expect, it } from 'vitest';
import type { Collection } from '@novakai/canvas-model';
import type { LoweredIntent, Result } from '../contract/index.js';
import { checked, language, resources, value } from './fixtures.js';

const examples = new URL('../../../resources/examples/', import.meta.url);
const ordering = 'language/declared/ordering.canvas';
const canvasNames = readdirSync(fileURLToPath(new URL('language/declared/rejected/', examples)))
  .filter((name) => name.endsWith('.canvas'))
  .map((name) => name.replace(/\.canvas$/, ''))
  .toSorted();

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

describe('ordering.canvas fixture', () => {
  it('lowers five sections and one change block, and Model accepts the collection', async () => {
    const result = lowered(await source(ordering));
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
    // This proves the lowered collection through Model's public validate.
    expect(checked(collection)).toEqual(collection);
  });
});

const modes = ['tree', 'modules', 'er', 'state', 'flow', 'grid', 'story', 'sequence'];
it.each([
  ...modes.map((mode) => [`${mode}.canvas`, [mode], 0, {}] as const),
  ['all-modes.canvas', modes, 1, { orders: 3, pricing: 3 }] as const,
  ['er-three.canvas', ['er', 'er', 'er'], 0, { Order: 3 }] as const,
])('declared fixture %s lowers to modes %j', async (file, expected, changeBlocks, shared) => {
  const result = lowered(await source(`language/declared/${file}`));
  expect(result).not.toHaveProperty('error');
  const { collection } = value(result);
  expect(collection.sections.map((view) => view.mode)).toEqual(expected);
  expect(collection.changes).toHaveLength(changeBlocks);
  expect(repeated(collection)).toEqual(shared);
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
    const collection = await collectionOf(ordering);
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
    expect(firstMessage(lowered(changedTwice))).toBe(
      'E112 delta: @a is in @one and @two. Keep one.',
    );
  });
});

describe('rejected declared fixtures', () => {
  it('has one .expected sidecar per rejected fixture', async () => {
    const files = await readdir(new URL('language/declared/rejected/', examples));
    const canvases = files.filter((name) => name.endsWith('.canvas')).toSorted();
    const expecteds = files.filter((name) => name.endsWith('.expected')).toSorted();
    expect(expecteds).toEqual(canvases.map((name) => name.replace(/\.canvas$/, '.expected')));
  });

  it.each(canvasNames)('rejected/%s.canvas fails with its sidecar message', async (name) => {
    const message = (await source(`language/declared/rejected/${name}.expected`)).trim();
    const result = lowered(await source(`language/declared/rejected/${name}.canvas`));
    expect(result.ok).toBe(false);
    expect(firstMessage(result)).toBe(message);
  });
});
