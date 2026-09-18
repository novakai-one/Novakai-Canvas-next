# M10f legality spike — STOP, incomplete

> Historical Run 1 record. Superseded by `analysis.md` and Amendment 1 of the orchestration brief, which permits correcting this scratch-diagnostic runtime error and continuing. The account below is retained unchanged as history.

The brief's literal STOP clause was triggered by an exploratory Python diagnostic's runtime failure. No recovery or further analysis was attempted after the failure.

Authority: `/Users/christopherdasca/Documents/Codex/2026-09-16/fi/orchestration/m10f-legality-spike.md`, “Mechanical self-introduced lint/typecheck/complexity issues: fix and continue. Anything else: STOP with evidence.” A runtime TypeError is outside that enumerated allowance.

## Exact failure

The read-only command loaded the committed extraction manifest, then attempted to print the first two elements of each selected field:

```python
m = json.loads(subprocess.check_output([
    'git', 'show',
    '534fd8d:output/playwright/nested-wires/authoring-scene/extraction-manifest.json'
]))
for key in ['imports', 'excludedTypeOnlyImports', 'external']:
    print(key, m[key][:2])
```

It printed the first two `imports` records, then failed on `excludedTypeOnlyImports`, which is the integer `111`, not an array:

```text
Traceback (most recent call last):
  File "<stdin>", line 3, in <module>
TypeError: 'int' object is not subscriptable
```

The command exited 1. This is an agent-introduced diagnostic mistake, not evidence of a product defect or corrupt fixture.

## Preserved work, not a completed delivery

- M10b `git log` verified `534fd8d` is committed on `feat/m10b-dogfood`. Its clean worktree HEAD was `1ff0be8`, one later refactor commit. The replay reads the five fixture JSONs directly from commit `534fd8dd4e6b22e143008b975795125c1b538c73`; their hashes are in `classification.json`.
- `replay.mjs` successfully reproduced the committed inspector failures and classified every supplied witness. `classification.json` preserves all identities, geometry, boundary contacts, topology and proof-abort evidence. Classification success is not scene legality.
- Corridors: 2 diagonal median-bridge/clamp defects and 2 connector ownership defects. Node bodies: 40 witnesses on demand-widened streets. Boundaries: 45 displaced-gate-only witnesses, 22 mixed displaced-gate/spill witnesses, 20 spill-only witnesses; 119 wall contacts total (67 displaced gate / 52 spill). Overlaps: 12 diagonal bounding-box artifacts, 2 terminal backtrack overlaps, 4 cross-corridor channel overlaps. All 1,273 uncertified entries follow the prover's global abort at overlapping J17/J145 regions before any certificates are generated. Nine overlapping proof-region pairs are recorded. These findings still require the requested reviewed narrative with source citations.
- The rendered value-wire graph has 47 nodes, 119 directed edges, no cycles (`cycles: []`), max incoming degree 19 and max outgoing degree 10. Full histograms, top-five hubs and direct/subtree densities are in `classification.json`. The failed exploratory command was beginning an additional check of type-only imports; no conclusion about that broader graph is claimed.
- `probes.mjs` executes the pinned medianBridge/forwardConnection code in memory and reproduces both diagonal segments exactly. `probes.json` records the inputs and emitted segments.
- An immutable ownership-only counterfactual assigns `w41:16` and `w41:17` to their containing incoming vertical street within the registered junction. Corridor witnesses drop 4 → 2; coordinates, lane IDs, body/boundary/continuity results, and the overlap catalog remain unchanged. This supports a possible first milestone, not a implemented or fully validated generic fix.
- Supplementary observations in `probes.json`: 28 reversed assigned segments, 96 missing owned gate traversals, zero terminal pins outside the six-unit margin. These are needed when planning eventual verifier exit 0.
- `pnpm check` completed with exit 0, 70 test files and 208/208 tests (`pnpm-check-output.txt`, `pnpm-check-exit.txt`). It was started before the final supplementary probe edit, so it does not establish a full final-tree check. The latest scripts separately passed ESLint afterward.
- No product source was changed. The last observed git status was clean outside this new `output/playwright/nested-wires/legality-spike/` directory on `feat/order-trial`.

## Binary DoD status

Incomplete: `analysis.md`, fully evidenced ordered minimal change set, final first-milestone recommendation, script standards reviews, repeated deterministic-output check, final-tree `pnpm check`, commit and push remain outstanding. No PR was created. No commit or push was attempted after the STOP.

To respect the literal clause, this turn ends here rather than repairing the diagnostic command or continuing the analysis.
