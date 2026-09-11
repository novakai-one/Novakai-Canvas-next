import type { ContentBlock } from '../../contract/records/input.js';
import type { ResolvedStyle } from '../../contract/records/style.js';
import type { MeasuredContent } from '../../contract/records/visual.js';
import type { MeasurementPort } from '../../contract/ports/measurement.js';
import { measureText, offset, stack } from './text.js';
interface RowInput {
  readonly id: string | null;
  readonly cells: readonly string[];
}
/** Each cell uses the same pinned mono metrics; widest row determines intrinsic table width. */
function cell(
  text: string,
  width: number,
  style: ResolvedStyle,
  metrics: MeasurementPort,
): MeasuredContent {
  return measureText(
    {
      text,
      width,
      font: style.monoFont,
      size: style.fontSize,
      lineHeight: style.lineHeight,
      fill: style.text,
    },
    metrics,
  );
}
/** Measured cells share a row height; its midpoint is the stable endpoint for an addressable row. */
function row(
  input: RowInput,
  width: number,
  style: ResolvedStyle,
  metrics: MeasurementPort,
): MeasuredContent {
  const cellWidth = width / input.cells.length;
  const cells = input.cells.map((text) =>
    cell(text, cellWidth - style.padding * 2, style, metrics),
  );
  const height = Math.max(...cells.map((value) => value.height)) + style.padding * 2;
  const positioned = cells.map((value, index) =>
    offset(value, index * cellWidth + style.padding, style.padding),
  );
  const anchors =
    input.id === null
      ? []
      : [
          {
            member: input.id,
            x: 0,
            y: height / 2,
            direction: 'inout' as const,
            collapsed: false,
            label: input.cells.join(' | '),
          },
        ];
  return {
    width,
    height,
    primitives: [
      ...positioned.flatMap((value) => value.primitives),
      {
        kind: 'rule',
        x1: 0,
        y1: height,
        x2: width,
        y2: height,
        stroke: style.border,
        width: style.stroke,
      },
    ],
    anchors,
    outline: [input.cells.join(' | ')],
  };
}
/** Tables grow horizontally for readable columns; they never squeeze many headings into a fixed card width. */
export function measureTable(
  block: Extract<ContentBlock, { kind: 'table' }>,
  width: number,
  style: ResolvedStyle,
  metrics: MeasurementPort,
): MeasuredContent {
  const tableWidth = Math.max(width, block.columns.length * style.widths.small);
  const rows: readonly RowInput[] = [{ id: null, cells: block.columns }, ...block.rows];
  return stack(
    rows.map((value) => row(value, tableWidth, style, metrics)),
    0,
  );
}
