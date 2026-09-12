# Entities and invariants
|Entity|Cardinality/invariant|
|---|---|
|Showcase collection|24 sections, three per each of eight modes; shared theme and role vocabulary|
|Acceptance example|Unique subject and topology/composition; mere relabel/theme change fails|
|Recipe|Ordinary editable intent; exact resource pins; namespaced independent expansion|
|Projection limits|maxSections32, maxNodes1000, maxWires1500; finite bounded admission; no total-node relaxation|
|Evidence|Each example links source, committed identity/revision, readout, inspect result and visible-browser capture/zoom|

|Files|Estimated final LOC|
|---|---:|
|presentation/contract/records/{limits,interchange}.ts; contract/index.ts; core/{projection/collection,validation/interchange,validation/capacity}.ts|15;70;50;100;240;40|
|layout/contract/records/candidate.ts; core/validation/{input,sections}.ts; tests/collection-roundtrip.test.ts|120;190;135;50|
|canvas/core/scenes/validate.ts|120|
|export/contract/records/manual.ts; core/artifacts/produce.ts|50;170|
|layout/canvas/export contract/records/limits.ts bridges; existing admission/scale tests|5each;100–400|
|24 example .canvas files; combined collection|35–120;1200|
|Presentation contract/{api,records/content-context}.ts; core/{content/blocks,projection/node}.ts|60;40;200;300|
|Layout contract/records/engines.ts; core/{routing/obstacles,routing/wires,validation/wires}.ts|20;110;140;120|
|CLI adapters/theme-config.ts; Service adapters/theme-preparation.ts; existing CLI/Layout/Presentation tests|160;130;400–1600|

Presentation owns its accepted projection capacity; downstream consumers reuse the public constant without reverse imports. Existing semantic collection limits remain separate from projection scale. Field/port/cardinality/fragment correctness stays mandatory regardless of appearance.

Producer/reader count appearances across sections. Consumers re-export public limits through local contract records; enforce32/1000/1500.

Section-origin checks use existing geometry tolerance; content and identity remain exact.

Key captions resolve owner labels; labels avoid group borders. Numeric theme overrides remain Design System validated.
