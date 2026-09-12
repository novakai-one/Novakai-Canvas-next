import type { ContentBlock } from '../../contract/records/input.js';
import type { ContentContext, FieldColumns } from '../../contract/records/content-context.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import { requireValue } from '../validation/outcomes.js';
import { measureText, offset } from './text.js';
type Field = Extract<ContentBlock, { kind: 'field' }>;
const keys: Readonly<Record<string, string>> = { primary: 'PK', foreign: 'FK', unique: 'UQ' };
/** Empty key cells are meaningful; key vocabulary is shared by visible text and accessible row descriptions. */
export function fieldKey(key: Field['key']): string {
  if (key === undefined) return '';
  return keys[key] ?? '';
}
/** Optionality is visible without repeating the word required in every row; the full meaning remains in its accessible outline. */
function typeLabel(field: Field): string {
  return field.nullable ? `${field.type}?` : field.type;
}
/** Actual pinned glyph metrics determine column minimums; long identifiers wrap at the token-defined large width. */
function column(values: readonly string[], context: ContentContext): number {
  const widths = values.map(
    (text) =>
      requireValue(context.metrics.measure(text, context.style.monoFont, context.style.fontSize))
        .width,
  );
  return (
    Math.ceil(Math.min(context.style.widths.large, Math.max(context.style.fontSize, ...widths))) +
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
    key: column(['PK', 'FK', 'UQ'], context),
    name: column(
      fields.map((field) => `${field.label}:`),
      context,
    ),
    type: column(fields.map(typeLabel), context),
  };
}
/** Each cell is measured in its assigned column and vertically padded with diagram tokens. */
function cell(text: string, width: number, x: number, context: ContentContext): MeasuredContent {
  const measured = measureText(
    {
      text,
      width: width - context.style.gap * 2,
      font: context.style.monoFont,
      size: context.style.fontSize,
      lineHeight: context.style.lineHeight,
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
    cell(fieldKey(field.key), columns.key, 0, context),
    cell(`${field.label}:`, columns.name, columns.key, context),
    cell(typeLabel(field), columns.type, columns.key + columns.name, context),
  ];
  const height = Math.max(...values.map((value) => value.height)) + context.style.gap * 2;
  const width = columns.key + columns.name + columns.type;
  const nullability = field.nullable ? 'nullable' : 'required';
  const label = `${fieldKey(field.key)} ${field.label}: ${field.type} · ${nullability}`.trim();
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
