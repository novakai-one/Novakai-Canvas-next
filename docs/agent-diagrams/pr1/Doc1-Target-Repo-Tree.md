# PR1 — composition foundations
Responsibility: express reusable arrangement intent without authored coordinates; reuse existing diagram semantics.

|Path|Responsibility|
|---|---|
|capability/model/contract/records/layout.ts|Checked optional grid column intent|
|capability/layout/contract/records/input.ts|Layout's independently owned input contract|
|capability/language/core/{vocabulary,lowering,patching,printing}/|Parse, lower, patch and print column intent|
|capability/layout/core/placement/{policy,grid}.ts|Apply track count to measured placement|
|resources/examples/composition-probes.canvas|ER, nested comparison, sequence vocabulary proof|

Imports follow existing contract-only cross-capability paths. No UI editor changes. Existing group/represents, text/image/table, sequence fragments and cardinalities remain canonical. No duplicated semantic model in the renderer.
