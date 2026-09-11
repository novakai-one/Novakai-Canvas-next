import type { Result } from '../errors.js';
import type { RoutingProblem, RouteValue } from '../records/problem.js';
/** Route native geometry around explicit obstacles; Layout checks attachments/labels before success. */
export interface RoutingPort {
  readonly version: string;
  route(problem: RoutingProblem): Promise<Result<readonly RouteValue[]>>;
}
