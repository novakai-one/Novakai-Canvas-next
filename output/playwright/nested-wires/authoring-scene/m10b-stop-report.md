# M10b STOP — extraction crossed the repository-source boundary

The mission stopped before testing the routing engine. This is a defect in the new extractor, not evidence of an engine routing defect.

Base: `b93910a`, branch `feat/m10b-dogfood`. Worktree existed and was clean at dispatch. `pnpm install` completed successfully. No server was started, no browser was opened, and no ports were touched.

## Finding and reproduction

`pnpm exec tsx apps/web/cli/extract-authoring-scene.ts` printed:

```text
EXTRACTED files=1973; nodes=1973; sections=173; wires=1297; excluded type-only imports=1574; excluded type symbols=2159; external value imports=1887
```

`git ls-files 'capability/authoring/**/*.ts'` identifies **47** repository source files. The provisional manifest contains those 47 plus **1,926 installed-dependency files**, all reached under `node_modules`. The extractor's recursive `readdirSync` traversed installed links, so its `files=nodes` equality is not a valid independent completeness proof. See `extraction-stop-evidence.json` for exact counts, source paths, and extra-path examples.

The provisional `scene-spec.json` and `extraction-manifest.json` are preserved as produced. They are **invalid mission inputs**, not the real Authoring scene requested. They have not been fed to the layout engine. No data was pruned or tuned after this finding.

## STOP authority

The brief permits iteration only on failures that are both in touched files and mechanically verifiable as lint, typecheck, formatting, or cognitive complexity. This source-scope defect changes extraction behavior and falls outside that allowance. The brief says: “Any gate failure, or the real data breaking the engine: STOP with evidence.” Work stopped when the extraction mismatch was established.

A prior cognitive-complexity failure in the new extractor (3 versus the limit of 2) was corrected within the explicit allowance. The extractor then passed targeted ESLint and the project typecheck before extraction. Subsequent scene wiring is provisional and has not been validated. No existing product source was repaired or any gate weakened.

## Completion status

- Created provisional extractor, generated spec/manifest, and `?authoring` scene wiring; left uncommitted for review.
- Failed repository-source scope: 1,973 extracted nodes versus 47 tracked Authoring `.ts` files.
- Not reached: ten-wire spot check, extraction/build determinism, engine invariant verification, operation counts, five-load median, captures, source scoring, full `pnpm check`, commits, push, PR.
- No claim of 208 passing tests, legal routing, selection-label correctness, or scaling is made.
- Scales or compounds? **Not measured: extraction failed before a valid real-data scene could be evaluated.**

## HUMAN EXPERIENCE REVIEW

No rendered scene was inspected. Attention, focus, clutter, and reference-image fidelity are unassessed. The concrete semantic contradiction is that installed dependencies were represented as if they were files owned by Authoring. Presenting that scene would mislead a reader about the capability's structure and connections; screenshots of it would not satisfy the mission.

The next action requires a dispatch that authorizes correction of this extractor behavior. No implementation work continued after the STOP finding.
