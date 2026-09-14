# Library loading regression

## Cause and scope

Browser visit history still named the removed `agent-diagram-atlas` collection. The web reader combined that optional history with the current canonical library. Library correctly rejected the dangling visit; the result component treated every missing page as still loading. Opening another collection also republishes recent visits during search, so fixing initial reads alone was insufficient.

The web adapter now intersects visit history with the supplied current inventory before both validation and query. It preserves order/timestamps and does not rewrite browser storage or remove canonical data. Canonical catalog reference errors still reject with complete typed source diagnostics. The results component differentiates failed loading from pending loading; the enclosing LibraryBrowser continues displaying the structured error.

Three source files; no capability, data-schema, storage, routing or UI-layout changes. Results declare only the navigation/pagination methods they consume. This is a targeted regression fix, not resumption of the deferred UI redesign.

## Evidence

| Check | Result |
| --- | --- |
| Original visible-browser reproduction | Full library reported `recent.agent-diagram-atlas: Visited collection must exist`; Collection panel remained “Library is loading…”. |
| Initial regression command | `pnpm exec vitest run apps/web/tests/library-loading.test.ts`: two failures, including exact dangling-visit diagnostic and false loading message. |
| Read-only visit reconciliation | Current collection remains searchable; missing visits excluded from read/query without mutating the input list. |
| Revisit regression | Initial read fix still failed after collection navigation republished retained history. Extended the same case to query with stale history; red before query fix, green afterward. |
| Canonical corruption | Removing the real collection while retaining its catalog entry still rejects with typed reference diagnostics. |
| Rendering state | Failed initial load no longer claims loading; genuine pending state still does. |
| Visible browser after final build | Full library and Collection panel have results. Opened Document publishing boundary from the library, then Museum loans and inspections from the panel; both rendered. Existing browser history was not cleared. |
| Gates | Typecheck, ESLint/Sonar≤2, formatting, architecture, 197 tests /70 files pass; suite 16.34s. Web build passes with existing bundle advisory. |

Budget: two fast regression cases, approximately 10ms assertions /500ms focused run; one adapter read/query case and one React static-render case. No E2E tests or browser processes launched. Existing in-app tab used. Tests were authored red before their corresponding fixes. No new subagent audit requested or run for this targeted bug; source scores below are builder assessments.

[Loaded library](library-loaded.png) · [Panel results](panel-results.png) · [Publishing opened](opened-publishing.png) · [Museum opened through panel](opened-museum.png)

## Source review

P1–P16 original standard order: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed errors, recovery, depth, Demeter, immutability, types, cognition, testability. Exact files/hashes in source-manifest.json. No repository-wide certification.

| File | P1–P16 | Score | Evidence / deductions |
| --- | --- | ---: | --- |
| `apps/web/adapters/library-reader.ts` | 10,6,7,10,10,10,10,10,10,10,10,10,10,10,10,10 | 153 | Host bridge owns preference reconciliation; one pure currentVisits predicate reused by both entry paths. Existing Library validates canonical state and provides query; checked retains typed source errors. Readonly copy/filter, branded IDs, no casts. OCP fixed policy steps6; LSP not demonstrated7. Recovery named by local comment/typed failure. |
| `apps/web/adapters/react/LibraryResults.tsx` | 10,6,7,10,10,10,10,10,8,10,10,10,10,10,10,10 | 151 | Focused rendering from cached readonly state; only next/open ports declared and both consumed. Empty-page handling distinguishes pending/failure. Named LibraryBrowser/reload recovery; React exception channel retains typed-errors8 deduction. Fixed rendering layers6; LSP7. No new CSS or state writes. |
| `apps/web/tests/library-loading.test.ts` | 10,6,7,10,10,10,10,10,10,10,10,10,10,10,10,10 | 153 | Real pure Library/Model readers and React rendering; assertions check exact owner failure before fix, surviving visit/search results, canonical corruption, and honest loading text. No filesystem/clock/network, fake owner success, unchecked casts or mutable setup. Fixed scenario steps6; LSP7. Assertion failures retain full structured results. |

Prevention: keep optional browser preferences separate from canonical validity at every adapter entry, and test the read→visit→query path as well as the first read. The bounded browser check caught the second path before this fix was declared complete.
