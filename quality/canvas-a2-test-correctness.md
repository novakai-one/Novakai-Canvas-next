# Canvas A2 test-correctness audit

One bounded audit pass; three challenges only. Targets: `capability/canvas/tests/react-bindings.test.tsx`, `drafts.test.ts`, and `scene.test.ts`. Required oracles come from Canvas Doc5 and `quality/canvas-test-budget.md`. No implementation fixes, new test cases, or E2E were added. These findings concern contract assertions, not visible-browser acceptance.

## Verified findings

| Category | Assertion line | Concrete counterexample | Evidence |
|---|---|---|---|
| engineering violation | `capability/canvas/tests/drafts.test.ts:65–68` (case 6) | Resizing alpha to world `{x:140,y:250,width:160,height:80}` must finish with parent-local `{x:40,y:50,width:160,height:80}` because its parent origin is `{x:100,y:200}`. An implementation emitting world x/y for every resize remains green. The existing assertion checks only minimum dimensions on an unchanged draft and never finishes a changed resize. Thus it does not establish the frozen resize coordinate oracle. | In-memory mutation of `core/drafts/finish.ts:22` added `x:entry.box.x,y:entry.box.y` after `...position`, leaving movement unchanged. All 9 tests across the three target files passed (1.27s). Existing literal geometry and `localPlacement` origin subtraction establish the correct coordinates. |
| engineering violation | `capability/canvas/tests/scene.test.ts:19–25,40–45` (case 8) | Display A/revision 0, request C/revision 2/generation 2, then receive C with the same collection/revision/inputKey but generation 1: this must reject. Removing both inputKey and generation comparisons lets that stale result replace A, yet the test stays green because its rejected B also has a different revision; its final rejection independently uses an older revision. Neither isolates stale generation/hash. | In-memory mutation of `core/scenes/accept.ts:14–15` replaced both comparisons with `true`. All 9 tests passed (1.34s). `core/drafts/reconcile.ts:31–41` uses this equality to gate replacement and then installs the received stamp, proving the stale-generation consequence. |
| major build risk | `capability/canvas/tests/react-bindings.test.tsx:94–105` (case 16) | A mounted CanvasSurface can omit `onNodeDragStart`, `onNodeDrag`, and `onNodeDragStop` entirely while every existing drag/cancel assertion passes. They call a separately created private interaction handler before mounting Surface, so they do not substantiate the required actual binding translation from React Flow to session intents. | In-memory mutation of `adapters/react-flow/CanvasSurface.tsx:60` preserved the interaction prop spread but overrode all three drag props to `undefined`. All 9 tests passed (1.21s). Test lines 72–105 invoke the standalone handler; Surface is first mounted at 117. This is a wiring contract gap, not a request for E2E or browser-usability certification. |

## Reproduction and boundaries

Baseline command, also used unchanged for each mutation except the temporary config option:

```sh
pnpm exec vitest run capability/canvas/tests/react-bindings.test.tsx capability/canvas/tests/drafts.test.ts capability/canvas/tests/scene.test.ts
```

Baseline: 3 files / 9 tests passed in 1.34s. Each mutant ran separately against the same 9 cases via an external temporary Vite config with an `enforce: 'pre'` transform. The transform required its exact source anchor, logged that it applied, and replaced source only in memory. Original test and implementation files were never changed. Temporary configs were deleted after recording the evidence; only this report was written in the repository.

Address findings by strengthening the relevant existing cases within the frozen total 16; no additional test-count recommendation. This audit does not claim the current implementations contain the injected faults. It demonstrates three verified false-green gaps in their promised assertions. No re-audit performed.
