"""Headless CLI transport: existing 5191 server only; no lifecycle ownership."""
import json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
CLI=Path.home()/'.codex/skills/playwright/scripts/playwright_cli.sh'
def command(*args):
    result=subprocess.run([str(CLI),'-s=m9d',*args],cwd=ROOT,capture_output=True,text=True)
    if result.returncode or '### Error' in result.stdout:raise RuntimeError(result.stdout+result.stderr)
    return result.stdout
def run(source):
    if 'export async function' in source:
        source='async () => {\n'+source.replace('export async function','async function')+'\nreturn capture(page);\n}'
    result=command('run-code',source)
    return json.loads(result.split('### Result\n',1)[1].split('\n###',1)[0])
if __name__=='__main__':
    import sys
    try:
        command('open','http://127.0.0.1:5191/roads-prototype.html?scale')
        (OUT/'snapshot.txt').write_text(command('snapshot'))
        report=run((OUT/sys.argv[1]).read_text())
        (OUT/sys.argv[2]).write_text(json.dumps(report,indent=2)+'\n')
        print('PASS',sys.argv[1],flush=True)
    finally:command('close')
