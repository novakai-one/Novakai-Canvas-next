/** Public capability entry. Host owns correction/retry; no private styling or platform modules are required. */
export { createDesignSystem } from './api.js';
export {
  composeDesignSystem,
  createScopeInstaller,
  createReactBindings,
  createTokenFileBindings,
  createStylesheetBindings,
} from './compose.js';
export type * from './types.js';
export type { Result, TokenError, ErrorCode } from './errors.js';
export type { Identity } from './ports/identity.js';

export type * from './react-types.js';
export type * from './ports/build-files.js';
export type * from './ports/scope-target.js';
export type * from './ports/styles.js';
export type * from './records/artifacts.js';
