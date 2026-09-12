/** Public Language scenarios are replayable; Vitest owns assertion reporting and the developer corrects regressions before rerunning. */
import { describe, it, expect, assert } from 'vitest';
import {
  language,
  value,
  create,
  edit,
  graph,
  checked,
  pins,
  section,
  rejected,
} from './fixtures.js';
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

/** Pure create/read/patch/replacement uses Model admission; failed edits retain the caller's snapshot. */
it('grid columns round-trip and edit independently without colliding with table columns', (): void => {
  const original = create(`canvas 1 collection @tracks "Tracks" columns=2 {
    node @a note "A" { table @facts columns=["Name"] { row @one cells=["Value"] } }
    section @main "Main" mode=grid columns=3 {
      group @outer "Outer" layout=grid columns=1 {
        group @inner "Inner" layout=grid columns=12 { show @a }
      }
    }
    section @other "Other" mode=grid columns=4 { show @a }
  }`);
  const printed = value(language.print({ collection: original, scope: { kind: 'all' } })).source;
  expect(create(printed)).toEqual(original);
  expect(printed).not.toMatch(/(?:x|y|width|height)=/);
  expect(printed).toContain('columns=["Name"]');
  const changed = edit(
    original,
    'set collection columns=1 set section @main columns=2 set section @other title="Renamed"',
  );
  expect(changed.arrangement.columns).toBe(1);
  expect(section(changed, 'main').layout.columns).toBe(2);
  expect(section(changed, 'other').layout.columns).toBe(4);
  expect(section(changed, 'main').groups).toEqual(section(original, 'main').groups);
  const reset = edit(changed, 'unset collection columns unset section @main columns');
  expect(reset.arrangement).not.toHaveProperty('columns');
  expect(section(reset, 'main').layout).not.toHaveProperty('columns');
  const replaced = edit(
    reset,
    `replace section @main "Main" mode=grid columns=2 {
    group @outer "Outer" layout=grid columns=3 {
      group @inner "Inner" layout=grid columns=1 { show @a }
    }
  }`,
  );
  expect(
    section(replaced, 'main').groups.map((group): number | undefined => group.layout.columns),
  ).toEqual([3, 1]);
  expect(section(replaced, 'other')).toEqual(section(reset, 'other'));
  expect(
    create(value(language.print({ collection: replaced, scope: { kind: 'all' } })).source),
  ).toEqual(replaced);
  (
    [
      {
        statement: 'set section @main columns=0',
        code: 'domain',
        target: '0.value.layout.columns',
      },
      {
        statement: 'set section @main columns=13',
        code: 'domain',
        target: '0.value.layout.columns',
      },
      { statement: 'set section @main columns=1.5', code: 'invalid-value', target: 'columns' },
      {
        statement: 'set section @main layout=flow',
        code: 'domain',
        target: 'sections.main.layout.columns',
      },
    ] as const
  ).forEach(({ statement, code, target }): void => {
    const source = `patch 1 @tracks { ${statement} }`;
    const result = language.lower({
      source,
      mode: 'patch',
      snapshot: changed,
      resources: pins(changed),
    });
    rejected(result, code);
    assert(!result.ok);
    expect(result.error.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code, target })]),
    );
    expect(result.error.diagnostics.every((diagnostic) => diagnostic.code === code)).toBe(true);
    const diagnostic = result.error.diagnostics.find((diagnostic) => diagnostic.target === target);
    assert(diagnostic);
    if (code === 'domain')
      expect(diagnostic.source).toMatchObject({
        code: diagnostic.expected,
        path: target,
        message: diagnostic.message,
      });
    const fragment = code === 'invalid-value' ? '1.5' : statement;
    expect(source.slice(diagnostic.span.start.offset, diagnostic.span.end.offset)).toBe(fragment);
    expect(diagnostic.span.start).toEqual({
      offset: source.indexOf(fragment),
      line: 1,
      column: source.indexOf(fragment) + 1,
    });
    expect(diagnostic.span.end.offset).toBe(source.indexOf(fragment) + fragment.length);
    expect(diagnostic.recovery).not.toBe('');
  });
  ['@a.@missing', '@missing/@a'].forEach((target): void => {
    const constraint = `before ${target} @b`;
    const source = `canvas 1 collection @bad "Bad" {
      node @a note "A" {}
      node @b note "B" {}
      section @main "Main" mode=grid { show @a @b ${constraint} }
    }`;
    const result = language.lower({
      source,
      mode: 'create',
      snapshot: null,
      resources: pins(original),
    });
    rejected(result, 'invalid-value');
    assert(!result.ok);
    expect(result.error.diagnostics).toEqual([
      expect.objectContaining({ code: 'invalid-value', target: 'a' }),
    ]);
    const diagnostic = result.error.diagnostics[0];
    assert(diagnostic);
    expect(source.slice(diagnostic.span.start.offset, diagnostic.span.end.offset)).toBe(constraint);
    expect(diagnostic.span.start.offset).toBe(source.indexOf(constraint));
    expect(diagnostic.span.start.line).toBe(4);
  });
  expect(original.arrangement.columns).toBe(2);
});
