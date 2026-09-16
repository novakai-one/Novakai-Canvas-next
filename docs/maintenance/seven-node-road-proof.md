# Seven-node road proof

Run `pnpm prototype:roads` and open `/roads-prototype.html?seven`.
The earlier two-node fixture remains available without the query parameter.

## Geometry contract

Section 1 has three staggered nodes with 96px horizontal overlap and 144px vertical gaps.
Section 2 has two side-by-side nodes with a 144px horizontal gap. Section 3 has two stacked
nodes with a 144px vertical gap. Node footprints and their local ports still belong to
`prototype-road-nodes.ts`. Sections own four boundary ports. Top/left are inputs;
bottom/right are outputs. Section 2 declares a 64px horizontal offset for its top/bottom
ports, avoiding a four-pixel sliver between distinct junctions. Roads consume that declaration.

Streets are 48px, split into opposing 24px lanes; access roads are 24px one-way rectangles.
There are 74 roads, 266 lanes, 95 junctions and 675 permitted connections. One forward pass
places nodes, reads ports, positions streets and attaches driveways. Fixed capacity is a
prototype assumption; dragging and demand-driven widening are not implemented.

## Interaction evidence

The selector provides 99 two-wire demonstrations, covering all 95 junction locations and all
40 ports (28 node ports, 12 section ports). A section-gate demonstration includes the full
boundary road and continues through its opposite mouth. Solid/dashed paths identify the two
wires. White gaps at crossings mean no electrical join. Endpoints are either node ports or
straight-lane midpoints, at least 12 layout pixels from the nearest junction boundary in this
fixture. This is display clearance, not a physical safety or congestion model.

The catalogue covers locations/accesses, not every possible two-wire combination. All 675
connection geometries are separately validated in both directions. Coverage audit reports
1,209,216 square pixels, no gaps, no duplicate regions and no outside-road inspection areas.
Browser pointer checks include every lane, junction and port; the section-port marker explicitly
enables pointer events because non-interactive React Flow wrappers otherwise pass clicks through.

## Engineering changes

- Merge overlapping driveway mouths into one junction before splitting lanes. The independent
  coverage audit detects any inappropriate rectangular expansion.
- Use road ownership to index junction endpoints. No lane scans every junction to find its owner.
- A same-direction connection with displaced lane centrelines needs a dogleg. Only collinear
  forward connections use a straight segment. This fixes diagonal paths at offset gates.
- Generate diagnostic two-wire examples once. The renderer reads their geometry and validation
  results and cannot invent road connections.

## Measured cost

Numeric expression instrumentation of the actual core measures 790,285 network operations
before ownership indexing and 111,907 after: 85.8% fewer, preserving every lane and all 675
connection waypoint sequences. The baseline's 50,540 endpoint containment checks are replaced
by 532 indexed lookups and 398 index writes. Other compilation work remains, including 2,701
road-pair checks. Numeric operations exclude map/set/string/runtime/framework bookkeeping.

The exact union audit costs 7,986,159 numeric operations; the 99-case catalogue costs 446,554.
These diagnostic tasks currently run at prototype startup, not per wire. User Timing separately
records geometry, coverage, catalogue, imports and rendering readiness.

A separate reproducible reference Dijkstra search over this directed network takes 121 numeric
operations for Node 1→2 and 877 for Node 2→1. These are reference-tool queries, not a newly
integrated production wire router. The previous same-row four-family formulas do not apply
unchanged to staggered nodes, shared corridors and boundary gates. Opposite routes cannot just
be reversed because output/input port roles differ. The graph is already shared between queries;
no >50% per-query batching saving is established here.

## Verification and limits

`pnpm check`: 70 files / 208 existing tests. No new permanent tests. The committed `output/playwright/seven/` evidence contains the exported scene, per-query
breakdown, browser timing samples, geometry checks, click checks and all 99 screenshots.
Temporary expression-instrumentation scripts remain in the local task artifacts. Four materially revised views received an independent
visual review; the rest have automated checks and manual sampling. This fixture is isolated
from the normal diagram pipeline and does not claim arbitrary layout or congestion support.
