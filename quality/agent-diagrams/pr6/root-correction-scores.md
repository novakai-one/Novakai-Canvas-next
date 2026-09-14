# PR6 root-owned correction: builder scoring evidence

Literal P1–P16 order from `docs/standards/CODING-STANDARDS.md`; this is implementation self-assessment, not another audit. Execution does not establish scores. No native/test exemption is assumed.

|Target|P1–P16|Total|Gate|
|---|---|---:|---|
|apps/cli/adapters/theme-config.ts|10,6,7,10,10,9,9,10,10,10,10,10,10,10,10,10|151|Pass|
|apps/service/adapters/theme-preparation.ts|10,6,7,10,10,9,9,10,10,10,10,10,10,10,10,10|151|Pass|
|apps/cli/tests/commands.test.ts|10,6,7,10,10,9,9,10,5,8,9,10,5,10,7,0|125|Open|

## Evidence and deductions

- CLI grammar: `readThemeConfig` at20 catches private parsing failures into the public Result; entry comment names CLI correction and Design System validation. `numberLine` at116 only admits finite syntax; owner validation remains authoritative. `uniqueOverrides` at136 rejects duplicate identities rather than silently overwriting. No ambient dependencies/casts. P2=6 for fixed grammar steps, P3=7 for no demonstrated substitution suite, P6=9 for repeated entry record declarations, P7=9 for regex/capture flow requiring care. Other tens: one syntax-admission responsibility, narrow data-only inputs, protected typed outcome, repeat-safe pure transforms, meaningful grammar hiding, readonly records and no named complexity idioms.
- Service translation: `prepareTheme` at20 protects all collaborators and color parsing with a typed failure; Authoring recovery is named. `ThemeOwners` at14 consumes precisely Assets.resolve and Templates.read. `tokenValue` at121 passes numeric values through; Design System owns names/types/ranges. Font identities come from verified descriptors, never caller font names. P2=6 fixed translation pipeline; P3=7 no demonstrated substitution suite; P6=9 repeated binding shape; P7=9 nontrivial but named font/result assembly. Remaining tens follow the same focused boundary, narrow injected owners, Result/copy-based/no-cast/no-ambient-I/O evidence. Zod is boundary validation, not core infrastructure ownership.
- Native CLI test: the two existing cases still use real filesystem, service, fonts, SQLite and socket. The numeric-theme assertions extend an existing case; no test definitions added. P16=0 under the literal infrastructure anchor. P9=5 for assertion/structured exceptions absent from signatures; P10=8 for fixture cleanup with unnamed runner recovery. P13=5 for fixture-local mutable receipt/server state. P15=7 for existing return ternary at77; P2=6 fixed scenario steps; P3=7 no substitution suite; P6/P7/P11=9 for repeated staging/staged cases/broad case boundary. The test remains valuable correctness evidence, but 125 is below the required threshold. It is not relabelled a pass.

Sonar gate <=2 is enforced by the successful final ESLint run; source receipts below bind this assessment to exact files. Native adapters/tests from prior PRs remain separately open; these two pure adapter corrections do not resolve them.

|File|SHA-256|
|---|---|
|apps/cli/adapters/theme-config.ts|`7c1705153ea019549bb9870c9ec5b7a019d21253712ca8348b37ed7b822d0478`|
|apps/service/adapters/theme-preparation.ts|`9862190774b2201ef934c641a79dc6784fc18c5f368088283bcb33c64061cda7`|
|apps/cli/tests/commands.test.ts|`49b7b910ceb4f7ac1c9166a68770de91f219d58d4142f0cbcb08498fae91ac85`|
