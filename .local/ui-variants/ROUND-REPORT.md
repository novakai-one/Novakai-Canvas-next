# ROUND REPORT — module chrome variants, builder round 2

## Outcome

Post-audit correction (2026-09-15): the original all-eight-done claim was incorrect. [AUDIT.md, B/C1–C3](AUDIT.md) found inherited-key fallback failure, flattened originating errors and unsupported completion/quality claims. `917f4d7` fixed chrome/policy selection; `c5a8776` preserved typed owner Result errors, but did not finish the native provider edge. [VERIFY.md, C2/C3 and V1/V2](VERIFY.md) confirmed C1 and compatibility checks, found native `ENOENT`/path still confined to prose, and rejected this report's claim that the scoped fixes passed. Both audits remain unchanged.

`7c322ef` (`fix(cli): structure provider-edge error detail`) adds strict readonly provider detail populated from native error fields: branded `path`, raw `systemCode`, and `syscall`. Fresh missing-collection JSON exposes `ENOENT` and the exact failing path under `error.source.detail`, retaining `provider-failed`; the invalid-theme owner's complete JSON remains unchanged. `pnpm check` (70 files / 208 tests), `pnpm tokens:check`, and all eight fresh Paper SVG/PNG baseline comparisons pass. The report-truth correction is the separate `docs: correct round report after second audit` commit listed with final proofs in [FIX2-REPORT.md](FIX2-REPORT.md). These results close the two FIX2 findings; they do not establish full-sheet or companion-section visual acceptance, which remains incomplete. Nothing was pushed and main was not changed.

- `card` retains the original SVG bytes for **all four showcase sections**; the main paper PNG is also byte-identical.
- `onyx` selects a real parametric folder-tab silhouette, tinted header, muted monospace body, dark navy surface and distinct runtime/external ink.
- `blueprint` selects a white rounded card, role-colored left stripe, restrained token-based shadow, tinted header, an EXPORTS compartment label and blue runtime imports.
- Unknown chrome names now fall back to card measurement and rendering, including the audit-discovered `constructor` key (fixed in `917f4d7`, with regression and live card-equality proofs). An injected registry controls the component and React-free heading policy. Chrome receives shared measured heading content so it can place the title; body blocks, ports, badges and markers stay shared.
- The production CLI is `apps/cli/cli/render.ts`, reached through `pnpm render:png`. It uses the actual owner pipeline, accepts source paths/shipped collection IDs/recipe IDs, admits theme files, exports all sections, and reports pins and inspection evidence as JSON.

## Done-condition ledger

| Condition | Evidence |
|---|---|
| 1. Required checks green | `pnpm check`: 70 test files, 208 tests after the fixes; typecheck, lint, formatting and architecture pass. `pnpm tokens:check` also passes. Fresh FIX2 outputs are pasted in FIX2-REPORT.md; earlier outputs below and in FIX-REPORT.md are historical. |
| 2. Injected chrome seam | `NodeChromeRegistry` in Presentation react-types; composition binds CardChrome, FolderTabChrome and AccentStripeChrome; NodeContent delegates frame/header and keeps shared bodies. The existing rendering suite now exercises ordinary unknown and `constructor` fallback in measurement and direct rendering; the latter failed before `917f4d7`. |
| 3. Token ownership | No added hex, px or percent style literals in Presentation diff. New elevation, chrome geometry, role header/secondary ink and wire tokens project through Design System; tokens:check passes. |
| 4. Existing looks unchanged | Empty SVG diff, all four before/after theme digests printed below; all four paper section SVGs equal, main PNG also equal. |
| 5. Headless CLI works | Exact `pnpm render:png -- --collection … --theme … --out …` interface and `--theme-file`/`--format svg` exercised. Media fixture and unavailable original theme override were exercised in the builder round. After `c5a8776`, typed owner Result errors remain unchanged under `error.source`. VERIFY.md confirmed that preservation but found native provider code/path still lost. `7c322ef` adds structured native detail; FIX2-REPORT.md pastes fresh before/after missing-collection and invalid-theme JSON. |
| 6. Acceptance artifacts inspected | All six named SVG/PNG outputs exist. Fresh Paper SVG/PNG and Onyx/Blueprint PNGs retain the baseline/manifest bytes. Module-look overview and reading-scale fallback/legend inspections are recorded in FIX-REPORT.md. Full-sheet/companion benchmark acceptance is not claimed. |
| 7. Local commits, clean tree | The eight builder commits below and the first fix-round commits in FIX-REPORT.md are historical. FIX2-REPORT.md lists the two new commits and final empty `git status --porcelain` evidence. |
| 8. Report | This ledger acknowledges AUDIT.md and VERIFY.md, including the second audit's remaining provider defect and completion overclaim. Both audits are unchanged. FIX2-REPORT.md contains the new bounded proofs; earlier reports are historical evidence. |

The accompanying [source review](SOURCE-REVIEW.md) evaluates all 45 changed first-party TypeScript/TSX files against the sixteen principles, with evidence and explicit deductions. Its original headless typed-error score was invalidated by B/C2. The first fix-round headless review (145/160) did not establish the missing native evidence later found by VERIFY.md C2. FIX2-REPORT.md re-reviews only the two source files changed by `7c322ef`; the other rows remain historical self-review, not a new independent audit. Cognitive complexity <=2 is enforced by the passing lint run. No new test files were added.

## Acceptance renders

The fixture is the unchanged `resources/examples/showcase/repo-architecture.canvas`. It contains 17 module nodes across its sections; the largest module section, `map`, contains 13. Root aliases below point to that section. All four sections also exist under `out/card/`, `out/onyx/` and `out/blueprint/`.

- [card.svg](out/card.svg) · [card.png](out/card.png)
- [onyx.svg](out/onyx.svg) · [onyx.png](out/onyx.png)
- [blueprint.svg](out/blueprint.svg) · [blueprint.png](out/blueprint.png)
- Reading-scale comparisons: [Onyx legend](out/onyx/legend.png) · [Blueprint legend](out/blueprint/legend.png)
- [Artifact byte counts and SHA-256 hashes](artifact-manifest.json)

### Visual review

**Matches:** folder-tab outline is actual SVG geometry, not a rounded rectangle with decoration; both new looks omit MODULE; dark headers and muted body copy establish a clear hierarchy; the light spine, header compartment and low-opacity elevation match the light target family. Actual pinned JetBrains Mono and Inter Tight bytes are used. Shared open-arrow markers, surface-colored label capsules and dashed external lines remain legible. Companion `paths` renders also demonstrate dark green/light green group tinting.

**Differences from the references:** this is the repository dependency fixture, not a replica of the reference's capability/model sheet. Its authored `direction=right gap=roomy` makes the map very wide. It does not contain the reference's contract/core bands or right-hand change-contract panel. Folder headers are left-aligned, and the exact palette and font scale are original rather than pixel copies. At reading scale the new module treatments are in the same visual family; fit-to-width thumbnails necessarily make a thirteen-module-wide map small.

**Benchmark scope:** the requested target is the largest modules section. It has no group panels, so the group-panel empty-area floor has no applicable panels there. The real Layout arrange path independently inspects scenes before returning success; all reports have zero diagnostics and no relaxed constraints. The budgeted crossings in `map` are 3 for Paper, 5 for Onyx and 4 for Blueprint, not three for every theme. The custom Onyx-token card/fallback control has 6 crossings, also within the dense-map budget. Inspection of the module target found no new label collisions or clipped module content. These observations do not certify the companion sections. The broader `paths`/sequence companion sections are smoke outputs. Blueprint `paths` retains text overhang at Language and Design System and the “Valid and planned?” diamond, plus generous panel whitespace. Full-sheet packing and companion flow/diamond/sequence polish remain incomplete and outside this fix scope.

| Look | Module text/fill minimum | Stroke/fill minimum | Heading/body minimum | MODULE kickers | Crossings | Relaxed |
|---|---:|---:|---:|---:|---:|---:|
| card | 16.29:1 | 6.36:1 | 1.43 | 13 | 3 | 0 |
| onyx | 8.40:1 | 4.54:1 | 1.35 | 0 | 5 | 0 |
| blueprint | 6.80:1 | 5.70:1 | 1.35 | 0 | 4 | 0 |

The required floors are text/fill >=4.5:1, stroke/fill >=3:1, heading/body >=1.3, and dense-map crossings <=6. Header rules are intentional compartment separators. Measurements come from actual exported SVG attributes, retained in [visual-evidence.json](visual-evidence.json).

## Compatibility proof

Before renderer changes, the retained real-pipeline harness rendered the exact showcase fixture under paper. `baseline/map.svg` was copied to `baseline/paper.svg`. The first harness failure was corrected by retaining the pinned theme resource alongside its fonts; neither fixture nor rendering code was changed for that capture.

```sh
# Before any renderer change (harness now archived as .ts.txt):
node --import tsx .local/ui-variants/render-harness.ts resources/examples/showcase/repo-architecture.canvas paper .local/ui-variants/baseline

# Final production pipeline:
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme paper --format svg --out .local/ui-variants/out/card
cp .local/ui-variants/out/card/map.svg .local/ui-variants/out/paper-after.svg
diff -u .local/ui-variants/baseline/paper.svg .local/ui-variants/out/paper-after.svg
```

Diff output (empty; exit 0):

```text
```

The same byte comparison passes for `map`, `legend`, `paths` and `create`. `baseline/map.png` and `out/card.png` are also byte-identical.

| Preset | Before digest | After digest |
|---|---|---|
| paper | `364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0` | `364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0` |
| ink | `b8609fec385a0dd384b1fc2f6fdb94b6b65991738300ff25fdc76dee3979db7a` | `b8609fec385a0dd384b1fc2f6fdb94b6b65991738300ff25fdc76dee3979db7a` |
| atlas | `1e32aee786d8a30f54883423a2d5cc6df36ca5446f040342e30d390a5aa8c3c9` | `1e32aee786d8a30f54883423a2d5cc6df36ca5446f040342e30d390a5aa8c3c9` |
| studio | `3cd02b91b5190fb0dcb18f0a045e714b43b71dcbe17778802722eb13cc2dacd0` | `3cd02b91b5190fb0dcb18f0a045e714b43b71dcbe17778802722eb13cc2dacd0` |

Raw records: [before](baseline/digests.json) · [after](digests-after.json).

Existing presets preserve absence of `chrome`; extension defaults do not enter their serialized payloads. Missing legacy tokens still reject, and canonical derived-value equality and exact font manifests remain checked. No Model pin validation was weakened.

### Literal and protected-scope checks

```sh
git diff bd28500 -- capability/presentation | rg '^\+.*(#[0-9a-fA-F]{3,8}|[0-9]+px|[0-9]+%)'
git diff --name-only bd28500 -- capability/model capability/layout
```

Both outputs were empty. The first command's exit 1 is ripgrep's “no matches” result. Additional code inspection confirms new padding, radii, stripe widths, shadow extents and colors come from the resolved style. Geometric origin/half/double arithmetic and validation bounds are not new style constants. Existing marker code and the original Card frame arithmetic were preserved.

## Commands and additional verification

```sh
pnpm tokens:build
pnpm check
pnpm tokens:check

pnpm render:png -- --collection repo-architecture --theme paper --format svg --out .local/ui-variants/out/card
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme paper --out .local/ui-variants/out/card
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme-file resources/onyx.theme --format svg --out .local/ui-variants/out/onyx
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme-file resources/onyx.theme --out .local/ui-variants/out/onyx
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme-file resources/blueprint.theme --format svg --out .local/ui-variants/out/blueprint
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme-file resources/blueprint.theme --out .local/ui-variants/out/blueprint

pnpm render:png -- --collection resources/recipes/er.canvas --theme-file resources/onyx.theme --format svg --out .local/ui-variants/er-onyx
pnpm render:png -- --collection resources/examples/agent-diagrams/pr3/deployment.canvas --theme paper --out .local/ui-variants/media-smoke
```

The historical builder smoke commands listed above succeeded. The ER smoke has zero warnings and retains non-module notation. The media smoke stages a real SVG asset and overrides the fixture's unavailable `ember` theme with paper; its inspection has zero warnings. Theme overrides use parser-provided spans in a transient source copy before ordinary lowering, so an unavailable prior theme does not prevent a requested override.

Resource reads use the normal bounded/confined CLI reader. Temporary Assets are closed and removed. Export's resource inspector rejects bytes or metadata differing from the owner-admitted snapshot. No server, workspace mutation, external publication or OS-font fallback is used.

### Historical builder `pnpm check` output (fresh FIX2 output: FIX2-REPORT.md)

```text
$ pnpm typecheck && pnpm lint && pnpm format:check && pnpm architecture && pnpm test
$ tsc --noEmit
$ eslint .
$ prettier --check "capability/**/*.{ts,tsx}" "apps/**/*.{ts,tsx}" eslint.config.js .dependency-cruiser.cjs
Checking formatting...
All matched files use Prettier code style!
$ depcruise capability apps --config .dependency-cruiser.cjs --output-type err

✔ no dependency violations found (879 modules, 2117 dependencies cruised)

$ vitest run capability apps

 RUN  v5.0.0 /Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants

(node:6481) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6483) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6484) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6483) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6484) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6481) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6483) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6484) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6481) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6483) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6481) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6484) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6483) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6504) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6484) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6481) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6483) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6484) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6484) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6481) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6517) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6520) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6522) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6525) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6526) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6527) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6538) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6534) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6542) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6543) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6539) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6540) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6552) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6553) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:6558) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

 Test Files  70 passed (70)
      Tests  207 passed (207)
   Start at  10:05:50
   Duration  16.98s (tests 75%, import 14%, transform 10%, environment 2%)
```

### Historical builder `pnpm tokens:check` output (fresh FIX2 output: FIX2-REPORT.md)

```text
$ node --import tsx capability/design-system/cli/build-tokens.ts --check
{"ok":true,"value":{"generation":"d3bfdf1ae855b6f6d370f11db1ab254891a5570b2ae05f5ff4ec0e0020ceef20","version":"1.1.0","files":[{"path":"adapters/styles/tokens.generated.css","hash":"27435cb7e843e64183d8edda25ba081450540632a18ca10fc9b50e253767e2a9"},{"path":"adapters/styles/semantics.generated.css","hash":"b1681e3874b363868918d58bca4cbfbe6c1820dd849fb3e4cd539d3065acce8a"},{"path":"adapters/styles/themes.generated.css","hash":"53ca58849e49ae2e062a2d92740c7ff9ef29e1e4562036116b5725c144f9778e"},{"path":"adapters/styles/preferences.generated.css","hash":"75a6b6821e88036e2c47b4eb84b44d3157459b49e7e64c9d43fc3dc18674c5b7"},{"path":"adapters/styles/layout.generated.css","hash":"27569ca67b877f89d59ad4248d2ec70382ad039fcfce69ce50709a4b4fdd3c18"},{"path":"contract/generated/token-names.ts","hash":"91e083954b36541fde687617231d5f1f0fa170addedd7f46fd0776feb2903872"},{"path":"contract/generated/breakpoints.ts","hash":"4dbecc2053787669535f22975cd45b51664fae9765432b209f8369f63bdad754"}]}}
```

## Files changed, grouped by package

### apps/cli

- `apps/cli/adapters/headless.ts`
- `apps/cli/adapters/theme-config.ts`
- `apps/cli/cli/render.ts`
- `apps/cli/contract/compose.ts`
- `apps/cli/contract/index.ts`
- `apps/cli/contract/records/headless.ts`
- `apps/cli/contract/theme-reader.ts`

### apps/service

- `apps/service/adapters/builtin-files.ts`
- `apps/service/adapters/theme-preparation.ts`
- `apps/service/contract/compose.ts`
- `apps/service/contract/index.ts`
- `apps/service/contract/records/presets.ts`
- `apps/service/contract/records/render-resources.ts`
- `apps/service/contract/records/theme-input.ts`

### capability/design-system

- `capability/design-system/adapters/styles/preferences.generated.css`
- `capability/design-system/adapters/styles/semantics.generated.css`
- `capability/design-system/adapters/styles/themes.generated.css`
- `capability/design-system/adapters/styles/tokens.generated.css`
- `capability/design-system/contract/generated/token-names.ts`
- `capability/design-system/contract/records/portable-schema.ts`
- `capability/design-system/contract/records/resolved.ts`
- `capability/design-system/contract/records/scope-schema.ts`
- `capability/design-system/contract/records/theme.ts`
- `capability/design-system/core/themes/admit-data.ts`
- `capability/design-system/core/themes/chrome.ts`
- `capability/design-system/core/themes/diagram.ts`
- `capability/design-system/core/themes/portable.ts`
- `capability/design-system/tokens/definitions.tokens.json`
- `capability/design-system/tokens/semantics.tokens.json`

### capability/presentation

- `capability/presentation/adapters/react/AccentStripeChrome.tsx`
- `capability/presentation/adapters/react/CardChrome.tsx`
- `capability/presentation/adapters/react/FolderTabChrome.tsx`
- `capability/presentation/adapters/react/NodeContent.tsx`
- `capability/presentation/contract/api.ts`
- `capability/presentation/contract/compose.ts`
- `capability/presentation/contract/index.ts`
- `capability/presentation/contract/react-types.ts`
- `capability/presentation/contract/records/chrome.ts`
- `capability/presentation/contract/records/content-context.ts`
- `capability/presentation/contract/records/style.ts`
- `capability/presentation/contract/records/visual.ts`
- `capability/presentation/contract/types.ts`
- `capability/presentation/core/content/chrome.ts`
- `capability/presentation/core/content/composition.ts`
- `capability/presentation/core/content/headings.ts`
- `capability/presentation/core/notation/chrome.ts`
- `capability/presentation/core/projection/collection.ts`
- `capability/presentation/core/projection/node.ts`
- `capability/presentation/core/projection/section.ts`
- `capability/presentation/tests/rendering.test.ts`

### capability/templates

- `capability/templates/contract/records/preset.ts`

### docs

- `docs/maintenance/module-chromes.md`

### package.json

- `package.json`

### resources

- `resources/blueprint.theme`
- `resources/onyx.theme`

## Deviations and repo corrections

1. **Corpus count:** the brief says 25 snapshots; the actual export corpus asserts **24 admitted scenes** in `capability/export/tests/corpus.test.ts:76`. That unmodified corpus passes. It checks current encoding against retained scene data; the separate SVG/PNG byte comparisons provide the exact legacy-render proof.
2. **CLI location:** the production entry is under `apps/cli/cli/`, rather than the brief's example `capability/export/cli/`. Cross-capability resource preparation belongs at the host boundary, and this avoids Export depending back on the service. All cross-package imports use public contract/index surfaces.
3. **Token command launch:** existing tsx CLI launch fails on sandbox IPC sockets. The two token package scripts now use `node --import tsx`, as does the render command. No dependency was missing.
4. **Checks:** this repo's `pnpm check` does not include tokens:check. Both were run explicitly and passed. Initial service transport tests needed local socket permission; the approved unrestricted local check run passed. The Git worktree stores its index in the parent repository metadata directory, so local commits likewise needed the permitted metadata write.
5. **Harness:** the retained harness needed a pinned preset resource in the Export snapshot. It was corrected before capturing the baseline, then productized with contract types and proper bindings. The diagnostic source is archived as `render-harness.ts.txt` because leaving its original untyped, private-import TS file in `.local` causes the repo-wide lint command to inspect it. The production tool is not in `.local`.
6. **Template compatibility:** adding ordinary default tokens would change every preset digest. Extension namespaces are opt-in for serialized presets and separately hydrated for legacy resolution. Optional chrome means a semantic card default, not a `.default('card')` insertion into existing hashed payloads.
7. **Theme grammar:** explicit `set dimension` support was added because the existing `set number` grammar represents scalar values; dimensional shadow metrics require the owner's `{value, unit:'px'}` envelope. Header and secondary role tints, shadow bounds and separate wire ink are token-owned.
8. **Reference labeling:** `gold-standard-modules.png` is described as a dark full-sheet target but is visibly a light image. The dark palette follows `capability-model-redrawn.png`; the light palette/treatment follows `codex-module.png`. No target/reference files were changed.
9. **Review process:** maintenance guidance asks for a fresh review agent, but AGENTS.md prohibits subagents unless the user specifically requests them. No delegation was requested. I performed the overview/reading-scale review and second refinement pass myself and do not claim an independent reviewer participated.
10. **Fixture geometry:** the required fixture has a wide ungrouped module map, not the reference's layered full sheet. It rendered successfully, so it was retained, not substituted or re-authored. Model policies, Layout algorithms, wire routing, marker geometry and the original approved references are untouched.

## Known gaps and limits

- The pre-existing Inter subset still lacks U+2192; the modules recipe was not changed or used as the baseline. Glyph rejection remains strict.
- The main fixture's wide composition and the unrelated flow/diamond/sequence polish remain. This work delivers reusable module chrome, not a re-layout of the reference sheet or the repository showcase.
- Bare IDs resolve shipped collections or admitted recipes; live workspace lookup is not part of this read-only command. Use a `.canvas` path for other collections.
- The source review is an evidence-backed self-review, not an independent audit. Native I/O and fixed orchestration steps retain explicit score deductions.
- AUDIT.md led to `917f4d7` (constructor fallback) and `c5a8776` (typed owner Result preservation). VERIFY.md then found the remaining native code/path loss and this report's completion overclaim. `7c322ef` supplies native provider detail; this docs correction withdraws the overclaim and records the second audit. FIX2-REPORT.md proves only the two requested fixes and their specified regression checks. Full-sheet and companion visual polish remain incomplete; module-look acceptance does not certify those broader benchmarks.

## Commit sequence and clean status

```text
2156dbc feat(themes): add opt-in module chrome tokens and presets
ac82ab8 feat(presentation): inject module chrome and heading policies
943f100 feat(cli): render theme overrides through the real export pipeline
9573488 refine(presentation): validate chrome styles and separate wire inks
6822928 refine(cli): preserve source pins and verify headless resource lifetimes
7a21d47 docs: describe module chrome and headless render contracts
b3e350e refine(themes): use readable secondary ink for module bodies
95070ac refine(presentation): delegate measured heading placement to chrome
```

```sh
git branch --show-current
# ui/module-variants

git status --porcelain
# (empty)
```

The original round used ignored local evidence. The fix brief now requires a docs commit for ROUND-REPORT.md, SOURCE-REVIEW.md and the REMEDIATION-REPORT.md correction; only those reports are explicitly tracked. Fresh proof logs, themes and FIX-REPORT.md remain ignored local evidence. No push was performed.
