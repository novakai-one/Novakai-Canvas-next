# PR6 correction — execution evidence

Base: `a10e92e976caf88a5d14ee737c5081ef16ed2bca`. Exclusive worktree: `/Users/christopherdasca/Programming/Novakai-Canvas-next-proof-fix`. Final source edits preceded both final runs below. Local date:13September2026 (UTC12September).

|Check|Result|
|---|---|
|`pnpm exec vitest run capability/presentation/tests capability/layout/tests`|PASS —31tests,7files; real native Layout fixtures;3.40s|
|`pnpm check`|PASS —typecheck, ESLint, Prettier, dependency-cruiser, full Vitest;177tests,52files; test phase15.41s|
|Architecture|PASS —828modules,1962dependencies; no violations|
|Changed-file Sonar measurement|PASS —all14files max0–2; threshold-zero diagnostic probe, no other lint messages|
|`git diff --check`|PASS|
|New test definitions|0 —notation1→1; routing6→6; global PR6 budget remains2/2|

Exact final command logs are embedded below. The full run emitted only Node's experimental SQLite notices. No persistent service/browser was started or controlled. No root-owned paths, plans, DSL, captures or theme files were changed.

Earlier development checks found invalid FK ordering in a new fixture, incompatible group/layout fixture modes, an over-specific interior-label expectation for the reversed route, and test-helper Sonar complexity above2. These were corrected in fixture/setup/assertions before the final runs. Reverse routes are allowed to choose clear exterior labels; the exit fixture still explicitly proves both group interiors remain available. No existing positive assertion, full marker box, endpoint equality, manual lock or retry budget was weakened.

## Focused output

```text
RUN  v5.0.0 /Users/christopherdasca/Programming/Novakai-Canvas-next-proof-fix


 Test Files  7 passed (7)
      Tests  31 passed (31)
   Start at  00:02:45
   Duration  3.40s (tests 74%, transform 14%, import 11%)
```

## Full check output

```text
$ pnpm typecheck && pnpm lint && pnpm format:check && pnpm architecture && pnpm test
$ tsc --noEmit
$ eslint .
$ prettier --check "capability/**/*.{ts,tsx}" "apps/**/*.{ts,tsx}" eslint.config.js .dependency-cruiser.cjs
Checking formatting...
All matched files use Prettier code style!
$ depcruise capability apps --config .dependency-cruiser.cjs --output-type err

✔ no dependency violations found (828 modules, 1962 dependencies cruised)

$ vitest run capability apps

 RUN  v5.0.0 /Users/christopherdasca/Programming/Novakai-Canvas-next-proof-fix

(node:37645) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37646) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37647) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37651) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37652) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37653) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37659) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37669) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37651) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37645) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37647) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37675) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37651) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37647) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37680) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37645) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37683) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37684) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37686) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37651) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37647) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37691) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37645) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37694) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37697) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37647) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37651) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37647) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37651) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:37651) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)

 Test Files  52 passed (52)
      Tests  177 passed (177)
   Start at  00:02:21
   Duration  15.41s (tests 71%, import 15%, transform 11%, environment 2%)
```

## Measured function complexity

Threshold-zero probes report only functions above0; unreported functions have0. These intentional probe diagnostics are measurements, not failures under the repository limit2.

|File|Function start lines and measured complexity|Maximum|
|---|---|---:|
|capability/canvas/core/scenes/validate.ts|7:1, 15:1, 26:1, 30:1, 36:1, 43:2, 49:1, 56:1, 99:1, 108:2|2|
|capability/layout/contract/records/engines.ts|all0|0|
|capability/layout/core/routing/obstacles.ts|4:1, 23:1|1|
|capability/layout/core/routing/wires.ts|45:1, 69:2, 97:2, 114:2, 123:1, 141:2, 158:1, 230:1, 241:1, 271:1, 283:1|2|
|capability/layout/core/validation/wires.ts|20:1, 35:2, 68:2, 73:1, 101:1|2|
|capability/layout/tests/routing.test.ts|19:1, 43:1, 133:1, 220:1, 236:2, 248:1, 257:1, 262:1, 372:1, 390:1, 492:1, 543:1, 554:2, 578:2, 666:1, 672:1, 682:1, 740:1, 813:1|2|
|capability/presentation/contract/api.ts|all0|0|
|capability/presentation/contract/records/content-context.ts|all0|0|
|capability/presentation/core/content/blocks.ts|14:1, 28:1, 32:1, 36:1, 40:1, 45:1, 51:1, 55:1, 63:1, 67:1, 71:1, 81:2, 92:1|2|
|capability/presentation/core/projection/collection.ts|17:1, 22:1, 32:1, 81:1|1|
|capability/presentation/core/projection/node.ts|40:1, 84:1, 98:1, 108:1, 118:1, 179:1, 185:1, 216:1, 233:1, 269:1, 280:1, 285:1, 292:2, 298:1|2|
|capability/presentation/core/validation/capacity.ts|31:1|1|
|capability/presentation/core/validation/interchange.ts|9:1, 14:1, 23:1, 28:1|1|
|capability/presentation/tests/notation.test.ts|all0|0|
