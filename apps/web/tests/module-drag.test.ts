import { assert, expect, it } from 'vitest';
import { buildMoveReview } from '../contract/index.js';
import { previewModuleRoutes } from '../adapters/route-preview.js';
import { workspaceFixture, request as makeRequest } from './host-workspace-fixture.js';
import type { RenderDocument } from '../contract/records/owners.js';

// Wires make a layered grid; the first drag pins every member, which used to reshape the grid.
const source = `canvas 1
collection @drag "Drag" theme=paper {
 node @api module "API" {}
 node @service module "Service" {}
 node @store module "Store" {}
 node @cache module "Cache" {}
 node @jobs module "Jobs" {}
 node @other module "Other" {}
 wire @a @api -> @service "calls" kind=imports
 wire @b @service -> @store "writes" kind=imports
 wire @c @service -> @cache "reads" kind=imports
 wire @d @jobs -> @store "writes" kind=imports
 section @app "App" mode=modules direction=down {
  show @api @service @store @cache @jobs
  connect @a @b @c @d
 }
 section @side "Side" mode=modules layout=grid { show @other }
}`;

async function rendered() {
  const fixture = await workspaceFixture();
  const initial = await fixture.session.read();
  assert(initial.ok);
  const created = await fixture.session.apply(
    makeRequest(initial.value, 'drag-create', 'drag', 'dsl', { source, mode: 'create' }, true),
    new AbortController().signal,
  );
  assert(created.ok, JSON.stringify(created));
  const document = await fixture.session.render('drag', new AbortController().signal);
  assert(document.ok, JSON.stringify(document));
  return { fixture, document: document.value };
}

function drag(document: RenderDocument, objectId: string, dx: number, dy: number) {
  const section = document.scene.sections.find((item) => item.id === 'app');
  const node = section?.nodes.find((item) => item.measured.objectId === objectId);
  assert(section && node);
  const base = {
    collectionId: 'drag',
    revision: document.collection.revision,
    inputKey: document.scene.inputKey,
    generation: 1,
  };
  const intent = {
    kind: 'placement' as const,
    id: `drag-${objectId}-${dx}-${dy}`,
    scope: 'appearance' as const,
    base,
    entries: [
      {
        target: { kind: 'node' as const, section: section.id, id: node.id },
        placement: { x: node.box.x + dx, y: node.box.y + dy, locked: false },
      },
    ],
  };
  const review = buildMoveReview(intent, {
    document,
    stamp: base,
    preview: previewModuleRoutes,
  });
  return { node, section, review };
}

function expectLanded(document: RenderDocument, objectId: string, dx: number, dy: number) {
  const { node, section, review } = drag(document, objectId, dx, dy);
  assert(review.ok, `${objectId} ${dx},${dy}: ${JSON.stringify(review)}`);
  const option = review.value.options.find((item) => item.kind === 'move-only');
  assert(option, `${objectId} has no plain move option`);
  const box = (id: string) =>
    option.preview.boxes.find((item) => item.target.kind === 'node' && item.target.id === id)?.box;
  expect(box(node.id)).toMatchObject({
    x: node.box.x + section.origin.x + dx,
    y: node.box.y + section.origin.y + dy,
  });
  section.nodes
    .filter((item) => item.id !== node.id)
    .forEach((other) =>
      expect(box(other.id), other.id).toMatchObject({
        x: other.box.x + section.origin.x,
        y: other.box.y + section.origin.y,
      }),
    );
}

it('lands a dragged module node where it is dropped and leaves every other box in place', async () => {
  const { fixture, document } = await rendered();
  try {
    expectLanded(document, 'store', 20, 0);
    expectLanded(document, 'api', 0, 400);
    expectLanded(document, 'cache', 900, 300);
  } finally {
    await fixture.close();
  }
});
