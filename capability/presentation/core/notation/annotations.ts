import type { Relationship } from '../../contract/records/input.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { ContentContext } from '../../contract/records/content-context.js';
import { labelContent } from '../content/headings.js';
import { offset } from '../content/text.js';
import { wireLabel } from './wires.js';

/** A numbered label is one measured obstacle; Layout does not have to guess badge size or text position. */
function numberedLabel(
  step: number,
  label: MeasuredContent,
  context: ContentContext,
): MeasuredContent {
  const paint = context.style.connection.paint;
  const number = labelContent(
    String(step),
    {
      ...context,
      style: { ...context.style, text: paint.fill },
    },
    'annotation',
  );
  const padding = context.style.gap / 2;
  const height = number.height + padding * 2;
  const width = Math.max(height, number.width + padding * 2);
  const description = measureBadge(label, context);
  const blockHeight = Math.max(height, description.height);
  const text = offset(number, (width - number.width) / 2, padding + (blockHeight - height) / 2);
  const detail = offset(
    description,
    width + context.style.gap,
    (blockHeight - description.height) / 2,
  );
  return {
    width: width + context.style.gap + description.width,
    height: blockHeight,
    anchors: [],
    outline: [`Step ${step}`, ...label.outline],
    primitives: [
      {
        kind: 'badge',
        x: 0,
        y: (blockHeight - height) / 2,
        width,
        height,
        radius: height / 2,
        fill: paint.stroke,
        stroke: paint.stroke,
        strokeWidth: context.style.stroke,
      },
      ...text.primitives,
      ...detail.primitives,
    ],
  };
}

/** Shared capsule encloses already measured text; callers reserve padding before wrapping. Project owns measurement failures. */
export function measureBadge(label: MeasuredContent, context: ContentContext): MeasuredContent {
  const padding = context.style.gap / 2;
  const height = label.height + padding * 2;
  const width = label.width + padding * 2;
  return {
    width,
    height,
    anchors: [],
    outline: label.outline,
    primitives: [
      {
        kind: 'badge',
        x: 0,
        y: 0,
        width,
        height,
        radius: height / 2,
        fill: context.style.surface,
        stroke: context.style.border,
        strokeWidth: context.style.stroke,
      },
      ...offset(label, padding, padding).primitives,
    ],
  };
}

/** Preserve the full relationship meaning; absence of a step retains the existing unnumbered annotation. */
export function measureWireAnnotation(
  wire: Relationship,
  context: ContentContext,
): MeasuredContent {
  const label = labelContent(wireLabel(wire), context, 'annotation');
  if (wire.step === undefined) return measureBadge(label, context);
  return numberedLabel(wire.step, label, context);
}
