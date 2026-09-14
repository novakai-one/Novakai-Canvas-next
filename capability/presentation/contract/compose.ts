import type { Dependencies, Presentation } from './types.js';
import type { ReactBindings, StaticRenderer } from './react-types.js';
import type { Result } from './errors.js';
import { fail } from './errors.js';
import { fontSet } from './records/style.js';
import type { FontSet } from './records/style.js';
import { createPresentation } from './api.js';
import { markerDrawing } from '../core/notation/markers.js';
import { protect, parse, requireValue } from '../core/validation/outcomes.js';
export type Owners = Pick<Dependencies, 'domain' | 'themes' | 'assets'>;
export interface ComposedPresentation {
  readonly presentation: Presentation;
  readonly react: ReactBindings;
}
/** Shared SVG bindings load without Node/fontkit; caller restores rejected font resources before mounting. */
export async function createReactBindings(fonts: unknown): Promise<Result<ReactBindings>> {
  try {
    const pinned = parse(fontSet, fonts);
    return { ok: true, value: await bindReact(pinned) };
  } catch {
    return fail('missing-resource', 'fonts', 'Presentation React bindings could not be loaded');
  }
}
/** Resolve concrete React adapters once; render operations share the exact same pinned font definitions. */
async function bindReact(pinned: FontSet): Promise<ReactBindings> {
  const [content, nodes] = await Promise.all([
    import('../adapters/react/ContentBlocks.js'),
    import('../adapters/react/NodeContent.js'),
  ]);
  return {
    NodeContent: nodes.createContentRenderer(pinned, { ContentBlocks: content.ContentBlocks }),
    MeasuredContent: nodes.createMeasuredRenderer(pinned, { ContentBlocks: content.ContentBlocks }),
    Marker: nodes.createMarkerRenderer(markerDrawing),
    fonts: pinned,
    FontDefinitions: nodes.createFontDefinitions(pinned),
  };
}
/** Native measurement is loaded only by service/worker composition; host retains prior session if initialization fails. */
export async function composePresentation(
  owners: Owners,
  fonts: unknown,
  nativeRender?: StaticRenderer,
): Promise<Result<ComposedPresentation>> {
  try {
    const [metrics, markup] = await Promise.all([
      import('../adapters/fontkit.js'),
      import('../adapters/static-markup.js'),
    ]);
    const react = requireValue(await createReactBindings(fonts));
    return protect(() => {
      const measurement = requireValue(metrics.createFontMetrics(react.fonts));
      const renderer = markup.createMarkupRenderer(react, nativeRender);
      return { presentation: createPresentation({ ...owners, measurement, renderer }), react };
    });
  } catch {
    return fail(
      'provider-failed',
      'composition',
      'Native Presentation dependencies could not be loaded',
    );
  }
}
