# Increment A — STOP: unsupported retained adjustments

**Increment A is incomplete. Amendment 2 resolves hub w23: its 7.5-unit deficit is explicitly recorded and its existing adjustment passes the orthogonal-forward, byte-identity conditions.** Applying the same classification to all five scenes finds four backward non-median adjustments in authoring, as well as the two known C1 diagonals. The current adjusted shapes cannot be admitted as orthogonal forward templates. Implementation stops under the brief's explicit unsupported-support / judgment-call rule.

## Ratification-relevant evidence

| Required evidence | Result |
| --- | --- |
| Full authoring constraint-graph admission | **Not established.** The template diagnostic records six unsupported current adjustments; it is not a complete graph or public typed failure. |
| Default/hub complete slack | Not established. Default has no forward-clamp activation; hub's sole activation now passes Amendment 2, with its **7.5-unit nominal deficit retained**. This does not prove every support inequality slack. |
| Templates/scale exact full-envelope spill populations 13/7 | Prior design evidence; no completed ledger verification. Their 5/8 forward-clamp activations pass the local template check. Activations and envelope spills are different populations. |
| Calibrated preflight operations and T/C/G/V/E | Not measured: no public preflight or full constraint graph implemented. Existing builder counts were not re-measured in this continuation. |
| Ordinary scene bytes vs b9e098a, twice each | **Pass for all five scenes**, freshly replayed. |
| Ordinary authoring defect catalogs | **40 / 87 / 1,273 / 18 / 28 / 96 retained**, fresh complete-catalog equality. No legality claim. |
| Repository check | See final verification below. |
| Product source | No changes; `git diff b9e098a -- capability apps` is empty. |
| Commit / push / PR | Not performed; A has not passed its binary DoD. |

No geometry, projection, routing policy, fixture, baseline, or approved reference was changed. Execution was offline and headless; no server, browser, or protected port was used. B/C/D were not started.

## Amendment 2 — hub w23 admitted locally, deficit preserved

The evidence entry distinguishes all four required quantities:

| Field | Recorded value |
| --- | --- |
| Nominal anchor | y=633 |
| Preceding join end / minimum forward stem | y=639 / 1.5 |
| Required adjusted anchor | y=640.5 |
| Nominal deficit | **7.5** |
| Resolution template | `supported-orthogonal-forward-stem` |
| Byte-identity consequence | `current-adjusted-geometry-preserved` |

The incoming assigned stem is `(197,639) → (197,640.5)`. The connector pieces are `(197,640.5) → (198.5,640.5)` and `(198.5,640.5) → (198.5,651)`. Both pieces match exactly one ordinary emitted segment, including its serialized endpoints; both lie within their actual ordinary road owner. Both directions are positive, and the connector has one bend. The nominal anchor and deficit remain in the entry even though the existing shifted template realizes it without moving scene geometry.

The entire observed hub scene is byte-identical to the ordinary builder, and the ordinary builder is independently byte-identical to b9e098a, twice. SHA-256: `0abef2eb0dc74d5e8a3454ef447b6a3b15f5fc33a343b38b61f5f0e8c97247ca`. The public inspector reports zero corridors, bodies, boundaries and continuity defects for hub. This is evidence for the ruling's local template condition, not completion of the full support-ledger no-op proof.

## Unsupported current adjustments — STOP evidence

The classifier applies the same rule to every activation, without wire-specific admission exceptions. It records nominal anchor, required anchor, positive deficit, nominal and adjusted paths, directions, source-segment ordinal, emitted pieces and owners, template classification, and byte-identity consequence. It inspects the actual return from the existing `forwardConnection`, not a reconstructed alternative projector.

All four non-median cases below have incoming vertical direction **+1**, a positive 1.5-unit initial stem, and orthogonal pieces. But after shifting the turn, the final vertical connector leg goes backward. A positive initial stem alone is insufficient to classify the complete adjusted connector as forward.

| Authoring wire | Source segment ordinal (zero based) | Nominal y | Required y | Recorded deficit | Final connector leg y | Backward reach |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| w22 | 10 | 2229 | 2346.5 | **117.5** | 2346.5 → 2331 | 15.5 |
| w41 | 13 | 1759 | 1910.5 | **151.5** | 1910.5 → 1813 | 97.5 |
| w73 | 14 | 1759 | 1802.5 | **43.5** | 1802.5 → 1801 | 1.5 |
| w85 | 11 | 1759 | 1814.5 | **55.5** | 1814.5 → 1807 | 7.5 |

These are actual ordinary output segments w22:16, w41:17, w73:22 and w85:16 (one-based output ordinals). All are contained in their actual assigned owners; ownership containment does not make a backward template forward. In particular, w41 retains the accepted M10f-1 ownership attribution to the incoming vertical street.

The known C1 family also remains unsupported, exactly as Amendment 2 requires:

| Authoring wire | Nominal x | Required x | Recorded deficit | Actual diagonal |
| --- | ---: | ---: | ---: | --- |
| w03 | 3001 | 3089.5 | **88.5** | (3089.5,454) → (3247,457) |
| w23 | 603 | 625.5 | **22.5** | (625.5,1678) → (741,1681) |

Authoring w23 and hub w23 are distinct scene-local wires. The hub ruling does not admit the authoring diagonal.

Every failed row records `resolutionTemplate: unsupported-retained-adjustment` and `byteIdentityConsequence: cannot-admit-current-adjustment`. The diagnostic failure reason distinguishes `diagonal-median-clamp` from `not-an-admitted-forward-stem`. These are structured JSON evidence, **not** a claim that the required public TypeScript failure contract or complete graph admission exists.

The brief requires an orthogonal forward template and says “If either condition fails: STOP with the evidence”; it separately requires STOP for unsupported relations and judgment calls. I have not admitted these current adjustments, changed projection, or silently converted them into a different template. Whether to continue A by recording the four backward cases as unresolved expansion requirements against a separately supported prospective template is the remaining ratification decision. This diagnostic does **not** prove that future expanded geometry is infeasible, nor does it claim a binding expansion constraint on hub.

## Reproduction and scope of the diagnostic

[verify-support-templates.mjs](verify-support-templates.mjs) bundles the public builder in memory and adds an observer around the existing `forwardConnection` call. The observer returns the same connection object. It compares the full observed scene with ordinary output, runs each scene twice, and checks every nonzero adjusted piece against exactly one ordinary segment. No product file is instrumented on disk.

```sh
node --import tsx output/playwright/nested-wires/embedding/verify-support-templates.mjs
node --import tsx output/playwright/nested-wires/embedding/verify-baseline.mjs
```

The diagnostic exits 0 when its evidence assertions reproduce; its report status is **`STOP-unsupported-retained-adjustment`**, not feasibility or legality success.

| Scene | Recorded adjustment deficits | Locally supported | Unsupported | Observed/ordinary bytes equal, twice |
| --- | ---: | ---: | ---: | --- |
| default | 0 | 0 | 0 | Yes |
| hub | 1 | 1 | 0 | Yes |
| templates | 5 | 5 | 0 | Yes |
| scale | 8 | 8 | 0 | Yes |
| authoring | 72 | 66 | 6 | Yes |

Full evidence: [increment-a-template-gate.json](increment-a-template-gate.json). The 86 entries cover forward-clamp activations only. They do not substitute for every retained travel/contact, gate interval, fan, cap, body separation or stable merged logical span key. Diagnostic source ordinals come directly from allocation; numeric road IDs are never parsed. No complete provenance-ledger claim is made.

## Unchanged baseline and catalogs

[verify-baseline.mjs](verify-baseline.mjs) freshly rebuilt all five scenes using both the ordinary worktree builder and a separate in-memory builder loaded from Git object `b9e098aab6bb66c3359211efecd721023c59f06f`, twice per version. Complete serializations match, with byte lengths **649,257 / 713,191 / 764,731 / 1,462,875 / 1,953,839**. Receipt: [increment-a-baseline-gate.json](increment-a-baseline-gate.json).

The authoring catalog was freshly replayed using the existing `ownership/verify.mjs` catalog/supplementary functions and pinned `1ff0be8` independent verifier. The complete result equals `projection/before-catalogs.json`, SHA-256 `74897f5c3497ed996629e0451512e5b771d626efac1d516ac4a845bc4cd45851`. Counts remain bodies **40**, boundaries **87**, uncertified **1,273**, overlaps **18**, reversed assigned segments **28**, missing gate traversals **96**, corridors **2**, continuity **0**. Receipt: [increment-a-catalog-gate.json](increment-a-catalog-gate.json). The four backward connector legs above are not presented as four additional assigned-lane reversal catalog entries.

Amendment 1 remains complete: [../projection/rejected-candidate.patch](../projection/rejected-candidate.patch) preserves the rejected product diff (SHA-256 `476eeb783fbbc8040490c68d81ca1dddbf3b6dccf4fadc19d5613b65bd43e04d`), and product source equals b9e098a. The earlier report is preserved as [increment-a-amendment-1-stop.md](increment-a-amendment-1-stop.md); its w23 decision request is superseded by Amendment 2 and the passing hub evidence above. The earlier witness JSON remains historical evidence.

## Full binary DoD status at STOP

- [ ] Public read-only Layout ledger; every travel/contact exactly once under stable merged logical keys; demand/rank accounting.
- [ ] Ledger assertions for widths 252/336/480 and all recorded support deficits; gate tangential/normal distinction.
- [ ] Full authoring constraint graph admission and public typed unsupported/cyclic failure.
- [ ] Complete default/hub support slack. Hub w23 local template condition passes, but does not close this gate.
- [ ] Ledger identification of exactly 13/7 envelope spills.
- [ ] Negative controls: empty interval, terminal pin capacity, mismatched/missing contact.
- [x] All five ordinary builder serializations equal b9e098a twice; unchanged ordinary defect catalogs; no new legality claim.
- [ ] Re-measured builder operation counts, separately measured preflight, T/C/G/V/E and calibrated design estimate.
- [ ] Complete public preflight determinism and per-product-file reviews. There is no product preflight or new product source; diagnostic determinism is verified separately.
- [x] Ratification evidence report at the required path.
- [ ] Commit, push and PR against feat/m10f-ownership after all A gates pass.

Final repository check and mechanical-correction receipt follow below. No completion, rendered improvement, operation-budget compliance or graph-feasibility claim is made from a green suite.

## Final verification

`pnpm check` exited **0**: typecheck, lint, formatting, architecture and **70/70 test files, 208/208 tests**. Full log: [increment-a-pnpm-check.txt](increment-a-pnpm-check.txt).

The first check found one self-introduced cognitive-complexity violation (5 versus the allowed 2) in the new diagnostic's classification function. Extracting its three label-selection expressions into small helpers corrected this mechanically; the unchanged evidence assertions were rerun successfully, followed by the full passing check. No assertion, template-admission condition, fixture or baseline was weakened.

Changed/new files in this continuation are evidence under `output/playwright/nested-wires/embedding/`; the inherited `ownership/verify.mjs` diff and rejected-candidate evidence remain preserved. No product-file review score is claimed because no product file was changed. **STOP for ratification; Increment A's full DoD remains incomplete.**
