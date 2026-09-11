import { describe, it, expect, assert } from 'vitest';
import { plan, stage } from '@novakai/canvas-model';
import { createLanguage } from '../contract/index.js';
import { language, value, resources, graph, pins, rejected } from './fixtures.js';
describe('Language correction and safety boundaries', () => {
  it('16 — reports typed diagnostics with precise spans for unknown syntax and wrong values', () => {
    const source = 'canvas 1\ncollection @bad "Bad" {\n node @a step "A" colour=red {}\n}';
    const result = language.parse(source);
    rejected(result, 'unknown-property');
    assert(!result.ok);
    const issue = result.diagnostics[0];
    expect(issue?.span.start).toEqual({ offset: source.indexOf('colour'), line: 3, column: 19 });
    expect(issue?.target).toBe('colour');
    expect(issue?.expected).toContain('role');
    expect(issue?.recovery).toContain('Retain');
    const unmatched = 'canvas 1 collection @demo "Demo" { node @a step "A" { text @t " } }';
    rejected(language.parse(unmatched), 'syntax');
    rejected(
      language.lower({ source: unmatched, mode: 'create', snapshot: null, resources }),
      'syntax',
    );
    const emptyText = 'canvas 1 collection @demo "Demo" { node @a step "A" { text @t "" } }';
    expect(
      value(language.lower({ source: emptyText, mode: 'create', snapshot: null, resources }))
        .collection.objects[0]?.content[0],
    ).toMatchObject({ kind: 'text', text: '' });
    rejected(language.parse('canvas 2 collection @bad "Bad" {}'), 'unsupported-version');
    rejected(
      language.parse('canvas 1 collection @bad "Bad" { node @a mystery "A" {} }'),
      'invalid-value',
    );
    rejected(language.parse(String.raw`canvas 1 collection @bad "Bad\q" {}`), 'syntax');
    rejected(
      language.parse('canvas 1 collection @bad "Bad" { node @a step "A" step=false {} }'),
      'invalid-value',
    );
  });
  it('17 — bounds source/tokens/nesting and contains caller/provider faults without unchecked candidates', () => {
    rejected(language.parse('#' + 'a'.repeat(16 * 1024 * 1024)), 'limit');
    rejected(language.parse('word '.repeat(250001)), 'limit');
    rejected(
      language.parse('patch 1 @demo {' + 'set node @a label="A" '.repeat(1001) + '}'),
      'limit',
    );
    const nested =
      'canvas 1 collection @deep "Deep" { section @s "S" {' +
      'group @g "G" {'.repeat(65) +
      '}'.repeat(67);
    rejected(language.parse(nested), 'limit');
    const broken = createLanguage({
      reader: {
        validate: () => {
          throw new Error('Provider unavailable');
        },
      },
      planner: { plan },
      stage: { stage },
    });
    rejected(
      broken.lower({
        source: 'canvas 1 collection @demo "Demo" {}',
        mode: 'create',
        snapshot: null,
        resources,
      }),
      'provider-failure',
    );
    const original = graph();
    const input = {
      source: 'patch 1 @demo { set node @a label="Changed" }',
      mode: 'patch' as const,
      snapshot: original,
      resources: pins(original),
    };
    const result = value(language.lower(input));
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(result.collection)).toBe(true);
    expect(original.objects[0]?.label).toBe('A');
    rejected(language.parse('canvas 1 collection @bad "\ud800" {}'), 'invalid-input');
  });
  it('18 — describes the shipped vocabulary and refuses unknown stored fields or unresolved resources', () => {
    const description = value(language.describe());
    expect(description.constructs.map((item) => item.kind)).toEqual(
      expect.arrayContaining([
        'node',
        'wire',
        'field',
        'keygroup',
        'signature',
        'port',
        'fragment',
        'group',
        'table',
      ]),
    );
    expect(description.operations).toEqual(
      expect.arrayContaining(['add', 'set', 'unset', 'replace', 'reset']),
    );
    expect(description.defaults.sourceStatus).toBe('unverified');
    expect(description.patchTargets.wire['from-end']).toMatchObject({
      type: 'endpoint',
      field: 'source',
    });
    for (const example of description.examples) expect(language.parse(example).ok).toBe(true);
    rejected(
      language.print({ collection: { ...graph(), futureExtension: true }, scope: { kind: 'all' } }),
      'domain',
    );
    const missing =
      'canvas 1 collection @demo "Demo" { asset @missing image source="not-on-disk.svg" alt="Missing" }';
    expect(value(language.parse(missing)).resources[1]).toMatchObject({
      source: 'not-on-disk.svg',
      alias: 'missing',
    });
    rejected(
      language.lower({ source: missing, mode: 'create', snapshot: null, resources }),
      'missing-resource',
    );
  });
});
