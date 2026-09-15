> Post-audit correction (2026-09-15): this is the historical remediation record. AUDIT.md B/C1–C3 invalidated its blanket quality claim and the headless typed-outcome score below: the prior 8/10 was 0/10 for message-only owner evidence, making that historical total 137/160. Chrome fallback is fixed by `917f4d7`; typed owner evidence by `c5a8776`. Current source scores and complete verification are in SOURCE-REVIEW.md and FIX-REPORT.md. The historical findings and score row remain visible below.

# Remediation report — branch contract typing

## Outcome and scope

Remediated `ui/module-variants` from builder commit `95070ac8dbd7e5d91b1bb78712b565e6d55d1ae3`. Scope is `git diff main`; no main ref, source fixture, theme/token values, dependencies, or existing main-only contract looseness was changed. No new test files. No push.

**Verification:** `pnpm check` passed (70 files, 207 tests); `pnpm tokens:check` passed. All four Paper SVGs are byte-identical (empty recursive diff); all four Onyx and four Blueprint PNGs have matching `shasum` and complete byte equality. Theme pins, inspection records and all preset digests also match.

The mandated new validation rejects malformed new chrome fields (e.g. invalid registry names or noncanonical new colors). Brand parsing does not normalize accepted bytes. “Behavior preserved” here means valid-domain behavior, serialized values and all required render proofs; it does not claim malformed values outside the requested refined contracts are still accepted.

Baseline renders were freshly generated before the first remediation edit and before any remediation commit. Report/proofs are kept in the existing ignored `.local/ui-variants/` workspace, not added to the branch file count.

## Every typing change

- `apps/cli/adapters/headless.ts` — Bare file/directory/report paths → FilePath; SourceFile → inferred strict readonly native envelope; catalog IDs/digests → owner types; partial z.object reads → guarded envelope/field reads; source serialization remains an explicit text edge.
- `apps/cli/adapters/theme-config.ts` — Raw chrome capture → chromeName.parse/ChromeName; new pixel-dimension value → owner PortableToken dimension value vocabulary; dimensionLine input → existing grammar input type.
- `apps/cli/cli/render.ts` — Hand-built typed request → headlessOptions.parse after the existing argv presence/format checks.
- `apps/cli/contract/index.ts` — Exports headlessOptions for the terminal boundary.
- `apps/cli/contract/records/headless.ts` — Handwritten options with bare fields → strict readonly inferred schema with collection/theme/path brands; report digests → Pick<Catalog[number], id | digest>; report files → FilePath[]; documents injected owners.
- `apps/cli/contract/theme-reader.ts` — Documents the intentionally raw UTF-8 grammar boundary and its validation owner.
- `apps/service/adapters/theme-preparation.ts` — Chrome strings → Design System ChromeName; new dimension z.object → strictObject().readonly(); duplicate override/value unions → inferred config member types; chrome projection reads a guarded source envelope.
- `apps/service/contract/records/theme-input.ts` — New chrome string schema → owner chromeName schema.
- `capability/design-system/contract/brands.ts` — Adds documented checked ChromeName (1–60 chars, lowercase registry grammar) and HexColor (canonical six/eight hex digits) schemas and inferred types.
- `capability/design-system/contract/index.ts` — Exports chromeName, hexColor, ChromeName, HexColor and ChromeMetrics through the sole legal capability entry.
- `capability/design-system/contract/records/portable-schema.ts` — New chrome string schema → chromeName.
- `capability/design-system/contract/records/resolved.ts` — ResolvedTokenSet.chrome string → ChromeName.
- `capability/design-system/contract/records/scope-schema.ts` — New resolved chrome string schema → chromeName.
- `capability/design-system/contract/records/theme.ts` — PortableTheme.chrome and StyleProjection.chrome → ChromeName; new Paint.secondary, elevation.color and headers values → HexColor; inline metrics → documented ChromeMetrics interface; header keys retain theme-defined role strings.
- `capability/design-system/core/themes/chrome.ts` — Chrome field output/selector parameters → ChromeName; token extension key → TokenId; checked minting uses the existing typed validation boundary.
- `capability/design-system/core/themes/diagram.ts` — Chrome selector propagation → ChromeName; new colors minted through parsed(hexColor); new token/prefix parameters → TokenId; role and legacy paint return types reuse their existing owner members.
- `capability/presentation/adapters/react/FolderTabChrome.tsx` — Injected outline return string → checked ChromeOutline.
- `capability/presentation/contract/compose.ts` — Built-in keys/caption → checked brands; registry annotation → NodeChromeRegistry; reflected policy keys checked before reuse.
- `capability/presentation/contract/index.ts` — Exports the consumer-owned chromeName and ChromeName for public-contract consumers/tests.
- `capability/presentation/contract/react-types.ts` — NodeChromeRegistry string index → ChromeName index with mandatory card; adds invariants for NodeChrome/registry; React remains declaration-only outside core.
- `capability/presentation/contract/records/chrome.ts` — Handwritten ChromePolicy → strict readonly inferred schema; sectionLabel → checked nonblank branded caption; registry keys → ChromeName; adds documented consumer-owned hex color and serialized outline schemas.
- `capability/presentation/contract/records/style.ts` — New chrome/secondary/header/elevation colors → checked branded schemas; documents open role map and elevation units; existing strict readonly geometry records retained.
- `capability/presentation/core/content/chrome.ts` — Card lookup default → checked ChromeName; policy geometry remains React-free.
- `capability/presentation/core/content/headings.ts` — New kindLabel return string → existing DiagramObject label contract.
- `capability/presentation/core/notation/chrome.ts` — Folder SVG serialization → checked ChromeOutline; exact geometry string unchanged; no React imports.
- `capability/presentation/tests/rendering.test.ts` — New variant fixture selector → checked ChromeName and full style → public resolvedStyle.parse; all prior test expectations preserved.
- `capability/templates/contract/records/preset.ts` — New chrome string → documented consumer-owned open branded registry-key schema; strict readonly theme payload retained.

Consumer contracts duplicate the small ChromeName/HexColor grammar deliberately: core imports its own declaration modules, never a foreign capability. Apps use the Design System public entry. The brands remain structurally compatible across the transport; no runtime adapters or React declarations enter core.

## Required verification outputs

### Full gate

The initial sandbox run passed typecheck, lint, formatting and architecture, then failed two tests at `assert(server.ok)`. A standalone `node:net` loopback-bind probe returned `EPERM`. The complete check was rerun with approved sandbox escalation; no test, timeout, assertion, or application behavior was weakened.

Command: `pnpm check` (exit 0). Complete output:

```text
$ pnpm typecheck && pnpm lint && pnpm format:check && pnpm architecture && pnpm test
$ tsc --noEmit
$ eslint .
$ prettier --check "capability/**/*.{ts,tsx}" "apps/**/*.{ts,tsx}" eslint.config.js .dependency-cruiser.cjs
Checking formatting...
All matched files use Prettier code style!
$ depcruise capability apps --config .dependency-cruiser.cjs --output-type err

✔ no dependency violations found (879 modules, 2130 dependencies cruised)

$ vitest run capability apps

 RUN  v5.0.0 /Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants

(node:8350) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8351) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8353) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8354) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8354) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8353) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8350) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8354) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8353) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8350) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8354) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8350) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8353) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8353) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8354) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8354) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8353) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8350) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8354) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8350) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8411) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8413) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8414) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8420) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8417) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8421) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8426) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8431) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8428) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8436) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8440) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8446) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8443) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8447) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:8450) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

 Test Files  70 passed (70)
      Tests  207 passed (207)
   Start at  10:17:21
   Duration  17.90s (tests 75%, import 14%, transform 9%, environment 2%)

```

Command: `pnpm tokens:check` (exit 0). Complete output:

```text
$ node --import tsx capability/design-system/cli/build-tokens.ts --check
{"ok":true,"value":{"generation":"d3bfdf1ae855b6f6d370f11db1ab254891a5570b2ae05f5ff4ec0e0020ceef20","version":"1.1.0","files":[{"path":"adapters/styles/tokens.generated.css","hash":"27435cb7e843e64183d8edda25ba081450540632a18ca10fc9b50e253767e2a9"},{"path":"adapters/styles/semantics.generated.css","hash":"b1681e3874b363868918d58bca4cbfbe6c1820dd849fb3e4cd539d3065acce8a"},{"path":"adapters/styles/themes.generated.css","hash":"53ca58849e49ae2e062a2d92740c7ff9ef29e1e4562036116b5725c144f9778e"},{"path":"adapters/styles/preferences.generated.css","hash":"75a6b6821e88036e2c47b4eb84b44d3157459b49e7e64c9d43fc3dc18674c5b7"},{"path":"adapters/styles/layout.generated.css","hash":"27569ca67b877f89d59ad4248d2ec70382ad039fcfce69ce50709a4b4fdd3c18"},{"path":"contract/generated/token-names.ts","hash":"91e083954b36541fde687617231d5f1f0fa170addedd7f46fd0776feb2903872"},{"path":"contract/generated/breakpoints.ts","hash":"4dbecc2053787669535f22975cd45b51664fae9765432b209f8369f63bdad754"}]}}
```

### Before/after renders

For each stage `before` and `after`, the exact commands were:

```sh
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme paper --format svg --out .local/ui-variants/remediation/STAGE/paper
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme onyx --format png --out .local/ui-variants/remediation/STAGE/onyx
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme blueprint --format png --out .local/ui-variants/remediation/STAGE/blueprint
```

All six runs exited 0. Complete outputs:

#### before/paper

```text
$ node --import tsx apps/cli/cli/render.ts -- --collection resources/examples/showcase/repo-architecture.canvas --theme paper --format svg --out .local/ui-variants/remediation/before/paper
(node:7543) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
{"ok":true,"value":{"files":["/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/paper/map.svg","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/paper/legend.svg","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/paper/paths.svg","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/paper/create.svg"],"theme":{"id":"paper","version":"1.1.0","digest":"sha256:364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0","roles":["neutral","primary","supporting","decision","success","warning"]},"inspection":{"valid":true,"diagnostics":[],"warnings":[{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i3","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i6","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."}],"crossings":3,"relaxed":0,"sections":4,"engineVersions":["elk-0.12.0/layout-2","lume-kiwi-0.4.4/layout-1","libavoid-js-0.5.0-beta.5/layout-2","layout-policy-17"]},"digests":[{"id":"paper","digest":"364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0"},{"id":"ink","digest":"b8609fec385a0dd384b1fc2f6fdb94b6b65991738300ff25fdc76dee3979db7a"},{"id":"atlas","digest":"1e32aee786d8a30f54883423a2d5cc6df36ca5446f040342e30d390a5aa8c3c9"},{"id":"blueprint","digest":"24afd8cb322d6de285537c3a52dd739e8b67a1eef9232e0c1b0862501949a9fe"},{"id":"onyx","digest":"7136edae8b4e953fd25911d12f811111bc2e0790c43a2f0a4a6bd571cdff1bb6"},{"id":"studio","digest":"3cd02b91b5190fb0dcb18f0a045e714b43b71dcbe17778802722eb13cc2dacd0"}]}}
```

#### before/onyx

```text
$ node --import tsx apps/cli/cli/render.ts -- --collection resources/examples/showcase/repo-architecture.canvas --theme onyx --format png --out .local/ui-variants/remediation/before/onyx
(node:7578) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
{"ok":true,"value":{"files":["/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/onyx/map.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/onyx/legend.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/onyx/paths.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/onyx/create.png"],"theme":{"id":"onyx","version":"1.0.0","digest":"sha256:7136edae8b4e953fd25911d12f811111bc2e0790c43a2f0a4a6bd571cdff1bb6","roles":["neutral","primary","supporting","decision","success","warning"]},"inspection":{"valid":true,"diagnostics":[],"warnings":[{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:p8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i3","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i6","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:p9","map:object:wire:p10"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."}],"crossings":5,"relaxed":0,"sections":4,"engineVersions":["elk-0.12.0/layout-2","lume-kiwi-0.4.4/layout-1","libavoid-js-0.5.0-beta.5/layout-2","layout-policy-17"]},"digests":[{"id":"paper","digest":"364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0"},{"id":"ink","digest":"b8609fec385a0dd384b1fc2f6fdb94b6b65991738300ff25fdc76dee3979db7a"},{"id":"atlas","digest":"1e32aee786d8a30f54883423a2d5cc6df36ca5446f040342e30d390a5aa8c3c9"},{"id":"blueprint","digest":"24afd8cb322d6de285537c3a52dd739e8b67a1eef9232e0c1b0862501949a9fe"},{"id":"onyx","digest":"7136edae8b4e953fd25911d12f811111bc2e0790c43a2f0a4a6bd571cdff1bb6"},{"id":"studio","digest":"3cd02b91b5190fb0dcb18f0a045e714b43b71dcbe17778802722eb13cc2dacd0"}]}}
```

#### before/blueprint

```text
$ node --import tsx apps/cli/cli/render.ts -- --collection resources/examples/showcase/repo-architecture.canvas --theme blueprint --format png --out .local/ui-variants/remediation/before/blueprint
(node:7593) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
{"ok":true,"value":{"files":["/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/blueprint/map.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/blueprint/legend.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/blueprint/paths.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/before/blueprint/create.png"],"theme":{"id":"blueprint","version":"1.0.0","digest":"sha256:24afd8cb322d6de285537c3a52dd739e8b67a1eef9232e0c1b0862501949a9fe","roles":["neutral","primary","supporting","decision","success","warning"]},"inspection":{"valid":true,"diagnostics":[],"warnings":[{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:i3"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i3","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i6","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."}],"crossings":4,"relaxed":0,"sections":4,"engineVersions":["elk-0.12.0/layout-2","lume-kiwi-0.4.4/layout-1","libavoid-js-0.5.0-beta.5/layout-2","layout-policy-17"]},"digests":[{"id":"paper","digest":"364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0"},{"id":"ink","digest":"b8609fec385a0dd384b1fc2f6fdb94b6b65991738300ff25fdc76dee3979db7a"},{"id":"atlas","digest":"1e32aee786d8a30f54883423a2d5cc6df36ca5446f040342e30d390a5aa8c3c9"},{"id":"blueprint","digest":"24afd8cb322d6de285537c3a52dd739e8b67a1eef9232e0c1b0862501949a9fe"},{"id":"onyx","digest":"7136edae8b4e953fd25911d12f811111bc2e0790c43a2f0a4a6bd571cdff1bb6"},{"id":"studio","digest":"3cd02b91b5190fb0dcb18f0a045e714b43b71dcbe17778802722eb13cc2dacd0"}]}}
```

#### after/paper

```text
$ node --import tsx apps/cli/cli/render.ts -- --collection resources/examples/showcase/repo-architecture.canvas --theme paper --format svg --out .local/ui-variants/remediation/after/paper
(node:8140) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
{"ok":true,"value":{"files":["/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/paper/map.svg","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/paper/legend.svg","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/paper/paths.svg","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/paper/create.svg"],"theme":{"id":"paper","version":"1.1.0","digest":"sha256:364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0","roles":["neutral","primary","supporting","decision","success","warning"]},"inspection":{"valid":true,"diagnostics":[],"warnings":[{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i3","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i6","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."}],"crossings":3,"relaxed":0,"sections":4,"engineVersions":["elk-0.12.0/layout-2","lume-kiwi-0.4.4/layout-1","libavoid-js-0.5.0-beta.5/layout-2","layout-policy-17"]},"digests":[{"id":"paper","digest":"364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0"},{"id":"ink","digest":"b8609fec385a0dd384b1fc2f6fdb94b6b65991738300ff25fdc76dee3979db7a"},{"id":"atlas","digest":"1e32aee786d8a30f54883423a2d5cc6df36ca5446f040342e30d390a5aa8c3c9"},{"id":"blueprint","digest":"24afd8cb322d6de285537c3a52dd739e8b67a1eef9232e0c1b0862501949a9fe"},{"id":"onyx","digest":"7136edae8b4e953fd25911d12f811111bc2e0790c43a2f0a4a6bd571cdff1bb6"},{"id":"studio","digest":"3cd02b91b5190fb0dcb18f0a045e714b43b71dcbe17778802722eb13cc2dacd0"}]}}
```

#### after/onyx

```text
$ node --import tsx apps/cli/cli/render.ts -- --collection resources/examples/showcase/repo-architecture.canvas --theme onyx --format png --out .local/ui-variants/remediation/after/onyx
(node:8129) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
{"ok":true,"value":{"files":["/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/onyx/map.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/onyx/legend.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/onyx/paths.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/onyx/create.png"],"theme":{"id":"onyx","version":"1.0.0","digest":"sha256:7136edae8b4e953fd25911d12f811111bc2e0790c43a2f0a4a6bd571cdff1bb6","roles":["neutral","primary","supporting","decision","success","warning"]},"inspection":{"valid":true,"diagnostics":[],"warnings":[{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:p8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i3","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i6","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:p9","map:object:wire:p10"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."}],"crossings":5,"relaxed":0,"sections":4,"engineVersions":["elk-0.12.0/layout-2","lume-kiwi-0.4.4/layout-1","libavoid-js-0.5.0-beta.5/layout-2","layout-policy-17"]},"digests":[{"id":"paper","digest":"364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0"},{"id":"ink","digest":"b8609fec385a0dd384b1fc2f6fdb94b6b65991738300ff25fdc76dee3979db7a"},{"id":"atlas","digest":"1e32aee786d8a30f54883423a2d5cc6df36ca5446f040342e30d390a5aa8c3c9"},{"id":"blueprint","digest":"24afd8cb322d6de285537c3a52dd739e8b67a1eef9232e0c1b0862501949a9fe"},{"id":"onyx","digest":"7136edae8b4e953fd25911d12f811111bc2e0790c43a2f0a4a6bd571cdff1bb6"},{"id":"studio","digest":"3cd02b91b5190fb0dcb18f0a045e714b43b71dcbe17778802722eb13cc2dacd0"}]}}
```

#### after/blueprint

```text
$ node --import tsx apps/cli/cli/render.ts -- --collection resources/examples/showcase/repo-architecture.canvas --theme blueprint --format png --out .local/ui-variants/remediation/after/blueprint
(node:8162) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
{"ok":true,"value":{"files":["/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/blueprint/map.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/blueprint/legend.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/blueprint/paths.png","/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/.local/ui-variants/remediation/after/blueprint/create.png"],"theme":{"id":"blueprint","version":"1.0.0","digest":"sha256:24afd8cb322d6de285537c3a52dd739e8b67a1eef9232e0c1b0862501949a9fe","roles":["neutral","primary","supporting","decision","success","warning"]},"inspection":{"valid":true,"diagnostics":[],"warnings":[{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:i3"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i2","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i3","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."},{"code":"wire-crossing","targets":["map:object:wire:i6","map:object:wire:i8"],"message":"Connections cross; inspect labelled routes or add route intent if separation is required."}],"crossings":4,"relaxed":0,"sections":4,"engineVersions":["elk-0.12.0/layout-2","lume-kiwi-0.4.4/layout-1","libavoid-js-0.5.0-beta.5/layout-2","layout-policy-17"]},"digests":[{"id":"paper","digest":"364f100d2c60cf4a653f17b8bac2b9fca4263ea747f92d79578ba9354d8d78b0"},{"id":"ink","digest":"b8609fec385a0dd384b1fc2f6fdb94b6b65991738300ff25fdc76dee3979db7a"},{"id":"atlas","digest":"1e32aee786d8a30f54883423a2d5cc6df36ca5446f040342e30d390a5aa8c3c9"},{"id":"blueprint","digest":"24afd8cb322d6de285537c3a52dd739e8b67a1eef9232e0c1b0862501949a9fe"},{"id":"onyx","digest":"7136edae8b4e953fd25911d12f811111bc2e0790c43a2f0a4a6bd571cdff1bb6"},{"id":"studio","digest":"3cd02b91b5190fb0dcb18f0a045e714b43b71dcbe17778802722eb13cc2dacd0"}]}}
```

Command: `diff -ru .local/ui-variants/remediation/before/paper .local/ui-variants/remediation/after/paper` — exit 0, **no output**. `paper-svg.diff` is **0 bytes**.

Command: `shasum .local/ui-variants/remediation/{before,after}/{onyx,blueprint}/*.png` — exit 0:

```text
bfe542a9b171f3523af852d882398ab417bf0431  .local/ui-variants/remediation/before/onyx/create.png
2c847a95c83f928e03f1c5aee7ccc5755836fb64  .local/ui-variants/remediation/before/onyx/legend.png
3820c6300276a77600bf01f2643b47155a3f5c60  .local/ui-variants/remediation/before/onyx/map.png
15495aea8b57be294318dbb1bc1b2a21e67df03d  .local/ui-variants/remediation/before/onyx/paths.png
6408bfeec9748f713bf131a24a25c685b80189f9  .local/ui-variants/remediation/before/blueprint/create.png
9773ef33f42db6294a3eaf5bd5dd18f825a64791  .local/ui-variants/remediation/before/blueprint/legend.png
3c5d3c0fdb834288cbad275cf2c2cc482cf99209  .local/ui-variants/remediation/before/blueprint/map.png
e9d892708804166df70d28ae0a46db49a567a470  .local/ui-variants/remediation/before/blueprint/paths.png
bfe542a9b171f3523af852d882398ab417bf0431  .local/ui-variants/remediation/after/onyx/create.png
2c847a95c83f928e03f1c5aee7ccc5755836fb64  .local/ui-variants/remediation/after/onyx/legend.png
3820c6300276a77600bf01f2643b47155a3f5c60  .local/ui-variants/remediation/after/onyx/map.png
15495aea8b57be294318dbb1bc1b2a21e67df03d  .local/ui-variants/remediation/after/onyx/paths.png
6408bfeec9748f713bf131a24a25c685b80189f9  .local/ui-variants/remediation/after/blueprint/create.png
9773ef33f42db6294a3eaf5bd5dd18f825a64791  .local/ui-variants/remediation/after/blueprint/legend.png
3c5d3c0fdb834288cbad275cf2c2cc482cf99209  .local/ui-variants/remediation/after/blueprint/map.png
e9d892708804166df70d28ae0a46db49a567a470  .local/ui-variants/remediation/after/blueprint/paths.png
```

Independent byte/metadata comparison:

```text
paper/create.svg: byte-identical
paper/legend.svg: byte-identical
paper/map.svg: byte-identical
paper/paths.svg: byte-identical
paper: theme pin, inspection and all admitted preset digests unchanged
onyx/create.png: byte-identical
onyx/legend.png: byte-identical
onyx/map.png: byte-identical
onyx/paths.png: byte-identical
onyx: theme pin, inspection and all admitted preset digests unchanged
blueprint/create.png: byte-identical
blueprint/legend.png: byte-identical
blueprint/map.png: byte-identical
blueprint/paths.png: byte-identical
blueprint: theme pin, inspection and all admitted preset digests unchanged
```

### Test integrity

```text
Original main suite retained byte-for-byte after two added imports.
Every builder expectation/assertion retained unchanged.
No new test files.
```

The branch adds host/static-markup equality, retained signature text and return type, kind/caption selection, preserved member anchors, and unknown-name fallback equivalence. Neither main's assertions nor the builder's new assertions were deleted or loosened. Only fixture construction now uses checked public contracts.

### Primitive and cast audit

Exact required command:

```sh
git diff main | grep -nE '^\+.*(: string\b|Record<string|: any\b)'
```

Output:

```text
450:+  source: string,
541:+  source: string,
544:+): string {
558:+  source: string,
561:+): string {
628:+function chromeField(chrome: string | undefined): { readonly chrome?: ChromeName } {
682:+function required(value: string | undefined, name: string): string {
687:+function format(value: string | undefined): 'svg' | 'png' {
798:+export type readThemeConfig = (source: string) => Result<{
812:+  root: string,
813:+  file: string,
2056:+  readonly headers?: Readonly<Record<string, HexColor>>;
```

Every remainder:

- `apps/cli/adapters/headless.ts`: raw source parameters/returns of `sourceMatches`, `sourceWithTheme`, `insertTheme` are the Language parsing/serialization edge. Comments name the owner. `language.parse` guards source/spans; string slicing and JSON quoting preserve raw authored bytes. These are not semantic IDs.
- `apps/cli/adapters/theme-config.ts`: `chromeField` receives an optional raw regex capture and immediately checks it with `chromeName.parse`; output is branded. Existing color/scalar branches in `Override.value` predate the branch; only its new dimension branch was typed through the owner vocabulary.
- `apps/cli/cli/render.ts`: `required` and `format` are argv validators; their comments identify raw text and the downstream `headlessOptions` schema. Literal format union is closed.
- `apps/cli/contract/theme-reader.ts`: UTF-8 source text is the deliberately raw input of the grammar adapter. The contract comment identifies this boundary; the adapter returns the existing typed Result.
- `apps/service/adapters/builtin-files.ts`: `font(root: string, file: string, ...)` already exists verbatim on main as a one-line signature. Narrowing Assets rewrapped these two lines; changing their path types would refactor pre-existing looseness.
- `capability/design-system/contract/records/theme.ts`: `headers: Readonly<Record<string, HexColor>>` intentionally uses exactly the open role-key convention of `roles`; the field comment documents role name → header band tint. Only values become branded.

The broader cast search (`as ` included) found an import alias (`validate as validateLibrary`) plus English prose in comments/docs, and **no added type assertions or `any` annotations**. Newly introduced object schemas use `strictObject().readonly()`. Existing main schemas without readonly or with loose envelopes were left alone; field projections at the native adapter edge use guarded records rather than a new stripping `z.object` schema.

### File count

Before: **55** files in `git diff main`. After: **57**. The only additions to the diff's file set are existing Design System contract files:

- `capability/design-system/contract/brands.ts` — explicitly required by the brief to mint the new branded vocabulary.
- `capability/design-system/contract/index.ts` — genuinely required contract-surface propagation so service/CLI can import those schemas legally through the capability entry.

No new physical source files were created. This is the brief's brands/contract-file exception; all other modified files were already in the branch diff.

Final `git diff main --stat`:

```text
 apps/cli/adapters/headless.ts                      | 558 +++++++++++++++++++++
 apps/cli/adapters/theme-config.ts                  |  48 +-
 apps/cli/cli/render.ts                             |  46 ++
 apps/cli/contract/compose.ts                       |  23 +
 apps/cli/contract/index.ts                         |   3 +
 apps/cli/contract/records/headless.ts              |  38 ++
 apps/cli/contract/theme-reader.ts                  |   7 +
 apps/service/adapters/builtin-files.ts             |   8 +-
 apps/service/adapters/theme-preparation.ts         |  28 +-
 apps/service/contract/compose.ts                   |  20 +-
 apps/service/contract/index.ts                     |   1 +
 apps/service/contract/records/presets.ts           |   2 +-
 apps/service/contract/records/render-resources.ts  |   4 +-
 apps/service/contract/records/theme-input.ts       |   2 +
 .../adapters/styles/preferences.generated.css      | 336 +++++++++++++
 .../adapters/styles/semantics.generated.css        |  14 +
 .../adapters/styles/themes.generated.css           |  56 +++
 .../adapters/styles/tokens.generated.css           |  14 +
 capability/design-system/contract/brands.ts        |  17 +
 .../contract/generated/token-names.ts              |  28 ++
 capability/design-system/contract/index.ts         |   4 +
 .../contract/records/portable-schema.ts            |   3 +-
 .../design-system/contract/records/resolved.ts     |   3 +-
 .../design-system/contract/records/scope-schema.ts |   3 +-
 capability/design-system/contract/records/theme.ts |  21 +
 capability/design-system/core/themes/admit-data.ts |   4 +-
 capability/design-system/core/themes/chrome.ts     |  39 ++
 capability/design-system/core/themes/diagram.ts    |  84 +++-
 capability/design-system/core/themes/portable.ts   |  11 +-
 .../design-system/tokens/definitions.tokens.json   | 139 +++++
 .../design-system/tokens/semantics.tokens.json     |  58 +++
 .../adapters/react/AccentStripeChrome.tsx          |  65 +++
 .../presentation/adapters/react/CardChrome.tsx     |  70 +++
 .../adapters/react/FolderTabChrome.tsx             |  34 ++
 .../presentation/adapters/react/NodeContent.tsx    |  93 ++--
 capability/presentation/contract/api.ts            |   1 +
 capability/presentation/contract/compose.ts        |  58 ++-
 capability/presentation/contract/index.ts          |   5 +
 capability/presentation/contract/react-types.ts    |  20 +-
 capability/presentation/contract/records/chrome.ts |  33 ++
 .../contract/records/content-context.ts            |   1 +
 capability/presentation/contract/records/style.ts  |  30 +-
 capability/presentation/contract/records/visual.ts |   3 +-
 capability/presentation/contract/types.ts          |   1 +
 capability/presentation/core/content/chrome.ts     |  11 +
 .../presentation/core/content/composition.ts       |  24 +-
 capability/presentation/core/content/headings.ts   |  12 +-
 capability/presentation/core/notation/chrome.ts    |  12 +
 .../presentation/core/projection/collection.ts     |   3 +-
 capability/presentation/core/projection/node.ts    |  21 +-
 capability/presentation/core/projection/section.ts |  12 +-
 capability/presentation/tests/rendering.test.ts    |  65 +++
 capability/templates/contract/records/preset.ts    |   8 +
 docs/maintenance/module-chromes.md                 |  24 +
 package.json                                       |   5 +-
 resources/blueprint.theme                          |  26 +
 resources/onyx.theme                               |  27 +
 57 files changed, 2175 insertions(+), 111 deletions(-)
```

## Render inspection against repository references

Personally inspected actual Onyx/Blueprint `map.png`, Onyx `create.png`, and Blueprint `paths.png`, alongside the retained module reference and the requirements in `References.md` and `diagram-quality-improvements.md`. Module headers, body compartments, wire labels and the sequence arrow/return distinctions remain visible and unchanged. Equality above covers every section, including the unpictured exports. No independent subagent was used, as the user prohibits it.

This is a compatibility acceptance, not a claim that the builder fixture newly passes every visual benchmark. Existing baseline limitations were preserved: the map remains very wide with small details at fit scale; its inspection reports three crossings for Paper, five for Onyx and four for Blueprint (all within the dense-map budget; corrected after AUDIT.md B/C3), no relaxed constraints, and no invalid-scene diagnostics. Blueprint `paths` retains pre-remediation text overhang near the Language and Design System cards and the “Valid and planned?” diamond, and generous panel whitespace. These must not be “fixed” in a byte-identical typing pass. Contrast/spacing redesign is outside this remediation; no invented numerical visual score is assigned.

## Follow-ups (out of scope)

Each below was checked against `main`; none was retyped in this pass:

- `capability/design-system/contract/records/theme.ts` — `Paint.fill`, `Paint.stroke`, `Paint.text`: bare color strings.
- `capability/design-system/contract/records/theme.ts` — `StyleProjection.digest`: bare digest string.
- `capability/design-system/contract/records/theme.ts` — `StyleProjection.surface`, `text`, `secondary`, `border`: bare legacy colors.
- `capability/design-system/contract/records/theme.ts` — `PortableToken.value` (color), font `family`/`digest`: legacy primitive fields.
- `capability/design-system/contract/records/theme.ts` — `TextMetric.font.family`/`digest`: legacy primitive fields.
- `capability/design-system/contract/records/theme.ts` — `presetPin.id`: refined but unbranded identity.
- `capability/design-system/contract/records/resolved.ts` — `ContrastEvidence.id`, `foreground`, `background` and `ResolvedTokenSet.primary`: legacy strings.
- `capability/design-system/contract/records/portable-schema.ts` — `portableTheme` and portable token records: pre-existing missing readonly wrappers.
- `capability/design-system/contract/records/scope-schema.ts` — `resolvedScope` and nested scope records: pre-existing missing readonly wrappers.
- `capability/design-system/contract/records/tokens.ts` — `TokenValue` color `value`, `Dependencies` keys/values: legacy strings.
- `capability/presentation/contract/records/style.ts` — existing `color`/`Paint.fill`, `stroke`, `text`: unbranded legacy color schema permitting uppercase.
- `capability/presentation/contract/brands.ts` — `digest`, `coordinate`, `dimension`: existing refined but unbranded schemas.
- `capability/presentation/core/projection/collection.ts` — `ProjectionDependencies.rendererVersion`: legacy bare string.
- `apps/cli/adapters/theme-config.ts` — `Override.token`, existing color/scalar values, and `ThemeFault.code`/`recovery`: legacy grammar/diagnostic primitives.
- `apps/cli/contract/records/resources.ts` — `ResourceFiles.read.file`, `LocalInput.digest`, and `PresetInputs` IDs/digests: legacy boundary primitives.
- `apps/service/adapters/builtin-files.ts` — `font.root`/`file`: existing native path strings.
- `apps/service/adapters/theme-preparation.ts` — existing config loose envelope, override keys/color/scalar values and `FontBinding.alias`/`digest`: legacy input vocabulary.
- `apps/service/contract/records/theme-input.ts` — existing `pin.id`/`version`/`digest`, absent readonly wrappers: legacy host envelope.
- `apps/service/contract/records/render-resources.ts` — `RenderResourceOwners.wasmResource`: legacy bare native path.
- `capability/templates/contract/records/preset.ts` — `themePayload.tokens` keys and existing nested token payload refinement/immutability: broader preset typing follow-up.

## Source review evidence

This is a manual review, not a generated quality grade or an independent review. The repository's 16-principle rubric governs; the engineering-standards skill was used for dependency direction and honest evidence reporting. All 27 first-party source files edited in this remediation were re-read with their direct contracts. The unchanged branch files retain their prior review in `SOURCE-REVIEW.md`; this report does not silently re-award its scores or treat a green suite as a design score.

Scores below are ordered: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes, failure semantics, information hiding, Demeter, immutability, type safety, cognitive complexity, testability. Every score is based on the final target file. Common evidence: literal records/`readonly` and copy construction establish immutability; all calls/imports were inspected for capability boundaries; no added unchecked casts/any; full lint establishes cognitive complexity ≤2, not the design score. LSP stays 7 without demonstrated substitution. Interface records are assigned information hiding 5; barrels 0. Fixed policy/composition steps cost OCP points. Native dependencies and known raw legacy owner fields are deductions, not exceptions.

| File | Sixteen scores | Total | Specific evidence/deductions |
| --- | --- | ---: | --- |
| [apps/cli/adapters/headless.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/apps/cli/adapters/headless.ts:48) | 10, 6, 7, 10, 10, 9, 10, 10, 8, 10, 10, 10, 10, 10, 10, 5 | 145 | renderHeadless/render/output: isolated temporary lifecycle, finally-close/rm, exact retained resource whitelist; fixed orchestration, repeated owner adaptation and native filesystem reduce scores. |
| [apps/cli/adapters/theme-config.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/apps/cli/adapters/theme-config.ts:31) | 10, 6, 7, 10, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 152 | chromeField and dimensionLine guard captures before owner admission; fixed grammar and pre-existing diagnostic/token primitives are deductions; readThemeConfig owns typed failure. |
| [apps/cli/cli/render.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/apps/cli/cli/render.ts:5) | 10, 6, 7, 10, 10, 10, 10, 10, 8, 10, 10, 10, 10, 10, 10, 5 | 146 | options validates argv with headlessOptions; main owns terminal failures; native argv/console and fixed option vocabulary are deductions. |
| [apps/cli/contract/index.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/apps/cli/contract/index.ts:2) | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 0, 10, 10, 10, 10, 10 | 147 | Explicit controlled re-exports only, no runtime assertions or hidden behavior; mandatory public surface has no implementation depth. |
| [apps/cli/contract/records/headless.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/apps/cli/contract/records/headless.ts:6) | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10 | 152 | headlessOptions strictly validates immutable selectors; filePath explicitly names native validation owner; report reuses catalog identity and inspection types; thin declaration surface. |
| [apps/cli/contract/theme-reader.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/apps/cli/contract/theme-reader.ts:4) | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10 | 152 | Single narrow Result-returning grammar slot documents raw UTF-8 input validation owner; thin contract, no platform import or mutation. |
| [apps/service/adapters/theme-preparation.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/apps/service/adapters/theme-preparation.ts:29) | 10, 6, 7, 10, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 152 | config dimension and chromeField are checked; prepareTheme protects owner failures; legacy binding primitives and fixed preparation order remain. |
| [apps/service/contract/records/theme-input.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/apps/service/contract/records/theme-input.ts:10) | 10, 10, 7, 10, 9, 10, 10, 10, 10, 10, 10, 10, 9, 10, 10, 10 | 155 | Strict existing envelope now checks chromeName; legacy identity fields and pre-existing missing readonly wrappers remain explicit deductions. |
| [capability/design-system/contract/brands.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/design-system/contract/brands.ts:3) | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 157 | chromeName/hexColor are bounded documented validators with inferred incompatible types; existing token/digest/version validators retained. |
| [capability/design-system/contract/index.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/design-system/contract/index.ts:2) | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 0, 10, 10, 10, 10, 10 | 147 | Explicit controlled re-exports only, no runtime assertions or hidden behavior; mandatory public surface has no implementation depth. |
| [capability/design-system/contract/records/portable-schema.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/design-system/contract/records/portable-schema.ts:21) | 10, 10, 7, 10, 9, 10, 10, 10, 10, 10, 10, 10, 9, 10, 10, 10 | 155 | Strict existing envelope now checks chromeName; legacy identity fields and pre-existing missing readonly wrappers remain explicit deductions. |
| [capability/design-system/contract/records/resolved.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/design-system/contract/records/resolved.ts:5) | 10, 10, 7, 10, 9, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10 | 151 | Readonly consumer declarations with checked new vocabulary; unchanged legacy primitive members cost DIP; deliberately thin declaration surface. |
| [capability/design-system/contract/records/scope-schema.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/design-system/contract/records/scope-schema.ts:20) | 10, 10, 7, 10, 9, 10, 10, 10, 10, 10, 10, 10, 9, 10, 10, 10 | 155 | Strict existing envelope now checks chromeName; legacy identity fields and pre-existing missing readonly wrappers remain explicit deductions. |
| [capability/design-system/contract/records/theme.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/design-system/contract/records/theme.ts:5) | 10, 10, 7, 10, 9, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10 | 151 | Readonly consumer declarations with checked new vocabulary; unchanged legacy primitive members cost DIP; deliberately thin declaration surface. |
| [capability/design-system/core/themes/chrome.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/design-system/core/themes/chrome.ts:8) | 10, 6, 7, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 153 | chromeField mints through parsed; extension uses TokenId; completeChromeTokens restores only missing extension vocabulary; fixed namespace policy. |
| [capability/design-system/core/themes/diagram.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/design-system/core/themes/diagram.ts:29) | 10, 6, 7, 10, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 152 | chromeProjection/secondaryPaint use parsed HexColor and explicit omission; unchanged legacy Paint/role types cost DIP; fixed projection vocabulary costs OCP. |
| [capability/presentation/adapters/react/FolderTabChrome.tsx](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/adapters/react/FolderTabChrome.tsx:5) | 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 160 | Injected outline and shared render assertions establish substitution; token/node fields supply geometry and color; no core or sibling behavior imports. |
| [capability/presentation/contract/compose.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/contract/compose.ts:12) | 10, 6, 7, 10, 10, 10, 10, 10, 8, 10, 10, 10, 10, 10, 10, 5 | 146 | bindReact owns all concrete adapters and checked policy keys; protected native imports and fixed pipeline explain deductions. |
| [capability/presentation/contract/index.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/contract/index.ts:2) | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 0, 10, 10, 10, 10, 10 | 147 | Explicit controlled re-exports only, no runtime assertions or hidden behavior; mandatory public surface has no implementation depth. |
| [capability/presentation/contract/react-types.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/contract/react-types.ts:6) | 10, 10, 7, 10, 9, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10 | 151 | Readonly consumer declarations with checked new vocabulary; unchanged legacy primitive members cost DIP; deliberately thin declaration surface. |
| [capability/presentation/contract/records/chrome.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/contract/records/chrome.ts:3) | 10, 10, 7, 10, 10, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 156 | Strict readonly policy and checked registry/caption/outline declarations; consumer-owned grammar repetition across boundaries costs DRY. |
| [capability/presentation/contract/records/style.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/contract/records/style.ts:4) | 10, 10, 7, 10, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 156 | Strict readonly visual/measurement validation with checked new ink and chrome; existing unbranded legacy colors cost DIP. |
| [capability/presentation/core/content/chrome.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/core/content/chrome.ts:5) | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 157 | moduleChrome reads injected React-free policy using a checked default key; no concrete adapters, mutation or failure-producing I/O. |
| [capability/presentation/core/content/headings.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/core/content/headings.ts:8) | 10, 6, 7, 10, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 152 | kindLabel uses DiagramObject label semantics; shared measurements unchanged; existing label and kind-map primitives/fixed vocabulary cost DIP/OCP. |
| [capability/presentation/core/notation/chrome.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/core/notation/chrome.ts:3) | 10, 10, 7, 10, 10, 10, 10, 10, 10, 10, 5, 10, 10, 10, 10, 10 | 152 | folderPath emits the same deterministic outline and checks string presence; deliberately thin pure geometry serializer, no platform dependencies. |
| [capability/presentation/tests/rendering.test.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/presentation/tests/rendering.test.ts:127) | 10, 6, 10, 10, 10, 10, 10, 10, 8, 10, 10, 10, 10, 10, 10, 5 | 149 | Shared public rendering suite covers each variant/fallback, markup parity and anchors; real fontkit setup and fixed fixtures cost testability/OCP. |
| [capability/templates/contract/records/preset.ts](/Users/christopherdasca/Programming/Novakai-Canvas-next-ui-variants/capability/templates/contract/records/preset.ts:10) | 10, 10, 7, 10, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10 | 155 | Strict immutable payload uses the open chrome validator; legacy token keys and repeated consumer grammar remain deductions. |

Worst retained findings: (1) native CLI/composition depends on real infrastructure and fixed orchestration; (2) main has legacy unbranded colors, identities and non-readonly envelopes listed above; (3) the baseline visual fixture has known density/overhang issues. None warrants changing behavior or expanding this typing-only scope.

## Commit

Commit message: `refactor(design-system): brand contract types to coding standard`.
Only the 27 remediation source files are included. The report and proofs remain local as requested. No push and no main modification.

Committed as `b8d9bf4d5d0fad66ab6747c06c538a50a51f1e07` on `ui/module-variants`. Final tracked working tree is clean.
