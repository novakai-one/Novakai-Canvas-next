import type { MeasurementPort, TextMetrics } from '../../contract/ports/measurement.js';
import type { MeasuredContent, TextRun } from '../../contract/records/visual.js';
import type { TextRequest } from '../../contract/types.js';
import { content as contentSchema } from '../../contract/records/visual.js';
import { requireValue, reject, parse } from '../validation/outcomes.js';
interface Lines {
  readonly complete: readonly string[];
  readonly current: string;
}
/** Exact font metrics are checked before they can become layout geometry. */
function measure(text: string, request: TextRequest, metrics: MeasurementPort): TextMetrics {
  const value = requireValue(metrics.measure(text, request.font, request.size));
  if (
    ![value.width, value.ascent, value.descent].every(
      (number) => Number.isFinite(number) && number >= 0,
    )
  )
    return reject('provider-failed', 'metrics', 'Invalid font measurement');
  return value;
}
/** Segment at grapheme boundaries, preserving combining characters and surrogate pairs as one unit. */
function graphemes(text: string): readonly string[] {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  return Array.from(segmenter.segment(text), (item) => item.segment);
}
/** Keep a fitting candidate on its line; overflow starts a new line without clipping an indivisible grapheme. */
function append(state: Lines, next: string, request: TextRequest, metrics: MeasurementPort): Lines {
  const candidate = state.current + next;
  const width = measure(candidate, request, metrics).width;
  if (width <= request.width || state.current.length === 0) return { ...state, current: candidate };
  return breakLine(state, next);
}
/** Prefer the last word boundary; unbroken identifiers split only between complete graphemes. */
function breakLine(state: Lines, next: string): Lines {
  const split = state.current.lastIndexOf(' ');
  if (split > 0)
    return {
      complete: [...state.complete, state.current.slice(0, split + 1)],
      current: state.current.slice(split + 1) + next,
    };
  return { complete: [...state.complete, state.current], current: next };
}
/** Explicit source newlines remain line boundaries, including empty lines. */
function paragraph(
  text: string,
  request: TextRequest,
  metrics: MeasurementPort,
): readonly string[] {
  const result = graphemes(text).reduce<Lines>(
    (state, next) => append(state, next, request, metrics),
    { complete: [], current: '' },
  );
  return [...result.complete, result.current];
}
/** Public text requests are bounded before native shaping; callers correct unsupported or oversized input. */
function checkRequest(request: TextRequest): void {
  if (request.text.length > 100000) reject('limit', 'text', 'Text block exceeds100000characters');
  if (
    ![request.width, request.size, request.lineHeight].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    reject('invalid-input', 'text', 'Text dimensions must be finite and positive');
}
/** A final run stores the actual shaped width and baseline used by both renderers. */
function run(
  text: string,
  index: number,
  lineHeight: number,
  request: TextRequest,
  metrics: MeasurementPort,
): TextRun {
  const measured = measure(text, request, metrics);
  return {
    kind: 'text',
    text,
    x: 0,
    y: index * lineHeight + measured.ascent,
    width: measured.width,
    font: request.font,
    size: request.size,
    fill: request.fill,
  };
}
/** Wrap and measure once. Renderer consumes these exact runs; Authoring owns preview rejection/retry. */
export function measureText(request: TextRequest, metrics: MeasurementPort): MeasuredContent {
  checkRequest(request);
  const lines = request.text.split('\n').flatMap((text) => paragraph(text, request, metrics));
  if (lines.length > 10000) return reject('limit', 'text', 'Text exceeds10000lines');
  return parse(contentSchema, finish(lines, request, metrics));
}
/** Ascender/descender floor prevents line boxes from overlapping even under compact token preferences. */
function finish(
  lines: readonly string[],
  request: TextRequest,
  metrics: MeasurementPort,
): MeasuredContent {
  const samples = lines.map((text) => measure(text, request, metrics));
  const lineHeight = Math.max(
    request.lineHeight,
    ...samples.map((value) => value.ascent + value.descent),
  );
  const primitives = lines.map((text, index) => run(text, index, lineHeight, request, metrics));
  return {
    width: Math.max(0, ...samples.map((value) => value.width)),
    height: lineHeight * lines.length,
    primitives,
    anchors: [],
    outline: [request.text],
  };
}
/** Move measured local content by an explicit typography offset; this is not global diagram layout. */
export function offset(content: MeasuredContent, x: number, y: number): MeasuredContent {
  return {
    ...content,
    primitives: content.primitives.map((item) => movePrimitive(item, x, y)),
    anchors: content.anchors.map((anchor) => ({ ...anchor, x: anchor.x + x, y: anchor.y + y })),
  };
}
/** Each primitive family names its own coordinate fields; no arbitrary JSON path mutation. */
function movePrimitive(
  item: MeasuredContent['primitives'][number],
  x: number,
  y: number,
): MeasuredContent['primitives'][number] {
  if (item.kind === 'rule')
    return { ...item, x1: item.x1 + x, x2: item.x2 + x, y1: item.y1 + y, y2: item.y2 + y };
  return { ...item, x: item.x + x, y: item.y + y };
}
/** Ordered blocks share one vertical flow; their explicit local anchors move with the same content. */
export function stack(contents: readonly MeasuredContent[], gap: number): MeasuredContent {
  const positioned = contents.reduce<readonly MeasuredContent[]>(
    (result, content) => appendContent(result, content, gap),
    [],
  );
  return {
    width: Math.max(0, ...contents.map((item) => item.width)),
    height: stackHeight(contents, gap),
    primitives: positioned.flatMap((item) => item.primitives),
    anchors: positioned.flatMap((item) => item.anchors),
    outline: contents.flatMap((item) => item.outline),
  };
}
/** Track intrinsic height on original blocks; positioned offsets never alter the measured extents. */
function appendContent(
  result: readonly MeasuredContent[],
  content: MeasuredContent,
  gap: number,
): readonly MeasuredContent[] {
  const y = stackHeight(result, gap) + gapBefore(result, gap);
  return [...result, offset(content, 0, y)];
}
/** No leading gap; empty composition has exactly zero height. */
function gapBefore(contents: readonly MeasuredContent[], gap: number): number {
  if (contents.length === 0) return 0;
  return gap;
}
/** Intrinsic heights remain additive regardless of primitive positions. */
function stackHeight(contents: readonly MeasuredContent[], gap: number): number {
  return (
    contents.reduce((height, item) => height + item.height, 0) +
    Math.max(0, contents.length - 1) * gap
  );
}
