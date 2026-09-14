# Export A1 — implementation and standards audit

One bounded pass on `feat/export-capability`, 2026-09-12. Only the five targets below were audited. AGENTS.md, root CODING-STANDARDS.md, all five Export specifications, and the exact 16 anchors in docs/standards/CODING-STANDARDS.md were read. Collaborators were inspected only to establish target behavior/port consumption. No source changes, new tests, E2E, recursive agents, or second audit.

The >144/160 gate is met by manual and prepare; produce, PDF and compose fail it. The separate actual Sonar maximum is met by all five. Scores below use the original anchors, including fixed 7 for absent subtyping, 5 for local mutation, and no exemption for native adapters or composition. A score of 10 means no blemish found in this bounded inspection, not exhaustive proof.

## Findings

| Category | Target / evidence | Concrete finding |
|---|---|---|
| engineering violation | produce.ts:79–82; pdf.ts:22–26; contract/ports/formats.ts: RenderInput | E12 promises cancellation between asynchronous stages. The encoder receives no cancellation signal. Cancellation during font decoding cannot prevent subsequent PDF media conversion and page rendering; it is detected only after the entire encoder returns. The outer lifecycle still releases and returns cancellation. |
| engineering violation | produce.ts:21,26,80,102; contract/types.ts; contract/ports/encoding.ts | Chosen Dependencies includes Documents and Resources that this flow never consumes; Encoding uses only hash (1/5). An injected FormatHandler receives RenderInput, not these ports, so it cannot make the unused dependencies count as pass-through consumption. ISP ports score Documents 0, Resources 0, Encoding 0, Snapshots 10, Formats 10; arithmetic mean 4. |
| engineering violation | pdf.ts:16,22–26,91; contract/render-types.ts | RenderDependencies carries Encoding, with zero of its five methods used. Renderer, Fonts and Media each use their one method. Combined ISP is capped at 5 because one port is below 30%. |
| engineering violation | prepare.ts:17,35,50,63; inspect.ts/resources.ts supporting flow | Documents consumes parse/read but never print: 2/3 methods, ISP 5. Resource inspector uses 1/1 and Encoding uses all 5 through inspection/admission comparison, each 10. Combined arithmetic mean rounded down gives 8. |
| engineering violation | manual.ts:90–95 | restoreOrder(section, manual) executes the same complete order restoration three times while constructing one result. This is the SOP DRY repeated-idiom-in-3+-places anchor, score 5; it also adds one avoidable tracing blemish under KISS. |
| engineering violation | pdf.ts:51,59–61,70,96–112 | PDFKit is constructed directly and then mutated; chunks are locally pushed. Local mutable document/buffer state scores Immutability 5, not 10. Concrete construction prevents replacing the native implementation with a fake and invokes the literal DIP concrete-infrastructure anchor. |
| engineering violation | produce.ts:29–30,52–82; prepare.ts:19–67; manual.ts:69–103; pdf.ts:22–26,70–112; compose.ts:43–82 | Owned workflow steps are fixed in the file. Injected collaborators do not constitute a step seam. OCP is capped at 6 for every target; composition also fixes concrete collaborator selection. This is a standards gap, not a request to add speculative mechanisms. |
| engineering violation | produce.ts:26; prepare.ts:19,35,50; pdf.ts:22–24 | Each target can propagate a rejecting/throwing provider despite its Result return. Public createExport → protect catches these failures (api.ts: createExport; outcomes.ts: protect), and the specification names the boundary. Typed-error score therefore 8 rather than 10; PDF's inner native failures are caught, but its decoder/converter calls precede that catch. |
| engineering violation | compose.ts:33–38; resvg-wasm index.mjs:547–553 | initializeRaster depends on module-global initialization: a second call after success fails as already initialized. The target chooses a stateful singleton dependency. Retry behavior changes across calls; no target-owned mutation is inferred from the dependency's private implementation for Immutability. Recovery is explicitly documented as fresh host instance. |
| minor | produce.ts:18–23; manual.ts:8–10,36–37; pdf.ts:14–21 | These entry-point comments do not name their recovery owner/path; retry-safe behavior and host ownership exist in api.ts/specs. Under the named-entry-point rule, score Idempotency 8. prepare.ts:14 explicitly names Authoring and its atomic admission responsibility. |

Worst three: missing between-stage cancellation, unused Dependencies ports in produce, and the concrete/native mutation and testability limits in pdf. No preference findings or independently established major build risk were found.

## Per-file scores

Line references in each table refer to that target unless another file is named. OCP docks apply independently of YAGNI. Port consumption includes direct collaborators. Type safety counts only target-owned casts/any; `as const` in produce is checked literal narrowing, not an unchecked domain cast. No Law of Demeter dock is applied to PDFKit fluent methods returning the same direct collaborator.

### core/artifacts/produce.ts

| # / principle | Score | Evidence against original anchor |
|---|---:|---|
| 1 SRP | 10 | 19–31,85–105: one retained-revision artifact production responsibility. |
| 2 OCP | 6 | 29–30,52–82: handler injected, pipeline/validation steps fixed. |
| 3 LSP | 7 | 19–23: no subtype implementation defined here; not demonstrated. |
| 4 ISP | 4 | 21,26,80,102: five selected role ports score 0/0/0/10/10 as detailed above. |
| 5 DIP | 10 | 1–10: core imports own declarations/core and injected owned ports only. |
| 6 DRY | 9 | 138–145 and direct native PNG collaborator rasterize repeat exact 8192/64000000 policy; one duplicated policy blemish. |
| 7 KISS | 10 | 24–31,34–37: direct staged Result flow; no tricky return assembly. |
| 8 YAGNI | 10 | 11–17,107–159: five required formats and specified allocation gates only. |
| 9 Typed errors | 8 | 26 can reject; named api.ts createExport/protect boundary catches it. |
| 10 Idempotency | 8 | 18–31 safe read/release; entry comment omits host recovery owner (documented elsewhere). |
| 11 Deep module | 10 | 19–31 hides identity, scope, limits, hashing and cleanup handling. |
| 12 Demeter | 10 | 26,80,102: direct injected roles and record access, no service navigation. |
| 13 Immutability | 10 | 95–105 copies records and bytes; no target local or cross-call mutation. |
| 14 Type safety | 10 | 1–174: no any or unchecked cast; literal descriptor narrowing at17. |
| 15 Cognitive | 10 | 1–174: no SOP named clever idiom; ordinary guard clauses. |
| 16 Testability | 10 | 20–22: snapshot, formats, codecs and signal explicit; no ambient I/O. |

Total: **142/160 — fails >144**.

### core/bundles/manual.ts

| # / principle | Score | Evidence against original anchor |
|---|---:|---|
| 1 SRP | 10 | 9–10,37–46: capture/restore portable manual state, one policy. |
| 2 OCP | 6 | 69–103 fixed validation/overlay steps; no step seam. |
| 3 LSP | 7 | 9,37 pure functions define no subtype; not demonstrated. |
| 4 ISP | 10 | 1–7,37: data inputs and two directly consumed order functions; no broad service port. |
| 5 DIP | 10 | 1–6 own declarations/core only, no framework. |
| 6 DRY | 5 | 90,91,95 repeats complete restoreOrder invocation three times. |
| 7 KISS | 9 | 89–103 requires recognizing that three full restores feed one assembly; one blemish. |
| 8 YAGNI | 10 | 13–24,109–117 capture only required order/geometry/attachment fields. |
| 9 Typed errors | 10 | 37–59 target errors use Result; pure trusted-record capture has no supported failure. |
| 10 Idempotency | 8 | 36–46 pure retry-safe overlay; entry comment does not identify recovery path/owner. |
| 11 Deep module | 10 | 9,37 hide addressing, ordering and override assembly. |
| 12 Demeter | 10 | 40–44,67–83 record reads only; no service chain. |
| 13 Immutability | 10 | 40–46,89–105,116 copy transforms; no target mutation. Order collaborator's local sort is not charged to this target. |
| 14 Type safety | 10 | 1–118 no casts/any; unknown overlay intentionally revalidated by Documents. |
| 15 Cognitive | 10 | 23,88,104 simple guard/return spreads, no conditional spread or nested ternary. |
| 16 Testability | 10 | 9,37 pure record inputs; no infrastructure. |

Total: **145/160 — passes >144**.

### core/bundles/prepare.ts

| # / principle | Score | Evidence against original anchor |
|---|---:|---|
| 1 SRP | 10 | 15–27 preparation of one new collection namespace. |
| 2 OCP | 6 | 19–67 fixed inspect/parse/restore/revalidate steps. |
| 3 LSP | 7 | 15–18 defines no subtype; not demonstrated. |
| 4 ISP | 8 | Documents 2/3=5; Resources 1/1=10; Encoding 5/5=10 through inspection; mean rounded down. |
| 5 DIP | 10 | 1–13 own core/declarations, owned injected consumer roles. |
| 6 DRY | 10 | 35,48,63 distinct semantic stages, not duplicated knowledge. |
| 7 KISS | 10 | 19–27,35–39,48–52 ordered early-return stages. |
| 8 YAGNI | 10 | 21–26,63–76 only distinct namespace with absent precondition. |
| 9 Typed errors | 8 | 19,35,50 can propagate provider/JSON exceptions; named public protect boundary exists. |
| 10 Idempotency | 10 | 14 names Authoring collision/atomic admission; 63–76 returns candidate without write. |
| 11 Deep module | 10 | 15–27 small request surface hides reconstruction/validation. |
| 12 Demeter | 10 | 35,50,63 direct Documents methods; data identity fields. |
| 13 Immutability | 10 | 63–76 copy namespace and return data; no mutation. |
| 14 Type safety | 10 | 1–78 no any/casts, read revalidates unknown overlay. |
| 15 Cognitive | 10 | 19–68 guard clauses only; none of SOP named idioms. |
| 16 Testability | 10 | 17,35,50 all behavior dependencies explicit and fakeable. |

Total: **149/160 — passes >144**.

### adapters/native/pdf.ts

| # / principle | Score | Evidence against original anchor |
|---|---:|---|
| 1 SRP | 10 | 15–138 encode one paginated vector PDF including its own footer. |
| 2 OCP | 6 | 22–26,70–112 fixed stages despite renderer/font/media slots. |
| 3 LSP | 9 | 19,28 supplies a real FormatHandler implementation; no silently unsupported format behavior observed, but shared identical contract-suite evidence is absent (one blemish, not automatic10). |
| 4 ISP | 5 | 16 RenderDependencies includes unused Encoding; other three roles fully consumed, cap5. |
| 5 DIP | 0 | 1–2,51 direct concrete native infrastructure construction alongside encoding behavior; no adapter exemption in SOP. |
| 6 DRY | 9 | 37 duplicates core page cap policy; one direct-collaborator policy duplication. |
| 7 KISS | 10 | 38–42,60–78 identifiable stream completion and error handling. |
| 8 YAGNI | 10 | 89–138 specified clipping, exact fonts/assets, metadata footer. |
| 9 Typed errors | 8 | 22–24 provider failures can reject before renderPdf catch; public protect boundary documented. |
| 10 Idempotency | 8 | 44–78 call-local buffered output; entry comment does not name host recovery. |
| 11 Deep module | 10 | 15–28 small encode contract hides document stream and page rendering. |
| 12 Demeter | 10 | 97–100,130–137 fluent same-document API, no returned collaborator internals. |
| 13 Immutability | 5 | 59–61 chunks.push and 70–112 mutable PDF document are local mutation. |
| 14 Type safety | 10 | 1–138 no own any/casts; dependency declarations not charged here. |
| 15 Cognitive | 10 | 1–138 no named SOP clever construct. |
| 16 Testability | 0 | 1–2,51,101 native PDFKit/SVGtoPDF cannot be substituted through this target's dependencies; real implementation required. |

Total: **120/160 — fails >144**.

### contract/compose.ts

| # / principle | Score | Evidence against original anchor |
|---|---:|---|
| 1 SRP | 10 | 33–83 concrete Export startup/binding responsibility. |
| 2 OCP | 6 | 43–82 fixed collaborators/steps; no injection seam for new composition stages. |
| 3 LSP | 9 | 68–82 implements actual handler objects; identical suite across implementations not demonstrated (one blemish). ExportOwners extends a declaration, not a behavioral inheritance claim. |
| 4 ISP | 10 | 43–58,67–82 consumes all Presentation slots/fonts and forwards Documents/Resources/Snapshots to service flows. |
| 5 DIP | 5 | 1–20 direct concrete imports rather than owned abstractions; composition is authorized by import matrix but receives no automatic10 in original anchors. |
| 6 DRY | 10 | 43–57 shared drawing/encoding dependencies assembled once. |
| 7 KISS | 10 | 43–58 direct bindings; inline SVG encoding is readily traceable. |
| 8 YAGNI | 10 | 68–82 exactly required five formats; no unused plugin mechanism. |
| 9 Typed errors | 8 | 70–75 SVG handler can propagate encoding/provider exceptions; named createExport/protect boundary handles them. initializeRaster catches directly. |
| 10 Idempotency | 5 | 33–38 wraps one-shot global initialization; repeated success call becomes failure. Recovery named, but retries are not safe by construction for this entry; no duplicate external effect asserted. |
| 11 Deep module | 10 | 42–58 hides concrete graph construction from host. |
| 12 Demeter | 10 | 43–57 public Presentation/data fields and direct factory collaborators. |
| 13 Immutability | 10 | 43–58,66–83 target uses const/copy and has no mutable state of its own. Resvg private singleton mutation does not become target-owned mutation. |
| 14 Type safety | 10 | 1–84 no any/unchecked casts. |
| 15 Cognitive | 10 | 33–83 no named clever constructs; spreads are unconditional. |
| 16 Testability | 0 | 1–20,35,43–82 concrete factories/runtime are fixed; owners alone cannot fake native startup/composition. |

Total: **133/160 — fails >144**.

## Functional compliance and verification limits

Confirmed by source: acquisition success reaches a single protected release attempt; primary failure survives cleanup failure; no artifact on cleanup failure; identity/scope/count/raster/page checks precede handlers; import requires distinct root namespace/revision0 and preserves local IDs through Model revalidation; unknown/duplicate manual targets reject; PDF clips each planned page and rejects warning callbacks; shared Presentation FontDefinitions/fonts are composed through the public seam. No target performs an authoritative write.

Actual ESLint/Sonar measurement used an in-memory threshold override of 0 to expose exact positive complexity values without changing repository rules. Maxima: produce2, manual2, prepare2, pdf2, compose1. The deliberate threshold-zero diagnostic command is a measurement, not a failing repository gate. Original max2 passes for all five targets. SOP principle15 was scored independently from Sonar.

This audit did not rerun the frozen 12 tests or audit their assertions (A2 owns that work), run a full repository build, inspect browser output, or verify native artifact visual fidelity. Shared-format LSP contract-suite evidence remains unverified. No existing test count was changed. The listed files' code was the unit of scoring; no collaborator was added as an audit target.
