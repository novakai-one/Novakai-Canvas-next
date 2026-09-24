/*
 * Source coordinates. The lexer finds where each line starts once, then turns character offsets
 * into positions (line and column, from 1) and spans. Offsets and columns count UTF-16 code
 * units.
 */
import type { Position, Span } from '../../contract/records/syntax.js';

/**
 * Finds where every line starts.
 *
 * @param source - The source text.
 * @returns The offset of each line's first character, in order; the first is always 0.
 * @throws Never.
 */
export function lineStarts(source: string): readonly number[] {
  return [
    0,
    ...Array.from(
      source.matchAll(/\n/g),
      /** The offset just after this line break. */ (match) => match.index + 1,
    ),
  ];
}

/**
 * Turns an offset into a position.
 *
 * @param starts - The line starts from {@link lineStarts}.
 * @param offset - UTF-16 code units from the start of the source.
 * @returns The offset with its line and column, both counted from 1.
 * @throws Never.
 */
export function position(starts: readonly number[], offset: number): Position {
  const line = lineIndex(starts, offset, 0, starts.length);
  return { offset, line: line + 1, column: offset - (starts[line] ?? 0) + 1 };
}

/**
 * Turns two offsets into a span.
 *
 * @param starts - The line starts from {@link lineStarts}.
 * @param start - The offset of the first character inside the span.
 * @param end - The offset just after the span (exclusive).
 * @returns The span.
 * @throws Never.
 */
export function sourceSpan(starts: readonly number[], start: number, end: number): Span {
  return { start: position(starts, start), end: position(starts, end) };
}

/**
 * The index of the line holding `offset`: a binary search between `lower` (inclusive) and
 * `upper` (exclusive). It recurses once per halving, so the depth grows with log(line count).
 */
function lineIndex(
  starts: readonly number[],
  offset: number,
  lower: number,
  upper: number,
): number {
  if (lower + 1 >= upper) return lower;
  const middle = Math.floor((lower + upper) / 2);
  const precedes = (starts[middle] ?? Infinity) <= offset;
  if (precedes) return lineIndex(starts, offset, middle, upper);
  return lineIndex(starts, offset, lower, middle);
}
