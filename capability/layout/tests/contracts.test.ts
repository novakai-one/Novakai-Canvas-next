/** Public Layout boundary scenarios are replayable; Vitest owns assertion reporting and the developer fixes failures before rerunning. */
import { describe, it, expect, assert } from 'vitest';
import type { Projection, Dependencies } from '../contract/index.js';
import { createLayout } from '../contract/index.js';
import { createRouting } from '../adapters/libavoid.js';
import { failingNative } from './native-fixture.js';
import {
  flow,
  harness,
  request,
  value,
  dependencies,
  settings,
  metrics,
  project,
  collection,
  object,
  edge,
  section,
} from './fixtures.js';

describe('Layout boundary/native acceptance', () => {
  it('10 — rejects cancelled/stale native completion and attempts every native cleanup after failure', async () => {
    const source = flow();
    const native = await dependencies([source]);
    const entered = gate();
    const finish = gate();
    let current = true;
    const jobs: Dependencies['jobs'] = {
      checkpoint: async () =>
        current
          ? { ok: true, value: undefined }
          : {
              ok: false,
              error: {
                code: 'cancelled',
                path: 'test-job',
                targets: [],
                message: 'Superseded',
                recovery: 'Retain scene',
              },
            },
    };
    const layout = createLayout({
      ...native,
      jobs,
      placement: {
        ...native.placement,
        async place(problem) {
          entered.release();
          await finish.promise;
          return native.placement.place(problem);
        },
      },
    });
    const pending = layout.arrange(request(layout, source));
    await entered.promise;
    current = false;
    finish.release();
    const cancelled = await pending;
    assert(!cancelled.ok);
    expect(cancelled.error.code).toBe('cancelled');
    const nativeFailure = failingNative();
    const router = value(await createRouting(async () => nativeFailure.module));
    const failed = await router.route({
      obstacles: [{ id: 'box', box: { x: 40, y: 0, width: 30, height: 30 } }],
      connections: [
        {
          id: 'wire',
          source: { x: 0, y: 10 },
          target: { x: 100, y: 10 },
          sourceSide: 'right',
          targetSide: 'left',
          checkpoints: [
            { x: 10, y: 10 },
            { x: 90, y: 10 },
          ],
        },
      ],
      clearance: 8,
    });
    expect(failed.ok).toBe(false);
    expect(nativeFailure.allocated.length).toBeGreaterThan(5);
    expect(nativeFailure.disposed).toEqual([...nativeFailure.allocated].reverse());
  });
  it('11 — rejects malformed input/native output and independently detects forged geometry', async () => {
    const source = flow();
    const duplicate: Projection = {
      ...source,
      sections: source.sections.map((section) => ({
        ...section,
        nodes: [...section.nodes, ...section.nodes],
      })),
    };
    const layout = await harness([source, duplicate]);
    const input = request(layout, source);
    expect(
      layout.key({
        projection: duplicate,
        measurements: metrics(duplicate),
        options: settings,
        previous: null,
      }).ok,
    ).toBe(false);
    expect((await layout.arrange({ ...input, options: { ...settings, padding: NaN } })).ok).toBe(
      false,
    );
    expect(
      (await layout.arrange({ ...input, job: { id: 'old-job', inputKey: 'old-input' } })).ok,
    ).toBe(false);
    const dishonest = await harness([source], {
      placement: { version: 'dishonest', place: async () => ({ ok: true, value: [] }) },
    });
    const missing = await dishonest.arrange(request(dishonest, source));
    assert(!missing.ok);
    expect(missing.error.code).toBe('engine-failed');
    const scene = value(await layout.arrange(input));
    const sourceSection = scene.sections[0];
    assert(sourceSection);
    const wrongContent = {
      ...scene,
      sections: [
        {
          ...sourceSection,
          nodes: sourceSection.nodes.map((node) => ({
            ...node,
            measured: { ...node.measured, label: 'Forged' },
          })),
        },
      ],
    };
    expect(
      value(
        layout.inspect({
          projection: source,
          measurements: input.measurements,
          options: settings,
          candidate: wrongContent,
        }),
      ).valid,
    ).toBe(false);
    const omitted = { ...scene, sections: [{ ...sourceSection, wires: [] }] };
    expect(
      value(
        layout.inspect({
          projection: source,
          measurements: input.measurements,
          options: settings,
          candidate: omitted,
        }),
      ).valid,
    ).toBe(false);
    const moved = {
      ...scene,
      sections: [
        {
          ...sourceSection,
          nodes: sourceSection.nodes.map((node) => ({ ...node, box: { ...node.box, x: 0, y: 0 } })),
        },
      ],
    };
    expect(
      value(
        layout.inspect({
          projection: source,
          measurements: input.measurements,
          options: settings,
          candidate: moved,
        }),
      ).valid,
    ).toBe(false);
    const farLabel = {
      ...scene,
      sections: [
        {
          ...sourceSection,
          wires: sourceSection.wires.map((wire) => ({
            ...wire,
            labelBox: { ...wire.labelBox, x: -10000 },
          })),
        },
      ],
    };
    expect(
      value(
        layout.inspect({
          projection: source,
          measurements: input.measurements,
          options: settings,
          candidate: farLabel,
        }),
      ).valid,
    ).toBe(false);
  });
  it('12 — derives 1000 nodes and 1500 labelled wires in ten sections with bounded work', async () => {
    const source = scaleProjection();
    const layout = await harness([source]);
    const input = {
      projection: source,
      measurements: metrics(source),
      options: { ...settings, gridColumns: 10 },
      previous: null,
    };
    const key = value(layout.key(input));
    const started = performance.now();
    const scene = value(await layout.arrange({ ...input, job: { id: 'scale', inputKey: key } }));
    expect(scene.sections).toHaveLength(10);
    expect(scene.sections.reduce((count, section) => count + section.nodes.length, 0)).toBe(1000);
    expect(scene.sections.reduce((count, section) => count + section.wires.length, 0)).toBe(1500);
    expect(
      scene.sections.every((section) =>
        section.wires.every((wire) => wire.labelBox.width > 0 && wire.labelBox.height > 0),
      ),
    ).toBe(true);
    expect(performance.now() - started).toBeLessThan(20000);
  }, 30000);
});
/** Explicit gates make stale completion deterministic without wall-clock sleeps or a fabricated passing result. */
function gate(): { readonly promise: Promise<void>; readonly release: () => void } {
  const callbacks: (() => void)[] = [];
  const promise = new Promise<void>((resolve) => callbacks.push(resolve));
  const release = callbacks[0];
  assert(release);
  return { promise, release };
}
/** A 10x10 regular graph per section provides 90 horizontal and 60 vertical labelled connections. */
function scaleProjection(): Projection {
  const sections = Array.from({ length: 10 }, (_, index) => scaleSection(index));
  return project(
    collection({
      objects: sections.flatMap((item) => item.objects),
      relationships: sections.flatMap((item) => item.relationships),
      sections: sections.map((item) => item.section),
    }),
  );
}
/** Scale fixture geometry is entirely automatic; no hardcoded coordinates make the native work disappear. */
function scaleSection(index: number): {
  readonly objects: readonly unknown[];
  readonly relationships: readonly unknown[];
  readonly section: unknown;
} {
  const prefix = `s${index}`;
  const ids = Array.from({ length: 100 }, (_, item) => `${prefix}-n${item}`);
  const horizontal = ids.slice(0, 99).flatMap((source, item) => horizontalEdge(source, item, ids));
  const vertical = ids
    .slice(0, 60)
    .map((source, item) => edge(`${source}-v`, source, ids[item + 10] ?? '', { label: 'uses' }));
  const links = [...horizontal, ...vertical];
  const wireIds = [
    ...ids.slice(0, 99).flatMap((source, item) => (item % 10 === 9 ? [] : [`${source}-h`])),
    ...ids.slice(0, 60).map((source) => `${source}-v`),
  ];
  return {
    objects: ids.map((id) => object(id)),
    relationships: links,
    section: section(prefix, ids, {
      mode: 'grid',
      order: index,
      layout: { algorithm: 'grid' },
      wires: wireIds.map((relationship) => ({ relationship })),
    }),
  };
}
/** Row boundaries never wrap a horizontal connection into the next row. */
function horizontalEdge(source: string, index: number, ids: readonly string[]): readonly unknown[] {
  if (index % 10 === 9) return [];
  return [edge(`${source}-h`, source, ids[index + 1] ?? '', { label: 'uses' })];
}

/** Dishonest projection providers cannot bypass Layout's independently checked intent; callers retain the current scene. */
it('rejects invalid grid columns at each consumed scope and preserves authored placements', async (): Promise<void> => {
  const source = project(
    collection({
      objects: [object('a')],
      sections: [
        section('grid', ['a'], {
          mode: 'grid',
          layout: { algorithm: 'grid' },
          groups: [{ id: 'g', title: 'G', layout: { algorithm: 'grid' } }],
        }),
      ],
    }),
  );
  const invalid = [0, 13, 1.5, NaN, Infinity].flatMap((columns): readonly Projection[] =>
    invalidColumnScopes(source, columns),
  );
  const nonGrid: Projection = {
    ...source,
    arrangement: { ...source.arrangement, algorithm: 'flow', columns: 2 },
  };
  const layout = await harness([source, ...invalid, nonGrid]);
  [...invalid, nonGrid].forEach((projection): void => {
    const result = layout.key({
      projection,
      measurements: metrics(projection),
      options: settings,
      previous: null,
    });
    assert(!result.ok);
    expect(result.error.code).toBe('invalid-input');
    expect(result.error.recovery.length).toBeGreaterThan(0);
  });
  await checkColumnLocks();
});
/** Deliberately dishonest typed data exercises each consumer scope without calling Model validation first. */
function invalidColumnScopes(source: Projection, columns: number): readonly Projection[] {
  return [
    { ...source, arrangement: { ...source.arrangement, columns } },
    {
      ...source,
      sections: source.sections.map((section): Projection['sections'][number] => ({
        ...section,
        layout: { ...section.layout, columns },
      })),
    },
    {
      ...source,
      sections: source.sections.map((section): Projection['sections'][number] => ({
        ...section,
        groups: section.groups.map((group): typeof group => ({
          ...group,
          layout: { ...group.layout, columns },
        })),
      })),
    },
  ];
}
/** Both soft human preferences and hard locks outrank regenerated automatic grid seeds. */
async function checkColumnLocks(): Promise<void> {
  for (const locked of [false, true]) {
    const make = (columns: number): Projection =>
      project(
        collection({
          objects: [object('a'), object('b')],
          sections: [
            section('grid', [], {
              mode: 'grid',
              layout: { algorithm: 'grid', columns },
              appearances: [
                { object: 'a', placement: { x: -400, y: -250, locked } },
                { object: 'b' },
              ],
            }),
          ],
        }),
      );
    const before = make(1);
    const after = make(2);
    const layout = await harness([before, after]);
    const previous = value(await layout.arrange(request(layout, before)));
    const scene = value(await layout.arrange(request(layout, after, previous)));
    expect(scene.sections[0]?.nodes[0]?.box).toMatchObject({ x: -400, y: -250 });
  }
}
