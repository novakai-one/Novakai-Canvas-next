# A2 verification — one round

|Finding|Verification|Disposition|
|---|---|---|
|Tree topology only counts edges|checkTreeSeed asserts length1, never retained source/target. Same-size endpoints leave spacing invariant.|Accept: assert semantic parent edge identity and endpoints.|
|Grid axes indistinguishable|columnsProjection has no wires, making minimumLayerSpacing0 and both gaps equal; track-count checks cannot detect equal-gap regression.|Accept: labelled unequal reservations and measured boundary gaps in four-direction fixture.|
|Valid tree required to fail|checkTreeSeed calls public arrange on valid Model projection then asserts !result.ok and engine-failed routing. Successful routing must fail assertion.|Accept: separate seed verification from unresolved routing gate; valid-tree acceptance must require success.|

No code changed during verification. One combined fix after A1. No repeat audit.

## Combined correction outcome

Exact retained parent ID/source/target is asserted against the semantic wire. Labelled unequal grids now assert both measured physical boundary gaps in all four directions; prior membership/history assertions remain. Seed capture runs real ELK/grid placement and deliberately stops at the owned solver boundary before routing. The original valid tree now passes actual native routing with the corrected reservations: a separate helper requires success, complete wire identity and valid inspection. No assertion requires routing failure. Broader valid-tree/native acceptance remains open for PR5 integration and fresh root-owned corpus/browser evidence; this one fixture is not universal acceptance. The incorrect prior build-report statement is withdrawn. No further audit.
