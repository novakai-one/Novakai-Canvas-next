/** Headless evidence only; Python wrapper owns session teardown and report persistence. */
function ensure(condition, message) {
  if (!condition) throw new Error(message);
}
export async function capture(page, options) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const loads = [];
  const url = `http://127.0.0.1:5191/roads-prototype.html?${options.scene}${options.query ?? ''}`;
  for (let i = 0; i < 5; i += 1) {
    await page.goto(url);
    await page.waitForFunction(() => performance.getEntriesByName('roads:navigation-to-ready').length > 0);
    loads.push(await page.evaluate(() => Object.fromEntries(performance.getEntriesByType('measure').filter((e) => e.name.startsWith('roads:')).map((e) => [e.name, e.duration]))));
  }
  await page.getByRole('button', { name: 'Fit View', exact: true }).click();
  await page.waitForTimeout(350);
  const checkbox = page.getByRole('checkbox', { name: 'Show roads', exact: true });
  await checkbox.check();
  await page.screenshot({ path: `${options.prefix}-roads-on.png` });
  await checkbox.uncheck();
  await page.screenshot({ path: `${options.prefix}-roads-off.png` });
  const report = {
    url, browserVersion: page.context().browser().version(), viewport: page.viewportSize(), loads,
    medianMilliseconds: loads.map((l) => l['roads:navigation-to-ready']).toSorted((a,b) => a-b)[2],
    nodes: await page.locator('[data-node-id]').count(), wires: await page.locator('[data-wire-id]').count(),
    layoutRecalcCount: await page.evaluate(() => window.__layoutRecalcCount), errors,
  };
  ensure([report.nodes === options.nodes, report.wires === options.wires].every(Boolean), 'Rendered counts differ');
  ensure([report.layoutRecalcCount === 1, errors.length === 0].every(Boolean), 'Repeated layout or browser errors');
  await page.getByRole('button', { name: 'contract', exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${options.prefix}-contract-detail.png` });
  return report;
}
