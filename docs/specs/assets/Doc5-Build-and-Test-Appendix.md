# Capability: assets — Build / acceptance appendix

| Step | Exit evidence |
|---|---|
| 1 | Checked public schemas, limits, handler/storage roles and typed outcomes |
| 2 | Safe raster/SVG/font normalization + exact identities and descriptors |
| 3 | Real immutable files/metadata SQLite, resolution, leases and conservative collection |
| 4 | Frozen contract tests + preceding capability regressions and static gates |
| 5 | Two bounded audits, one verified fix, separate stacked PR; proceed Templates |

## Frozen test budget

Ten definitions, ten executed tests; related counterexamples grouped inside each. None already covered by Assets (scaffold); Persistence tests use resource fixtures and do not prove Assets. Fast in-process public/adapter contracts only, no E2E, host boot or external network.

| # | Test | Tier/type | Loop/nightly s | Maintenance | For + confidence | Against + confidence | Already covered | Retires when |
|---|---|---|---:|---|---|---|---|---|
| 1 | Decode/re-encode raster identity and dimensions | fast/contract | .10/.10 | medium | Rejects spoofed/broken images (95%) | Native codec fixtures (25%) | none | Raster admission replaced |
| 2 | Safe SVG retains diagram shapes and local references | fast/contract | .04/.04 | medium | Keeps editable/vector icon fidelity (90%) | Subset fixtures (25%) | none | SVG admission replaced |
| 3 | Active/external/malformed SVG and bounds reject | fast/contract | .04/.04 | medium | Prevents script/resource injection (95%) | Cannot exhaust XML space (30%) | none | SVG admission replaced |
| 4 | Font format/metrics admission and rejection | fast/contract | .05/.05 | medium | Prevents invalid font descriptors (90%) | Licensed binary fixture upkeep (30%) | none | Font support removed |
| 5 | Repeated staging preserves caller metadata and bytes | fast/contract | .04/.04 | low | Prevents global alt overwrite (95%) | Shares admission setup (20%) | tests1/2 partial | Stage contract replaced |
| 6 | File reopen, exact resolution and corruption failures | fast/contract | .06/.06 | medium | Prevents silent offline asset loss (95%) | Temp IO setup (25%) | none | File adapter replaced |
| 7 | All-or-none acquire and idempotent release | fast/contract | .04/.04 | low | Prevents unprotected backups (95%) | Small lease policy (20%) | Persistence mocks only | Lease contract removed |
| 8 | Reserved restore stage verifies bytes and final live membership | fast/contract | .06/.06 | medium | Prevents GC race/mismatched restore (95%) | Async race fixture (30%) | Persistence mocks only | Restore lease replaced |
| 9 | Collection retains authoritative/live pins and recovers dead owners | fast/contract | .05/.05 | medium | Prevents deleting used media (95%) | Reader/liveness fixtures (25%) | none | Collection replaced |
| 10 | Driver failures/reachability failures produce honest typed results | fast/contract | .04/.04 | medium | Prevents false staging/GC success (90%) | Failure harness upkeep (30%) | none | Storage contract replaced |
| **Fast / TOTAL** | **10** | | **.62/.62** | | | | | |
| **Slow / guard** | **0** | | **0/0** | | | | | |

Test9 includes stage→GC→reserve: absent reservation never substitutes for a successful existing-byte acquire or protected stage. Tests use public contract and shared adapter contract, independently expected digest/bytes and media dimensions. Fixtures use explicit native factories and scoped cleanup, following verified Persistence fixture corrections. Two embedded consumers: authoring staging and maintenance lease/restore providers. Actual main-app references and browser font/image rendering are integrated/audited later, not claimed by unit results.

## Bounded review and counts

Before code: declare words/lines; one fresh-context pressure tester with8minute timeout, capability only; categories engineering violation / major build risk / preference / minor. One independently verified fix round, <=20% growth words AND lines per doc/total; no second pressure test. Exact10-test budget frozen before build.

After code: A1 roughly10% varied production files,max5, fidelity+16principle scores; A2 <=5testfiles attempts up to3 incorrect assertion scenarios. Eight minutes each. One verified findings-only fix round, no re-audit. Every first-party file author evidence >144/160, named docs/return types, Sonar<=2, narrow roles and public import enforcement. Native adapter limitations recorded honestly; no blanket passing claims.
