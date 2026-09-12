import type { ArtifactSet, StyleDeclaration, StyleCoverage } from './records/artifacts.js';
import type { Result } from './errors.js';
import type { SourceSet } from './records/source.js';
import type { ResolvedTokenSet } from './records/resolved.js';
import type { PortableTheme, StyleProjection } from './records/theme.js';
import type { Identity } from './ports/identity.js';
/** Headless token contract; no CSS, React or filesystem loads at import time. */
export interface DesignSystem {
  readPreferences(input: unknown): Result<import('./records/preferences.js').UiPreferences>;
  compile(sources: unknown): Result<ArtifactSet>;
  auditStyles(
    styles: readonly StyleDeclaration[],
    resolved: ResolvedTokenSet,
  ): Result<StyleCoverage>;
  readSources(input: unknown): Result<SourceSet>;
  resolve(input: unknown): Result<ResolvedTokenSet>;
  resolveTheme(input: unknown): Result<PortableTheme>;
  projectDiagram(resolved: ResolvedTokenSet): Result<StyleProjection>;
}
export interface DesignSystemDependencies {
  readonly identity: Identity;
}
export type { TokenValue, TokenValues, Expression, TokenDefinition } from './records/tokens.js';
export type { SourceSet } from './records/source.js';
export type { ResolvedTokenSet, ContrastEvidence } from './records/resolved.js';
export type {
  PortableTheme,
  PortableToken,
  FontPin,
  StyleProjection,
  Paint,
} from './records/theme.js';
export type { UiPreferences, Environment, UiThemePin } from './records/preferences.js';
