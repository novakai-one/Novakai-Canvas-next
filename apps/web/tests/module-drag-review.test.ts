import { assert, expect, it } from 'vitest';
import { buildMoveReview } from '../contract/index.js';
import { previewModuleRoutes } from '../adapters/route-preview.js';
import { workspaceFixture, request as makeRequest } from './host-workspace-fixture.js';
import type { RenderDocument } from '../contract/records/owners.js';

async function collection(source: string, id: string) {
  const fixture = await workspaceFixture();
  const initial = await fixture.session.read();
  assert(initial.ok);
  const created = await fixture.session.apply(
    makeRequest(initial.value, `${id}-create`, id, 'dsl', { source, mode: 'create' }, true),
    new AbortController().signal,
  );
  assert(created.ok, JSON.stringify(created));
  const document = await fixture.session.render(id, new AbortController().signal);
  assert(document.ok, JSON.stringify(document));
  return { fixture, document: document.value };
}

function move(
  document: RenderDocument,
  collectionId: string,
  sectionId: string,
  id: string,
  x: number,
  y: number,
) {
  const section = document.scene.sections.find((item) => item.id === sectionId);
  assert(section);
  const base = {
    collectionId,
    revision: document.collection.revision,
    inputKey: document.scene.inputKey,
    generation: 1,
  };
  const intent = {
    kind: 'placement' as const,
    id: `move-${id}-${x}-${y}`,
    scope: 'appearance' as const,
    base,
    entries: [
      {
        target: { kind: 'node' as const, section: sectionId, id },
        placement: { x, y, locked: false },
      },
    ],
  };
  return buildMoveReview(intent, { document, stamp: base, preview: previewModuleRoutes });
}

// Wires give every member a wire-approach clearance wider than its own box, which is the case
// that previously made a plain render shift an already hand-placed member (item 1).
const wired = `canvas 1
collection @wired "Wired" theme=paper {
 node @a1 module "A1" {}
 node @b1 module "B1" {}
 node @b2 module "B2" {}
 node @b3 module "B3" {}
 wire @w1 @b1 -> @b2 "x" kind=imports
 wire @w2 @b2 -> @b3 "y" kind=imports
 section @app "App" mode=modules layout=grid columns=1 direction=down {
  group @ga "GA" layout=grid columns=1 { show @a1 }
  group @gb "GB" layout=grid columns=1 direction=down { show @b1 @b2 @b3 }
 }
}`;

// Leaf nodes with an outgoing wire carry a wire-approach clearance wider than their own box,
// which is the footprint that previously made a plain render shift an already hand-placed
// leaf even though it never moved (item 1).
const leaves = `canvas 1
collection @leaves "Leaves" theme=paper {
 node @a1 module "A1" {}
 node @b1 module "B1" {}
 node @b2 module "B2" {}
 wire @w1 @a1 -> @b1 "x" kind=imports
 wire @w2 @a1 -> @b2 "y" kind=imports
 section @app "App" mode=modules layout=grid columns=1 direction=down { show @a1 @b1 @b2 }
}`;

it('re-committing a leaf at its own rendered position produces no geometry change (routing-explained-like layout is stable)', async () => {
  const { fixture, document } = await collection(leaves, 'leaves');
  try {
    const section = document.scene.sections.find((item) => item.id === 'app');
    assert(section);
    for (const objectId of ['a1', 'b1', 'b2']) {
      const node = section.nodes.find((item) => item.measured.objectId === objectId);
      assert(node, objectId);
      const review = move(document, 'leaves', 'app', node.id, node.box.x, node.box.y);
      assert(review.ok, `${objectId}: ${JSON.stringify(review)}`);
      // A container may still refit by a hair when a member first gets an explicit placement,
      // but the leaf pinned at its own current position must never itself drift (item 1/6).
      const option = review.value.options.find((item) => item.kind === 'move-only');
      const nodeDrifted = option?.geometryChanges.find((change) => change.target.kind === 'node');
      expect(nodeDrifted, objectId).toBeUndefined();
    }
  } finally {
    await fixture.close();
  }
});

type Review = ReturnType<typeof move>;
/** The box a plain move puts this node in, or the message the person reads instead. */
function landed(review: Review, id: string) {
  if (!review.ok) return review.error.message;
  const option = review.value.options.find((item) => item.kind === 'move-only');
  return option?.preview.boxes.find((item) => item.target.kind === 'node' && item.target.id === id)
    ?.box;
}
function sectionOf(review: Review, id: string) {
  assert(review.ok, JSON.stringify(review));
  const option = review.value.options.find((item) => item.kind === 'move-only');
  return option?.preview.boxes.find(
    (item) => item.target.kind === 'section' && item.target.id === id,
  )?.box;
}
function nodeOf(document: RenderDocument, sectionId: string, objectOrGroup: string) {
  const section = document.scene.sections.find((item) => item.id === sectionId);
  const node = section?.nodes.find(
    (item) => item.measured.objectId === objectOrGroup || item.measured.groupId === objectOrGroup,
  );
  assert(section && node, objectOrGroup);
  const parent = section.nodes.find((item) => item.id === node.parent);
  // Placement is relative to the node's parent box; the preview reports world boxes.
  const at = (dx: number, dy: number) => ({
    x: node.box.x - (parent?.box.x ?? 0) + dx,
    y: node.box.y - (parent?.box.y ?? 0) + dy,
  });
  const world = (dx: number, dy: number) => ({
    x: node.box.x + section.origin.x + dx,
    y: node.box.y + section.origin.y + dy,
  });
  return { section, node, at, world };
}

it('a group moved right lands where dropped and grows its section by no more than the move', async () => {
  const { fixture, document } = await collection(wired, 'wired');
  try {
    const { section, node, at, world } = nodeOf(document, 'app', 'ga');
    for (const dx of [1, 2, 3, 5, 10, 24, 50]) {
      const { x, y } = at(dx, 0);
      const review = move(document, 'wired', 'app', node.id, x, y);
      expect(landed(review, node.id), `dx=${dx}`).toMatchObject(world(dx, 0));
      const grown = (sectionOf(review, 'app')?.width ?? 0) - section.box.width;
      expect(grown, `dx=${dx}`).toBeGreaterThanOrEqual(0);
      expect(grown, `dx=${dx}`).toBeLessThanOrEqual(dx);
    }
  } finally {
    await fixture.close();
  }
});

const sideBySide = `canvas 1
collection @sidebyside "SideBySide" theme=paper {
 node @x module "X" {}
 node @y module "Y" {}
 section @s "S" mode=modules layout=grid columns=2 { show @x @y }
}`;

it('a node dropped squarely on another box is refused and names that box', async () => {
  const { fixture, document } = await collection(sideBySide, 'sidebyside');
  try {
    const x = nodeOf(document, 's', 'x');
    const y = nodeOf(document, 's', 'y');
    const review = move(document, 'sidebyside', 's', x.node.id, y.node.box.x, y.node.box.y);
    expect(landed(review, x.node.id)).toBe("Can't drop on top of Y");
  } finally {
    await fixture.close();
  }
});

it('a node dropped overlapping the edge of another box stops short of it', async () => {
  const { fixture, document } = await collection(sideBySide, 'sidebyside');
  try {
    const x = nodeOf(document, 's', 'x');
    const y = nodeOf(document, 's', 'y');
    const gap = y.node.box.x - (x.node.box.x + x.node.box.width);
    const { x: left, y: top } = x.at(gap + 20, 0);
    const box = landed(move(document, 'sidebyside', 's', x.node.id, left, top), x.node.id);
    assert(typeof box === 'object', String(box));
    expect(box.x + box.width).toBeLessThanOrEqual(y.world(0, 0).x);
  } finally {
    await fixture.close();
  }
});

const grouped = `canvas 1
collection @grouped "Grouped" theme=paper {
 node @m1 module "M1" {}
 node @m2 module "M2" {}
 node @m3 module "M3" {}
 section @sec "Sec" mode=modules layout=grid columns=2 {
  group @gr "GR" layout=grid columns=1 direction=down { show @m1 @m2 }
  show @m3
 }
}`;

type Spot = { readonly x: number; readonly y: number };
function landedOrExplained(
  box: string | Spot | undefined,
  want: Spot,
  before: Spot,
  label: string,
) {
  if (typeof box !== 'object')
    return expect(box).toBe("Can't move M1 there: its group has no room to grow that way");
  expect([want.x, before.x], `${label} x`).toContain(box.x);
  expect([want.y, before.y], `${label} y`).toContain(box.y);
}
function movedOrExplained(box: string | Spot | undefined, label: string) {
  if (typeof box === 'string') return expect(box, label).toMatch(/^Can't /);
  expect(box, label).toBeDefined();
}

it('a member nudged up or left past its group edge lands where dropped or says why', async () => {
  const { fixture, document } = await collection(grouped, 'grouped');
  try {
    const { node, at, world } = nodeOf(document, 'sec', 'm1');
    for (const [dx, dy] of [
      [-10, 0],
      [0, -10],
      [-30, 0],
      [-20, -20],
    ] as const) {
      const { x, y } = at(dx, dy);
      const review = move(document, 'grouped', 'sec', node.id, x, y);
      // Each axis lands where dropped, or stops at the group's inner edge when the group can't grow that way.
      landedOrExplained(landed(review, node.id), world(dx, dy), world(0, 0), `${dx},${dy}`);
    }
  } finally {
    await fixture.close();
  }
});

it('a group dragged by its header into empty space moves, whatever its members sit over', async () => {
  const { fixture, document } = await collection(grouped, 'grouped');
  try {
    const { node, at, world } = nodeOf(document, 'sec', 'gr');
    for (const [dx, dy] of [
      [0, 200],
      [30, 0],
      [0, 30],
    ] as const) {
      const { x, y } = at(dx, dy);
      const review = move(document, 'grouped', 'sec', node.id, x, y);
      expect(landed(review, node.id), `${dx},${dy}`).toMatchObject(world(dx, dy));
    }
  } finally {
    await fixture.close();
  }
});

it('a group dragged past the section top or left edge moves or says why, never snaps back', async () => {
  const { fixture, document } = await collection(grouped, 'grouped');
  try {
    const { node, at } = nodeOf(document, 'sec', 'gr');
    for (const [dx, dy] of [
      [-20, 0],
      [0, -20],
    ] as const) {
      const { x, y } = at(dx, dy);
      const review = move(document, 'grouped', 'sec', node.id, x, y);
      movedOrExplained(landed(review, node.id), `${dx},${dy}`);
    }
  } finally {
    await fixture.close();
  }
});
