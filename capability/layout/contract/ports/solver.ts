import type { Result } from '../errors.js';
import type { SolverProblem, SolverValue } from '../records/problem.js';
/** Numeric solver handles owned linear equations only; Layout owns lock/constraint meaning and recovery. */
export interface SolverPort {
  readonly version: string;
  solve(problem: SolverProblem): Result<readonly SolverValue[]>;
}
