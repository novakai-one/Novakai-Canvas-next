/** Isolated headless capture body; the CLI wrapper owns browser cleanup and fatal assertions. */
const directory = 'output/playwright/nested-wires/templates-scene/';
const url = 'http://127.0.0.1:5190/roads-prototype.html?templates';
function ensure(condition, message) {
  if (!condition) throw new Error(message);
}
export async function capture(page) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const loads = [];
  for (let i = 0; i < 5; i += 1) {
    await page.goto(url);
    await page.waitForFunction(
      () => performance.getEntriesByName('roads:navigation-to-ready').length > 0,
    );
    loads.push(
      await page.evaluate(() =>
        Object.fromEntries(
          performance
            .getEntriesByType('measure')
            .filter((e) => e.name.startsWith('roads:'))
            .map((e) => [e.name, e.duration]),
        ),
      ),
    );
  }
  await page.getByRole('button', { name: 'Fit View', exact: true }).click();
  await page.waitForTimeout(350);
  const checkbox = page.getByRole('checkbox', { name: 'Show roads', exact: true });
  await checkbox.check();
  await page.screenshot({ path: `${directory}templates-roads-on.png` });
  await checkbox.uncheck();
  await page.screenshot({ path: `${directory}templates-roads-off.png` });
  const labels = await page.locator('[data-node-id] strong').allTextContents();
  const bounds = await page
    .locator('[data-node-id]')
    .evaluateAll((elements) =>
      elements.map((e) => ({
        id: e.getAttribute('data-node-id'),
        ...e.getBoundingClientRect().toJSON(),
      })),
    );
  const report = {
    url,
    browserVersion: page.context().browser().version(),
    viewport: page.viewportSize(),
    loads,
    medianMilliseconds: loads
      .map((l) => l['roads:navigation-to-ready'])
      .toSorted((a, b) => a - b)[2],
    nodes: await page.locator('[data-node-id]').count(),
    wires: await page.locator('[data-wire-id]').count(),
    layoutRecalcCount: await page.evaluate(() => window.__layoutRecalcCount),
    labels,
    bounds,
    errors,
    roadsOff: !(await checkbox.isChecked()),
  };
  ensure([report.nodes === 16, report.wires === 29].every(Boolean), 'Rendered graph counts differ');
  ensure(
    labels.length === 16 && labels.every((label) => label.endsWith('.ts')),
    'Real file labels missing',
  );
  ensure(
    bounds.every((b) => b.x >= 0 && b.y >= 0 && b.right <= 1920 && b.bottom <= 1440),
    'Fit view clips nodes',
  );
  ensure(
    [report.layoutRecalcCount === 1, !errors.length].every(Boolean),
    'Layout repeated or browser error',
  );
  // Supplement the required fit overview with a readable source-hub close-up.
  await page.getByRole('button', { name: 'contract', exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${directory}templates-contract-detail.png` });
  return report;
}
