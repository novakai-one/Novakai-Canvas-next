import type { Point, Box } from '../../contract/records/geometry.js';
import type { MeasuredContent } from '../../contract/records/input.js';
import type { Segment } from './paths.js';
import { segments } from './paths.js';
import { overlaps } from '../geometry/intersections.js';
import { expand } from '../geometry/bounds.js';
/** Label candidates remain adjacent to their actual wire segment; no detached fallback label is fabricated. */
function atFraction(
  segment: Segment,
  content: MeasuredContent,
  gap: number,
  fraction: number,
): readonly Box[] {
  const x = segment.a.x + (segment.b.x - segment.a.x) * fraction;
  const y = segment.a.y + (segment.b.y - segment.a.y) * fraction;
  const width = content.width;
  const height = content.height;
  if (segment.a.y === segment.b.y)
    return [
      { x: x - width / 2, y: y - gap - height, width, height },
      { x: x - width / 2, y: y + gap, width, height },
    ];
  return [
    { x: x + gap, y: y - height / 2, width, height },
    { x: x - gap - width, y: y - height / 2, width, height },
  ];
}
/** Midpoint is preferred; quarter positions allow labels to avoid crossing routes without becoming detached. */
export function candidates(
  segment: Segment,
  content: MeasuredContent,
  gap: number,
): readonly Box[] {
  return [0.5, 0.25, 0.75].flatMap((fraction) => atFraction(segment, content, gap, fraction));
}
/** Search longest segments first so an engineering label reads with a substantial part of its wire. */
export function labelBox(
  points: readonly Point[],
  content: MeasuredContent,
  occupied: readonly Box[],
  gap: number,
): Box | null {
  const ordered = segments(points).toSorted((a, b) => length(b) - length(a));
  const boxes = ordered.flatMap((segment) => candidates(segment, content, gap));
  return (
    boxes.find((candidate) => occupied.every((box) => !overlaps(expand(candidate, gap), box))) ??
    null
  );
}
/** Manhattan length is exact for the inspected orthogonal corridor. */
function length(segment: Segment): number {
  return Math.abs(segment.a.x - segment.b.x) + Math.abs(segment.a.y - segment.b.y);
}

/** A supplied candidate label must occupy one of the wire's actual adjacent segment positions. */
export function adjacentLabel(
  box: Box,
  points: readonly Point[],
  content: MeasuredContent,
  gap: number,
): boolean {
  return segments(points)
    .flatMap((segment) => candidates(segment, content, gap))
    .some(
      (candidate) =>
        Math.abs(candidate.x - box.x) < 0.000001 && Math.abs(candidate.y - box.y) < 0.000001,
    );
}
