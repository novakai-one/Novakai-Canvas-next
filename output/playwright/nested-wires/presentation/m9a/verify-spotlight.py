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
    (OUT/'spotlight-snapshot.txt').write_text(command('snapshot'))
    scene=json.loads((ROOT/'output/playwright/nested-wires/scale-scene/scene.json').read_text())
    wires=[{key:w[key] for key in ['id','from','to']} for w in scene['wiring']['value']]
    source=(OUT/'spotlight.mjs').read_text().replace('export async function','async function')
    report=parsed(command('run-code','async () => {\n'+source+'\nreturn spotlightCapture(page,'+json.dumps(wires)+');\n}'))
    (OUT/'spotlight.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2),flush=True)
    command('run-code', """async () => {
      await page.getByRole('checkbox',{name:'Show roads'}).uncheck();
      await page.getByRole('button',{name:'contract',exact:true}).click();
      await page.mouse.move(5,5);
      await page.waitForTimeout(400);
      await page.screenshot({path:'output/playwright/nested-wires/presentation/m9a/scale-contract-detail-idle.png'});
      await page.locator('[data-node-id="node-1"] strong').hover();
      await page.waitForTimeout(180);
      await page.screenshot({path:'output/playwright/nested-wires/presentation/m9a/scale-contract-detail-hover.png'});
    }""")
finally:
    command('close')
