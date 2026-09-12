# Canvas application integration

Authority: baseline documents01–06; WORK-PLAN.md. Capability PRs are checkpoints, not proof of a working app. Canvas/Export standards gates remain open. This plan binds existing owners and enumerates actual host behavior; it does not move domain policy into hosts.

## Responsibilities and execution order

| Host / slice | Owned responsibility | Required outcome |
|---|---|---|
| service | Workspace lifecycle, authenticated loopback requests, capability composition, worker scheduling and committed-change delivery | Real persistent workspace shared by web and CLI; every mutation admitted through Authoring |
| cli | Argument/filesystem input, readable DSL/diagnostics, transport and artifact destinations | Agent describe/read/create/patch/preview/apply/export commands; no required JSON/coordinate authoring |
| web shell | Panel/editor/preference sessions, request presentation, feature registration, service connection | Polished React application using Design System and actual React Flow Canvas |
| web editing | Local draft generations, one in-flight request per collection/client, receipt reconciliation | Human and agent changes retain current camera, recoverable drafts and accurate save status |
| browser acceptance | Each visible UI unit and its meaningful states | Actual in-app browser evidence, then human create/drag/refresh/restart and mixed agent edits |

Build order: owner interchange/browser seams → service composition/admission/rendering → HTTP/CLI path → shell/library/panels → inspectors/editing → resource/export/preferences surfaces → per-unit visible reviews and final dogfood collection. Keep commits/PRs reviewable; do not stop working at a PR checkpoint.

## Required owner seams discovered at integration

| Gap in existing callable contracts | Owning change / constraint |
|---|---|
| Layout requires a ProjectionReader but Presentation exposes no complete serialized Projection reader | Presentation must expose checked projection/content interchange. No host cast or copied domain schema. |
| Layout requires marker/branch metrics absent from Presentation's public surface | Presentation exposes its own marker bounds and measures branch labels using the same fonts/tokens. Host does not parse SVG or copy notation constants. |
| Canvas requires an admitted Scene after HTTP/worker serialization | Layout exposes validated scene reconstruction against an admitted Projection and supplemental measurements. Canvas retains independent interaction/identity checks. |
| Browser needs shared Presentation React bindings without native fontkit/Node initialization | Explicit browser binding loads only shared SVG components/font definitions; native measurement remains in the service/worker. Keep sole public entry, lazy native composition and type-only foreign declarations. |
| Templates requires semantic recipe expansion | Language exposes namespace expansion through parsed/validated semantics. Do not regex-replace IDs in DSL; collection-scoped aliases remain readable and references consistent. |

These are additive integration work at their existing owners. Extend existing capability cases where necessary; no extra capability test count and no repeated capability audit. Host tests below prove their composition. Record consequential interface changes and remaining limits explicitly.

## Service contract

- One explicit workspace directory: SQLite canonical records/receipts/history plus Assets-managed immutable bytes. Environment/location input is confined to host startup. Preserve old location on failed restore.
- Open/close owners once. Initial catalog, workspace metadata and shipped preset admissions pass through Authoring with absent preconditions; startup never writes canonical records directly. Staged fonts/assets may be written through Assets before their authoritative bindings are admitted.
- Bind real Model/Library validators, Language planners, Templates codecs, Assets retention, Presentation measurement, Layout feasibility, Persistence commits, Export transfer codecs. No test planner/resource no-op is a production fallback.
- Node24 service binds127.0.0.1 only. Installation tokens persist with restrictive file permissions; browser and agent credentials are distinct. Authenticate before authoring or blob reads; derive actor kind from credential/route policy, never trust submitted actor. Restrict browser Origin to configured app origin; reject unexpected origins and oversized bodies. Tokens never appear in logs, examples or URLs.
- Development web host proxies authenticated same-origin requests; credentials remain in server-side configuration. Production loopback host serves its built app and APIs under the same origin. CLI reads its local credential file.
- Production browser bootstrap: direct top-level navigation to the exact configured loopback Host establishes a fresh browser session via an HttpOnly, SameSite=Strict, Path=/ cookie. Reject cross-site navigation/bootstrap and unexpected Host before issuing it; no installation token is sent to JavaScript. Fetch, blob and SSE requests use that cookie. Sessions expire on service restart; a fresh navigation restores access while checked local drafts remain recoverable. Authenticate cookie requests against the current session generation and enforce Origin/Fetch-Metadata policy; agent requests use their separate bearer credential.
- Public operations: workspace read; collection/source/render read; DSL description; library query; authoring preview/apply/receipt/undo/redo; asset stage/resolve; preset list/read/admit/instantiate; export/download and import preparation/apply; backup/verified restore; committed-change subscription.
- Service adapters map checked owner results into a versioned transport envelope. Server errors expose stable codes/paths/recovery; no stack strings become protocol decisions. HTTP status and body agree; malformed input performs no mutation.
- Model changes and Language intents are separate inbound planner adapters to the same Authoring gate. Create/delete includes Library membership in the same conditional transaction. Validation reads every necessary catalog/preset/resource dependency; no blind record write or prepared-candidate bypass.
- Asset retention covers current, inverse-history and submitted resolved resources through terminal commit/export completion. Owner validators inspect transfer media/presets/fonts before admission. Resources and authoritative records have distinct lifecycles.
- Layout runs in an actual worker realm, with latest-job/input-key cancellation and immutable returned data. Layout checks every apply. Committed-change delivery is a hint: clients reread authoritative revision; disconnect/reconnect reconciles receipts and snapshot sequence. No silent polling-triggered Fit.
- Export bytes are returned with correct media type, revision-bearing filename and scope. Import stages verified resources and submits the candidate through Authoring with absent destination preconditions. Restore verifies a new workspace before switching; old workspace remains recoverable.
- Restore handover: prepare and verify separately; pause new admissions; settle accepted commits/receipts and release outstanding leases; cancel/drain old workers; switch the owner set atomically and advance a host workspace generation. Failure before switch resumes the old owners. Transport reads, pending requests and workers carry workspace identity plus generation; old-generation messages cannot apply to the new workspace. Send a reconnect event and require a fresh snapshot. Keep old drafts/uncertain request IDs associated with the old generation for recovery; never replay them automatically into restored state.

## React and UX contract

- Reuse the concrete TSX/CSS inventory in baseline03. New splits retain clear ownership and update inventory. SidePanel → PanelHeader + PanelBody → PanelBodyHeader + registered PanelSections; each section has its own header/body. Declarative placement controls side/order/collapse; contents are stable injected React slots.
- Web core owns immutable panel/editor/preferences state. Browser adapters own local storage, fetch, event stream, focus and mounting. Compose alone wires sibling adapters. React uses cached external-store snapshots; no props mirrored by effects and no component factories inside render.
- Left sections: collections/folders/search/recent/archive, section navigator, object outline, insert/templates/assets. Right sections: shared semantic content, local appearance/layout, labelled wire/endpoint/route controls, provenance, history/problems, collection theme and personal UI preferences. Users can reorganize supported sections without source edits.
- Empty/new collection offers add-section, template and DSL entry. Real inspector editors cover ER fields/keys, typed ports/members/functions, text/code/lists/tables/images/links, groups and sequence structure. Inline errors preserve input and identify its scope.
- Canvas uses its existing actual React Flow surface and controls. Trackpad scroll pans, pinch zooms, blank drag/Hand/Space pan, Shift marquee. Selection does not move the camera. Wire routes expose bends and endpoint sides/locks; labelled relationships remain canonical.
- Draft generations and captured submissions remain distinct. One browser mutation is in flight per collection. Newer typing survives an earlier success. Uncertain responses reuse the same request for receipt recovery; a revised conflict draft uses a new request and fresh versions. No offline merge queue or optimistic Saved label.
- Personal UI theme/density/text/motion and panel layout persist locally through checked storage. Diagram themes/pins change through Authoring. Token scope installation and CSS variables come from Design System; no scattered independent palettes or dimension constants.
- Baseline U01/U02/U03 behavior, modal overlays/inert background, keyboard resizing/focus restoration and accessible names are required. Dirty overlay closure uses Keep draft / Discard / Stay. Reading mode restores editing camera/selection on exit.

## Frozen host test budget — exactly8 new in-process cases, no E2E

|#|Contract case|Tier/type|Loop/nightly s|Maintenance|For / confidence|Against / confidence|Already covered|Retire when|
|---|---|---|---|---|---|---|---|---|
|1|Owner bridge maps snapshot/receipt/version identities without bypassing conditional commit|fast/contract|.2/.2|medium|Prevents a write authority bypass95%|Injected storage misses native recovery30%|Persistence/Authoring separately, no host mapping|Equivalent public host contract replaces it|
|2|DSL create atomically registers collection; stale edit rejects; identical retry retains receipt|fast/integration|.6/.6|medium|Prevents lost/duplicate agent writes95%|Existing owner tests cover individual steps40%|Language/Authoring/Library in isolation|Equivalent host oracle replaces it|
|3|Human placement intent preserves local coordinates and routes through Model/Authoring|fast/integration|.4/.4|medium|Prevents UI JSON bypass95%|Canvas already emits intent40%|Canvas gesture cases, no real host adapter|Equivalent host oracle replaces it|
|4|Malformed request, token/origin/actor mismatch and payload bounds reject before handlers|fast/contract|.2/.2|medium|Prevents unintended local writes95%|No real socket/browser attack simulation35%|No host transport contract|Transport protocol removed/replaced|
|5|Serialized owner projection/scene plus stale worker reply handling preserves current scene|fast/contract|.4/.4|medium|Prevents unsafe casts/stale updates90%|Real worker timing checked operationally35%|Layout/Canvas separate contracts|Equivalent host oracle replaces it|
|6|Panel placement/collapse/responsive transition preserves dirty body state and one overlay|fast/unit|.1/.1|low|Prevents reorganization losing edits90%|Does not certify rendered focus/scroll40%|Design System primitives only|Equivalent shell state contract replaces it|
|7|Draft/submission generations, foreign commit, uncertain receipt and reconnect retain correct edits|fast/unit|.2/.2|medium|Prevents silent draft loss95%|Injected transport misses browser storage faults35%|Authoring receipts, not web sessions|Equivalent public session oracle replaces it|
|8|CLI arguments/source/file errors map to the same service request and readable diagnostics|fast/contract|.1/.1|low|Prevents agent authoring mismatch90%|Does not boot executable30%|Language syntax only|CLI interface replaced|
|TOTAL|8|fast only|2.2/2.2|||||

No headless UI test substitutes for human experience. No additional test count without user authorization. Extend retained cases for verified findings; use real service/CLI/browser operational runs to prove the application outcomes.

## Visible audit units and completion evidence

One bounded independent audit per unit after implementation, with actual in-browser operation and screenshots; no more than5 source targets if source review is necessary. Parent verifies findings and fixes once. Include expanded/collapsed/toggled/loading/empty/error/draft states relevant to that unit, not a single default screenshot.

1. Workspace/library/navigation and collection create/open/search/archive.
2. Shared panel shell, section registration/reorder/collapse, resize and responsive overlays.
3. Inspector semantic/local/wire/ER/module/sequence editors and deletion scopes.
4. UI preferences, collection theme and accessibility states.
5. Canvas pan/zoom/drag/groups/routes/outline/reading behavior.
6. Authoring preview/problems/history/drafts/conflicts/receipts/disconnect.
7. Assets/templates/export/import/backup and progress/failure surfaces, including restore with a pending request and clean-start production browser authentication.
8. Final mixed collection interoperability: human creation, drag→refresh→dev-server restart; agent DSL mixed engineering/education; agent updates while human has a live draft.

Keep per-unit evidence in quality/acceptance-evidence/ui. Measure the existing baseline performance targets on the declared machine; passing small demos does not certify the1000-node fixture. Create the repository dogfood collection through the same agent DSL path and show it on one canvas. No automatic merge or deployment.
