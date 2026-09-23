import type { ObjectKind } from '@novakai/canvas-model';

/** A retained, typed draft for the small set of authoring actions exposed by Add. */
export interface AddDiagramDraft {
  readonly title: string;
  readonly mode: 'grid';
}

/** New objects and reused appearances share one explicit request shape. */
export interface AddObjectDraft {
  readonly section: string;
  readonly label: string;
  readonly kind: ObjectKind;
  readonly reuseObject: string | null;
  readonly group: string | null;
}

export interface AddGroupDraft {
  readonly findRoom?: boolean;
  readonly section: string;
  readonly title: string;
}

export interface CreationView {
  readonly diagram: AddDiagramDraft;
  readonly object: AddObjectDraft;
  readonly group: AddGroupDraft;
  readonly problem: string | null;
  /** Every form is locked while any add is unsettled; only the form that sent it says "Adding…". */
  readonly busy: boolean;
  readonly adding: 'diagram' | 'object' | 'group' | null;
}
