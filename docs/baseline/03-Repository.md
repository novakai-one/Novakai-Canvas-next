# 03 · Target repository and engineering gates

**Target baseline 1.2 · Proposed · 11 September 2026.** This specifies the target, not the present worktree. [Functionality](01-Functionality.md) · [capabilities](02-Capabilities.md) · [DSL](04-DSL.md) · [UI/UX](05-UI-UX.md) · [design tokens](06-Design-Tokens.md).

## Repository naming and scaffold status

The Canvas repository root is designed to move under `novakai/package/canvas/`. Inside Canvas use `capability/<name>/`, **not** `packages/`. The outer Novakai `package/canvas` represents this whole application. Native npm filenames/keys such as `package.json`, `exports` and pnpm's `packages` workspace key retain their tooling-defined names; they do not name our architectural folders.

The created scaffold contains directories, tracked empty-folder markers, metadata, baseline documents and panel-default data. TS/TSX/CSS paths below are the implementation inventory, not empty fake components or working APIs. Source files, dependency pins and architecture enforcement are introduced with the first implementation slice. No tests/build success or code scores are claimed by a directory scaffold.

## Repository shape

One TypeScript repository. Eleven domain capability folders, one supporting Design System folder, and three application hosts. Each capability/host follows the same contract/core/adapters structure. Hosts contain integration policy and UI shell composition, never duplicate domain rules.

```text
novakai-canvas/
├── apps/
│   ├── web/                   # React shell, local service client, browser composition
│   ├── service/               # loopback HTTP, request boundaries, workspace lifecycle
│   └── cli/                   # nvk executable and human-readable command output
├── capability/
│   ├── design-system/         # reusable React primitives + token resolution/styles
│   ├── model/                 # valid collection state and transition plans
│   ├── authoring/             # atomic admission, conflicts, receipts and history
│   ├── language/              # DSL parsing, lowering, printing and discovery
│   ├── library/               # catalog, folders and search
│   ├── assets/                # media admission and immutable resolution
│   ├── templates/             # versioned recipe and theme expansion
│   ├── presentation/          # notation, content rendering and measurement
│   ├── layout/                # arrangement, constraints, edge routing
│   ├── canvas/                # interaction state and React Flow view adapter
│   ├── persistence/           # transactions, durable snapshots and recovery
│   └── export/                # SVG, PNG, PDF, portable bundle, static HTML
├── resources/
│   ├── ui/panels.default.json # panel section placement data
│   ├── themes/                # versioned data with schema and license metadata
│   ├── templates/             # DSL recipes + preview + manifest
│   ├── icons/                 # approved source assets + attribution
│   └── fonts/                 # offline distributable fonts + license notices
├── examples/
│   ├── engineering/           # ER, typed modules/functions, state and sequence
│   ├── education/             # SOP, infographic, mind map
│   └── dogfood/               # repository capability collection
├── tests/
│   ├── acceptance/            # real host contract / selected browser workflows
│   ├── fixtures/              # independently specified semantic and visual cases
│   └── performance/           # declared machine and reproducible measurement flows
├── tools/
│   ├── architecture/          # import/cycle/public-export checks
│   └── review/                # per-file evidence manifest verification
├── docs/
│   ├── baseline/              # these six documents + their illustrative assets
│   ├── decisions/             # consequential changes to frozen boundaries
│   └── contracts/             # derived schemas and behavioral contract details
├── quality/
│   ├── file-reviews/          # 16 scores, line evidence, reviewer and source hash
│   └── acceptance-evidence/   # scenario results and visual/usability review
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
└── eslint.config.mjs
```

`resources` and `examples` contain data, not executable domain policy. `tools` are standalone executable packages if they grow source modules, and then use the same minimum package shape. No `legacy`, miscellaneous `utils`, unrestricted `shared`, or second graph implementation is part of the target. Code is removed when its replacement is proven; inherited diagrams may be discarded as authorized.

### Minimum shape of every capability, including hosts

```text
capability/<name>/
├── contract/
│   ├── index.ts               # sole external import surface; explicit exports
│   ├── types.ts               # readonly DTOs and result shapes
│   ├── schemas.ts             # shape validation; no domain transition policy
│   ├── brands.ts              # validated ID constructors/types
│   ├── errors.ts
│   ├── events.ts
│   ├── records/
│   ├── api.ts                 # entry operations delegating to own core
│   ├── compose.ts             # bind/inject dependencies once; no domain decisions
│   └── ports/                 # consumer-owned I/O and behavior seams
├── core/
│   └── <owned-concern>/       # direct internal imports; cohesive behavior
├── adapters/
│   └── <seam>/                # actual I/O or library implementation
├── cli/                      # optional package-specific executable adapter
└── tests/                    # public API and adapter contract suites
```

This is a minimum interface, not a mandate to split every function into a file. Additional folders and files are allowed. Empty concerns are not filled with invented behaviors merely to resemble the tree. The required files/surfaces remain identifiable. `api/` may replace `api.ts` when justified.

### Concrete React, CSS and UI behavior tree

The following expands the web-facing parts of the tree; the minimum contract/core/adapters/tests shape above also applies. Files are proposed, not created implementation. Paired TSX/CSS modules below are individual files, not a second component architecture.

```text
apps/web/
├── contract/
│   ├── index.ts
│   ├── compose.ts
│   ├── react-types.ts              # narrow readonly UI slots; adapter-only
│   ├── preferences.ts
│   ├── panel-types.ts
│   ├── panel-schemas.ts
│   └── ports/{workspace,drafts,preferences,focus}.ts
├── core/
│   ├── workspace/panel-state.ts
│   ├── panels/resolve-panel.ts
│   ├── editing/edit-session.ts
│   ├── search/search-session.ts
│   └── preferences/preference-state.ts
├── adapters/
│   ├── react/
│   │   ├── WorkspaceApp.tsx
│   │   ├── panels/
│   │   │   ├── WorkspaceSidePanel.tsx      + WorkspaceSidePanel.module.css
│   │   │   ├── CollectionNavigator.tsx     + CollectionNavigator.module.css
│   │   │   ├── CollectionThemeSection.tsx  + CollectionThemeSection.module.css
│   │   │   ├── UiPreferencesSection.tsx    + UiPreferencesSection.module.css
│   │   │   └── ThemeEditor.tsx             + ThemeEditor.module.css
│   │   ├── WorkspaceShell.tsx       + WorkspaceShell.module.css
│   │   ├── WorkspaceHeader.tsx      + WorkspaceHeader.module.css
│   │   ├── CollectionLibrary.tsx    + CollectionLibrary.module.css
│   │   ├── SectionNavigator.tsx     + SectionNavigator.module.css
│   │   ├── ObjectOutline.tsx        + ObjectOutline.module.css
│   │   ├── SharedContentEditor.tsx  + SharedContentEditor.module.css
│   │   ├── AppearanceEditor.tsx     + AppearanceEditor.module.css
│   │   ├── WireEditor.tsx           + WireEditor.module.css
│   │   ├── InsertPalette.tsx        + InsertPalette.module.css
│   │   ├── CommandPalette.tsx       + CommandPalette.module.css
│   │   ├── AssetPicker.tsx          + AssetPicker.module.css
│   │   ├── TemplatePicker.tsx       + TemplatePicker.module.css
│   │   ├── SourceEditor.tsx         + SourceEditor.module.css
│   │   ├── HistoryPanel.tsx         + HistoryPanel.module.css
│   │   ├── ChangeReviewDialog.tsx   + ChangeReviewDialog.module.css
│   │   ├── ConflictPanel.tsx        + ConflictPanel.module.css
│   │   ├── ExportDialog.tsx         + ExportDialog.module.css
│   │   ├── SettingsDialog.tsx       + SettingsDialog.module.css
│   │   ├── ReadingView.tsx          + ReadingView.module.css
│   │   ├── ServiceStatus.tsx        + ServiceStatus.module.css
│   │   ├── use-workspace.ts
│   │   ├── use-edit-session.ts
│   │   └── use-preferences.ts
│   ├── browser/{mount,focus,drafts,preferences}.ts
│   └── service/{workspace-client,receipt-client}.ts
└── cli/browser.ts                 # mounts via own public contract

capability/design-system/             # supporting library, not another domain capability
├── contract/
│   ├── index.ts
│   ├── api.ts
│   ├── compose.ts
│   ├── token-types.ts
│   ├── token-schemas.ts
│   ├── ports/token-source.ts
│   ├── ports/token-artifacts.ts
│   ├── react-types.ts              # explicit environment-specific binding types
│   ├── generated/token-names.ts
│   └── generated/breakpoints.ts
├── core/tokens/
│   ├── resolve.ts
│   ├── validate.ts
│   ├── contrast.ts
│   └── emit.ts
├── tokens/
│   ├── definitions.tokens.json
│   ├── semantics.tokens.json
│   ├── preferences.tokens.json
│   └── themes/{paper,ink}.theme.json
├── adapters/
│   ├── react/
│   │   ├── panels/
│   │   │   ├── SidePanel.tsx           + SidePanel.module.css
│   │   │   ├── PanelHeader.tsx         + PanelHeader.module.css
│   │   │   ├── PanelBody.tsx           + PanelBody.module.css
│   │   │   ├── PanelBodyHeader.tsx     + PanelBodyHeader.module.css
│   │   │   ├── PanelSection.tsx        + PanelSection.module.css
│   │   │   ├── PanelSectionHeader.tsx  + PanelSectionHeader.module.css
│   │   │   └── PanelSectionBody.tsx    + PanelSectionBody.module.css
│   │   ├── Button.tsx              + Button.module.css
│   │   ├── Field.tsx               + Field.module.css
│   │   ├── Dialog.tsx              + Dialog.module.css
│   │   ├── Menu.tsx                + Menu.module.css
│   │   ├── Tabs.tsx                + Tabs.module.css
│   │   ├── Tooltip.tsx             + Tooltip.module.css
│   │   └── StatusMessage.tsx       + StatusMessage.module.css
│   ├── browser/install-tokens.ts
│   ├── build/token-files.ts         # source-reader + atomic artifact-writer adapter
│   └── styles/
│       ├── entry.css
│       ├── reset.css
│       ├── utilities.css
│       ├── tokens.generated.css
│       ├── semantics.generated.css
│       ├── themes.generated.css
│       ├── preferences.generated.css
│       └── layout.generated.css
└── cli/build-tokens.ts             # calls public token compiler

capability/canvas/
├── contract/{compose,react-types,interaction-profile}.ts
├── core/
│   ├── interaction/gesture-policy.ts
│   └── accessibility/outline.ts
└── adapters/react-flow/
    ├── CanvasSurface.tsx           + CanvasSurface.module.css
    ├── SceneNode.tsx               + SceneNode.module.css
    ├── SceneEdge.tsx               + SceneEdge.module.css
    ├── SectionFrame.tsx            + SectionFrame.module.css
    ├── CanvasControls.tsx          + CanvasControls.module.css
    ├── DiagramOutline.tsx          + DiagramOutline.module.css
    ├── use-scene.ts
    ├── style-entry.ts
    ├── vendor.css
    └── react-flow-theme.module.css

capability/presentation/
├── contract/{compose,react-types}.ts
├── core/content/content-model.ts
└── adapters/react/
    ├── NodeContent.tsx             + NodeContent.module.css
    └── ContentBlocks.tsx           + ContentBlocks.module.css
```

The `+` shorthand lists two concrete files in the same folder, not a filename. The inventory contains **48 TSX files and 47 colocated CSS modules**, plus the named shared/generated/vendor styles. WorkspaceApp only composes slots and has no private stylesheet. This is a responsibility inventory, not a minimum LOC or file-count score: later splitting/merging must preserve ownership and update this tree.

Presentation renderer reconciliation (12 September 2026): EntityTable, InterfaceCard and SequenceContent merge into ContentBlocks, which renders the same measured primitives for all semantic families. Their notation/row/message meaning remains in Presentation core; global sequence geometry remains Layout. NodeContent owns the SVG frame and exact font scope, receiving ContentBlocks as a narrow injected slot. This preserves one measurement/render path and the React/CSS boundary.

Design System's token compiler reads its data through an injected source-reader port; only `adapters/build/token-files.ts` opens token source files and writes generated artifacts. It implements `contract/ports/token-source.ts` and `token-artifacts.ts`, is wired by own compose and invoked by `cli/build-tokens.ts` through the public API. Core resolves/emits in memory; CLI never opens or writes generated files directly. The extra `tokens/` data folder is permitted by the minimum-shape SOP. Authoritative collection theme presets under `resources/themes/` reference a base token version and diagram-theme overrides; they do not copy Design System's global definitions. A UI theme uses Design System's shipped presets; a collection theme is resolved and pinned through Templates/Authoring.

### UI bindings and style imports

The sole external source import is still `contract/index.ts`. React-specific binding factories may be exported alongside framework-free APIs, with separately named React-only prop types in `contract/react-types.ts`. Core cannot import those types; its declarations remain framework-free. `contract/compose.ts` constructs stable bindings from own adapters and injected collaborators. Each view's slots name only the child controls it actually renders; no universal 40-component service locator is passed around.

For example, web compose imports its own `WorkspaceSidePanel` and `SharedContentEditor` adapters, obtains Design System bindings through its public index, and passes the required Field/Tabs slots into the panel section bindings. The panel adapter renders those stable slots; it does not import a sibling adapter. The same pattern binds NodeContent into SceneNode across Presentation/Canvas public contracts. CSS module assets are imported locally by their adapter. Style entry resources are installed by own composition and reach consumers through the public binding; there is no `@novakai/design-system/private.css` escape hatch.

The dependency graph gains a leaf **Design System**: no domain dependencies; Presentation may import its public token types through its own declarations; browser UI adapter bindings may consume its public React types. Hosts and Canvas/Presentation adapters receive its renderer/style bindings through composition. Business core runtime behavior stays injected, and no capability gains a runtime import of another capability's implementation.


## Exact import/export rules

This adopts the user's [folder SOP](../standards/REPO-FOLDER-STRUCTURE.md). Unlisted relationships are forbidden. Type-only imports obey package boundaries too.

| Caller | Allowed imports |
|---|---|
| Any external consumer, host or package | Other package's `contract/index.ts` via its bare package name only. |
| Own `core/**` | Own core; own declaration-only `contract/{types,schemas,brands,errors,events,records,ports}`; core-local consumer role declarations; specifically listed declaration-only token/profile/panel/generated-data modules. Never `react-types.ts`. |
| Own contract declaration modules | Own contract declarations; external public contract **types** where explicitly permitted in the type graph below. No core behavior or composition. |
| Own `contract/api*` | Own core and own declarations. |
| Own `contract/compose.ts` | Own core, own contract, own adapters; external public entry points only when this is an application composition host. |
| Own `adapters/**` | Own contract; external public contracts permitted by the wiring graph; declared third-party dependencies and platform APIs; own local CSS assets. No own core or sibling adapter behavior imports. |
| Own `cli/**` | Own contract; CLI/platform parsing dependencies. No core or adapter imports. |
| Own `tests/**` | Own/public contracts; own adapters only to run the same contract suite against implementations. No private core imports. |
| Root acceptance/performance tests | Host/package public contracts, CLI/HTTP/browser surfaces and fixtures. No private implementation imports. |

Core never imports own `contract/index.ts`, `api`, `compose`, other packages, hosts, adapters, React or database libraries. A consumer-owned port is a capability's requirement, not an infrastructure library's interface copied into core. The bridge implementation maps between its consumer's DTOs and the collaborator's public DTOs.

Each capability’s npm `exports` exposes only `.` → built `contract/index.js`, including its type declaration. No `./*` wildcard or private testing export. Worker bundles and CLI binaries are executable build entries, not additional import surfaces: their thin entry under `cli/` calls their own public contract. Web HTML bootstraps its host through its public contract. Build entry selection does not grant other source files permission to import a private entry.

Enforce with `no-restricted-imports` for **all** TS/TSX/JS source, including apps, tests and tools. Rules must account for relative paths, aliases, dynamic imports, re-exports and CommonJS equivalents; a resolver-based architecture check closes forms the lint rule cannot resolve. CI checks the actual graph, not only textual globs. Add package export checks and reject type/runtime cycles.

## Dependency direction and composition

Domain plans/intent/types have one semantic owner. Model exports the collection vocabulary. Other packages may re-export explicitly named Model types from their declaration contracts; they must not create a second subtly different definition. Transport DTOs may intentionally differ and are mapped in adapters.

**Permitted cross-package type dependencies:** Design System has none. React-only adapter binding declarations may consume its public UI types; no core imports them. Model and Persistence have none. Library, Assets and Templates have none (their own DTOs). Language → Model. Authoring → Model, Library. Presentation → Model, Assets, Templates, Design System token types. Layout → Presentation. Canvas → Model, Presentation, Layout. Export → Model, Presentation, Layout, Assets, Templates. Application hosts → the capability contracts they compose. A new edge requires review and must remain acyclic. Core only sees these through its own declarations.

**Permitted runtime connections, supplied by application host composition:**

| Consumer | Injected collaborator roles |
|---|---|
| Authoring | Model transition planner; Library catalog planner; asset/preset resolver; persistence snapshot/conditional writer/receipt lookup; preview producer; clock/ID source. |
| Library | immutable catalog/collection search snapshot reader. |
| Assets | blob reader/writer/verifier, digest implementation, admission limits. |
| Templates | immutable preset reader, ID allocator. |
| Presentation | pinned asset/theme resolver, content measurement/rendering backend. |
| Layout | layout policy engine, route engine, cancellation/scheduling boundary. |
| Canvas | scene provider, authoring submission, navigation/preferences boundary. |
| Persistence | database transaction engine, blob snapshot/restore coordinator, filesystem/clock boundary. |
| Export | snapshot reader, asset resolver, scene producer, format writer; import validator/preparer. |
| Design System | token definition reader, style installer and platform measurement boundary where required; no domain behavior. |
| Language / Model | pure policy registries and deterministic helpers only. |

A host creates each capability using public factories and connects consumer-owned ports with its own adapter bridges. For example `apps/service/adapters/authoring-store.ts` implements the Authoring store port by calling the Persistence public API; it translates errors and records without importing either core. `apps/service/contract/compose.ts` injects that bridge. No capability statically imports another capability's runtime to perform hidden wiring.

This graph describes calls, not object construction order. Ports hold immutable functions; construction cannot start I/O. The service's explicit `start` boundary creates lifecycles after wiring. A preview producer combines Presentation and Layout; it does not call Authoring back. Subscription/revision notifications carry data, never a service locator.

### Concrete implementation choices

| Concern | Target decision and containment |
|---|---|
| UI | React + TypeScript; React Flow adapter in `canvas/adapters/react-flow`. Custom node content from Presentation. Native SVG paths inside React Flow edges are appropriate; a standalone SVG masquerading as the interactive canvas is not. |
| Layout | ELK for layered, hierarchical and orthogonal layout behind `layout` ports; mode-specific sequence/grid policies remain deterministic internal policies. |
| Routing | Start with ELK routing, add a replaceable libavoid/Wasm adapter for obstacle-aware incremental routing where the acceptance fixtures require it. Manual constraints are engine-independent data. |
| Storage | SQLite transactions containing versioned JSON records, receipt/history tables and schema metadata; immutable assets in content-addressed files. Service owns database access. |
| Transport | Loopback HTTP request/result API plus revision notifications. CLI and browser share the same service; no direct CLI database writes. |
| Export | Same Presentation/Layout scene; SVG serialization, rasterization and PDF/static HTML adapters. Portable bundles include app-owned overrides separately from semantic DSL. |
| Scheduling | Browser workers for layout/expensive measurement where possible; cancellation and input hashes prevent stale scenes. |

React Flow's core is MIT licensed ([official site](https://reactflow.dev/)); paid Pro features are not a dependency. ELK is EPL-2.0 ([Eclipse project](https://projects.eclipse.org/projects/modeling.elk)); routing/placement options are documented in the [ELK reference](https://eclipse.dev/elk/reference.html). Adaptagrams/libavoid uses LGPL-2.1-or-later ([project README](https://github.com/mjwybrow/adaptagrams/blob/master/README.md)). These are open-source options without a mandatory commercial purchase. A chosen Wasm distribution must have verified provenance and license notices/redistribution obligations; do not assume every wrapper shares the same terms. Pin exact versions and artifact hashes at implementation, and prove routing fixtures before selecting the additional adapter. No unverified “latest/faster Wasm” claim is part of the architecture.

## Engineering gates: evidence, not promises

The user's [16-principle coding standard](../standards/CODING-STANDARDS.md) is the scoring authority. **Every first-party code file must score at least 145/160.** The user's stricter Sonar target is **≤2 cognitive complexity per function**, overriding the SOP's ≤15 default.

Every code file includes implementation, adapters, host entries, tests, scripts and executable configuration. Vendored third-party distributions, generated build output and non-code assets/documents are tracked separately; relocating authored logic into “generated” or “data” to avoid review is forbidden. This design does not assign scores to code that has not been written.

| Gate | Evidence required |
|---|---|
| File score | One record per source hash: all 16 integer scores, target file/lines, collaborator evidence, reviewer, date, total and worst findings. Any file below 145 blocks release. |
| Scoring fidelity | LSP is exactly 7 when subtyping is not demonstrated; real implementations share a contract suite. No invented second implementation solely to raise a score. Thin wrappers, ambient bootstrap reads and cross-call mutation are scored as written; no adapter/bootstrap exemption. |
| Cognitive complexity | Sonar-compatible automated rule at 2, no blanket suppression or folder exclusion. Splitting expressions to evade the measure without improving comprehension fails review. |
| Boundaries | Zero illegal imports, accidental public exports or graph cycles. |
| Public failures | Typed results at every application boundary; named recovery owner in entry documentation/return contract. |
| Behavior | Public contract suites, agreed acceptance scenarios, meaningful browser checks and visual evidence. |
| Dependency hygiene | Lockfile, license manifest, approved assets, no commercial-only requirement. |

The strict file rubric can expose tension in otherwise reasonable thin entry/declaration files. It remains a **release constraint**, not grounds to fabricate behavior or pre-award 10s. If an unavoidable file cannot reach 145 under the literal anchors, report the concrete evidence and unresolved requirement conflict; do not claim the repository meets the standard. Per-file evidence is necessary even though an independent reviewer need not read every file.

Independent audit process: first sample **three files**, each scored independently out of 160. After the pattern is established, sample **ceil(10% of code files) per capability**, at least one file where code exists, and at most **five targets per subagent**. Sample different roles and include host/tool/test/config files in separate groups. A failure expands review of the affected pattern. Every-file evidence and independent sampling are different gates, not substitutes. Never label an entire repo compliant based on a sample.

## First five folders to implement

Start with `capability/model`, `capability/library`, `capability/persistence`, `capability/authoring`, then `capability/language`. Build only the smallest real behavior each contributes to creating, reading and safely editing a collection through the agent DSL. These are dependency-ordered starting folders, not a requirement to finish a whole capability before integrating it. Next add Presentation, Layout and Canvas plus the Design System/web panel shell for the first visible mixed diagram. The delivery milestones below remain the broader completion roadmap.

## Spec-driven TDD and implementation order

Start each slice with an acceptance example a human can understand: “after a human renames this object, an older agent patch is rejected and the rename remains.” Agree the expected state/error before implementation. Write the smallest meaningful public-contract test that fails for that reason; implement; refactor; verify visually when relevant. Test adapters with the same contract suite. No tests of private helpers merely to increase coverage.

1. **Complete authoring slice:** one collection, two authors, DSL create/read/patch, atomic persistence, conflict/retry, one React Flow section and undo.
2. **Mixed engineering:** canonical reuse, ER fields/crow’s feet, module/function ports, labelled wires, collection sections and dogfood fixture.
3. **Education and composition:** structured blocks, assets, infographic/story layouts, SOP/tree/state/sequence policies, templates and themes.
4. **Interaction and routing:** full keyboard/trackpad behavior, manual constraints, incremental layout and inspection diagnostics.
5. **Delivery and hardening:** exports/import, backups/recovery, accessibility, performance and full standards evidence.

These are delivery slices, not separate architectures or permission to omit later features. Each slice uses the final package boundaries. Root/host scaffolding follows the same standards from the first commit. The inherited code can be removed incrementally or replaced wholesale; no migration requirement justifies retaining a duplicate path.

## Document review record

### Original documents 1–4 (baseline 1.0)

Completed 11 September 2026 with a new reviewer given **no preceding conversation history**, only this document set, the task requirements and the two standards. The reviewer identified six blocking findings and four contract clarifications. The author verified and fixed them, and the reviewer re-read the revised contracts. No remaining architectural/import blocker was found.

| Finding | Verified correction |
|---|---|
| B1 · provenance/endpoint name collision | `sources` and `from-end`/`to-end` have distinct meanings and typed namespaces. |
| B2 · DSL lost supported metadata | Source lists, links and canonical step numbers now have explicit syntax/model ownership. Example numbers match the image. |
| B3 · inconsistent endpoint addressing | One target union and an object-wide descendant-ID namespace cover ports, fields, members, signatures and table rows. |
| B4 · contradictory alignment axes | Main-axis `align` and cross-axis `rank` have consistent definitions and counterexamples. |
| B5 · stale catalog edits | Client expected versions cover catalog/admission records as well as collections; server read-set checks are additional. |
| B6 · retries depended on mutable files/aliases | Receipt lookup precedes resolution; fingerprints, durable client submissions, atomic uniqueness, no-ops and rejected outcomes are defined. |
| C1 · locked layout conflict outcome | Infeasible hard locks reject the complete edit; unlocked preferences may adjust with visible diagnostics. Feasibility is always checked. |
| C2 · tree annotations | Explicit appearance participation excludes notes/legends from root/connectivity rules. |
| C3 · incomplete structural patches | Bounded section/node replacements support group, constraint, event and port edits while preserving surviving appearance overrides. |
| C4 · defaults/readout/example mismatches | Layout derives from mode; `view` is the single non-authorable scope envelope; example prose matches source. |

The recheck also clarified that submitted alias **names** remain in the request fingerprint while server-resolved values do not, and made appearance participation explicit in the canonical table. Written counterexamples in document 4 preserve the intended behavior for future tests.

Artifact checks verified four linked documents, exact equality of the embedded/standalone main DSL, unique main-example IDs and resolvable wire endpoints, valid SVG XML, and a browser-rendered PNG with visible labels and the referenced image asset. These are document/illustration checks, **not runtime DSL or application tests**.

This review establishes **design consistency and completeness at baseline level**. It does not certify a completed app, performance budgets, pixel parity, dependency distribution compliance or scores for unwritten code. Those remain the explicit implementation gates above.

### UI/token additions (baseline 1.1)

The fresh-context review of documents 5–6 and this expanded TSX/CSS tree is complete. Seven finding groups plus recheck refinements were corrected and verified; no remaining freeze blocker was found. The detailed closure records are in [document 5](05-UI-UX.md#pressure-test-record) and [document 6](06-Design-Tokens.md#pressure-test-record). This does not extend the earlier design review into a claim about implemented UI or code scores.

### Baseline 1.2 panel and folder amendment

Internal folders use `capability/`. Shared panel header/body/section components and a declarative section registry replace a monolithic InspectorPanel. Web shell owns panel open state; Canvas requests inspection without owning the container. See document 5 for user reordering, draft/focus preservation and theme controls. This amendment was author-checked; the earlier independent-review records apply to their labelled versions.
