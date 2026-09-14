# Design System A2 assertion correctness

Single bounded audit, 2026-09-12. Exactly five targets: `tokens.test.ts`, `themes.test.ts`, `artifacts.test.ts`, `primitives.test.tsx`, `panels.test.tsx` under `capability/design-system/tests`. Fixtures, capability implementation and Doc5 were evidence only. No source/test files were edited and no tests were added. Three counterexamples were attempted; no additional audit round is requested. Browser UX remains Part2.

The unchanged baseline passed all 14 cases / five suites (739ms). One existing assertion admits a concrete false positive. This is an assertion defect demonstrated against a temporary runtime mutant, not a claim that the shipped component currently loses drafts. Parent reproduction is required before accepting the finding.

| Category | Location | Finding and bounded correction |
|---|---|---|
| engineering violation | `capability/design-system/tests/panels.test.tsx:78`, case12 | The final retained-draft assertion reads the original `draft` DOM reference after reopening. A detached input still retains its JS `value`, so this assertion passes when the current mounted input has lost the draft. Re-query `screen.getByLabelText('content draft')` after reopening and assert its value is `Unsaved`; asserting it is the original node also directly checks the stated mounting guarantee. Strengthen this existing case; retain the 14-case budget. |

## Three attempted counterexamples

1. **Panel remount on reopening — escaped.** A temporary Vite transform adds a `useRef` generation counter to `PanelSectionBody`, incrementing only on a collapsed-to-expanded transition, and keys the body div with that generation. Collapse and reorder preserve the original node until reopening; reopening replaces the live input. All existing assertions in all 14 cases still pass. Diagnostic instrumentation, without modifying any assertion, prints `{ oldConnected: false, oldValue: 'Unsaved', liveValue: 'content' }` immediately before line78. The asserted reference is detached while the visible draft is reset.
2. **Tabs unmount inactive content — caught.** A temporary transform removes `forceMount` from the `keepMounted` branch. Case11 fails at `primitives.test.tsx:122`, `document.body.contains(draft)`, receiving false. Its retained-content assertion rejects this concrete counterexample.
3. **Stale scope lease overwrites newer generation — caught.** A temporary transform removes the stale-generation guard from installer cleanup. Case13 fails at `panels.test.tsx:115`, receiving `restored: true` instead of false. Its generation-safety assertion rejects this concrete counterexample.

## Reproduction

Temporary read-only transformation config: `/tmp/design-system-a2-probes/vitest.config.mjs`. It changes in-memory modules only, and contains all three probes. From the repository root:

```sh
A2_SCENARIO=panel-reopen pnpm exec vitest run capability/design-system/tests/panels.test.tsx --config /tmp/design-system-a2-probes/vitest.config.mjs --reporter=verbose
A2_SCENARIO=tabs-unmount pnpm exec vitest run capability/design-system/tests/primitives.test.tsx --config /tmp/design-system-a2-probes/vitest.config.mjs --reporter=verbose
A2_SCENARIO=stale-cleanup pnpm exec vitest run capability/design-system/tests/panels.test.tsx --config /tmp/design-system-a2-probes/vitest.config.mjs --reporter=verbose
```

The first command passes both cases and logs the lost live draft. The latter two commands each fail the named assertion. The panel mutant also passed the full five-suite/14-case Design System run in 1.03s. No other incorrect assertion was established within this audit.
