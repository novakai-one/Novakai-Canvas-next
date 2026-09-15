/** Public capability entry. Host owns correction/retry; no private styling or platform modules are required. */
export { createDesignSystem } from './api.js';
export {
  composeDesignSystem,
  createScopeInstaller,
  createReactBindings,
  createTokenFileBindings,
  createStylesheetBindings,
} from './compose.js';
export type {
  ContentSizing,
  ContrastEvidence,
  DesignSystem,
  DesignSystemDependencies,
  DiagramTypography,
  Environment,
  Expression,
  FontPin,
  Paint,
  PortableTheme,
  PortableToken,
  ResolvedTokenSet,
  SizeBand,
  SourceSet,
  StyleProjection,
  TextMetric,
  TokenDefinition,
  TokenValue,
  TokenValues,
  UiPreferences,
  UiThemePin,
} from './types.js';
export type { Result, TokenError, ErrorCode } from './errors.js';
export type { Identity } from './ports/identity.js';

export type {
  ButtonProps,
  DialogProps,
  FieldControlProps,
  FieldProps,
  MenuItem,
  MenuProps,
  PanelBodyHeaderProps,
  PanelBodyProps,
  PanelHeaderProps,
  PanelSectionBodyProps,
  PanelSectionHeaderProps,
  PanelSectionProps,
  ReactBindings,
  SidePanelProps,
  StatusMessageProps,
  TabItem,
  TabsProps,
  TooltipProps,
} from './react-types.js';
export type { BuildChecks, TokenFileBindings } from './ports/build-files.js';
export type {
  ScopeInstaller,
  ScopeLease,
  ScopeSnapshot,
  ScopeTarget,
} from './ports/scope-target.js';
export type { StylesheetReader, StylesheetSource } from './ports/styles.js';
export type {
  Artifact,
  ArtifactManifest,
  ArtifactSet,
  StyleCoverage,
  StyleDeclaration,
} from './records/artifacts.js';

export type { TokenId } from './brands.js';
export { tokenId } from './brands.js';

export { chromeName, hexColor, roleName } from './brands.js';
export type { ChromeName, HexColor, RoleName } from './brands.js';
export type { ChromeMetrics } from './records/theme.js';
