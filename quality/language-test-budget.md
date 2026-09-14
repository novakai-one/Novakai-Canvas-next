# Language frozen test budget

18 fast public-contract cases / five suites. No slow or E2E tests. Exact cases frozen in Doc5 before implementation. Every case's oracle is an independently specified user behavior; Model suites already cover canonical invariants, while these cases cover DSL translation and read/edit correctness. No prior Language implementation/tests existed. Retire a case only when its corresponding DSL form is removed or an equivalent public replacement contract assumes it.

Each case catches its named translation failure with high confidence (90%); risk of broad fixture maintenance is moderate (35%). Case17's bounds inputs have higher allocation cost. Source/suite count is not a correctness measure. Auditors must challenge expected outcomes, not praise coverage.

|Cases|Tier/type|Measured whole-slice cost|Maintenance|Existing coverage boundary|
|---|---|---|---|---|
|1–18, exact list in Doc5|fast / public contract|~0.4–1.7s including transform; all18 together|medium|Model covers domain policy; none previously covered Language syntax/lowering/printing|
|Total|18 fast, 0 slow, 0 E2E|No browser/runtime boot| | |
