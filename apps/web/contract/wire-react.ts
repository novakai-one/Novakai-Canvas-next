import type { Collection, DiagramObject, Endpoint } from './records/owners.js';
import type { EditedWire, WireEdit } from './records/wire-editor.js';
/** Field groups are pure form views; the session owns persistence and the captured revision. */
export interface WireFieldsProps {
  readonly value: EditedWire;
  readonly collection: Collection;
  edit(command: WireEdit): void;
}
export interface EndpointChoice {
  readonly value: string;
  readonly label: string;
  readonly endpoint: Endpoint;
}
/** The Wire label picker for a wire whose target owns functions (a module or interface). */
export type WireFunctionPickerProps = WireFieldsProps & { readonly target: DiagramObject };
