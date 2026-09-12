import type { Result } from '../errors.js';
/** Source bytes cross the unknown boundary once; Design System validates before use. */
export interface TokenSource {
  read(): Promise<Result<unknown>>;
}
