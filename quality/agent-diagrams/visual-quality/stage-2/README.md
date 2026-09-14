# Stage 2 — measured figures and framing

Status: implemented; bounded A1/A2 reviews and one verified fix round complete. Parent production/spec commit `5160d27` (PR25). This is an incremental composition result; Stage 3 owns routing and the first complete infographic benchmark.

| Proof | Evidence | Observable result |
| --- | --- | --- |
| Educational story | [source](../../../../resources/examples/showcase/story-water-treatment.canvas), [browser overview](water-overview.png), [reading detail](water-detail.png), [actual PNG](water-export.png), [SVG](water.svg) | Figure-led actors, short captions, transparent actors and grouped panels. Whole-paper overview is not reading zoom. |
| Software architecture | [source](../../../../resources/examples/showcase/modules-document-publishing.canvas), [browser](modules-overview.png), [SVG](modules.svg) | Same media-top/media-left and frame intents coexist with typed module/function/interface content and labelled wires. |
| Comparison | [source](../../../../resources/examples/showcase/grid-research-methods.canvas), [browser](comparison-overview.png), [SVG](comparison.svg) | Same figures/captions/frames with structured comparison tables; no family-specific renderer added. |

Sources are agent-authored DSL, admitted through the normal localhost CLI into `.local/visual-quality-proof`. The previous `.local/atlas-proof` workspace is retained for baseline evidence. [Receipts](receipts.json) establish actual commits; accompanying `*-read.canvas` files are live CLI readouts. Browser evidence is from the existing visible in-app tab, not a headless renderer. Local export inspection acquired the committed scene, validated it through Model/Presentation/Layout public contracts and passed exact pinned resources to the actual Export SVG/PNG encoders. No coordinates were authored by the agent.

## Builder-discovered corrections

- Fractional scene bounds caused the native PNG renderer to round dimensions differently from the public `ceil(bounds × scale)` contract. An integral outer viewport preserves exact scale and adds only fractional edge padding. The existing fourth acceptance case now checks 1000.4 × 800.2 logical bounds at scale 1.3 produce 1301 × 1041 pixels. Four new test cases remain the budget; no E2E added.
- Frame-free content inherits the nearest painted ancestor foreground; an absent role fill must not leave white text on the paper surface. Explicit frame choice controls painted geometry while canonical kind and member identities remain intact.
- Measured body/headings were extracted from the existing projector. The generic language vocabulary already drives lowering/printing; extra bespoke grammar modules were unnecessary. One UI text-default field follows the new canonical default. Generated CSS comes only from named figure tokens.

## Remaining visual gap

Visible improvements do not yet meet the benchmark. Water routes have long perimeter detours and weak contrast; module compartments need more legible hierarchy; the comparison needs tighter balance at reading scale. These are recorded inputs to Stages 3/4, not waived final acceptance. Existing service-build externalization/chunk warnings remain; the UI redesign is deferred.

Verification before audits: `pnpm check` passed typecheck, ESLint (Sonar ≤2), formatting, imports (846 modules), and 184 tests / 58 files in 16.15s. Token reproducibility and production browser build passed. Tests establish behavior, not aesthetic quality or per-file standards scores.

After the single audit-fix round: `pnpm check` passed again, 184 tests / 58 files in 16.72s. [Review dispositions](implementation-audits.md), [production source scoring](source-scores.md), and [source/artifact provenance](provenance.json) distinguish independent samples from builder assessment. The live caption patch and browser refresh retained the exact intended edit ([readout comparison](live-edit-proof.json), [visible capture](comparison-live-edit.png)).
