import { createElement, useState } from 'react';
import type { ReactElement } from 'react';
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
  NestedSceneSpec,
  NestedSectionSpec,
} from '@novakai/canvas-layout';
import { createRoadPrototype } from '@novakai/canvas-canvas';
import { createReactBindings } from '@novakai/canvas-design-system';

declare global {
  interface Window {
    __layoutRecalcCount: number;
    __roadScene: RoadPrototypeScene;
  }
}
window.__layoutRecalcCount = 0;

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
  const build = builder();
  window.__layoutRecalcCount += 1;
  const scene = build({ measure });
  window.__roadScene = scene;
  performance.measure('roads:layout-total', { start: layoutStart });
  const auditStart = performance.now();
  const coverage = auditRoadCoverage(scene);
  performance.measure('roads:coverage-audit', { start: auditStart });
  const proofStart = performance.now();
  const proofs = catalog(scene);
  performance.measure('roads:proof-catalog', { start: proofStart });
  performance.mark('roads:render-request');
  /** React owns view-fixture state; rejected layouts retain the last admitted semantic order. */
  function InteractivePrototype(): ReactElement {
    const [current, update] = useState({ scene, spec: fanInHubSceneSpec });
    function swap(source: string, destination: string): void {
      const next = swapSpec(current.spec, source, destination);
      if (next === current.spec) return;
      window.__layoutRecalcCount += 1;
      const candidate = createNestedRoadScene({ spec: next, measure });
      if (!candidate.wiring?.ok) return;
      window.__roadScene = candidate;
      update({ scene: candidate, spec: next });
    }
    return createElement(Prototype, {
      scene: current.scene,
      coverage: initialValue(current.scene === scene, coverage),
      proofs,
      initialProof: Number(new URLSearchParams(location.search).get('proof') ?? -1),
      onReady: readiness(current.scene === scene),
      onSwap: initialValue(new URLSearchParams(location.search).has('nested'), swap),
      inspectTravel: (travel: PrototypeTravel) => inspectRoadTravel(current.scene, travel),
    });
  }
  createRoot(target).render(createElement(InteractivePrototype));
}
void main().catch(() => {
  document.body.textContent = 'Road prototype could not start. Reload to retry.';
});

function builder() {
  if (new URLSearchParams(location.search).has('nested')) return buildHubScene;
  return new URLSearchParams(location.search).has('seven')
    ? createSevenRoadScene
    : createRoadPrototypeScene;
}
function catalog(scene: RoadPrototypeScene) {
  return new URLSearchParams(location.search).has('seven') ? createRoadProofs(scene) : [];
}

/** This browser fixture opts into the hub; the public builder keeps its M3 default. */
function buildHubScene(options: { readonly measure: PrototypeLayoutMeasure }): RoadPrototypeScene {
  return createNestedRoadScene({ ...options, spec: fanInHubSceneSpec });
}

/** The isolated fixture owns semantic order only; no workspace transaction is performed. */
function swapSpec(spec: NestedSceneSpec, source: string, destination: string): NestedSceneSpec {
  const sections = spec.sections.map((section) => swapSection(section, source, destination));
  if (sections.every((section, index) => section === spec.sections[index])) return spec;
  return { ...spec, sections };
}
function swapSection(
  section: NestedSectionSpec,
  source: string,
  destination: string,
): NestedSectionSpec {
  const from = section.nodes.findIndex((node) => `node-${node.number}` === source);
  const to = section.nodes.findIndex((node) => `node-${node.number}` === destination);
  if (Math.min(from, to) >= 0) return exchangeNodes(section, from, to);
  const children = section.children.map((child) => swapSection(child, source, destination));
  if (children.every((child, index) => child === section.children[index])) return section;
  return { ...section, children };
}
function exchangeNodes(section: NestedSectionSpec, from: number, to: number): NestedSectionSpec {
  const nodes = section.nodes.map((node, index) => {
    if (index === from) return section.nodes[to] ?? node;
    return index === to ? (section.nodes[from] ?? node) : node;
  });
  return { ...section, nodes };
}
/** A committed React tree followed by two frame opportunities is render-ready, not GPU duration. */
function recordSwapReady(): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      performance.measure('roads:drop-to-ready', { start: 'roads:drop' }),
    ),
  );
}

function initialValue<T>(enabled: boolean, value: T): T | undefined {
  return enabled ? value : undefined;
}
function readiness(initial: boolean): () => void {
  return initial ? recordReady : recordSwapReady;
}
