import type { Dependencies, Presentation } from './types.js';
import type { ReactBindings, StaticRenderer } from './react-types.js';
import type { Result } from './errors.js';
import { fontSet } from './records/style.js';
import { createPresentation } from './api.js';
import { createFontMetrics } from '../adapters/fontkit.js';
import { ContentBlocks } from '../adapters/react/ContentBlocks.js';
import {
  createContentRenderer,
  createMarkerRenderer,
  createMeasuredRenderer,
  createFontDefinitions,
} from '../adapters/react/NodeContent.js';
import { createMarkupRenderer } from '../adapters/static-markup.js';
import { markerDrawing } from '../core/notation/markers.js';
import { protect, parse, requireValue } from '../core/validation/outcomes.js';
export type Owners = Pick<Dependencies, 'domain' | 'themes' | 'assets'>;
export interface ComposedPresentation {
  readonly presentation: Presentation;
  readonly react: ReactBindings;
}
/** Exact validated font bytes are shared by measurement and React; host awaits these fonts before exposing canvas. */
export function composePresentation(
  owners: Owners,
  fonts: unknown,
  nativeRender?: StaticRenderer,
): Result<ComposedPresentation> {
  return protect(() => {
    const pinned = parse(fontSet, fonts);
    const measurement = requireValue(createFontMetrics(pinned));
    const react = {
      NodeContent: createContentRenderer(pinned, { ContentBlocks }),
      MeasuredContent: createMeasuredRenderer(pinned, { ContentBlocks }),
      Marker: createMarkerRenderer(markerDrawing),
      fonts: pinned,
      FontDefinitions: createFontDefinitions(pinned),
    };
    const renderer = createMarkupRenderer(react, nativeRender);
    return { presentation: createPresentation({ ...owners, measurement, renderer }), react };
  });
}
