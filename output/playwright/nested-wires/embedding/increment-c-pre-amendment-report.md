# Increment C — STOP: retained bridge template exceeds its materialized support

**C is not complete. No product candidate was made.** The read-only reproduction reaches the brief's judgment-call STOP: the remaining w84 defect is a nominal three-row bridge bundle in a street only 12 units wide. It is not the old diagonal median clamp, a forward adjustment, or an ownership-only defect. Selecting a different bundle placement or changing support capacity needs a scope/policy ruling. This is a specific unsupported retained template, **not a proof that every possible projection-only repair is impossible**.

Base/head: `7b3f232`, branch `feat/m10f3-embedding`. The required design §3/§7-C and B report were read first. No fixture, product source, demand, rank, gate, certifier, threshold, reference image or accepted B artifact was changed. No subagents were used. No browser/server was started or contacted; all protected ports remain untouched. D was not started.

## Exact STOP and why it applies

The [C brief](/Users/christopherdasca/Documents/Codex/2026-09-16/fi/orchestration/m10f3-increment-c.md) says:

> Mechanical self-introduced issues: fix and continue. STOP mandatory for: regressions, test failures, fixture tuning, gate weakening, judgment calls.

It limits the repair to emission **within the supports B materialized**. The existing `streetBridge` template (`capability/layout/core/nested-lane-projection.ts:168–177`) picks a nested row from the destination count/rank. The retained three users have identical incoming/outgoing ranks, so neither occupied-rank predicate selects a median. The observer confirms every nominal bridge equals its adjusted bridge; `forwardConnection` is not involved here.

| Wire | Destination rank / count | Selected row y | Street contains row |
| --- | --- | ---: | --- |
| w80 | 2 / 3 | 2345.5 | yes |
| w81 | 1 / 3 | 2351.5 | yes |
| w84 | 0 / 3 | 2357.5 | **no: 3 units past upper edge** |

The registered owner is `section-13:horizontal:2348.5:5372.5`, with bounds `x=5366.5, y=2342.5, width=702, height=12`, and `wireLaneCount=0`. These are bridge connector uses, not allocated travel lanes on that horizontal street. The current rank template starts half a pitch (3) from one edge, then advances by pitch 6: `2342.5 + 3 + {0,6,12}`. Its last selected row exceeds the available span. The incoming vertical street also ends at `2354.5`.

| Current witness | From | To | Recomputed containing roads |
| --- | --- | --- | --- |
| w84:6 | (5705.5,2354.5) | (5705.5,2357.5) | none |
| w84:7 | (5705.5,2357.5) | (5597,2357.5) | none |

Both endpoints of every segment were checked against every current registered road for this diagnostic. In particular, M10f-1 junction-mediated attribution cannot rescue either whole segment: no road contains it. Both relevant registered junction rectangles also end at `y=2354.5`. Reattribution without support would falsify containment.

Keeping w80/w81 fixed leaves no six-unit-spaced forward nested row for w84 inside the street. Redistributing all three rows onto both street edges would change the existing half-pitch inset policy. Expanding the street changes B's materialized capacity/support. Choosing another turn topology changes the retained template. No such alternative was attempted, and no nearest-point clamp, row compression or new ownership policy was silently introduced. Returning an explicit infeasibility alone would also not satisfy C's required successful real-scene output.

The support graph's `bridgeSeparation` records forward/column and lateral ordering; those inequalities alone do not establish this bridge row's containment in its owner. The accepted B graph/contact receipt therefore does not override this directly measured C witness. This finding does not reopen B's accepted milestone or claim its reported two corridor failures were hidden.

## Reproduction and catalogs

[Probe](probe-increment-c.mjs), [printed receipt](increment-c-probe.txt), and [full segment/support/contact evidence](increment-c-stop-evidence.json). The probe builds each scene twice through the public contract, compares complete bytes to accepted B, and instruments only a read-only observation in a temporary in-memory bundle. Observed authoring output equals ordinary public output exactly. No product import boundary is changed.

| Catalog | Accepted B | Current reproduction | C requirement |
| --- | ---: | ---: | --- |
| Corridors | 2 | 2 | **0 — not achieved** |
| Bodies | 0 | 0 | 0 held |
| Boundaries | 0 | 0 | 0 held |
| Continuity | 0 | 0 | 0 held |
| Reversed | 0 | 0 | 0 held |
| Owned-gate omissions | 0 | 0 | 0 held |
| Overlap reports | 3 | 3 | ≤3 held; D owns zeroing |
| Uncertified crossings | 951 | 951 | ≤951 held; D owns zeroing |

All five complete scenes reproduce twice and equal accepted B bytes: default, hub, templates, scale, authoring. The catalog extraction uses the same pinned independent verifier helpers as B; no targets or assertions were weakened. This is reproduction of the known red C input, not a newly failing product test or a green C acceptance claim.

## Historical contacts recomputed, not ordinal-matched

The probe recomputes each historical intersection from its saved segment endpoints, then tests every current segment pair for the same two wire identities. Full current segments and any contacts are printed in the JSON evidence; old ordinals are not carried across geometry changes.

| Historical witness | Recomputed historical contact | Current B/current contact set |
| --- | --- | --- |
| w03 / w13 rejected median collision | (3190,454), length 6 | empty |
| O2 w26 / w61 terminal sharing | (6274,1681), length 6 | empty |
| O2 w36 / w67 terminal sharing | (6268,1675), length 12 | empty |

For w03, the current median segment is `(3094,638.5)→(3340,638.5)`. The w13 terminal segment at the same y is `(3386.5,638.5)→(3392.5,638.5)`: a 46.5-unit gap separates them. w03's two median columns remain distinct, x=3094 and x=3340. These are B's repaired positions, not an effect of C. There is no C after candidate, so no invented before/after success is reported.

## Still owned by D

1. w05/w06 overlap at (6899,1761), length 1.5.
2. w31/w56 overlap at (5803,627.5), length 1.5.
3. w56/w65 overlap at (5853.25,705.5), length 50.25.
4. 951 uncertified crossings and the unresolved authoring proof topology.

C additionally still owes both w84 corridor repairs and its full interval/support-consumption implementation. No scene-legality claim is made.

## HUMAN EXPERIENCE REVIEW

No new rendered output was produced after the STOP. The required visual SOP, references and benchmark were read; B's existing visual review remains historical evidence only. There is no new visual acceptance claim, no candidate capture, and no pixelmatch result. A future authorized C candidate still requires the witness-region before/after captures, full-scene roads-off captures, pixelmatch and personal inspection on headless port 5198.

## Delivery boundary and remaining binary gates

- Public five-scene twice-deterministic, B-byte-identity reproduction and current catalogs: passed.
- w84 support diagnosis and historical w03/O2 contacts: recorded with actual segment endpoints.
- Corridors 2→0 and full gate/normal-support consumption: **not achieved**.
- Fresh templates/scale complete verifier runs, operations before/after and doubled growth: not claimed; no candidate exists. B's retained receipts were not overwritten or presented as new C measurements.
- Product source reviews: not applicable; zero product files changed.
- `pnpm check`: **exit 0, 70/70 files, 208/208 tests**, including typecheck/lint/format/architecture; [check receipt](increment-c-pnpm-check.txt).
- Captures/pixelmatch/HUMAN EXPERIENCE acceptance: incomplete as stated above.
- Commit/push/PR update: withheld for this stopped, incomplete increment. No success was published to PR #73.
- D: unauthorized and untouched.

The scope decision needed before resuming is whether to expand the admitted bridge support for connector-only demand, or authorize a different supported bundle-placement template. Neither was selected on the user's behalf.

Reproduce without overwriting B evidence:

```sh
node --import tsx output/playwright/nested-wires/embedding/probe-increment-c.mjs
pnpm check
```
