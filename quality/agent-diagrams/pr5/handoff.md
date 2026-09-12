# PR5 initial implementation handoff

Base: integrated initialPR4 `febb7baf84cc2342eb91043d450f0968d0363871` in the isolated Novakai-Canvas-next-routing worktree. Initial wall-clock budget began 2026-09-12 12:42:38 UTC; hard deadline 13:06:38 UTC. No A1/A2 audit was run; root must integrate the separate upstream PR4 geometry correction before audits.

## Implemented

- Endpoint-local initial parallel lanes; unrelated distant node bounds cannot select their lane.
- Exact measured field/port endpoints and marker sides retained. Optional approach/native buffer fits available fixed-content space; required marker extent is never shortened. A marker that cannot fit is a named fixed-content constraint failure.
- The pinned Wasm rejects `ConnEnd(Point, direction)`; its two-argument overload requires ShapeRef. Runtime proof is in native-abi.log. No unchecked cast or speculative ABI was introduced. Explicit owned approach points route the free native corridor, with exact endpoint stubs restored and independently validated.
- Initial route, at most eight deterministic local candidates, one outside fallback, then named constraint failure. Only native candidate-infeasible is skippable. Operational errors and cancellation propagate. Valid local results rank by actual Manhattan length, bend count, stable index; ranking metadata stays outside scene records.
- Labels remain beside actual segments. Accepted labels and every authored/manual path constrain later allocation. Exact segment footprints avoid the prior right/bottom bias from one-sided positive boxes. All endpoint approaches are reserved for later wires. Valid manual points are retained; infeasible locked labels reject.
- Independent validRoute and final scene inspect remain authoritative. No optimistic partial scene, suppressed rejection, placement/spacing/sequence/presentation/UI/DSL/Model implementation changes.
- Routing engine version is `libavoid-js-0.5.0-beta.5/layout-2`. Root owns shared engine-version integration.

## Verified outcomes

All **24/24 original read-only corpus DSL files** passed final real CLI replacement authoring and independent render. The initial creates also succeeded after the routing fixes. This includes all four known PR4 rejects: flow-equipment-return, flow-emergency-dispatch, er-habitat-survey, modules-payroll-policy. **Remaining corpus rejects: 0.** Earlier development failures are retained in historical logs; final-dsl-outcomes.json is authoritative.

Final CLI request receipts and full DSL readouts are in dsl/*final*. Full render documents are in renders/*.json; root owns headed-browser inspection. No screenshots or visual acceptance claim was made here. Original corpus hashes were verified unchanged.

- tree-field-research: 7 wires; maximum wire length 399.3616; total 1574.3884; scene 1094.7232 × 707.4285.
- modules-sensor-gateway: 5 wires; maximum wire length 575.0786; total 2250.7073; scene 1719.5286 × 562.5714.

Checks: typecheck PASS; repository lint PASS (Sonar ≤2); repository format check PASS; architecture PASS (822 modules/1945 dependencies); Layout tests **17/17 PASS**, **2 new focused cases**; web production build PASS with existing externalized-node-module and bundle-size warnings. No E2E suites. Logs retain the complete check output. Threshold-zero Sonar output is diagnostic measurement, intentionally reports functions above zero, and is not a failed ≤2 gate.

## Open gates and residuals

Literal author file evidence is in file-scores.md/source-scores.json. Routing core: 146–153/160. Contracts: 145–148. Native adapter: **137**. Tests: routing **130**, contracts **124**, arrangement **124**. The native/test source gate is **OPEN** pending the user's scoring interpretation; these are actual recorded judgments, not blanket passes inferred from tests. No useful tests were weakened to improve a score.

The existing tree annotation seed fixture still rejects its annotation wire with a named constraint-conflict after the bounded routing budget; it also rejected at the PR4 base. This is an expected-negative Layout fixture, not one of the 24 corpus sources. Its root cause is not classified here as intrinsically impossible placement. No placement correction was attempted.

Crossings remain honest warnings and the candidate budget is not a complete solver for arbitrary graphs. Manual or marker geometry that cannot fit fixed content still rejects. No global zero-crossing or headed visual acceptance claim.

The own service on port **5184** was stopped cleanly; own workspace is `.local/routing-probes`. No other service/process/browser was touched. Supplied five PR5 plan documents are included unchanged. Root should integrate upstream PR4 corrections/version conflicts, then conduct the requested audit and browser rounds.
