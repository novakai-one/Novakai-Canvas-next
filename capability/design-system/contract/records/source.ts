import type { Version } from '../brands.js';
import type { TokenDefinition, TokenValues } from './tokens.js';
/** Bounds/densities/roles live once in authored JSON; resolution consumes this checked policy. */
export interface SourcePolicy {
  readonly primary: readonly string[];
  readonly roles: readonly string[];
  readonly aliases: readonly string[];
  readonly densities: Readonly<
    Record<
      'compact' | 'comfortable' | 'spacious',
      { readonly space: number; readonly control: number }
    >
  >;
  readonly bounds: Readonly<
    Record<
      string,
      {
        readonly min: number;
        readonly max: number;
        readonly diagramMin: number;
        readonly diagramMax: number;
      }
    >
  >;
  readonly pairs: readonly {
    readonly id: string;
    readonly foreground: string;
    readonly background: string;
    readonly ratio: number;
  }[];
}
export interface ThemeDelta {
  readonly id: string;
  readonly version: Version;
  readonly baseVersion: Version;
  readonly overrides: TokenValues;
}
export interface SourceSet {
  readonly schemaVersion: 1;
  readonly definitionVersion: Version;
  readonly definitions: readonly TokenDefinition[];
  readonly policy: SourcePolicy;
  readonly themes: readonly ThemeDelta[];
}
