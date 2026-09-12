import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement, ComponentType } from 'react';
import type {
  DrawingSlots,
  SceneRenderer,
  PlacedSection,
  Paint,
} from '../../contract/render-types.js';
import type { RenderInput } from '../../contract/ports/formats.js';
import type { Result } from '../../contract/errors.js';
import { failure } from '../../contract/errors.js';
/** Static React serialization escapes authored text and attributes without executing diagram content. */
export function createSceneRenderer(
  slots: DrawingSlots,
  FontDefinitions: ComponentType,
  fontDigests: readonly string[],
): SceneRenderer {
  /** Apply section origin once; grouped nodes already include their ancestor placement within the section. */
  function section(item: PlacedSection, paint: Paint): ReactElement {
    return (
      <g key={item.id} data-section={item.id}>
        <rect {...item.box} fill={paint.fill} stroke={paint.stroke} />
        <g transform={`translate(${item.origin.x} ${item.origin.y})`}>
          {slots.label(item.title.content, item.title.box)}
          {item.nodes.map(slots.node)}
          {item.wires.map((wire) => slots.wire(wire, paint))}
          {slots.sequence(item.sequence, paint)}
        </g>
      </g>
    );
  }
  /** Renderer exceptions become typed failures; the job lifecycle retains responsibility for releasing its lease. */
  function render(input: RenderInput): Result<string> {
    try {
      return checkFonts(serialize(input), fontDigests);
    } catch {
      return failure('encoding-failed', 'svg', 'Shared presentation could not render this scene');
    }
  }
  /** Selected global bounds produce the root viewBox, including negative origins. */
  function serialize(input: RenderInput): string {
    const box = input.selection.bounds;
    const identity = input.snapshot.identity;
    return renderToStaticMarkup(
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={box.width}
        height={box.height}
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        role="img"
        aria-label={identity.title}
      >
        <title>{identity.title}</title>
        <desc>{`Collection ${identity.collectionId}, revision ${identity.revision}`}</desc>
        <metadata>{JSON.stringify(identity)}</metadata>
        <FontDefinitions />
        <rect {...box} fill={input.snapshot.paint.fill} />
        {input.selection.sections.map((item) => section(item, input.snapshot.paint))}
      </svg>,
    );
  }
  return { render };
}

/** Missing digest aliases must not silently become a browser or native system-font fallback. */
function checkFonts(svg: string, fontDigests: readonly string[]): Result<string> {
  const aliases = Array.from(
    svg.matchAll(/font-family="canvas-([a-f0-9]{64})"/g),
    (match) => match[1],
  );
  if (!aliases.every((digest) => fontDigests.includes(digest ?? '')))
    return failure(
      'encoding-failed',
      'fonts',
      'Scene text has no matching embedded font definition',
    );
  return { ok: true, value: svg };
}
