import type { ContentBlock, InputCollection } from '../../contract/records/input.js';
import type { ResolvedStyle } from '../../contract/records/style.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { MeasurementPort } from '../../contract/ports/measurement.js';
import type { AssetReader } from '../../contract/ports/resources.js';
import { measureText } from './text.js';
import { measureTable } from './table.js';
import { measureMedia } from './media.js';
import { reject } from '../validation/outcomes.js';
export interface ContentContext {
  readonly collection: InputCollection;
  readonly width: number;
  readonly style: ResolvedStyle;
  readonly metrics: MeasurementPort;
  readonly assets: AssetReader;
}
/** Content processor chooses local presentation only; semantic validity remains in Model. */
type Processor = (block: ContentBlock, context: ContentContext) => MeasuredContent;
/** Textual type/key labels remain ordinary readable text, never executable code. */
const keyNames: Readonly<Record<string, string>> = { primary: 'PK', foreign: 'FK', unique: 'UQ' };
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
    const key = keyPrefix(block.key);
    const nullable = block.nullable ? 'nullable' : 'required';
    return text(`${key}${block.label}: ${block.type} · ${nullable}`, context, block.id, true);
  },
  keygroup: (block, context) => {
    if (block.kind !== 'keygroup') return mismatch(block);
    return text(`${keyNames[block.key]} (${block.fields.join(', ')})`, context, null, true);
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

/** Key absence has one explicit display meaning; no boolean polarity switch at field call sites. */
function keyPrefix(key: Extract<ContentBlock, { kind: 'field' }>['key']): string {
  if (key === undefined) return '';
  return keyNames[key] + ' ';
}
