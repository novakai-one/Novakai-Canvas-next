import { createNestedRoadScene } from '@novakai/canvas-layout';
import type { PrototypeLayoutMeasure } from '@novakai/canvas-layout';
import spec from '../../../output/playwright/nested-wires/scale-scene/scale-scene-spec.json' with { type: 'json' };

const labels = [
  'contract',
  'contract/ports',
  'contract/records',
  'core',
  'core/admission',
  'core/discovery',
  'core/expansion',
  'core/validation',
  'adapters',
  'service',
  'web',
  'cli',
];

/** Render semantic scale data through Layout; the browser host owns failed-build recovery. */
export function buildScaleScene(options: { readonly measure: PrototypeLayoutMeasure }) {
  const scene = createNestedRoadScene({
    ...options,
    spec: {
      sections: spec.sections,
      requests: spec.requests.map(([from = 0, to = 0]) => [from, to] as const),
    },
  });
  return {
    ...scene,
    sections: scene.sections.map((section, index) => ({
      ...section,
      label: labels[index] ?? section.label,
    })),
  };
}
