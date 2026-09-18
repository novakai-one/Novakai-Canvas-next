import type { PrototypeNodePort } from './road-prototype.js';
/** Semantic identities plus owner-measured footprints and attachment offsets. */
export interface NestedNodeSpec {
  readonly number: number;
  readonly label: string;
  readonly position?: { readonly x: number; readonly y: number };
  readonly measured?: {
    readonly width: number;
    readonly height: number;
    readonly ports: readonly PrototypeNodePort[];
  };
}
export interface NestedSectionSpec {
  readonly measured?: {
    readonly width: number;
    readonly height: number;
    readonly header: number;
    readonly gap: number;
    readonly columns: number;
    readonly childColumns: number;
    readonly pitch: { readonly x: number; readonly y: number };
  };
  readonly number: number;
  readonly nodes: readonly NestedNodeSpec[];
  readonly children: readonly NestedSectionSpec[];
}
export interface NestedSceneSpec {
  readonly sections: readonly NestedSectionSpec[];
  readonly requests: readonly (readonly [
    number,
    number,
    source?: string | undefined,
    target?: string | undefined,
  ])[];
}
