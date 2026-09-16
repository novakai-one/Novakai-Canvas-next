import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createRoadPrototypeScene,
  inspectRoadTravel,
  auditRoadCoverage,
} from '@novakai/canvas-layout';
import type { PrototypeTravel, PrototypeLayoutMeasure } from '@novakai/canvas-layout';
import { createRoadPrototype } from '@novakai/canvas-canvas';
import { createReactBindings } from '@novakai/canvas-design-system';

const measure: PrototypeLayoutMeasure = (stage, operation) => {
  const start = performance.now();
  const result = operation();
  performance.measure(`roads:${stage}`, { start });
  return result;
};
/** Readiness includes fonts and two frame opportunities; it is not a GPU paint-duration claim. */
async function recordReady(): Promise<void> {
  await document.fonts.ready;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      performance.measure('roads:render-to-ready', { start: 'roads:render-request' });
      performance.measure('roads:navigation-to-ready', { start: 0 });
    }),
  );
}
/** Isolated prototype. Timings stay in browser User Timing, never in deterministic scene records. */
async function main(): Promise<void> {
  const target = document.getElementById('app');
  if (target === null) return;
  const start = performance.now();
  const styles = await createReactBindings();
  performance.measure('roads:styles-import', { start });
  if (!styles.ok) {
    target.textContent = styles.error.message;
    return;
  }
  const importStart = performance.now();
  const Prototype = await createRoadPrototype();
  performance.measure('roads:renderer-import', { start: importStart });
  const layoutStart = performance.now();
  const scene = createRoadPrototypeScene({ measure });
  performance.measure('roads:layout-total', { start: layoutStart });
  const auditStart = performance.now();
  const coverage = auditRoadCoverage(scene);
  performance.measure('roads:coverage-audit', { start: auditStart });
  performance.mark('roads:render-request');
  createRoot(target).render(
    createElement(Prototype, {
      scene,
      coverage,
      onReady: recordReady,
      inspectTravel: (travel: PrototypeTravel) => inspectRoadTravel(scene, travel),
    }),
  );
}
void main().catch(() => {
  document.body.textContent = 'Road prototype could not start. Reload to retry.';
});
