import type { readThemeConfig } from '../theme-reader.js';
import type { createHeadlessBindings } from '@novakai/canvas-service';
/** Read-only render request; collection is a DSL path or an admitted recipe ID. */
export interface HeadlessOptions {
  readonly collection: string;
  readonly theme?: string | undefined;
  readonly themeFile?: string | undefined;
  readonly out: string;
  readonly format: 'svg' | 'png';
  readonly root: string;
}
export interface HeadlessOwners {
  readonly service: Awaited<ReturnType<typeof createHeadlessBindings>>;
  readonly readTheme: readThemeConfig;
}
