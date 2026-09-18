# Increment B — run 2, STOP on cyclic admission

**B remains incomplete.** Amendment 1's grow-only and track-unity corrections are implemented in the read-only support compiler, but completing coverage of retained gate contacts produces the typed public result **`infeasible-embedding / cyclic-constraints`** on authoring. The ratified admission rule rejects residual cycles. Implementation stopped before materialization, builder integration, or final projection. C/D were not started.

This is an **admission-regime rejection, not a proof of mathematical unsatisfiability**: the independently extracted first cycle has total required separation zero. Neither grow-only nor track unity was loosened. No scene-legality claim is made.

Base: `c398a8e` on `feat/m10f3-embedding`; [run-1 report](increment-b-run-1-report.md) is preserved. The external B brief, its Amendment 1, the ratified design and A report were read. Work was headless; no browser, server, protected port, or subagent was used.

## Implemented scope

Three product files changed, nine added/two removed lines:

- `nested-support-graph.ts`: every structural separation retains at least its old distance, so free-track/padding floors cannot contract under relaxation.
- `nested-support-structure.ts`: explicit old-width/old-height section relations; semantic row/column anchors equated with all their node centers. The maximum predecessor requirement moves an entire shared track.
- `nested-support-mouths.ts`: the existing mouth constraints cover **every retained section gate**, including unused driveways. No gate choice, request, demand, rank, pitch, fixture, projector, or certifier changes. Ledger G now counts all constrained section mouths, rather than only used mouths.

Covering unused mouths is needed by B's “all intended contacts retained” obligation. A's contact list includes those roads, but its mouth constraints covered only used gates. Keeping the old coverage and applying Amendment 1 yields a DAG and satisfies every recorded inequality, yet **17 driveway centers fall outside the longitudinal span of their registered street**. Six were already outside in A; eleven become outside in the numeric replay. These are contact-support diagnostics, **not body/boundary defect catalog counts**, and no geometry was emitted.

Example newly missed contact: `drive:section-3:entry-left` retains tangent center y=648 while its internal registered street's solved span becomes y=659..1151. The same issue affects `exit-right`. Independently moving unused driveways outside the solved constraints would leave their contact preservation unproved; applying the existing constraints to them instead exposes the cycle below.

## Typed failure and exact provenance

[Public result receipt](increment-b-amendment-stop.json) records two identical public preflights per scene. An observation-only bundle captures the graph immediately before admission, preserving the exact ordinary public result twice. Complete inputs/results/graphs are in `increment-b-{scene}-admission.json.gz`. Failed public results do **not** publish partial success ledgers.

[Independent numeric replay and cycle receipt](increment-b-amendment-replay.json) extracts this authoring cycle:

| Constraint | Kind | Relation | Required | Old available | Producing provenance |
| --- | --- | --- | ---: | ---: | --- |
| `constraint:3666` | gate-tangent | street-end E → gate-center G | 0 | -24 | `section-7:entry-left`, `section-7:vertical:1616:1792` |
| `constraint:3667` | gate-tangent | gate-center G → street-end E | 0 | 24 | same |

Section 7 is a preserved empty leaf: bounds `(1552,1680,128,176)`. Its merged vertical frame street is a 12×12 undemanded road centered at `(1616,1792)`; its start/end construction anchors collapse onto the same y-line E=1792. The unused left gate has G=1768. The full six-unit half-bundle erodes the street's y interval `[1786,1798]` to the singleton `[1792,1792]`. The two constraints therefore require **G=E**. Their sum is zero; they do not establish a positive-cycle contradiction.

Current admission collapses construction equalities only when old positions already match, then rejects all residual directed cycles. This gate/line pair starts 24 units apart. Treating a forced singleton interval as a movable equality group, changing residual-cycle admission, splitting the merged empty-leaf street, or omitting its unused contact would change the accepted admission/topology policy. No such change was made after the unexpected typed failure. The next decision concerns this admission case, **not permission to shrink sections or split grid tracks**.

The six baseline missed centers belong to the left/right unused mouths of empty Sections 7, 10, and 11. The receipt records every baseline/new contact identity. The extracted cycle is the first deterministic cycle, not a claim to enumerate every cycle or prove feasibility of the entire rejected graph.

## Admission, numeric replay and bytes

| Scene | V / E after full mouth coverage | Admission | Numeric moved anchors | Section shrinks / split tracks | Ordinary builds twice equal A | Bytes |
| --- | ---: | --- | ---: | --- | --- | ---: |
| default | 85 / 715 | admitted | 0 | 0 / 0 | yes | 649,257 |
| hub | 87 / 881 | admitted | 0 | 0 / 0 | yes | 713,191 |
| templates | 147 / 1,381 | admitted | 60 | 0 / 0 | yes | 764,731 |
| scale | 222 / 2,019 | admitted | 88 | 0 / 0 | yes | 1,462,875 |
| authoring | 263 / 3,942 | **typed rejection** | unavailable for full graph | unavailable for full graph | yes | 1,953,839 |

Independent longest-path replays satisfy every relation for the four admitted fixtures and reproduce twice. Both default/hub positions remain unchanged. Node track equality is checked through semantic track aliases; section extents retain their old lower bounds. **These are scalar prerequisite checks, not active embedding builds.** All five ordinary builder serializations also reproduce twice and match A's SHA-256 receipts. The product scene builder is unchanged.

## Catalog transitions and remaining defects

| Catalog | Accepted A before | Active-B after |
| --- | ---: | --- |
| Bodies | 40 | not measured; no candidate |
| Boundary segments | 87 | not measured; no candidate |
| Overlap reports | 18 | not measured; no candidate |
| Reversed | 28 | not measured; no candidate |
| Gate omissions | 96 | not measured; no candidate |
| Uncertified | 1,273 | not measured; no candidate |

No catalog transition is claimed. Ordinary scene byte equality is fresh evidence of preservation, but does not substitute for catalog measurements with an active embedding. Remaining defects include all six catalog populations, the two retained C1 diagonals, six unsupported authoring adjustments, the unused-mouth contact-support gaps, and this newly surfaced cyclic-admission case. Templates/scale have no materialized candidates and no new certificate/crossing proof. The scene is still not claimed legal.

## Operations

The unchanged builder's retained A table is shown separately from the freshly measured support query. Builder figures and doubled growth below are **retained measurements, not fresh active-B measurements**.

| Scene | A compile | A routing | A discovery | A doubled growth | Active-B compile/routing/discovery/growth |
| --- | ---: | ---: | ---: | ---: | --- |
| default | 33,313 | 667 | 0 | 2.014184 | unavailable |
| hub | 48,070 | 992 | 0 | 2.024316 | unavailable |
| templates | 74,724 | 1,626 | 0 | 2.038129 | unavailable |
| scale | 104,617 | 2,088 | 0 | 2.024236 | unavailable |
| authoring | 280,075 | 6,140 | 0 | 2.038572 | unavailable |

[Fresh separate-query operation receipt](increment-b-preflight-operations.json), using A's unchanged AST counting transform and stop-aware result reporting:

| Scene | A separate preflight | B separate preflight | Delta | Reservation replay | Path/fan/turn support | Other support/admission |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| default | 18,257 | 19,223 | +966 | 9,756 | 2,100 | 7,367 |
| hub | 23,329 | 24,065 | +736 | 12,194 | 3,366 | 8,505 |
| templates | 34,841 | 36,707 | +1,866 | 18,830 | 5,328 | 12,549 |
| scale | 51,486 | 53,782 | +2,296 | 26,609 | 7,894 | 19,279 |
| authoring | 126,985 | 128,772 | +1,787 | 73,674 | 24,438 | 30,660 |

Authoring's cost ends in **rejection**, not successful embedding; it omits the successful ledger-assembly tail. Instrumented public results equal ordinary results, and full cost records reproduce twice. Routing/reservation and path costs remain unchanged in this separate query. No active-B material-regression or doubled-scene growth gate is claimed; costs of an unimplemented materializer cannot be inferred from this table. The query is not added to the ordinary builder.

## HUMAN EXPERIENCE REVIEW

No geometry candidate reached rendering. There are no new BEFORE/AFTER captures, pixelmatch statistics, or visual acceptance claims. No camera or roads toggle was exercised and no approved reference was changed. Attention and composition cannot be assessed from scalar anchor motion. The numeric track-unity and grow-only checks resolve run-1's recorded contradiction on admitted fixtures; the missing unused contacts/cyclic admission prevent a coherent all-contact rendering claim on authoring.

## Checks, review and binary DoD status

[Diff-scope source reviews](increment-b-source-review.md) record all sixteen anchors for each of the three changed product files, **149–150/160**, strictly above 144. [Run-2 pnpm check](increment-b-run-2-pnpm-check.txt) records exit 0, **70/70 files, 208/208 tests**, including typecheck, Sonar <=2 lint, formatting and architecture. Green repository checks do not turn the typed preflight rejection into a pass.

| B obligation | Status |
| --- | --- |
| Active authoring embedding twice; all constraints, contacts and semantics | **Incomplete — typed admission STOP** |
| Fresh real-scene catalog transitions; no regression | Not run; no active candidate |
| default/hub active-byte identity; templates/scale proof obligations | Ordinary identity and scalar prerequisites only; active gates incomplete |
| Full active before/after ops and doubled growth <=2.5 | Separate preflight accounted; active builder unavailable |
| Two complete active builds per scene | Not run; ordinary builds only |
| pnpm check 208/208; source review >144/160 | Passed for this partial tree |
| Headless same-camera captures, pixelmatch, human review | Not run; no candidate; limitations recorded above |
| Report and remaining-defect list | Delivered as stop evidence |
| Commit/push and PR against feat/m10f-ownership | Delivery uses existing PR #73 for this branch |
| Stop after B; no C/D | Observed; B itself is not complete |

Reproduce the stop diagnostics without a server:

```sh
node --import tsx output/playwright/nested-wires/embedding/probe-increment-b-amendment.mjs
python3 output/playwright/nested-wires/embedding/replay-increment-b-amendment.py
node --import tsx output/playwright/nested-wires/embedding/count-increment-b-preflight-operations.mjs
pnpm check
```

The diagnostic scripts exit 0 when the **STOP evidence** reproduces, not when B's DoD passes. The Python used-mouth-only replay is explicitly a diagnostic counterfactual explaining the coverage gap; it neither changes product policy nor materializes a candidate. A's and run-1's old probes belong to their recorded commits and are not relabeled as passing on the changed support compiler. **STOP.**
