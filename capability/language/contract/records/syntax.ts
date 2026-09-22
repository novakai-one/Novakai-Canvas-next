/** UTF16 source coordinates; end is exclusive and lines/columns start at one. */
export interface Position {
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}
export interface Span {
  readonly start: Position;
  readonly end: Position;
}
export interface Reference {
  readonly kind: 'reference';
  readonly id: string;
  readonly member?: string;
  readonly namespace?: 'group' | 'section';
  readonly section?: string;
}
export interface TypeSyntax {
  readonly kind: 'type';
  readonly ref?: string;
  readonly primitive?: 'string' | 'number' | 'boolean';
  readonly arguments?: readonly TypeSyntax[];
}
export type SyntaxValue =
  string | number | boolean | Reference | TypeSyntax | readonly SyntaxValue[];
export interface LocatedValue {
  readonly value: SyntaxValue;
  readonly span: Span;
  readonly tokens?: readonly Token[];
  readonly token?: Token;
  readonly items?: readonly LocatedValue[];
}
export type Fields = Readonly<Record<string, LocatedValue>>;
export type Construct =
  | 'collection'
  | 'declare'
  | 'type'
  | 'asset'
  | 'source'
  | 'node'
  | 'wire'
  | 'section'
  | 'text'
  | 'code'
  | 'link'
  | 'list'
  | 'image'
  | 'icon'
  | 'figure'
  | 'field'
  | 'keygroup'
  | 'signature'
  | 'member'
  | 'table'
  | 'row'
  | 'port'
  | 'show'
  | 'connect'
  | 'group'
  | 'rank'
  | 'align'
  | 'before'
  | 'below'
  | 'root'
  | 'event'
  | 'fragment'
  | 'branch'
  | 'scenario'
  | 'call'
  | 'alt'
  | 'change'
  | 'new'
  | 'changed'
  | 'deleted'
  | 'locked';
export interface Declaration {
  readonly kind: Construct;
  readonly fields: Fields;
  readonly children: readonly Declaration[];
  readonly span: Span;
}
export type TargetKind =
  | 'collection'
  | 'node'
  | 'wire'
  | 'block'
  | 'appearance'
  | 'section'
  | 'route'
  | 'asset'
  | 'source'
  | 'layout';
export type Action =
  | 'add'
  | 'set'
  | 'unset'
  | 'replace'
  | 'show'
  | 'hide'
  | 'connect'
  | 'disconnect'
  | 'remove'
  | 'move'
  | 'delete'
  | 'reset';
export interface Operation {
  readonly action: Action;
  readonly target: TargetKind;
  readonly address: Reference;
  readonly fields: Fields;
  readonly properties: readonly string[];
  readonly declaration: Declaration | null;
  readonly span: Span;
}
export interface Document {
  readonly kind: 'canvas';
  readonly version: 1 | 2;
  readonly collection: string;
  readonly declaration: Declaration;
  readonly declare?: Declaration;
  readonly span: Span;
}
export interface Patch {
  readonly kind: 'patch';
  readonly version: 1;
  readonly collection: string;
  readonly operations: readonly Operation[];
  readonly span: Span;
}
export interface ResourceRequest {
  readonly kind: 'theme' | 'image' | 'icon' | 'font';
  readonly alias: string;
  readonly source: string;
  readonly alt?: string;
  readonly license?: string;
  readonly attribution?: string;
  readonly span: Span;
}
export interface SourceMapping {
  readonly path: string;
  readonly span: Span;
}
export type ParsedSource = (Document | Patch) & {
  readonly resources: readonly ResourceRequest[];
  readonly sourceMap: readonly SourceMapping[];
};
export interface Token {
  readonly kind: 'word' | 'string' | 'literal' | 'id' | 'integer' | 'symbol' | 'eof';
  readonly text: string;
  readonly span: Span;
}
