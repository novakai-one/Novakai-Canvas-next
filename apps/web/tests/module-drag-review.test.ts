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

it('a small group move grows its section by exactly how far the member moved, never more (item 3)', async () => {
  const { fixture, document } = await collection(wired, 'wired');
  try {
    const section = document.scene.sections.find((item) => item.id === 'app');
    assert(section);
    const group = section.nodes.find((item) => item.measured.groupId === 'ga');
    assert(group);
    const before = section.box.width;
    for (const dx of [1, 2, 3, 5, 10, 24, 50]) {
      const review = move(document, 'wired', 'app', group.id, group.box.x + dx, group.box.y);
      assert(review.ok, JSON.stringify(review));
      const option = review.value.options.find((item) => item.kind === 'move-only');
      assert(option, `dx=${dx} produced no move option`);
      const appBox = option.preview.boxes.find(
        (item) => item.target.kind === 'section' && item.target.id === 'app',
      )?.box;
      assert(appBox);
      expect(appBox.width - before, `dx=${dx}`).toBe(dx);
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

it("refuses to drop a node on top of another node's box (items 2 and 4)", async () => {
  const { fixture, document } = await collection(sideBySide, 'sidebyside');
  try {
    const section = document.scene.sections.find((item) => item.id === 's');
    assert(section);
    const x = section.nodes.find((item) => item.measured.objectId === 'x');
    const y = section.nodes.find((item) => item.measured.objectId === 'y');
    assert(x && y);
    const review = move(document, 'sidebyside', 's', x.id, y.box.x, y.box.y);
    expect(review).toMatchObject({
      ok: false,
      error: { code: 'invalid-edit', message: "Can't drop on top of Y" },
    });
  } finally {
    await fixture.close();
  }
});

const grouped = `canvas 1
collection @grouped "Grouped" theme=paper {
 node @m1 module "M1" {}
 node @m2 module "M2" {}
 section @sec "Sec" mode=modules layout=grid columns=1 {
  group @gr "GR" layout=grid columns=1 direction=down { show @m1 @m2 }
 }
}`;

it("refuses to move a group member past its group's top or left edge (item 2)", async () => {
  const { fixture, document } = await collection(grouped, 'grouped');
  try {
    const section = document.scene.sections.find((item) => item.id === 'sec');
    assert(section);
    const member = section.nodes.find((item) => item.measured.objectId === 'm1');
    const group = section.nodes.find((item) => item.id === member?.parent);
    assert(member && group);
    // Placement is relative to the member's own parent, so a negative x asks for a spot
    // before the group's left edge while y stays put (relative to the group, unchanged).
    const y = member.box.y - section.origin.y - group.box.y;
    const review = move(document, 'grouped', 'sec', member.id, -10, y);
    expect(review).toMatchObject({
      ok: false,
      error: { code: 'invalid-edit', message: "Can't move M1 outside its group" },
    });
  } finally {
    await fixture.close();
  }
});
