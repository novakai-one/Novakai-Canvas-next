# Targeted contract cleanup

Scope: verify and fix the supplied Design System/Layout contract findings and the reported diagnostic/documentation defects. No visual feature development and no additional audit cycle.

- Replace Design System wildcard exports with explicitly named exports; remove unused token forwarding files and the core Artifact re-export.
- Preserve a checked LayoutInputKey through minting, jobs and scene records. Keep canonical key bytes unchanged.
- Key TokenValues by TokenId; retain existing unknown-input validation and token formulas.
- Close the recipe operator table over supported recipe operators; literal token values keep their existing reader.
- Correct the same malformed-spacing defect in the four reported capabilities; retain current capacity values.
- Attach missing declaration comments to the reported React interfaces; verify whether StyleProjection already has its comment.
- Add an ESLint wildcard-export rejection. Verify the existing Dependency Cruiser boundary before changing it.

Test budget: zero new test definitions. Extend existing public contract tests with key identity/invalid-input assertions and compile-time misuse checks. Run typecheck, lint, formatting, dependency boundaries, existing tests and token reproducibility checks. No E2E tests or browser sessions are needed.

Preservation: PR15–20 remain open and pushed; deferred UI edits and the earlier showcase are preserved in draft PR21. All 13 linked worktrees were removed after verified local archives and an all-branches Git bundle. The main checkout retains the Atlas runtime workspace and the original runtime workspace separately.

## Verified disposition

| Finding | Disposition |
| --- | --- |
| Eight wildcard type exports | Removed; all 62 previously public Design System names are retained explicitly. TokenId/tokenId are the two intentional checked-identity additions. |
| Shadow token facades | Both unused files removed. Runtime deep imports were already rejected by Dependency Cruiser, but a type-only probe was erased and escaped that check. ESLint now rejects Design System deep type imports/re-exports in adapters, core and composition; public index imports remain allowed. |
| Layout string keys | LayoutInputKey is branded and checked during canonical minting; public Result, jobs and both scene levels retain it. Runtime bytes remain strings, with existing stale/forged-input rejection unchanged. |
| TokenValues raw keys | Keyed by TokenId; literal overrides use checked IDs. Consumers use TokenValue directly where they previously indexed the record type by string. |
| Malformed diagnostics | Ten current occurrences corrected across the four reported capabilities, including the current 32-section capacity message. Limits themselves are unchanged. |
| Core Artifact re-export | Removed together with the unused import. |
| Detached readActive comment | Blank separator removed. |
| Open recipe table | Exhaustive over Exclude<Expression['op'], 'literal'>. Literal values intentionally use their separate existing reader; no new grammar added. |
| Partial docs | Added descriptions to 16 previously undocumented React interfaces. StyleProjection already has an attached responsibility/recovery comment in the latest code. |

## Validation

- Full `pnpm check`: TypeScript, ESLint/Sonar <=2, Prettier, Dependency Cruiser and 177 tests across 52 files pass. Test execution: 17.59s.
- After adding the targeted type-import guard: full lint passes; adapter/core/compose probes reject deep type imports/re-exports and accept the public entry.
- New wildcard guard rejects an injected wildcard type export. Probes were removed; no persistent extra test cases or audit round.
- Existing tests include compile-time rejection of plain strings as LayoutInputKey/TokenId and exact public-result/job/map-key type assertions. Existing runtime assertions and fixture meanings retained.
- Token snapshot generation is unchanged: `fb90e6e47f5112e51ce12e22c52ff24dc0759064233dbbd253df58b43f4cd6fa`.
- Web build passes; existing browser-externalization/chunk-size warnings remain outside this cleanup.
- Atlas service restarted from the primary checkout on port 5185. CLI lists revision 4 with 24 sections from the preserved workspace. No Chrome/browser sessions opened.
- This targeted correction does not certify unrelated files or replace historical file-scoring reports with new blanket scores.
