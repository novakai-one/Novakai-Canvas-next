# M10b Amendment 1 — STOP: real empty directories cannot be placed

Amendment 1 fixes the original extraction defect: **47 extracted nodes = 47 independently found `.ts` files**. The faithful directory tree then fails the existing engine before routing. No directory was removed, no placeholder node was introduced, and no engine or gate was changed.

Branch: `feat/m10b-dogfood`. Base: `b93910aa1ec0dd2a1759266d1337b20b91a72b3c`.

## Finding

The unchanged verifier used by the scale scene exits **1** from `createNestedRoadScene`:

```text
RangeError: Nested sections require at least one node or child section
capability/layout/core/prototype-nested-placement.ts:55
```

The real capability contains these directories, each holding only `.gitkeep` and therefore having no TypeScript node or child section:

| Section | Real directory |
| --- | --- |
| 7 | `capability/authoring/core/commit` |
| 10 | `capability/authoring/core/preparation` |
| 11 | `capability/authoring/core/receipts` |

The extracted spec preserves all three. Section 7 is the first empty section in traversal order. The placement engine rejects this input before a completed scene or routed wires exist. This establishes an empty-section limitation; it does **not** establish whether the 119 real import relationships can route legally.

Reproduce from the worktree root:

```sh
pnpm exec tsx apps/web/cli/extract-authoring-scene.ts
pnpm exec tsx output/playwright/nested-wires/authoring-scene/verify-extraction.ts
pnpm exec tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs "$(cat output/playwright/nested-wires/authoring-scene/amendment1-verifier-config.json)"
```

See [verifier output](amendment1-invariant-output.txt), [structured failure evidence](amendment1-stop-evidence.json), and [exact verifier configuration](amendment1-verifier-config.json).

## Completed evidence

- `pnpm install`: exit 0.
- Walk now uses nonrecursive `readdirSync({withFileTypes:true})` with explicit descent, skips symbolic links and `node_modules`, and asserts real paths remain under the Authoring root.
- Import resolution uses only the symlink-free file inventory. Bare packages and unresolved/out-of-tree imports are recorded in `manifest.external`; no external nodes or wires are created.
- **47 nodes / 15 real directories / 119 value-import wires / 20 external imports.** Independent `find capability/authoring -name '*.ts' -not -path '*/node_modules/*'` count: **47**. The verification script compares full file lists as well as counts.
- Every wire matches an actual import declaration at its recorded file:line, source text, and imported symbol list. Ten deterministically pseudorandom wires are printed. **0 bare wire-ID labels; 0 type-only wires; 111 type-only declarations and 231 type symbols excluded.** See [manifest gates](amendment1-manifest-gates.txt).
- Two extractor runs produced byte-identical spec and manifest. See [hashes](amendment1-determinism-output.txt).
- New/touched product source passed targeted ESLint and project typecheck before extraction. The provisional scene's optional-label type error was corrected under the mechanical allowance.
- The evidence verifier passed ESLint, including the cognitive-complexity rule, and an explicit strict TypeScript check with Node types; evidence files are outside the root tsconfig include.
- **`pnpm check`: exit 0; 70 test files, 208 tests passed.** Includes project typecheck, `eslint .`, formatting, architecture and tests. See [complete output](amendment1-pnpm-check-output.txt).
- Existing/default scene choices remain unchanged; `?authoring` wiring is provisional and unrendered.

The generated `scene-spec.json` and `extraction-manifest.json` now describe the corrected 47-file input. The older `m10b-stop-report.md`, `extraction-stop-evidence.json`, and `candidate.patch` remain Run 1 history; they do not describe this corrected extraction.

## Literal STOP and unfinished DoD

The brief says: “Any gate failure, or the real data breaking the engine: STOP with evidence.” Product-behavior failures are explicitly outside the self-correction allowance. Work stopped at the placement rejection; subsequent activity only recorded this evidence.

Not reached: two successful scene builds and byte identity, routing/crossing/overlap/boundary/corridor/body/continuity gates, operation counts, five-load median, all four requested captures, source-contract scoring, commits, push, or PR. No completion or >144/160 source-score claim is made. Changes remain uncommitted for the next authorized dispatch.

**Scales or compounds? Not measured: the real directory tree fails placement before routing, compile completion, or browser loads. Missing measurements are unknown, not zero.**

No server or browser was started; no port was touched, including 5197 and every prohibited port. All execution was headless.

## HUMAN EXPERIENCE REVIEW

No rendered scene exists to inspect. Attention, focus, clutter, label readability, selection behavior, and visual-reference fidelity remain unassessed. The source semantics now accurately include all 47 files and retain real directory ownership, but the renderer cannot currently present directories without nodes or child sections. Removing those real directories to obtain a screenshot would contradict the requested scope. A green 208-test suite does not resolve this product limitation.

The next dispatch must resolve how real empty directories are represented before the scene can proceed through the remaining gates. That judgment and any engine change are outside this resume authorization.
