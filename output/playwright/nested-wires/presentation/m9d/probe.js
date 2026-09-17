/** Actual browser acceptance: unchanged scene bytes and geometry, measured text containment. */
export async function capture(page) {
  const out='output/playwright/nested-wires/presentation/m9d/';
  const assert=(v,m)=>{if(!v)throw Error(m)};
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:1920,height:1440});
  const frame=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const read=()=>page.evaluate(()=>{
    function sceneFromRoot(main) {
      let fiber=main[Object.keys(main).find(k=>k.startsWith('__reactFiber'))];
      while(fiber&&!fiber.memoizedProps?.scene)fiber=fiber.return;
      return fiber?.memoizedProps?.scene;
    }
    const main=document.querySelector('main');
    const scene=sceneFromRoot(main);
    if(!scene)throw Error('scene not found');
    const sceneBytes=JSON.stringify(scene);
    const geometry=[...document.querySelectorAll('.react-flow__node,[data-port-id],[data-wire-id] polyline')].map(e=>({style:e.getAttribute('style'),points:e.getAttribute('points')}));
    const sizes=[...document.querySelectorAll('[data-node-id],[data-section-id],[data-road-id],[data-junction-id]')].map(e=>({id:e.dataset.nodeId??e.dataset.sectionId??e.dataset.roadId??e.dataset.junctionId,width:e.offsetWidth,height:e.offsetHeight}));
    const zoom=Number(main.style.getPropertyValue('--paint-zoom'));
    const labels=[...document.querySelectorAll('[data-label-frame]')].map(e=>{
      const t=e.querySelector('strong'),s=getComputedStyle(t),b=e.getBoundingClientRect(),r=t.getBoundingClientRect();
      const visible=Number(s.opacity)>0;
      const contained=r.left>=b.left-.01&&r.top>=b.top-.01&&r.right<=b.right+.01&&r.bottom<=b.bottom+.01;
      return {text:t.textContent,kind:e.parentElement.dataset.nodeId?'node':'section',opacity:Number(s.opacity),contained,clip:getComputedStyle(e).overflow,fit:Number(e.style.getPropertyValue('--label-fit')),font:s.fontSize,screenHeight:r.height,rect:r.toJSON(),frame:b.toJSON(),visible};
    });
    return {sceneBytes,geometry,sizes,zoom,labels,count:window.__layoutRecalcCount,camera:document.querySelector('.react-flow__viewport').style.transform,preset:main.dataset.density};
  });
  const report={scenes:{},errors};
  for(const scene of ['nested','templates','scale']) report.scenes[scene]=await captureScene(scene);
  assert(errors.length===0,'browser errors');
  return report;

  async function scaleShot(scene,name) {
    if(scene==='scale')await page.screenshot({path:out+name+'.png'});
  }
  async function focusScene(scene) {
    const name={scale:'contract',templates:'overview',nested:'Section 1'}[scene];
    const button=page.getByRole('button',{name,exact:true});
    if(await button.count())await button.click();
  }
  function constantSize(x,first) {
    if(x.zoom>1||x.zoom<=.2)return first;
    const reference=first??x;
    const common=x.labels.filter(l=>l.visible&&reference.labels.find(f=>f.text===l.text&&f.visible));
    assert(common.every(l=>Math.abs(l.screenHeight-reference.labels.find(f=>f.text===l.text).screenHeight)<.02),'screen font height drift');
    return reference;
  }
  async function legibleShot(scene,preset,x) {
    if(preset!=='comfortable'||x.zoom<=.5||x.zoom>=.6)return;
    assert(x.labels.some(l=>l.kind==='node'&&l.visible),'no legible node labels');
    await scaleShot(scene,'scale-zoomed-out-legible');
  }
  async function captureScene(scene) {
    await page.goto('http://127.0.0.1:5191/roads-prototype.html?'+scene);
    await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length);
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-label-frame]')].every(e=>e.style.getPropertyValue('--label-fit')));
    await page.mouse.move(5,5);await frame();
    const initial=await read();assert(initial.preset==='comfortable','default preset');
    const rows=[];const scenesByPreset={};const completeLabels=[];
    await probe('initial',initial.count);
    await scaleShot(scene,'scale-default-roads-off');
    await capturePresets();
    assert(new Set(Object.values(scenesByPreset)).size===1,'preset scene byte identity');
    await page.getByRole('combobox',{name:'Density',exact:true}).selectOption('comfortable');
    await sweepPresets();
    await interactions();
    return {initial,rows,completeLabels,presetByteIdentity:true};

    async function probe(action,before) {
      await frame();const x=await read();
      assert(x.count-before===0,scene+': layout delta '+action);
      assert(x.sceneBytes===initial.sceneBytes,scene+': scene bytes '+action);
      assert(JSON.stringify(x.geometry)===JSON.stringify(initial.geometry),scene+': geometry '+action);
      assert(JSON.stringify(x.sizes)===JSON.stringify(initial.sizes),scene+': rendered sizes '+action);
      assert(x.labels.every(l=>l.clip==='clip'),scene+': missing hard clip');
      assert(x.labels.every(l=>!l.visible||l.contained),scene+': visible label overflow '+action);
      assert(x.zoom>.15||x.labels.every(l=>!l.visible),scene+': below min');
      const scale=Math.max(1,1/x.zoom);
      x.labels.filter(l=>l.visible).forEach(l=>assert(l.fit>scale,scene+': fit inequality'));
      rows.push({action,preset:x.preset,zoom:x.zoom,layoutDelta:x.count-before,sceneBytesEqual:true,geometryBytesEqual:true,sizesBytesEqual:true,visibleNodes:x.labels.filter(l=>l.visible&&l.kind==='node').length,visibleSections:x.labels.filter(l=>l.visible&&l.kind==='section').length,overflow:0});
      completeLabels.push({action,preset:x.preset,zoom:x.zoom,labels:x.labels});
      return x;
    }
    async function capturePresets() {
      for(const preset of ['compact','comfortable','expanded']) {
        const before=(await read()).count;
        await page.getByRole('combobox',{name:'Density',exact:true}).selectOption(preset);
        const x=await probe('preset-switch',before);
        assert(x.camera===initial.camera,'preset moved camera');
        scenesByPreset[preset]=x.sceneBytes;
        await scaleShot(scene,'scale-'+preset);
      }
    }
    async function zoomIn() {
      const button=page.getByRole('button',{name:'Zoom In',exact:true});
      for(let i=0;i<18&&await button.isEnabled();i++) {
        const before=(await read()).count;
        await button.click();
        await probe('zoom-in-'+i,before);
      }
      assert((await read()).zoom===2,'maximum zoom not exercised');
    }
    async function zoomOut(preset) {
      const button=page.getByRole('button',{name:'Zoom Out',exact:true});
      let first=null;
      for(let i=0;i<18&&await button.isEnabled();i++) {
        const before=(await read()).count;
        await button.click();
        const x=await probe('zoom-out-'+i,before);
        first=constantSize(x,first);
        await legibleShot(scene,preset,x);
      }
      assert((await read()).zoom===.1,'minimum zoom not exercised');
    }
    async function sweepPresets() {
      for(const preset of ['compact','comfortable','expanded']) {
        await page.getByRole('combobox',{name:'Density',exact:true}).selectOption(preset);
        await zoomIn();
        await zoomOut(preset);
      }
    }
    async function interactions() {
      await page.getByRole('combobox',{name:'Density',exact:true}).selectOption('comfortable');
      await page.getByRole('button',{name:'Fit View',exact:true}).click();await frame();
      await focusScene(scene);
      const node=page.locator('[data-node-id]').first();
      await node.hover();await page.waitForTimeout(130);await probe('hover',initial.count);
      await node.click();await probe('selection',initial.count);
      await node.click();await page.mouse.move(5,5);await page.waitForTimeout(130);await probe('clear',initial.count);
      await page.getByRole('checkbox',{name:'Show roads'}).check();await probe('roads-on',initial.count);
      await page.getByRole('button',{name:'Fit View',exact:true}).click();await frame();
      await scaleShot(scene,'scale-roads-on');
      await page.getByRole('checkbox',{name:'Show roads'}).uncheck();
      await scaleShot(scene,'scale-roads-off');
    }
  }
}
