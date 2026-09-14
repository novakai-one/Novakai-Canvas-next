# Module chrome and headless export

Theme presets select module frames. Existing themes use `card`; Onyx uses `folder-tab`; Blueprint uses `accent-stripe`. Other semantic shapes retain their existing notation.

```sh
pnpm render:png -- --collection resources/examples/showcase/repo-architecture.canvas --theme paper --out .local/renders/paper
pnpm render:png -- --collection repo-architecture --theme-file resources/onyx.theme --out .local/renders/onyx
pnpm render:png -- --collection repo-architecture --theme-file resources/blueprint.theme --format svg --out .local/renders/blueprint
```

The command writes every section as `<section-id>.png` (or `.svg`) and prints a JSON result with paths, the selected immutable theme pin, scene inspection evidence and admitted preset digests. A collection argument is a `.canvas` path, shipped collection ID or admitted recipe ID. Ambiguous shipped collection IDs reject; use the explicit path. It does not look up live workspace collections.

Theme overrides apply to a temporary source copy using Language's parsed value span. This also works when the original theme is unavailable. Lowering, resource admission, font validation, theme pin validation, Presentation, Layout and Export all run normally. The source file and stored workspace remain untouched. `--theme` takes precedence over `--theme-file` when both are present; the file is still admitted before selection. Local image/font resources use the normal bounded and confined CLI resource reader.

## Adding a look

1. Add a `.theme` resource with `chrome=NAME` on its header. Select `paper` or `ink` as its base and declare the three pinned font slots. Existing chrome names can be reused directly. Shipped root `.theme` files are discovered automatically.
2. If new geometry is needed, add one React chrome component and register it in Presentation's `contract/compose.ts`. Its registration carries React-free heading policy (`showKind`, optional `sectionLabel`). `createReactBindings` and `composePresentation` also accept an injected registry with a required `card` fallback.
3. Keep geometry and typography in resolved tokens. `elevation.*` owns shadow metrics; `chrome.*` owns tab/stripe geometry and header roots; `role.*.header` owns semantic header tints. `set dimension TOKEN=VALUE` declares pixel dimensions; `set number` retains scalar semantics.
4. Shared content primitives, ports, badges and marker geometry stay outside chrome components. Pure path builders are injected from core at composition.

Absent `chrome` stays absent in preset payloads. New extension tokens are omitted from legacy serialization and hydrated from the token source only during resolution. Missing legacy tokens still reject, and supplied derived tokens still require canonical equality. This preserves paper/ink/atlas/studio preset digests and card SVG output. Unknown chrome names use card measurement and rendering.

Run `pnpm check` and `pnpm tokens:check`; inspect the actual exports as well. The module recipe's pre-existing unsupported Inter arrow glyph remains an independent font/fixture issue; the showcase fixture above is the compatibility reference for this change.
