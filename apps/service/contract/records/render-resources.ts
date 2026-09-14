import type { Assets } from '@novakai/canvas-assets';
import type { DesignSystem } from '@novakai/canvas-design-system';
import type { Templates } from '@novakai/canvas-templates';
import type { LoweredIntent } from '@novakai/canvas-language';
/** Installed source location and admitted owners are explicit; no worker consults ambient cwd or personal preferences. */
export interface RenderResourceOwners {
  readonly assets: Assets;
  readonly system: DesignSystem;
  readonly sources: unknown;
  readonly templates: Pick<Templates<LoweredIntent>, 'read'>;
  readonly wasmResource: string;
}
