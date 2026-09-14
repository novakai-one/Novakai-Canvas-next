# Templates — sole bounded build audit round

A1 library_plan_pressure:4 target files (catalog, admission, fixtures, facade),8minute maximum, read-only. A2 persistence_plan_pressure:3 test files,8minute maximum, read-only. No second review. Findings independently verified before one fixes-only round.

| Category | Finding | Verification / disposition |
|---|---|---|
| major build risk | Valid1000-theme ancestry chain makes synchronous public list exceed10seconds | Independently constructed1000 exact hashed themes and terminated after12seconds. Replaced repeated linear ancestry lookup with indexed reference checks and bounded copy-based topological rounds. Same probe:114.76ms,1000 summaries; no recursion/cache mutation introduced. Existing catalog test now includes1000-record chain, without fragile time assertion. |
| minor | Admission depends on recipe.expand while using only inspect | Verified target flow consumed1/2 methods. Declared local AdmissionDependencies with inspection-only recipe role; expansion remains separate. |
| minor | Fixture service and dependency factory duplicate defaults | Verified same recipe/theme construction in two helpers. service now selects codecs from one dependency factory. |

A1 original scores /160: catalog149, admission147, fixtures147, facade153. Auditor explicitly rejected a private expandInput-only ISP dock: the facade target consumes all provider methods across its flow. Author evidence after fixes recorded separately; no re-audit or independent rescore claimed.

A2 no incorrect assertions found: independently recomputed fixed canonical SHA256 using Python; verified2.10.0 versus2.9.0 numeric order; verified recipe still references theme1.0.0 after adding2.0.0. Exactly8definitions/cases remain.

Validation:58tests/15files;8Templates cases. Strict typecheck, Sonar<=2, formatting,156-module/379-dependency import graph pass.18TS files/82named functions with docs/explicit returns. Native SQLite warnings belong to preceding capability regressions. No E2E, production codec or browser claims. Maximum-chain benchmark is an operational in-process probe, not a new test definition.

Specs:1948words/182lines before review;1979words/182lines after. Every document and total below20% words/lines growth. Five mirrored vault docs; no extra specs required.
