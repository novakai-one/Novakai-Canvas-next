/** Offline artifact only: DARK pending M10f legality; do not wire into the app. */
import { createNestedRoadScene } from '@novakai/canvas-layout';
import type { RoadPrototypeScene, PrototypeLayoutOptions } from '@novakai/canvas-layout';
import spec from '../../../output/playwright/nested-wires/authoring-scene/scene-spec.json' with { type: 'json' };

/** Build every extracted file/import unchanged. The offline caller owns rebuild recovery.
 * Captions and selection-gated symbol labels decorate public output after routing.
 */
export function buildAuthoringScene(
  options: Pick<PrototypeLayoutOptions, 'measure' | 'sectionInPortsLeft'>,
): RoadPrototypeScene {
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
      label: spec.directories[index]?.path ?? section.label,
    })),
  };
}
function labelWires(scene: RoadPrototypeScene): RoadPrototypeScene {
  if (!scene.wiring?.ok) return scene;
  const labels = new Map(spec.wires.map((wire) => [wire.id, wire.label]));
  return {
    ...scene,
    wiring: {
      ok: true,
      value: scene.wiring.value.map((wire) => {
        const label = labels.get(wire.id);
        if (label === undefined) return wire;
        return { ...wire, label };
      }),
    },
  };
}
