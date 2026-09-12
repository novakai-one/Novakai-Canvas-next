import type { DiagramTypography } from '../../contract/records/style.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { ContentContext } from '../../contract/records/content-context.js';
import { measureText } from './text.js';
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
