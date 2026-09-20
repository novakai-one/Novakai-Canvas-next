# Layout

Derives positions and wire geometry from Presentation's measured nodes. It does not size node content or commit diagrams.

| Find | Location |
|---|---|
| Arrange/route dispatch and cache identity | `core/arrangement/` |
| App-to-custom-engine conversion | `core/scene-in.ts` |
| Module roads, lanes and nested sections | `core/prototype-nested-*.ts`, `core/nested-wire-*.ts` (production engine despite historical names) |
| General placement and compact tree rows | `core/placement/` |
| General wire routing and tree branches | `core/routing/` |
| Engine composition | `contract/compose.ts` |
| ELK, Kiwi and libavoid bindings for other modes | `adapters/` |

Module sections use the custom roads engine; there is no native fallback for modules. Other modes retain their existing placement/routing paths. `key`, `arrange`, `route` and `inspect` are exposed through the public contract. Route-only operations retain node positions and section origins.

Canvas paints optional roads/lanes using the returned geometry in `../canvas/adapters/react-flow/RoutingRoads.tsx`. Toggling that overlay does not run layout.
