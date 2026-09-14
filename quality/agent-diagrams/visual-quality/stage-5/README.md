# Stage 5 — original diagram breadth and final acceptance

**24 original standalone DSL diagrams, three per eight families, plus one 60-line mixed collection.** Each source is ≤300 lines; agent-owned meaning stays editable. All are admitted through the real CLI/Authoring path, displayed in the visible in-app browser, and exported by the real SVG and PNG encoders with pinned fonts and original assets.

[Visual gallery](GALLERY.md) · [Source index and local run instructions](../../../../resources/examples/showcase/README.md) · [Binding targets / original images](../../../../docs/agent-diagrams/visual-quality/References.md) · [Exact provenance](provenance.json)

## Three distinct structures per family

| Family | Batch 1 | Batch 2 | Batch 3 |
| --- | --- | --- | --- |
| ER | [er-museum-loans](final/er-museum-loans.png) (38 lines) | [er-course-enrollment](final/er-course-enrollment.png) (51 lines) | [er-habitat-survey](final/er-habitat-survey.png) (43 lines) |
| Modules | [modules-document-publishing](final/modules-document-publishing.png) (43 lines) | [modules-sensor-gateway](final/modules-sensor-gateway.png) (34 lines) | [modules-payroll-policy](final/modules-payroll-policy.png) (47 lines) |
| Flow/SOP | [flow-research-approval](final/flow-research-approval.png) (41 lines) | [flow-equipment-return](final/flow-equipment-return.png) (20 lines) | [flow-emergency-dispatch](final/flow-emergency-dispatch.png) (29 lines) |
| Sequence | [sequence-payment-settlement](final/sequence-payment-settlement.png) (29 lines) | [sequence-library-reservation](final/sequence-library-reservation.png) (25 lines) | [sequence-incident-notification](final/sequence-incident-notification.png) (26 lines) |
| State | [state-batch-job](final/state-batch-job.png) (36 lines) | [state-exhibition-lifecycle](final/state-exhibition-lifecycle.png) (31 lines) | [state-membership-reinstatement](final/state-membership-reinstatement.png) (34 lines) |
| Tree/mindmap | [tree-field-research](final/tree-field-research.png) (29 lines) | [tree-course-objectives](final/tree-course-objectives.png) (27 lines) | [tree-incident-causes](final/tree-incident-causes.png) (29 lines) |
| Story/infographic | [story-water-treatment](final/story-water-treatment.png) (74 lines) | [story-evidence-lesson](final/story-evidence-lesson.png) (44 lines) | [story-safe-deployment](final/story-safe-deployment.png) (51 lines) |
| Grid/comparison | [grid-research-methods](final/grid-research-methods.png) (28 lines) | [grid-archive-comparison](final/grid-archive-comparison.png) (19 lines) | [grid-feedback-methods](final/grid-feedback-methods.png) (21 lines) |

The [mixed authoring collection](final/mixed-authoring-contract.png) places an explanatory agent/human flow and an engineering module/interface/function view together. Its typed commit boundary is drawn from the repo contracts; it does not invent direct cross-capability imports. The former 696-line all-in-one source is removed.

## Comparison with binding references

| Required quality | Final observable evidence |
| --- | --- |
| Headline and hierarchy | Collection/section titles, meaningful regions, engineering headings and short actor captions are distinct at reading scale. Every family has actual overview and detail captures. |
| Prominent imagery | Water barriers, evidence lesson, controlled deployment and feedback methods use original illustrations inside editable frame-free/media-first nodes. No whole-diagram poster or reference background. |
| Visible meaning | Water process and side streams, lesson evidence/conditions/transfer, deployment healthy/unsafe decisions and SOP loops have labelled paths. Research methods use one aligned comparison matrix. |
| Engineering detail | ER has composite PK/FK, nullable fields and independent crow-foot ends; modules show typed members/functions and labelled imports/implementation relations. Sequence supports nested loop/alt/opt, asynchronous messages, self-call and activations. State guards and hierarchy/reference wires retain meaning. |
| Routing | Measured text reserves corridors; explicit attachment sides and route intent remain semantic DSL. Shared scope contraction fixes before/rank placement around nested groups. Reciprocal vertical attachments no longer take wrong-axis hairpins. Policy 14 rejects stale derived geometry. |
| Reuse | No source IDs, subjects or reference-image coordinate maps in production changes. Figures, frames, nested composition and routes are reused across original subjects/families. |
| Delivery | All 25 final source/collection revisions, receipts, readouts, encoded artifact hashes and browser capture paths verified together in provenance.json. Every source also lowers to its recorded admitted collection (workflow/source-admission.json). Full exports inspected; live update/longer text/refresh/restart proof below. |

Benchmark equivalence means those transferable qualities, not identical logos, colors or designer-drawn pixels. The existing app UI still has toolbar/minimap occlusion in its narrow viewport; UI polish and panel redesign remain deferred. Fit overview is not claimed to make every word readable. Full exports and reading crops provide complete content plus legible detail.

## Live edit and durability

[Workflow record](workflow/README.md): semantic DSL patch grew a caption from 64 to 170 characters while the diagram stayed open. Revision 3 appeared without navigation or camera jump (73% unchanged). Refresh and owned-service restart retained the accepted collection and exact layout/projection/measurement hashes. Actual PNG and SVG bytes were identical before and after restart. Camera persistence through reload is not claimed.

## SOP, checks and corrections

- One bounded fresh plan pressure review; verified findings fixed once. Story connectivity and comparison alignment improved during actual DSL authoring.
- Two builder-discovered generic routing defects received independent red/green public-contract probes before fixes. Five production files changed; no UI code or global layout rewrite.
- One A1 and one A2, eight-minute bounds, five source files each. A1 had no blocking defect. A2 found erased-marker/frame false negatives and an unbounded return-axis predicate; all verified and fixed in one round. No re-audit. [Findings and dispositions](audits.md).
- Ten changed TS files score 146–157/160; source hashes distinguish independent reviews from root post-fix assessments. [Scores](source-scores.md), [manifest](source-manifest.json).
- Full typecheck, ESLint/Sonar≤2, formatting, import architecture and 195 tests /69 files pass (16.20s suite). Tokens and web build pass; existing bundle-size advisory remains. Four new cases; no E2E tests. [Verification](verification.md).
- Six-doc baseline 1953 words /163 lines; final 2287 /192 (+17.1% words, +17.8% lines). Original baseline retained; no second pressure review. [Counts](spec-final-counts.json).

Earlier iterative captures at this directory root are explicitly before/first attempts, not final acceptance. Rejected request receipts remain labelled rejected; only committed final receipts appear in provenance.json. Compressed input recordings came from the live service and are revalidated by public readers in the Export case; no authored JSON geometry.

## Review stack

[Stage 1 PR25](https://github.com/novakai-one/Novakai-Canvas-next/pull/25) → [Stage 2 PR26](https://github.com/novakai-one/Novakai-Canvas-next/pull/26) → [Stage 3 PR27](https://github.com/novakai-one/Novakai-Canvas-next/pull/27) → [Stage 4 PR28](https://github.com/novakai-one/Novakai-Canvas-next/pull/28) → final Stage5 branch `feat/visual-quality-stage-5`. PRs remain separate and unmerged for manageable review.
