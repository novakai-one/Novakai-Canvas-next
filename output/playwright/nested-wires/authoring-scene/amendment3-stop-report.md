# M10b Amendment 3 — split shipment blocked by extractor source review

Read the mission brief including Amendments 1–3. Branch remains `feat/m10b-dogfood`; intended PR base is `feat/m10a-label-honesty`.

## Current result

Fresh full `pnpm check` before edits: exit 0, 70 test files, **208/208 tests**. Typecheck, ESLint, formatting and architecture all passed. Test run started at local 11:04:44, duration 17.94 seconds on 2026-09-18. This first run was observed directly in tool output; its terminal stream was not saved as a file.

Removed the provisional `buildAuthoringScene` import and scene-switch entry from `roads-prototype.ts`; that file now matches HEAD. Added an explicit DARK-pending-M10f header to the offline builder and corrected its recovery-owner comment. No browser, server, capture, or port was used.

The previously outstanding extractor review is **126/160**, below the required >144/160. See [full evidence](amendment3-extractor-review.md). Even a generous upper-bound calculation is 138/160. Fixing it requires design decisions beyond the mechanical allowance. No further product changes, commit, push or PR were made after this finding.

## Amendment 3 split DoD

| Item | Status |
| --- | --- |
| Extractor + spec + manifest | Present; existing correctness evidence retained; source-score gate FAILED. |
| Empty-section support | Present; existing 146/160 review and baseline-identity evidence retained. |
| Full failure record | Preserved locally, including earlier STOP reports, scene, audits, crossing certificates and verifier outputs; not committed. |
| Authoring scene DARK | DONE: no UI import/switch entry; offline builder marked pending M10f. |
| Fresh full check before edits | PASS: 208/208, exit 0. |
| Check after dark-scene edits | PASS: 70 files, 208/208 tests, exit 0; see amendment3-pnpm-check-output.txt and amendment3-pnpm-check-exit.txt. |
| Commit + push + PR against feat/m10a-label-honesty | BLOCKED by source review; not performed. |
| Real-scene legality | Deferred to M10f under Amendment 3; known failure, not claimed accepted. |
| Captures, visual acceptance, five-load median and scaling acceptance | Not performed; illegal scene stays dark. |

Known routing record: 4 corridor / 40 node-body / 87 boundary witnesses, 18 overlap-detector witnesses, 0 continuity failures, and 0 of 1,273 crossings certified. Preserve the prior report's caveats about diagonal overlap witnesses and failed certificate construction. No rerouting or data tuning occurred.

**Scales or compounds? Undetermined: no performance acceptance is claimed for the illegal real scene.**

## HUMAN EXPERIENCE REVIEW

No captures or rendered output were presented. Attention, focus, clutter, readability and reference fidelity remain unassessed. Keeping the UI entry absent prevents the known-illegal scene being presented as an accepted result; historical JSON remains failure evidence only.

## STOP authority

The mission brief requires >144/160 review evidence for product source and explicitly includes the extractor. Its allowance covers only mechanically verifiable lint/typecheck/formatting/complexity failures in touched files. The user additionally directed “judgment calls STOP.” Dependency and error-boundary redesign requires judgment; the source-score gate was not waived by Amendment 3. This STOP is based on those explicit instructions, not an inferred skill approval requirement.
