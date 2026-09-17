import { createNestedRoadScene } from '@novakai/canvas-layout';
import type { RoadPrototypeScene, PrototypeLayoutMeasure } from '@novakai/canvas-layout';
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
 * Directory captions and imported-name labels decorate completed public output only.
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
    ...labelWires(scene),
    sections: scene.sections.map((section, index) => ({
      ...section,
      label: directories[index] ?? section.label,
    })),
  };
}

/** Optional metadata is attached after layout; failed routing retains its typed outcome. */
function labelWires(scene: RoadPrototypeScene): RoadPrototypeScene {
  if (!scene.wiring?.ok) return scene;
  const labels = new Map(spec.wires.map((wire) => [wire.id, wire.label]));
  return {
    ...scene,
    wiring: {
      ok: true,
      value: scene.wiring.value.map((wire) => ({ ...wire, label: labels.get(wire.id) ?? wire.id })),
    },
  };
}
