export async function capture(page) {
  await page.setViewportSize({width:1920,height:1440});
  const report={};
  for(const scene of ['nested','templates','scale']) {
    await page.goto('http://127.0.0.1:5191/roads-prototype.html?'+scene);
    await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length);
    report[scene]=await page.evaluate(()=>{
      const main=document.querySelector('main');
      let fiber=main[Object.keys(main).find(k=>k.startsWith('__reactFiber'))];
      while(fiber && !fiber.memoizedProps?.scene)fiber=fiber.return;

      return {sceneBytes:JSON.stringify(fiber.memoizedProps.scene), geometry:[...document.querySelectorAll('.react-flow__node,[data-port-id],[data-wire-id] polyline')].map(e=>({style:e.getAttribute('style'),points:e.getAttribute('points')})),count:window.__layoutRecalcCount};
    });
    await page.screenshot({path:'output/playwright/nested-wires/presentation/m9d/'+scene+'-capture.png'});
  }
  return report;
}
