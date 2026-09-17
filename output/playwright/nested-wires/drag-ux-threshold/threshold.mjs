/** Public DOM/mouse probes; run.py owns failures and fresh-page recovery. */
export async function clicks(page) {
  const probes = [];
  for (const distance of [0, Math.SQRT2, 2.8, 3]) {
    const probe = await clickProbe(page, distance / Math.SQRT2);
    probes.push({ ...probe, totalMovement: distance });
  }
  return { status: outcome(probes.flatMap((p) => p.checks)), probes };
}
async function boundaryDrag(page, name) {
  await reset(page);
  await page.locator('[data-node-id="node-7"] strong').click();
  const before = await state(page);
  const from = center(await page.locator(nodeSelector('node-4')).boundingBox());
  await screenshot(page, `${name}-before`);
  await traceStart(page);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 4, from.y);
  const activation = await sample(page, { x: from.x + 4, y: from.y });
  const targetName = name.replace('boundary-', '');
  const to = targetName === '4px' ? { x: from.x + 4, y: from.y } : await target(page, targetName);
  await page.mouse.move(to.x, to.y);
  await page.mouse.up();
  await page.waitForTimeout(250);
  const after = await state(page);
  await screenshot(page, `${name}-after`);
  const dropMarks = await page.evaluate(() => performance.getEntriesByName('roads:drop').length);
  const probe = { name, before, after, from, to, activation, dropMarks,
    trace: await page.evaluate(() => window.__dragUxTrace) };
  const checks = targetName === 'valid' ? swapAssertions(probe) : noOpAssertions(probe);
  checks.push(assertion('4px activates one real drop', dropMarks, 1));
  return { ...probe, checks };
}
export async function threshold(page) {
  const result = await clicks(page);
  for (const name of ['boundary-4px', 'boundary-valid', 'boundary-invalid']) {
    result.probes.push(await boundaryDrag(page, name));
  }
  return { status: outcome(result.probes.flatMap((p) => p.checks)), probes: result.probes };
}
