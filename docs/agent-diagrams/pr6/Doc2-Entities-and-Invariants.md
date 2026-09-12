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
|layout/contract/records/candidate.ts; core/validation/input.ts|120;190|
|canvas/core/scenes/validate.ts|120|
|export/contract/records/manual.ts; core/artifacts/produce.ts|50;170|
|layout/canvas/export contract/records/limits.ts bridges; existing admission/scale tests|5each;100–400|
|24 example .canvas files; combined collection|35–120;1200|

Presentation owns its accepted projection capacity; downstream consumers reuse the public constant without reverse imports. Existing semantic collection limits remain separate from projection scale. Field/port/cardinality/fragment correctness stays mandatory regardless of appearance.

Presentation producer and reader share aggregate admission: count projected appearances/wires across sections, not unique canonical objects. Enforce32/1000/1500 before returning success. Consumer declaration-only record bridges re-export immutable limits through Presentation’s public index; each core imports its own record.
