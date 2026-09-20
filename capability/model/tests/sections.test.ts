/** Public Model scenarios are replayable; Vitest owns assertion reporting and the developer corrects regressions before rerunning. */
import { expect, test } from 'vitest';
import { validate } from '../contract/index.js';
import { base, graph, layout, node, rejects, relation, section, value } from './fixtures.js';
test('validate groups and visible wires', () => {
  rejects(
    graph({
      sections: [
        section('view', 'flow', {
          appearances: [{ object: 'a' }],
          wires: [{ relationship: 'ab' }],
        }),
      ],
    }),
    'reference',
    'wires.ab.target',
  );
  const group = { id: 'g', title: 'Group', represents: 'a', layout: layout() };
  const represented = graph({
    sections: [
      section('view', 'flow', {
        groups: [group],
        appearances: [{ object: 'b', group: 'g' }],
        wires: [{ relationship: 'ab' }],
      }),
    ],
  });
  expect(value(validate(represented)).sections[0]?.groups[0]?.represents).toBe('a');
  rejects(
    graph({
      sections: [section('view', 'flow', { groups: [group], appearances: [{ object: 'a' }] })],
    }),
    'duplicate',
    'appearances.a',
  );
  rejects(
    base({
      sections: [
        section('view', 'flow', { groups: [{ ...group, represents: undefined, parent: 'g' }] }),
      ],
    }),
    'shape',
    '$',
  );
  rejects(
    base({
      sections: [
        section('view', 'flow', {
          groups: [{ id: 'g', title: 'G', layout: layout(), parent: 'g' }],
        }),
      ],
    }),
    'group',
    'groups.g',
  );
  rejects(
    graph({
      sections: [
        section('view', 'flow', {
          appearances: [{ object: 'a' }, { object: 'b' }],
          wires: [{ relationship: 'ab' }, { relationship: 'ab' }],
        }),
      ],
    }),
    'duplicate',
    'wires.ab',
  );
});
test('validate layout intent', () => {
  rejects(
    base({ sections: [section('data', 'er', { layout: layout('flow') })] }),
    'mode',
    'sections.data.layout',
  );
  rejects(
    graph({
      arrangement: layout('grid', [
        {
          kind: 'before',
          targets: [
            { kind: 'object', id: 'a' },
            { kind: 'section', id: 'view' },
          ],
        },
      ]),
    }),
    'reference',
    'arrangement.a',
  );
  rejects(
    graph({
      sections: [
        section('view', 'flow', {
          layout: layout('flow', [
            {
              kind: 'before',
              targets: [
                { kind: 'object', id: 'a' },
                { kind: 'object', id: 'a' },
              ],
            },
          ]),
          appearances: [{ object: 'a' }],
        }),
      ],
    }),
    'duplicate',
    'layout.constraints',
  );
  rejects(
    graph({
      sections: [
        section('view', 'flow', {
          appearances: [{ object: 'a' }, { object: 'b' }],
          wires: [{ relationship: 'ab', locked: true }],
        }),
      ],
    }),
    'layout',
    'wires.ab',
  );
  const arranged = base({
    sections: [section('first'), section('second')],
    arrangement: layout('grid', [
      {
        kind: 'before',
        targets: [
          { kind: 'section', id: 'first' },
          { kind: 'section', id: 'second' },
        ],
      },
    ]),
  });
  expect(value(validate(arranged)).arrangement.constraints).toHaveLength(1);
  const engineeringGrid = base({
    sections: [
      section('data', 'er', { layout: layout('grid') }),
      section('code', 'modules', { layout: layout('grid') }),
    ],
  });
  expect(value(validate(engineeringGrid)).sections.map((item) => item.layout.algorithm)).toEqual([
    'grid',
    'grid',
  ]);
});
test('validate flow and state', () => {
  const objects = [node('a', 'decision'), node('b'), node('c')];
  const relationships = [relation('ab'), relation('ac', 'a', 'c')];
  rejects(
    base({
      objects,
      relationships,
      sections: [
        section('view', 'flow', {
          appearances: objects.map((object) => ({ object: object.id })),
          wires: relationships.map((wire) => ({ relationship: wire.id })),
        }),
      ],
    }),
    'duplicate',
    'decision.a',
  );
  const states = [node('start', 'start'), node('state', 'state'), node('end', 'end')];
  const transitions = [
    relation('begin', 'start', 'state', { kind: 'transition', label: 'opened' }),
    relation('finish', 'state', 'end', {
      kind: 'transition',
      label: 'saved',
      guard: 'valid',
      effect: 'close',
    }),
  ];
  expect(
    value(
      validate(
        base({
          objects: states,
          relationships: transitions,
          sections: [
            section('states', 'state', {
              appearances: states.map((object) => ({ object: object.id })),
              wires: transitions.map((wire) => ({ relationship: wire.id })),
            }),
          ],
        }),
      ),
    ).relationships[1]?.guard,
  ).toBe('valid');
  rejects(
    base({
      objects: states,
      relationships: [relation('bad', 'end', 'state', { kind: 'transition' })],
    }),
    'endpoint',
    'relationships.bad.source',
  );
  expect(
    value(validate(graph({ relationships: [relation(), relation('back', 'b', 'a')] })))
      .relationships,
  ).toHaveLength(2);
});
test('validate canonical modules as direct sequence endpoints', () => {
  const input = base({
    objects: [node('api', 'module'), node('worker', 'module'), node('human', 'participant')],
    sections: [
      section('sequence', 'sequence', {
        layout: layout('sequence'),
        appearances: [{ object: 'api' }, { object: 'worker' }, { object: 'human' }],
        sequence: [
          {
            id: 'request',
            kind: 'event',
            source: 'api',
            target: 'worker',
            label: 'Request',
            message: 'call',
            order: 0,
          },
          {
            id: 'reply',
            kind: 'event',
            source: 'worker',
            target: 'human',
            label: 'Reply',
            message: 'return',
            order: 1,
          },
        ],
      }),
    ],
  });
  const validated = value(validate(input));
  expect(validated.sections[0]?.sequence[0]).toMatchObject({ source: 'api', target: 'worker' });
  expect(validated.objects.map((object) => object.id)).toEqual(['api', 'worker', 'human']);
  const hidden = {
    ...input,
    sections: [
      section('sequence', 'sequence', {
        layout: layout('sequence'),
        appearances: [{ object: 'api' }, { object: 'human' }],
        sequence: [
          {
            id: 'request',
            kind: 'event',
            source: 'api',
            target: 'worker',
            label: 'Request',
            message: 'call',
            order: 0,
          },
        ],
      }),
    ],
  };
  rejects(hidden, 'sequence', 'sequence.request.worker');
  const grouped = {
    ...input,
    sections: [
      section('sequence', 'sequence', {
        layout: layout('sequence'),
        groups: [{ id: 'g', title: 'Group', layout: layout() }],
        appearances: [{ object: 'api', group: 'g' }, { object: 'worker' }, { object: 'human' }],
        sequence: [
          {
            id: 'request',
            kind: 'event',
            source: 'api',
            target: 'worker',
            label: 'Request',
            message: 'call',
            order: 0,
          },
        ],
      }),
    ],
  };
  rejects(grouped, 'sequence', 'sequence.request.api');
});
function tree(extra: Readonly<Record<string, unknown>> = {}): ReturnType<typeof base> {
  return base({
    objects: [node('root', 'concept'), node('child', 'concept'), node('note', 'note')],
    relationships: [relation('parent', 'root', 'child', { kind: 'parent' })],
    sections: [
      section('tree', 'tree', {
        root: 'root',
        appearances: [{ object: 'root' }, { object: 'child' }, { object: 'note' }],
        wires: [{ relationship: 'parent' }],
        ...extra,
      }),
    ],
  });
}
test('validate tree topology', () => {
  expect(value(validate(tree())).sections[0]?.root).toBe('root');
  rejects(tree({ root: 'child' }), 'tree', 'appearances');
  rejects(tree({ wires: [] }), 'tree', 'appearances.child');
  rejects(
    tree({
      appearances: [
        { object: 'root' },
        { object: 'child' },
        { object: 'note', participation: 'tree' },
      ],
    }),
    'tree',
    'appearances.note',
  );
  rejects(
    tree({ appearances: [{ object: 'root' }, { object: 'child', participation: 'annotation' }] }),
    'tree',
    'wires.parent',
  );
  const cycle = base({
    objects: [node('a'), node('b')],
    relationships: [
      relation('ab', 'a', 'b', { kind: 'parent' }),
      relation('ba', 'b', 'a', { kind: 'parent' }),
    ],
    sections: [
      section('tree', 'tree', {
        root: 'a',
        appearances: [{ object: 'a' }, { object: 'b' }],
        wires: [{ relationship: 'ab' }, { relationship: 'ba' }],
      }),
    ],
  });
  rejects(cycle, 'tree', 'appearances');
  expect(
    value(
      validate(
        base({
          objects: [node('note', 'note')],
          sections: [section('tree', 'tree', { appearances: [{ object: 'note' }] })],
        }),
      ),
    ).sections[0]?.root,
  ).toBeUndefined();
});
function sequence(items: readonly unknown[]): ReturnType<typeof base> {
  return base({
    objects: [node('user', 'participant'), node('agent', 'participant')],
    sections: [
      section('sequence', 'sequence', {
        appearances: [{ object: 'user' }, { object: 'agent' }],
        sequence: items,
      }),
    ],
  });
}
const event = {
  kind: 'event',
  id: 'request',
  order: 0,
  source: 'user',
  target: 'agent',
  label: 'Request',
  message: 'call',
  activate: true,
};
const fragment = {
  kind: 'fragment',
  id: 'choice',
  order: 0,
  operator: 'alt',
  label: 'Outcome',
  branches: [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
  ],
};
test('validate sequence topology', () => {
  expect(
    value(validate(sequence([fragment, { ...event, parent: 'choice', branch: 'yes' }]))).sections[0]
      ?.sequence,
  ).toHaveLength(2);
  rejects(sequence([fragment, { ...event, parent: 'choice' }]), 'sequence', 'request');
  rejects(sequence([{ ...event, parent: 'missing' }]), 'sequence', 'request');
  rejects(sequence([{ ...event, target: 'missing' }]), 'sequence', 'request.missing');
  rejects(sequence([event, { ...event, id: 'second' }]), 'duplicate', 'sequence.order');
  rejects(
    sequence([{ ...fragment, branches: [{ id: 'yes', label: 'Yes' }] }]),
    'sequence',
    'choice',
  );
  rejects(sequence([{ ...fragment, parent: 'choice', branch: 'yes' }]), 'sequence', 'choice');
  rejects(
    sequence([
      {
        ...fragment,
        branches: [
          { id: 'yes', label: 'Same' },
          { id: 'no', label: 'Same' },
        ],
      },
    ]),
    'duplicate',
    'branches',
  );
});

/** Public validation rejects malformed intent without mutation; callers correct and retry. */
test('grid columns validate independently in collection, section and nested group scopes', (): void => {
  const invalidColumns: readonly unknown[] = [0, 13, -1, 1.5, '2', null, NaN, Infinity];
  invalidColumns.forEach((columns): void => {
    rejects(base({ arrangement: { algorithm: 'grid', columns } }), 'shape', 'columns');
    rejects(
      base({ sections: [section('grid', 'grid', { layout: { algorithm: 'grid', columns } })] }),
      'shape',
      'columns',
    );
  });
  ['flow', 'layered', 'tree', 'sequence'].forEach((algorithm): void => {
    rejects(base({ arrangement: { algorithm, columns: 2 } }), 'layout', 'columns');
  });
  [1, 2, 12].forEach((columns): void => {
    const input = base({
      arrangement: { algorithm: 'grid', columns },
      sections: [
        section('grid', 'grid', {
          layout: { algorithm: 'grid', columns },
          groups: [
            { id: 'outer', title: 'Outer', layout: { algorithm: 'grid', columns: 1 } },
            {
              id: 'inner',
              title: 'Inner',
              parent: 'outer',
              layout: { algorithm: 'grid', columns },
            },
          ],
        }),
      ],
    });
    const checked = value(validate(input));
    expect(checked.arrangement.columns).toBe(columns);
    expect(checked.sections[0]?.groups[1]?.layout.columns).toBe(columns);
    expect(input.arrangement).toEqual({ algorithm: 'grid', columns });
  });
  rejects(
    base({
      sections: [
        section('grid', 'grid', {
          groups: [{ id: 'g', title: 'G', layout: { algorithm: 'flow', columns: 2 } }],
        }),
      ],
    }),
    'layout',
    'groups.g.layout.columns',
  );
});
