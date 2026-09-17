export async function capture(page) {
  await page.setViewportSize({width:1920,height:1440});
  await page.goto('http://127.0.0.1:5191/roads-prototype.html?scale');
  await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length);
  const read=()=>page.evaluate(()=>({zoom:Number(document.querySelector('main').style.getPropertyValue('--paint-zoom')),count:window.__layoutRecalcCount,visible:[...document.querySelectorAll('[data-label-frame] strong')].filter(e=>Number(getComputedStyle(e).opacity)>0).map(e=>e.textContent)}));
  const before=await read();
  await page.getByRole('button',{name:'Zoom Out',exact:true}).click();
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const after=await read();
  if(after.count!==before.count||after.zoom>=before.zoom||!after.visible.includes('api.ts'))throw Error('zoom-out evidence gate');
  await page.screenshot({path:'output/playwright/nested-wires/presentation/m9d/scale-below-default-legible.png'});
  return {before,after,layoutDelta:after.count-before.count};
}
