"""Own headless session and 5191 only; inherited selection assertions unchanged."""
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
CLI=Path.home()/'.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    result=subprocess.run([str(CLI),'-s=m9a',*args],cwd=ROOT,capture_output=True,text=True)
    if result.returncode or '### Error' in result.stdout:
        raise RuntimeError(result.stdout+result.stderr)
    return result.stdout
def parsed(result):
    return json.loads(result.split('### Result\n',1)[1].split('\n###',1)[0])
try:
    command('open','http://127.0.0.1:5191/roads-prototype.html?scale')
    (OUT/'browser-snapshot.txt').write_text(command('snapshot'))
    source=(OUT/'capture.mjs').read_text().replace('export async function','async function')
    report=parsed(command('run-code','async () => {\n'+source+'\nreturn capture(page);\n}'))
    (OUT/'browser.json').write_text(json.dumps(report,indent=2)+'\n')
    for mode, data in report['loads'].items():
        print(mode, json.dumps(data['medians']),flush=True)
    assert not report.get('stop'), report.get('stop')
    original=(ROOT/'apps/web/cli/verify-selection.mjs').read_text()
    proxy='''
const transport=new Proxy(page,{get(target,key){
  if(key==='goto')return (url,...args)=>target.goto(url.replace('http://127.0.0.1:5188/','http://127.0.0.1:5191/'),...args);
  if(key==='screenshot')return options=>target.screenshot({...options,path:options.path.replace('output/playwright/nested-wires/m4-selection-','output/playwright/nested-wires/presentation/m9a/nested-selection-')});
  const value=target[key];return typeof value==='function'?value.bind(target):value;
}});
return verify(transport);
'''
    selection=parsed(command('run-code','async () => {\n'+original.replace('export async function','async function')+'\n'+proxy+'\n}'))
    selection['runnerSha256']=hashlib.sha256(original.encode()).hexdigest()
    selection['transport']='5191 only; unchanged assertion body; screenshots redirected; ruling #7 ceiling 450ms'
    (OUT/'selection.json').write_text(json.dumps(selection,indent=2)+'\n')
    print('\n'.join(selection['messages']),flush=True)
    print('Selection median:',selection['performance']['median'],flush=True)
    assert selection['performance']['median']<=450
    print('PASS lazy audit, labels, toolbar, five-load medians, selection assertions and zero click deltas',flush=True)
finally:
    command('close')
