/** Headless pointer acceptance body; verify-drag-swap.py owns failures and artifact writes. */
const directory = 'output/playwright/nested-wires/m5-swap/';
const messages = [];
function assert(value, message) {
  if (!value) throw new Error(`FAIL ${message}`);
}
function equal(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), label);
}
const pass = (message) => messages.push(`PASS ${message}`);
async function scene(page) {
  return page.evaluate(() => window.__roadScene);
}
async function count(page) {
  return page.evaluate(() => window.__layoutRecalcCount);
}
async function selection(page) {
  return page.locator('[data-node-id], [data-wire-id]').evaluateAll((elements) => elements.map((element) => ({
    id: element.getAttribute('data-node-id') ?? element.getAttribute('data-wire-id'),
    classes: [...element.classList].filter((name) => /^_(primary|secondary|dim)_/.test(name)),
    opacity: getComputedStyle(element).opacity,
  })).sort((a,b) => a.id.localeCompare(b.id)));
}
async function center(page, id) {
  const box = await page.locator(`[data-node-id="${id}"]`).boundingBox();
  assert(box, `visible ${id}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function targetPoint(page, target) {
  return typeof target === 'string' ? center(page, target) : target;
}
async function drag(page, source, target, changes) {
  const from = await center(page, source);
  const to = await targetPoint(page, target);
  const before = await count(page);
  const marks = await page.evaluate(() => performance.getEntriesByName('roads:drop-to-ready').length);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
  if (changes) await page.waitForFunction((n) => performance.getEntriesByName('roads:drop-to-ready').length > n, marks);
  await page.waitForTimeout(100);
  equal(await count(page) - before, changes ? 1 : 0, 'exact recomputation delta');
  return page.evaluate(() => performance.getEntriesByName('roads:drop-to-ready').at(-1)?.duration);
}
async function rendered(page, subject) {
  const actual = await page.locator('.react-flow__node').evaluateAll((elements) => Object.fromEntries(elements.map((e) => [e.dataset.id, { x: new DOMMatrix(e.style.transform).e, y: new DOMMatrix(e.style.transform).f, width: parseFloat(e.style.width), height: parseFloat(e.style.height) }])));
  subject.nodes.forEach((node) => equal(actual[node.id], node.bounds, `${node.id} actual rendered bounds`));
  const wires = await page.locator('[data-wire-hit]').evaluateAll((elements) => Object.fromEntries(elements.map((e) => [e.dataset.wireHit, e.getAttribute('points')])));
  subject.wiring.value.forEach((w) => equal(wires[w.id], [w.segments[0].from, ...w.segments.map((s) => s.to)].map((p) => `${p.x},${p.y}`).join(' '), `${w.id} rendered path`));
}
export async function verify(page, layoutUrl) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await page.goto('http://127.0.0.1:5188/roads-prototype.html?nested');
  await page.waitForFunction(() => performance.getEntriesByName('roads:navigation-to-ready').length > 0);
  await page.waitForTimeout(250);
  const before = await scene(page);
  equal(await count(page), 1, 'initial recomputation count');
  await rendered(page, before);
  const originalSelection = await selection(page);
  const roads = page.getByRole('checkbox', { name: 'Show roads' });
  await roads.uncheck();
  await page.screenshot({ path: `${directory}before-roads-off.png` });
  const firstTiming = await drag(page, 'node-4', 'node-1', true);
  const after = await scene(page);
  const bounds = (s, id) => s.nodes.find((n) => n.id === id).bounds;
  equal(bounds(after, 'node-4'), bounds(before, 'node-1'), 'node-4 at former node-1 bounds');
  equal(bounds(after, 'node-1'), bounds(before, 'node-4'), 'node-1 at former node-4 bounds');
  const unchanged = before.nodes.filter((n) => !['node-1','node-4'].includes(n.id));
  equal(unchanged.length, 22, 'other 22 nodes');
  unchanged.forEach((n) => equal(bounds(after, n.id), n.bounds, `${n.id} unchanged`));
  await rendered(page, after);
  pass('2a exactly node-4/node-1 exchange bounds; other 22 and actual rendered bounds verified');
  const expected = await page.evaluate(async (url) => {
    const { createNestedRoadScene, fanInHubSceneSpec } = await import(url);
    const first = fanInHubSceneSpec.sections[0];
    const nodes = [...first.nodes];
    [nodes[0], nodes[3]] = [nodes[3], nodes[0]];
    return createNestedRoadScene({ spec: { ...fanInHubSceneSpec, sections: [{...first, nodes}, ...fanInHubSceneSpec.sections.slice(1)] } });
  }, layoutUrl);
  equal(after, expected, 'byte-identical independent from-scratch scene');
  assert(after.wiring.ok && after.wiring.value.length === 26, '26 wires route');
  equal(await selection(page), originalSelection, 'drag does not select');
  pass('2b–d byte-identical independent swapped-spec build; all 26 routes and rendered paths; exactly +1 layout; selection unchanged');
  await page.screenshot({ path: `${directory}after-swap-roads-off.png` });
  await roads.check();
  await page.screenshot({ path: `${directory}after-swap-roads-on.png` });
  const pane = await page.locator('.react-flow__pane').boundingBox();
  await drag(page, 'node-4', { x: pane.x + 12, y: pane.y + 12 }, false);
  equal(await scene(page), after, 'empty-space no-op scene');
  await rendered(page, after);
  equal(await selection(page), originalSelection, 'no-op drag selection');
  pass('2e empty canvas drop snaps back exactly; byte-identical scene; +0 layouts; selection unchanged');
  // Different section is also a no-op.
  await drag(page, 'node-4', 'node-7', false);
  equal(await scene(page), after, 'cross-section no-op');
  await rendered(page, after);
  const clickCount = await count(page);
  await page.locator('[data-node-id="node-7"] strong').click();
  const selected = await selection(page);
  const idsWith = (role) => selected.filter((x) => x.classes.some((c) => c.startsWith(`_${role}_`))).map((x) => x.id).sort();
  equal(idsWith('primary'), ['node-7'], 'node-7 selected');
  equal(idsWith('secondary'), ['w12','w13','w21','node-12','node-5','node-23'].sort(), 'M2 neighborhood');
  equal(await count(page), clickCount, 'click +0 layouts');
  // Return onto node-1 CURRENT bounds (node-4's original cell); the brief's "old cell" phrase is contradictory.
  const secondTiming = await drag(page, 'node-4', 'node-1', true);
  equal(await selection(page), selected, 'selection retained exactly through swap');
  equal(await scene(page), before, 'byte-identical complete round trip');
  await rendered(page, before);
  pass('2f click node-7: exact neighborhood/+0 layouts; return swap: unchanged selection and byte-identical original scene');
  const timings = [firstTiming, secondTiming];
  for (let i = 0; i < 3; i += 1) timings.push(await drag(page, 'node-4', 'node-1', true));
  const median = [...timings].sort((a,b) => a-b)[2];
  assert(median <= 100, `drop-to-ready median ${median} >100 ms`);
  pass(`5 drop-to-ready milliseconds=${JSON.stringify(timings)}; median=${median} <=100`);
  pass('extra cross-section no-op/+0 layouts; headless mouse events only');
  return { messages, timings, median, before, after };
}
