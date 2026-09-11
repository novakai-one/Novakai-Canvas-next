# 01 · What the app must do

**Target baseline 1.0 · 11 September 2026 · Proposed architecture, not a claim about the current app.**

This is document 1 of six: [capabilities](02-Capabilities.md), [repository](03-Repository.md), [DSL and visual example](04-DSL.md). The [UI/UX](05-UI-UX.md) and [design tokens](06-Design-Tokens.md) complete the target set. The latest user requirements and linked coding/folder standards take precedence over this design; this set supersedes earlier competing capability proposals for the target described here.

## The purpose

Turn knowledge into diagrams people can understand, inspect and discuss. An agent can translate a specification, codebase, concept or SOP into a collection of connected visual explanations. A human can explore and edit that collection without reading its source documents or learning the authoring language.

Engineering diagrams and educational diagrams are equally important. The product must explain both **what a system contains** and **how something works**. A collection can put its ER model, module dependencies, process flow and illustrated explanation on the same canvas.

## Decisions to freeze

| Decision | Result for the user |
|---|---|
| One collection, several sections | Different diagram types appear together on one navigable canvas. |
| Shared semantic objects, separate appearances | The same module can appear in several sections; changing its name updates all appearances. Position and local emphasis can differ. |
| Composable content | Nodes can contain prose, images, icons, fields, signatures, lists and tables. A new illustration does not require a new graph engine. |
| Authoring is the sole diagram mutation gate | UI edits and agent DSL receive the same validation, concurrency protection and history. |
| Meaning first, geometry generated | Agents state content, relationships and relative layout intent. They never supply JSON or pixel coordinates. |
| Human layout is respected | Ordinary content edits preserve manual arrangements where feasible. Explicit reflow resets them. Conflicts are shown, not silently discarded. |
| React Flow canvas | Real interactive nodes, handles and edges; deliberate camera controls. |
| Local application with a local service | A browser and CLI share durable state through the service. No account or hosted service is required. |
| Rewrite permitted | Existing implementation and diagrams need not be preserved. No legacy migration is required for this baseline. |

**Scope:** every requirement below belongs to the target release, although implementation proceeds in slices. “Done” means all rows satisfy their acceptance conditions. This is not an MVP list with silently deferred rows. Anything added later receives an ID, an owner and acceptance evidence.

## Read this catalogue

IDs are stable references for implementation, tests and follow-up specifications. The **owner** is a capability from document 2 responsible for the outcome; dependencies are listed there. A feature may cross several capabilities without giving several of them authority over the same data.

### A. Collections and workspace

| ID | Required functionality | Observable acceptance condition | Owner |
|---|---|---|---|
| F01 | Create, name, duplicate, archive, restore and explicitly delete collections | Duplicate has independent identities and preserves content; deleting one leaves others valid. | Authoring |
| F02 | Folders, ordering, search and recent collections | Search finds titles, labels and descriptions; opening a result can locate its section or object. | Library |
| F03 | Multiple named, ordered sections on one canvas | An ER section, dependency section and SOP section coexist, with independent layout and a collection overview. | Model |
| F04 | Reuse an object in several sections | One canonical object, at most one appearance per section; edit shared content once, see it everywhere. | Model |
| F05 | Cross-section navigation and source references | Navigate to another appearance or source location; provenance distinguishes authored assertions from source evidence. | Canvas |
| F06 | Unplaced content and explicit deletion | Objects with zero appearances remain searchable; removing an appearance does not delete its object. Delete previews list affected wires and appearances. | Model |

### B. Diagram vocabulary

| ID | Required functionality | Observable acceptance condition | Owner |
|---|---|---|---|
| F07 | Flowcharts and SOPs | Start/end, steps, decisions, parallel branches, merge/join, numbered steps, labelled outcomes and rework loops render distinctly. | Presentation |
| F08 | ER models | Entity tables expose typed fields, PK/FK/unique/nullable markers, row endpoints and per-end minimum/maximum cardinality rendered as crow’s feet. | Model |
| F09 | Module, interface and function diagrams | Module nodes show provided/required typed ports; standalone interface/function nodes show members/signatures; labelled import, call and implementation relationships attach to valid endpoints. | Model |
| F10 | Mind maps and hierarchies | Named parent-child relationships create a rooted tree; invalid multiple parents or cycles are rejected for tree mode. | Model |
| F11 | Sequence and state diagrams | Sequence participants/messages have explicit order, alternatives and loops; state transitions have event labels and optional guards. | Model |
| F12 | Infographics and concept maps | Combine illustrations, cards, callouts, grouped explanations, text and graphs without rasterizing the entire diagram into a background image. | Presentation |
| F13 | Structured node content | Paragraph, list, code/signature, table, field, icon and image blocks can be combined, reordered and edited with stable block IDs. | Model |
| F14 | Groups and semantic containers | Nest visual groups without cycles; a group may represent a semantic object. A mere enclosing box does not assert a domain relationship. | Model |
| F15 | Explicit relationship semantics | Every wire has an ID, nonempty label, direction/kind and optional endpoint cardinalities. Branch labels, import labels and data labels remain readable. | Model |
| F16 | Notes, legends and links | Non-connected annotations, color/shape legends, source links and clickable object links are supported as content. | Presentation |

Diagram modes are conventions and validation/layout policies over shared primitives. ER adds field/cardinality rules; sequence adds temporal order. They are not separate persistence formats. No claim of UML certification or executable business-process notation is included.

### C. Agent and human authoring

| ID | Required functionality | Observable acceptance condition | Owner |
|---|---|---|---|
| F17 | New human editing workflow | Add/edit/delete content, connect endpoints, change groups and styles through UI; all committed changes go through Authoring. | Authoring |
| F18 | New readable DSL | Create full collections and patch existing ones using stable names, semantic commands, themes and size tokens; no agent coordinates or JSON required. | Language |
| F19 | Discoverable CLI | Help, vocabulary/schema description, examples, list/read/check/preview/apply/undo/redo/export commands work without reverse engineering source code. | Language |
| F20 | Useful reads and small edits | Read all or one section/object; output identifies scope and revision. A partial read cannot accidentally replace a whole collection. | Language |
| F21 | Preview before applying | Validate and render a proposed change, return a semantic diff and affected IDs, and preserve stored state until apply. | Authoring |
| F22 | Atomic changes | A batch either commits in full or changes nothing. Dangling endpoints, duplicate IDs and violated mode rules identify the offending input location. | Authoring |
| F23 | Concurrent human/agent safety | A stale expected revision is rejected with a diff; no last-writer-wins overwrite. A request retried after a lost response returns the original result. | Authoring |
| F24 | Undo, redo and history | Undo is a new validated transaction; history survives restart. Later overlapping changes produce a conflict instead of being silently undone. | Authoring |
| F25 | Edit fidelity | Reading DSL and applying a targeted patch preserves unrelated content, assets, identities and manual geometry. Unsupported versions are refused. | Language |
| F26 | Interruption recovery | If the service stops during a write, restarting exposes either the complete old transaction or complete new one; receipt lookup resolves uncertainty. | Persistence |

### D. Navigation and direct manipulation

| ID | Required functionality | Observable acceptance condition | Owner |
|---|---|---|---|
| F27 | Comfortable camera | Trackpad two-finger movement pans; pinch zooms; Space-drag and middle-drag pan. Clicking/selecting does not change the viewport. | Canvas |
| F28 | Explicit navigation tools | Fit collection, fit section, locate search result, minimap and saved reading order; Escape cancels active tools. Auto-fit happens only on first open or explicit request. | Canvas |
| F29 | Selection and bulk editing | Select, marquee, keyboard navigation, multi-select, duplicate, delete and align. Inspectors clearly distinguish shared content from appearance-only changes. | Canvas |
| F30 | Direct geometry editing | Drag nodes/groups/sections, resize, choose endpoint sides, and move wire bends. Preview is immediate; pointer release submits one authoring transaction. | Canvas |
| F31 | Accessibility | Keyboard equivalent for editing/navigation, visible focus, screen-reader content/relationship outline, non-color status cues and reduced-motion support. | Canvas |

### E. Automatic composition and routing

| ID | Required functionality | Observable acceptance condition | Owner |
|---|---|---|---|
| F32 | Automatic measured layout | Content is measured before placing; small/medium/large sizes are density presets, never clipped fixed-height boxes. | Layout |
| F33 | Layout modes | Flow, tree, ER/dependency, sequence and grid/story layouts support direction, spacing and section order. | Layout |
| F34 | Semantic constraints | Authors can request order, same-rank, relative placement, grouping and route style. Impossible hard constraints return named conflicts. | Layout |
| F35 | Readable wires | Orthogonal and curved routes avoid node interiors; labels reserve space; crowding and unresolved crossings are reported with affected IDs. | Layout |
| F36 | Routing control | Auto route, endpoint side preference, UI waypoints, route locking and reset-to-auto are supported; moving a node preserves or visibly invalidates manual intent. | Layout |
| F37 | Stable incremental changes | Unaffected sections retain positions/camera; layout runs asynchronously and obsolete results are discarded by revision/input hash. | Layout |

Perfectly crossing-free drawings cannot be guaranteed for arbitrary graphs. The contract is deterministic constraint handling, no silent violations, usable rerouting controls and visible warnings.

### F. Style, assets and reusable starting points

| ID | Required functionality | Observable acceptance condition | Owner |
|---|---|---|---|
| F38 | Themes and semantic styles | Light/dark themes, typography, spacing, role tokens and named accents resolve centrally; wire meaning is also encoded by labels/markers. | Presentation |
| F39 | Images, icons and fonts | Import local assets with alt text and provenance; content-addressed assets remain available offline and missing assets produce diagnostics. | Assets |
| F40 | Template library | Preview and instantiate versioned ER, module, SOP, mind-map, sequence and infographic templates; instantiation creates ordinary independently editable content. | Templates |
| F41 | Portable reusable styles | Save/apply theme and template versions. Existing collections retain their pinned versions until an explicit authoring upgrade. | Templates |

### G. Reading, export and delivery

| ID | Required functionality | Observable acceptance condition | Owner |
|---|---|---|---|
| F42 | Presentation/reading mode | Follow a collection’s ordered sections, collapse detail and reveal information without changing the stored diagram or moving the editing camera. | Canvas |
| F43 | Vector, raster and print export | Export selected section or whole collection to SVG, PNG and paginated PDF with fonts, labels and assets; output identifies the source revision. | Export |
| F44 | Editable portable bundle | Export/import a versioned bundle of semantic DSL, app-owned manual layout data, assets and pinned presets; import remaps identities and validates atomically. | Export |
| F45 | Agent inspection | Preview returns readable diagnostics, node/wire counts, collisions and an image at a named revision; agents can inspect outcomes without modifying state. | Authoring |
| F46 | Static sharing | Export a self-contained, offline read-only HTML collection with navigation and accessible outline. No hosted account/link service is implied. | Export |

### H. Reliability and product quality

| ID | Required functionality | Observable acceptance condition | Owner |
|---|---|---|---|
| F47 | Validated durable storage | Versioned JSON documents are stored transactionally; corrupt or newer schemas are rejected/quarantined with recovery guidance. | Persistence |
| F48 | Backup and restore | Consistent snapshot includes records, history, receipts, assets and pinned presets; restore validates before switching the active workspace. | Persistence |
| F49 | Explainable failures | Every boundary exposes typed errors with target IDs, user-readable explanation and next action; structured logs omit document content by default. | Authoring |
| F50 | Performance budgets | On a recorded reference machine, a 1,000-object/1,500-wire, 10-section fixture opens within 3s, incremental patch within 1s, navigation p95 frame time ≤33ms; no unexplained main-thread task over 100ms. | Canvas |
| F51 | Enforced architecture and standards | Every first-party code file has evidence of >144/160; Sonar cognitive complexity ≤2/function; forbidden imports and cycles fail CI. | Application composition |
| F52 | Meaningful correctness evidence | Acceptance scenarios, contract suites and selected visual/usability checks demonstrate intended behavior; coverage percentages alone never count as completion. | Application composition |

Performance measurement uses a release build, cold-process/warm-disk load, local assets, a declared machine/browser version and five runs. Record the median for open/patch and p95 for frame times during a fixed 30-second pan/zoom route. Budgets are release gates, not measured achievements of this document.

## Explicit boundaries

Excluded from this baseline: cloud accounts, permissions/multitenant hosting, simultaneous character-level collaboration/CRDTs, hosted sharing, arbitrary executable plugins, code execution from diagrams, automatic codebase synchronization, model training, built-in paid AI generation, animation/video editing and general numerical charting. Agents can interpret a repository and author its diagrams using the CLI. Nothing silently infers that an imported module diagram is synchronized with source code.

Existing diagrams may be discarded. Future **new-format** schema evolution, backup/restore and portable exports are included; migrating the inherited format is not.

## Completion demonstrations

1. **Dogfood the repository:** one collection contains the capability map, per-capability ER structures, typed module/function relationships with labelled import wires, and human/agent authoring flows. A reviewer can explain the ownership and write path from the canvas alone.
2. **Teach a process:** an agent authors the illustrated SOP in document 4 without coordinates, then edits one step while preserving a human’s arrangement.
3. **Mix representations:** reuse a module in a dependency view and a flow view; rename it once; verify both update while their positions remain independent.
4. **Prove the gate:** concurrent human and agent edits, retry after a lost response, invalid batch and restart during commit all produce the contractually correct result.
5. **Use it:** a human pans/zooms/selects/routes without unwanted camera movement, then exports readable vector and print artifacts.

Each scenario becomes a short human-readable acceptance contract before implementation. For TDD, first demonstrate a test failing for the intended reason, implement the smallest complete behavior, then refactor. Derive expected outcomes from these contracts, never by copying current output into assertions. Visual review and interactive usability remain necessary alongside automated tests.
