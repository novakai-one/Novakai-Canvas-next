# Capability: layout — Target repository tree

**Responsibility:** derive stable spatial geometry and labelled routes from measured Presentation scenes, satisfying authored hard constraints without mutating diagram meaning.

**Consumers:** Authoring feasibility/preview; Canvas positions/routes; Export same resolved scene. No DSL parsing, semantic validation, text measurement, React gestures, camera, persistence or commits.

```text
capability/layout/
├── contract/{api,compose,index,brands,errors,types,schemas}.ts
│   ├── records/{input,geometry,problem,candidate}.ts
│   └── ports/{projection,placement,solver,routing,scheduling}.ts
├── core/
│   ├── validation/{outcomes,input,equality,facts,nodes,wires,sections,activations}.ts
│   ├── geometry/{bounds,intersections,coordinates}.ts
│   ├── constraints/{compile,relative,separation}.ts
│   ├── arrangement/{collection,section,pipeline,keys,bounds,notices,sequential}.ts
│   ├── placement/{policy,groups,section}.ts
│   ├── sequence/{records,participants,events,frames,scopes,activations,sequence}.ts
│   └── routing/{endpoints,native,wires,checks,obstacles,labels,paths}.ts
├── adapters/{elk,kiwi,libavoid,scheduling,wasm-loader}.ts
└── tests/{fixtures,native-fixture,arrangement.test,routing.test,contracts.test}.ts
```

Core owns policies through narrow declared roles; adapters translate native libraries only. Core imports own declarations/helpers; input.ts may alias Presentation public types only. Native adapters never import own core or sibling adapter behavior. Compose binds native roles; hosts choose async execution/worker lifetime. Exact external packages and licenses are recorded in dependency evidence; no commercial runtime purchase. No alternate renderer or fake routing provider in production.
