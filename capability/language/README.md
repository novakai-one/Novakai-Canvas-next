# Language

**Responsibility:** translate readable diagram source and ordered edits into validated Model intent; print faithful full source or scoped readouts. Authoring owns every write, revision, retry and history operation.

`createLanguage({reader:{validate}, planner:{plan}, stage:{stage}})` binds the public Model operations. No filesystem, network, renderer or persistence dependency is present. Hosts must resolve `parse(source).resources` before `lower(...)`, then send successful intent through Authoring.

|Operation|Result|
|---|---|
|describe(1)|Construct/property/default and patch grammar, examples and diagnostics|
|parse(source)|Bounded source AST, resource requests and source mappings|
|lower({source,mode,snapshot,resources})|Validated collection and checked Model changes; no allocated revision|
|print({collection,scope})|Full canvas source or non-authorable view, revision, exact pins and coordinate-free manual summary|

Modes: create requires a null snapshot; replace/patch require the matching existing collection. Create uses a checked empty shell for final planning. Model's new `stage` exposes **unchecked** structural prefixes and checked operations; final `plan` remains mandatory. Language does not duplicate cascades or fabricate brands.

Full reads preserve semantic ordering inside each owner scope. Sparse sequence rank numbers normalize to the same sibling order; cross-group storage interleaving is not semantic. Human geometry stays in Model and survives matching replacements; `reset layout` and `reset route` are explicit edits. Scoped `view` source cannot be applied, even after comments are removed.

Examples: [prototype](../../resources/examples/language/prototype.canvas), [ER](../../resources/examples/language/er.canvas), [modules](../../resources/examples/language/modules.canvas), [sequence](../../resources/examples/language/sequence.canvas), [state/story/grid](../../resources/examples/language/state.canvas), [targeted patch](../../resources/examples/language/change.patch).

Verification: 18 public-contract cases in five suites, using real Model validation/planning/staging. CLI resource admission, browser rendering and final user workflows remain host integration work; these tests do not claim those are implemented.
