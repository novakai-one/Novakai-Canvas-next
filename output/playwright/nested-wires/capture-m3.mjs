/** Browser evidence on the existing Vite. Export through capture-m3.py; failures reach Node. */
const directory = 'output/playwright/nested-wires/';
async function shot(page, name, focus) {
  await page.getByRole('combobox', { name: 'Wire focus' }).selectOption(focus);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${directory}${name}.png` });
  return { name, focus, viewport: page.viewportSize() };
}
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
  const screenshots = [];
  screenshots.push(await shot(page, 'm3-overview', ''));
  screenshots.push(await shot(page, 'm3-corridor-s2s4', 'w10'));
  screenshots.push(await shot(page, 'm3-corridor-s3s4', 'w17'));
  await page.setViewportSize({ width: 2560, height: 1920 });
  await page.waitForTimeout(250);
  screenshots.push(await shot(page, 'm3-shared-rows', 'w12'));
  return {
    loads,
    medianMilliseconds: loads
      .map((l) => l['roads:navigation-to-ready'])
      .toSorted((a, b) => a - b)[2],
    screenshots,
    wires: await page.locator('[data-wire-id]').count(),
    nodes: await page.locator('[data-node-id]').count(),
    layoutRecalcCount: await page.evaluate(() => window.__layoutRecalcCount),
  };
}
