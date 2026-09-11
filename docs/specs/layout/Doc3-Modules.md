# Capability: layout — Modules

### contract/api.ts; compose.ts; index.ts
**Exposes:** createLayout(deps):Layout; composeLayout({projection,jobs,wasmResource}):Promise<Result<Layout>>. key({projection,measurements,options,previous}):Result<string>; arrange(LayoutRequest):Promise<Result<Scene>>; route(RouteRequest):Promise<Result<Scene>>; inspect(InspectionRequest):Result<Inspection>; all accept unknown at boundary. Named local↔collection point conversion exports.
**Imports:** own declarations/core; compose owns adapter selection.
**Contract:** complete result or typed error. Authoring retains committed collection/draft on failure. Route-only fixes boxes; inspect independently checks hard constraints. No native result bypasses final inspection.

### core/validation/{input,outcomes,equality,facts,nodes,wires,sections}.ts; geometry/*.ts
**Exposes (private):** required ProjectionReader.read(unknown):Result<Projection>, checked request/previous scene, protected async boundary, independent geometry/constraint inspection, segment/box intersections and coordinate conversions.
**Imports:** own checked schemas and geometry records.
**Contract:** L01/L02/L06–L10. Reject malformed/nonfinite native output; never trust cache/engine success boolean as feasibility proof. Named target diagnostics, immutable detached outputs.

### core/arrangement/*.ts; core/placement/*.ts; core/sequence/*.ts
**Exposes (private):** registered scoped policies, dependency keys, hierarchical seed assembly, collection composition, sequence geometry.
**Imports:** own geometry/constraint/routing helpers; narrow placement/solver/job ports.
**Contract:** L03–L06/L11–L14. Groups solve inside scope, global section constraint solve enforces containment/locks; source order stable. Reuse unchanged local scenes only after validation. SupplementalMeasurements supplies Presentation-owned branch headings/marker extents; complete keys validated and canonically encoded. No SVG parsing/dimension constants here. Positions/frames/lifelines owned here.

### core/constraints/{compile,relative,separation}.ts
**Exposes (private):** named required/soft linear constraints, hard-lock/minimum/containment equations, bounded nonoverlap alternatives.
**Imports:** own input/problem records and solver role.
**Contract:** L04–L07. Native solver owns numeric solving only; authored meaning compiled here. Inconsistent required equations and exhausted geometric search are distinct outcomes. All soft movements enumerated.

### core/routing/{endpoints,native,wires,checks,obstacles,labels,paths}.ts
**Exposes (private):** attachment resolution, preserved manual routes, obstacle problem, label-placement candidates, SVG path/rounded-corner geometry.
**Imports:** own geometry, routing role, measured inputs.
**Contract:** L08–L10. Named sides/descendant anchors and markers retained. Label rectangles are routing obstacles; avoid content, reserve endpoint clearance. Never moves nodes to disguise routing failure.

### adapters/{elk,kiwi,libavoid,scheduling,wasm-loader}.ts
**Exposes:** createPlacement(native?):PlacementPort; createSolver(native?):SolverPort; createRouting(wasmLoader):Promise<Result<RoutingPort>>; createJobControl(host):JobControl.
**Imports:** own declaration contracts; exact ELK/@lume/kiwi/libavoid-js native APIs/platform only.
**Contract:** native input/output mapping, typed failures, per-call disposable state. Native state mutation confined to adapter and not retained across jobs. Wasm loader explicit, artifact separately served, licenses/hash recorded. Host scheduling controls worker termination and latest-key; capability has no shared scheduler singleton.
