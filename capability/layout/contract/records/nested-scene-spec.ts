/** Semantic fixture input: node identities, containment and wire endpoints; no geometry. */
export interface NestedNodeSpec {
  readonly number: number;
  readonly label: string;
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
