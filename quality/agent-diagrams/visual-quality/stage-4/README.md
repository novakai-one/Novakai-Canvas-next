# Stage 4 — engineering notation proof

Built on Stage 3 (PR #27); original source remains semantic DSL, no coordinates or diagram-specific renderer. Stage 4 adds canonical engineering kind headings, combined/composite key row badges and correct shared column measurement. Notation identity invalidates stale derived geometry. Canvas and export sequence layers use foreground paths and unstroked surface-backed labels.

## Accepted evidence

| Family | Observable result | Final artifact |
| --- | --- | --- |
| ER | Five actual tables; composite PK/FK, nullable Timestamp, optional/mandatory independent crow-foot ends and field anchors. | [ER](er-final.png) |
| Modules | Function signature and public interface members; labelled imports, implementation relation, external CMS boundary; independent frames/media. | [Modules](modules-final.png) |
| Sequence | Five participants, loop with nested alt, call/return/async, branch-local activations, crisp labels. | [Sequence](sequence-final.png) |
| State | Guard/effect transitions, retry return, cancellation, durable success/failure outcomes. | [State](state-final.png) |
| Tree | Uneven parent hierarchy, labelled dashed reference, explicit source-side control. | [Tree](tree-final.png) |

`*-browser-overview.png` establishes whole-graph canvas context; reading crops include module vendor boundary and sequence messages. The browser panel is only 618 px wide: fit overviews are not presented as readable body text. Toolbar/minimap occlusion is deferred UI scope and reading crops require panning. Full exports retain complete labels and geometry. All browser captures use the existing in-app tab; no external/headless browser launched.

Receipts and readouts record actual Authoring admission. The initial sequence draft rejected a duplicate branch/event identity; corrected DSL was admitted under a fresh request ID. The rejected source was never called a passing render. `provenance.json` records final revisions, source hashes, export hashes and engine identity. No hand-authored scene coordinates.

## Checks and bounded SOP

- Three new contract cases; existing nested-sequence native case reused. Presentation uses pinned real font bytes; Layout tree fixture uses synthetic deterministic metrics plus actual native engines.
- Existing Export case extends actual SVG assertions for foreground, unstroked labels and measured opaque backing. No E2E tests.
- Final typecheck, ESLint/Sonar≤2, formatting, import architecture, tokens and web build pass. Full suite 191 tests / 65 files, 16.71 s. Web build retains existing bundle-size advisory.
- One pressure review, verified fix once. Six-doc baseline 1810 words / 155 lines; final 1865 words / 157 lines (+3.1%/+1.3%).
- One A1, one A2, bounded eight minutes; one verified findings fix, no re-audit. A1 five samples 148–153/160. Final source-manifest/source-scores identify independent versus builder reviews; twelve changed TS/TSX files all ≥148. Mechanical gates alone do not award scores.

## Continuing work

Stage 5 finishes three visually distinct original examples per eight families, mixed-family collection, final live edit/reload/restart/export and all-example acceptance. These five proofs and green tests do not establish completion of the overall 24-example goal. Approved visual references remain binding in the build docs.
