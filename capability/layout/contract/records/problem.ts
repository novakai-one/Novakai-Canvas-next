import type { Box, Point, Side } from './geometry.js';
/** Third-party solvers consume this owned vocabulary; native classes never cross the adapter boundary. */
export interface Variable {
  readonly id: string;
  readonly initial: number;
  readonly strength: 'weak' | 'strong';
}
export interface Term {
  readonly variable: string;
  readonly coefficient: number;
}
export interface LinearConstraint {
  readonly id: string;
  readonly terms: readonly Term[];
  readonly operator: 'eq' | 'le' | 'ge';
  readonly constant: number;
  readonly strength: 'required' | 'strong' | 'weak';
  readonly targets: readonly string[];
}
export interface SolverProblem {
  readonly variables: readonly Variable[];
  readonly constraints: readonly LinearConstraint[];
}
export interface SolverValue {
  readonly id: string;
  readonly value: number;
}
export interface PlacementNode {
  readonly id: string;
  readonly parent: string | null;
  readonly width: number;
  readonly height: number;
  readonly header: number;
  /** Start nodes sit in the first layer and end nodes in the last. */
  readonly layer?: 'first' | 'last';
}
export interface PlacementProblem {
  readonly nodes: readonly PlacementNode[];
  readonly edges: readonly {
    readonly id: string;
    readonly source: string;
    readonly target: string;
  }[];
  readonly direction: 'right' | 'down' | 'left' | 'up';
  readonly algorithm: 'layered' | 'tree';
  /** Cross-axis boundary clearance between sibling nodes. */
  readonly spacing: number;
  /** Flow-axis boundary clearance between adjacent layers. */
  readonly layerSpacing: number;
  readonly padding: number;
}
export interface PlacementValue {
  readonly id: string;
  readonly box: Box;
}
export interface Obstacle {
  readonly id: string;
  readonly box: Box;
}
export interface Connection {
  readonly id: string;
  readonly source: Point;
  readonly target: Point;
  readonly sourceSide: Side;
  readonly targetSide: Side;
  /** Optional outward marker-clearance points; native routes the free corridor between these stubs. */
  readonly sourceApproach?: Point;
  readonly targetApproach?: Point;
  readonly checkpoints: readonly Point[];
}
export interface RoutingProblem {
  readonly obstacles: readonly Obstacle[];
  readonly connections: readonly Connection[];
  readonly clearance: number;
}
export interface RouteValue {
  readonly id: string;
  readonly points: readonly Point[];
}
