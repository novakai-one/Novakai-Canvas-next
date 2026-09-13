import type { Construct, SyntaxValue, TargetKind } from './syntax.js';
export type ValueType =
  | 'string'
  | 'word'
  | 'id'
  | 'endpoint'
  | 'address'
  | 'strings'
  | 'ids'
  | 'endpoints'
  | 'boolean'
  | 'integer'
  | 'link'
  | 'targets'
  | 'references'
  | 'reference-value';
export interface Property {
  readonly type: ValueType;
  readonly field: string;
  readonly required?: boolean;
  readonly values?: readonly string[];
  readonly fallback?: SyntaxValue;
}
export interface PositionRule {
  readonly name: string;
  readonly type: ValueType;
  readonly optional?: boolean;
  readonly values?: readonly string[];
  readonly literal?: string;
}
export interface ConstructDefinition {
  readonly kind: Construct;
  readonly positions: readonly PositionRule[];
  readonly properties: Readonly<Record<string, Property>>;
  readonly children: readonly Construct[] | null;
}
export interface Description {
  readonly patchTargets: Readonly<Record<TargetKind, Readonly<Record<string, Property>>>>;
  readonly patchForms: readonly string[];
  readonly version: 1;
  readonly constructs: readonly ConstructDefinition[];
  readonly operations: readonly string[];
  readonly defaults: Readonly<Record<string, string>>;
  readonly examples: readonly string[];
  readonly diagnostics: readonly string[];
  /** Acceptance policies published verbatim from Model's declaration records; discover without opening core. */
  readonly policies: {
    readonly layouts: Readonly<Record<string, readonly string[]>>;
    readonly wires: Readonly<Record<string, readonly string[]>>;
    readonly endpoints: {
      readonly members: Readonly<Record<string, readonly string[]>>;
      readonly genericMembers: readonly string[];
      readonly sources: Readonly<Record<string, readonly string[]>>;
      readonly targets: Readonly<Record<string, readonly string[]>>;
    };
  };
}
