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
  const blockHeight = Math.max(height, label.height);
  const text = offset(number, (width - number.width) / 2, padding + (blockHeight - height) / 2);
  const description = offset(label, width + context.style.gap, (blockHeight - label.height) / 2);
  return {
    width: width + context.style.gap + label.width,
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
      ...description.primitives,
    ],
  };
}

/** Preserve the full relationship meaning; absence of a step retains the existing unnumbered annotation. */
export function measureWireAnnotation(
  wire: Relationship,
  context: ContentContext,
): MeasuredContent {
  const label = labelContent(wireLabel(wire), context, 'annotation');
  if (wire.step === undefined) return label;
  return numberedLabel(wire.step, label, context);
}
