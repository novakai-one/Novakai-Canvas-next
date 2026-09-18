# M10a — Amendment 14 acceptance report

**PASS.** The approved uniform LOD rule now consumes the design-system token constant. Fresh headless probes pass, fresh full `pnpm check` exits 0 with **70 files / 208 tests**, and all product review units exceed 144/160. Read the full brief including Amendments 1–14. Work stayed in this worktree, with no subagents and no server starts/stops/restarts.

## Implementation and scope

`zoomTypeMinimum` is a static export of `definitions.zoomType.minimum.$value` through the design-system public contract, following the existing static wire-token pattern. RoadPrototype decides `zoom >= zoomTypeMinimum ? '1' : '0'`; there is **no getComputedStyle call or other DOM style read for LOD**. The CSS property remains published as **0.9**. No density/theme override exists, so no density map is needed.

The accumulated milestone strips trailing .ts only from displayed node headings, shortens section headings/tabs to their leaf, preserves full source names in DOM tooltips/detail data, and leaves wire text unchanged. Shared SVG text uses the approved short display text without an added nested title. Scene geometry and semantic authoring are unchanged. Section headings use the centralized 1.35 ratio token.

## Fresh verification

- `pnpm install`: already up to date, no dependency/lockfile changes.
- [Full pnpm check log](pnpm-check-amendment-14.txt): exit 0, **208/208**; typecheck, eslint including cognitive complexity <=2, formatting and architecture all pass.
- `pnpm tokens:check`: exit 0; all generated token artifacts match the source.
- `git diff --check`: pass.
- [Product source review](source-review.md): **145–153/160** by the appropriate review unit. RoadPrototype's tracked whole-file baseline remains **121/160**, assigned to M10e, with [original anchors](source-review-run-14.md). CSS's below-bar baseline and its passing diff review are explicit. Evidence scripts are exempt from the numeric score under Amendment 12.
- [Existing headless probe](probe-browser.mjs) rerun against 5191/5196; [complete browser results](browser-gates.json). No test files or gates were changed.

| Requested zoom | Actual zoom | Visible nodes | Visible sections | Node .ts / section slash | Full node / section titles | Layout delta |
|---|---:|---:|---:|---:|---:|---:|
| fit | 0.40631653655074523 | 0/40 | 12/12 | 0 / 0 | 40 / 12 | 0 |
| 0.3 | 0.3 | 0/40 | 12/12 | 0 / 0 | 40 / 12 | 0 |
| 0.5 | 0.5 | 0/40 | 12/12 | 0 / 0 | 40 / 12 | 0 |
| 0.8 | 0.8 | 0/40 | 12/12 | 0 / 0 | 40 / 12 | 0 |
| 1.2 | 1.2 | 40/40 | 12/12 | 0 / 0 | 40 / 12 | 0 |

Selection also gives zero layout recalculations and identical scene bytes. Zero visible frame overflows, uniform visible node text height, no page errors. Scene BEFORE/AFTER bytes compare equal; SHA-256 **501d5062b554ca2a19b190b6e2124dbca57cff2f23bf6b9a800c9d9a9377040a**. The large raw scene files remain local beside this report; browser-gates.json records the comparison and interaction results.

At reading zoom, sections are **26.46px**, nodes **19.6px**: **1.35x**, above the specified heading/body >=1.3 strong-face floor. No header-height change or special camera adjustment was necessary.

## Fresh captures and pixel differences

1920x1440, dsf 1, Fit View, 600ms settle; reading pair then uses centered zoom 1.2 and 600ms settle. Pixelmatch threshold 0.1, includeAA false. Results exactly match the retained Amendment 7 capture-difference figures. No numeric pixel mismatch ceiling is specified.

| Pair | Changed pixels / 2,764,800 | Percent |
|---|---:|---:|
| [Idle before](m10a-before-idle.png) / [after](m10a-after-idle.png) | 15418 | 0.5577% |
| [Roads before](m10a-before-roads-on.png) / [after](m10a-after-roads-on.png) | 15291 | 0.5531% |
| [Reading before](m10a-before-mid-zoom.png) / [after](m10a-after-mid-zoom.png) | 11100 | 0.4015% |

[Full diff statistics](diff-stats.json). Fresh image inspection used the preserved AWS and Docker reference images plus the benchmark definitions in docs/maintenance/diagram-quality-improvements.md. Reference images were unchanged.

## HUMAN EXPERIENCE REVIEW

At fit, section names form the reading hierarchy and all node labels disappear together. At 1.2, section headings are visibly stronger than the actor names; all node labels return together without .ts clutter. Child headings and tabs omit repeated parent paths, while full names remain available in tooltips.

Visible labels stay contained and centered. The partially visible discovery title at the reading view's left edge is shared-camera viewport cropping, not label-frame overflow. Diagnostic road bands still compete with and overlap the lower contract-heading area. Sparse panels, uniform cards and long wire detours remain the previously recorded geometry/presentation limitations relative to the references; M10a does not claim to fix them or certify every broader benchmark. Their retained acceptance status is governed by Amendment 8, not by a newly invented waiver.

## Retained export and timing evidence

Under Amendments 8 and 14, export/timing evidence is retained, not presented as fresh. The final change replaces the threshold dependency with its same static token value; no timing harness or export path changed in this run. No new performance claim is made from removing the style read. Earlier harness refactors were semantics-preserving and their measurements remain historical.

[Accepted export comparison](accepted-export-comparison.json): modules-document-publishing, four wire labels byte-identical, node/section differences restricted to the sanctioned transformations, two AFTER exports byte-identical. The er-museum-loans corpus export attempt failed at baseline with encoding-failed — parked as a separate triage item, out of M10a scope.

[Timing raw pairs and summary](timing-summary.json): seven clean interleaved pairs, no discarded pairs, WindowServer **24.7–37.9%**. ChatGPT ambient helpers ignored per Amendment 6. BEFORE median **370ms**, AFTER **379.10000002384186ms**, change **+2.4595%**, maximum **388.5ms**: relative gate PASS. Absolute <=300ms: **false**.

| Pair | BEFORE ms | AFTER ms |
|---|---:|---:|
| 1 | 452.89999997615814 | 497.8000000715256 |
| 2 | 369.5 | 377.8000000715256 |
| 3 | 368.89999997615814 | 405.60000002384186 |
| 4 | 397.7999999523163 | 386.1999999284744 |
| 5 | 366.09999990463257 | 379.10000002384186 |
| 6 | 370.2000000476837 | 376.1999999284744 |
| 7 | 370 | 376.10000002384186 |

The PR includes the product diff, the 72-line reproducible browser probe, and selected acceptance evidence. Prior STOP reports, large raw scene/process dumps, and historical one-off scripts remain preserved locally to keep the review focused. Commit and PR identify the exact release revision.
