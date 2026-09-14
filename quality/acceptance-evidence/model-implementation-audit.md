# Model implementation fidelity audit

Status: completed, single bounded audit round. Started 2026-09-11 12:21:11 UTC; deadline 12:29:11 UTC. No implementation edits or delegation. Findings are provisional until independently verified by builder.

Detailed production targets (maximum five): `core/invariants/input.ts`, `core/objects/keys.ts`, `core/sections/sequence.ts`, `core/collection/preservation.ts`, `core/collection/removal.ts` (all under capability/model). Contracts, entry points, cascade and section helpers read as supporting evidence. Read five Model specs, root and detailed coding standards, model-build.md and quality/file-reviews/model.md. No builder score treated as independent proof. No optional scoring attempted.

Public validation, resource bounds, ordered FK matching, sequence scope rules, removal/cascade and geometry preservation were checked. Two input-boundary fidelity findings reproduced; no high-impact ordinary JSON domain-state failure found within this bounded review.

| ID | Category | Evidence | Consequence | Minimal remedy |
|---|---|---|---|---|
| MI-1 | engineering violation | Public `validate(Object.defineProperty(base(), 'unsupported', {value:'silently lost', enumerable:false}))` returns `ok:true`, omitting the own `unsupported` field. Doc2 lines 16 and 78 require unknown fields to fail and forbid unsupported-field loss; `core/invariants/input.ts:21–33` reads descriptors but never rejects nonenumerable record fields, and supporting `core/invariants/validate.ts:33–37` delegates strict unknown-key detection to schema parsing. | A JavaScript caller can submit an unsupported own field and receive successful validation with silent data loss, violating the advertised strict boundary. | Reject nonenumerable record properties before schema parsing (or ensure every own property participates in strict shape validation); retain the normal array length exception. |
| MI-2 | minor | Public `validate(Object.assign(Object.create(Array.prototype), base()))` returns `ok:true`. This value is not an array and is not a plain record. Doc2 line 77 explicitly rejects exotic objects; `core/invariants/input.ts:16–19` permits Array.prototype for every object, while lines 48–50 apply array checks only to real arrays. | The documented plain-record/array admission rule is weaker than promised; this malformed prototype shape crosses the public boundary. | Make permitted prototype depend on `Array.isArray(value)`: array prototype only for real arrays, ordinary/null prototype for records. |

Reproductions above used the existing public-test `base()` fixture; the equivalent standalone fixture is below. Probes executed through the public contract index with Vitest, without a server/E2E. These are observed behaviors, not verified builder dispositions.

## Exact public reproduction

Specs directory: `/Users/christopherdasca/Library/Mobile Documents/iCloud~md~obsidian/Documents/playbook-library/0-inbox/Executions/260911-Canvas-Next/capability/model`. `Doc2` above means `Doc2-Entities-and-Invariants.md`.

This code can run inside a temporary Vitest file under `capability/model/tests`; import only the public contract. For a regression assertion, expect `ok` to be false in both cases. Actual observed results were `ok:true` in both cases, with the unknown own field omitted from the first output.

```ts
import { validate } from '../contract/index.js';
const base = () => ({
  schemaVersion: 1,
  id: 'demo',
  revision: 0,
  title: 'Demo',
  theme: {
    id: 'paper', version: '1.0.0',
    digest: `sha256:${'a'.repeat(64)}`,
    roles: ['neutral'],
  },
  arrangement: { algorithm: 'grid', constraints: [] },
});
const hidden = Object.defineProperty(base(), 'unsupported', {
  value: 'silently lost', enumerable: false,
});
const exotic = Object.assign(Object.create(Array.prototype), base());
console.log(validate(hidden)); // actual ok:true; value has no unsupported field
console.log(Array.isArray(exotic), validate(exotic)); // actual false, ok:true
```

## Verification and limits

Temporary `implementation-audit-probe.test.ts` ran six named in-process probe groups through the public index on Node 24.13.0 / existing Vitest 5.0.0. Final command: `pnpm exec vitest run capability/model/tests/implementation-audit-probe.test.ts --disableConsoleIntercept --reporter=verbose`; six passed, approximately 420ms. Acceptance findings above were logged and verified against expected spec behavior; passing the observation probes does not mean those inputs satisfy the spec. The first sequence diagnostic assertion incorrectly expected an exact parent path; the actual diagnostic included the offending order scope. Corrected the audit assertion to check the affected path prefix. This was an auditor expectation error, not a production finding.

Additional independently specified outcomes checked successfully:

- 99,000-element text list accepted; a 100,000-element list plus containing records returns `limit` without a stack overflow.
- Accessor-bearing input rejected.
- Foreign key cascade removes the affected keygroup while retaining its ordinary field; duplicate foreign target/key definitions rejected.
- Represented-group placement transfers to an ordinary appearance; preceding reset prevents placement resurrection.
- Sequence orders may tie in different alt branches; same-branch ties and nonexistent branches reject. Deleting an event participant with cascade removes its events and appearance while retaining the fragment.
- Deleting a represented object with cascade removes its group and clears direct appearance/group membership; no-cascade deletion and ordinary remove reject unresolved references without exposing a candidate.

Discarded suspicion: the 1,000-operation limit is explicitly specified in Doc3-Modules.md:57. The observed 1,001-operation rejection is correct, not a finding.

No permanent tests, implementation changes, dependencies, server, browser or E2E were introduced. Temporary probe source removed before completion. This report does not certify all Model behavior or endorse every builder score; optional rescoring was not attempted. No second audit or post-correction review will be performed.

Completed at 2026-09-11 12:25:50 UTC (4m39s elapsed), before the 12:29:11 UTC eight-minute deadline. Scope complete; remaining time was not used for another audit.
