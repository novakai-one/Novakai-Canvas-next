import { assert, expect, it } from 'vitest';
import type { Projection } from '../contract/index.js';
import {
  collection,
  object,
  edge,
  section,
  project,
  harness,
  request,
  value,
  node,
} from './fixtures.js';

/** Ordering a group around a plain actor must retain room for the labels crossing that boundary, including nested children. */
it('preserves cross-branch label room when hard ordering moves grid seeds', async () => {
  for (const nested of [false, true]) {
    await checkCorridor(nested);
  }
});

/** The two variants differ only in nesting; neither authors coordinates. */
function projection(nested: boolean): Projection {
  return project(
    collection({
      objects: [object('source'), object('middle'), object('target')],
      relationships: [
        edge('input', 'source', 'middle', { label: 'compiled diagram intent' }),
        edge('output', 'middle', 'target', { label: 'accepted validated result' }),
      ],
      sections: [
        section('story', [], {
          mode: 'story',
          layout: {
            algorithm: 'grid',
            columns: 3,
            direction: 'right',
            gap: 'compact',
            constraints: [
              {
                kind: 'before',
                targets: [
                  { kind: 'group', id: 'inputs' },
                  { kind: 'object', id: 'middle' },
                ],
              },
              {
                kind: 'before',
                targets: [
                  { kind: 'object', id: 'middle' },
                  { kind: 'group', id: 'outputs' },
                ],
              },
            ],
          },
          groups: [
            { id: 'inputs', title: 'Inputs', layout: { algorithm: 'grid' } },
            { id: 'outputs', title: 'Outputs', layout: { algorithm: 'grid' } },
            ...nestedGroups(nested),
          ],
          appearances: [
            { object: 'source', group: nested ? 'inner' : 'inputs' },
            { object: 'target', group: 'outputs' },
            { object: 'middle' },
          ],
          wires: ['input', 'output'].map((relationship) => ({
            relationship,
            sourceSide: 'right',
            targetSide: 'left',
          })),
        }),
      ],
    }),
  );
}

/** Inspect solved branch envelopes against the actual label extent; success alone is insufficient. */
async function checkCorridor(nested: boolean): Promise<void> {
  const source = projection(nested);
  const layout = await harness([source]);
  const scene = value(await layout.arrange(request(layout, source)));
  const nodes = scene.sections[0]?.nodes;
  const input = nodes?.find((item) => item.measured.groupId === 'inputs');
  const output = nodes?.find((item) => item.measured.groupId === 'outputs');
  const middle = node(scene, 'middle');
  assert(input && output);
  const labels = source.sections[0]?.wires.map((wire) => wire.label.width);
  assert(labels && labels.length === 2);
  const widest = Math.max(...labels);
  expect(middle.box.x - input.box.x - input.box.width).toBeGreaterThanOrEqual(widest);
  expect(output.box.x - middle.box.x - middle.box.width).toBeGreaterThanOrEqual(widest);
}

/** The optional inner scope is fixture data; keep branching outside the collection declaration. */
interface NestedGroupFixture {
  readonly id: string;
  readonly title: string;
  readonly parent: string;
  readonly layout: { readonly algorithm: 'grid' };
}

/** Select the single additional scope without modifying either fixture variant. */
function nestedGroups(nested: boolean): readonly NestedGroupFixture[] {
  if (!nested) return [];
  return [{ id: 'inner', title: 'Compiler', parent: 'inputs', layout: { algorithm: 'grid' } }];
}
