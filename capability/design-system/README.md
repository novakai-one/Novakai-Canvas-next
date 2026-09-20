# Design System

Responsibility: resolve one validated token system into matching CSS/numeric values and supply reusable accessible React controls and composable panel structure. Templates owns collection-theme admission; the host owns UI preferences, panel placement and drafts.

Implemented: supported DTCG profile, typed recipes/aliases, paper/ink themes, preference/accessibility floors, contrast, exact diagram fonts/role paints, immutable artifact publication, scope installation, style metrics and shared React/panel components.

Import only `@novakai/canvas-design-system`. `composeDesignSystem()` loads no browser styles or filesystem. Its pure operations are `readSources`, `resolve`, `resolveTheme`, `projectDiagram`, `compile`, `auditStyles`. Every operation returns a typed Result; failed resolution keeps the host's last accepted scope.

`createTokenFileBindings(absoluteRoot)` explicitly loads local source/artifact I/O. `createStylesheetBindings()` loads the CSS parser. `createReactBindings()` loads styles and stable control identities once during host composition, before rendering. Its `createScopeTarget(element)` binds a DOM target for `createScopeInstaller(target)`; install complete validated scopes on both content and portal roots. Lease cleanup cannot overwrite newer installations.

Run `pnpm tokens:build` after an intentional source change, then `pnpm tokens:check`. Compiler snapshots are never manually edited. Runtime output generations live in ignored `.generated/`; only a fully verified generation becomes active.

## Where to edit

| Change | Source |
|---|---|
| Button, Field, Tabs, Modal and other shared controls | `adapters/react/*.tsx` and adjacent `.module.css` |
| Reusable panel header/body/sections and resize frame | `adapters/react/panels/` |
| Base colors, spacing and typography | `tokens/definitions.tokens.json` |
| Semantic UI roles | `tokens/semantics.tokens.json` |
| Light/dark theme values | `tokens/themes/` |
| Accessibility and UI preference tokens | `tokens/preferences.tokens.json` |
| Token source manifest | `tokens/source.json` |
| Brand wordmark styling and stylesheet entry | `adapters/styles/brand.css`, `adapters/styles/entry.css` |

The JSON files are authoring sources. `adapters/styles/*.generated.css` are compiler output; edit tokens and run `pnpm tokens:build`, then `pnpm tokens:check`. Diagram-theme DSL resources in `resources/` are distinct from these interface tokens.
