# M7.6 — STOP: exact operation baselines conflict with starting revision

The milestone is stopped before implementation. Branch `feat/m76-lazy-audit`
started clean at `d720e7f`. Its unchanged public Layout implementation and
unchanged operation meter reproduce different nested/templates compile counts
from those required by milestone-076-lazy-audit.md. No baseline was adjusted.

| Scene | Required compile / routing / discovery | Fresh measured compile / routing / discovery | Exact gate |
| --- | --- | --- | --- |
| Nested | 19,732 / 992 / 0 | 19,768 / 992 / 0 | FAIL: compile +36 |
| Templates | 28,407 / 1,626 / 0 | 28,443 / 1,626 / 0 | FAIL: compile +36 |
| Scale | 43,876 / 2,088 / 0 | 43,876 / 2,088 / 0 | PASS |

These fresh results agree with the existing `scale-scene/nested-ops-output.txt`
and `scale-scene/templates-ops-output.txt` committed at the starting revision.
The meter validates instrumented versus uninstrumented scene byte identity and
one execution per stage. Its own inherited gates pass; the milestone's stricter
exact-equality gate fails. JSON reports retain full stage counts and definitions.

Reproduce from the repository root, sequentially because the inherited meter
uses a shared temporary bundle:

```sh
node --import tsx output/playwright/nested-wires/templates-scene/count-operations.mjs '{"nested":true,"directory":"output/playwright/nested-wires/presentation/m76","outputFile":"nested-operations.json"}'
node --import tsx output/playwright/nested-wires/templates-scene/count-operations.mjs '{"specFile":"output/playwright/nested-wires/templates-scene/scene-spec.json","directory":"output/playwright/nested-wires/presentation/m76","outputFile":"templates-operations.json"}'
node --import tsx output/playwright/nested-wires/templates-scene/count-operations.mjs '{"specFile":"output/playwright/nested-wires/scale-scene/scale-scene-spec.json","directory":"output/playwright/nested-wires/presentation/m76","outputFile":"scale-operations.json"}'
```

## Scope and remaining gates

- Lazy audit, toolbar wrapping, and filename labels: not implemented after STOP.
- Application, geometry, audit logic, invariant verifiers, scene artifacts, and
  selection runner: unchanged. No new `*.test.ts`.
- Structural identity and all three invariant suites: not rerun after STOP;
  no new passing assertion is claimed for them.
- Load medians, stage decomposition, selection timing, and screenshots: not run.
  No browser or server was launched; ports 5188, 5190, and 5191 were untouched.
- `pnpm check`: exit 0 on the first isolated run; 70 files / 208 tests passed.
  Full output is recorded in `pnpm-check.txt`; no timing retry was needed.
- No push or PR. Evidence and this STOP are retained on the assigned branch.

The required next decision is an explicit correction of the exact-counter
baselines or a revised permitted scope. A scheduling/presentation change cannot
alter these Layout counts; changing Layout work or the meter to force the stated
numbers would violate this milestone. This report does not claim M7.6 completion.
