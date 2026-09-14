# PR3 standards — builder evidence

Authority: `docs/standards/CODING-STANDARDS.md`. This is a post-correction builder matrix, not an independent re-audit. Scores are literal target-file judgments; repeated values reflect the rubric anchors, not copied blanket approval. LSP is 7 where subtyping is not demonstrated. Automated evidence: TypeScript, Sonar ≤2, formatting and dependency-cruiser all pass; 166/166 tests pass.

|File|SRP|OCP|LSP|ISP|DIP|DRY|KISS|YAGNI|Err|Fail|Deep|LoD|Imm|Type|Cog|Test|Total/gate|
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|`cli/adapters/arguments.ts`|10|6|7|10|10|9|9|10|10|10|10|10|10|10|10|10|151 pass|
|`cli/adapters/files.ts`|10|6|7|10|10|9|9|10|10|10|10|10|5|10|10|0|136 literal fail; role interpretation pending|
|`cli/adapters/preset-inputs.ts`|10|6|7|10|10|9|9|10|10|10|10|10|10|10|10|10|151 pass|
|`cli/adapters/resource-inputs.ts`|10|6|7|10|10|10|9|10|10|10|10|10|5|10|10|0|137 literal fail; role interpretation pending|
|`cli/adapters/semantic-inputs.ts`|10|6|7|10|10|9|9|10|10|10|10|10|10|10|10|10|151 pass|
|`cli/adapters/theme-config.ts`|10|6|7|10|10|10|9|10|10|10|10|10|10|10|10|10|152 pass|
|`cli/contract/compose.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|0|143 literal fail; role interpretation pending|
|`cli/contract/ports/runtime.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|
|`cli/contract/records/command.ts`|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148 pass|
|`cli/contract/records/resources.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|
|`cli/core/commands/author.ts`|10|6|7|5|10|9|9|10|10|10|10|10|10|10|10|10|146 pass|
|`cli/core/commands/execute.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153 pass|
|`cli/core/commands/help.ts`|10|0|7|10|10|10|10|10|10|10|0|10|10|10|10|10|137 fail|
|`cli/core/commands/presets.ts`|10|6|7|5|10|9|10|10|10|10|10|10|10|10|10|10|147 pass|
|`cli/core/commands/resources.ts`|10|6|7|10|10|10|9|10|10|10|10|10|10|10|10|10|152 pass|
|`service/adapters/http-io.ts`|10|6|7|10|10|10|10|10|10|10|10|10|5|10|10|0|138 literal fail; role interpretation pending|
|`service/adapters/http-router.ts`|10|6|7|10|10|10|10|10|10|8|10|10|10|10|10|10|151 pass|
|`service/adapters/preset-codecs.ts`|10|6|7|10|10|9|9|10|10|10|10|10|10|10|10|10|151 pass|
|`service/adapters/preset-planner.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153 pass|
|`service/adapters/resource-commands.ts`|5|6|7|10|10|9|10|10|10|10|10|10|10|10|10|10|147 pass|
|`service/adapters/resource-selection.ts`|5|6|7|10|10|9|9|10|10|10|10|10|10|10|10|10|146 pass|
|`service/adapters/theme-preparation.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153 pass|
|`service/contract/api.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153 pass|
|`service/contract/compose.ts`|10|6|7|5|10|9|9|10|10|8|10|10|10|10|10|0|134 literal fail; role interpretation pending|
|`service/contract/index.ts`|10|10|7|10|10|10|10|10|10|10|0|10|10|10|10|10|147 pass|
|`service/contract/records/commands.ts`|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148 pass|
|`service/contract/records/http.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|
|`service/contract/records/metadata.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|
|`service/contract/records/resource-commands.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|
|`service/contract/records/server.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|
|`service/contract/types.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|
|`service/core/transport/admission.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153 pass|
|`service/core/transport/command.ts`|10|6|7|10|10|10|10|10|10|10|10|10|10|10|10|10|153 pass|
|`web/adapters/react/WorkspaceShell.tsx`|10|6|7|10|10|10|9|10|8|10|10|10|10|10|10|10|150 pass|
|`web/contract/compose.ts`|10|6|7|5|10|9|9|10|8|8|10|10|10|10|10|0|132 literal fail; role interpretation pending|
|`web/contract/react-types.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|
|`assets/contract/records/media.ts`|10|6|7|10|10|10|10|10|10|10|5|10|10|10|10|10|148 pass|
|`design-system/core/themes/admit-data.ts`|10|6|7|10|10|9|9|10|10|10|10|10|10|10|10|10|151 pass|
|`presentation/adapters/react/NodeContent.tsx`|10|6|7|10|10|10|10|10|8|10|10|10|10|10|10|10|151 pass|
|`presentation/contract/index.ts`|10|10|7|10|10|10|10|10|10|10|0|10|10|10|10|10|147 pass|
|`presentation/contract/react-types.ts`|10|10|7|10|10|10|10|10|10|10|5|10|10|10|10|10|152 pass|

## Honest residuals

- `service/adapters/resource-commands.ts` remains one resource boundary spanning semantic preparation and byte restoration; SRP is 5, although its collaborator roles are now narrowed and every owner diagnostic/cleanup result remains typed. It clears 147, not a cosmetically inflated score.
- `service/adapters/resource-selection.ts` retains selection and resource-closure work in one target (146). `cli/core/commands/help.ts` is literal closed help text and therefore remains 137 under OCP/depth anchors. These are recorded residuals, not speculative-abstraction prompts.
- CLI/service/web native composition and filesystem/stream adapters are scored0 on literal Testability while awaiting the user's native-infrastructure interpretation. Their strict gate is unresolved where the maximum is ≤144. Adapter DIP remains 10 because concrete I/O is correctly outside core; no extra layer was invented merely for points.
- Changed test/fixture files are separate from this production matrix: `apps/{cli,service,web}/tests/{commands,transport,authoring,host-workspace-fixture,rendering}*`. Their native-fixtures scoring gate remains pending user direction; their behavior is included in the 166 passing total.

No every-file independent audit, browser rerun, or native-fixture score is claimed.


Orchestrator records literal Testability=0 wherever native infrastructure is required; no missing score is treated as passing. The previously ranged rows are now explicit totals. A1 chained factory calls and repeated empty binding were corrected within this same findings round; direct bound collaborators are named before use.
