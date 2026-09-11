import type { Projection, MeasuredContent } from '../records/input.js';
import type { Result } from '../errors.js';
/** Presentation owns its serialized scene vocabulary; Layout independently checks all consumed geometry and references. */
export interface ProjectionReader {
  read(input: unknown): Result<Projection>;
  content(input: unknown): Result<MeasuredContent>;
}
