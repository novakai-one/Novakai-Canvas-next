import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createRoadPrototypeScene,
  createSevenRoadScene,
  createNestedRoadScene,
  fanInHubSceneSpec,
  createRoadProofs,
  inspectRoadTravel,
  auditRoadCoverage,
} from '@novakai/canvas-layout';
import type {
  PrototypeTravel,
  PrototypeLayoutMeasure,
  RoadPrototypeScene,
} from '@novakai/canvas-layout';
import { createRoadPrototype } from '@novakai/canvas-canvas';
import { createReactBindings } from '@novakai/canvas-design-system';
import { buildTemplatesScene } from './templates-scene.js';
import { buildScaleScene } from './scale-scene.js';

declare global {
  interface Window {
    __layoutRecalcCount: number;
  }
}
window.__layoutRecalcCount = 0;

const measure: PrototypeLayoutMeasure = (stage, operation) => {
  const start = performance.now();
  const result = operation();
  performance.measure(`roads:${stage}`, { start });
  return result;
};
/** Debug audit runs on demand; its timing remains separate from layout stages. */
function auditCoverage(scene: RoadPrototypeScene) {
  const start = performance.now();
  const coverage = auditRoadCoverage(scene);
  performance.measure('roads:coverage-audit', { start });
  return coverage;
}
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
/** Paint-only 100ms enter/leave dwell; the renderer owns cancellation on replacement/unmount. */
function scheduleSpotlight(paint: () => void): () => void {
  const timer = setTimeout(paint, 100);
  return () => clearTimeout(timer);
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
  const build = builder();
  window.__layoutRecalcCount += 1;
  const scene = build({
    measure,
    sectionInPortsLeft: new URLSearchParams(location.search).has('ports-left'),
  });
  performance.measure('roads:layout-total', { start: layoutStart });
  const proofStart = performance.now();
  const proofs = catalog(scene);
  performance.measure('roads:proof-catalog', { start: proofStart });
  performance.mark('roads:render-request');
  createRoot(target).render(
    createElement(Prototype, {
      scene,
      auditCoverage,
      scheduleSpotlight,
      proofs,
      initialProof: Number(new URLSearchParams(location.search).get('proof') ?? -1),
      onReady: recordReady,
      inspectTravel: (travel: PrototypeTravel) => inspectRoadTravel(scene, travel),
    }),
  );
}
void main().catch(() => {
  document.body.textContent = 'Road prototype could not start. Reload to retry.';
});

function builder() {
  const parameters = new URLSearchParams(location.search);
  const choices = [
    { key: 'templates', build: buildTemplatesScene },
    { key: 'scale', build: buildScaleScene },
    { key: 'nested', build: buildHubScene },
    { key: 'seven', build: createSevenRoadScene },
  ];
  return choices.find(({ key }) => parameters.has(key))?.build ?? createRoadPrototypeScene;
}
function catalog(scene: RoadPrototypeScene) {
  return new URLSearchParams(location.search).has('seven') ? createRoadProofs(scene) : [];
}

/** This browser fixture opts into the hub; the public builder keeps its M3 default. */
function buildHubScene(options: { readonly measure: PrototypeLayoutMeasure }): RoadPrototypeScene {
  return createNestedRoadScene({ ...options, spec: fanInHubSceneSpec });
}
