/** Usage is available before credentials, filesystem or service initialization. */
export const usage = `Novakai Canvas — author collections with readable DSL

canvas describe                         Read the DSL vocabulary
canvas list                             List collection IDs and revisions
canvas read ID [--section ID | --object ID] [--out FILE]
                                        Read full or read-only partial context
canvas inspect ID                        Scene quality report: validity, warnings, crossing/relaxed counts
canvas create FILE                      Create a collection from DSL
canvas replace FILE --revision N        Replace semantics at the revision you read
canvas patch FILE --revision N          Apply an ordered DSL patch
canvas preview FILE [--mode MODE]        Preview; use --revision N for existing collections
canvas theme admit FILE                 Admit a semantic theme config
canvas recipe admit FILE                Requires --id --version --family --title
canvas recipe instantiate PIN           Requires --namespace ID; --out FILE emits editable DSL
canvas apply REQUEST_ID                 Apply a retained preview
canvas receipt REQUEST_ID               Check a committed receipt
canvas retry REQUEST_ID                 Reconcile, then retry the identical retained request
canvas profile describe build-spec@1    Show the build-spec conventions
canvas profile scaffold build-spec@1 --id ID --title "Title" [--out FILE]
canvas profile lint FILE --profile build-spec@1

Options: --server URL --workspace DIR --request ID --out FILE
Modes: create, replace, patch. Agents never need JSON coordinates.
Read scopes return a non-authorable view envelope; referenced objects/views and manual geometry may be omitted.
Use a full read when you need editable source. Patch/preview/apply remain the revision-checked editing workflow.
A missing or uncertain receipt is not confirmation that an edit was saved.`;
