import { PROJECTION_CAPACITY } from '../../contract/records/limits.js';
import { reject } from './outcomes.js';
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
    nodes: sections.reduce((total, section) => total + section.nodes.length, 0),
    wires: sections.reduce((total, section) => total + section.wires.length, 0),
  };
}
/** Compare each aggregate with the single public owner record without weakening local item bounds. */
function exceedsCapacity(counts: ProjectionCounts): boolean {
  return [
    counts.sections / PROJECTION_CAPACITY.maxSections,
    counts.nodes / PROJECTION_CAPACITY.maxNodes,
    counts.wires / PROJECTION_CAPACITY.maxWires,
  ].some((ratio) => ratio > 1);
}
/** Reject an oversized projection before success; callers retain the prior scene and correct the source. */
export function requireProjectionCapacity(sections: readonly CapacitySection[]): void {
  if (exceedsCapacity(countProjection(sections)))
    reject(
      'limit',
      'projection',
      `Projection exceeds${PROJECTION_CAPACITY.maxSections}sections/${PROJECTION_CAPACITY.maxNodes}nodes/${PROJECTION_CAPACITY.maxWires}wires`,
    );
}
