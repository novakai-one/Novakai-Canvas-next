# Model

Implemented: pure validation and immutable transition planning for schema version 1.

```ts
import { validate, plan } from '@novakai/canvas-model';

const checked = validate(proposedCollection);
const planned = plan(currentSnapshot, [
  { op: 'replace', target: 'objects', value: completeEditedObject },
]);
// Both return { ok: true, value } or { ok: false, error: { code: "validation-failed", diagnostics } }.
```

`validate` accepts an initial document. `plan` validates the base, applies an ordered typed change list, and validates the final candidate. Intermediate references may be forward references. Neither entry writes data, changes a revision, reads a clock, opens a file or imports a UI. Replaying the same snapshot and changes gives an equal result. **Authoring owns admission, commit, revision increments and crash recovery.** Successful planning is not a committed edit or geometric feasibility approval.

Canonical records cover engineering entities/keys/ports, content blocks, shared objects, section appearances/groups, labelled relationships, tree/state/flow/sequence/story/grid modes, exact asset/theme bindings and authored layout overrides. Generated geometry belongs outside Model.

Outside imports use `contract/index.ts` or the exported capability name. Core stays private. No I/O ports or adapters are manufactured for this pure capability. Record schemas are strict and reject unsupported fields; branded ID schemas offer `safeParse` for checked construction.

Specs: `260911-Canvas-Next/capability/model` in the playbook-library vault. The precise path and measured counts are recorded in `quality/acceptance-evidence/model-build.md`. Actual file inventory and standards evidence are in `quality/file-reviews/model.md`.

Run from repo root: `pnpm check`. This executes strict type checks, ESLint (Sonar maximum 2), import/cycle checks and 18 public contract tests. No E2E, server or browser tests.
