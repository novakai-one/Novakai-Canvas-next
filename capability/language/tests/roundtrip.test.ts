import { describe, it, expect } from 'vitest';
import { language, value, create, graph, checked, pins, section, rejected } from './fixtures.js';
import { groupedSource } from './domain-fixture.js';
import { sequenceSource } from './engineering-fixtures.js';
describe('Language readout fidelity', () => {
  it('9 — retains exact pins and scoped semantic order while separating manual geometry', () => {
    const original = graph();
    const read = value(language.print({ collection: original, scope: { kind: 'all' } }));
    expect(read.revision).toBe(7);
    expect(read.source).toContain('theme="paper@1.0.0#sha256:');
    expect(read.source).not.toMatch(/(?:x|y|width|height)=/);
    expect(read.manual).toEqual([
      { target: '@flow/@a', kind: 'placement', locked: true },
      { target: '@flow/@ab', kind: 'route', locked: true },
    ]);
    const replacement = value(
      language.lower({
        source: read.source,
        mode: 'replace',
        snapshot: original,
        resources: pins(original),
      }),
    );
    expect(replacement.collection).toEqual(original);
    const sequence = create(sequenceSource);
    const reordered = checked({
      ...sequence,
      sections: sequence.sections.map((view) => ({
        ...view,
        sequence: [...view.sequence]
          .reverse()
          .map((item) => ({ ...item, order: item.order * 10 + 10 })),
      })),
    });
    const sequenceCopy = create(
      value(language.print({ collection: reordered, scope: { kind: 'all' } })).source,
    );
    expect(
      section(sequenceCopy, 'conversation').sequence.map((item) => ({
        id: item.id,
        parent: item.parent,
        branch: item.branch,
      })),
    ).toEqual(
      section(sequence, 'conversation').sequence.map((item) => ({
        id: item.id,
        parent: item.parent,
        branch: item.branch,
      })),
    );
    const grouped = create(groupedSource);
    const main = section(grouped, 'main');
    const interleaved = checked({
      ...grouped,
      sections: [
        { ...main, appearances: [...main.appearances, { object: 'border-extra' }] },
        ...grouped.sections.slice(1),
      ],
      objects: [...grouped.objects, { id: 'border-extra', kind: 'note', label: 'External' }],
    });
    const copy = create(
      value(language.print({ collection: interleaved, scope: { kind: 'all' } })).source,
    );
    expect(
      section(copy, 'main')
        .appearances.filter((item) => item.group === 'outer')
        .map((item) => item.object),
    ).toEqual(['a']);
    expect(
      section(copy, 'main')
        .appearances.filter((item) => item.group === undefined)
        .map((item) => item.object),
    ).toEqual(['border-extra']);
  });
  it('10 — section and object views cannot become whole-collection replacements when comments are removed', () => {
    const original = graph();
    for (const scope of [
      { kind: 'section', id: 'flow' },
      { kind: 'object', id: 'a' },
    ] as const) {
      const read = value(language.print({ collection: original, scope }));
      expect(read.source).toMatch(/^view 1 @demo revision=7 scope=/);
      const uncommented = read.source
        .split('\n')
        .filter((line) => !line.startsWith('#'))
        .join('\n');
      rejected(language.parse(uncommented), 'display-only');
      rejected(
        language.lower({
          source: uncommented,
          mode: 'replace',
          snapshot: original,
          resources: pins(original),
        }),
        'display-only',
      );
    }
  });
});
