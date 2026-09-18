/** Headless M10a gates; stop immediately on the first failed assertion. */
import { chromium } from '/Users/christopherdasca/Documents/Codex/2026-09-16/fi/outputs/visual-truth-audit/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = new URL('./', import.meta.url);
const report = {probes: [], errors: [], captures: []};
const save = () => writeFileSync(new URL('browser-gates.json', out), JSON.stringify(report, null, 2)+'\n');
const browser = await chromium.launch({headless:true});
async function read(page) {
 return page.evaluate(() => {
  const main=document.querySelector('main');
  let fiber=main[Object.keys(main).find(k=>k.startsWith('__reactFiber'))];
  while(fiber&&!fiber.memoizedProps?.scene)fiber=fiber.return;
  const scene=fiber.memoizedProps.scene;
  const labels=[...document.querySelectorAll('[data-label-frame] strong')].map(t=>{
   const s=getComputedStyle(t),r=t.getBoundingClientRect(),b=t.parentElement.getBoundingClientRect();
   return {text:t.textContent,title:t.title,kind:t.closest('[data-node-id]')?'node':'section',opacity:Number(s.opacity),font:s.fontSize,screenHeight:r.height,contained:r.left>=b.left-.01&&r.top>=b.top-.01&&r.right<=b.right+.01&&r.bottom<=b.bottom+.01,rect:r.toJSON(),frame:b.toJSON()};
  });
  return {zoom:Number(main.style.getPropertyValue('--paint-zoom')),count:window.__layoutRecalcCount,sceneBytes:JSON.stringify(scene),labels,sections:scene.sections,nodes:scene.nodes};
 });
}
async function zoom(page,z) {
 await page.evaluate(async z=>{
  const e=document.querySelector('.react-flow__viewport');let f=e[Object.keys(e).find(k=>k.startsWith('__reactFiber'))];
  while(f&&!f.memoizedProps?.value?.getState)f=f.return;
  const s=f.memoizedProps.value.getState(),v=s.panZoom.getViewport();
  await s.panZoom.setViewport({x:s.width/2-(s.width/2-v.x)*z/v.zoom,y:s.height/2-(s.height/2-v.y)*z/v.zoom,zoom:z});
 },z);
 await page.waitForTimeout(600);
}
async function shot(page,name) {await page.mouse.move(5,5);await page.waitForTimeout(150);await page.screenshot({path:new URL(name,out).pathname});report.captures.push(name);}
try {
 const pages={}; const states={};
 for(const [tag,port] of [['before',5191],['after',5196]]) {
  const page=await browser.newPage({viewport:{width:1920,height:1440},deviceScaleFactor:1});pages[tag]=page;
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/roads-prototype.html?scale`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length);
  await page.getByRole('button',{name:'Fit View',exact:true}).click();await page.waitForTimeout(600);
  states[tag]=await read(page);
  writeFileSync(new URL(`scene-${tag}.json`,out),states[tag].sceneBytes);
 }
 assert.equal(states.before.sceneBytes,states.after.sceneBytes,'scene bytes differ');report.sceneByteIdentical=true;
 const page=pages.after,initial=states.after;
 for(const requested of ['fit',.3,.5,.8,1.2]) {
  if(requested!=='fit')await zoom(page,requested);
  const x=await read(page);const nodes=x.labels.filter(l=>l.kind==='node'),sections=x.labels.filter(l=>l.kind==='section');
  const row={requested,zoom:x.zoom,nodeTotal:nodes.length,visibleNodes:nodes.filter(l=>l.opacity>0).length,sectionTotal:sections.length,visibleSections:sections.filter(l=>l.opacity>0).length,nodeTs:nodes.filter(l=>l.text.includes('.ts')).length,sectionSlashes:sections.filter(l=>l.text.includes('/')).length,nodeTitles:nodes.filter(l=>l.title&&l.text===l.title.replace(/\.ts$/u,'')).length,sectionTitles:sections.filter(l=>l.title&&l.text===l.title.split('/').at(-1)).length,layoutDelta:x.count-initial.count,overflow:x.labels.filter(l=>l.opacity>0&&!l.contained),labels:x.labels};
  report.probes.push(row);save();
  assert.equal(nodes.length,40);assert([0,40].includes(row.visibleNodes),'partial node labels');
  assert.equal(row.visibleSections,sections.length,'hidden section labels');
  assert.equal(row.nodeTs,0);assert.equal(row.sectionSlashes,0);assert.equal(row.nodeTitles,40);assert.equal(row.sectionTitles,sections.length);
  assert.equal(row.layoutDelta,0);assert.equal(x.sceneBytes,initial.sceneBytes);
  assert.equal(row.overflow.length,0,'visible labels overflow their frames');
  if(row.visibleNodes)assert.equal(new Set(nodes.map(l=>l.screenHeight.toFixed(2))).size,1,'nonuniform node font size');
 }
 report.zoomAndLabelsPass=true;
 for(const tag of ['before','after']) {
  const p=pages[tag];await p.getByRole('button',{name:'Fit View',exact:true}).click();await p.waitForTimeout(600);
  await shot(p,`m10a-${tag}-idle.png`);
  await p.getByRole('checkbox',{name:'Show roads'}).check();await p.getByRole('button',{name:'Fit View',exact:true}).click();await p.waitForTimeout(600);
  await shot(p,`m10a-${tag}-roads-on.png`);
  await p.getByRole('checkbox',{name:'Show roads'}).uncheck();await p.getByRole('button',{name:'Fit View',exact:true}).click();await p.waitForTimeout(600);await zoom(p,1.2);
  await shot(p,`m10a-${tag}-mid-zoom.png`);
 }
 await page.getByRole('button',{name:'Fit View',exact:true}).click();await page.waitForTimeout(600);
 const node=page.locator('[data-node-id]').first();await node.click();await page.mouse.move(5,5);await page.waitForTimeout(150);
 const selected=await read(page);report.selection={layoutDelta:selected.count-initial.count,sceneByteIdentical:selected.sceneBytes===initial.sceneBytes};assert.equal(report.selection.layoutDelta,0);assert(report.selection.sceneByteIdentical);
 report.pass=true;
} catch(e) {report.pass=false;report.failure=String(e);await shot((await browser.contexts().at(-1).pages())[0],'m10a-stop.png');process.exitCode=1;console.error(e);}
finally {save();await browser.close();}
console.log(JSON.stringify({pass:report.pass,failure:report.failure,probes:report.probes.map(row=>{const summary={...row};delete summary.labels;return {...summary,overflow:row.overflow.length};})},null,2));
