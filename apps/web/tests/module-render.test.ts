import { assert, expect, it } from 'vitest';
import { workspaceFixture, request as makeRequest } from './host-workspace-fixture.js';

// The module grid of routing-explained: every node hand-placed, plus an empty hand-placed group.
const source = `canvas 1
collection @placed "Placed" theme=paper {
 node @presentation module "presentation/contract/api.ts" {
 member @project "project" type="collection -> Projection"
 member @supplement "supplement" type="collection -> measurements"
 }
 node @layout module "arrangement/pipeline.ts" {
 member @arrange "arrange" type="request -> Scene"
 member @select "moduleEngine" type="section -> custom provider"
 }
 node @scene-in module "scene-in.ts" {
 member @input "toEngineScene" type="measured section -> EngineScene"
 }
 node @builder module "prototype-nested-scene.ts" {
 member @build "createNestedRoadScene" type="spec -> RoadPrototypeScene"
 }
 node @roads-module module "prototype-nested-roads.ts" {
 member @roads "nestedMainRoads" type="placement -> streets"
 member @drives "nestedDriveways" type="active ports -> driveways"
 }
 node @routing-module module "nested-wire-routing.ts" {
 member @route "routeNestedWires" type="requests -> wire plan"
 }
 node @law-module module "nested-wire-law.ts" {
 member @leg "lawLeg" type="terminals -> Leg or null"
 }
 node @lanes-module module "nested-wire-lanes.ts" {
 member @allocate "allocateNestedLanes" type="plan -> lanes and demand"
 }
 node @capacity-module module "nested-road-capacity.ts" {
 member @capacity "capacityRoads" type="demand -> road capacity"
 }
 node @projection-module module "nested-lane-projection.ts" {
 member @project "projectNestedWires" type="lanes -> wire geometry"
 }
 node @scene-out module "scene-out.ts" {
 member @output "toAppSection" type="EngineScene -> PlacedSection"
 }
 node @validation-module module "validation/sections.ts" {
 member @inspect "inspectSections" type="candidate -> checked sections"
 }
 wire @measured @presentation -> @layout "measured input" kind=reference
 wire @custom-binding @layout -> @scene-in "custom provider" kind=reference
 wire @build-roads @scene-in -> @builder "calls" kind=reference
 wire @make-streets @builder -> @roads-module "streets + driveways" kind=reference
 wire @plan-route @builder -> @routing-module "plan wires" kind=reference
 wire @leg-law @routing-module -> @law-module "choose each leg" kind=reference
 wire @allocate-lanes @builder -> @lanes-module "allocate lanes" kind=reference
 wire @reserve-capacity @builder -> @capacity-module "reserve capacity" kind=reference
 wire @project-lanes @builder -> @projection-module "project paths" kind=reference
 wire @convert-output @scene-in -> @scene-out "EngineScene via composition" kind=reference
 wire @check-output @layout -> @validation-module "final inspection" kind=reference
 section @modules "Modules" mode=modules columns=3 layout=grid gap=compact {
  group @g "G" layout=grid {
  }
  show @presentation @layout @scene-in @builder @roads-module @routing-module @law-module @lanes-module @capacity-module @projection-module @scene-out @validation-module
  connect @measured @custom-binding @build-roads @make-streets @plan-route @leg-law @allocate-lanes @reserve-capacity @project-lanes @convert-output @check-output
 }
}`;

const placed: Record<string, readonly [number, number, number, number]> = {
  presentation: [124.758, 120.061, 331.2, 214.286],
  layout: [577, 233, 331.2, 198.286],
  'scene-in': [1025.8, 261, 312, 142.286],
  builder: [134, 584, 314.658, 142.286],
  'roads-module': [586.6, 548, 312, 214.286],
  'routing-module': [1048.712, 584, 266.176, 142.286],
  'law-module': [130.529, 871, 321.6, 142.286],
  'lanes-module': [601, 871, 283.2, 142.286],
  'capacity-module': [1021, 871, 321.6, 142.286],
  'projection-module': [142.493, 1122, 297.672, 142.286],
  'scene-out': [596.2, 1122, 292.8, 142.286],
  'validation-module': [1030.6, 1122, 302.4, 142.286],
};
const box = ([x, y, width, height]: readonly [number, number, number, number]) => ({
  x,
  y,
  width,
  height,
  locked: false,
});

async function render() {
  const fixture = await workspaceFixture();
  const signal = new AbortController().signal;
  const initial = await fixture.session.read();
  assert(initial.ok);
  const created = await fixture.session.apply(
    makeRequest(initial.value, 'placed-create', 'placed', 'dsl', { source, mode: 'create' }, true),
    signal,
  );
  assert(created.ok, JSON.stringify(created));
  const first = await fixture.session.render('placed', signal);
  assert(first.ok, JSON.stringify(first));
  const section = first.value.collection.sections.find((item) => item.id === 'modules');
  assert(section);
  const value = {
    ...section,
    placement: { x: 0, y: 0, locked: false },
    appearances: section.appearances.map((item) => ({
      ...item,
      placement: box(placed[item.object] ?? [0, 0, 0, 0]),
    })),
    groups: section.groups.map((group) => ({
      ...group,
      placement: box([1421, 195, 541.335, 464]),
    })),
  };
  const snapshot = await fixture.session.read();
  assert(snapshot.ok);
  const payload = { collection: 'placed', changes: [{ op: 'replace', target: 'sections', value }] };
  const moved = await fixture.session.apply(
    makeRequest(snapshot.value, 'placed-pin', 'placed', 'model', payload),
    signal,
  );
  assert(moved.ok, JSON.stringify(moved));
  const document = await fixture.session.render('placed', signal);
  assert(document.ok, JSON.stringify(document));
  await fixture.close();
  const modules = document.value.scene.sections.find((item) => item.id === 'modules');
  assert(modules);
  return modules;
}

it('renders a fully hand-placed module grid exactly where it was placed, with no drag', async () => {
  const modules = await render();
  const round = (value: number) => Math.round(value * 100) / 100;
  const boxes = Object.fromEntries(
    modules.nodes.map((node) => [
      node.measured.objectId ?? node.measured.groupId,
      [node.box.x, node.box.y, node.box.width, node.box.height].map(round),
    ]),
  );
  // Geometry main renders for this input; a plain render must not clamp, nudge or regrow anything.
  expect({ section: [modules.box.width, modules.box.height].map(round), boxes }).toEqual({
    section: [2050.34, 1416.29],
    boxes: {
      g: [1421, 195, 541.34, 464],
      presentation: [124.76, 120.06, 331.2, 214.29],
      layout: [577, 233, 331.2, 198.29],
      'scene-in': [1025.8, 261, 312, 142.29],
      builder: [134, 584, 314.66, 142.29],
      'roads-module': [586.6, 548, 312, 214.29],
      'routing-module': [1048.71, 584, 266.18, 142.29],
      'law-module': [130.53, 871, 321.6, 142.29],
      'lanes-module': [601, 871, 283.2, 142.29],
      'capacity-module': [1021, 871, 321.6, 142.29],
      'projection-module': [142.49, 1122, 297.67, 142.29],
      'scene-out': [596.2, 1122, 292.8, 142.29],
      'validation-module': [1030.6, 1122, 302.4, 166.29],
    },
  });
}, 60_000);

const row = `canvas 1
collection @row "Row" theme=paper {
 node @a module "A" {}
 node @b module "B" {}
 node @c module "C" {}
 wire @ab @a -> @b "x" kind=imports
 wire @bc @b -> @c "y" kind=imports
 section @s "S" mode=modules {
  show @a @b @c
  connect @ab @bc
 }
}`;

async function pinnedRow(nudge: number) {
  const fixture = await workspaceFixture();
  const signal = new AbortController().signal;
  const initial = await fixture.session.read();
  assert(initial.ok);
  const created = await fixture.session.apply(
    makeRequest(initial.value, 'row-create', 'row', 'dsl', { source: row, mode: 'create' }, true),
    signal,
  );
  assert(created.ok, JSON.stringify(created));
  const first = await fixture.session.render('row', signal);
  assert(first.ok, JSON.stringify(first));
  const section = first.value.collection.sections.find((item) => item.id === 's');
  const scene = first.value.scene.sections.find((item) => item.id === 's');
  assert(section && scene);
  const at = (object: string) => scene.nodes.find((node) => node.measured.objectId === object);
  const value = {
    ...section,
    appearances: section.appearances.map((item) => {
      const node = at(item.object);
      assert(node, item.object);
      const dx = item.object === 'b' ? nudge : 0;
      return {
        ...item,
        placement: box([node.box.x + dx, node.box.y, node.box.width, node.box.height]),
      };
    }),
  };
  const snapshot = await fixture.session.read();
  assert(snapshot.ok);
  const payload = { collection: 'row', changes: [{ op: 'replace', target: 'sections', value }] };
  const moved = await fixture.session.apply(
    makeRequest(snapshot.value, 'row-pin', 'row', 'model', payload),
    signal,
  );
  assert(moved.ok, JSON.stringify(moved));
  const document = await fixture.session.render('row', signal);
  assert(document.ok, JSON.stringify(document));
  await fixture.close();
  const placedRow = document.value.scene.sections.find((item) => item.id === 's');
  assert(placedRow);
  return placedRow;
}

it('keeps a street between neighbouring hand-placed modules after one is moved', async () => {
  const s = await pinnedRow(20);
  const boxes = ['a', 'b', 'c'].map((object) => {
    const node = s.nodes.find((item) => item.measured.objectId === object);
    assert(node, object);
    return node.box;
  });
  const streets = (s.routing?.roads ?? []).filter(
    (road) => road.kind === 'street' && road.axis === 'vertical',
  );
  // Wires between neighbours use a street in the gap, not a driveway through the next box.
  for (const [left, right] of [
    [boxes[0], boxes[1]],
    [boxes[1], boxes[2]],
  ] as const) {
    assert(left && right);
    const between = streets.some(
      (road) => road.bounds.x >= left.x + left.width && road.bounds.x < right.x,
    );
    expect(between, `${left.x}..${right.x}`).toBe(true);
  }
}, 60_000);
