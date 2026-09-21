import { assert, expect, it } from 'vitest';
import { composeLayout } from '../contract/index.js';
import type { Projection } from '../contract/index.js';
import { collection, object, section, project, dependencies, request, value } from './fixtures.js';

async function layoutFor(sources: readonly Projection[]) {
  const owners = await dependencies(sources);
  return value(
    await composeLayout({
      projection: owners.projection,
      jobs: { isCurrent: () => true, yield: async () => undefined },
      wasmResource: new URL('../../../resources/vendor/layout/libavoid.wasm', import.meta.url)
        .pathname,
    }),
  );
}

it('adds a section around retained mixed-diagram positions without moving existing sections', async () => {
  const source = project(
    collection({
      objects: ['a', 'b', 'c', 'd'].map((id) => object(id, 'module')),
      relationships: [],
      sections: ['a', 'b', 'c', 'd'].map((id, order) =>
        section(id, [id], {
          order,
          mode: 'modules',
          layout: { algorithm: 'grid' },
        }),
      ),
    }),
  );
  const initialLayout = await layoutFor([source]);
  const initial = value(await initialLayout.arrange(request(initialLayout, source)));
  const empty = project(
    collection({
      objects: [],
      relationships: [],
      sections: [
        section('new', [], {
          mode: 'grid',
          layout: { algorithm: 'grid' },
          order: 4,
        }),
      ],
    }),
  ).sections[0];
  assert(empty);
  const edited: Projection = {
    ...source,
    revision: source.revision + 1,
    sections: [
      ...source.sections.map((item, index) => {
        const old = initial.sections[index];
        assert(old);
        return { ...item, placement: { ...old.origin, locked: false } };
      }),
      empty,
    ],
  };
  const layout = await layoutFor([source, edited]);
  const input = request(layout, edited, initial);
  const result = await layout.arrange(input);
  assert(result.ok, JSON.stringify(result));
  expect(result.value.sections.slice(0, 4).map((s) => s.origin)).toEqual(
    initial.sections.map((s) => s.origin),
  );
  expect(result.value.sections).toHaveLength(5);
  expect(
    value(
      layout.inspect({
        projection: edited,
        measurements: input.measurements,
        options: input.options,
        candidate: result.value,
      }),
    ).valid,
  ).toBe(true);
});
