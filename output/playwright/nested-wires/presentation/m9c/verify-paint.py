"""Read-only headless paint evidence; --before captures the unmodified branch base."""
import json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
CLI=Path.home()/'.codex/skills/playwright/scripts/playwright_cli.sh'
BEFORE='--before' in sys.argv

def command(*args):
    result=subprocess.run([str(CLI),'-s=m9c',*args],cwd=ROOT,capture_output=True,text=True)
    if result.returncode or '### Error' in result.stdout: raise RuntimeError(result.stdout+result.stderr)
    return result.stdout

def parsed(result):
    return json.loads(result.split('### Result\n',1)[1].split('\n###',1)[0])

source=r'''async () => {
  await page.setViewportSize({width:1920,height:1440});
  const report={};
  for(const scene of ['scale','templates','nested']) {
    await page.goto('http://127.0.0.1:5191/roads-prototype.html?'+scene);
    await page.waitForFunction(()=>performance.getEntriesByName('roads:navigation-to-ready').length);
    await page.mouse.move(5,5);
    const read=()=>page.evaluate(()=>{
      const style=e=>{const s=getComputedStyle(e);return {color:s.color,background:s.backgroundColor,opacity:s.opacity,stroke:s.stroke,shadow:s.boxShadow};};
      const geometry=[...document.querySelectorAll('.react-flow__viewport,.react-flow__node,[data-port-id],[data-wire-id] polyline')].map(e=>({style:e.getAttribute('style'),points:e.getAttribute('points'),bounds:e.getBoundingClientRect().toJSON()}));
      const sections=[...document.querySelectorAll('[data-section-id]')].map(e=>({id:e.dataset.sectionId,parent:e.dataset.parentSection,label:e.textContent,zoom:e.getBoundingClientRect().width/e.offsetWidth,parity:e.dataset.depthParity,family:e.dataset.sectionFamily,style:style(e),rect:e.getBoundingClientRect().toJSON(),text:e.querySelector('strong').getBoundingClientRect().toJSON(),tab:{width:getComputedStyle(e,'::before').width,height:getComputedStyle(e,'::before').height,top:getComputedStyle(e,'::before').top,left:getComputedStyle(e,'::before').left,color:getComputedStyle(e,'::before').backgroundColor}}));
      const wires=[...document.querySelectorAll('[data-wire-id]')].map(e=>({id:e.dataset.wireId,converging:e.dataset.converging==='true',group:style(e),halo:style(e.querySelector('polyline')),path:style(e.querySelector('polyline:nth-of-type(2)'))}));
      const nodes=[...document.querySelectorAll('[data-node-id]')].map(e=>({id:e.dataset.nodeId,style:style(e),text:style(e.querySelector('strong'))}));
      const canvas=style(document.querySelector('main'));
      const roads=[...document.querySelectorAll('[data-road-id],[data-junction-id]')].map(e=>({id:e.dataset.roadId??e.dataset.junctionId,style:style(e)}));
      return {geometry,sections,wires,nodes,canvas,roads,count:window.__layoutRecalcCount};
    });
    report[scene]=await read();
    await page.screenshot({path:'output/playwright/nested-wires/presentation/m9c/'+scene+'-PHASE.png'});
  }
  return report;
}'''
try:
    command('open','http://127.0.0.1:5191/roads-prototype.html?scale')
    (OUT/('before-snapshot.txt' if BEFORE else 'after-snapshot.txt')).write_text(command('snapshot'))
    report=parsed(command('run-code',source.replace('PHASE','before' if BEFORE else 'after')))
    (OUT/('before-paint.json' if BEFORE else 'after-paint.json')).write_text(json.dumps(report,indent=2)+'\n')
    if not BEFORE:
        baseline=json.loads((OUT/'before-paint.json').read_text())
        for scene,data in report.items():
            assert data['geometry']==baseline[scene]['geometry'],scene+': geometry differs'
            assert data['count']==1
        print('PASS exact browser geometry/camera/styles across three scenes; one layout each')
finally:
    command('close')
