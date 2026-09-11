import type { Dependencies, Presentation, TextRequest } from './types.js';
import type { Result } from './errors.js';
import type { Projection, MeasuredContent, VisualNode } from './records/visual.js';
import { visualNode, markerKind } from './records/visual.js';
import { paint } from './records/style.js';
import { protect, parse, requireValue } from '../core/validation/outcomes.js';
import { projectCollection } from '../core/projection/collection.js';
import { measureText } from '../core/content/text.js';
/** Bind explicit providers once. Every public operation returns a typed failure; Authoring owns apply/recovery. */
export function createPresentation(deps: Dependencies): Presentation {
  return {
    project(input: unknown): Result<Projection> {
      return protect(() => projectCollection(input, deps));
    },
    measureText(request: TextRequest): Result<MeasuredContent> {
      return protect(() => measureText(request, deps.measurement));
    },
    renderContent(input: unknown): Result<string> {
      return protect(() => renderChecked(input, deps));
    },
    marker(kind: unknown, style: unknown): Result<string> {
      return protect(() =>
        requireValue(deps.renderer.marker(parse(markerKind, kind), parse(paint, style))),
      );
    },
  };
}

/** Public rendering checks pinned glyph availability too; externally supplied nodes cannot request OS fallback. */
function renderChecked(
  input: unknown,
  deps: Pick<Dependencies, 'measurement' | 'renderer'>,
): string {
  const node = parse(visualNode, input);
  checkFonts(node, deps.measurement);
  return requireValue(deps.renderer.render(node));
}
/** Existing measured geometry is retained; shaping only verifies the declared font resources and glyphs. */
function checkFonts(node: VisualNode, measurement: Dependencies['measurement']): void {
  node.content.primitives
    .filter((item) => item.kind === 'text')
    .forEach((item) => requireValue(measurement.measure(item.text, item.font, item.size)));
}
