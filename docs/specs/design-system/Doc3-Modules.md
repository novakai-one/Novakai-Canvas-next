# Capability: design-system — Modules

### contract/api.ts
**Exposes:** createDesignSystem({identity}):DesignSystem; readSources(unknown),resolve(request),resolveTheme(request),projectDiagram(resolved),compile(sources),auditStyles(styles,resolved), all Result-returning. Pure synchronous operations; hash role synchronous for existing Templates/Presentation compatibility.
**Contract:** token correction belongs here; host retains last valid scope/preferences. Templates owns preset admission; no persistence side effect. ResolveTheme returns complete portable token data from supplied exact bases/fonts, without assigning a Templates preset digest. Required collaborators have no fake defaults.

### core/tokens/*.ts; core/themes/*.ts
**Exposes (private):** DTCG profile reader, typed dependency graph, cycle-safe alias/recipe evaluation, bounds/contrast, UI deltas, font checks, portable theme/diagram projection.
**Contract:** T01–T09. Unknown stored preference is an error; host owns safe-session fallback while retaining original record. System theme maps through shipped manifest; pinned selection ignores OS scheme changes. Diagram approved font pins are caller-supplied admission evidence, never resolved through a platform fallback.

| Input | Exact behavior |
|---|---|
| Alias/recipe | resolve dependency order; identify cycle/missing IDs; no eval/CSS expression parsing |
| UI request | choose exact UI theme; apply four preference fields; pointer/text/motion floors last |
| Diagram/export request | use complete pinned normalized tokens; require exact body/mono fonts; export disables motion |
| Theme delta | only known base-token IDs/types; no authored executable recipes; validate final pairs together |
| Contrast | sRGB relative luminance after alpha compositing; each required state pair carries identity/threshold/evidence |
| Projection | same canonical 8-bit colors to CSS/numeric/portable outputs; role IDs map to role.<id>.fill/stroke/text, missing members reject; no host palette policy |

### core/artifacts/*.ts; adapters/build/*.ts
**Ports:** TokenSource.read():Promise<Result<SourceSet>>; TokenArtifacts.publish(complete):Promise<Result<Manifest>>; Identity.hash(canonical):Result<Digest>.
**Contract:** fixed safe relative artifact names; content hashes verified; generation directories immutable; atomic manifest selects one complete set. Failure preserves old manifest; replay same bytes safe. CLI calls public compiler/bindings. Generated snapshot verification compares every CSS/TS output against compile; snapshots never manually edited. Reader/writer filesystem implementation uses supplied roots and typed I/O outcomes; no cwd/env guess.
**Style audit:** adapter parses CSS into selector/layer/property/value data; core traces variable dependencies and counts baseline06 denominator, unknown/unlayered/important failures. It never pads counts with unused generated aliases.

### contract/compose.ts
**Exposes:** composeDesignSystem() with actual portable SHA256 adapter; createReactBindings():Promise<Result<ReactBindings>>; createTokenFileBindings(root):Promise<Result<...>>; createScopeInstaller(target):Result<...>.
**Contract:** platform modules load on explicit binding request only. Public headless import loads no CSS/DOM/Node filesystem. React/slot registries constructed once; no component factory inside render. Each adapter imports own contract/third-party library/own CSS only. Token installer validation is injected, not a core import from adapter.

### adapters/react/*.tsx
| Component | Responsibility / contract |
|---|---|
| Button | native button; default/primary/selected/focus/disabled/pending; accessible icon label; pending label retained |
| Field | stable label/control/error/help associations; control slot receives IDs/invalid/describedby; no domain validation |
| Dialog | controlled Radix modal; title/description/close; explicit portal scope; trap/restore focus; host can decline dirty dismissal |
| Menu | labelled trigger/items; keyboard navigation/disabled actions; controlled open where needed |
| Tabs | labelled tablist; stable selected panel IDs; controlled value; preserve requested mounted panel content |
| Tooltip | accessible description, keyboard/pointer trigger; disabled behind active modal by host context |
| StatusMessage | status/alert semantics, visible label and icon; color never sole signal |

### adapters/react/panels/*.tsx
| Component | Responsibility / contract |
|---|---|
| SidePanel | frame; header/body slots; keyboard/pointer resize handle with range ARIA; no stored panel policy |
| PanelHeader | persistent title/actions/close |
| PanelBody | one scroll owner; context header and ordered section slots |
| PanelBodyHeader | current context/scope/actions |
| PanelSection | stable section ID, controlled collapse, persistent children; injected header/body slots |
| PanelSectionHeader | separate collapse and reorder/hide actions; labelled controls, expanded/controls ARIA |
| PanelSectionBody | labelled hidden/visible region; no unmount-based draft loss |

All use scoped CSS variables. Overlay placement/modal switching, dirty forms, section registration/preferences and camera compensation belong to host/Canvas; these primitives accept their decisions.

### adapters/browser/install-tokens.ts; adapters/styles/*
**Contract:** validate entire resolved scope before one owned-variable installation; preserve unrelated geometry/style; explicit portal target uses same resolved set. Replacement/cleanup cannot overwrite a newer scope generation. Failure returns typed outcome and retains previous valid variables. Root declarations re-evaluate aliases per scope. Styles loaded in declared layer order; forced-color/focus/visually-hidden utilities have one authority.
