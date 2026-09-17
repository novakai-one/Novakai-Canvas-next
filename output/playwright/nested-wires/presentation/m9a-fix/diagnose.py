"""Diagnostic only: replay base probe with browser-side event/timer/commit tracing."""
import json, subprocess
from pathlib import Path
ROOT=Path.cwd()
OUT=ROOT/'output/playwright/nested-wires/presentation/m9a-fix'
CLI=Path.home()/'.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    r=subprocess.run([str(CLI),'-s=m9a-diagnosis',*args],capture_output=True,text=True)
    if r.returncode or '### Error' in r.stdout: raise RuntimeError(r.stdout+r.stderr)
    return r.stdout
def parsed(s): return json.loads(s.split('### Result\n',1)[1].split('\n###',1)[0])
source=subprocess.check_output(['git','show','94c605f:output/playwright/nested-wires/presentation/m9a/spotlight.mjs'],text=True).replace('export async function','async function')
source=source.replace("presentation/m9a/'", "presentation/m9a-fix/'")
source=source.replace('count:window.__layoutRecalcCount,', "sample:window.__trace.push({kind:'sample',t:performance.now()}),count:window.__layoutRecalcCount,")
source=source.replace("'net membership '+obj.id", "'net membership '+obj.id+' expected '+(member?'spotlit':'spotlightDim')+' actual '+obj.classes.join()")
scene=json.loads((ROOT/'output/playwright/nested-wires/scale-scene/scene.json').read_text())
wires=[{k:w[k] for k in ['id','from','to']} for w in scene['wiring']['value']]
instrument=r"""
await page.addInitScript(()=>{
  const trace=window.__trace=[];
  const add=(kind,details={})=>trace.push({kind,t:performance.now(),...details});
  const timers=new Set();
  const originalSet=window.setTimeout.bind(window),originalClear=window.clearTimeout.bind(window);
  window.setTimeout=(fn,delay,...args)=>{
    if(delay!==100)return originalSet(fn,delay,...args);
    const timer=originalSet(()=>{add('fire',{timer});fn(...args);},delay);
    timers.add(timer);add('schedule',{timer,delay});return timer;
  };
  window.clearTimeout=timer=>{if(timers.has(timer))add('cancel',{timer});return originalClear(timer);};
  const identity=e=>e?.closest?.('[data-node-id],[data-wire-hit],.react-flow__node')?.outerHTML.split('>')[0]??e?.tagName;
  for(const type of ['mouseover','mouseout'])document.addEventListener(type,e=>add(type,{target:identity(e.target),related:identity(e.relatedTarget),x:e.clientX,y:e.clientY}),true);
  document.addEventListener('DOMContentLoaded',()=>{
    let previous='';
    new MutationObserver(()=>{
      const ids=[...document.querySelectorAll('[class*="_spotlit_"]')].map(e=>e.dataset.nodeId??e.dataset.wireId);
      const current=JSON.stringify(ids);
      if(current!==previous){add('commit',{ids});previous=current;}
    }).observe(document.getElementById('app'),{subtree:true,attributes:true,attributeFilter:['class']});
  });
});
"""
for i in range(1,6):
 try:
    command('open','http://127.0.0.1:5191/roads-prototype.html?scale')
    body=instrument+'\n'+source+'\nlet result;try { result={ok:true,report:await spotlightCapture(page,'+json.dumps(wires)+')};}catch(e){result={ok:false,error:String(e)};} await page.waitForTimeout(500);return {...result,trace:await page.evaluate(()=>window.__trace)};'
    result=parsed(command('run-code','async () => {\n'+body+'\n}'))
    (OUT/f'trace-{i:02}.json').write_text(json.dumps(result,indent=2)+'\n')
    print(i,result.get('error','PASS'),flush=True)
 finally: command('close')
