"""Invoke unchanged M2/M4 assertions with a page transport redirect to our own 5191.
Only URL and screenshot destinations are adapted; no acceptance assertion changes.
"""
import hashlib
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    r = subprocess.run([str(CLI), '-s=m7-nested-regression', *args], cwd=ROOT, capture_output=True, text=True, check=True)
    if '### Error' in r.stdout:
        raise RuntimeError(r.stdout)
    return r.stdout
try:
    command('open', 'http://127.0.0.1:5191/roads-prototype.html?nested')
    command('snapshot')
    path = ROOT / 'apps/web/cli/verify-selection.mjs'
    original = path.read_text()
    proxy = '''
const transport = new Proxy(page, {get(target,key) {
  if(key==='goto')return (url,...args)=>target.goto(url.replace('http://127.0.0.1:5188/','http://127.0.0.1:5191/'),...args);
  if(key==='screenshot')return (options)=>target.screenshot({...options,path:options.path.replace('output/playwright/nested-wires/m4-selection-','output/playwright/nested-wires/scale-scene/nested-selection-')});
  const value=target[key]; return typeof value==='function' ? value.bind(target) : value;
}});
return verify(transport);
'''
    output = command('run-code', 'async () => {\n' + original.replace('export async function', 'async function') + '\n' + proxy + '\n}')
    report = json.loads(output.split('### Result\n',1)[1].split('\n###',1)[0])
    report['runnerSha256'] = hashlib.sha256(original.encode()).hexdigest()
    report['transport'] = '5191 only; unchanged assertions; screenshots redirected'
    (OUT / 'nested-selection.json').write_text(json.dumps(report,indent=2)+'\n')
    print('\n'.join(report['messages']))
    print(f"MEASURE inherited selection five-load median={report['performance']['median']} ms")
    assert report['performance']['median'] <= 300
    print('PASS default nested browser selection; unchanged runner assertions; median <=300 ms')
finally:
    command('close')
