# Entities and invariants
|Entity|Fields/cardinality|Invariant|
|---|---|---|
|LayoutIntent|columns?: integer 1..12; existing algorithm/direction/gap/constraints|columns legal only for grid; absent preserves existing default|
|Layout scope|collection/section/group each owns one intent|Nested scopes choose columns independently|
|Grid tracks|1..columns occupied tracks; any number rows|Physical horizontal columns; down/up fill vertically using ceil(count/columns) rows; omitted columns retains legacy direction behavior|
|Existing composition|object→many appearances; group→many appearances/subgroups; section→many groups|No new kind for a reference image; existing scope/reference checks apply|

|Changed files (capability-relative)|Actual lines|
|---|---:|
|model/contract/records/layout.ts; model/core/sections/layout.ts|53;130|
|language/core/vocabulary/properties.ts; lowering/{layout,document,views}.ts; patching/properties.ts|103;66;109;98;145|
|language/core/lowering/layout-fields.ts; parsing/attributes.ts|14;89|
|language/contract/api.ts; core/lowering/expansion.ts; core/patching/{compile,structural}.ts|50;30;106;85|
|layout/core/placement/{policy,grid,section,seeds,groups}.ts|85;99;96;31;134|
|layout/core/arrangement/{collection,section,pipeline}.ts; validation/{input,columns}.ts|113;78;154;173;27|
|{model/tests/sections,language/tests/roundtrip,layout/tests/arrangement,layout/tests/contracts}.test.ts|362;223;771;355|

Seeds selects automatic history; columns checks consumed intent. Both import own declaration-only records/core. Existing printing and Presentation contracts carry columns unchanged.
Integer/algorithm validation must exist at Model and Layout boundaries. Invalid explicit columns produce typed diagnostics; never silently coerce. No graph geometry in Language.

Explicit columns overrides prior automatic seeds in that scope on every derivation; explicit human placements/locks remain authoritative.
