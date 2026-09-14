import type { ResourceRequest } from '@novakai/canvas-language';
import type { Result } from './errors.js';
/** Grammar seam shared by network admission and in-process headless preparation. */
export type readThemeConfig = (source: string) => Result<{
  readonly admission: unknown;
  readonly resources: readonly ResourceRequest[];
}>;
