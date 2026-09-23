import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import type { Collection } from '@novakai/canvas-model';
import type { LoweredIntent, Result } from '../contract/index.js';
import { language, resources, section, value } from './fixtures.js';

const examples = new URL('../../../resources/examples/', import.meta.url);

async function source(path: string): Promise<string> {
  return readFile(new URL(path, examples), 'utf8');
}
function lowered(text: string): Result<LoweredIntent> {
  return language.lower({ source: text, mode: 'create', snapshot: null, resources });
}
async function collectionOf(path: string): Promise<Collection> {
  return value(lowered(await source(path))).collection;
}
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
    const single = section(await collectionOf('language/declared/sequence.canvas'), 's');
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
    const all = section(await collectionOf('language/declared/all-modes.canvas'), 's-seq');
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
      { id: 'place-fragment-1', kind: 'fragment', operator: 'opt', label: 'a' },
      { parent: 'place-fragment-1' },
      { kind: 'event', message: 'call' },
      { id: 'place-fragment-2', kind: 'fragment', operator: 'opt', label: 'b' },
      { parent: 'place-fragment-2' },
    ]);
  });
});
