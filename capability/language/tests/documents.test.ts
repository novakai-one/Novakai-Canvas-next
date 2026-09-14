import { describe, it, expect } from 'vitest';
import { language, value, create, resources, object, section, rejected } from './fixtures.js';
import { prototype, contentSource, groupedSource, treeSource } from './domain-fixture.js';
describe('Language complete documents', () => {
  it('1 — compiles the complete prototype source with image, seven steps and seven labelled wires', () => {
    const parsed = value(language.parse(prototype));
    expect(parsed.resources).toHaveLength(2);
    const result = value(
      language.lower({ source: prototype, mode: 'create', snapshot: null, resources }),
    );
    expect(result.collection.objects.map((node) => node.step)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(result.collection.relationships.map((wire) => wire.label)).toEqual([
      'Clarify',
      'Prioritize',
      'Build',
      'Observe',
      'No · improve',
      'Try again',
      'Yes · explain',
    ]);
    expect(result.collection.assets[0]?.digest).toBe(resources.assets.wireframe?.digest);
    expect(
      section(result.collection, 'journey').layout.constraints.map((item) => item.kind),
    ).toEqual(['rank', 'rank', 'below', 'before']);
    expect(result.changes[0]?.op).toBe('replace-document');
    expect(result.collection.revision).toBe(0);
  });
  it('4 — preserves all textual content, tables, Unicode, escapes and descendant order', () => {
    const result = create(contentSource);
    const card = object(result, 'card');
    expect(card.content.map((block) => block.id)).toEqual([
      'intro',
      'code',
      'local',
      'external',
      'steps',
      'preview',
      'symbol',
      'facts',
    ]);
    expect(card.content[0]).toEqual({
      kind: 'text',
      id: 'intro',
      role: 'body',
      text: 'Unicode 🧠\nsecond line\tTabbed "quote" and \\ slash',
    });
    expect(card.content.at(-1)).toEqual({
      kind: 'table',
      id: 'facts',
      columns: ['Name', 'Value'],
      rows: [{ id: 'one', cells: ['a', 'b'] }],
    });
    const read = value(language.print({ collection: result, scope: { kind: 'all' } }));
    expect(create(read.source).objects).toEqual(result.objects);
    rejected(
      language.lower({
        source: contentSource.replace('row @one', 'row @intro'),
        mode: 'create',
        snapshot: null,
        resources,
      }),
      'domain',
    );
  });
  it('5 — lowers nested represented groups and scoped collection constraints without duplicate shows', () => {
    const result = create(groupedSource);
    const main = section(result, 'main');
    expect(
      main.groups.map((item) => ({
        id: item.id,
        parent: item.parent,
        represents: item.represents,
      })),
    ).toEqual([
      { id: 'outer', parent: undefined, represents: 'border' },
      { id: 'inner', parent: 'outer', represents: undefined },
    ]);
    expect(main.appearances.map((item) => ({ object: item.object, group: item.group }))).toEqual([
      { object: 'a', group: 'outer' },
      { object: 'b', group: 'inner' },
    ]);
    expect(result.arrangement).toEqual({
      algorithm: 'grid',
      direction: 'down',
      gap: 'roomy',
      constraints: [
        {
          kind: 'below',
          targets: [
            { kind: 'section', id: 'other' },
            { kind: 'section', id: 'main' },
          ],
        },
      ],
    });
    expect(
      create(value(language.print({ collection: result, scope: { kind: 'all' } })).source),
    ).toEqual(result);
  });
  it('6 — applies tree annotations and mode defaults, rejecting explicit incompatible layouts', () => {
    const result = create(treeSource);
    expect(section(result, 'map').layout.algorithm).toBe('tree');
    expect(section(result, 'map').root).toBe('topic');
    rejected(
      language.lower({
        source: treeSource.replace('mode=tree', 'mode=tree layout=flow'),
        mode: 'create',
        snapshot: null,
        resources,
      }),
      'domain',
    );
    rejected(
      language.lower({
        source: treeSource.replace(
          'show @topic @child @legend',
          'show @topic @child show @legend participation=tree',
        ),
        mode: 'create',
        snapshot: null,
        resources,
      }),
      'domain',
    );
  });
});
