/** Headless paint audit; the Python wrapper injects independent M6 mouth memberships. */
const captureDirectory = 'output/playwright/nested-wires/presentation/styling/';
function ensure(condition, message) {
  if (!condition) throw new Error(message);
}
async function paintRecords(page) {
  return page.locator('[data-wire-id]').evaluateAll((groups) => groups.map((group) => {
    const path = group.querySelector('polyline:nth-of-type(2)');
    const style = getComputedStyle(path);
    return {
      id: group.getAttribute('data-wire-id'),
      converging: group.getAttribute('data-converging') === 'true',
      groupOpacity: getComputedStyle(group).opacity,
      opacity: style.opacity,
      width: style.strokeWidth,
      stroke: style.stroke,
      points: path.getAttribute('points'),
    };
  }));
}
function checkPaint(record, expected) {
  ensure(record.converging === expected.includes(record.id), `${record.id}: wrong mouth membership`);
  ensure(record.width === (record.converging ? '1.25px' : '1.75px'), `${record.id}: wrong default width`);
  ensure(record.opacity === (record.converging ? '0.72' : '1'), `${record.id}: wrong default opacity`);
  ensure(record.groupOpacity === '1', `${record.id}: selection group opacity changed`);
}
async function pointerSelect(page, id) {
  const point = await page.locator(`[data-wire-hit="${id}"]`).evaluate((path) => {
    const points = Array.from({ length: 401 }, (_, i) => path.getPointAtLength(path.getTotalLength() * i / 400));
    const screen = points.map((point) => new DOMPoint(point.x, point.y).matrixTransform(path.getScreenCTM()));
    return screen.find((p) => document.elementFromPoint(p.x, p.y) === path)?.toJSON();
  });
  ensure(point, `${id}: no real pointer target`);
  await page.mouse.click(point.x, point.y);
}
async function screenshotPair(page, scene) {
  await page.getByRole('button', { name: 'Fit View', exact: true }).click();
  await page.waitForTimeout(350);
  const roads = page.getByRole('checkbox', { name: 'Show roads', exact: true });
  await roads.check();
  await page.screenshot({ path: `${captureDirectory}${scene}-roads-on.png` });
  await roads.uncheck();
  await page.screenshot({ path: `${captureDirectory}${scene}-roads-off.png` });
}
async function selectedCapture(page) {
  await page.getByRole('combobox', { name: 'Wire focus' }).selectOption('w22');
  await page.waitForTimeout(350);
  const before = await page.locator('[data-wire-hit]').evaluateAll((paths) => paths.map((p) => p.getAttribute('points')));
  const camera = await page.locator('.react-flow__viewport').getAttribute('style');
  await pointerSelect(page, 'w22');
  ensure(await page.locator('[data-wire-label]:visible').textContent() === 'w22', 'Primary label missing');
  const records = await paintRecords(page);
  const selected = records.find((r) => r.id === 'w22');
  ensure(selected.converging, 'Selection witness must be a converging wire');
  ensure(selected.width === '5px' && selected.opacity === '1' && selected.groupOpacity === '1', 'Primary not fully restored');
  ensure(records.filter((r) => r.id !== 'w22').every((r) => r.groupOpacity === '0.28'), 'Other wires not dim');
  const after = await page.locator('[data-wire-hit]').evaluateAll((paths) => paths.map((p) => p.getAttribute('points')));
  ensure(JSON.stringify(before) === JSON.stringify(after), 'Selected paths moved');
  ensure(camera === await page.locator('.react-flow__viewport').getAttribute('style'), 'Selection camera moved');
  ensure(await page.evaluate(() => window.__layoutRecalcCount) === 1, 'Selection reran layout');
  await page.screenshot({ path: `${captureDirectory}selection-wire.png` });
  return selected;
}
export async function capture(page, expected) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const reports = [];
  for (const scene of ['templates', 'nested']) {
    await page.goto(`http://127.0.0.1:5191/roads-prototype.html?${scene}`);
    await page.waitForFunction(() => performance.getEntriesByName('roads:navigation-to-ready').length > 0);
    const records = await paintRecords(page);
    records.forEach((record) => checkPaint(record, expected[scene]));
    ensure(await page.locator('[data-wire-label]').count() === 0, 'Default label visible');
    ensure(await page.evaluate(() => window.__layoutRecalcCount) === 1, 'Repeated layout');
    await screenshotPair(page, scene);
    reports.push({ scene, records });
  }
  await page.goto('http://127.0.0.1:5191/roads-prototype.html?templates');
  await page.waitForFunction(() => performance.getEntriesByName('roads:navigation-to-ready').length > 0);
  await page.getByRole('checkbox', { name: 'Show roads', exact: true }).uncheck();
  await page.getByRole('button', { name: 'core/validation', exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${captureDirectory}templates-validation-detail.png` });
  const primary = await selectedCapture(page);
  ensure(errors.length === 0, 'Browser errors');
  return { browserVersion: page.context().browser().version(), viewport: page.viewportSize(), reports, primary, errors };
}
