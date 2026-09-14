# Design System

Responsibility: resolve one validated token system into matching CSS/numeric values and supply reusable accessible React controls and composable panel structure. Templates owns collection-theme admission; the host owns UI preferences, panel placement and drafts.

Implemented: supported DTCG profile, typed recipes/aliases, paper/ink themes, preference/accessibility floors, contrast, exact diagram fonts/role paints, immutable artifact publication, scope installation, style metrics and fourteen shared React/panel components. Fourteen contract cases pass. Actual application browser states remain Part2 acceptance work.

Import only `@novakai/canvas-design-system`. `composeDesignSystem()` loads no browser styles or filesystem. Its pure operations are `readSources`, `resolve`, `resolveTheme`, `projectDiagram`, `compile`, `auditStyles`. Every operation returns a typed Result; failed resolution keeps the host's last accepted scope.

`createTokenFileBindings(absoluteRoot)` explicitly loads local source/artifact I/O. `createStylesheetBindings()` loads the CSS parser. `createReactBindings()` loads styles and stable control identities once during host composition, before rendering. Its `createScopeTarget(element)` binds a DOM target for `createScopeInstaller(target)`; install complete validated scopes on both content and portal roots. Lease cleanup cannot overwrite newer installations.

Run `pnpm tokens:build` after an intentional source change, then `pnpm tokens:check`. Compiler snapshots are never manually edited. Runtime output generations live in ignored `.generated/`; only a fully verified generation becomes active.

[Five specs](../../docs/specs/design-system/Doc1-Target-Repo-Tree.md) · [UI baseline](../../docs/baseline/05-UI-UX.md) · [token baseline](../../docs/baseline/06-Design-Tokens.md) · [audit resolution](../../quality/design-system-implementation-resolution.md).
