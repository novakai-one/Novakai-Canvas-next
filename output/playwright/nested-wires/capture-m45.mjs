/** Headless capture of current output and the immutable M4 scene in the same unchanged renderer. */
const directory = 'output/playwright/nested-wires/';
const url = 'http://127.0.0.1:5188/roads-prototype.html?nested';
async function ready(page) {
  await page.goto(url);
  await page.waitForFunction(() => performance.getEntriesByName('roads:navigation-to-ready').length > 0);
}
async function junctionCapture(page, name) {
  const junction = page.getByRole('button', { name: /^Inspect J21 / });
  const before = await junction.boundingBox();
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.wheel(0, -1600);
  await page.waitForTimeout(400);
  const box = await junction.boundingBox();
  await page.screenshot({ path: `${directory}${name}.png`, clip: { x: box.x - 40, y: box.y - 40, width: box.width + 80, height: box.height + 80 } });
  return box;
}
export async function capture(page, baselineUrl) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  const loads = [];
  for (let i = 0; i < 5; i += 1) {
    await ready(page);
    loads.push(await page.evaluate(() => Object.fromEntries(performance.getEntriesByType('measure').filter((e) => e.name.startsWith('roads:')).map((e) => [e.name, e.duration]))));
  }
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${directory}m45-overview.png` });
  const checkbox = page.getByRole('checkbox', { name: 'Show roads' });
  await checkbox.uncheck();
  await page.screenshot({ path: `${directory}m45-roads-off.png` });
  const roadsOff = !(await checkbox.isChecked());
  await checkbox.check();
  const after = await junctionCapture(page, 'm45-junction-after');
  const report = { loads, medianMilliseconds: loads.map((l) => l['roads:navigation-to-ready']).toSorted((a,b) => a-b)[2], roadsOff,
    nodes: await page.locator('[data-node-id]').count(), wires: await page.locator('[data-wire-id]').count(),
    layoutRecalcCount: await page.evaluate(() => window.__layoutRecalcCount), after };
  let intercepted = 0;
  await page.route('**/cli/roads-prototype.ts*', async (route) => {
    intercepted += 1;
    const response = await route.fetch();
    const source = await response.text();
    const expression = 'const scene = build({ measure });';
    if (!source.includes(expression)) throw new Error('Baseline harness cannot locate builder expression');
    const body = source.replace(expression, `const scene = await (await fetch(${JSON.stringify(baselineUrl)})).json();`);
    await route.fulfill({ response, body });
  });
  await ready(page);
  await page.waitForTimeout(250);

  report.baselineVerified = await page.evaluate(async (url) => { const baseline = await (await fetch(url)).json(); return baseline.wiring.value.every((wire) => { const points = [wire.segments[0].from, ...wire.segments.map((s) => s.to)].map((p) => `${p.x},${p.y}`).join(' '); return document.querySelector(`[data-wire-hit="${wire.id}"]`).getAttribute('points') === points; }); }, baselineUrl);
  verifyBaseline(report, intercepted);
  report.before = await junctionCapture(page, 'm45-junction-before');
  await page.unroute('**/cli/roads-prototype.ts*');
  return report;
}

function verifyBaseline(report, intercepted) {
  if (intercepted !== 1) throw new Error(`Baseline app intercept count ${intercepted}`);
  if (!report.baselineVerified) throw new Error('Rendered baseline wire paths differ from immutable M4 scene');
}
