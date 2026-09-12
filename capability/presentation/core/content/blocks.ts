import type { ContentBlock } from '../../contract/records/input.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { ContentContext } from '../../contract/records/content-context.js';
export type { ContentContext } from '../../contract/records/content-context.js';
import { measureField, fieldKey } from './fields.js';
import { measureText } from './text.js';
import { measureTable } from './table.js';
import { measureSignature, measureMember } from './signature.js';
import { measureMedia } from './media.js';
import { reject } from '../validation/outcomes.js';
/** Content processor chooses local presentation only; semantic validity remains in Model. */
type Processor = (block: ContentBlock, context: ContentContext) => MeasuredContent;
/** Prose and code select their pinned role metrics; structured addressable rows have dedicated processors. */
function text(text: string, context: ContentContext, mono = false): MeasuredContent {
  const metric = mono ? context.style.typography.mono : context.style.typography.body;
  return measureText(
    {
      text,
      width: context.width,
      ...metric,
      fill: context.style.text,
    },
    context.metrics,
  );
}
/** Dispatch tables keep adding content kinds outside projection/Authoring orchestration. */
const processors: Readonly<Record<ContentBlock['kind'], Processor>> = {
  text: (block, context) => {
    if (block.kind !== 'text') return mismatch(block);
    return text(block.text, context);
  },
  code: (block, context) => {
    if (block.kind !== 'code') return mismatch(block);
    return text(block.text, context, true);
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
    return text(`${fieldKey(block.key)} (${block.fields.join(', ')})`, context, true);
  },
  member: (block, context) => {
    if (block.kind !== 'member') return mismatch(block);
    return measureMember(block, context);
  },
  signature: (block, context) => {
    if (block.kind !== 'signature') return mismatch(block);
    return measureSignature(block, context);
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
