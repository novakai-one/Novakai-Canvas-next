# Layout

Responsibility: derive stable spatial geometry and labelled routes from measured Presentation input, without changing diagram meaning.

Public entry: `@novakai/canvas-layout`. `createLayout` accepts required owner/native roles; `composeLayout` binds pinned ELK, Kiwi and libavoid adapters with the host's Projection reader, job control and replaceable Wasm resource. `key` derives full request identity before the host schedules `arrange` or `route`; `inspect` independently checks candidate identities, constraints and geometry. Route-only fixes nodes and section origins.

Five specs: `docs/specs/layout/`. Twelve in-process acceptance cases exercise real engines, nested scopes, relative constraints, locks, incremental reuse, conditional sequence activity, ports/manual routes/labels/markers, cancellation, native cleanup attempts and a1000node/1500wire collection. No E2E suite or browser UX certification is claimed here.

Core imports only own declaration contracts/helpers. Operation-specific contexts carry only consumed roles. Native adapters own numeric mapping and per-call state; host workers own cancellation/lifetime. Authoring will own admission/commit. See `quality/acceptance-evidence/layout-implementation-review.md` and `quality/file-reviews/layout.md` for the sole review/fix evidence.
