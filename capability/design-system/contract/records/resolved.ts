import type { Digest, Version, ChromeName } from '../brands.js';
import type { TokenValues, Dependencies } from './tokens.js';
import type { FontPin, PresetPin } from './theme.js';
import type { UiThemePin } from './preferences.js';
export interface ContrastEvidence {
  readonly id: string;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly required: number;
}
/** Complete detached scope; numeric values, CSS and contrast share one resolved identity. */
export interface ResolvedTokenSet {
  readonly chrome?: ChromeName | undefined;
  readonly definitionVersion: Version;
  readonly inputDigest: Digest;
  readonly digest: Digest;
  readonly scope: 'ui' | 'diagram' | 'export';
  readonly values: TokenValues;
  readonly css: Readonly<Record<string, string>>;
  readonly dependencies: Dependencies;
  readonly primary: readonly string[];
  readonly contrast: readonly ContrastEvidence[];
  readonly fonts: readonly FontPin[];
  readonly roles: readonly string[];
  readonly provenance: { readonly ui: UiThemePin | null; readonly diagram: PresetPin | null };
  readonly forcedColors: boolean;
}
