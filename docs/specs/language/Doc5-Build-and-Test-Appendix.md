# Capability: language — Build & test appendix

**Build:** checked syntax/types/vocabulary → bounded lexer/parser → resource declarations and complete record lowering → Model staging integration → ordered patch compiler → faithful full/scoped printer → describe/examples.
**Frozen budget:18 behavioral cases / five suites.** Public Language with real public Model roles; no parser-internal assertions or E2E suite. These cases replace no existing tests; Model's existing suite remains green.

| # | Independent oracle |
|---|---|
| 1 | Complete baseline prototype.canvas:7 nodes/7 labelled wires/asset/steps/constraints; no filesystem read |
| 2 | ER scalar/composite keys, field endpoints and both explicit cardinalities preserved |
| 3 | Modules/interfaces/functions, typed members/signatures/ports, labelled imports and provenance namespaces; omitted status becomes unverified |
| 4 | Every content form, table rows, Unicode/escape/linebreak data, order and stable descendant IDs |
| 5 | Nested/represented groups, scoped constraints and collection arrangement; no duplicate represented show |
| 6 | Tree root/annotation semantics, default layouts, incompatible mode/layout rejection |
| 7 | Nested sequence alt/opt/loop, explicit/generated branch IDs and activation order round-trip |
| 8 | State transitions preserve guard/effect; story/grid sections preserve order on mixed collection |
| 9 | Full semantic round-trip with exact pins, sparse sequence ranks and interleaved group storage; geometry summary has no coordinates |
| 10 | Section/object readouts use structural view; replacement rejects even after comments removed |
| 11 | Set/unset only named allowed fields; unrelated data/pins/manual geometry unchanged |
| 12 | Add/delete/cascade/show/hide/connect/disconnect/reset; forward references only validated at final batch |
| 13 | Block insertion/removal/reordering, required field protection, referenced endpoint/duplicate descendant rejection |
| 14 | Node/section replacements change group/event structure while surviving manual identities remain |
| 15 | Reconnect endpoint versus sources namespace; section delete/recreate rejects; staged cascade followed by later edit stays correct |
| 16 | Unknown property/kind/version/escape/invalid typed value reports precise span/target/expected category |
| 17 | Size/token/nesting bounds; caller/provider failure or mutation cannot yield an unchecked candidate |
| 18 | Describe covers shipped forms/defaults/examples; unsupported persisted fields refuse print; external resources never implicitly fetched |

**Model seam proof:** an unresolved-reference prefix returns only an unchecked stage, while final plan rejects; completing the reference validates; cascade effects are visible to a subsequent partial-property compilation. No stage result is accepted by Authoring as proof of validity.
**Plan review:** one fresh-context reviewer≤8min; four allowed classes; one verified fix, per-doc/aggregate words and lines≤20%; no second pressure test.
**Build review:** A1 fidelity/standards + A2 assertion correctness (≤3 challenges); each≤8min and≤5 targets, Language scope only; one verified findings-only fix; no re-audit.
**Gates:** source file scores>144/160; actual Sonar≤2; named function docs/explicit returns; all tests/typecheck/format/import boundaries. Stage extension receives its own builder file evidence. Distinct stacked PR; CLI/browser/asset staging and visual outcome proof remain host integration, not parser-test claims.
