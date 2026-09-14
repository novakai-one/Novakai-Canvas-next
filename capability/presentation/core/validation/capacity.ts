import { PROJECTION_CAPACITY } from '../../contract/records/limits.js';
import { fail } from '../../contract/errors.js';
import type { Result } from '../../contract/errors.js';
interface CapacitySection {
  readonly nodes: readonly unknown[];
  readonly wires: readonly unknown[];
}
interface ProjectionCounts {
  readonly sections: number;
  readonly nodes: number;
  readonly wires: number;
}
/** Count appearances and wires across every section so partitioning cannot bypass owner admission. */
function countProjection(sections: readonly CapacitySection[]): ProjectionCounts {
  return {
    sections: sections.length,
    nodes: sections.reduce((total, section): number => total + section.nodes.length, 0),
    wires: sections.reduce((total, section): number => total + section.wires.length, 0),
  };
}
/** Compare each aggregate with the single public owner record without weakening local item bounds. */
function exceedsCapacity(counts: ProjectionCounts): boolean {
  return [
    counts.sections / PROJECTION_CAPACITY.maxSections,
    counts.nodes / PROJECTION_CAPACITY.maxNodes,
    counts.wires / PROJECTION_CAPACITY.maxWires,
  ].some((ratio): boolean => ratio > 1);
}
/** Return aggregate admission without throwing; project/readMeasuredProjection unwrap under protect.
 * Callers correct oversized input and retry; Authoring retains the prior committed scene. */
export function requireProjectionCapacity(sections: readonly CapacitySection[]): Result<void> {
  if (exceedsCapacity(countProjection(sections)))
    return fail(
      'limit',
      'projection',
      `Projection exceeds${PROJECTION_CAPACITY.maxSections}sections/${PROJECTION_CAPACITY.maxNodes}nodes/${PROJECTION_CAPACITY.maxWires}wires`,
    );
  return { ok: true, value: undefined };
}
