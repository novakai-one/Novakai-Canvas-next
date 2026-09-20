/** Public Templates boundary; no parser, token resolver, store or private helper escapes. */
export { themeInput } from './records/preset.js';
export { createTemplates } from './api.js';
export { composeTemplates } from './compose.js';
export { presetId, version, digest } from './brands.js';
export type { PresetId, Version, Digest } from './brands.js';
export type { Result, Diagnostic, ErrorCode } from './errors.js';
export type {
  Pin,
  Preset,
  ThemePreset,
  RecipePayload,
  ThemePayload,
  Catalog,
  Admission,
  Selection,
  Query,
  ExpansionRequest,
} from './records/preset.js';
export type { Templates, Dependencies, PresetPlan, Expansion, Summary } from './types.js';
export type { RecipePort, ThemePort } from './ports/codecs.js';
export type { IdentityPort } from './ports/identity.js';
