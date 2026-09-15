import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createRoadPrototypeScene } from '@novakai/canvas-layout';
import { createRoadPrototype } from '@novakai/canvas-canvas';
import { createReactBindings } from '@novakai/canvas-design-system';

/** Isolated, in-memory visual milestone. Browser owns startup failure display and reload recovery. */
async function main(): Promise<void> {
  const target = document.getElementById('app');
  if (target === null) return;
  const styles = await createReactBindings();
  if (!styles.ok) {
    target.textContent = styles.error.message;
    return;
  }
  const Prototype = await createRoadPrototype();
  createRoot(target).render(createElement(Prototype, { scene: createRoadPrototypeScene() }));
}

void main().catch(() => {
  document.body.textContent = 'Road prototype could not start. Reload to retry.';
});
