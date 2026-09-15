import { z } from 'zod';
import type { Catalog } from '../../../../capability/templates/contract/index.js';
import type { readThemeConfig } from '../theme-reader.js';
import type { createHeadlessBindings } from '@novakai/canvas-service';
/** Filesystem path at the native CLI edge; Node resolves it and resource owners enforce confinement. */
export const filePath = z.string().brand<'HeadlessFilePath'>();
/** Checked filesystem text, distinct from a semantic collection or theme selector. */
export type FilePath = z.infer<typeof filePath>;
/** CLI collection selector; Language/Templates validate the path, shipped collection ID or recipe ID. */
const collectionSelector = z.string().min(1).brand<'HeadlessCollectionSelector'>();
/** CLI theme selection text; Templates resolves bare IDs and exact immutable pins. */
const themeSelector = z.string().brand<'HeadlessThemeSelector'>();
/** Read-only render request with checked selectors and native paths; no canonical workspace mutation. */
export const headlessOptions = z
  .strictObject({
    collection: collectionSelector,
    theme: themeSelector.optional(),
    themeFile: filePath.optional(),
    out: filePath,
    format: z.enum(['svg', 'png']),
    root: filePath,
  })
  .readonly();
/** Immutable request inferred from the CLI boundary schema. */
export type HeadlessOptions = z.infer<typeof headlessOptions>;
/** Only confined resource reads and the existing service/theme preparation operations are injected. */
export interface HeadlessOwners {
  readonly resourceFiles: import('./resources.js').ResourceFiles;
  readonly service: Awaited<ReturnType<typeof createHeadlessBindings>>;
  readonly readTheme: readThemeConfig;
}
/** Machine-readable export evidence; Layout validates scenes before they reach this report. */
export interface HeadlessReport {
  readonly files: readonly FilePath[];
  readonly theme: import('@novakai/canvas-model').Collection['theme'];
  readonly inspection: import('@novakai/canvas-service').InspectionReport;
  readonly digests: readonly Pick<Catalog[number], 'id' | 'digest'>[];
}
