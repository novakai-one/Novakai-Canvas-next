"""Serial headless reliability gates; never owns or starts a server."""
import json, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
SOURCE=OUT.parent/'m9a'

def batch(runner, count, label):
    exits=[]
    for i in range(1,count+1):
        result=subprocess.run(['python3',str(SOURCE/runner)],cwd=ROOT,capture_output=True,text=True)
        (OUT/f'{label}-{i:02}.log').write_text(result.stdout+result.stderr+f'\nexit {result.returncode}\n')
        exits.append(result.returncode)
        (OUT/f'{label}-exits.json').write_text(json.dumps(exits)+'\n')
        print(label,i,'exit',result.returncode,flush=True)
        if result.returncode: raise SystemExit(result.returncode)
        if label=='spotlight': shutil.copyfile(OUT/'spotlight.json',OUT/f'spotlight-{i:02}.json')
        if label=='browser':
            for name in ['browser.json','selection.json']:
                shutil.copyfile(SOURCE/name,OUT/f'{label}-{i:02}-{name}')

batch('verify-spotlight.py',20,'spotlight')
batch('verify-browser.py',3,'browser')
for name in ['scale-off.png','scale-on.png','templates-off.png','toolbar-full-width.png',
             'nested-selection-default.png','nested-selection-cleared.png',
             'nested-selection-node-selected.png','nested-selection-wire-selected.png']:
    shutil.copyfile(SOURCE/name,OUT/name)
