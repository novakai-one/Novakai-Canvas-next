# Capability: export — Modules

### contract/api.ts
**Exposes:** createExport(dependencies):Export; exportArtifact(request:unknown,signal?):Promise<Result<Artifact>>; inspectBundle(bytes:unknown):Promise<Result<BundleInspection>>; prepareImport(request:unknown):Promise<Result<PreparedImport>>.
**Boundary:** validate unknown requests before I/O; failures typed. No caller-supplied function/object masquerades as a prepared authoritative write. Dependencies implement narrow required roles; no fake fallback on missing encoder/resource/font support.

### core/artifacts/produce.ts
**SnapshotReader.acquire({collectionId,revision}):Promise<Result<SnapshotLease>>:** host binds a consistent Persistence/Assets retention scope and validated Model/Presentation/Layout results. Reject mismatched identity before rendering; release in finally. Read-only export never acquires an Authoring mutation right.
**Pipeline:** validate → acquire → verify identity/scope/bounds → render or bundle → encode → verify output limits/hash → release → return. Success with release failure becomes typed cleanup-failed, no download artifact. Primary failure retained with cleanup diagnostic when both fail. Caller may safely retry a read; host repairs retention/storage failures.
**FormatRegistry:** readonly map of registered format handlers; each receives admitted snapshot/request/cancellation, returns encoded bytes/pages. Native handlers check cancellation after each asynchronous stage. Core does not import native packages, React or filesystem. Registration covers five required formats, not arbitrary executable user plugins.

### core/artifacts/pages.ts; scope.ts
**Scope:** exact selected section or ordered collection sections. Section bounds are collection-global; nodes/wires/sequence geometry are section-local. Root SVG viewBox uses selected bounds; each section translates by its origin once.
**Print:** CSS-pixel/world unit→0.75pt; A4/Letter paper dimensions; 24pt margins; 18pt footer allowance; 12pt overlap. Per-section tiles advance by printable size minus overlap. Cover full bounds without gaps; empty section yields one page. Source scene never modified. Reject impossible print geometry or >512pages before PDF allocation.

### adapters/svg/*; adapters/native/*
**SceneRenderer.render(snapshot,scope):Result<string>:** compose NodeContent/MeasuredContent/Marker public React slots; serialize with ReactDOM static renderer. Background/frame/title/nodes/wires/sequence layers consume supplied geometry. Every node box is section-local, including grouped nodes. Apply section origin once; do not add ancestor offsets. Crow-foot orientation uses endpoint tangent, not relationship-kind inference. Selection/handles/camera/UI chrome are excluded.
**Font binding:** same admitted font digests as scene text. WOFF2 may be decompressed losslessly for native raster/PDF consumers; no system-font fallback. Missing font/media rejects before producing output. Shared browser/static renderer retains original font bytes. Shared FontDefinitions embeds them once per scene; default node embedding remains unchanged. WOFF2 decoder calls serialize and copy reusable native memory.
**SVG:** self-contained namespace, title/description and revision metadata; only trusted shared SVG components supply content.
**PNG:** resvg WASM encoder; exact decoded font buffers, system font loading disabled; preflight pixel bounds; PNG signature and expected dimensions checked.
**PDF:** PDFKit + SVG-to-PDFKit with exact font callbacks and embedded assets. An injected Sharp media converter losslessly converts admitted WebP to PNG under raster limits; SVG assets remain vector where supported. Conversion changes export bytes only, never pinned resources; vector scene translated/clipped into each planned page; footer includes revision and page count. Stream errors/unsupported conversion warnings reject, never return partial PDF.
**Encoding:** platform UTF-8/base64/SHA256 bindings; injectable role, malformed text/base64 rejects. No output-path ownership.

### adapters/html/document.ts
**Output:** one self-contained document with collection heading/revision, section navigation anchors, inline section SVGs, and native details containing measured text/alt, relation labels/cardinality and sequence ordering. No JavaScript required, no network dependencies. Reader CSS references a small document token palette; pinned diagram styling independent of UI preference. Format handler uses injected scene renderer; no sibling import.

### core/bundles/*
**Documents:** read(unknown):Result<Collection>; print(Collection):Result<string>; parse(source,resources):Result<Collection>. Host composes public Model/Language contracts. print must be complete editable canvas1; scoped view readouts rejected. Lowering uses exact validated bundled resource pins, not mutable aliases. Before bundle output, semantic round-trip plus manual overlay must equal the original canonical collection ignoring only allocated revision.
**Resources.inspect(Resource[]):Promise<Result<Resource[]>>:** required owning media/preset/font validation; returns exact admitted transfer identities, no physical publication. Host binds Assets/Templates/DesignSystem/Presentation public validation; failures stop import/export. Export verifies returned bytes/digests unchanged.
**Manifest:** semantic source and manual snapshot have separate hashes; resource bytes embedded once per kind+digest. Canonical ordering makes repeated same-input bundle bytes stable. No createdAt/random field in deterministic transfer encoding.
**Inspect:** bound bytes before parse; strict envelope/version/fields; bounded decode; verify all hashes/duplicates/counts, then owner resource validation. Return inspection DTO only.
**Prepare:** inspect → semantic parse → exact manual/order overlay → Model read → namespace replacement+revision0 → Model read again. Return candidate+resources and absent precondition; no resource writes. New collection ID must differ from source. Host handles destination collisions through Authoring.
**Recovery:** rejected import retains original artifact; no partial collection/resource admission. Export snapshots never change existing source revision. Prepared content remains subject to Authoring validation and feasibility at apply.
