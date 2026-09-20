import type { ContentBlock } from '../../contract/records/input.js';
import type { ContentContext, FieldColumns } from '../../contract/records/content-context.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import { requireValue } from '../validation/outcomes.js';
import { measureText, offset } from './text.js';
type Field = Extract<ContentBlock, { kind: 'field' }>;
type Key = Exclude<Field['key'], undefined>;
const keys: Readonly<Record<Key, string>> = { primary: 'PK', foreign: 'FK', unique: 'UQ' };
const keyOrder: readonly Key[] = ['primary', 'foreign', 'unique'];
/** Empty key cells are meaningful; key vocabulary is shared by visible text and accessible row descriptions. */
export function fieldKey(key: Field['key']): string {
  if (key === undefined) return '';
  return keys[key];
}
/** Canonical composite membership survives a view that hides the key-group summary. */
function compositeKeys(field: Field, context: ContentContext): readonly Key[] {
  const owner = context.owner;
  if (owner === undefined) return [];
  return owner.content
    .filter((block) => block.kind === 'keygroup')
    .filter((group) => group.fields.includes(field.id))
    .map((group) => group.key);
}
/** A field may be PK and FK together; fixed role order keeps the visible badge unambiguous. */
function fieldBadge(field: Field, context: ContentContext): string {
  const membership = [field.key, ...compositeKeys(field, context)];
  return keyOrder
    .filter((key) => membership.includes(key))
    .map((key) => keys[key])
    .join('/');
}
/** Optionality is visible without repeating the word required in every row; the full meaning remains in its accessible outline. */
function typeLabel(field: Field, context: ContentContext): string {
  const type = context.resolveFieldType?.(field) ?? (typeof field.type === 'string' ? field.type : `@${field.type.id}`);
  return field.nullable ? `${type}?` : type;
}
/** Actual pinned glyph metrics determine column minimums; atomic identifiers retain their full width. */
function column(values: readonly string[], context: ContentContext): number {
  const widths = values.map(
    (text) =>
      requireValue(
        context.metrics.measure(
          text,
          context.style.typography.mono.font,
          context.style.typography.mono.size,
        ),
      ).width,
  );
  return (
    Math.ceil(Math.max(context.style.typography.mono.size, ...widths)) +
    context.style.stroke +
    context.style.gap * 2
  );
}
/** All fields in a node share identical column starts, producing an ER table rather than independently wrapped prose. */
export function fieldColumns(
  blocks: readonly ContentBlock[],
  context: ContentContext,
): FieldColumns {
  const fields = blocks.filter((block) => block.kind === 'field');
  return {
    key: column(
      fields.map((field) => fieldBadge(field, context)),
      context,
    ),
    name: column(
      fields.map((field) => `${field.label}:`),
      context,
    ),
    type: column(fields.map((field) => typeLabel(field, context)), context),
  };
}
/** Each cell is measured in its assigned column and vertically padded with diagram tokens. */
function cell(text: string, width: number, x: number, context: ContentContext): MeasuredContent {
  const measured = measureText(
    {
      text,
      width: width - context.style.gap * 2,
      ...context.style.typography.mono,
      fill: context.style.text,
    },
    context.metrics,
  );
  return offset(measured, x + context.style.gap, context.style.gap);
}
/** Row anchors remain at the measured row midpoint; FK wires attach to fields while canonical data remains unchanged. */
export function measureField(field: Field, context: ContentContext): MeasuredContent {
  const columns = context.fields ?? fieldColumns([field], context);
  const values = [
    cell(fieldBadge(field, context), columns.key, 0, context),
    cell(`${field.label}:`, columns.name, columns.key, context),
    cell(typeLabel(field, context), columns.type, columns.key + columns.name, context),
  ];
  const height =
    Math.max(context.style.contentSizing.rowMinimum, ...values.map((value) => value.height)) +
    context.style.gap * 2;
  const width = columns.key + columns.name + columns.type;
  const nullability = field.nullable ? 'nullable' : 'required';
  const label =
    `${fieldBadge(field, context)} ${field.label}: ${typeLabel(field, context).replace(/\?$/, '')} · ${nullability}`.trim();
  return {
    width,
    height,
    primitives: [
      ...values.flatMap((value) => value.primitives),
      {
        kind: 'rule',
        x1: 0,
        x2: width,
        y1: height,
        y2: height,
        stroke: context.style.border,
        width: context.style.stroke,
      },
    ],
    anchors: [
      { member: field.id, x: 0, y: height / 2, direction: 'inout', collapsed: false, label },
    ],
    outline: [label],
  };
}
