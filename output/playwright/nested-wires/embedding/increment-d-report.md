# Increment D — STOP: accepted support geometry conflicts with complete verifier

**D is incomplete. No legal-scene repair is claimed or implemented.** At accepted head `7d717124ddc40c8a58b7cfbc59f162c26c75cb70`, the unchanged complete authoring verifier exits **1**. Its road-width assertion conflicts with C's explicitly accepted support growth. Resolving that contract requires a judgment call, so the D brief's mandatory STOP applies before product or certifier edits.

The complete verifier also corrects the brief's starting proof diagnosis: **zero overlapping proof-region pairs; 800 covered crossings; 151 uncovered; actual 951; derived bound 803**. The earlier catalog's 951-uncovered value comes from deliberately supplying an empty certificate map, not a remaining global abort. This is a measurement correction on identical geometry, not a D improvement.

Read before diagnosis: the D brief, design §4/§7-D, ordertrial legality-spike analysis including steps 4/6 and J17/J145 traces, and accepted B/C reports. No subagents, fixture edits, product edits, certifier edits, threshold changes, reference changes, browser sessions or server access occurred. Protected ports were untouched.

## Mandatory ruling: nominal road width versus support envelope

The single width mismatch is:

| Field                                | Observed value                           |
| ------------------------------------ | ---------------------------------------- |
| Road                                 | `section-13:horizontal:2348.5:5372.5`    |
| Bounds                               | x=5366.5, y=2342.5, width=702, height=15 |
| Assigned lane count                  | 0                                        |
| Complete verifier's required breadth | `12 + 12 * 0 = 12`                       |
| Actual breadth                       | **15**                                   |

C's report explicitly accepts **12→15** to contain w84's selected bridge row at y=2357.5, preserving rows and rebinding attached caps/driveway. `nested-embedding-roads.ts:36–37` materializes the nominal demand breadth plus recorded support growth. The complete verifier at `verify-templates-scene.mjs:247` instead requires physical breadth to equal nominal demand breadth exactly.

This is not a self-introduced mechanical error. Shrinking the road would undo C's containment repair. Replacing equality with a minimum-width check would weaken the verifier and is forbidden. Separating nominal lane geometry from a provenance-backed support envelope, or revising the geometry/construction model while preserving literal equality, requires a ratified choice. **No such choice is made here.** The requested ruling is which width/support contract the full verifier must establish, while retaining exact pitch, lane positions, containment and negative controls. A proof must justify any replacement invariant before its implementation; a blanket inequality is not proposed.

## Complete-verifier reproduction and certificate accounting

The actual unchanged verifier was run directly with the unchanged authoring spec in a temporary output directory; configuration supplies only directory, 47/15/119 counts and the semantic tree. Assertions and negative controls are unchanged. [Direct process output](increment-d-authoring-verifier.txt), exit **1**. A separate in-memory invocation, redirecting artifact writes only, gives the same results in [baseline receipts](increment-d-baseline.json).

| Proof item                                         |       Complete result |
| -------------------------------------------------- | --------------------: |
| Overlapping proof-region pairs                     |                 **0** |
| Topological endpoint/linked-order stage            | Pass; no global abort |
| Actual distinct transverse contacts                |               **951** |
| Endpoint certificates                              |                   417 |
| Linked-order obstructions                          |                   386 |
| Sum of obstruction lower bounds                    |                   386 |
| Derived lower bound                                |   **417 + 386 = 803** |
| Contacts covered by endpoint certificates          |                   417 |
| Contacts covered by linked-order certificates      |                   383 |
| Total one-use covered contacts                     |               **800** |
| Uncertified contacts                               |               **151** |
| Uncertified contacts without a registered junction |                **16** |
| Existing certificate negative controls             |                  Pass |

The three-unit difference between lower bound 803 and covered count 800 is retained as evidence, not reconciled by adjusting counts. No new certificate model or extension is accepted. The current geometry already satisfies region disjointness; this run stops before a shared-channel geometry repair or a sufficiency argument for all two-endpoint paths. Six distinct invalid perimeter paths appear among the uncovered contacts' registered regions; none of those six has a source or target strictly inside its proof rectangle. This limited diagnostic does not prove that arbitrary region modifications avoid swallowing terminals.

The historical helper `ownership/verify.mjs:37–42` extracts the proof code **up to** `const certified =`, omits certificate-map construction, and calls coverage with `certified: new Map()`. Applied to C, it computes 417 endpoint certificates and bound 803 with **no recorded proof failure**, but necessarily reports all 951 hits uncovered. Both accepted B/C catalog scripts use this helper. J17/J145 was a valid pre-embedding spike failure; it is not the current failure. The pinned verifier at `1ff0be8` and the working-tree verifier have no source diff.

## Full catalog and residual witnesses

There is no D product candidate. Before and after are the same accepted C bytes; the target column states unmet acceptance rather than manufactured progress.

| Catalog / obligation                               | Fresh C baseline | D residual |                                  Required |
| -------------------------------------------------- | ---------------: | ---------: | ----------------------------------------: |
| Routed wires                                       |          119/119 |    119/119 |                                   119/119 |
| Corridors                                          |                0 |          0 |                                         0 |
| Bodies                                             |                0 |          0 |                                         0 |
| Boundaries                                         |                0 |          0 |                                         0 |
| Continuity                                         |                0 |          0 |                                         0 |
| Positive-length overlaps                           |            **3** |      **3** |                                         0 |
| Reversed assigned pieces                           |                0 |          0 |                                         0 |
| Owned-gate omissions                               |                0 |          0 |                                         0 |
| Full-verifier uncertified crossings                |          **151** |    **151** |                                         0 |
| Legacy empty-map helper uncovered count            |              951 |        951 | Not an actual certificate-coverage result |
| Width-contract violations                          |            **1** |      **1** |                                         0 |
| Registered-turn/assigned-interval segment failures |           **13** |     **13** |                                         0 |
| Complete verifier exit                             |            **1** |      **1** |                                         0 |

Pins pass. Direct replay finds zero assigned-lane coordinate mismatches; the combined pitch/direction/width gate nevertheless fails on 15≠12. It must not be reported as passing.

Unchanged positive-length overlaps:

- w05/w06: (6899,1761), length 1.5.
- w31/w56: (5803,627.5), length 1.5.
- w56/w65: (5853.25,705.5), length 50.25.

The 13 rejected turn segments, with fresh one-based ordinals, are w05:28/29/30, w20:4, w21:5, w56:40, w65:37, w76:5, w77:6, w80:5, w81:6, w84:6 and w88:5. Each includes an interval outside registered junctions and terminal-fan exemptions without the required assigned lane. This is additional full-verifier evidence, not a new D regression. The construction/turn seams in D may address these, but no repair is assumed.

Examples: w05/w06 at (6967.25,1875), w05/w25 at (6967.25,1959), and w05/w28 at (6967.25,1953) have no registered junction. At J296, w05 has two perimeter events but the event at (6926,1761) has no lane ID, so the current `junctionPath` correctly omits it. Exact segment, region, perimeter-event and certificate data are retained in [summary](increment-d-summary.json) and [full compressed diagnostic](increment-d-diagnostic.json.gz). The diagnostic runs after all unchanged verifier assertions; it does not authorize omitted paths or issue replacement certificates.

## Retained scenes and determinism

All five fresh public builds reproduce twice with identical serialization and equal their saved accepted C scene bytes. All four retained C snapshots equal B; default/hub additionally equal the original retained baseline. No retained-scene byte moved.

| Scene     | Complete verifier        | Crossings | Derived bound | Uncertified |
| --------- | ------------------------ | --------: | ------------: | ----------: |
| default   | Original-byte comparison |         — |             — |           — |
| hub       | Original-byte comparison |         — |             — |           — |
| templates | **exit 0**               |   **130** |       **130** |       **0** |
| scale     | **exit 0**               |   **112** |       **112** |       **0** |
| authoring | **exit 1**               |   **951** |       **803** |     **151** |

Templates/scale execute all original assertions and negative controls. [Per-scene receipts, messages and hashes](increment-d-baseline.json). Authoring SHA-256 remains `64db703e69a6f5fb760f4e1f071283acd01eb21783a09e5b6ed2b02f3acfd3c5`.

## Delivery boundary and outstanding DoD

The stop is a contract judgment, not a claim that full legality is mathematically unreachable. Product and verifier implementation are unchanged. No source-review score is invented: there are no changed first-party source files. This delivery contains diagnostic evidence and this report only.

Operation before/after measurements, doubled growth, five-load medians against B, legal-scene captures on 5198, Section 14 detail and HUMAN EXPERIENCE REVIEW are **not performed**: execution stopped before an authorized geometry choice and there is no legal candidate to measure or capture. B/C historical costs and captures are not relabelled as D evidence. The visual SOP/references/benchmark were read; no fresh visual acceptance is claimed.

`pnpm check` exits **0**, with **70/70 test files and 208/208 tests** passing, plus typecheck, lint, formatting and architecture checks. [Check log](increment-d-pnpm-check.txt). Green repository checks cannot override the authoring verifier's exit 1.

Commit/push and PR #73 update deliver the STOP evidence only. D's binary definition of done remains **NOT MET**.

## Reproduce the unmodified complete authoring verifier

From this worktree, this uses a fresh temporary output directory and leaves fixtures untouched:

```sh
python3 - <<'PY'
import json, pathlib, tempfile
root = pathlib.Path.cwd()
spec = json.loads((root / 'output/playwright/nested-wires/authoring-scene/scene-spec.json').read_text())
out = pathlib.Path(tempfile.mkdtemp(prefix='m10f3-d-verifier-'))
(out / 'scene-spec.json').write_text(json.dumps(spec))
def shape(s):
    return [s['number'], [n['label'] for n in s['nodes']], [shape(c) for c in s['children']]]
config = dict(directory=out.as_uri() + '/', nodeCount=47, sectionCount=15,
              wireCount=119, expectedShape=[shape(s) for s in spec['sections']])
pathlib.Path('/tmp/m10f3-d-verifier-config.json').write_text(json.dumps(config))
print(out)
PY
node --import tsx output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs "$(cat /tmp/m10f3-d-verifier-config.json)"
```

Expected **exit 1**, six failed checks, `CERTIFICATION 800 certified / 151 uncertified`. This is a failing acceptance command, not a passing diagnosis substituted for acceptance.
