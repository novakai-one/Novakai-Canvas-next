# PR6 correction — disposition

Authorized single combined correction on base `a10e92e`. A1 and A2 were each read once from `/tmp/canvas-agent-diagrams`; A2 reported no incorrect assertions. No child agents or new audit round were used.

|Verified finding|Disposition|Evidence|
|---|---|---|
|Capacity untyped rejection,143/160|Corrected to `Result<void>`; existing producer/reader protection unwraps it; shared32sections/1000nodes/1500wires aggregate policy retained|`correction-scores.md`:148/160; existing aggregate/capacity assertions pass|
|Projection fat renderer dependency,141/160|Corrected to consumer-local `rendererVersion` metadata; original key field and deterministic serialization retained; recovery owner documented|`correction-scores.md`:148/160; existing input-key assertions pass|
|ER keygroup captions expose canonical IDs|Resolved through canonical owning entity, including compact detail with hidden fields; no global block-ID lookup or ID fallback|Existing notation case extended:3entities sharing descendant IDs, object/field namespace collision, ordered PK/FK, original field types, anchors/cardinality, full/compact outline and rendering, unchanged canonical input|
|Labels intersect parent/group borders|Measured stroke-width exclusion strips on all four group edges feed automatic label placement and independent label inspection only; interiors remain free and wire obstacles unchanged|Existing native routing case extended:root+nested groups, both directions,16 forged outward-stroke contacts rejected, positive interior-space checks, exact endpoints and retained manual points; policy7→8|
|Canvas recursion comment inaccurate|Comment now describes bounded recursive parent traversal; algorithm unchanged|`capability/canvas/core/scenes/validate.ts:10`|
|Readability across real DSL captures|Root-owned work; excluded from this commit|Root owns CLI numeric theme configuration, semantic DSL, captures and related documentation|

All177 tests pass; zero new definitions. Full marker rectangles, exact endpoint checks, original types and canonical IDs, key ordering, cardinality, manual-route semantics, PR4/PR5 positive assertions and the initial/eight-local/one-outside retry limit are retained. Native/test rubric interpretation remains OPEN; passing checks do not waive that gate. Root still owns meaningful real-DSL integration and refreshed visual acceptance.
