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
}
