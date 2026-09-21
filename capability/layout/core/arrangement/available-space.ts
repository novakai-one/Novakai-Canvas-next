import type { Box, PlacedSection } from '../../contract/records/geometry.js';
import type { Projection } from '../../contract/records/input.js';
import { overlaps } from '../geometry/intersections.js';

/** Saved section positions reserve space before unplaced sections choose a free grid position. */
export function availableSections(
  preferred: readonly PlacedSection[],
  projection: Projection,
  gap: number,
): readonly PlacedSection[] {
  const retained = new Set(projection.sections.filter((s) => s.placement != null).map((s) => s.id));
  const occupied = preferred.filter((s) => retained.has(s.id)).map((s) => s.box);
  return preferred.map((section) => {
    if (retained.has(section.id)) return section;
    const box = availableBox(section.box, occupied, gap);
    occupied.push(box);
    return {
      ...section,
      box,
      origin: { x: section.origin.x, y: section.origin.y + box.y - section.box.y },
    };
  });
}

/** Moving downward in bottom-edge order clears each obstacle once, without shifting its owner. */
function availableBox(preferred: Box, occupied: readonly Box[], gap: number): Box {
  return occupied
    .toSorted((a, b) => a.y + a.height - b.y - b.height)
    .reduce((box, obstacle) => {
      const clearance = {
        x: obstacle.x - gap,
        y: obstacle.y - gap,
        width: obstacle.width + gap * 2,
        height: obstacle.height + gap * 2,
      };
      return overlaps(box, clearance) ? { ...box, y: obstacle.y + obstacle.height + gap } : box;
    }, preferred);
}
