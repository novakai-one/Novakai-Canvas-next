# Presentation dependency and visual decisions

- React19.3.0 / ReactDOM19.3.0: registry versions checked12September2026; React-owned custom content remains mounted inside ReactFlow nodes later. https://reactflow.dev/learn/customization/custom-nodes confirms ReactFlow wraps custom content with selection/dragging/handle behavior.
- ReactDOM renderToStaticMarkup: offline static artifacts only. Interactive canvas uses mounted React components, not hydrated static output. https://react.dev/reference/react-dom/server/renderToStaticMarkup explicitly distinguishes this.
- Fontkit2.0.4/MIT: same approved engine family as Assets, exact supplied bytes and glyph advances. https://github.com/foliojs/fontkit . No operating-system fallback for diagrams/export.
- Existing offline Inter/OFL1.1 retained; JetBrains Mono5.3.0 Fontsource package selected for exact typed-code typography, license retained when copied. UI type choices continue to follow baseline06.
- Dataviz guidance applied to measured unclipped labels, quiet marks, accessible redundant notation. Its dark-only brand instance conflicts with the user's explicit paper/ink themes and is not adopted. Production colors come through the required token resolver, never a local categorical palette. No new categorical color system or palette safety claim made in this slice.

Static render checks are not visible-browser human-experience verification. That remains mandatory during UI integration.
