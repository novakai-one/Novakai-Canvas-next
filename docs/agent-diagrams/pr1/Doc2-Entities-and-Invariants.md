# Entities and invariants
|Entity|Fields/cardinality|Invariant|
|---|---|---|
|LayoutIntent|columns?: integer 1..12; existing algorithm/direction/gap/constraints|columns legal only for grid; absent preserves existing default|
|Layout scope|collection/section/group each owns one intent|Nested scopes choose columns independently|
|Grid tracks|1..columns occupied tracks; any number rows|Measured row/column maxima prevent overlap; declared direction preserved|
|Existing composition|object→many appearances; group→many appearances/subgroups; section→many groups|No new kind for a reference image; existing scope/reference checks apply|

|Within-scope file(s)|Estimated lines each|
|---|---:|
|model/contract/records/layout.ts; layout/contract/records/input.ts|80; 180|
|language/core/vocabulary/properties.ts|115|
|language/core/lowering/{layout,document,views}.ts|70; 65; 115|
|language/core/patching/properties.ts|110|
|language/core/printing/layout.ts|55|
|layout/core/placement/policy.ts|90|
|Existing targeted model/language/layout tests|100–250|

Additional focused helper permitted only with responsibility/import inventory update. Estimates are informational, not restrictions. Integer/algorithm validation must exist at Model and Layout boundaries. Invalid explicit columns produce typed diagnostics; never silently coerce. No graph geometry in Language.
