import type { Result } from '../errors.js';
import type { PlacementProblem, PlacementValue } from '../records/problem.js';
/** Seed geometry is a preference, never a hard-constraint verdict; Layout inspects every native result. */
export interface PlacementPort {
  readonly version: string;
  place(problem: PlacementProblem): Promise<Result<readonly PlacementValue[]>>;
}
