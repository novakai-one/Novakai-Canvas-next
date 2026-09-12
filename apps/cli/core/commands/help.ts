/** Usage is available before credentials, filesystem or service initialization. */
export const usage = `Novakai Canvas — author collections with readable DSL

canvas describe                         Read the DSL vocabulary
canvas list                             List collection IDs and revisions
canvas read ID [--out FILE]              Read editable DSL for a collection
canvas create FILE                      Create a collection from DSL
canvas replace FILE --revision N        Replace semantics at the revision you read
canvas patch FILE --revision N          Apply an ordered DSL patch
canvas preview FILE [--mode MODE]        Preview; use --revision N for existing collections
canvas apply REQUEST_ID                 Apply a retained preview
canvas receipt REQUEST_ID               Check a committed receipt
canvas retry REQUEST_ID                 Reconcile, then retry the identical retained request

Options: --server URL --workspace DIR --request ID --out FILE
Modes: create, replace, patch. Agents never need JSON coordinates.
A missing or uncertain receipt is not confirmation that an edit was saved.`;
