import type { Declaration, ParsedSource, Span } from '@novakai/canvas-language';
export type {
  Declaration as ProfileDeclaration,
  ParsedSource as ProfileSource,
  Span as ProfileSpan,
} from '@novakai/canvas-language';

export interface ProfileSlotDescriptor {
  readonly id: string;
  readonly order: number;
  readonly required: boolean;
  readonly modes: readonly string[];
  readonly description: string;
}

export interface ProfileDescriptor {
  readonly id: 'build-spec@1';
  readonly name: string;
  readonly description: string;
  readonly commands: Readonly<Record<'describe' | 'scaffold' | 'lint', string>>;
  readonly slots: readonly ProfileSlotDescriptor[];
  readonly appendix: {
    readonly idPattern: string;
    readonly modes: readonly string[];
    readonly description: string;
  };
  readonly conventions: readonly string[];
  readonly notes: readonly string[];
}

export interface ProfileDeclarationIndex {
  readonly source: ParsedSource;
  readonly declaration: Declaration;
  readonly sections: readonly Declaration[];
  readonly nodes: readonly Declaration[];
  readonly wires: readonly Declaration[];
}

export interface ProfileFinding {
  readonly path: string;
  readonly message: string;
  readonly span: Span;
}

export interface ProfileLintResult {
  readonly profile: ProfileDescriptor['id'];
  readonly valid: boolean;
  readonly findings: readonly ProfileFinding[];
  readonly summary: string;
}
