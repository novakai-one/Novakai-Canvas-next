# One-round audit disposition

|Finding|Verification|Disposition|
|---|---|---|
|Full marker width not checked|validRoute checks centerline and advance; inspectWires uses same predicate. Marker boxes only constrain labels, not content.|Accept full marker-box/content intersection rejection in candidate and independent inspection.|
|Reciprocal cycles share lane|parallel counts ordered node pairs; reverse pair gets ordinal0. Valid initial route returns before alternative search.|Accept reciprocal endpoint-local lane identity and prevent entire shared automatic lanes.|
|File scores below145|Recorded native137, tests124–130 are explicit. No waiver received.|Gate remains open; correct within scope where justified, never weaken tests or fabricate score.|
|Export recovery comments missing|Three inspected exports omit direct recovery owner; file comment is insufficient under P10.|Accept direct exported-entry TSDoc and honest recalculation.|
|Candidate ranking assertions incomplete|candidateBudget checks repeatability/count/inspection, never compares admissible route lengths or tie breakers.|Accept independent selected-route ranking oracle.|
|Outside fallback assertion counts only|Always-infeasible injected route makes repeated initial proposal indistinguishable from actual outside corridor.|Accept actual final outside checkpoint geometry plus count.|
|Operational diagnostics assertions incomplete|Only code and targets.length checked; unrelated one-element targets/path/message passes.|Accept complete error equality.|

Root additionally reproduced integrated valid-tree regression (173/174 tests). Keeping PR4 positive assertion is mandatory. The user-permitted extra alignment process is folded into this builder session solely to resolve that integration regression; it is not another audit round. No re-audit afterward.
