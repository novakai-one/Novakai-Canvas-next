# Build SOP — bounded audits, continuing implementation

Authority: user instruction 2026-09-13. The orchestrator is authorized to finish the goal, make necessary scoped corrections, raise a PR at each stage, and continue without renewed permission. No automatic merges.

| Step | Required evidence | Boundary |
| --- | --- | --- |
| Specify | Five template-based documents, Doc6 file estimates, shared reference images, accepted-input/returned-outcome contracts and exact test budget. | Private algorithms are builder choices. No essay padding. |
| Freeze | Words and physical lines per stage before pressure review. | One verified fix round; ≤20% growth in both. Replace weak text rather than accumulate appendices. |
| Pressure | One fresh read-only agent, max eight minutes, scoped to this stage and required owner contracts. | Findings table: engineering violation, major build risk, preference, minor. Not a repo audit. |
| Verify/fix | Reproduce/validate findings; reject unsupported claims with evidence. | Findings are unproven by default. No immediate pressure re-audit. |
| Build | Implement accepted contracts; author a small original DSL proof when improvement can be seen. | Use public capability entries. No coordinate-authored DSL, fake renderer or unrelated UI work. |
| Self-check | Targeted contract tests, necessary repo gates, visible browser and actual export inspection. | Repair observed defects and repeat affected checks as needed. This is building, not an audit loop. |
| A1 | One spec/coding/visual auditor, eight-minute limit. | ≤5 source targets per auditor; sample scope, not an invented certification of every file. For artifact-only slices inspect their DSL and captures. |
| A2 | One test-correctness auditor, eight-minute limit. | Try three scenarios falsifying the assertions; none-found is valid. No E2E tests. Artifact-only slices audit evidence assertions. |
| Verify/fix | One round addressing independently verified audit findings. | No audit→fix→audit escalation on the same slice. Unrelated findings go to the ledger. |
| PR/continue | Push PR with behavior, proof links, checks, verified residuals and next slice. | Next stage proceeds without waiting for merge/review permission. |

## Intent of the limits

The limits stop audits from expanding into endless test repairs and unrelated work. They do not require stopping when the approved outcome still needs implementation. Authoring, inspection, correction and focused verification may repeat until the accepted behavior works. Do not weaken acceptance to close a PR.

One additional bounded delegate-realignment action is allowed when a delegated agent deviates. If an actual new build slice is necessary, document its concrete missing behavior and use a bounded cycle for that slice. Do not rename repeated review of unchanged work as a new slice. Keep auditor findings separate from builder-discovered defects.

Auditors evaluate responsibility, accepted inputs, return signatures, rejection/recovery, invariants, useful visual communication and coding standards. They must not reject a valid build because it uses different private helper names, file estimates or internal wiring. Code standards violations are material even when output looks correct.

## Tests and evidence

Freeze a small justified test budget in each Doc5 before that stage starts. Extend existing cases where adequate. Record any necessary evidence-backed adjustment before writing it; user authority to correct and complete remains effective. No coverage targets, implementation-mirroring tests, or E2E suite. Public contracts are the test entry.

A pass is supported by source revision, source file, collection ID/revision, receipt, actual screenshot/export and observable result. Do not infer complete rendering from a successful parse, or commit success from a missing receipt. Rejection retains the previous admitted document/scene; structured error evidence survives until display formatting.

Only the orchestrator controls browser verification. Use the in-app browser; auditors inspect provided captures. No delegated browser launches. Any temporary process/session has an owner and is closed after use; preserve personal browsers.

Every changed first-party source file needs reproducible >144/160 evidence and Sonar complexity ≤2. Mechanical passes and sampling are distinct from per-file scores; never pre-award absent principles. Standards apply to the approved boundary protocol and readable code, not an invented TypeScript line cap.

## Agent quality loop (authoring feedback, 2026-09-13)

An authoring agent measures before it eyeballs. The loop per iteration:

1. `canvas preview FILE [--revision N]` — fail fast on syntax, domain and feasibility (geometry infeasibility is checked at preview, not only at commit).
2. `canvas apply REQUEST_ID` — commit, then reconcile the receipt.
3. `canvas inspect ID` — machine quality report: `valid`, typed `warnings` (`wire-crossing`, `constraint-relaxed` with targets), `crossings`/`relaxed` budget counts, `engineVersions`. Gate budgets against the visual benchmark floors before touching DSL again.
4. Export/screenshot only for the final visual eyeball of a round, not for geometry verification.

`constraint-relaxed` warnings mean the engine dropped or violated an authored hint to keep required geometry; correct the named hint rather than adding more constraints. A `constraint-conflict` names the failing wire and its authored side intent.
