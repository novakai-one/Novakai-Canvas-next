# Capability entry guard follow-up

Responsibility: enforce the existing single public entry convention for erased type imports as well as runtime imports, across every capability.

The proposed `capability/[^/]+/contract/` regex rejects full paths but misses sibling-relative paths such as `../../layout/contract/records/geometry.js`. The guard now discovers and regex-escapes directory names beneath the configuration-relative capability folder. Naming a capability before `/contract/` triggers the restriction; only `index.js` or `index.ts` is public. Own `../../contract/records/...` imports do not name a capability and remain subject to existing layer rules.

The vocabulary is discovered when ESLint loads; adding a capability directory needs no configuration edit. Existing package exports and Dependency Cruiser rules remain unchanged. This does not expand public interfaces or change any Result contracts.

Validation: 157 syntax probes across 12 current capabilities, covering type imports, value imports, named type re-exports, full paths, sibling paths, public indexes, own-core declarations and an unrelated vendor path. Four further probes create a temporary future capability directory, load ESLint in a fresh process and verify automatic admission to the guard. All 161 pass; the temporary directory is removed. Repo lint, formatting and diff checks pass.

Test budget: zero new test definitions; manual ESLint probes only. No runtime source changed, so the application test suite and browser verification were not repeated. Existing wildcard-export rejection is retained.
