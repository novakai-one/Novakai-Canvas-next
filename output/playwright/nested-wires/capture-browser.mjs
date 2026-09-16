/** Invoke through playwright-cli run-code; uses the already-running port 5188 server. */
const directory = 'output/playwright/nested-wires/';
function assert(value, message = 'Browser evidence assertion failed') {
  if (!value) throw new Error(message);
}
async function load(page) {
  await page.goto('http://127.0.0.1:5188/roads-prototype.html?nested');
  await page.waitForFunction(
    () => performance.getEntriesByName('roads:navigation-to-ready').length > 0,
  );
  return page.evaluate(() =>
    Object.fromEntries(
      performance
        .getEntriesByType('measure')
        .filter((e) => e.name.startsWith('roads:'))
        .map((e) => [e.name, e.duration]),
    ),
  );
}
async function timing(page) {
  const loads = [];
  for (let i = 0; i < 5; i += 1) loads.push(await load(page));
  return {
    url: page.url(),
    loads,
    medianMilliseconds: loads
      .map((l) => l['roads:navigation-to-ready'])
      .toSorted((a, b) => a - b)[2],
    method:
      'Five consecutive warm-cache Chromium development navigations; Navigation start → fonts ready + two animation frames. No GPU paint-duration claim.',
  };
}
async function screenshot(page, id) {
  await page.getByRole('combobox', { name: 'Wire focus' }).selectOption(id);
  await page.waitForTimeout(150);
  const path = page.locator(`g[data-wire-id=${id}] polyline`).last();
  const bounds = await path.boundingBox(),
    viewport = page.viewportSize();
  assert(bounds);
  assert(
    [
      bounds.x >= 0,
      bounds.y >= 80,
      bounds.x + bounds.width <= viewport.width,
      bounds.y + bounds.height <= viewport.height - 40,
    ].every(Boolean),
    `Clipped wire ${id}`,
  );
  await page.screenshot({ path: `${directory}${id}.png` });
  return { id, bounds, viewport, fullyVisible: true };
}
async function overview(page) {
  await page.getByRole('button', { name: 'Fit View', exact: true }).click();
  await page.waitForTimeout(150);
  assert((await page.locator('[data-node-id]').count()) === 22);
  assert((await page.locator('[data-section-id]').count()) === 4);
  assert((await page.locator('[data-wire-id]').count()) === 12);
  await page.screenshot({ path: `${directory}overview.png` });
}
async function visualAudit(page) {
  return page.evaluate(() => ({
    labels: [...document.querySelectorAll('[data-wire-id] text')].map((e) => ({
      id: e.textContent,
      bounds: e.getBoundingClientRect().toJSON(),
      color: getComputedStyle(e).fill,
      halo: getComputedStyle(e).stroke,
    })),
    nodes: [...document.querySelectorAll('[data-node-id]')].map((e) => ({
      id: e.getAttribute('data-node-id'),
      bounds: e.getBoundingClientRect().toJSON(),
    })),
    headingSize: getComputedStyle(document.querySelector('h1')).fontSize,
    bodySize: getComputedStyle(document.querySelector('header label')).fontSize,
    fontsReady: document.fonts.status,
  }));
}
/** Screenshot export failures propagate to the CLI; rerunning replaces only this milestone's evidence. */
export async function capture(page) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  const browser = await timing(page);
  await overview(page);
  const visual = await visualAudit(page);
  const screenshots = [];
  for (let i = 1; i <= 12; i += 1)
    screenshots.push(await screenshot(page, `w${String(i).padStart(2, '0')}`));
  await page.getByRole('combobox', { name: 'Wire focus' }).selectOption('');
  return {
    browser,
    screenshots,
    visual,
    medianMilliseconds: browser.medianMilliseconds,
    overview: '22 nodes / 4 sections / 12 wires',
    closeups: screenshots.length,
    allWiresFullyVisible: screenshots.every((s) => s.fullyVisible),
  };
}
