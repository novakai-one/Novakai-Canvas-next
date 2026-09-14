# Capability: design-system — Target repo tree

**Responsibility:** resolve one validated visual token system into matching CSS/numeric values; supply reusable accessible React primitives and composable panel structure.
**Owns:** token vocabulary/derivations/bounds/contrast, shipped UI-theme deltas, preference interpretation, immutable resolved scopes, generated style artifacts, primitive presentation/ARIA/focus behavior.
**Excludes:** collection/preset persistence, template pin admission, personal preference storage, panel placement/applicability, editor drafts, camera/selection, diagram notation/measurement, service/CLI transport.

```text
capability/design-system/
  contract/{index,api,compose,types,brands,errors}.ts
  contract/react-types.ts
  contract/records/{tokens,source,theme,preferences,resolved,artifacts}.ts
  contract/ports/{identity,token-source,token-artifacts,scope-target}.ts
  contract/generated/{token-names,breakpoints}.ts
  core/tokens/{read,flatten,references,recipes,values,bounds,contrast,resolve,emit}.ts
  core/themes/{resolve,preferences,fonts,diagram}.ts
  core/artifacts/{compile,manifest}.ts
  core/styles/{coverage,policy}.ts
  tokens/{definitions,semantics,preferences}.tokens.json
  tokens/themes/{paper,ink}.theme.json
  adapters/hash/sha256.ts
  adapters/build/{token-files,stylesheet-reader}.ts
  adapters/browser/install-tokens.ts
  adapters/react/{Button,Field,Dialog,Menu,Tabs,Tooltip,StatusMessage}.tsx + .module.css
  adapters/react/panels/{SidePanel,PanelHeader,PanelBody,PanelBodyHeader,PanelSection,PanelSectionHeader,PanelSectionBody}.tsx + .module.css
  adapters/styles/{entry,reset,utilities}.css
  adapters/styles/{tokens,semantics,themes,preferences,layout}.generated.css
  cli/build-tokens.ts
  tests/{fixtures,tokens,themes,artifacts,primitives,panels}.test.ts[x]
```

**Imports:** consumers→contract/index only. Core→own declaration records/core; no domain capability, React, CSS, browser or Node imports. Public exports are explicitly listed; core uses declaration records directly. React types never enter core. Compose alone wires sibling adapters/slots; own local CSS assets are permitted resources, not behavioral imports.
**Environment bindings:** importing the public entry for pure token work must not load CSS/DOM/filesystem modules. React/style and Node-build adapters load only in their explicitly requested binding factories. Bound component identities are stable; components are not recreated during render. Additional focused files permitted; no placeholder controls or fake success adapters.
