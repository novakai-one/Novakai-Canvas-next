import { assert, expect, it } from 'vitest';
import { fixture, collection, object, section, value } from './fixtures.js';

/** Domain kinds and independent endpoint meanings survive decorative frame choices. */
it('retains engineering identity with every frame and every ER endpoint pair', async () => {
  const app = (await fixture()).presentation;
  const kinds = ['entity', 'module', 'interface', 'function'] as const;
  const frames = ['auto', 'none', 'card', 'panel'] as const;
  const objects = kinds.flatMap((kind) =>
    frames.map((frame) => object(`${kind}-${frame}`, kind, [], { frame })),
  );
  const ids = kinds.flatMap((kind) => frames.map((frame) => `${kind}-${frame}`));
  // Independently specified cardinality vocabulary: optionality and multiplicity belong to each end.
  const endpoints = [
    ['1', 'one'],
    ['0..1', 'zero-one'],
    ['1..many', 'one-many'],
    ['0..many', 'zero-many'],
  ] as const;
  const relationships = endpoints.flatMap(([from], i) =>
    endpoints.map(([to], j) => ({
      id: `association-${i}-${j}`,
      kind: 'association',
      label: `${from} relates to ${to}`,
      source: { object: 'entity-auto' },
      target: { object: 'entity-card' },
      from,
      to,
    })),
  );
  const projection = value(
    app.project(
      collection({
        objects,
        relationships,
        sections: [
          section('er', ids, { wires: relationships.map(({ id }) => ({ relationship: id })) }),
        ],
      }),
    ),
  );
  const visible = projection.sections[0];
  assert(visible);
  kinds.forEach((kind) =>
    frames.forEach((frame) => {
      const node = visible.nodes.find((node) => node.objectId === `${kind}-${frame}`);
      assert(node);
      const runs = node.content.primitives.filter((primitive) => primitive.kind === 'text');
      expect(runs.map((run) => run.text)).toEqual([kind.toUpperCase(), `${kind}-${frame}`]);
      expect(runs[0]?.size).toBeLessThan(runs[1]?.size ?? 0);
      expect(runs[0]?.y).toBeLessThan(runs[1]?.y ?? 0);
      expect(node.headerHeight).toBeLessThanOrEqual(node.height);
      const markup = value(app.renderContent(node));
      expect(markup).toContain(kind.toUpperCase());
      expect(markup).toContain(`${kind}-${frame}`);
    }),
  );
  endpoints.forEach(([from, sourceMarker], i) =>
    endpoints.forEach(([to, targetMarker], j) => {
      const wire = visible.wires.find((wire) => wire.relationshipId === `association-${i}-${j}`);
      assert(wire);
      expect(wire).toMatchObject({ sourceMarker, targetMarker });
      expect(wire.label.outline).toEqual([`${from} relates to ${to}`]);
    }),
  );
  expect(JSON.parse(projection.inputKey).notation).toBe('presentation-notation-2');
});
