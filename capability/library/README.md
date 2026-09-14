# Library

Responsibility: valid catalog organization and revision-labelled collection/content discovery.

Public `contract/index.ts` exposes `validate`, `plan`, `query`, checked ID constructors and readonly types. Core is pure: no storage, clock, DOM or imported Model internals. Authoring supplies authoritative original/prospective read projections and owns conditional commits.

Implemented: folder tree validation; collection membership, ordering, archive/restore via complete entry replacement; explicit folder rehome; coordinated registration/deletion; title/description/object/section search; unplaced-object results; folder/archive filters; recent/title/order ranking; revision/query-bound pagination; detached frozen results and typed failures.

No I/O adapter is needed for this pure projection/planning capability; hosts consume it through the service composition.

All outside imports enter the public index; private core remains inaccessible to consumers.
