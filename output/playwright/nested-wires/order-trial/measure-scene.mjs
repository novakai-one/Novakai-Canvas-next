/** Wire-geometry metrics for a rebuilt nested scene (scene.json written by
 * verify-templates-scene.mjs or set-node-order.mts). Crossing counts are NOT
 * computed here; they come from the invariant suite (CROSSINGS/CERTIFICATION).
 *
 * Definitions:
 *   wire length      = sum over segments of |dx| + |dy| (all segments axis-aligned)
 *   bends            = direction changes between consecutive segments of a wire
 *   per-section len  = each segment's length attributed to the smallest section
 *                      whose bounds contain the segment midpoint ("world" if none),
 *                      the same owner() rule the invariant suite uses for crossings
 *
 * Usage: node measure-scene.mjs <scene.json> <metrics-out.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [scenePath, outPath] = process.argv.slice(2);
if (!scenePath || !outPath) {
  console.error('usage: node measure-scene.mjs <scene.json> <metrics-out.json>');
  process.exit(1);
}
const scene = JSON.parse(readFileSync(scenePath, 'utf8'));

const containsPoint = (p, b) =>
  p.x >= b.x && p.x <= b.x + b.width && p.y >= b.y && p.y <= b.y + b.height;
function owner(point) {
  return (
    scene.sections
      .filter((s) => containsPoint(point, s.bounds))
      .sort((a, b) => a.bounds.width * a.bounds.height - b.bounds.width * b.bounds.height)[0]?.id ??
    'world'
  );
}

const wires = scene.wiring.value;
const perWire = [];
const perSection = Object.fromEntries(
  ['world', ...scene.sections.map((s) => s.id)].map((id) => [id, 0]),
);
let totalLength = 0;
let totalBends = 0;
let totalSegments = 0;
for (const wire of wires) {
  let length = 0;
  let bends = 0;
  let previousAxis = null;
  for (const segment of wire.segments) {
    const leg = Math.abs(segment.to.x - segment.from.x) + Math.abs(segment.to.y - segment.from.y);
    length += leg;
    const axis = segment.from.x === segment.to.x ? 'y' : 'x';
    if (previousAxis !== null && axis !== previousAxis) bends += 1;
    previousAxis = axis;
    const midpoint = {
      x: (segment.from.x + segment.to.x) / 2,
      y: (segment.from.y + segment.to.y) / 2,
    };
    perSection[owner(midpoint)] += leg;
  }
  totalLength += length;
  totalBends += bends;
  totalSegments += wire.segments.length;
  perWire.push({ wire: wire.id, length, bends, segments: wire.segments.length });
}

const metrics = {
  scene: scenePath,
  definitions: {
    wireLength: 'sum over segments of |dx| + |dy| (axis-aligned Manhattan legs)',
    bends: 'direction changes between consecutive segments of a wire',
    perSectionWireLength:
      'segment length attributed to the smallest section containing the segment midpoint (owner() rule from verify-templates-scene.mjs); "world" = outside all sections',
  },
  wires: wires.length,
  totalWireLength: totalLength,
  totalBends,
  totalSegments,
  perSectionWireLength: perSection,
  perWire,
};
writeFileSync(outPath, `${JSON.stringify(metrics, null, 2)}\n`);
console.log(`WIRES ${wires.length}`);
console.log(`TOTAL_WIRE_LENGTH ${totalLength}`);
console.log(`TOTAL_BENDS ${totalBends}`);
console.log(`TOTAL_SEGMENTS ${totalSegments}`);
console.log(`PER_SECTION_WIRE_LENGTH ${JSON.stringify(perSection)}`);
console.log(`WROTE ${outPath}`);
