import { assert, expect, it } from 'vitest';
import { collection, object, edge, section, project, harness, request, value } from './fixtures.js';

/** An unobstructed reciprocal lane above/below a row must not retrace horizontally past both actors. */
it('routes reciprocal vertical attachments on the free horizontal return lane', async () => {
  for (const side of ['top', 'bottom'] as const) await checkReturnLane(side);
});

/** Real native geometry is checked against endpoint bounds, independent of the router's checkpoint construction. */
async function checkReturnLane(side: 'top' | 'bottom'): Promise<void> {
  const source = project(
    collection({
      objects: [object('draft', 'state'), object('review', 'state')],
      relationships: [
        edge('submit', 'draft', 'review', { kind: 'transition', label: 'Submit for review' }),
        edge('revise', 'review', 'draft', { kind: 'transition', label: 'Request revision' }),
      ],
      sections: [
        section('cycle', ['draft', 'review'], {
          mode: 'state',
          layout: {
            algorithm: 'layered',
            direction: 'right',
            gap: 'roomy',
            constraints: [
              {
                kind: 'rank',
                targets: [
                  { kind: 'object', id: 'draft' },
                  { kind: 'object', id: 'review' },
                ],
              },
            ],
          },
          wires: [
            { relationship: 'submit', sourceSide: 'right', targetSide: 'left' },
            { relationship: 'revise', sourceSide: side, targetSide: side },
          ],
        }),
      ],
    }),
  );
  const layout = await harness([source]);
  const scene = value(await layout.arrange(request(layout, source)));
  const expected = source.sections[0]?.wires.find((wire) => wire.relationshipId === 'revise');
  assert(expected);
  const wire = scene.sections[0]?.wires.find((wire) => wire.id === expected.id);
  assert(wire);
  const left = Math.min(wire.source.point.x, wire.target.point.x);
  const right = Math.max(wire.source.point.x, wire.target.point.x);
  expect(Math.min(...wire.points.map((point) => point.x))).toBeGreaterThanOrEqual(left - 0.000001);
  expect(Math.max(...wire.points.map((point) => point.x))).toBeLessThanOrEqual(right + 0.000001);
  const verticalExtent =
    Math.max(...wire.points.map((point) => point.y)) -
    Math.min(...wire.points.map((point) => point.y));
  // An empty row needs no return excursion larger than its actor span or label. This is a generous locality bound, not an optimal-path oracle.
  const localityLimit = Math.max(right - left, wire.measuredLabel.width, wire.measuredLabel.height);
  expect(verticalExtent).toBeLessThanOrEqual(localityLimit);
  expect(wire.measuredLabel.outline).toEqual(['Request revision']);
}
