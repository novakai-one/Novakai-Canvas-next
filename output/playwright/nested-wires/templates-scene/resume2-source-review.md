# M6 capacity/projection and browser source review

Whole-file review against `docs/standards/CODING-STANDARDS.md`, after reading the
record contracts, retained lane allocation, terminal-pin law, road/network
construction and host renderer. This assesses source, not milestone acceptance.
The previous placement/extraction commits are retained. No scores are inherited.

Order: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes,
retry/failure semantics, depth, Demeter, immutability, type safety, cognitive
style, testability. Sonar's separate per-function maximum of 2 remains enforced.

| Target | Sixteen scores | Total |
| --- | --- | ---: |
| `capability/layout/core/nested-road-capacity.ts` | 10,6,7,10,10,9,8,10,10,10,10,10,8,10,7,10 | 145 |
| `capability/layout/core/nested-lane-projection.ts` | 10,6,7,10,10,9,7,10,10,10,10,10,10,10,7,10 | 146 |
| `capability/layout/core/prototype-nested-scene.ts` | 10,6,7,10,10,10,9,10,10,10,10,10,10,10,10,10 | 152 |
| `apps/web/cli/templates-scene.ts` | 10,6,7,10,10,9,10,10,10,10,5,10,10,10,10,10 | 147 |
| `apps/web/cli/roads-prototype.ts` | 10,6,7,10,10,10,9,10,8,10,10,10,10,10,10,5 | 145 |

## Evidence by principle

- **SRP:** capacity owns final road extents (10–29, 31–140); projection owns
  retained-assignment geometry (`streetBridge`, `joinsFor`, `projectNestedWire`);
  scene owns pipeline assembly (31–93); the templates fixture owns semantic
  input and directory captions (5–34); browser entry owns startup/render timing
  and query selection (24–101). No new ownership of routing law or topology.
- **OCP:** all five retain fixed policies or a fixed fixture/startup sequence.
  Their owned extension axes require editing code: 6, without a YAGNI excuse.
- **LSP:** no polymorphic implementation under review; exactly 7, not demonstrated.
- **ISP:** narrow readonly record inputs, maps and injected measure callback;
  no fat service interface is declared or passed through. The host consumes
  Layout and Canvas through their public contracts.
- **DIP:** core imports only own core and declaration records; browser imports
  public capability contracts and its own fixture adapter. No core-to-host or
  core-to-adapter import, and no new behavioral dependency between capabilities.
- **DRY:** pitch/width laws are centralized. Capacity's terminal-depth expression
  must agree with projection's fan formula (one-point deduction). Projection's
  existing connection assemblies repeat a record shape (one point). The fixture
  captions repeat the extractor's directory ordering (one point); the acceptance
  runner now asserts that exact semantic tree rather than silently assuming it.
- **KISS:** capacity now includes terminal extents in addition to attachment and
  end caps (8). Projection combines corners, bridges, clipping and terminal fans
  (7). Scene's reservation/final split and the host's async imports/timing each
  cost one point. Templates input/caption decoration is a straight read/build/map.
- **YAGNI:** only requested capacity/projection fixes and `?templates` integration;
  no alternate routes, optimizer, retries, dependencies, flags or fake nodes.
- **Typed outcomes:** geometry helpers are total over internally constructed
  records; missing entries retain the existing owner. The scene preserves its
  structured routing failure. Templates input is a committed generated fixture,
  not a public JSON admission boundary; bad request endpoints produce the
  builder's routing failure. Browser `main().catch` (81–83) is the named reload
  boundary for infrastructure rejection, costing two points for untyped throws.
- **Retry semantics:** capacity's entry comment names reconstruction and local
  state; projection/scene retain their named owner. Fixture lines 17–19 name host
  reload recovery. Main displays a reload instruction and constructs a fresh
  scene. Full rebuild identity and one-stage-once checks pass.
- **Depth:** capacity hides demand/contact/terminal geometry; projection hides
  segment materialization; scene hides the pipeline; browser entry hides startup.
  The templates adapter only decorates a fixture: depth 5, not an invented 10.
- **Demeter:** direct records, arrays and maps only; no indirect mutable navigation.
- **Immutability:** capacity mutates invocation-local maps (8). Projection and
  scene return copies. The browser's single layout counter is intentionally host
  instrumentation, initialized once per navigation; it is not shared domain state.
- **Type safety:** no `any`, suppression or unchecked cast. Fixture `as const`
  preserves request tuple shape rather than asserting an unvalidated object type.
  Missing request numbers deterministically become invalid node 0 at the existing
  typed routing boundary; normal generated artifacts are independently verified.
- **Cognitive style:** capacity has multiple scalar selections within
  `terminalExtent` (7); projection retains its named optional-record style (7).
  The other targets have no named style violation. `pnpm check` enforces actual
  Sonar complexity ≤2 across application and new evidence MJS files.
- **Testability:** geometry/fixture functions use immutable inputs and injected
  measurement, without ambient time/IO/randomness. Browser host requires DOM,
  navigation and real font timing: 5. Its headless five-load and unchanged nested
  interaction runs supply actual infrastructure evidence, not fake unit tests.

Worst findings: fixed policy axes (OCP 6); thin fixture adapter (depth 5);
browser infrastructure dependence (testability 5). Capacity/projection remain
specialized geometry machinery; these scores do not establish arbitrary-density
scaling or visual acceptance.

The standalone MJS/Python/MTS artifacts follow the existing M3–M6 terminal-evidence
review scope: process assertions and IO errors are fatal terminal outcomes, not
application APIs. They are not represented as new first-party capability modules.
They remain covered by applicable ESLint; no suppression, threshold adjustment,
new `*.test.ts`, dependency or old-runner edit was made. Their evidence includes
red-before/green-after geometry, independent exact pin calculations, unknown and
duplicate crossing rejection, disjoint proof-region assertions, instrumented
byte comparisons, full fresh-id graph cloning and headless browser output.
