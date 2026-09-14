# Layout

Responsibility: derive stable spatial geometry and labelled routes from measured Presentation input, without changing diagram meaning.

Public entry: `@novakai/canvas-layout`. `createLayout` accepts required owner/native roles; `composeLayout` binds pinned ELK, Kiwi and libavoid adapters with the host's Projection reader, job control and replaceable Wasm resource. `key` derives full request identity before the host schedules `arrange` or `route`; `inspect` independently checks candidate identities, constraints and geometry. Route-only fixes nodes and section origins.

Acceptance cases exercise real engines, nested scopes, relative constraints, locks, incremental reuse, conditional sequence activity, ports/manual routes/labels/markers, cancellation, native cleanup attempts and a 1000-node/1500-wire collection.

Core imports only own declaration contracts/helpers. Operation-specific contexts carry only consumed roles. Native adapters own numeric mapping and per-call state; host workers own cancellation/lifetime. Authoring owns admission/commit.
