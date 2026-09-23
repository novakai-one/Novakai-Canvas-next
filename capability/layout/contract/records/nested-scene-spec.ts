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
  readonly position?: { readonly x: number; readonly y: number };
  readonly measured?: {
    readonly width: number;
    readonly height: number;
    readonly header: number;
    readonly headerWidth: number;
    readonly gap: number;
    readonly lanePitch: number;
    readonly columns: number;
    readonly childColumns: number;
    /** Row-major grid cell of each node, in node order. */
    readonly cells: readonly number[];
    /** Row-major grid cell of each child section, in child order. */
    readonly childCells: readonly number[];
    readonly childColumnWidths: readonly number[];
    readonly childRowHeights: readonly number[];
    readonly childInsets: readonly { readonly x: number; readonly y: number }[];
    readonly pitch: { readonly x: number; readonly y: number };
    readonly columnWidths: readonly number[];
    readonly rowHeights: readonly number[];
    readonly columnCenters: readonly number[];
    readonly rowCenters: readonly number[];
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
