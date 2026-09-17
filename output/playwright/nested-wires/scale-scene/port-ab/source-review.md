# Part C evaluation source review

Whole-file review using the sixteen coding-standard anchors. This records code
quality, not validity of the opt-in left-edge graph. That graph demonstrably
fails; the parameter remains false by default and was not adopted.

Order: SRP, OCP, LSP, ISP, DIP, DRY, KISS, YAGNI, typed outcomes, retry/failure,
depth, Demeter, immutability, type safety, cognitive style, testability.

| Target | Sixteen scores | Total |
| --- | --- | ---: |
| `capability/layout/contract/records/road-prototype.ts` | 9,6,7,10,10,10,10,10,10,10,8,10,10,10,10,10 | 150 |
| `capability/layout/core/prototype-nested-scene.ts` | 10,6,7,10,10,10,10,10,5,10,10,10,10,10,10,10 | 148 |
| `capability/layout/core/prototype-nested-placement.ts` | 10,6,7,10,10,10,9,10,5,10,10,10,8,10,10,10 | 145 |
| `apps/web/cli/templates-scene.ts` | 10,6,7,10,10,9,10,10,8,10,9,10,10,10,10,10 | 149 |
| `apps/web/cli/scale-scene.ts` | 10,6,7,10,10,9,10,10,8,10,9,10,10,10,10,10 | 149 |
| `apps/web/cli/roads-prototype.ts` | 10,6,7,10,10,10,10,10,8,10,10,10,8,10,10,8 | 145 |

Evidence by target:

- Records: `PrototypeLayoutOptions` documents the boolean as evaluation-only
  and off by default. The file contains readonly declarations only, alongside
  the scene/port/road/lane/coverage records. One broad prototype schema costs
  SRP one and depth two; changing fields requires edits (OCP six). No subtype
  implementation demonstrates LSP (seven), no unused behavioral ports, no
  throws/mutations/ambient reads or unchecked casts.
- Scene pipeline: one call per measured stage, options injected by caller;
  `nodes` passes the boolean to placement before any topology or law stage.
  Imports own core and declaration records only. Early typed failed routing is
  preserved, but placement RangeError can propagate (typed outcomes five).
  Entry comment names reconstruction owner. Fixed pipeline steps cost OCP four.
- Placement: `sectionPorts` returns the exact prior array when false;
  `leftEntrance` only maps section entry roles, changes no node port or exit.
  Stable port identity survives its experimental side/offset. Explicit typed
  signature and fresh records; no search or geometry feedback. Existing local
  x/y counters cost immutability two; recursive clone-number traversal costs
  KISS one. Content-free rejection remains a RangeError (five), caller-owned
  rebuild is documented. This retains the earlier whole-file 145 review.
- Templates and scale hosts: only public Layout imports, semantic data plus
  captions; `Pick` exposes only measurement and this layout option. Optional
  wire labels decorate completed geometry in templates. Fixed fixtures cost
  OCP four; repeated caption-host idiom DRY one; thin host depth one; documented
  browser-owned exception recovery eight. No DOM/clock in either builder.
- Browser host: query opt-in is explicit `has('ports-left')`, absent in all
  scene specs. Sequential startup and readiness measurement remain readable;
  no default geometry edit or law branch. Mutable counter/DOM host effects
  cost immutability two; real browser timing needs infrastructure (testability
  eight). Static registry/startup steps cost OCP four. Catch/reload owner is
  named, but exception kinds are not a typed public result (eight).

No score is inferred from tests. Sonar <=2, typechecking and import boundaries
are independently enforced by final `pnpm check`. Evidence runners use public
contracts; the AST meter verifies instrumented and ordinary scene bytes equal.
The new failure-report branch exits **1** and reports missing compile/length/
crossings as **null**, so a failed experimental graph cannot become a green
scale acceptance run. No new `*.test.ts` file, routing-law change, new discovery
loop, dependency, or token value was introduced.
