"""Counterfactual oracle check: a wrong net must time out, never pass polling."""
import json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
CLI=Path.home()/'.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    result=subprocess.run([str(CLI),'-s=m9a-fail-closed',*args],cwd=ROOT,capture_output=True,text=True)
    if result.returncode and args[0]!='run-code': raise RuntimeError(result.stdout+result.stderr)
    return result.stdout+result.stderr
source=(OUT.parent/'m9a/spotlight.mjs').read_text().replace('export async function','async function')
source=source.replace('if(wire) return new Set([id,wire.from,wire.to]);',"if(wire) return new Set([id,wire.from,wire.to,'node-3']);")
# This run checks failure only; do not replace the successful gate's screenshot evidence.
source=source.replace('await page.screenshot(', 'await Promise.resolve(')
scene=json.loads((ROOT/'output/playwright/nested-wires/scale-scene/scene.json').read_text())
wires=[{k:w[k] for k in ['id','from','to']} for w in scene['wiring']['value']]
try:
    command('open','http://127.0.0.1:5191/roads-prototype.html?scale')
    result=command('run-code','async () => {\n'+source+'\nreturn spotlightCapture(page,'+json.dumps(wires)+');\n}')
    (OUT/'fail-closed.log').write_text(result)
    assert 'Timeout 5000ms exceeded' in result and 'waitForFunction' in result, result
    print('PASS deliberately wrong wire net (extra node-3) times out at the exact-membership wait; app unchanged')
finally:
    command('close')
