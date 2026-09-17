/** Synthetic, distributed 2-wires-per-node scaling probe; browser failures reach the Python runner. */
export async function measure(page, layoutUrl) {
  await page.setViewportSize({ width: 1920, height: 1440 });
  await page.goto('http://127.0.0.1:5188/roads-prototype.html?nested');
  await page.waitForFunction(() => window.__roadScene !== undefined);
  const pairs = [[1,2],[2,3],[4,5],[5,6],[1,4],[2,5],[3,6],[4,1],[5,2],[6,3],[3,2],[6,5]];
  const specs = [4,8,12,16,20,25].map((copies) => ({
    sections: Array.from({length:copies}, (_,i) => ({number:i+1, nodes:Array.from({length:6}, (_,j) => ({number:i*6+j+1,label:`Node ${i*6+j+1}`})),children:[]})),
    requests:Array.from({length:copies}, (_,i) => pairs.map(([a,b])=>[a+i*6,b+i*6])).flat(),
  }));
  const results = [];
  for (const spec of specs) results.push(await sample(page, layoutUrl, spec));
  return { description:'Independent six-node sections with 12 directed local wires each; no cross-section traffic. Sizes 24/48 through exactly 150/300. This is measured topology-specific scaling, not an arbitrary dense-graph guarantee.', results };
}
async function sample(page, layoutUrl, spec) {
  const bodySpec = JSON.stringify(spec);
  await page.route('**/cli/roads-prototype.ts*', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replaceAll('spec: fanInHubSceneSpec', `spec: ${bodySpec}`);
    await route.fulfill({response,body});
  });
  await page.goto('http://127.0.0.1:5188/roads-prototype.html?nested');
  await page.waitForFunction(() => performance.getEntriesByName('roads:navigation-to-ready').length > 0);
  await page.unroute('**/cli/roads-prototype.ts*');
  const construction = await page.evaluate(async ({url,spec}) => {
    const {createNestedRoadScene,inspectNestedWires} = await import(url);
    const builds = Array.from({length:5}, () => {
      const start=performance.now(); const scene=createNestedRoadScene({spec});
      return {milliseconds:performance.now()-start,scene};
    });
    const scene=builds[4].scene;
    return { times:builds.map((b)=>b.milliseconds), nodes:scene.nodes.length, wires:scene.wiring.value?.length, ok:scene.wiring.ok, violations:inspectNestedWires(scene,scene.wiring.value) };
  },{url:layoutUrl,spec});
  validate(construction.violations);
  if (!construction.ok) throw new Error('Unrouted scaling fixture');
  const timings=[];
  for(let i=0;i<5;i+=1) timings.push(await swap(page));
  const postSwap = await page.evaluate(async (url) => {
    const {inspectNestedWires} = await import(url);
    return inspectNestedWires(window.__roadScene, window.__roadScene.wiring.value);
  }, layoutUrl);
  validate(postSwap);
  return {...construction, postSwap, dropToReady:timings, median:median(timings), buildMedian:median(construction.times)};
}
function median(values) {return [...values].sort((a,b)=>a-b)[2];}
async function swap(page) {
  const from=await page.locator('[data-node-id="node-4"]').boundingBox();
  const to=await page.locator('[data-node-id="node-1"]').boundingBox();
  const count=await page.evaluate(()=>performance.getEntriesByName('roads:drop-to-ready').length);
  await page.mouse.move(from.x+from.width/2,from.y+from.height/2);
  await page.mouse.down();
  await page.mouse.move(to.x+to.width/2,to.y+to.height/2,{steps:10});
  await page.mouse.up();
  await page.waitForFunction((n)=>performance.getEntriesByName('roads:drop-to-ready').length>n,count);
  await page.waitForTimeout(100);
  return page.evaluate(()=>performance.getEntriesByName('roads:drop-to-ready').at(-1).duration);
}

function validate(violations) {
  if (Object.values(violations).some((v)=>v.length)) throw new Error('Invalid scaling fixture');
}
