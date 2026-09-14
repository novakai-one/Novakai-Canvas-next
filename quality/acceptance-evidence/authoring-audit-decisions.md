# Authoring — sole verified implementation fix round

| Finding | Independent parent verification | Correction |
|---|---|---|
| A1 delayed identical retry | Added the exact lookup→paused snapshot→competing commit→resume order to existing case7. Before fix: case7 failed with revision-conflict despite the matching durable receipt. | Reconcile any rejected uncommitted attempt after initial lookup, not only a physical commit failure. Lease lifetime remains around the preparation/commit continuation. |
| A1 history image identity | Existing case10 now replaces only the returned before-image of workspace/a with workspace/b. Before fix: undo succeeded and the required corrupt-record assertion failed. | Check both before/after image keys against each transition key before constructing any inverse writes. |
| A2 oversized unknown-field assertion | Confirmed strict request schema rejects unknown extra regardless of length; original assertion could not isolate size. | Existing case14 puts oversized text in permitted intent.payload.diff, asserts public request-schema acceptance, then expects admission size rejection. |

Before-fix retained run: 12 passed / 2 failed across the same14 cases. No new test definitions or audit rounds. Fixes confined to verified findings; source scoring/format/type/import/test checks are verification, not another pressure audit. Original A1/A2 reports retained.
