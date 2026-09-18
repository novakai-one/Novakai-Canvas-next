/** Headless evidence only, using immutable before/after public builds on owned port 5198. */
export async function capture(page) {
  const out='output/playwright/nested-wires/embedding/';
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:1920,height:1440});
  const rows=[];
  for(const phase of ['before','after']) {
    rows.push(await capturePhase(page,phase,out));
  }
  if(errors.length)throw new Error(JSON.stringify(errors));
  return {browserVersion:page.context().browser().version(),headless:true,port:5198,rows,errors};
}

async function capturePhase(page,phase,out) {
    await page.goto(`http://127.0.0.1:5198/.local/m10f-c/index.html?phase=${phase}`);
    await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.waitForTimeout(2000);
    await page.getByRole('button',{name:'Fit View',exact:true}).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button',{name:'Fit View',exact:true}).click();
    await page.waitForTimeout(1000);
    const check=page.getByRole('checkbox',{name:'Show roads',exact:true});
    for(const roads of ['off','on']) {
      await check.setChecked(roads==='on');
      await page.waitForTimeout(250);
      await page.screenshot({path:`${out}increment-c-${phase}-roads-${roads}.png`});
    }
    const row={phase,viewport:page.viewportSize(),camera:await page.locator('.react-flow__viewport').getAttribute('style'),nodes:await page.locator('[data-node-id]').count(),wires:await page.locator('[data-wire-id]').count()};
    await check.uncheck();
    await page.getByRole('button',{name:'Section 13',exact:true}).click();
    await page.waitForTimeout(500);
    await page.screenshot({path:`${out}increment-c-${phase}-section-13.png`});
    await check.check();
    await page.waitForTimeout(250);
    await page.screenshot({path:`${out}increment-c-${phase}-section-13-roads.png`});
    row.sectionCamera=await page.locator('.react-flow__viewport').getAttribute('style');
 return row;
}
