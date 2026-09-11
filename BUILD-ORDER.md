# First five capability folders

Build a small complete path, not five finished subsystems. Keep the browser/CLI hosts thin as each path needs them.

| Order | Folder | First useful behavior / exit condition |
|---|---|---|
| 1 | capability/model | Immutable collection/object/relationship/section shapes and transition plans. A small valid graph is accepted; duplicate IDs and dangling endpoints are rejected. |
| 2 | capability/library | One catalog/root folder and collection registration. Collection/catalog consistency can be planned without I/O; stale catalog versions are represented explicitly. |
| 3 | capability/persistence | Atomic snapshot/conditional commit and request receipt with memory and SQLite adapters. One transaction stores both collection and catalog or neither; retry/recovery ownership is explicit. |
| 4 | capability/authoring | The sole typed create/edit gate combining those plans and storage. Stale writes, invalid batches and repeated requests behave correctly through a thin host. |
| 5 | capability/language | Minimal readable create/read/patch DSL through that same gate. An agent can create a collection, read it and make a small safe edit without JSON or coordinates. |

Next, build the first visible path with Presentation + Layout + Canvas and a minimal Design System/web shell. Build the shared SidePanel/Header/Body/Section composition once; then add registered feature sections. Do not wait for all diagram kinds or all backend features before showing this path.

Asset/template/export capabilities follow the first useful graph, added as complete slices. A referenced preset or asset required by any earlier slice needs a real validated provider; do not ship production no-op validators or silently skip dependencies. Start the initial slice with the smallest required vocabulary and resource set, and extend it deliberately.

Scaffold test budget: zero new automated application tests. No behavior is implemented by directory creation. Specify independent expected outcomes and the exact test budget before each implementation slice.
