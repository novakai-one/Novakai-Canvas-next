/** Headless evidence on the existing Vite; no layout or DOM geometry mutation. */
const directory = 'output/playwright/nested-wires/';
export async function capture(page) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  const loads = [];
  for (let i = 0; i < 5; i += 1) {
    await page.goto('http://127.0.0.1:5188/roads-prototype.html?nested');
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
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${directory}m4-overview.png` });
  const checkbox = page.getByRole('checkbox', { name: 'Show roads' });
  await checkbox.uncheck();
  await page.screenshot({ path: `${directory}m4-roads-off.png` });
  const roadsOff = !(await checkbox.isChecked());
  await checkbox.check();
  const hub = page.locator('[data-node-id="node-23"]');
  const bounds = await hub.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${directory}m4-hub-closeup.png` });
  return {
    loads,
    medianMilliseconds: loads
      .map((l) => l['roads:navigation-to-ready'])
      .toSorted((a, b) => a - b)[2],
    screenshots: ['m4-overview', 'm4-roads-off', 'm4-hub-closeup'],
    roadsOff,
    wires: await page.locator('[data-wire-id]').count(),
    nodes: await page.locator('[data-node-id]').count(),
    layoutRecalcCount: await page.evaluate(() => window.__layoutRecalcCount),
  };
}
