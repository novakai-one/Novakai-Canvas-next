# Capability: canvas — Target repo tree

**Responsibility:** turn an admitted scene into a navigable, accessible React Flow workspace; translate gestures into recoverable typed edit intents.
**Owns:** camera, selection, interaction profile, reading state, geometric drafts, gesture precedence, stale-scene rejection and view reconciliation.
**Excludes:** canonical validation, layout/routing algorithms, persistence, revision allocation, submission/receipt lifecycle, panel visibility/layout, text-editor drafts, notation measurement and rendering policy.

```text
capability/canvas/
  contract/{index,api,compose,types,brands,errors,events,schemas}.ts
  contract/{react-types,interaction-profile}.ts
  contract/records/{camera,profile,scene,state,selection,draft,intent,view}.ts
  contract/ports/{scene-admission,session}.ts
  core/camera/{navigate,coordinates,resize}.ts
  core/interaction/{gesture-policy,keyboard,selection,transition,handler,changes,camera-events,selection-events,draft-events,scene-events,commands}.ts
  core/drafts/{begin,update,finish,reconcile}.ts
  core/scenes/{accept,index,present,reading,address,ancestry,validate,sequence-checks,preview,view-nodes,view-wires}.ts
  core/accessibility/outline.ts; core/validation/outcomes.ts
  adapters/session/store.ts
  adapters/react-flow/{CanvasSurface,SceneNode,SceneEdge,SectionFrame,CanvasControls,DiagramOutline,SequenceLayer,RouteHandles}.tsx + .module.css
  adapters/react-flow/{use-scene,interaction-handlers,flow-records,style-entry}.ts
  adapters/react-flow/{vendor,react-flow-theme.module}.css
  tests/{fixtures,react-fixtures}.ts[x]; tests/{camera,interaction,drafts,scene,react-bindings}.test.ts[x]
```

**Imports:** external consumers→contract/index only. Core→own declarations/core; no React/browser/I/O/foreign runtime. Own declarations may refer to public Model/Presentation/Layout types. Compose binds own adapters and injected view slots; no sibling behavioral imports. Local CSS resource imports allowed. Additional focused files permitted without changing responsibility.
**Consumers:** web editing host and embedded read-only collection viewer use the same pure operations. Explicit React-binding factory imports React Flow/CSS; headless import loads neither. Host supplies admitted scenes, required Presentation slots and intent handling; no fake fallback renderer or commit adapter.
