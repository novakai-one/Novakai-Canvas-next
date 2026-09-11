import { describe, it, expect, assert } from 'vitest';
import {
  collection,
  object,
  edge,
  section,
  project,
  harness,
  request,
  value,
  flow,
} from './fixtures.js';
import { node, dependencies, settings, metrics } from './fixtures.js';
import { createLayout, toCollection, toSection, toParent } from '../contract/index.js';
import type { LayoutIntent, Projection } from '../contract/index.js';
describe('Layout arrangement acceptance', () => {
  it('1 — lays out mixed section policies deterministically with complete labelled wires', async () => {
    const source = flow();
    const layout = await harness([source]);
    const input = request(layout, source);
    const first = value(await layout.arrange(input));
    const second = value(await layout.arrange(input));
    expect(first).toEqual(second);
    expect(first.sections).toHaveLength(1);
    expect(first.sections[0]?.nodes).toHaveLength(2);
    expect(first.sections[0]?.wires).toHaveLength(1);
    expect(
      value(
        layout.inspect({
          projection: source,
          measurements: input.measurements,
          options: input.options,
          candidate: first,
        }),
      ).valid,
    ).toBe(true);
    const mixed = project(
      collection({
        objects: [object('a'), object('b'), object('c', 'concept'), object('d', 'concept')],
        relationships: [edge('parent', 'c', 'd', { kind: 'parent' })],
        sections: [
          section('grid', ['a', 'b'], { mode: 'grid', layout: { algorithm: 'grid' } }),
          section('tree', ['c', 'd'], {
            mode: 'tree',
            layout: { algorithm: 'tree' },
            root: 'c',
            wires: [{ relationship: 'parent' }],
            order: 1,
          }),
        ],
      }),
    );
    const mixedLayout = await harness([mixed]);
    const scene = value(await mixedLayout.arrange(request(mixedLayout, mixed)));
    expect(scene.sections.map((item) => item.id)).toEqual(['grid', 'tree']);
    expect(scene.sections.map((item) => item.nodes.length)).toEqual([2, 2]);
  });

  it('2 — encloses nested represented groups and preserves coordinate conversions', async () => {
    const source = project(
      collection({
        objects: [object('system', 'system'), object('a'), object('b')],
        sections: [
          section('nested', [], {
            mode: 'grid',
            layout: { algorithm: 'grid' },
            groups: [
              {
                id: 'outer',
                title: 'Outer',
                represents: 'system',
                layout: { algorithm: 'grid', direction: 'down' },
              },
              { id: 'inner', title: 'Inner', parent: 'outer', layout: { algorithm: 'grid' } },
            ],
            appearances: [
              { object: 'a', group: 'inner' },
              { object: 'b', group: 'outer' },
            ],
            placement: { x: -200, y: 300, locked: true },
          }),
        ],
      }),
    );
    const layout = await harness([source]);
    const scene = value(await layout.arrange(request(layout, source)));
    const outer = node(scene, 'system');
    const a = node(scene, 'a');
    const inner = scene.sections[0]?.nodes.find((item) => item.measured.groupId === 'inner');
    assert(inner);
    expect(a.parent).toBe(inner.id);
    expect(inner.parent).toBe(outer.id);
    expect(a.box.y).toBeGreaterThanOrEqual(
      inner.box.y + inner.measured.headerHeight + settings.padding - 0.000001,
    );
    expect(a.box.x + a.box.width).toBeLessThanOrEqual(
      inner.box.x + inner.box.width - settings.padding + 0.000001,
    );
    expect(inner.box.y).toBeGreaterThanOrEqual(
      outer.box.y + outer.measured.headerHeight + settings.padding - 0.000001,
    );
    expect(scene.sections[0]?.origin).toEqual({ x: -200, y: 300 });
    expect(
      scene.sections[0]?.nodes.filter((item) => item.measured.objectId === 'system'),
    ).toHaveLength(1);
    expect(
      toSection(toCollection({ x: -17, y: 29 }, { x: -200, y: 300 }), { x: -200, y: 300 }),
    ).toEqual({ x: -17, y: 29 });
    expect(toParent({ x: 140, y: 250 }, { x: 100, y: 200, width: 200, height: 200 })).toEqual({
      x: 40,
      y: 50,
    });
  });
  it('3 — honours all relative meanings in all four directions and rejects named contradictions', async () => {
    const directions: readonly LayoutIntent['direction'][] = ['right', 'down', 'left', 'up'];
    const kinds: readonly LayoutIntent['constraints'][number]['kind'][] = [
      'rank',
      'before',
      'below',
      'align',
    ];
    await Promise.all(
      directions.flatMap((direction) => kinds.map((kind) => checkRelative(kind, direction))),
    );
    const source = relativeProjection('before', 'right', [
      {
        kind: 'before',
        targets: [
          { kind: 'object', id: 'b' },
          { kind: 'object', id: 'a' },
        ],
      },
    ]);
    const layout = await harness([source]);
    const result = await layout.arrange(request(layout, source));
    assert(!result.ok);
    expect(result.error.code).toBe('constraint-conflict');
    expect(result.error.targets).toHaveLength(2);
  });
  it('4 — preserves hard negative positions and explicit sizes, rejecting impossible measured fit', async () => {
    const source = lockedProjection(240);
    const impossible = lockedProjection(1);
    const soft = project(
      collection({
        objects: [object('a'), object('b')],
        sections: [
          section('soft', [], {
            mode: 'grid',
            layout: { algorithm: 'grid' },
            appearances: [
              { object: 'a', placement: { x: 0, y: 0 } },
              { object: 'b', placement: { x: 0, y: 0 } },
            ],
          }),
        ],
      }),
    );
    const layout = await harness([source, impossible, soft]);
    const result = value(await layout.arrange(request(layout, source)));
    expect(node(result, 'a').box).toEqual({ x: -400, y: -250, width: 240, height: 100 });
    const failed = await layout.arrange(request(layout, impossible));
    assert(!failed.ok);
    expect(failed.error.code).toBe('constraint-conflict');
    const adjusted = value(await layout.arrange(request(layout, soft)));
    expect(adjusted.adjustments.length).toBeGreaterThan(0);
    expect(node(adjusted, 'a').box).not.toEqual(node(adjusted, 'b').box);
  });
  it('5 — reuses untouched local geometry and rejects forged cache content', async () => {
    const before = twoSections(0, 'a');
    const after = twoSections(1, 'a changed enough to wrap onto two lines');
    const native = await dependencies([before, after]);
    let placements = 0;
    const layout = createLayout({
      ...native,
      placement: {
        ...native.placement,
        async place(problem) {
          placements += 1;
          return native.placement.place(problem);
        },
      },
    });
    const first = value(await layout.arrange(request(layout, before)));
    placements = 0;
    const next = value(await layout.arrange(request(layout, after, first)));
    expect(placements).toBe(1);
    expect(next.sections[1]?.nodes).toEqual(first.sections[1]?.nodes);
    expect(next.sections[1]?.wires).toEqual(first.sections[1]?.wires);
    expect(next.sections[0]?.nodes).not.toEqual(first.sections[0]?.nodes);
    const forged = structuredClone(first);
    const broken = {
      ...forged,
      sections: forged.sections.map((section) => ({ ...section, nodes: [] })),
    };
    const repaired = value(await layout.arrange(request(layout, before, broken)));
    expect(repaired.sections.map((section) => section.nodes.length)).toEqual([2, 2]);
    const future = { ...first, revision: 999 };
    expect(
      value(await layout.arrange(request(layout, before, future))).sections.map(
        (item) => item.nodes,
      ),
    ).toEqual(first.sections.map((item) => item.nodes));
  });
  it('6 — renders ordered sequence messages, nested fragments, measured branches and activations', async () => {
    const source = sequenceProjection();
    const layout = await harness([source]);
    const scene = value(await layout.arrange(request(layout, source)));
    const sequence = scene.sections[0]?.sequence;
    assert(sequence);
    expect(sequence.events.map((item) => item.id)).toEqual([
      'call',
      'self',
      'return',
      'fallback',
      'after',
    ]);
    expect(sequence.fragments.map((item) => item.id)).toEqual(['alternatives', 'retry']);
    expect(sequence.fragments[0]?.branches.map((item) => item.id)).toEqual(['yes', 'no']);
    expect(sequence.events.map((item) => item.message)).toEqual([
      'call',
      'call',
      'return',
      'async',
      'async',
    ]);
    expect(sequence.events[1]?.points).toHaveLength(4);
    expect(sequence.activations[0]).toMatchObject({ fromEvent: 'call', toEvent: 'return' });
    expect(sequence.lifelines).toHaveLength(2);
    expect(sequence.lifelines[0]?.to.y).toBeGreaterThan(
      sequence.events.at(-1)?.labelBox.y ?? Infinity,
    );
    const headings = metrics(source).branchHeadings.map((item) => item.content);
    expect(sequence.fragments[0]?.branches.map((item) => item.content)).toEqual(headings);
    const isolated = isolatedAlternatives();
    const scoped = await harness([isolated]);
    const isolatedScene = value(await scoped.arrange(request(scoped, isolated)));
    const view = isolatedScene.sections[0];
    assert(view);
    expect(view.sequence.activations).toHaveLength(1);
    const activation = view.sequence.activations[0];
    const yes = view.sequence.fragments[0]?.branches[0];
    assert(activation && yes);
    expect(activation).toMatchObject({ fromEvent: 'branchCall', toEvent: null });
    expect(activation.box.y + activation.box.height).toBeLessThanOrEqual(
      yes.box.y + yes.box.height,
    );
    const forged = {
      ...isolatedScene,
      sections: [
        {
          ...view,
          sequence: { ...view.sequence, activations: [{ ...activation, toEvent: 'branchReturn' }] },
        },
      ],
    };
    const inspected = value(
      scoped.inspect({
        projection: isolated,
        measurements: metrics(isolated),
        options: settings,
        candidate: forged,
      }),
    );
    expect(inspected.valid).toBe(false);
    expect(inspected.diagnostics[0]?.message).toBe(
      'Mutually exclusive alternatives cannot share an activation interval',
    );
  });
});
/** Relative scenarios use public Model/Presentation constructors rather than forged checked types. */
function relativeProjection(
  kind: string,
  direction: string,
  extra: readonly unknown[] = [],
): Projection {
  return project(
    collection({
      objects: [object('a'), object('b')],
      sections: [
        section('relative', ['a', 'b'], {
          mode: 'grid',
          layout: {
            algorithm: 'grid',
            direction,
            constraints: [
              {
                kind,
                targets: [
                  { kind: 'object', id: 'a' },
                  { kind: 'object', id: 'b' },
                ],
              },
              ...extra,
            ],
          },
        }),
      ],
    }),
  );
}
/** Independent numeric assertions describe DSL meaning directly instead of importing the equation compiler. */
async function checkRelative(
  kind: LayoutIntent['constraints'][number]['kind'],
  direction: LayoutIntent['direction'],
): Promise<void> {
  const source = relativeProjection(kind, direction);
  const layout = await harness([source]);
  const scene = value(await layout.arrange(request(layout, source)));
  const a = node(scene, 'a').box;
  const b = node(scene, 'b').box;
  const policies = {
    right: {
      main: b.x - a.x - a.width,
      cross: b.y - a.y,
      mainEqual: a.x - b.x,
      crossOrder: b.y - a.y - a.height,
    },
    left: {
      main: a.x - b.x - b.width,
      cross: b.y - a.y,
      mainEqual: a.x - b.x,
      crossOrder: b.y - a.y - a.height,
    },
    down: {
      main: b.y - a.y - a.height,
      cross: b.x - a.x,
      mainEqual: a.y - b.y,
      crossOrder: b.x - a.x - a.width,
    },
    up: {
      main: a.y - b.y - b.height,
      cross: b.x - a.x,
      mainEqual: a.y - b.y,
      crossOrder: b.x - a.x - a.width,
    },
  };
  const actual = policies[direction];
  const assertions = {
    before: () => expect(actual.main).toBeGreaterThanOrEqual(settings.gap.normal - 0.000001),
    rank: () => {
      expect(actual.cross).toBeCloseTo(0);
      expect(actual.main).toBeGreaterThanOrEqual(settings.gap.normal - 0.000001);
    },
    align: () => {
      expect(actual.mainEqual).toBeCloseTo(0);
      expect(actual.crossOrder).toBeGreaterThanOrEqual(settings.gap.normal - 0.000001);
    },
    below: () =>
      expect(a.y - b.y - b.height).toBeGreaterThanOrEqual(settings.gap.normal - 0.000001),
  };
  assertions[kind]();
}
/** A hard width smaller than measured minimum must fail rather than resize a user's locked box. */
function lockedProjection(width: number): Projection {
  return project(
    collection({
      objects: [object('a')],
      sections: [
        section('locked', [], {
          appearances: [
            { object: 'a', placement: { x: -400, y: -250, width, height: 100, locked: true } },
          ],
        }),
      ],
    }),
  );
}
/** Revision/title changes affect only one measured section; the other is a real incremental reuse oracle. */
function twoSections(revision: number, label: string): Projection {
  return project(
    collection({
      revision,
      objects: [object('a', 'step', { label }), object('b'), object('c'), object('d')],
      sections: [section('first', ['a', 'b']), section('second', ['c', 'd'], { order: 1 })],
    }),
  );
}
/** Nested sequence fixture includes all required message forms and branch-owned headings. */
function sequenceProjection(): Projection {
  return project(
    collection({
      objects: [object('client', 'participant'), object('server', 'participant')],
      sections: [
        section('sequence', ['client', 'server'], {
          mode: 'sequence',
          layout: { algorithm: 'sequence', direction: 'right' },
          sequence: [
            {
              id: 'call',
              kind: 'event',
              source: 'client',
              target: 'server',
              label: 'Request',
              message: 'call',
              order: 0,
              activate: true,
            },
            {
              id: 'alternatives',
              kind: 'fragment',
              operator: 'alt',
              label: 'Result',
              order: 1,
              branches: [
                { id: 'yes', label: 'Available' },
                { id: 'no', label: 'Unavailable' },
              ],
            },
            {
              id: 'retry',
              kind: 'fragment',
              operator: 'loop',
              label: 'Retry once',
              parent: 'alternatives',
              branch: 'yes',
              order: 0,
            },
            {
              id: 'self',
              kind: 'event',
              source: 'server',
              target: 'server',
              label: 'Check cache',
              message: 'call',
              parent: 'retry',
              order: 0,
            },
            {
              id: 'return',
              kind: 'event',
              source: 'server',
              target: 'client',
              label: 'Result',
              message: 'return',
              parent: 'alternatives',
              branch: 'yes',
              order: 1,
              activate: false,
            },
            {
              id: 'fallback',
              kind: 'event',
              source: 'server',
              target: 'client',
              label: 'Retry later',
              message: 'async',
              parent: 'alternatives',
              branch: 'no',
              order: 0,
            },
            {
              id: 'after',
              kind: 'event',
              source: 'client',
              target: 'server',
              label: 'Audit',
              message: 'async',
              order: 2,
            },
          ],
        }),
      ],
    }),
  );
}

/** A1 counterexample: activation starts in one alternative while an unrelated sibling deactivation follows visually. */
function isolatedAlternatives(): Projection {
  return project(
    collection({
      objects: [object('client', 'participant'), object('server', 'participant')],
      sections: [
        section('sequence', ['client', 'server'], {
          mode: 'sequence',
          layout: { algorithm: 'sequence' },
          sequence: [
            {
              id: 'choice',
              kind: 'fragment',
              operator: 'alt',
              label: 'Choice',
              order: 0,
              branches: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No' },
              ],
            },
            {
              id: 'branchCall',
              kind: 'event',
              source: 'client',
              target: 'server',
              label: 'Call',
              message: 'call',
              activate: true,
              parent: 'choice',
              branch: 'yes',
              order: 0,
            },
            {
              id: 'branchReturn',
              kind: 'event',
              source: 'server',
              target: 'client',
              label: 'Return',
              message: 'return',
              activate: false,
              parent: 'choice',
              branch: 'no',
              order: 0,
            },
          ],
        }),
      ],
    }),
  );
}
