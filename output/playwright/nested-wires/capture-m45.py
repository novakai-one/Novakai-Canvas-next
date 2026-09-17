"""Only isolated, nonpersistent headless Playwright; existing Vite is never restarted."""
import json
import subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'output/playwright/nested-wires'
CLI = Path.home() / '.codex/skills/playwright/scripts/playwright_cli.sh'
BASELINE = ROOT / '.local/m45/baseline-scene.json'
BASELINE.parent.mkdir(parents=True, exist_ok=True)
BASELINE.write_bytes(subprocess.check_output(['git', 'show', '0e5f21e:output/playwright/nested-wires/scene.json'], cwd=ROOT))
def command(*args):
    result = subprocess.run([str(CLI), '-s=m45-capture', *args], cwd=ROOT, text=True, capture_output=True, check=True)
    if '### Error' in result.stdout: raise RuntimeError(result.stdout)
    return result.stdout
try:
    opened = command('open', 'http://127.0.0.1:5188/roads-prototype.html?nested')
    command('snapshot')
    source = (OUT / 'capture-m45.mjs').read_text().replace('export async function', 'async function')
    result = command('run-code', 'async () => {\n' + source + '\nreturn capture(page,' + json.dumps('/@fs/' + str(BASELINE)) + ');\n}')
    report = json.loads(result.split('### Result\n', 1)[1].split('\n###', 1)[0])
    (OUT / 'm45-browser.json').write_text(json.dumps(report, indent=2)+'\n')
    images = [f'http://127.0.0.1:5188/@fs/{OUT}/m45-junction-{side}.png' for side in ['before','after']]
    html = '<html><body style="margin:0;background:#fafafa;font:18px system-ui;display:flex;gap:16px;padding:20px">' + ''.join(f'<div><p>M4{".5" if i else ""} · J21 · {2 if i else 6} crossings</p><img width="448" src="{src}"></div>' for i,src in enumerate(images)) + '</body></html>'
    command('run-code', 'async () => { await page.setViewportSize({width:952,height:550}); await page.setContent(' + json.dumps(html) + '); await page.locator("img").evaluateAll(xs => Promise.all(xs.map(x => x.decode()))); await page.screenshot({path:' + json.dumps(str(OUT / 'm45-junction-before-after.png')) + '}); }')
    assert report['medianMilliseconds'] <= 300, report
    assert report['nodes'] == 24 and report['wires'] == 26 and report['layoutRecalcCount'] == 1 and report['roadsOff']
    print(f"PASS five loads={[l['roads:navigation-to-ready'] for l in report['loads']]}; median={report['medianMilliseconds']:.3f} ms <=300")
    print('PASS headless captures: immutable M4 before / current M4.5 after, overview, roads-off; 24 nodes / 26 wires; layout count 1')
finally:
    command('close')
