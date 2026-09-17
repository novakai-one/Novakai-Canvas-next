/** Browser acceptance body, invoked by verify-selection.py through installed Playwright CLI.
 * Assertion/browser failures reach that runner; rerun safely replaces this milestone's evidence.
 */
const directory = 'output/playwright/nested-wires/m4-selection-';
const messages = [];
function assert(value, message) {
  if (!value) throw new Error(`FAIL ${message}`);
}
function pass(message) {
  messages.push(`PASS ${message}`);
}
async function load(page) {
  await page.goto('http://127.0.0.1:5188/roads-prototype.html?nested');
  await page.waitForFunction(
    () => performance.getEntriesByName('roads:navigation-to-ready').length > 0,
  );
  return page.evaluate(() => performance.getEntriesByName('roads:navigation-to-ready')[0].duration);
}
async function timing(page) {
  const loads = [];
  for (let i = 0; i < 5; i += 1) loads.push(await load(page));
  return { loads, median: loads.toSorted((a, b) => a - b)[2] };
}
async function geometry(page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll(
        '.react-flow__viewport, .react-flow__node, [data-road-id], [data-port-id], [data-wire-id] polyline',
      ),
    ].map((element) => ({
      id: element.getAttribute('data-id'),
      style: element.getAttribute('style'),
      points: element.getAttribute('points'),
      bounds: element.getBoundingClientRect().toJSON(),
    })),
  );
}
async function count(page) {
  return page.evaluate(() => window.__layoutRecalcCount);
}
async function labels(page, expected) {
  const visible = page.locator('[data-wire-label]:visible');
  const actual = await visible.allTextContents();
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `labels ${JSON.stringify(actual)} expected ${JSON.stringify(expected)}`,
  );
}
async function state(page, primary, secondary, labelIds = []) {
  const actual = await page.locator('[data-node-id], [data-wire-id]').evaluateAll((elements) =>
    elements.map((element) => ({
      id: element.getAttribute('data-node-id') ?? element.getAttribute('data-wire-id'),
      classes: [...element.classList].flatMap(
        (name) => name.match(/^_(primary|secondary|dim)_/)?.[1] ?? [],
      ),
      opacity: Number(getComputedStyle(element).opacity),
    })),
  );
  assert(actual.filter((item) => item.id.startsWith('node-')).length === 24, '24 nodes');
  assert(actual.filter((item) => item.id.startsWith('w')).length === 26, '26 wires');
  actual.forEach((item) => checkObject(item, primary, secondary));
  await labels(page, labelIds);
  await decorations(page, primary !== '');
}
function expectedClass(id, primary, secondary) {
  if (primary === '') return [];
  if (id === primary) return ['primary'];
  return [expectedSecondary(id, secondary)];
}
function expectedSecondary(id, secondary) {
  return secondary.includes(id) ? 'secondary' : 'dim';
}
function checkObject(item, primary, secondary) {
  const expected = expectedClass(item.id, primary, secondary);
  assert(
    JSON.stringify(item.classes) === JSON.stringify(expected),
    `${item.id}: classes ${item.classes} expected ${expected}`,
  );
  const opacity = { primary: 1, secondary: 0.7, dim: 0.28 }[expected[0]] ?? 1;
  assert(item.opacity === opacity, `${item.id}: opacity ${item.opacity} expected ${opacity}`);
}
async function decorations(page, active) {
  const result = await page.evaluate(() => {
    const roles = [...document.querySelectorAll('[class]')].flatMap((element) =>
      [...element.classList].filter((name) => /^_(primary|secondary|dim)_/.test(name)),
    );
    const roads = [...document.querySelectorAll('[data-road-id]')].map((element) =>
      Number(getComputedStyle(element.closest('.react-flow__node')).opacity),
    );
    const ports = [...document.querySelectorAll('[data-port-id]')].map((element) =>
      Math.min(
        Number(getComputedStyle(element).opacity),
        Number(getComputedStyle(element.closest('.react-flow__node')).opacity),
      ),
    );
    return { roles, roads, ports };
  });
  if (!active) {
    assert(result.roles.length === 0, 'zero primary/secondary/dim classes anywhere after clear');
    return;
  }
  assert(
    result.roles.filter((name) => /^_primary_/.test(name)).length === 1,
    'one primary anywhere',
  );
  assert(
    result.roads.every((opacity) => opacity === 0.55),
    'all roads faded but readable (0.55)',
  );
  assert(
    result.ports.every((opacity) => opacity === 0.28),
    'all ports dimmed',
  );
}
async function clickNode(page, id) {
  await page.locator(`[data-node-id="${id}"] strong`).click();
}
async function clickWire(page, id) {
  const point = await page.locator(`[data-wire-hit="${id}"]`).evaluate((element) => {
    const points = Array.from({ length: 101 }, (_, index) =>
      element.getPointAtLength((element.getTotalLength() * index) / 100),
    );
    const screen = points.map((point) =>
      new DOMPoint(point.x, point.y).matrixTransform(element.getScreenCTM()),
    );
    const hit = screen.find((point) => document.elementFromPoint(point.x, point.y) === element);
    return hit?.toJSON();
  });
  assert(point, `wire ${id} has a real pointer hit target`);
  await page.mouse.click(point.x, point.y);
}
async function clear(page) {
  await page.locator('.react-flow__pane').click({ position: { x: 12, y: 12 } });
}
async function unchanged(page, before, baseline, item) {
  const after = await count(page);
  assert(after === before, `${item}: layout counter ${before} -> ${after}`);
  assert(
    JSON.stringify(await geometry(page)) === JSON.stringify(baseline),
    `${item}: geometry/camera changed`,
  );
  pass(
    `3/${item} layout counter before=${before} after=${after} delta=${after - before}; all node/road/port bounds, wire paths and camera unchanged`,
  );
}
async function midpoint(page) {
  const result = await page.locator('[data-wire-id="w06"]').evaluate((group) => {
    const path = group.querySelector('[data-wire-hit]');
    const label = group.querySelector('text');
    const middle = path.getPointAtLength(path.getTotalLength() / 2);
    return {
      x: Number(label.getAttribute('x')),
      y: Number(label.getAttribute('y')),
      middle: { x: middle.x, y: middle.y },
      lift: new DOMMatrix(getComputedStyle(label).transform).f,
      bounds: label.getBoundingClientRect().toJSON(),
    };
  });
  assert(Math.abs(result.x - result.middle.x) < 0.01, 'label at path midpoint x');
  assert(Math.abs(result.y - result.middle.y) < 0.01, 'label at path midpoint y');
  assert(result.lift < 0, 'label above wire');
  return result;
}
/** Exercises every DoD interaction using pointer events, then compares frozen geometry each time. */
export async function verify(page) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  const performance = await timing(page);
  await page.waitForTimeout(200);
  const before = await count(page);
  assert(before === 1, `instrumented pipeline executes once (actual ${before})`);
  const baseline = await geometry(page);
  await state(page, '', []);
  pass('2a load: 0 visible labels; all 24 nodes / 26 wires unselected');
  await page.screenshot({ path: `${directory}default.png` });
  await clickNode(page, 'node-7');
  await state(page, 'node-7', ['w12', 'w13', 'w21', 'node-12', 'node-5', 'node-23']);
  pass(
    '2b node-7 primary; only w12 + w13 + w21 + node-12 + node-5 + node-23 secondary; every other node/wire dim; 0 labels (50/50 class assertions)',
  );
  await unchanged(page, before, baseline, 'b');
  await page.screenshot({ path: `${directory}node-selected.png` });
  await clickWire(page, 'w06');
  await state(page, 'w06', ['node-8', 'node-10'], ['w06']);
  const label = await midpoint(page);
  pass(
    '2c w06 primary; only node-8 + node-10 secondary; every other node/wire dim; 1 label = w06, above arc midpoint (50/50 class assertions)',
  );
  await unchanged(page, before, baseline, 'c');
  await page.screenshot({ path: `${directory}wire-selected.png` });
  await clear(page);
  await state(page, '', []);
  pass('2d empty canvas: 0 labels; 0 primary/secondary/dim classes anywhere');
  await unchanged(page, before, baseline, 'd');
  await page.screenshot({ path: `${directory}cleared.png` });
  await clickNode(page, 'node-1');
  await state(page, 'node-1', ['w01', 'w02', 'w15', 'node-2', 'node-3', 'node-4']);
  await clickNode(page, 'node-22');
  await state(page, 'node-22', []);
  pass(
    '2e node-1 -> node-22: only node-22 primary, 0 secondary, previous neighbourhood dim, 0 labels (50/50 class assertions)',
  );
  await unchanged(page, before, baseline, 'e');
  await clickNode(page, 'node-5');
  await state(page, 'node-5', ['w04', 'w09', 'w13', 'node-6', 'node-4', 'node-7']);
  await clickNode(page, 'node-5');
  await state(page, '', []);
  pass('2f node-5 twice: 0 labels; 0 primary/secondary/dim classes anywhere');
  await unchanged(page, before, baseline, 'f');
  await clickNode(page, 'node-5');
  await state(page, 'node-5', ['w04', 'w09', 'w13', 'node-6', 'node-4', 'node-7']);
  await clickWire(page, 'w04');
  await state(page, 'w04', ['node-5', 'node-6'], ['w04']);
  pass(
    '2g secondary w04 -> primary; only node-5 + node-6 secondary; 1 label = w04 (50/50 class assertions)',
  );
  await unchanged(page, before, baseline, 'g');
  await clickWire(page, 'w04');
  await state(page, '', []);
  await clickNode(page, 'node-5');
  await clickNode(page, 'node-6');
  await state(page, 'node-6', ['node-5', 'node-9', 'w04', 'w05']);
  pass(
    'extra: primary wire toggles off; secondary node becomes primary with fresh one-hop neighbourhood',
  );
  await unchanged(page, before, baseline, 'extra');
  await clear(page);
  await clickNode(page, 'node-23');
  await state(page, 'node-23', [
    'w19',
    'w20',
    'w21',
    'w22',
    'w23',
    'w24',
    'node-2',
    'node-4',
    'node-7',
    'node-10',
    'node-13',
    'node-19',
  ]);
  pass('hub node-23: exactly w19–w24 and their six sources secondary; no labels');
  await unchanged(page, before, baseline, 'hub');
  await clickNode(page, 'node-24');
  await state(page, 'node-24', ['w25', 'w26', 'node-8', 'node-20']);
  pass('api node-24: exactly w25/w26 and node-8/node-20 secondary; no labels');
  await unchanged(page, before, baseline, 'api');
  await clear(page);
  return {
    messages,
    performance,
    counterBefore: before,
    counterAfter: await count(page),
    midpoint: label,
  };
}
