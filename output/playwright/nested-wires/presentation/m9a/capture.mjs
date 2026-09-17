/** Headless acceptance; browser errors/assertions fail the runner. No scene mutations. */
export async function capture(page) {
  const out = 'output/playwright/nested-wires/presentation/m9a/';
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const assert = (value, message) => { if (!value) throw new Error(message); };
  await page.setViewportSize({width:1920,height:1440});
  const report = {browserVersion:page.context().browser().version(),loads:{},errors};
  const read = () => page.evaluate(() => ({
    stages:Object.fromEntries(performance.getEntriesByType('measure').map(e=>[e.name,e.duration])),
    audits:performance.getEntriesByName('roads:coverage-audit').length,
    footer:document.querySelector('[data-coverage]')?.textContent ?? null,
    roads:document.querySelector('input[type="checkbox"]').checked,
    layout:window.__layoutRecalcCount,
  }));
  async function enableRoads(mode) {
    if(mode!=='scale-on') return;
    await page.evaluate(()=>performance.mark('m9a:toggle-start'));
    await page.getByRole('checkbox',{name:'Show roads'}).check();
    await page.locator('[data-coverage]').waitFor();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
      performance.measure('m9a:toggle-to-ready',{start:'m9a:toggle-start'});
      performance.measure('m9a:navigation-through-roads-on',{start:0});resolve();
    }))));
  }
  function assertRoadsOn(mode, sample) {
    if(mode==='scale-on') assert(sample.audits===1 && sample.footer.startsWith('100%'), 'on audit missing');
  }
  async function loadSample(mode, scene) {
    await page.goto(`http://127.0.0.1:5191/roads-prototype.html?${scene}`);
    await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length>0);
    const off = await read();
    assert(off.audits===0 && off.footer===null && !off.roads, `${mode}: hidden audit or footer`);
    await enableRoads(mode);
    const sample = await read();
    assert(sample.layout===1, 'layout recalculated');
    assertRoadsOn(mode, sample);
    return sample;
  }
  async function captureLoads(mode) {
    const scene = mode.split('-')[0];
    const samples=[];
    for(let i=0;i<5;i++) {
      samples.push(await loadSample(mode, scene));
    }
    const stageNames=[...new Set(samples.flatMap(s=>Object.keys(s.stages)))];
    const medians=Object.fromEntries(stageNames.map(name=>[name,samples.map(s=>s.stages[name]).sort((a,b)=>a-b)[2]]));
    report.loads[mode]={samples,medians};
    await page.screenshot({path:out+mode+'.png'});
  }
  async function captureToolbar(mode) {
    if(mode!=='scale-off') return;
    const toolbar = await page.locator('header').evaluate(header=>({
      bounds:header.getBoundingClientRect().toJSON(),
      items:[...header.querySelectorAll('h1,button,select,label')].map(e=>({text:e.textContent,bounds:e.getBoundingClientRect().toJSON()})),
      viewport:innerWidth, documentWidth:document.documentElement.scrollWidth,
      buttons:header.querySelectorAll('button').length,
    }));
    assert(toolbar.buttons===13,'12 tabs plus Overview');
    assert(toolbar.items.every(e=>e.bounds.x>=0 && e.bounds.right<=toolbar.viewport),'toolbar clipped');
    assert(toolbar.documentWidth===toolbar.viewport,'horizontal overflow');
    report.toolbar=toolbar;
    await page.screenshot({path:out+'toolbar-full-width.png'});
  }
  async function captureModes() {
    for (const mode of ['scale-off','templates-off','scale-on']) {
      await captureLoads(mode);
      await captureToolbar(mode);
    }
  }
  await captureModes();
  const stop = loadStop(report);
  if(stop) return {...report,stop};
  const auditsBefore=(await read()).audits;
  await page.getByRole('combobox',{name:'Wire focus'}).selectOption('w22');
  assert((await read()).audits===auditsBefore,'selection reran audit');
  await page.getByRole('checkbox',{name:'Show roads'}).uncheck();
  assert((await read()).footer===null && (await read()).audits===auditsBefore,'off reran audit or footer persists');
  await page.getByRole('checkbox',{name:'Show roads'}).check();
  assert((await read()).audits===auditsBefore+1,'remount audit absent');
  report.toggles='on runs once; selection reuses; off hides without audit; on again audits once';
  await page.goto('http://127.0.0.1:5191/roads-prototype.html?nested');
  await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length);
  report.nestedFallback=await page.locator('option[value="w01"]').textContent();
  assert(report.nestedFallback==='w01 · node-1 → node-2','nested fallback');
  await page.goto('http://127.0.0.1:5191/roads-prototype.html?templates');
  await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length);
  report.templatesOptions=await page.getByRole('combobox',{name:'Wire focus'}).locator('option').allTextContents();
  assert(report.templatesOptions.slice(1).every(text=>!text.includes('node-') && text.includes('.ts')),'file labels missing');
  assert(errors.length===0,'browser errors');
  return report;
}

function loadStop(report) {
  const gates = [['scale-off',300],['templates-off',250]];
  const failed = gates.find(([mode,ceiling])=>report.loads[mode].medians['roads:navigation-to-ready']>ceiling);
  return failed?.join(' exceeds ');
}
