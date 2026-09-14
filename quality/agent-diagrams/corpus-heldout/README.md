# Held-out C corpus

Base: `5049cae40c932edc98aa9e7d09420a6ea277b5e8`. Started 2026-09-12 11:50:09 UTC. Authoring scope: exactly eight new showcase sources; evidence only under this directory. No earlier conversation, subagents, audits, application source edits, E2E tests, push or PR. Existing sixteen sources and existing SVG assets are unchanged.

Audience: readers tracing engineering relationships and comparing evidence. These are illustrative domain models, not claims about an existing payroll system, emergency service or water plant. Delivery is editable DSL; final browser proof belongs to the orchestrator after layout/routing integration.

## Sources and structural distinction

| Source / collection ID | Nodes | Distinct content and structure |
|---|---:|---|
| [er-habitat-survey](../../../resources/examples/showcase/er-habitat-survey.canvas) | 5 | Nullable parent FK closes a self relation; visits, observers and species converge on observations. PK, FK and unique constraints; explicit crow-foot cardinalities. |
| [modules-payroll-policy](../../../resources/examples/showcase/modules-payroll-policy.canvas) | 7 | Two policy interfaces and four functions: calculator calls three implementations; three module port imports. Separate rule-contract and pure-calculation groups. |
| [flow-emergency-dispatch](../../../resources/examples/showcase/flow-emergency-dispatch.canvas) | 10 | Three decisions, local and mutual-aid convergence, and three terminal branches. A terminal dispatch workflow can retain an unresolved incident with a supervisor. |
| [sequence-incident-notification](../../../resources/examples/showcase/sequence-incident-notification.canvas) | 5 | Five participants; two opt fragments and two self calls. No alt or loop reuse. Edit cancels outstanding escalation after ownership is recorded. |
| [state-membership-reinstatement](../../../resources/examples/showcase/state-membership-reinstatement.canvas) | 7 | Review can return to suspended, grant monitored reinstatement, or return to active; reinstatement can relapse. Closure is reachable from pending or suspended. |
| [tree-incident-causes](../../../resources/examples/showcase/tree-incident-causes.canvas) | 11 | Four root branches at unequal depths (1, 2, 2 and 4); capacity also splits internally. Hypotheses explicitly distinguished from established causes. |
| [story-water-treatment](../../../resources/examples/showcase/story-water-treatment.canvas) | 8 | Five numbered treatment stages with three sidebars. A two-column stage group sits beside monitoring/residuals, with supply/limits below. Three existing reusable SVG icons remain referenced. |
| [grid-research-methods](../../../resources/examples/showcase/grid-research-methods.canvas) | 7 | Three primary-evidence tables in a two-column group beside an unequal synthesis/checks column, followed by claim/triangulation notes. Shared dimensions compare questions, evidence records and limits. |

Node counts describe original showcase sources. The incident tree edit raises its count from 11 to 12. Semantic wires are all labelled; sequence uses labelled ordered events. Story/grid have no invented semantic wires. No authored placement coordinates or raw JSON diagram mutations.

## Public results and exact receipts

All eight parse, lower through public Language, validate through public Model and print successfully. `public-validation.json` records source SHA-256 and actual SVG byte hashes. For the illustrated story, resolved image metadata is supplied only to pure validation; this is not asset staging, storage admission or a rendering pass. Theme metadata comes from the actual isolated workspace.

| Collection | Create receipt / workspace sequence | Edit receipt / sequence | Current revision |
|---|---|---|---|
| er-habitat-survey | `heldout-create-er-habitat-survey` / 2 | `heldout-edit-er-habitat-survey` / 8 | 1 |
| modules-payroll-policy | No committed receipt: Native routing constraint-conflict | Deferred: create not admitted | None |
| flow-emergency-dispatch | `heldout-create-flow-emergency-dispatch` / 3 | `heldout-edit-flow-emergency-dispatch` / 9 | 1 |
| sequence-incident-notification | `heldout-create-sequence-incident-notification` / 4 | `heldout-edit-sequence-incident-notification` / 13 | 1 |
| state-membership-reinstatement | `heldout-create-state-membership-reinstatement` / 5 | `heldout-edit-state-membership-reinstatement` / 10 | 1 |
| tree-incident-causes | `heldout-create-tree-incident-causes` / 6 | `heldout-edit-tree-incident-causes` / 11 | 1 |
| story-water-treatment | No committed receipt: Asset has not been admitted (PR3) | Deferred: create not admitted | None |
| grid-research-methods | `heldout-create-grid-research-methods` / 7 | `heldout-edit-grid-research-methods` / 12 | 1 |

Full `*-receipt.json` and `*-edit-receipt.json` preserve fingerprints, transactions, versions, immutable pins and warnings. Original showcase sources correspond to create revision 0. `*-readout.canvas` is CLI canonical revision 0; `*-after-edit.canvas` is CLI canonical revision 1. `*-pure-readout.canvas` is a pure Language print and must not be described as a committed readout. Failed examples have only pure readouts.

Meaningful patches: observation method field; dispatch handover evidence; independent membership reviewer guard/effect; an additional detection-cause branch; research triangulation checks; and a sequence event cancelling pager escalation. Their exact source is in `*-edit.patch`. No patch was submitted to a nonexistent payroll/story collection.

Payroll failure is preserved without deleting dependencies or changing application policy: `constraint-conflict: Native route violates required ports, marker clearance or obstacles`. Story preserves all images and its composition: `invariant-violation: 3:2 Asset has not been admitted`. Both create receipt lookups returned no committed receipt.

## Geometry and remaining visual gates

The six current revision-1 renders were fetched from the isolated service. Public Layout `readScene` re-admitted each using public Presentation `readMeasuredProjection` bound to Model `validate`, public `readMeasuredContent`, and `defaultEngineVersions`. All six succeed; see `scene-inspection.json`. This is the public scene admission/inspection path, not a separate direct `Layout.inspect` invocation or a browser audit.

| Collection | Bounds (world units) | Ideal fit scale | Smallest effective text | Crossing warnings |
|---|---:|---:|---:|---:|
| er-habitat-survey | 1739.9 x 1501.5 | 0.733 | 11.7px | 1 |
| flow-emergency-dispatch | 1068.1 x 2533.0 | 0.434 | 6.9px | 0 |
| grid-research-methods | 1344.0 x 1208.0 | 0.911 | 14.6px | 0 |
| sequence-incident-notification | 1536.0 x 2145.0 | 0.513 | 8.2px | 0 |
| state-membership-reinstatement | 4329.5 x 1339.6 | 0.370 | 5.9px | 15 |
| tree-incident-causes | 2407.3 x 1620.0 | 0.665 | 10.6px | 0 |

Estimates use `min(1600 / width, 1100 / height)` and the smallest actual text primitive size, before shell chrome or margins; they are an optimistic bound, not observed camera zoom. Five of six miss the >=12px fit-all target even at this optimistic bound. Grid clears that numeric estimate only. No browser capture, observed zoom, clipping/readability pass, marker appearance verification or final collection acceptance is claimed. Layout/routing and visible proof remain the orchestrator's gates.

The SVG sources are existing `assets/water.svg`, `assets/evidence.svg`, and `assets/shield.svg`, referenced as individual reusable icons, never whole-diagram backgrounds. No reference images were viewed or copied.

## Execution and reproducibility

Budget: zero new automated tests; bounded DSL dogfooding and public-contract checks only. No code standards score is claimed for this artifact-only change.

```sh
pnpm dev --port 5180 --workspace .local/workspace-corpus-heldout
pnpm canvas create resources/examples/showcase/er-habitat-survey.canvas --server http://127.0.0.1:5180 --workspace .local/workspace-corpus-heldout --request heldout-create-er-habitat-survey
pnpm canvas read er-habitat-survey --server http://127.0.0.1:5180 --workspace .local/workspace-corpus-heldout
pnpm canvas patch quality/agent-diagrams/corpus-heldout/er-habitat-survey-edit.patch --revision 0 --server http://127.0.0.1:5180 --workspace .local/workspace-corpus-heldout --request heldout-edit-er-habitat-survey
```

Exact per-example commands and outcomes are retained in `create-results.json`, `edit-results.json` and CLI transcripts. Compressed `*-render.json.gz` retain actual render envelopes; `workspace-initial.json.gz` and `workspace-final.json.gz` retain read-only snapshots at sequences 7 and 13. These JSON artifacts are generated evidence, never authored mutation payloads. Credentials are excluded.

Execution deviation: the first CLI invocation omitted `--server`, reached the default URL and returned `unauthorized` before successful workspace access. It made no authorized mutation. The exact transcript is `initial-cli-default-url-failure.txt`. Every subsequent CLI/API request explicitly targeted the owned port 5180; no shared server was modified.

Temporary validation scripts imported public `contract/index.ts` entry points only. Initial scene-check harness calls bound the Presentation reader incorrectly and returned provider-failed; fixing the caller binding produced the recorded successful final checks without changing source/application policy. Temporary scripts are not shipped as application code.

Diagram skill deviation: independent audit omitted — user expressly prohibited audits and other agents. This removes an independent defect-detection step and reduces quality assurance; diagram quality may be lower. Browser review was expressly assigned to the orchestrator.

Owned service closed cleanly with SIGINT; port 5180 checked closed. See `shutdown.json`.
