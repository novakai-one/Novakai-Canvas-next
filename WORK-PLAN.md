# Canvas delivery ledger

User authorization (12 September 2026): finish the app autonomously, one capability at a time, with scoped reviews and a PR after each. Existing diagrams may be discarded. Source may be rewritten. Model's rewritten source and the Messaging conventions are the coding reference. No automatic merging or deployment was requested.

## Completion contract

Part 1: all twelve folders below implemented to the baseline feature scope, with their specification/build/audit/fix/PR evidence. Eleven domain capabilities plus Design System = twelve implementation capabilities; this preserves the baseline ownership boundary.

Part 2: implement the baseline UI/UX, tokens and React component tree. Every UI section receives its own visible-browser state audit, including expanded/collapsed sections, toggles, errors, drafts and relevant accessibility states. Headless runs do not verify human experience. No E2E test suites; operational browser verification is mandatory.

Final observable outcomes:
1. A diagram authored through the UI renders; dragged locations survive refresh and dev-server restart.
2. An agent authors a collection containing several diagram types via readable DSL, without coordinates or JSON.
3. A human keeps that diagram open while an agent edits it; notification, revision, draft/conflict and camera behaviour match the specs.
4. Mixed engineering diagrams include ER tables/cardinalities, modules/functions/interfaces, labelled connections; education/SOP/mind-map/infographic content is supported.

## Per-capability cycle

1. Read baseline functionality/ownership and exact example templates. Create `docs/specs/<capability>/` and mirror the five spec documents into the vault execution folder `260911-Canvas-Next/capability/<capability>/`.
2. Docs: explicit responsibility; target tree; entities/invariants with per-file LOC estimates; module contracts; CRUD ownership; build/test appendix. Add documents only when approval needs otherwise unplaceable material.
3. Record baseline words and lines. One fresh-context plan pressure tester, scope limited to this capability, maximum 8 minutes. Findings table categories: engineering violation / major build risk / preference / minor.
4. One fix round: findings presumed incorrect until independently verified. Total words AND lines may increase by at most 20%. No second plan audit.
5. Build against the accepted plan. Every named function has meaningful docs and explicit return type; domain names, typed outcomes, narrow seams, no clever expression compression. File-local standards evidence >144/160, Sonar <=2, import rules enforced. No speculative code, no placeholder production adapters. Freeze the exact justified contract-test budget first.
6. Two scoped implementation auditors, max 8 minutes each: A1 spec fidelity/coding standards; A2 assertion correctness (try up to three concrete counterexamples, report none honestly). At most five target files per auditor; collaborators read only within the capability. Sample roughly 10% of source files after the pattern is established. Do not audit unrelated capabilities.
7. One verified fix round limited to actual findings. Run relevant checks. No further audit loop.
8. Commit and open a distinct reviewable PR. Stack on the previous capability branch while its PR remains unmerged. Do not merge automatically. Preserve accurate base branches and describe dependencies.
9. Update this ledger/evidence, proceed to next capability. Do not mistake one PR or a green unit suite for overall completion.

## Part 1 order and status

| # | Capability | Responsibility | Status | PR |
|---|---|---|---|---|
| 1 | model | Diagram meaning, validity and immutable transition plans | Complete: 18 tests pass; both bounded rewrite audits found no verified issues | [#2](https://github.com/novakai-one/Novakai-Canvas-next/pull/2) |
| 2 | library | Catalog folders, collection membership/order/archive and discovery projections | Complete: specs/review/build/two audits; 8 tests pass | [#3](https://github.com/novakai-one/Novakai-Canvas-next/pull/3) |
| 3 | persistence | Atomic versioned storage, receipts, recovery and backups | Complete: specs/review/build/two audits and one verified fix;14 cases pass | [#4](https://github.com/novakai-one/Novakai-Canvas-next/pull/4) |
| 4 | assets | Safe immutable media admission, identity and resolution | Complete: specs/review/build/two audits/verified fixes;10 cases pass | [#5](https://github.com/novakai-one/Novakai-Canvas-next/pull/5) |
| 5 | templates | Versioned recipes/themes and independent editable expansion | Complete: specs/review/build/two audits/verified fixes;8 cases pass | [#6](https://github.com/novakai-one/Novakai-Canvas-next/pull/6) |
| 6 | presentation | Accessible visual content, notation and measurement/render parity | Complete: specs/review/build/two audits/verified fixes;10 cases pass | [#7](https://github.com/novakai-one/Novakai-Canvas-next/pull/7) |
| 7 | layout | Stable arrangement, routing and constraint feasibility | Complete: specs/review/build/two bounded audits/one verified fix;12 cases pass | [#8](https://github.com/novakai-one/Novakai-Canvas-next/pull/8) |
| 8 | authoring | Sole admission/preview/commit gate, concurrency, history and retries | Complete: specs/plan review/build/two bounded audits/one verified fix;14 cases pass | [#9](https://github.com/novakai-one/Novakai-Canvas-next/pull/9) |
| 9 | language | Readable DSL parse/print/lower and semantic editing | Complete: specs/plan review/build/two bounded audits/sole verified lexer fix;18 cases pass; PR opening | |
| 10 | design-system | Shared tokens, theme resolution and reusable React primitives | Pending | |
| 11 | canvas | React Flow scene interaction, camera, gestures and edit drafts | Pending | |
| 12 | export | Revision-consistent artifacts and validated import preparation | Pending | |

Order refines BUILD-ORDER.md: build resource, presentation and layout prerequisites before completing Authoring, so apply never relies on fake feasibility or admission providers. Public contracts allow incremental integration; each capability PR must honestly state current host integration coverage.

## Part 2 audit units

- Workspace navigation/open/create and library left panel, all folder/search/archive/recent states.
- Shared panel shell/header/body/sections, placement/reorder/collapse, resizing and keyboard focus.
- Inspector right panel for each selection/content/relationship/route state and multi-selection.
- Appearance/theme/accessibility/density preferences and token application.
- Canvas navigation, trackpad pan/pinch, click-drag, selection, groups, wire controls and overlays.
- Authoring editor/preview/errors, undo/redo, stale edits and recoverable drafts.
- Assets/templates/export/import/backup surfaces, including failures and progress.
- Final human+agent interoperability and persisted-location restart proof.

Use `docs/baseline/01-Functionality.md` as the complete F-numbered acceptance inventory. Use documents 02–06 as the ownership, tree, DSL, UX and token baseline. Record exact exercised states/screenshots in quality evidence; no blanket UI certification from a single screenshot.

## Resume protocol

Read this ledger and `git status`, inspect running auditors before starting replacements, and resume the first unfinished stage. Do not repeat completed reviews. Check PR state before creating another PR. Keep comments/progress concise. Long-running continuation should stay quiet when nothing changed and report meaningful milestones, failures or required decisions.
