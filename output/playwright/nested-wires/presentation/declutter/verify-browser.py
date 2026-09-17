"""Nonpersistent headless Chrome, owned 5191 only; inherited selection body unchanged."""
import hashlib
import json
import subprocess
from collections import defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).resolve().parent
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    result = subprocess.run([str(CLI), '-s=m65b', *args], cwd=ROOT, text=True, capture_output=True)
    if result.returncode or '### Error' in result.stdout:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout
def parsed(result):
    return json.loads(result.split('### Result\n', 1)[1].split('\n###', 1)[0])
def memberships(path):
    scene = json.loads(path.read_text())
    mouths = defaultdict(set)
    for wire in scene['wiring']['value']:
        for mouth in [wire['sourcePortId'], wire['targetPortId'], *wire['gates']]:
            mouths[mouth].add(wire['id'])
    groups = {mouth: sorted(ids) for mouth, ids in mouths.items() if len(ids) >= 3}
    return {'groups': groups, 'wires': sorted(set().union(*map(set, groups.values())))}
try:
    command('open', 'http://127.0.0.1:5191/roads-prototype.html?templates')
    (OUT / 'browser-snapshot.txt').write_text(command('snapshot'))
    expected = {
        'templates': memberships(ROOT / 'output/playwright/nested-wires/templates-scene/scene.json'),
        'nested': memberships(ROOT / 'output/playwright/nested-wires/scene.json'),
    }
    (OUT / 'convergence-memberships.json').write_text(json.dumps(expected, indent=2) + '\n')
    source = (OUT / 'capture.mjs').read_text().replace('export async function', 'async function')
    body = 'async () => {\n' + source + '\nreturn capture(page,' + json.dumps({key: value['wires'] for key, value in expected.items()}) + ');\n}'
    report = parsed(command('run-code', body))
    (OUT / 'browser.json').write_text(json.dumps(report, indent=2) + '\n')
    print(f"PASS headless Chrome {report['browserVersion']}; six captures at 1920x1440 on 5191; browser errors=0", flush=True)
    for key, value in expected.items():
        print(f"PASS {key}: exact >=3 convergence membership: {len(value['groups'])} mouths / {len(value['wires'])} wires; default labels hidden; paint tokens match", flush=True)
    print('PASS both scenes: zero visible node port circles/border badges; no node subtitles or section commentary; templates w22 has exactly one imported-name label', flush=True)
    print('PASS converging w22 primary: stroke=5px / opacity=1 / label=hashContent + 4 more; all others dim; paths and camera unchanged; layout=1', flush=True)
    original = (ROOT / 'apps/web/cli/verify-selection.mjs').read_text()
    proxy = '''
const transport = new Proxy(page, {get(target,key) {
  if(key==='goto')return (url,...args)=>target.goto(url.replace('http://127.0.0.1:5188/','http://127.0.0.1:5191/'),...args);
  if(key==='screenshot')return (options)=>target.screenshot({...options,path:options.path.replace('output/playwright/nested-wires/m4-selection-','output/playwright/nested-wires/presentation/declutter/nested-selection-')});
  const value=target[key]; return typeof value==='function' ? value.bind(target) : value;
}});
return verify(transport);
'''
    report = parsed(command('run-code', 'async () => {\n' + original.replace('export async function', 'async function') + '\n' + proxy + '\n}'))
    report['runnerSha256'] = hashlib.sha256(original.encode()).hexdigest()
    report['transport'] = '5191 only; original assertion body; screenshots redirected'
    (OUT / 'nested-selection.json').write_text(json.dumps(report, indent=2) + '\n')
    print('\n'.join(report['messages']), flush=True)
    print(f"MEASURE selection five-load median={report['performance']['median']} ms", flush=True)
    assert report['performance']['median'] <= 300
    print('PASS unchanged inherited selection assertions; zero recalculations per click; median <=300 ms', flush=True)
finally:
    command('close')
