# Capability: layout — Entities and invariants

## Records and cardinalities

|Record|Fields / type|Cardinality / rule|
|---|---|---|
|ProjectionInput|Readonly Presentation Projection|One exact measured revision; no recreated semantic vocabulary|
|JobKeyInput|projection,measurements,options,previous|key(input):Result<string> produces complete canonical job identity before scheduling; route-only supplies fixed as previous|
|LayoutRequest|projection,measurements,previous:Scene or null,options,job:{id,inputKey}|One derivation; previous only a validated hint from same collection|
|RouteRequest / InspectionRequest|projection,measurements,options,fixed:Scene / candidate:Scene|Mandatory geometry; previous hint is never inspection authority|
|SupplementalMeasurements|version,branchHeadings:{section,fragment,branch,content:MeasuredContent}[],markers:Record<MarkerKind,{advance,halfHeight}>|Presentation-supplied exact heading/marker metrics; complete keys, finite bounds; included in derivation identity|
|LayoutOptions|gap:{compact,normal,roomy},padding,routeClearance,labelGap,sequenceGap,activationWidth,gridColumns,maxBranches|Finite positive token-derived values; no UI palette/typography defaults|
|Point / Box|x,y / x,y,width,height|Finite bounded world units; positive boxes|
|PlacedNode|id,parent,sectionId,box,measured:VisualNode|One per appearance/group; measured content unchanged; group may expand outer frame|
|PlacedSection|id,origin,box,title:{content,box},inputKey,nodes,wires,sequence|One per section; source reading order retained|
|Scene|collectionId,revision,inputKey,engineVersions,sections,bounds,warnings,adjustments|Complete detached immutable result; no partial success|
|ResolvedEndpoint|node,member or null,point,side:top/right/bottom/left|Exactly one visible attachment; collapsed member remains labelled|
|RoutedWire|id,source,target,points,path,labelBox,measuredLabel,markers,style|Label required; points>=2; orthogonal vertices; curves use checked rounded quadratic corners|
|SequenceGeometry|lifelines,events,fragments,activations|Events retain IDs/order; nested fragments/branches retain identities and measured labels|
|LinearVariable|id,initial:number,strength:weak/strong|One x/y/width/height variable per box; engine-independent|
|LinearConstraint|id,terms:{variable,coefficient}[],operator:eq/le/ge,constant,strength:required/strong/weak,targets|Named linear equation/inequality; semantic constraints are required|
|PlacementProblem|nodes,edges,hierarchy,direction,algorithm,spacing|Layout-owned engine DTO; no native ELK types outside adapter|
|SolverProblem|variables,constraints|One complete scope; no shared mutable solver across calls|
|RoutingProblem|obstacles,connections,clearance|Safe local geometry plus explicit sides/checkpoints; no semantic graph mutation|
|Diagnostic|code,path,targets,message,recovery|invalid-input/constraint-conflict/engine-failed/cancelled/limit; no string parsing|
|Warning / Adjustment|code,targets,message / target,before,after,reason|Crossings or changed soft preferences visible; never excuse hard violations|
|WorkContext<Providers>|dependencies,options,job|Seed/placement/routing/derivation consume only required role subsets; reader stays at facade|
|ActivationState(private)|participant,event,top,depth,scope,closedPaths|Alternative scopes isolated; shared parents close only when all alternatives prove closure; null end denotes scope/sequence boundary|
|JobControl|checkpoint(job):Promise<Result<void>>|Host controls cancellation/latest-key; check before/after native work and sections|

## Invariants

|ID|Invariant / failure|
|---|---|
|L01|Candidate identity/cardinality must exactly match source nodes/wires/events/branches; no omitted/extra geometry. Presentation-reader validates unknown projection vocabulary; Layout-consumed input checked: identities unique, finite measured bounds, referenced parents/endpoints/anchors present, groups acyclic, source versions valid. Projection meaning trusted from Presentation; do not duplicate Model topology rules.|
|L02|Coordinate frames explicit: node/group placements and manual wire points are section-local, independent of visual parenting; section placements are collection-local. Output node/wire coordinates remain section-local; section origin and visible bounding box are collection-local; negative local positions preserve the origin. Canvas/Export apply named conversion helpers. No camera values enter inputKey.|
|L03|Registered policies: flow/layered use ELK layered; tree uses ELK tree; grid/story use deterministic row grid; sequence uses ordered lifelines/messages/fragments. Collection arranges sections by source order/grid intent. Nested group scopes preserve their own layout intent and header/content clearance.|
|L04|Measured width/height are minimum feasible bounds. Explicit placement.locked fixes x/y and any supplied width/height exactly; impossible content fit rejects. Unlocked manual/previous positions are strong preferences; generated seed weaker. All adjustments reported. Hard semantic constraints checked every arrange/inspect, including no-preview apply.|
|L05|Relative DSL semantics: rank shares cross-axis coordinate and orders targets on main axis; before orders main axis; below places first lower on page than second; align shares main-axis coordinate and orders cross axis. Direction determines signed main axis; below always positive y. Target boxes do not overlap; relevant target IDs appear in conflicts.|
|L06|Nested groups enclose children below measured header with padding. Sibling nodes/groups never overlap interiors; ancestor containment is allowed. Section bounds include a reserved measured title/header, nodes, labels/routes and sequence frames; collection sections do not overlap. Lock contradictions never resolved by silently resizing/moving locked data.|
|L07|Required linear contradictions→constraint-conflict. Nonoverlap orientation is a bounded search over seed-preferred directions with alternatives; search exhaustion→limit/engine-failed, not a false proof of infeasibility. Native exceptions/malformed output→engine-failed. Final independent inspection rejects any hard violation before success.|
|L08|Route endpoints obey named side, member row/port and direction. Auto side chosen deterministically from relative geometry. Orthogonal routes avoid non-endpoint node interiors and group headers; ancestor container interiors are traversable. Self-loops and parallel wires remain visible. Crossing warnings permitted; lines through unrelated content are not.|
|L09|Locked manual routes keep every point; moved endpoint, bad segment, content collision or label collision rejects with named route. Unlocked manual points are preferences: retain if feasible, otherwise reroute with adjustment. Reset removes manual intent upstream. Route-only operation never moves boxes. Curves derive bounded corner rounding from checked orthogonal corridors, not obstacle-crossing shortcuts.|
|L10|Each wire label receives a measured box clear of unrelated nodes and other labels; label gap/route detour may expand scene bounds. Marker extent is reserved near endpoints; route style and independent source/target marker semantics unchanged. Unavoidable wire crossings produce warnings, not silent label occlusion.|
|L11|Sequence source order and nested fragment/branch ranges drive vertical geometry; repeated/self/return/async messages visible. Lifelines span messages, activate=true opens receiver; false closes sender on compatible paths only; frames include all descendants/branch headings. No timestamps inferred. All render content still supplied by Presentation.|
|L12|Unchanged section input+options+engine versions reuses previous local geometry exactly; source revision alone does not force unrelated sections to move. Changed section favors surviving nodes; explicit changed arrangement may move section boxes. Previous scene must match collection and validate geometry/keys; untrusted cache cannot bypass inspection.|
|L13|Async jobs carry full key(input) identity, verified before work; checkpoint before/after every engine call and between sections. Cancelled/stale completion never returned as current scene. Native adapters dispose solver/router handles in finally. Worker termination is host-owned through scheduling adapter; no global latest-job state.|
|L14|Limits:16MiB input,1000nodes/1500wires/10sections acceptance fixture; bounded branch search and route points. Progress/cancel boundaries at sections. F50 browser timings remain recorded host acceptance; synchronous native solver executes in worker/service, never browser gesture handler. Deterministic result for same inputs/versions/options; no random seed or OS metrics.|

## Files in scope — estimated lines

Estimates indicate scale only, not restrictions or targets.

|File|Estimated lines|File|Estimated lines|
|---|---:|---|---:|
|adapters/elk.ts|90|adapters/kiwi.ts|130|
|adapters/libavoid.ts|220|adapters/scheduling.ts|20|
|adapters/wasm-loader.ts|20|contract/api.ts|30|
|contract/brands.ts|10|contract/compose.ts|40|
|contract/errors.ts|40|contract/index.ts|60|
|contract/ports/placement.ts|10|contract/ports/projection.ts|10|
|contract/ports/routing.ts|10|contract/ports/scheduling.ts|10|
|contract/ports/solver.ts|10|contract/records/candidate.ts|110|
|contract/records/geometry.ts|110|contract/records/input.ts|10|
|contract/records/problem.ts|70|contract/schemas.ts|50|
|contract/types.ts|90|core/arrangement/bounds.ts|40|
|core/arrangement/collection.ts|100|core/arrangement/keys.ts|50|
|core/arrangement/notices.ts|140|core/arrangement/pipeline.ts|150|
|core/arrangement/section.ts|80|core/arrangement/sequential.ts|10|
|core/constraints/compile.ts|160|core/constraints/relative.ts|140|
|core/constraints/separation.ts|230|core/geometry/bounds.ts|30|
|core/geometry/coordinates.ts|10|core/geometry/intersections.ts|50|
|core/placement/groups.ts|120|core/placement/policy.ts|100|
|core/placement/section.ts|80|core/routing/checks.ts|110|
|core/routing/endpoints.ts|110|core/routing/labels.ts|70|
|core/routing/native.ts|150|core/routing/obstacles.ts|20|
|core/routing/paths.ts|90|core/routing/wires.ts|250|
|core/sequence/activations.ts|190|core/sequence/events.ts|60|
|core/sequence/frames.ts|150|core/sequence/participants.ts|40|
|core/sequence/records.ts|30|core/sequence/scopes.ts|110|
|core/sequence/sequence.ts|30|core/validation/activations.ts|90|
|core/validation/equality.ts|20|core/validation/facts.ts|80|
|core/validation/input.ts|170|core/validation/nodes.ts|80|
|core/validation/outcomes.ts|90|core/validation/sections.ts|120|
|core/validation/wires.ts|120|tests/arrangement.test.ts|520|
|tests/contracts.test.ts|270|tests/fixtures.ts|260|
|tests/native-fixture.ts|70|tests/routing.test.ts|340|
|package.json|25|resources/vendor/layout notices+Wasm|resource|
