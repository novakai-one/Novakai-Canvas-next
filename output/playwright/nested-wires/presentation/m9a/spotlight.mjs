/** Real pointer acceptance against frozen scene relationships; no test runner or scene mutations. */
export async function spotlightCapture(page, wires) {
  const out='output/playwright/nested-wires/presentation/m9a-fix/';
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  const report={messages:[],timing:[]};
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:1920,height:1440});
  await page.goto('http://127.0.0.1:5191/roads-prototype.html?scale');
  await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length);
  await page.mouse.move(5,5);
  const objectIds=await page.locator('[data-node-id],[data-wire-id]').evaluateAll(elements=>elements.map(e=>e.dataset.nodeId??e.dataset.wireId));
  // React Flow propagates controlled node paint after the wire commit. Require the whole
  // expected state on two consecutive animation-frame polls, never just the first wire.
  async function waitForPaint(classFor) {
    const expected=objectIds.map(id=>id+':'+classFor(id));
    await page.waitForFunction(state=>{
      const actual=[...document.querySelectorAll('[data-node-id],[data-wire-id]')].map(e=>{
        const classes=[...e.classList].map(c=>c.match(/^_(primary|secondary|dim|spotlit|spotlightDim)_/)?.[1]).filter(Boolean);
        return (e.dataset.nodeId??e.dataset.wireId)+':'+classes.join();
      });
      state.frames=JSON.stringify(actual)===JSON.stringify(state.expected)?state.frames+1:0;
      return state.frames>=2;
    },{expected,frames:0},{polling:'raf',timeout:5000});
  }
  // Negative assertions must observe beyond the original 180ms cancellation window.
  // This is an observation deadline, not a substitute for settling rendered state.
  async function observeDwell() {
    const start=await page.evaluate(()=>performance.now());
    await page.waitForFunction(start=>performance.now()-start>=180,start,{polling:'raf',timeout:5000});
  }
  await waitForPaint(()=>'');
  const geometry=()=>page.evaluate(()=>[...document.querySelectorAll('.react-flow__viewport,.react-flow__node,[data-port-id],[data-wire-id] polyline')].map(e=>({style:e.getAttribute('style'),points:e.getAttribute('points'),bounds:e.getBoundingClientRect().toJSON()})));
  const baseline=JSON.stringify(await geometry());
  const read=()=>page.evaluate(()=>({
    count:window.__layoutRecalcCount,
    labels:[...document.querySelectorAll('[data-wire-label]')].map(e=>e.dataset.wireLabel),
    objects:[...document.querySelectorAll('[data-node-id],[data-wire-id]')].map(e=>({
      id:e.dataset.nodeId??e.dataset.wireId,
      classes:[...e.classList].map(c=>c.match(/^_(primary|secondary|dim|spotlit|spotlightDim)_/)?.[1]).filter(Boolean),
      opacity:Number(getComputedStyle(e).opacity),
      color:getComputedStyle(e).color,
      pathOpacity:e.dataset.wireId?Number(getComputedStyle(e.querySelector('polyline:nth-of-type(2)')).opacity):null,
      pathColor:e.dataset.wireId?getComputedStyle(e.querySelector('polyline:nth-of-type(2)')).stroke:null,
      converging:e.dataset.converging==='true',
    })),
    tokens:Object.fromEntries(['idle-opacity','spotlight-dim-opacity','primary-color'].map(k=>[k,getComputedStyle(document.getElementById('app')).getPropertyValue('--nv-wire-'+k).trim()])),
  }));
  async function unchanged(label) {
    assert((await read()).count===1,label+': layout recalculation');
    assert(JSON.stringify(await geometry())===baseline,label+': geometry/camera changed');
    report.messages.push('PASS '+label+': layout delta=0; exact geometry/camera retained');
  }
  async function idle() {
    await waitForPaint(()=>'');
    const state=await read();
    assert(state.labels.length===0,'idle labels');
    state.objects.forEach(checkIdle);
    return state;
  }
  const initial=await idle();
  report.tokens=initial.tokens;
  await page.screenshot({path:out+'scale-idle.png'});
  const hub=await page.locator('[data-node-id]').evaluateAll(elements=>elements.find(e=>e.textContent.includes('kernel.ts')).dataset.nodeId);
  const hubLocator=page.locator(`[data-node-id="${hub}"] strong`);
  report.hub=hub;
  function checkIdle(obj) {
    assert(obj.classes.length===0,'idle classes '+obj.id);
    if(obj.pathOpacity!==null) checkIdlePath(obj);
  }
  function checkIdlePath(obj) {
    const opacity=0.65*(obj.converging?0.72:1);
    assert(Math.abs(obj.pathOpacity-opacity)<0.00001,'idle token alpha '+obj.id);
  }
  function membersFor(id) {
    const wire=wires.find(w=>w.id===id);
    if(wire) return new Set([id,wire.from,wire.to]);
    return new Set([id,...wires.filter(w=>[w.from,w.to].includes(id)).flatMap(w=>[w.id,w.from,w.to])]);
  }
  function checkNetObject(obj,member) {
    assert(obj.classes.join()===(member?'spotlit':'spotlightDim'),'net membership '+obj.id);
    if(obj.pathOpacity!==null) checkNetPath(obj,member);
  }
  function checkNetPath(obj,member) {
    assert(obj.pathOpacity===(member?1:0.16),'net contrast '+obj.id);
    if(member)assert(obj.pathColor===obj.color,'accent path '+obj.id);
  }
  async function net(id) {
    const members=membersFor(id);
    await waitForPaint(id=>members.has(id)?'spotlit':'spotlightDim');
    const state=await read();
    assert(state.labels.length===0,'hover labels');
    state.objects.forEach(obj=>checkNetObject(obj,members.has(obj.id)));
    assert(state.objects.filter(o=>o.classes.includes('primary')).length===0,'hover selected');
    report.messages.push('PASS '+id+': exact one-hop net, full contrast, dim 0.16, zero labels or primary selection');
  }
  // Observe the actual event-to-class delay; browser scheduling may add render latency.
  await page.evaluate(()=>{
    window.__hoverTimes=[];
    document.addEventListener('mouseover',()=>window.__hoverStarted=performance.now(),{once:true});
    const observer=new MutationObserver(()=>{
      if(document.querySelector('[class*="_spotlit_"]')) {
        window.__hoverTimes.push(performance.now()-window.__hoverStarted);observer.disconnect();
      }
    });
    observer.observe(document.getElementById('app'),{subtree:true,attributes:true,attributeFilter:['class']});
  });
  await hubLocator.hover();
  await page.waitForFunction(()=>document.querySelector('[class*="_spotlit_"]'));
  report.timing=await page.evaluate(()=>window.__hoverTimes);
  assert(report.timing[0]>=80,'enter has no hysteresis');
  await net(hub);
  await unchanged('hover node');
  await page.screenshot({path:out+'scale-hover-hub.png'});
  await page.mouse.move(5,5);
  await idle();
  await unchanged('hover off');
  // A 25ms real pointer pass must never commit a spotlight, including after its stale timer would fire.
  await page.evaluate(()=>{
    window.__spotlightFlashed=false;
    window.__flashObserver=new MutationObserver(()=>{if(document.querySelector('[class*="_spotlit_"]'))window.__spotlightFlashed=true;});
    window.__flashObserver.observe(document.getElementById('app'),{subtree:true,attributes:true,attributeFilter:['class']});
  });
  const bounds=await hubLocator.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await page.waitForTimeout(25);
  await page.mouse.move(5,5);
  await observeDwell();
  assert(!await page.evaluate(()=>{window.__flashObserver.disconnect();return window.__spotlightFlashed;}),'rapid pass flickered');
  await idle();
  report.messages.push('PASS 25ms pointer pass: zero transient spotlight, cancelled timer stays cancelled');
  // Briefly leave a settled net, then reenter: it must not disappear between targets.
  await hubLocator.hover();await net(hub);
  await page.evaluate(()=>{
    window.__netDropped=false;
    window.__dropObserver=new MutationObserver(()=>{if(!document.querySelector('[class*="_spotlit_"]'))window.__netDropped=true;});
    window.__dropObserver.observe(document.getElementById('app'),{subtree:true,attributes:true,attributeFilter:['class']});
  });
  await page.mouse.move(5,5);await page.waitForTimeout(25);
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await observeDwell();
  assert(!await page.evaluate(()=>{window.__dropObserver.disconnect();return window.__netDropped;}),'brief leave flickered');
  await net(hub);
  report.messages.push('PASS 25ms leave/reenter: settled net never drops');
  const wire=wires.find(w=>w.from===hub||w.to===hub);
  const point=await page.locator(`[data-wire-hit="${wire.id}"]`).evaluate(e=>{
    const points=Array.from({length:199},(_,index)=>{
      const p=e.getPointAtLength(e.getTotalLength()*(index+1)/200);
      const screen=new DOMPoint(p.x,p.y).matrixTransform(e.getScreenCTM());
      return {x:screen.x,y:screen.y};
    });
    return points.find(p=>document.elementFromPoint(p.x,p.y)===e);
  });
  assert(point,'wire real hit target');
  await page.mouse.move(point.x,point.y);
  await net(wire.id);await unchanged('hover wire');
  await page.screenshot({path:out+'scale-hover-wire.png'});
  await page.mouse.click(point.x,point.y);
  const selectedMembers=membersFor(wire.id);
  function selectedClass(id) {
    if(id===wire.id)return 'primary';
    return selectedMembers.has(id)?'secondary':'dim';
  }
  await waitForPaint(selectedClass);
  const selected=await read();
  assert(selected.labels.join()===wire.id,'primary wire label');
  assert(selected.objects.find(o=>o.id===wire.id).classes.join()==='primary','wire primary');
  await page.screenshot({path:out+'scale-primary-wire.png'});
  await hubLocator.hover();await observeDwell();
  assert(JSON.stringify((await read()).objects)===JSON.stringify(selected.objects),'hover overrides selection');
  assert((await read()).labels.join()===wire.id,'hover modifies selected labels');
  await unchanged('selection wins over hover');
  await page.locator('.react-flow__pane').click({position:{x:12,y:12}});await page.mouse.move(5,5);
  await idle();
  await page.getByRole('checkbox',{name:'Show roads'}).check();
  await page.locator('[data-coverage]').waitFor();
  await page.mouse.move(5,5);
  await idle();
  await page.screenshot({path:out+'scale-roads-on.png'});
  await hubLocator.hover();await net(hub);
  await unchanged('roads-on spotlight');
  await page.screenshot({path:out+'scale-roads-on-hover.png'});
  report.errors=errors;assert(errors.length===0,'browser errors');
  return report;
}
