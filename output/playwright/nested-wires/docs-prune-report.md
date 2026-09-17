# Documentation prune — STOP evidence

Branch: `feat/docs-prune`; starting HEAD: `b14ea8b`. The worktree was clean.
Authority: `/Users/christopherdasca/Documents/Codex/2026-09-16/fi/orchestration/docs-prune.md`, with the user's newer base instruction taking precedence over its `cf4a6e6` statement.

## Blocking baseline incompatibility

**STOP before deletions, restoration, or README rewrite.** The mandatory root verifier fails on the untouched baseline. A Markdown-only change cannot make its geometry assertion pass. No verifier, scene, threshold, protected artifact, or production source was changed to manufacture a pass. This is a mandatory-gate conflict, not an unresolved deletion-reference claim.

- `verify-evidence.py:63` requires at most six crossings; the existing scene has 23. It exits 1 before inspecting the README.
- Its later checks still require 12 screenshots and 12 oracle wires; the current calculations contain 26 per-wire totals. The brief's description of a 12-wire acceptance contract is stale for this baseline.
- The current README is 888 lines. Literal verifier strings `19768`, `104`, and `226.3` are absent before any edit. Thus the requested verbatim preservation cannot be described as preservation of already-present strings. The existing narrative uses other historical values/formatting.
- Merely inserting those three strings cannot repair the earlier geometry failure. Changing non-Markdown evidence is explicitly forbidden, and changing the acceptance gate would contradict this documentation-only task.

Resolution needed before re-entry: supply a baseline whose root verifier passes, or explicitly amend which acceptance verifier applies to this 26-wire scene and identify the intended historical README acceptance numbers. No gate exception has been assumed.

## Gate results

| Gate | Result |
| --- | --- |
| Root evidence verifier | FAIL, exit 1 on untouched baseline; full output below |
| Declutter audit | Exit 1 at its hard-coded branch assertion; permitted branch-specific exception, output below |
| M9a offline verifier | PASS, exit 0 in an isolated archive of `b14ea8b`, output below |
| `pnpm check`, run alone | PASS, exit 0; 70 files, 208/208 tests |
| README ≤100 lines | NOT MET; preserved at 888 lines after STOP |
| Scope | Only this Markdown STOP report is added; no deletions, new tests, source edits, or non-Markdown edits |

M9a's runner writes logs/operation files under its protected directory; its child suites also rewrite canonical artifacts. To honor the no-touch rule, it ran from a temporary `git archive HEAD` copy with existing workspace dependency directories linked in, `GIT_DIR` pointing to this worktree's Git metadata, `GIT_WORK_TREE` pointing to the copy, and a private copied index. No checkout or branch switch occurred. An initial copy lacked package-local dependency links and failed to resolve `zod`; linking those existing dependency directories corrected the isolation setup, after which the full verifier passed. This is baseline verification in a copy, not a claim that a prune was completed.

## Reference-safety decisions

Before considering each candidate, the exact mandated search was executed from the repository root:

```sh
grep -rn "<basename>" --include='*.py' --include='*.mjs' --include='*.mts' --include='*.ts' --include='*.md' output/ capability/ apps/
```

All searches exited 0 (matches) or 1 (none), with no errors. No deletion occurred. Counts are raw matching output lines, including broad substring/regex matches: a generic basename is not proof that every result targets the candidate. Before is the untouched tree; after includes this report's references. File line counts exclude this report and remain unchanged. Existing references are preserved by keeping their targets; no ambiguous reference was redirected.

| Candidate relative to nested-wires | Decision/reason | File lines before → after | Grep lines before → after |
| --- | --- | ---: | ---: |
| `m3-blocker.md` | Keep: global gate STOP before any deletion (no basename hits) | 62 → 62 | 0 → 1 |
| `m3-junction-blocker.md` | Keep: global gate STOP; existing basename references retained | 62 → 62 | 1 → 2 |
| `m3-source-review.md` | Keep: global gate STOP; existing basename references retained | 40 → 40 | 1 → 2 |
| `m4-completion-report.md` | Keep: global gate STOP; existing basename references retained | 268 → 268 | 2 → 3 |
| `m4-pin-ruling-stop-report.md` | Keep: global gate STOP; existing basename references retained | 78 → 78 | 1 → 2 |
| `m4-source-review.md` | Keep: global gate STOP; existing basename references retained | 47 → 47 | 2 → 3 |
| `m4-stop-report.md` | Keep: global gate STOP; existing basename references retained | 124 → 124 | 1 → 2 |
| `m4-visual-budget-stop-report.md` | Keep: global gate STOP; existing basename references retained | 113 → 113 | 1 → 2 |
| `m45-completion-report.md` | Keep: global gate STOP; existing basename references retained | 333 → 333 | 2 → 3 |
| `m45-source-review.md` | Keep: global gate STOP; existing basename references retained | 34 → 34 | 1 → 2 |
| `m45-stop-report.md` | Keep: global gate STOP; existing basename references retained | 196 → 196 | 2 → 3 |
| `m45-visual-review.md` | Keep: global gate STOP; existing basename references retained | 17 → 17 | 2 → 3 |
| `presentation/declutter/report.md` | Keep: global gate STOP; existing basename references retained | 313 → 313 | 31 → 47 |
| `presentation/declutter/source-review.md` | Keep: global gate STOP; existing basename references retained | 76 → 76 | 12 → 23 |
| `presentation/declutter/visual-review.md` | Keep: global gate STOP; existing basename references retained | 39 → 39 | 14 → 18 |
| `presentation/m76/source-review.md` | Keep: global gate STOP; existing basename references retained | 31 → 31 | 12 → 23 |
| `presentation/m76/stop-report.md` | Keep: global gate STOP; existing basename references retained | 45 → 45 | 14 → 25 |
| `presentation/port-ab/source-review.md` | Absent at specified path; no deletion | 0 → 0 | 12 → 23 |
| `scale-scene/port-ab/source-review.md` | Keep: global gate STOP; existing basename references retained | 57 → 57 | 12 → 23 |
| `scale-scene/ruling5-source-review.md` | Keep: global gate STOP before any deletion (no basename hits) | 44 → 44 | 0 → 1 |
| `scale-scene/ruling5-visual-review.md` | Keep: global gate STOP; existing basename references retained | 40 → 40 | 2 → 3 |
| `source-review.md` | Keep: global gate STOP; existing basename references retained | 62 → 62 | 12 → 23 |
| `templates-scene/resume-stop-report.md` | Keep: global gate STOP; existing basename references retained | 158 → 158 | 1 → 2 |
| `templates-scene/resume2-report.md` | Keep: global gate STOP; existing basename references retained | 221 → 221 | 1 → 2 |
| `templates-scene/resume2-source-review.md` | Keep: global gate STOP; existing basename references retained | 89 → 89 | 1 → 2 |
| `templates-scene/source-review.md` | Keep: global gate STOP; existing basename references retained | 29 → 29 | 12 → 23 |
| `templates-scene/stop-report.md` | Keep: global gate STOP; existing basename references retained | 87 → 87 | 14 → 25 |
| `templates-scene/visual-review.md` | Keep: global gate STOP; existing basename references retained | 46 → 46 | 14 → 18 |

Examples of references that require keeping targets under protocol #4:

- Root README lines 1 and 292 reference the M4.5 completion report; lines 5 and 244 reference the M4 completion report.
- `scale-scene/ruling5-report.md:162` links its visual review, so that review cannot be removed while retaining the report unchanged.
- Root README line 855 links the M7.6 source review; that target remains intact.
- The requested presentation port-A/B review path is absent; the corresponding existing review is under `scale-scene/port-ab/`. Neither path was silently substituted for deletion.

All hard-kept files remain byte-identical to starting HEAD, including the frozen styling trio, presentation STOP, templates extraction report, scale-up/scale-scene STOPs, ruling #5 report, M7.6 amended report, all M9a files, and all non-Markdown files. All other Markdown files are also unchanged.

## Located restoration sources (not restored after STOP)

| Destination relative to nested-wires | Source branch | Git blob | Lines |
| --- | --- | --- | ---: |
| `compacting/stop-report.md` | `feat/m75-compacting` | `8828d95f7918634f4599f2203307bde8a1160357` | 333 |
| `compacting/m75b/stop-report.md` | `feat/m75-compacting` | `034a7fd4e159ac34a105d3379194444733c0d661` | 223 |
| `authoring-scene/stop-report.md` | `feat/m8-authoring-scene` | `85a61f649e804aa10bf939c95e2a9a2c6af680ca` | 193 |
| `authoring-scene/m8b/stop-report.md` | `feat/m8-authoring-scene` | `113006fc2eef09aa71b700fad89cda8a9c5724a9` | 281 |

Each exact source path was verified with `git show` and `git rev-parse`; all four destinations remain missing as at task entry. Restoring them and pruning/restructuring the README remain unperformed work, not completed acceptance.

## Verifier output

Root verifier, executed in the actual unchanged worktree, exit 1:

```text
Traceback (most recent call last):
  File "/Users/christopherdasca/Programming/Novakai-Canvas-next-templates/output/playwright/nested-wires/verify-evidence.py", line 85, in <module>
    quality = shape_quality(scene, browser)
  File "/Users/christopherdasca/Programming/Novakai-Canvas-next-templates/output/playwright/nested-wires/verify-evidence.py", line 63, in shape_quality
    assert len(crossings) <= 6, result
           ^^^^^^^^^^^^^^^^^^^
AssertionError: {'wireOverlapCount': 0, 'selfOverlapCount': 0, 'crossings': [('w01', 'w09', 539, 457), ('w01', 'w24', 533, 457), ('w02', 'w09', 539, 449.5), ('w02', 'w24', 533, 449.5), ('w03', 'w09', 539, 645), ('w03', 'w23', 365, 651), ('w03', 'w24', 533, 645), ('w05', 'w06', 1845, 675), ('w09', 'w18', 1509, 429), ('w09', 'w23', 539, 651), ('w09', 'w24', 534.5, 849.5), ('w10', 'w21', 1845, 1033), ('w11', 'w26', 1477, 1591.5), ('w12', 'w24', 533, 251), ('w15', 'w23', 359, 651), ('w16', 'w17', 1645, 1371), ('w16', 'w21', 1833, 1033), ('w16', 'w22', 1833, 1027), ('w17', 'w26', 1477, 1585.5), ('w18', 'w24', 533, 257), ('w21', 'w26', 1038.5, 1033), ('w22', 'w26', 1038.5, 1027), ('w23', 'w24', 533, 651)], 'labelCollisionCount': 0, 'labelNodeCollisionCount': 0, 'minimumLabelHaloContrast': 5.892601677370216, 'headingBodyRatio': 1.4875}
```

Declutter audit, executed in the actual worktree, exit 1:

```text
Traceback (most recent call last):
  File "/Users/christopherdasca/Programming/Novakai-Canvas-next-templates/output/playwright/nested-wires/presentation/declutter/verify-audit.py", line 13, in <module>
    assert run(['git', 'branch', '--show-current']).decode().strip() == 'feat/m65b-declutter'
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
AssertionError
```

The branch assertion is line 13, before extraction or any writes. Staying on the explicitly required `feat/docs-prune` makes it impossible to run this verifier successfully. It was not patched or bypassed.

M9a offline verifier in the isolated baseline copy, exit 0:

```text
identity: exit 0
verify-nested-wires: exit 0
verify-invariants: exit 0
verify-m3-topology: exit 0
verify-m45-pins: exit 0
verify-m45-geometry: exit 0
verify-structural-identity: exit 0
verify-lanes: exit 0
verify-static: exit 0
verify-oracle: exit 0
verify-m45-topological-bound: exit 0
templates-invariants: exit 0
scale-invariants: exit 0
nested-ops-amended: exit 0
PASS nested: exact compile/routing/discovery [19768, 992, 0]
templates-ops-amended: exit 0
PASS templates: exact compile/routing/discovery [28443, 1626, 0]
scale-ops-amended: exit 0
PASS scale: exact compile/routing/discovery [43876, 2088, 0]
```

## Full check evidence

`pnpm check` ran alone in the actual worktree after the offline verifier completed, with no other verifier, browser, or test command running concurrently. Exit 0:

```text
 Test Files  70 passed (70)
      Tests  208 passed (208)
   Start at  23:10:35
   Duration  18.35s (tests 73%, import 14%, transform 10%, environment 2%)
```

A separate `git diff --exit-code 11f2db3 --` comparison of the three frozen styling Markdown files and presentation STOP also exited 0. `git diff --exit-code HEAD` confirmed that all previously tracked files remain unchanged. The only new file is this report, committed locally on the requested branch.

## Delivery

Original Markdown remains 5,056 lines, plus this STOP report. Zero existing file bytes changed. README remains 888 lines; no shrinkage or completed prune is claimed. No push or PR.
