import { assert, expect, it } from 'vitest';
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
  metrics,
  settings,
} from './fixtures.js';

/** Unequal depth and long text must retain the parent tree while a cross-reference remains a routed relationship. */
it('fits an uneven engineering tree with an independently labelled cross-reference', async () => {
  const source = project(
    collection({
      objects: [
        object('root', 'concept'),
        object('question', 'concept'),
        object('evidence', 'concept'),
        object('observations', 'concept'),
        object('calibration', 'concept', {
          content: [
            {
              kind: 'text',
              id: 'instructions',
              text: 'Calibrate against the same certified reference before every observation.',
            },
          ],
        }),
      ],
      relationships: [
        edge('defines', 'root', 'question', { kind: 'parent' }),
        edge('retains', 'root', 'evidence', { kind: 'parent' }),
        edge('measures', 'evidence', 'observations', { kind: 'parent' }),
        edge('standardizes', 'observations', 'calibration', { kind: 'parent' }),
        edge('answers', 'observations', 'question', {
          kind: 'reference',
          label: 'answers the research question',
        }),
      ],
      sections: [
        section('study', ['root', 'question', 'evidence', 'observations', 'calibration'], {
          mode: 'tree',
          root: 'root',
          layout: { algorithm: 'tree', direction: 'right', gap: 'normal' },
          wires: ['defines', 'retains', 'measures', 'standardizes', 'answers'].map(
            (relationship) => ({ relationship }),
          ),
        }),
      ],
    }),
  );
  const layout = await harness([source]);
  const scene = value(await layout.arrange(request(layout, source)));
  const visible = scene.sections[0];
  assert(visible);
  const root = node(scene, 'root');
  const evidence = node(scene, 'evidence');
  const observations = node(scene, 'observations');
  const calibration = node(scene, 'calibration');
  expect(root.box.x + root.box.width).toBeLessThan(evidence.box.x);
  expect(evidence.box.x + evidence.box.width).toBeLessThan(observations.box.x);
  expect(observations.box.x + observations.box.width).toBeLessThan(calibration.box.x);
  expect(node(scene, 'question').box.x).toBeLessThan(observations.box.x);
  const projectedReference = source.sections[0]?.wires.find(
    (wire) => wire.relationshipId === 'answers',
  );
  assert(projectedReference);
  expect(projectedReference.kind).toBe('reference');
  const reference = visible.wires.find((wire) => wire.id === projectedReference.id);
  assert(reference);
  expect(reference.measuredLabel.outline).toEqual(['answers the research question']);
  expect(reference.points.length).toBeGreaterThanOrEqual(2);
  expect(reference.labelBox.width).toBeGreaterThan(0);
  expect(
    value(
      layout.inspect({
        projection: source,
        measurements: metrics(source),
        options: settings,
        candidate: scene,
      }),
    ).valid,
  ).toBe(true);
});
