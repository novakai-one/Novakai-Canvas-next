/** Road-coverage audit comparison for two rebuilt scenes: runs the same
 * `auditRoadCoverage` the prototype footer label uses ("100% road area accounted
 * for" vs "Road coverage needs correction"). Diagnostic only; not part of the
 * invariant suite.
 *
 * Usage: node --import tsx audit-coverage.mjs <scene-a.json> <scene-b.json>
 */
import { readFileSync } from 'node:fs';
import { auditRoadCoverage } from '../../../../capability/layout/contract/index.ts';

for (const path of process.argv.slice(2)) {
  const scene = JSON.parse(readFileSync(path, 'utf8'));
  const c = auditRoadCoverage(scene);
  console.log(
    `${path}\n  COVERAGE ${JSON.stringify({ roadArea: c.roadArea, uncoveredArea: c.uncoveredArea, multiplyOwnedArea: c.multiplyOwnedArea, outsideRoadArea: c.outsideRoadArea })}`,
  );
}
