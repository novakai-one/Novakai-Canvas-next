# M6 templates scene — STOP: nested-only section is unsupported

2026-09-17. Branch: `feat/templates-scene`. Starting revision: `88c65fe`.
**Milestone incomplete.** No layout, routing, renderer, existing verifier, or
production templates source was changed.

## Required stop condition

Feature spec 2 says: “`core` itself holds zero direct nodes — only nested
sections. If the renderer cannot express a section containing only nested
sections, STOP and report.”

The public `createNestedRoadScene` pipeline cannot produce finite geometry for
that tree. In `capability/layout/core/prototype-nested-placement.ts:52–54`,
`count = 0`, `columns = Math.ceil(Math.sqrt(0)) = 0`, and
`rows = Math.ceil(0 / 0) = NaN`. Lines 71–73 propagate `NaN` into the core
section height. Row packing then spreads nonfinite positions across the scene.
This fails before browser rendering or value-edge routing can be evaluated.

The reproduction uses all 16 real production files and the exact nine-directory
tree. Requests are deliberately empty to isolate placement from routing; the
empty successful wiring result is **not** evidence that the actual wires route.
The semantic input carries no coordinates. Dependency directories and tests are
excluded by walking only the three production roots.

## Reproduce from the repository root

```sh
node --import tsx --input-type=module <<'JS'
import { readdirSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { createNestedRoadScene } from './capability/layout/contract/index.ts';
const walk = directory => readdirSync(`capability/templates/${directory}`, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
const files = ['contract', 'core', 'adapters'].flatMap(walk).filter(path => path.endsWith('.ts')).sort();
const directories = ['contract', 'contract/ports', 'contract/records', 'core', 'core/admission', 'core/discovery', 'core/expansion', 'core/validation', 'adapters'];
const section = path => ({ number: directories.indexOf(path) + 1, nodes: files.filter(file => dirname(file) === path).map(file => ({ number: files.indexOf(file) + 1, label: basename(file) })), children: directories.filter(child => dirname(child) === path).map(section) });
const spec = { sections: ['contract', 'core', 'adapters'].map(section), requests: [] };
const scene = createNestedRoadScene({ spec });
console.log('Production nodes:', files.length);
console.log('Core direct nodes:', spec.sections[1].nodes.length);
console.log('Core child sections:', spec.sections[1].children.length);
console.log('Public builder sections:', scene.sections.length);
console.log('Core bounds:', scene.sections.find(section => section.id === 'section-4').bounds);
console.log('Sections with nonfinite bounds:', scene.sections.filter(section => !Object.values(section.bounds).every(Number.isFinite)).length);
console.log('Nodes with nonfinite bounds:', scene.nodes.filter(node => !Object.values(node.bounds).every(Number.isFinite)).length);
console.log('Roads with nonfinite bounds:', scene.roads.filter(road => !Object.values(road.bounds).every(Number.isFinite)).length);
console.log('Empty-request wiring:', JSON.stringify(scene.wiring));
JS
```

Actual output (exit 0; diagnostic reproduction, not an acceptance runner):

```text
Production nodes: 16
Core direct nodes: 0
Core child sections: 4
Public builder sections: 9
Core bounds: { x: 3304, y: NaN, width: 2896, height: NaN }
Sections with nonfinite bounds: 9
Nodes with nonfinite bounds: 16
Roads with nonfinite bounds: 142
Empty-request wiring: {"ok":true,"value":[]}
```

## Binary DoD status

FAIL includes blocked/not run; no unverified item is treated as passing.

| DoD | Status | Evidence |
| --- | --- | --- |
| 1. `pnpm check`, ≥208 tests, no new tests | PASS | Exit 0; 70 test files / 208 tests. Full stdout: `pnpm-check-output.txt`. No source/test changes. |
| 2. Committed deterministic AST extractor and traced graph | FAIL — not run | Stopped at required placement prerequisite; no extractor or extracted graph claimed. |
| 3. All nodes placed and all real wires route | FAIL | 16/16 nodes have nonfinite geometry; real routing not attempted. |
| 4. Templates invariants, certificates, deterministic rebuild, stages | FAIL — not run | No valid templates scene exists to certify. |
| 5. Ops, five loads, doubled graph, scaling answer | FAIL — not run | No valid scene; no estimates substituted for measurements. |
| 6. Two headless screenshots | FAIL — not run | Rendering invalid geometry would not provide acceptance evidence. |
| 7. Unchanged nested structural identity verifier | PASS | Exit 0; full stdout in `structural-identity-output.txt`. |
| 8. README with graph findings and measured costs | FAIL — blocked | README records this STOP only; no hub or cost claims. |
| 9. Branch, logical commits, clean status | PASS for STOP handoff only | `feat/templates-scene`; one documentation/evidence commit, clean tree verified after commit. Implementation remains blocked. |

No browser or server was started: the pre-render prerequisite failed. Port 5188
was not contacted or modified; port 5190 was unnecessary after STOP. No new
dependencies, tests, or verifier scripts were added. No push or PR.

Next decision: authorize a separate fix for nested-only section placement, then
rerun this milestone from extraction onward. No placeholder node, flattened
tree, hand-placed geometry, or routing-law change has been used to bypass it.
