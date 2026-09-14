# Capability: canvas — Entities & invariants

Session "1" ── "1" committed Scene; Session "1" ── "1" Camera; Session "1" ──< "0..n" SelectionTarget; Session "1" ── "0..1" GestureDraft; Session "1" ──< "0..n" RecoverableDraft.
Scene "1" ──< "0..10" Section; Section "1" ──< "0..n" placed node/wire/sequence item. Scene contents retain Layout/Presentation ownership; Canvas indexes references, not a second graph.

| Record | Fields / types |
|---|---|
| SceneStamp | collectionId:string; revision:nonnegative integer; inputKey:string; generation:nonnegative integer |
| Camera | x,y:finite screen pixels; zoom:0.1..4; viewport:{width,height:positive pixels} |
| Target | section:{id}; node:{section,id}; wire:{section,id}; sequence:{section,id}; discriminated kind, stable scene identity |
| Profile | version:1; blankDrag:pan/marquee; fineThreshold:4; coarseThreshold:8; zoomMin:0.1; zoomMax:4; zoomStep:0.1; nudge:8; coarseNudge:32; fitPadding:32 |
| SessionState | scene:admitted Scene; stamp:SceneStamp; requested:SceneStamp; readOnly:boolean; camera; selection:Target[]; tool:select/hand/connect; profile; draft:GestureDraft/null; recovery:RecoverableDraft[]; reading:ReadingState/null; connected:boolean; mutationAvailable:boolean |
| GestureDraft | id:string; generation:integer; base:SceneStamp; kind:move/resize/route; original:immutable target geometry; current:immutable target geometry; changed:boolean |
| RecoverableDraft | draft; reason:submitted/scene-changed/target-removed/rejected/disconnected; message:string |
| EditIntent | id; base; kind:placement/route/connection/remove-appearances/duplicate/align; targets; kind-specific geometry/endpoints/axis; scope explicitly local; no allocated revision/request ID |
| Placement intent | entries:{target,placement:{x,y,width?,height?,locked}}[]; section targets collection-local; node/group targets immediate-parent-local |
| Route intent | section; wire; points:section-local finite Point[2..10000]; sourceSide,targetSide:preserve/auto/top/right/bottom/left; locked:boolean/preserve |
| Connection intent | section; source/target:{node,member:string/null}; host must obtain nonempty label before Authoring; no implicit unlabeled relationship |
| ReadingState | saved editing camera/selection; ordered section IDs; active section; collapsed target IDs; independent camera |
| PointerGesture | id:string; target:Target; start:Point; ephemeral SessionStore readPointer/writePointer; detached, cleared on dispose |
| Transition | state:SessionState; effects:CanvasEffect[]; diagnostics:Diagnostic[]; changed:boolean; all readonly |
| CanvasEffect | edit-intent / inspect-request / navigation-request / announce / recover-draft; explicit discriminant; no I/O inside reducer |
| Outline | sections with title; objects with kind/label/content rows/endpoints; labelled relationships with direction/cardinality; sequence ordering and nested fragment labels |
| Result<T> | {ok:true,value:T} or {ok:false,error:{code,path,targets,message,recovery}}; host owns display/retry; invalid event leaves state intact |

| ID | Invariant |
|---|---|
| C01 | Only admitted scene content renders. Required SceneAdmission.read validates unknown payload against owning Layout/Presentation result, expected collection/revision/inputKey. No casts confer trust. Owned IDs/geometry/references checked before indexing. |
| C02 | Selection, revision/theme updates, inspect requests and tool changes never Fit/Locate. First successful open may fit once; restored camera suppresses it. Only explicit camera actions navigate thereafter. |
| C03 | Incoming scene requires current requested generation and exact requested revision/inputKey; lower revision rejected. Same revision/new inputKey allowed only for current requested job. Rejection retains visible scene, camera, selection and drafts. |
| C04 | Camera coordinates are screen pixels; geometry and intents are world units. Pointer zoom preserves world point under pointer. Dock resize preserves world point under center. Overlay opening does not resize. |
| C05 | Node IDs remain section-scoped; selecting one appearance does not select every copy. Hidden/deleted targets leave selection, never canonical content. Foreign scene updates retain all surviving selection without camera movement. |
| C06 | Pointer moves update local preview only. Release emits at most one immutable intent; no-op/cancel emits none. Below threshold remains click. Interactive child/input/link starts are ignored. |
| C07 | Group/section drag moves descendants once; selected ancestor subsumes descendants. Parent-local conversion subtracts immediate parent's section-local origin; section origin subtracted once. Resize cannot clip measured minimum. |
| C08 | A newer scene during a gesture refreshes committed view, cancels active gesture into recoverable draft; never applies stale geometry to new content. Definitive rejection retains draft; host gates submissions/reconciles receipts. |
| C09 | Read-only/reading/disconnected/pending-mutation states allow navigation; emit no mutation intent. Disconnection preserves draft in recovery. Restored drafts require explicit comparison and a new gesture against current stamp. |
| C10 | React Flow JSON never enters persistence. Local deletion emits remove-appearances review intent; shared deletion and cascade acknowledgment belong to host/Authoring. Model is sole canonical transform/validation owner. |
| C11 | Reading changes are session-only; entering stores editing camera/selection, exiting restores surviving selection and exact camera. Collapse hides descendants and incident wires; no invented aggregate relationship. |
| C12 | Wires retain supplied routed geometry, measured labels and endpoint markers; labels always visible. Route handles edit points/sides; validation/rerouting remains Layout/Authoring. Sequence labels/fragments/activations render from supplied geometry. |
| C13 | Profile shape/bounds validated; zoom bounds remain 0.1..4, positive finite nudges/thresholds, coarse≥fine. No global browser-zoom shortcut capture. Scene limits1000nodes/1500wires/10sections; targets bounded by scene; ≤10000sequence items; ≤1000retained drafts, then reject new gestures. |
| C14 | Immutable snapshots are cached between store changes; subscriptions return cleanup. Stable bound React node/edge registries, memoized hot nodes, separate selection/view subscriptions; no panel/editor global subscription to moving-node array. |

| In-scope files (each named file) | Estimated lines each |
|---|---:|
| contract/index,api,compose,types,brands,errors,events,schemas.ts | 30–120 |
| contract/react-types,interaction-profile.ts | 100 / 25 |
| contract/records/camera,profile,scene,state,selection,draft,intent,view.ts | 40–110 |
| contract/ports/scene-admission,session.ts | 25–50 |
| core/camera/navigate,coordinates,resize.ts | 50–100 |
| core/interaction/gesture-policy,keyboard,selection,transition,handler,changes,camera-events,selection-events,draft-events,scene-events,commands.ts | 60–140 |
| core/drafts/begin,update,finish,reconcile.ts | 60–130 |
| core/scenes/accept,index,present,reading,address,ancestry,validate,sequence-checks,preview,view-nodes,view-wires.ts | 70–140 |
| core/accessibility/outline.ts; core/validation/outcomes.ts | 100 |
| adapters/session/store.ts | 100 |
| adapters/react-flow/CanvasSurface,SceneNode,SceneEdge,SectionFrame,CanvasControls,DiagramOutline,SequenceLayer,RouteHandles.tsx | 70–160 |
| Matching eight .module.css files | 20–60 |
| adapters/react-flow/use-scene,interaction-handlers,flow-records,style-entry.ts | 50 / 250 / 150 / 10 |
| adapters/react-flow/vendor.css,react-flow-theme.module.css | 10 / 50 |
| tests/fixtures.ts; tests/react-fixtures.tsx; camera,interaction,drafts,scene,react-bindings.test.ts[x] | 160; 120–220 |
| package.json; README.md | 35; 40 |

Estimates indicate scope, not targets/restrictions. Additional splits are recorded at build completion. No file earns a standards score from its length.
