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
  readonly resourceFiles: import('./resources.js').ResourceFiles;
  readonly service: Awaited<ReturnType<typeof createHeadlessBindings>>;
  readonly readTheme: readThemeConfig;
}

/** Machine-readable export evidence; Layout validates scenes before they reach this report. */
export interface HeadlessReport {
  readonly files: readonly string[];
  readonly theme: import('@novakai/canvas-model').Collection['theme'];
  readonly inspection: import('@novakai/canvas-service').InspectionReport;
  readonly digests: readonly { readonly id: string; readonly digest: string }[];
}
