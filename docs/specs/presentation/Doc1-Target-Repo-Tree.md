# Capability: presentation — Target repository tree

**Responsibility:** resolve diagram meaning into accessible, measured visual content and engineering notation shared by interactive Canvas and Export.

**Consumers:** Authoring feasibility/preview; Layout measured local bounds/anchors; Canvas React content; Export same SVG/content renderer. No node placement, wire routing, camera, semantic mutation, storage or alternate layout.

```text
capability/presentation/
├── contract/
│   ├── api.ts · compose.ts · index.ts · brands.ts · errors.ts · types.ts · react-types.ts
│   ├── records/{input,style,visual,marker}.ts
│   └── ports/{domain,resources,measurement,rendering}.ts
├── core/
│   ├── validation/outcomes.ts
│   ├── content/{text,blocks,table,media}.ts
│   ├── notation/{nodes,wires,markers}.ts
│   └── projection/{node,section,collection}.ts
├── adapters/{fontkit.ts,static-markup.ts,styles.d.ts}
│   └── react/{NodeContent,ContentBlocks}.tsx + colocated .module.css
└── tests/{fixtures,projection.test,notation.test,rendering.test}.ts
```

Baseline03 reconciles the permitted renderer merge: NodeContent owns frame/font scope; ContentBlocks renders measured primitives for ER/interfaces/sequence too. React content is real node content inside later ReactFlow custom-node wrappers; it is not a diagram-sized SVG interaction replacement. Static renderer receives the same React component through an injected slot; adapters never import sibling adapter behavior. Fonts and media resolved offline through required ports. No Canvas/UI state in Presentation.

Core imports own core/declaration contracts only. `records/input.ts` may use type-only Model public-contract records to share canonical data vocabulary; no runtime Model import or private schema. Model behavior is injected via DomainReader. Style resolver uses required consumer-owned port; DesignSystem/token definitions remain authoritative. No palette literals in production renderer/core.
