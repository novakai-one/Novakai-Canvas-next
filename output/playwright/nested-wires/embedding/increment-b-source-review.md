# Increment B run 2 — product source review

Reviewed the final diff against `c398a8e`, following ruling #23's legacy diff scope and `docs/standards/CODING-STANDARDS.md`. These are evidence-backed manual scores, not pre-awarded grades. No new product module or public API was added. Audit scripts/receipts are offline evidence. No subagents were used.

Read direct collaborators: `nested-support.ts`, `nested-support-input.ts`, `nested-support-paths.ts`, `nested-support-mouths.ts`, `nested-support-structure.ts`, `nested-support-graph.ts`, the declaration-only support records, placement/grid construction, road/contact registry, road capacity, lane allocation, and projection/support observation. The two independent diagnostic scripts verify the public Result, deterministic graph capture, old section floors, semantic shared-track aliases, exact cycle provenance and default/hub scalar no-ops. The authoring rejection is an unresolved product limitation, not a legality success.

Targets and scopes:

- **Graph:** `capability/layout/core/nested-support-graph.ts:97`–98 — preserve the old distance when registering structural relations.
- **Structure:** `capability/layout/core/nested-support-structure.ts:160`–161 and 227–229 — section extent floors and semantic track equalities.
- **Mouths:** `capability/layout/core/nested-support-mouths.ts:33`–35 — include every retained section gate in existing mouth constraints.

| Principle | Graph | Structure | Mouths | Evidence and deductions |
| --- | ---: | ---: | ---: | --- |
| SRP | 10 | 10 | 10 | Graph registers separation policy; Structure registers structural anchors/relations; Mouths selects the mouths whose existing support is compiled. No stage acquired I/O or projection. |
| OCP | 6 | 6 | 6 | Graph 97 branches on owned relation kind; Structure 161/228 owns fixed construction policy; Mouths 34 hardcodes the section-port predicate. These policies require editing the module; no extension seam (cap 6). |
| LSP | 7 | 7 | 7 | No subtype implementation added in any target; not demonstrated, fixed score 7. |
| ISP | 10 | 10 | 10 | Existing graph/record dependencies are consumed directly; no added behavioral port or widened dependency. |
| DIP | 10 | 10 | 10 | Existing imports stay within own core/declaration-only records. No framework, host, external capability, infrastructure, or concrete adapter dependency introduced. |
| DRY | 10 | 10 | 10 | Graph 97 centralizes the structural distance floor; Structure 161 handles both axes through the existing dimension map and 228 reuses ordinal construction; Mouths 34 derives gate identities from authoritative port records without a second contact law. |
| KISS | 9 | 10 | 9 | Graph's effective requirement differs from the caller's argument depending on kind, so the preservation rule must be traced through registration (-1). Structure's extent and equality statements are direct. Mouths keeps a Set and downstream membership branch although every section port is now selected (-1). |
| YAGNI | 10 | 10 | 10 | Changes implement the explicit amendment and all-contact prerequisite only. No generic solver, cycle retry, topology alternative, or C/D behavior. |
| Typed error outcomes | 8 | 8 | 8 | Existing private `SupportRejection` is converted by `nested-support.ts:14`–19,63–66 to the public typed Result. Unexpected programming errors propagate and the public recovery contract names that behavior; the existing boundary warrants 8, not 10. Fresh authoring evidence exercises the typed cycle result. |
| Idempotency / recovery | 10 | 10 | 10 | All writes affect invocation-local graph state; public preflight names caller-owned reconstruction. Repeated preflights match and input scenes remain byte-identical. |
| Depth / information hiding | 10 | 10 | 10 | The graph module owns minimum relation policy; structural compiler owns grid identities/extents; mouth compiler owns which retained mouths need constraints. Their callers do not duplicate these rules. |
| Law of Demeter | 10 | 10 | 10 | New expressions inspect direct record fields and invoke direct helper functions only. |
| Immutability | 9 | 9 | 9 | Graph 98 appends to a local mutable relation array; Structure mutates the local graph through anchor/equate/relate; Mouths continues to populate local result/graph state. No shared mutation, but not fully persistent values (-1 each). |
| Type safety | 10 | 10 | 10 | No `any`, unchecked casts, assertions, or widened types introduced. Existing typed Axis and record fields constrain all new accesses. |
| Cognitive style | 10 | 10 | 10 | One plain policy ternary in Graph, direct calls in Structure, filter/map in Mouths; no nested ternary or spread-ternary idiom. Final lint checks Sonar <=2 per function. |
| Testability | 10 | 10 | 10 | Explicit deterministic inputs, no clock/environment/network/filesystem in product changes. Public query, observation-only graph capture and independent numeric replay reproduce without a server. |
| **Total /160** | **149** | **150** | **149** | All strictly >144. These implementation scores do not waive failed B acceptance. |

Worst three findings in each file: **OCP 6** — fixed owned policy; **LSP 7** — no subtype behavior demonstrated; **typed errors 8** — unexpected programming errors still propagate through the documented public boundary. Additional deductions are retained above without offsetting them with unrelated strengths.

The unresolved functional finding is separate from these code-quality scores: full authoring contact coverage exposes a zero-sum residual cycle, which the ratified admission regime rejects. No score, green suite, or successful numeric replay on another fixture establishes a complete embedding.
