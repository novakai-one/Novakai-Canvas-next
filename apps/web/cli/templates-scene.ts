import { createNestedRoadScene } from '@novakai/canvas-layout';
import type { PrototypeLayoutMeasure } from '@novakai/canvas-layout';
import spec from '../../../output/playwright/nested-wires/templates-scene/scene-spec.json' with { type: 'json' };

const directories = [
  'contract',
  'contract/ports',
  'contract/records',
  'core',
  'core/admission',
  'core/discovery',
  'core/expansion',
  'core/validation',
  'adapters',
];

/** Render the extracted semantic fixture; the prototype host owns reload/recovery.
 * Directory captions decorate public output without supplying geometry or routing policy.
 */
export function buildTemplatesScene(options: { readonly measure: PrototypeLayoutMeasure }) {
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
      label: directories[index] ?? section.label,
    })),
  };
}
