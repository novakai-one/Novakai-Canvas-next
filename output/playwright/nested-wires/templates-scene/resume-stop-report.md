# M6 resume — STOP at DoD 4 (frozen projection invariants)

2026-09-17. Branch `feat/templates-scene`; resumed from `6c8e4f3`.
**M6 is incomplete.** The authorized nested-only placement bug is fixed;
a different required invariant gate now fails on the real source graph.

## Why this requires STOP

The brief permits only a minimal zero-direct-node placement fix and freezes
routing law, lanes, gates, pin rows and road topology. All 29 value requests
return `ok: true`, but that success does not establish the required geometry
invariants. The independently observed failures are:

- **9 off-owned-corridor segments:** `w11:1–3`, `w12:1–3`, `w25:25–27`.
- **21 invalid boundary-crossing segments:** full identities and geometry are
  preserved in `invariant-failures.json` and pasted below.
- **3 positive-length overlaps**, with no shared-terminal exemption:

| Pair | Actual value edges | Shared geometry | Length |
| --- | --- | --- | ---: |
| w10 / w11 | errors.ts → plan.ts / select.ts | world road, y=989, x=1615…1627 | 12 |
| w10 / w12 | errors.ts → plan.ts / instantiate.ts | world road, y=989, x=1621…1627 | 6 |
| w11 / w12 | errors.ts → select.ts / instantiate.ts | world road, y=989, x=1621…1633 | 12 |

Provider in these pairs is `contract/errors.ts`; consumers are respectively
`core/admission/plan.ts`, `core/discovery/select.ts`, and
`core/expansion/instantiate.ts`. All overlaps belong to the pipeline-generated
`world:horizontal:944:64` corridor. Wire evidence and exact import lines are
in `extraction-report.md`.

A separate local witness makes the scope limit explicit: the first segment
of w11 goes from `(377,716)` to `(377,740)`, assigned to
`drive:node-5:exit-bottom`. That driveway's bounds are
`{x:326,y:716,width:84,height:20}`, so its end is y=736. The six-wire terminal
fan extends four units past its owned driveway. This is a node in **contract**,
which has six direct nodes; changing its fan or driveway capacity is outside
the zero-direct-node path. The invalid overlapping projected world segments
likewise require more than making the child-only core's size finite. No
hand placement, graph flattening, dummy node, changed edge set/order search,
or routing/projection patch was used to evade the failure.

The existing public inspector is unmodified. The new segment-pair audit
computes rectangle intersections from the returned wire segments; it does not
trust the router's `ok` bit. Positive-length overlaps alone disprove DoD 4,
regardless of how perpendicular crossings might later be certified.

## Completed scope

- Minimal production diff in `prototype-nested-placement.ts`: zero rows for
  zero nodes, return before zero-row node division, and explicit `RangeError`
  for a section with neither nodes nor children. Caller corrects and rebuilds.
  Direct-node sections retain their arithmetic; road construction is unchanged.
- TypeScript compiler API extractor, no new dependencies: 16 nodes, exact nine
  directory sections, 29 value wires; 3 external and 42 internal type-only
  declarations dropped. No delta from the approximate 29-wire survey.
- Deterministic coordinates-free semantic JSON, source-line table, four isolated
  files, alphabetical direct-node order, documented root/child ordering.
- New **partial STOP runner**, `verify-templates-scene.mjs`, verifies placement,
  finite geometry, nested-only regression, empty rejection, determinism, each
  measured stage once, route count, and failing containment/overlap gates.
  Full pin-row, crossing-count and topological certification work is **not
  implemented or claimed** after the required STOP.
- Existing M1–M5 verifier scripts, canonical nested scene and references remain
  unchanged. Source review for the sole production file: 145/160; Sonar ≤2
  enforced by the normal gate.

## Reproduction and pasted output

Run from the repository root. No server/browser is needed to reproduce this
blocker. No process on 5188 was started, stopped, killed or probed. No server
on 5190 was started because acceptance failed before browser integration.

```sh
node --import tsx output/playwright/nested-wires/templates-scene/extract-scene.mts
node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs
```

Extractor exits 0. The runner exits **1**, intentionally preserving the failure:

```text
16 nodes / 9 sections / 29 wires; 45 dropped declarations
PASS 16 nodes / 9 sections; every node and child inside its owner; finite bounds
PASS minimal nested-only regression and explicit empty-section rejection
PASS two complete builds byte-identical; each one-way pipeline stage once
PASS all 29 value wires route ok:true
INSPECTION {"corridors":["w11:1","w11:2","w11:3","w12:1","w12:2","w12:3","w25:25","w25:26","w25:27"],"nodeBodies":[],"boundaries":["w01:17","w04:8","w07:9","w09:7","w10:8","w11:8","w12:8","w13:8","w14:8","w16:14","w17:14","w18:14","w18:19","w19:14","w19:19","w20:10","w20:15","w21:13","w21:18","w25:13","w25:18"],"continuity":[]}
FAIL all wires inside corridors; gate-mouth crossings only; no body or continuity failures
FAIL zero positive-length parallel/coincident wire overlaps: 3 !== 0
STOP DoD 4: containment and overlap gates fail before crossing certification. No acceptance claim.
```

Full unabridged output: [invariant-output.txt](invariant-output.txt).
Detailed generated geometry: [invariant-failures.json](invariant-failures.json).

Two consecutive extractor runs, copied first-run artifacts into a temporary
directory, then `diff -u` for each artifact:

```text
run 1: 16 nodes / 9 sections / 29 wires; 45 dropped declarations
run 2: 16 nodes / 9 sections / 29 wires; 45 dropped declarations
diff scene-spec.json: exit 0
diff extraction-report.md: exit 0
```

`node --import tsx output/playwright/nested-wires/verify-structural-identity.mjs`
exits 0; the script itself is unchanged:

```text
PASS frozen nodes: byte-identical to 0e5f21e
PASS frozen sections: byte-identical to 0e5f21e
PASS frozen road ids + bounds: byte-identical to 0e5f21e
PASS frozen wire routes (ordered road sequences): byte-identical to 0e5f21e
PASS frozen gates: byte-identical to 0e5f21e
MEASURE per-wire lane-index diffs=37
PASS deterministic regeneration: two fresh scene serializations byte-identical
PASS current canonical scene matches fresh public builder: 24 nodes / 26 wires
PASS zero new tracked *.test.ts files
```

The 37 lane-index differences are the inherited M4.5 differences from its
`0e5f21e` baseline, not M6 changes. The full fresh scene also matches the retained
canonical JSON byte for byte. Full stdout:
[resume-structural-identity-output.txt](resume-structural-identity-output.txt).

`pnpm check` exits 0:

```text
$ pnpm typecheck && pnpm lint && pnpm format:check && pnpm architecture && pnpm test
$ tsc --noEmit
$ eslint .
All matched files use Prettier code style!
Test Files  70 passed (70)
Tests  208 passed (208)
```

Full stdout: [resume-pnpm-check-output.txt](resume-pnpm-check-output.txt).
No new `*.test.ts` files, dependencies or lockfile changes.

## Binary DoD status

FAIL includes incomplete or not-run items. No partially verified item is PASS.

| DoD | Status | Evidence / limitation |
| --- | --- | --- |
| 1. `pnpm check`, ≥208 tests, zero new tests | PASS | Exit 0; 70 files / 208 tests. Full log above; test-file diff empty. |
| 2. Committed deterministic extractor, exact graph, source trace | PASS | 16 nodes / nine sections / 29 wires; both consecutive-run diffs exit 0; every wire row includes consumer line and statement. |
| 3. `?templates` render and successful placement/routing | FAIL | Public builder places all nodes/sections and routes 29/29; browser route integration/render not attempted after invariant STOP. |
| 4. All templates invariants and zero uncertified crossings | **FAIL — STOP blocker** | 9 corridor and 21 boundary violations; 3 positive-length overlaps. Full certification and pin-row checks not claimed. Deterministic rebuild and stage counts pass. |
| 5. Ops, five loads, 32-node clone, scaling answer | FAIL — not run | No timing, ops, clone-growth or 150-node/300-wire cost claim substituted for measurements. |
| 6. Two headless 1920×1440 screenshots | FAIL — not run | No browser opened or screenshots generated. No visual acceptance claim. |
| 7. Unchanged nested structural identity | PASS | Exit 0; full canonical serialization matches. |
| 8. README with all findings/costs | FAIL — partial | Appended extraction rules/counts, hub observations, empty-spec decision and STOP evidence. Ops/scaling/visual findings are explicitly unavailable. |
| 9. Branch, sliced commits, clean status | PASS for STOP handoff | Remains on `feat/templates-scene`; separate placement, extraction, and STOP-evidence commits. Final status and four-commit log are pasted in the handoff reply. |

No push, PR, subagents, browser interaction or changes to frozen production
geometry beyond the zero-node placement fix. Resume needs an orchestrator
ruling on the failing projection/capacity invariants; the current brief does
not authorize their repair. **Do not treat this handoff as M6 completion.**
