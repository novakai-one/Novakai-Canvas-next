import type { DiagramObject } from '../../contract/records/input.js';
import type { DiagramTypography } from '../../contract/records/style.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { ContentContext } from '../../contract/records/content-context.js';
import { measureText, stack } from './text.js';
/** Measure a semantic text role; public project owns provider failure and retains the prior scene. */
export function labelContent(
  text: string,
  context: ContentContext,
  role: keyof DiagramTypography = 'body',
): MeasuredContent {
  return measureText(
    {
      text,
      width: context.width,
      ...context.style.typography[role],
      fill: context.style.text,
    },
    context.metrics,
  );
}

/** Kind labels express domain identity independently of chosen frame, role or media composition. */
const engineeringKinds: Readonly<Partial<Record<DiagramObject['kind'], string>>> = {
  entity: 'ENTITY',
  module: 'MODULE',
  interface: 'INTERFACE',
  function: 'FUNCTION',
};
/** Measure kind and title together so body separators and member anchors start below both. Public project owns failure; Authoring retains the prior scene. */
export function nodeHeading(object: DiagramObject, context: ContentContext): MeasuredContent {
  const title = labelContent(object.label, context, 'nodeHeading');
  const kind = engineeringKinds[object.kind];
  if (kind === undefined) return title;
  const category = labelContent(kind, context, 'annotation');
  return stack([category, title], context.style.gap / 2);
}
