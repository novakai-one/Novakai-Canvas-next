# Early corpus validation

## Real DSL dogfood

- Installed the frozen lockfile with pnpm.
- Started the repository service on the assigned port 5180 against `.local/workspace-corpus-early`.
- Submitted all 16 standalone sources through the real CLI `create` path.
- Lowered all 16 sources through the public Language contract and real Model validation with explicit admitted theme/asset metadata; every source passed.
- Thirteen collections committed at revision 0. `canvas list` returned exactly those thirteen committed identities and one section each.
- The three asset-bearing collections reached resource admission and were rejected because the current CLI does not stage local image assets. Their SVG declarations remain intact for PR3 integration.
- No E2E suite, shared service, browser, raw JSON or authored coordinate was used.

## Failures retained for orchestration routing

| Request | Result | Routing value |
|---|---|---|
| `create-grid-feedback-methods-01` | `invariant-violation: 3:2 Asset has not been admitted` | Route to PR3 CLI asset staging; do not strip the four icons. |
| `create-story-evidence-lesson-01` | `invariant-violation: 3:2 Asset has not been admitted` | Route to PR3 CLI asset staging; preserved starter source is valid through parse/lower. |
| `create-story-safe-deployment-01` | `invariant-violation: 3:2 Asset has not been admitted` | Route to PR3 CLI asset staging; do not replace individual SVGs with a background image. |
| `create-modules-document-publishing-01` | `invariant-violation: 24:2 Object kind is incompatible with relationship kind` | Corrected module-port to interface-member `calls` into a typed interface import. |
| `create-modules-sensor-gateway-01` | incompatible relationship kinds at lines 25, 26 and 29 | Corrected adapter port-to-port edges to `reference` and output contracts to `imports`. |
| `create-modules-document-publishing-02`, `create-modules-sensor-gateway-02` | pinned JetBrains Mono lacked `U+2192` | Replaced decorative Unicode arrows in type text with ASCII `=>`; request `-03` committed each collection. |

The module corrections are fixture-authoring changes, not source-code accommodations. They expose two useful current boundaries: relationship kinds are endpoint-sensitive, and admitted fonts validate every signature glyph.
