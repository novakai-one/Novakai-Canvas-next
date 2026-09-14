# Capability: canvas — Modules

### contract/api.ts
**Exposes:** createCanvas({sceneAdmission}):Canvas; open({scene,expected,viewport,camera?,profile?,readOnly?}); transition(state,event); present(state); describeAccessibility(state); all Result-returning except typed immutable selectors where already admitted state is required.
**Input:** raw open/event/scene payloads unknown; state is previously returned readonly SessionState. State restoration uses open plus explicit checked saved camera; serialized state cannot bypass admission.
**Output:** transition returns new state and explicit effects. No callback, save, request ID generation, database, global DOM or ambient time in core.
**Consumers:** editing web host and read-only embedded viewer. Host owns collection subscription, requested scene job generation, Authoring integration, receipt slot and local draft/preference storage.

### core/scenes/*.ts
**SceneAdmission port:** read(payload:unknown,expected:{collectionId,revision,inputKey}):Result<Scene>. Required; host binds owning validated Layout result and Presentation content validation. Canvas validates finite bounds, unique IDs, parent/endpoint references, cycles and limits, then indexes once per accepted scene.
**Events:** expect-scene(stamp), receive-scene(payload,stamp), connected(boolean), mutation-available(boolean). expect-scene records newest job without removing visible scene; receive rejects mismatches, regressive revisions and foreign collection. stamp describes the displayed scene; requested is independent. readOnly is fixed at open; mutation availability cannot override it. Host opens a new session to switch collections.
**Present:** section/global/local transforms, selected flags, active draft overlay, collapsed visibility; content objects retain stable references. No layout solver, collision avoidance, remeasurement or semantic rule copied here. Geometry drafts identify preview-only incident wires until a fresh routed scene is ready; never claim preview as feasible.

### core/camera/*.ts
| Event | Behavior |
|---|---|
| pan(dx,dy) / viewport(camera) | finite checked screen translation, zoom clamped to profile |
| zoom(factor,pointer) | anchored world point; finite positive factor |
| fit(target) / locate(target) | explicit bounds; padding from profile; clamp zoom |
| resize(viewport) | translation adjusts by half size delta; same zoom/world center |
| initial open | restored camera wins; otherwise fit once after nonzero viewport and admitted scene |
| reading enter/next/previous/exit | separate view camera; section order from scene; exact editing-view restoration |

### core/interaction/*.ts; core/drafts/*.ts
**Gesture decision:** normalized input includes tool, pointer kind/button/modifiers, interactive target and typing flag. Returns pan/select/marquee/move/connect/ignore. Blank primary pans; Shift marquee; profile can invert default. Space/middle/Hand pan; ignore typing/interactive targets. Threshold4/8 screen pixels before drag.
**Keyboard:** normalized keys/context; arrows navigate outline, Alt+arrows emit one nudge intent (8/32world); Enter inspect, Delete local removal review, Escape innermost gesture/connect/selection. Host handles command palette/text undo/modals; Canvas never intercepts when typing or modal owns focus.
**Draft events:** begin(kind,id,targets), update(id,geometry), finish(id), cancel(id), reject(intentId,message). Begin captures current stamped geometry; update cannot switch identities/scopes or shrink below measured minimum. Finish coalesces changed placements/routes into one intent and returns committed view while host processes preview/commit. Recoverable draft retained until explicit discard/acknowledged outcome. Host delivers confirmed(intentId) only after receipt.
**Other commands:** select/toggle/marquee; tool; connect source/target; edit/inspect; duplicate; align; remove-appearances. Intent scope and base always explicit. No direct Model mutation; host’s registered Authoring planner converts intent using current snapshot and validates it.
**Routing:** bend insert/move/remove and endpoint-side requests produce section-local route draft; ≥2points and finite bounds; point-only edits emit preserve for sides/lock, so the planner retains canonical settings; endpoint picking via keyboard outline and pointer handles. Host obtains canonical connection kind/label/cardinality via editor before submitting.

### core/accessibility/outline.ts
**Exposes:** section/object/relationship/sequence reading model with stable target addresses, endpoint/member descriptions, content text/alt and explicit locate/edit actions. Canonical reuse is described as another appearance, not duplicate identity. Removed selection announces once; movement does not emit every-frame live announcements.

### adapters/session/store.ts
**Exposes:** SessionStore.getSnapshot/subscribe/dispatch/drainEffects/readPointer/writePointer; cached immutable state; failed event does not publish. State changes notify once; edit IDs deduplicate identical intents, reject changed/mixed replay; ≤10000accepted IDs/session. Host drains effects explicitly. Reducer diagnostics are retained; listener failure is isolated in successful Transition.diagnostics after local state change; never replay it or repeat an edit effect. dispose unsubscribes and rejects future dispatch.
**Contract:** composed reducer injected; no own core/sibling imports. Pointer metadata is session-owned, detached and cleared on disposal. Store is optional convenience, pure API remains usable without it. Host owns persistence and asynchronous submit. React useSyncExternalStore subscribes to immutable snapshots with selectors retaining unchanged view references.

### contract/compose.ts; adapters/react-flow/*
**Exposes:** composeCanvas({sceneAdmission}); createSession(canvas,state); createReactBindings({NodeContent,MeasuredContent,Marker,Button}):Promise<Result<ReactBindings>>. Factories wire stable components/slots once; headless entry does not load CSS/ReactFlow. Prerequisite: extend Presentation public ReactBindings with a font-bound MeasuredContent renderer over its existing ContentBlocks; declare/export its props and bind it in Presentation compose. No host reimplementation. Required content slots reuse Presentation's measured primitives and notation; host composes them through public contracts.

| Component / TS | Responsibility |
|---|---|
| CanvasSurface / use-scene | controlled React Flow scene/camera and built-in MiniMap with explicit pan/zoom; translate callbacks to events, inject observer/native-target policy; host effects only; panOnScroll+pinch enabled, zoomOnScroll/doubleclick fit disabled; explicit selection/drag/delete handling |
| SceneNode | actual React Flow custom HTML node wrapping supplied Presentation content; measured member handles, keyboard edit, selection outline and resize controls |
| SceneEdge | actual React Flow custom edge; routed path, separately positioned measured label and both supplied notation markers; large invisible hit path |
| SectionFrame | titled bounded section node; selection/drag section handle, nested node parent coordinate mapping |
| CanvasControls | labelled Select/Hand/Connect, zoom, Fit, outline/reading and explicit Locate; no hidden click-fit |
| DiagramOutline | keyboard-operable sections/content/labelled relationships/endpoints; read-only viewer usable without pointer |
| SequenceLayer | supplied lifelines/events/activation/fragment/branch geometry; selectable message targets and measured labels |
| RouteHandles | selected-wire point/side editing and keyboard equivalents; one gesture intent; no routing engine |
| CSS modules / vendor.css | own scoped component states; vendor imported into vendor layer; all visual values reference Design System; inline values only per-scene geometry |

React callback errors produce visible host diagnostics, never swallowed success. ReactFlow node/edge registries and handlers remain stable. Only visible content mounts where safe; virtualized targets retain accessible outline. Browser checks—not DOM mocks—verify actual pan/drag/focus experience in Part2.
