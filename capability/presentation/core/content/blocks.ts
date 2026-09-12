import type { ContentBlock } from '../../contract/records/input.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { ContentContext } from '../../contract/records/content-context.js';
export type { ContentContext } from '../../contract/records/content-context.js';
import { measureField, fieldKey } from './fields.js';
import { measureText } from './text.js';
import { measureTable } from './table.js';
import { measureMedia } from './media.js';
import { reject } from '../validation/outcomes.js';
/** Content processor chooses local presentation only; semantic validity remains in Model. */
type Processor = (block: ContentBlock, context: ContentContext) => MeasuredContent;
/** One textual block carries optional addressable-row metadata at its measured midpoint. */
function text(
  text: string,
  context: ContentContext,
  member: string | null = null,
  mono = false,
): MeasuredContent {
  const font = mono ? context.style.monoFont : context.style.bodyFont;
  const result = measureText(
    {
      text,
      width: context.width,
      font,
      size: context.style.fontSize,
      lineHeight: context.style.lineHeight,
      fill: context.style.text,
    },
    context.metrics,
  );
  if (member === null) return result;
  return {
    ...result,
    anchors: [
      { member, x: 0, y: result.height / 2, direction: 'inout', collapsed: false, label: text },
    ],
  };
}
/** Dispatch tables keep adding content kinds outside projection/Authoring orchestration. */
const processors: Readonly<Record<ContentBlock['kind'], Processor>> = {
  text: (block, context) => {
    if (block.kind !== 'text') return mismatch(block);
    return text(block.text, context);
  },
  code: (block, context) => {
    if (block.kind !== 'code') return mismatch(block);
    return text(block.text, context, null, true);
  },
  list: (block, context) => {
    if (block.kind !== 'list') return mismatch(block);
    return text(
      block.items
        .map((item, index) => `${block.ordered ? String(index + 1) + '.' : '•'} ${item}`)
        .join('\n'),
      context,
    );
  },
  link: (block, context) => {
    if (block.kind !== 'link') return mismatch(block);
    return text(block.label, context);
  },
  image: (block, context) => image(block, context),
  icon: (block, context) => image(block, context),
  field: (block, context) => {
    if (block.kind !== 'field') return mismatch(block);
    return measureField(block, context);
  },
  keygroup: (block, context) => {
    if (block.kind !== 'keygroup') return mismatch(block);
    return text(`${fieldKey(block.key)} (${block.fields.join(', ')})`, context, null, true);
  },
  member: (block, context) => {
    if (block.kind !== 'member') return mismatch(block);
    return text(`${block.visibility} ${block.label}: ${block.type}`, context, block.id, true);
  },
  signature: (block, context) => {
    if (block.kind !== 'signature') return mismatch(block);
    return text(
      `${block.label}(${block.parameters.join(', ')}): ${block.returns}`,
      context,
      block.id,
      true,
    );
  },
  table: (block, context) => {
    if (block.kind !== 'table') return mismatch(block);
    return measureTable(block, context.width, context.style, context.metrics);
  },
};
/** Exhaustive registry mismatches are provider errors, never a blank content fallback. */
function mismatch(block: ContentBlock): never {
  return reject('unknown-kind', block.id, 'Content registry mismatch');
}
/** Images/icons share the same bounded resolver and aspect-ratio policy. */
function image(block: ContentBlock, context: ContentContext): MeasuredContent {
  if (block.kind !== 'image' && block.kind !== 'icon') return mismatch(block);
  return measureMedia(block, context.collection, context.width, context.style, context.assets);
}
/** Canonical content enters through the registered local presentation policy; public project owns typed failure. */
export function measureBlock(block: ContentBlock, context: ContentContext): MeasuredContent {
  return processors[block.kind](block, context);
}
