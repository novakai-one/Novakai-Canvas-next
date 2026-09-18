/** Semantic fixture input: node identities, caller-measured sizes, containment and wire endpoints; no positions. */
export interface NestedNodeSize {
  readonly width: number;
  readonly height: number;
}
export interface NestedNodeSpec {
  readonly number: number;
  readonly label: string;
  readonly size: NestedNodeSize;
}
export interface NestedSectionSpec {
  readonly number: number;
  readonly nodes: readonly NestedNodeSpec[];
  readonly children: readonly NestedSectionSpec[];
}
export interface NestedSceneSpec {
  readonly sections: readonly NestedSectionSpec[];
  readonly requests: readonly (readonly [number, number])[];
}
