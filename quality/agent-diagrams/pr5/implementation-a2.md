Found **3 assertion false positives** in `58e5dbd` against `eb07bd1`.

| Classification | Exact counterexample and evidence | Minimal fix |
|---|---|---|
| engineering violation | Selecting the **508-unit** valid route instead of the **376-unit** minimum passes the count, inspection and repeatability assertions in [contracts.test.ts:377](/Users/christopherdasca/Programming/Novakai-Canvas-next-agent-diagrams/capability/layout/tests/contracts.test.ts:377). Determinism does not establish correct ranking. | Independently compare the selected route’s length/bends/index against admissible candidates. |
| engineering violation | Replacing the tenth, outside-fallback proposal with the **initial connection again** still passes the exhausted-search assertions in [contracts.test.ts:419](/Users/christopherdasca/Programming/Novakai-Canvas-next-agent-diagrams/capability/layout/tests/contracts.test.ts:419). Ten calls incorrectly certify the required search sequence. | Assert that the final proposal contains outside checkpoints beyond occupied bounds, alongside the count. |
| engineering violation | For `engine-failed` and `cancelled`, replacing diagnostics with `path: 'wrong-path'`, `targets: ['unrelated-wire']`, and unrelated message/recovery still passes [contracts.test.ts:419](/Users/christopherdasca/Programming/Novakai-Canvas-next-agent-diagrams/capability/layout/tests/contracts.test.ts:419). | Compare the complete returned error with the injected operational/cancellation error. |

Each counterexample passed read-only, in-memory replays of case 10 and both new routing cases, using real Wasm and equivalent Node assertions. These establish assertion defects, **not existing production failures**.

No separate finding in `routing.test.ts`. One audit round, within eight minutes; no filesystem edits, services, agents, E2E, PR or push. The pending file-grade question remains separate.