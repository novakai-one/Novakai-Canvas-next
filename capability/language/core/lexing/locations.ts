import type { Position, Span } from '../../contract/records/syntax.js';
/** Precompute line boundaries once; offsets and columns count UTF16 code units. */
export function lineStarts(source: string): readonly number[] {
  return [0, ...Array.from(source.matchAll(/\n/g), (match) => match.index + 1)];
}
/** Binary search recurses logarithmically in line count with immutable bounds. */
function lineIndex(
  starts: readonly number[],
  offset: number,
  lower: number,
  upper: number,
): number {
  if (lower + 1 >= upper) return lower;
  const middle = Math.floor((lower + upper) / 2);
  const precedes = (starts[middle] ?? Infinity) <= offset;
  return precedes
    ? lineIndex(starts, offset, middle, upper)
    : lineIndex(starts, offset, lower, middle);
}
/** Compute a position without shared cursor state; Language owns correction. */
export function position(starts: readonly number[], offset: number): Position {
  const line = lineIndex(starts, offset, 0, starts.length);
  return { offset, line: line + 1, column: offset - (starts[line] ?? 0) + 1 };
}
/** Produce an exclusive range using the one shared source coordinate convention. */
export function sourceSpan(starts: readonly number[], start: number, end: number): Span {
  return { start: position(starts, start), end: position(starts, end) };
}
