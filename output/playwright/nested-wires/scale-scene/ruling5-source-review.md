# Ruling #5 / Part B source review

Reviewed whole changed runtime modules against the sixteen anchors in
`docs/standards/CODING-STANDARDS.md`. Diagnostic `.mjs`, `.mts`, and Python
runners follow the existing evidence-tool scope: process-owned assertion/IO
failures, public Layout imports, no application loading of instrumentation.
No new test file. Sonar ≤2, types, import boundaries and 208 existing tests pass
in `ruling5-pnpm-check.txt`. This is source review, not visual acceptance.

Scores in order: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes,
retry semantics, depth, Demeter, immutability, type safety, cognitive style,
testability.

| File | Scores | Total |
| --- | --- | ---: |
| `capability/layout/core/nested-lane-projection.ts` | 10,6,7,10,10,9,9,10,10,10,10,10,10,10,9,10 | 150 |
| `apps/web/cli/scale-scene.ts` | 10,6,7,10,10,9,10,10,8,10,9,10,10,10,10,10 | 149 |
| `apps/web/cli/roads-prototype.ts` | 10,6,7,10,10,10,10,10,8,10,10,10,8,10,10,8 | 145 |

Projection evidence: imports declaration records and own core only (1–6);
`streetBridge` (120) now handles occupied source ranks symmetrically with
occupied destination ranks; both use the retained `medianBridge`. `fan`,
`piece`, `joinsFor`, and `projectNestedWires` keep allocation/materialization
separate. Fresh records only; total projection retains typed failed-wire owner.
OCP loses four: turn policy requires edits. DRY loses one: dual rank predicates
repeat direction/rank concepts. KISS loses one: several connection cases must
be followed. Cognitive style loses one for inherited spread-ternary helper.
No geometric intersection query, retry or route-law edit was introduced.

Scale builder evidence: one public Layout call in `buildScaleScene`, semantic
import and section captions only. Four-port geometry remains Layout-owned.
OCP loses four for fixed captions; LSP seven (no subtype demonstration); DRY
loses one for caption decoration also present in templates; depth loses one
for a thin fixture host. Typed outcomes eight: the public Layout builder's
RangeError can escape, with reload/recovery explicitly owned by the browser
host in its entry comment. No ambient clock/DOM inside this function.

Browser host evidence: static scene registry in `builder`; caller measurement
and font/frame readiness isolated from deterministic output. React/DOM are
host responsibilities, no capability internals imported. Fixed startup steps
cost OCP four; sequential startup is readable in one pass (KISS ten); ambient environment costs testability two;
module counter and DOM effects cost immutability two. Typed failures handled
at `main().catch` plus style Result; exception kinds remain untyped (eight).
The lowest reviewed total is 145, above 144. No score is inferred from a green suite.
