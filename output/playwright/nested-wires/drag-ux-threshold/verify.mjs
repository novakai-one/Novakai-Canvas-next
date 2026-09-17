/** Headless observation only. run.py owns I/O failures and fresh-page retry recovery.
 * @returns {Promise<{status: string, probes: object[]}>} Structured PASS/DIVERGENCE/STOP evidence.
 */
const directory = 'output/playwright/nested-wires/drag-ux-threshold/';
const nodeSelector = (id) => `[data-node-id="${id}"]`;
const center = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
const identical = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const assertion = (name, actual, expected) => ({ name, pass: identical(actual, expected), actual, expected });
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
async function state(page) {
  return page.evaluate(async () => {
    const serialized = new TextEncoder().encode(JSON.stringify(window.__roadScene));
    const hash = await crypto.subtle.digest('SHA-256', serialized);
    const sceneDigest = { bytes: serialized.length, sha256: Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('') };
    const boxes = [...document.querySelectorAll('.react-flow__node')].map((e) => ({
      id: e.dataset.id, transform: e.style.transform, width: e.style.width, height: e.style.height,
    }));
    const selection = [...document.querySelectorAll('[data-node-id], [data-wire-id]')].map((e) => ({
      id: e.getAttribute('data-node-id') ?? e.getAttribute('data-wire-id'),
      classes: [...e.classList].filter((c) => /^_(primary|secondary|dim)_/.test(c)),
      opacity: getComputedStyle(e).opacity,
    })).sort((a, b) => a.id.localeCompare(b.id));
    return { screenBounds: document.querySelector('[data-node-id="node-4"]').getBoundingClientRect().toJSON(), sceneDigest, scene: { nodes: window.__roadScene.nodes.map(({ id, sectionId, bounds }) => ({ id, sectionId, bounds })) }, count: window.__layoutRecalcCount, boxes, selection,
      camera: document.querySelector('.react-flow__viewport').style.transform,
      measures: performance.getEntriesByName('roads:drop-to-ready').map((e) => e.duration) };
  });
}
async function reset(page) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await page.goto('http://127.0.0.1:5188/roads-prototype.html?nested');
  await page.waitForFunction(() => performance.getEntriesByName('roads:navigation-to-ready').length > 0);
  await page.waitForTimeout(300);
  await page.getByRole('checkbox', { name: 'Show roads' }).uncheck();
}
async function traceStart(page) {
  await page.evaluate(() => {
    window.__dragUxTraceAbort?.abort();
    window.__dragUxTraceAbort = new AbortController();
    window.__dragUxTrace = [];
    const record = (e) => window.__dragUxTrace.push({ type: e.type, time: performance.now(),
      x: e.clientX, y: e.clientY, buttons: e.buttons, trusted: e.isTrusted,
      target: e.target.closest('.react-flow__node')?.getAttribute('data-id') ?? e.target.tagName });
    ['pointerdown', 'mousedown', 'pointermove', 'mousemove', 'pointerup', 'mouseup', 'click'].forEach(
      (type) => window.addEventListener(type, record, { capture: true, signal: window.__dragUxTraceAbort.signal }));
  });
}
async function sample(page, pointer) {
  return page.evaluate((point) => {
    const e = document.querySelector('[data-node-id="node-4"]');
    const box = e.getBoundingClientRect().toJSON();
    const renderedCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    return { time: performance.now(), pointer: point, box, renderedCenter,
      deviation: Math.hypot(renderedCenter.x - point.x, renderedCenter.y - point.y),
      dragging: e.closest('.react-flow__node').classList.contains('dragging'),
      recalc: window.__layoutRecalcCount };
  }, pointer);
}
async function screenshot(page, name) {
  await page.screenshot({ path: `${directory}${name}.png` });
}
async function feedback(page) {
  return page.locator(nodeSelector('node-1')).evaluate((e) => {
    const visual = (item) => {
      const s = getComputedStyle(item);
      return { tag: item.tagName, classes: item.getAttribute('class'), background: s.backgroundColor,
        border: s.border, outline: s.outline, shadow: s.boxShadow, opacity: s.opacity, filter: s.filter };
    };
    return [e.closest('.react-flow__node'), e, ...e.querySelectorAll('*')].map(visual);
  });
}
async function moveStep(page, from, to, index, options) {
  const ratio = index / options.steps;
  const pointer = { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio };
  await page.mouse.move(pointer.x, pointer.y);
  // CDP mouse moves are browser frame-paced; evaluate observes React's committed DOM.
  const result = await sample(page, pointer);
  if (options.frames) await screenshot(page, `frames/${options.name}-${String(index).padStart(2, '0')}`);
  return result;
}
async function capture(page, options, suffix) {
  if (options.capture) await screenshot(page, `${options.name}-${suffix}`);
}
async function drag(page, to, options) {
  const from = center(await page.locator(nodeSelector('node-4')).boundingBox());
  const before = await state(page);
  const targetBefore = await feedback(page);
  await capture(page, options, 'before');
  await traceStart(page);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  const samples = [];
  for (let i = 1; i <= options.steps; i += 1) samples.push(await moveStep(page, from, to, i, options));
  const targetDuring = await feedback(page);
  const hover = await state(page);
  await capture(page, options, 'hover');
  await page.mouse.up();
  await page.waitForTimeout(250);
  const after = await state(page);
  await capture(page, options, 'after');
  const trace = await page.evaluate(() => window.__dragUxTrace);
  return { name: options.name, from, to, before, samples, hover, after, trace, targetBefore, targetDuring,
    maxDeviation: Math.max(...samples.map((s) => s.deviation)),
    intervalMedian: median(samples.slice(1).map((s, i) => s.time - samples[i].time)),
    moved: samples.some((s) => Math.hypot(s.renderedCenter.x - from.x, s.renderedCenter.y - from.y) > 3) };
}
const bounds = (s, id) => s.scene.nodes.find((n) => n.id === id).bounds;
function noOpAssertions(p) {
  return [assertion('complete serialized scene SHA-256 + byte length unchanged', p.after.sceneDigest, p.before.sceneDigest),
    assertion('rendered transforms/dimensions byte-exact', p.after.boxes, p.before.boxes),
    assertion('recalc delta', p.after.count - p.before.count, 0),
    assertion('selection unchanged', p.after.selection, p.before.selection)];
}
function swapAssertions(p) {
  return [assertion('node-4 exchanged bounds', bounds(p.after, 'node-4'), bounds(p.before, 'node-1')),
    assertion('node-1 exchanged bounds', bounds(p.after, 'node-1'), bounds(p.before, 'node-4')),
    assertion('recalc delta', p.after.count - p.before.count, 1),
    assertion('selection unchanged', p.after.selection, p.before.selection)];
}
async function target(page, name) {
  const first = center(await page.locator(nodeSelector('node-1')).boundingBox());
  const fourth = center(await page.locator(nodeSelector('node-4')).boundingBox());
  const pane = await page.locator('.react-flow__pane').boundingBox();
  const section = await page.locator('.react-flow__node[data-id="section-1"]').boundingBox();
  const points = {
    invalid: { x: first.x, y: (first.y + fourth.y) / 2 },
    valid: first,
    'past-edge': { x: fourth.x, y: pane.y - 20 },
    'cross-section': center(await page.locator(nodeSelector('node-7')).boundingBox()),
    'section-frame': { x: section.x + section.width / 2, y: section.y + 1 },
    'drag-not-click': { x: fourth.x + 18, y: fourth.y },
  };
  return points[name];
}
async function runProbe(page, spec) {
  await reset(page);
  if (spec.preselect) await page.locator('[data-node-id="node-7"] strong').click();
  const p = await drag(page, await target(page, spec.name), spec);
  const checks = spec.swap ? swapAssertions(p) : noOpAssertions(p);
  checks.push(assertion('real React Flow drag moved', p.moved, true));
  checks.push(assertion('no recomputation during movement', p.hover.count, p.before.count));
  return { ...p, checks };
}
async function clickProbe(page, movement) {
  await reset(page);
  const before = await state(page);
  const point = center(await page.locator(nodeSelector('node-7')).boundingBox());
  await traceStart(page);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + movement, point.y + movement);
  await page.mouse.up();
  await page.waitForTimeout(100);
  const after = await state(page);
  const primary = after.selection.filter((s) => s.classes.some((c) => c.startsWith('_primary_'))).map((s) => s.id);
  const secondary = after.selection.filter((s) => s.classes.some((c) => c.startsWith('_secondary_'))).map((s) => s.id).sort();
  await screenshot(page, `click-${movement}-selection`);
  return { name: `click-${movement}`, movement, before, after, trace: await page.evaluate(() => window.__dragUxTrace),
    checks: [assertion('M2 primary', primary, ['node-7']),
      assertion('M2 exact neighborhood', secondary, ['node-12', 'node-23', 'node-5', 'w12', 'w13', 'w21']),
      assertion('click recalc delta', after.count - before.count, 0)] };
}
const outcome = (checks) => checks.every((c) => c.pass) ? 'PASS' : 'DIVERGENCE';
/** Fresh document for every probe; no production handlers, state, or geometry are patched. */
export async function verify(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const tracking = await runProbe(page, { name: 'invalid', steps: 12, frames: false });
  if (!tracking.moved) return { status: 'STOP', probes: [tracking], errors };
  tracking.checks.push(assertion('screen bounds byte-exact', tracking.after.screenBounds, tracking.before.screenBounds));
  tracking.checks.push(assertion('cursor within 3 CSS px at every step', tracking.maxDeviation <= 3, true));
  const specs = [
    { name: 'valid', steps: 12, frames: true, capture: true, swap: true },
    { name: 'invalid', steps: 12, frames: true, capture: true },
    { name: 'past-edge', steps: 30, frames: false, capture: true },
    { name: 'cross-section', steps: 20, frames: false, capture: true },
    { name: 'section-frame', steps: 20, frames: false, capture: true },
    { name: 'drag-not-click', steps: 12, frames: false, capture: true, preselect: true },
  ];
  const probes = [tracking];
  for (const spec of specs) probes.push(await runProbe(page, spec));
  probes.push(await clickProbe(page, 1));
  probes.push(await clickProbe(page, 0));
  const checks = [assertion('no uncaught browser errors', errors, [])];
  const all = [...checks, ...probes.flatMap((p) => p.checks)];
  return { status: outcome(all), probes, checks, errors };
}
/** Run separately, without screenshots or other verification processes. */
export async function timing(page) {
  await reset(page);
  const probes = [];
  for (let i = 0; i < 5; i += 1) probes.push(await drag(page, await target(page, 'valid'), { name: `timing-${i + 1}`, steps: 12, frames: false }));
  const durations = probes.map((p) => p.after.measures.at(-1));
  const checks = probes.flatMap(swapAssertions);
  checks.push(assertion('five new drop-to-ready measures', probes.at(-1).after.measures.length, 5));
  checks.push(assertion('median <= 100 ms', median(durations) <= 100, true));
  return { status: outcome(checks), durations, median: median(durations), checks, probes };
}
