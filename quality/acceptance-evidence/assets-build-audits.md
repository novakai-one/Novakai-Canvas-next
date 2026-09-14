# Assets — one bounded implementation audit round

A1 fresh-context agent `assets_implementation_audit`; four target files, <8 minutes, read-only. A2 `baseline_audit`, five test files, <8 minutes, read-only. Collaborators read only inside Assets. No second audit. Findings independently verified before the single fixes-only round.

| Category | Finding | Verification / disposition |
|---|---|---|
| engineering violation | Escaped CSS `u\72l(other.svg#paint)` bypasses local SVG reference checks | Independently reproduced accepted110-byte output using compiled createSvg. Reject attribute backslashes before URL checking; existing SVG rejection test includes counterexample. |
| engineering violation | Canonical SVG can exceed1MiB despite bounded input | Independently reproduced300,000 literal `>` expansion to1,200,080 bytes. Enforce canonical UTF8 bound in named helper; same existing rejection test covers it. |
| engineering violation | Existing nonempty metadata DB without schema silently initialized | Independently reproduced with native in-memory SQLite. Create header only when creating a new table; initialization serialized. Existing file reopen test removes header and expects corrupt-asset. |
| engineering violation | Conditional return assembly in SVG | Verified expression. Compute suffix before return. Two local conditionals still retain conservative P15=7 under literal anchor; no artificial score uplift. |
| engineering violation | SQL prepare/run returned-collaborator chain | Verified; use named insert statement. |
| minor | Harness returned record fields lack readonly | Verified; readonly declarations added. |
| minor | A2 independent identity oracle absent | Verified self-verifier alone did not establish expected SHA256. Existing raster test independently hashes resolved bytes with node:crypto; exact10 definitions retained. |

A1 original /160: SVG140, SQLite/files143, leases148, harness150. Post-fix author evidence is separate in quality/file-reviews/assets.md; no independent rescore claimed. Native defaults retain conservative testability deductions there. Fixes retain the actual Sonar<=2 gate.

A2 found no incorrect assertions in three attempted counterexamples: (1) wrong digest and missing lease membership allow hash-error precedence; (2) await Promise.resolve still yields so synchronous release precedes resumed validation; (3) failed multi-acquire cannot retain partial protection under A08. Coverage limitation recorded separately above.

Final validation: strict TypeScript, ESLint/Sonar<=2, Prettier, dependency constraints all pass;138 modules/338 dependencies;50 tests in13files,10 Assets cases.132 named functions documented with explicit return types,31 Assets TS files. No E2E, no browser experience or host integration claim. Node24.13 SQLite emits its experimental API warning.

Plan counts: before2508 words/185lines; final2599words/189lines. Every document and aggregate remains within20% words AND lines. Five docs mirrored to vault capability/assets. Native media dependencies/license decisions recorded separately; offline Inter license retained.
