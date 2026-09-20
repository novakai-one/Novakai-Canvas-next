import { describe, expect, it } from 'vitest';
import { language, value, create, resources } from './fixtures.js';

const source = `canvas 1
collection @definitions "Definitions" {
  type @actor "Actor" = "A|B" | 1.5
  type @alias "Alias" = "X" | (@actor | "Y")
  node @people entity "People" {
    field @kind "kind" type=@alias
  }
  section @data "Data" mode=er { show @people }
}`;

describe('shared definition expressions', () => {
  it('roundtrips quoted pipes, decimals, nested unions and transitive scoped definitions', () => {
    const collection = create(source);
    const actor = collection.definitions.find((item) => item.id === 'actor');
    const alias = collection.definitions.find((item) => item.id === 'alias');
    expect(actor?.expression).toEqual({
      kind: 'union',
      items: [
        { kind: 'literal', value: 'A|B' },
        { kind: 'literal', value: 1.5 },
      ],
    });
    expect(alias?.expression).toEqual({
      kind: 'union',
      items: [
        { kind: 'literal', value: 'X' },
        {
          kind: 'union',
          items: [
            { kind: 'reference', id: 'actor' },
            { kind: 'literal', value: 'Y' },
          ],
        },
      ],
    });

    const printed = value(language.print({ collection, scope: { kind: 'all' } }));
    expect(printed.source).toContain('type @alias "Alias" = "X" | (@actor | "Y")');
    expect(create(printed.source).definitions).toEqual(collection.definitions);

    const scoped = value(language.print({ collection, scope: { kind: 'object', id: 'people' } }));
    expect(scoped.source).toContain('type @alias');
    expect(scoped.source).toContain('type @actor');
  });

  it('publishes compact definition syntax and full-source editing metadata', () => {
    const description = value(language.describe());
    expect(description.definitionSyntax).toBe('type @id "Label" = <expression>');
    expect(description.definitionEditing).toBe('full-source-replacement');
  });

  it('keeps collection-local definition aliases when expanding a recipe root', () => {
    const expanded = value(language.expand({ source, namespace: 'new', resources }));
    expect(expanded.collection.id).toBe('new');
    expect(expanded.collection.definitions.map((item) => item.id)).toEqual(['actor', 'alias']);
    expect(expanded.collection.objects[0]?.id).toBe('people');
    expect(expanded.collection.objects[0]?.content[0]).toMatchObject({
      kind: 'field',
      type: { kind: 'definition', id: 'alias' },
    });
    expect(expanded.changes[0]).toEqual({ op: 'replace-document', value: expanded.collection });
    expect(expanded.sourceMap).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'definitions.actor' }),
      expect.objectContaining({ path: 'definitions.actor.expression' }),
    ]));
  });
});
