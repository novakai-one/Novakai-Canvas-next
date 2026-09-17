"""Fresh 5191 paint capture followed by the byte-unchanged M9c contrast assertions."""
import ast,hashlib,json,shutil,subprocess,tempfile
from pathlib import Path
from browser import command,run,ROOT,OUT
old=OUT.parent/'m9c'
module=ast.parse((old/'verify-paint.py').read_text())
source=next(ast.literal_eval(n.value) for n in module.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='source' for t in n.targets))
source=source.replace('presentation/m9c/','presentation/m9d/').replace('PHASE','after')
try:
    command('open','http://127.0.0.1:5191/roads-prototype.html?scale')
    command('snapshot')
    report=run(source)
    (OUT/'after-paint.json').write_text(json.dumps(report,indent=2)+'\n')
finally:command('close')
with tempfile.TemporaryDirectory(prefix='m9d-contrast-') as temp:
    saved=Path(temp)/'m9c';shutil.copytree(old,saved)
    try:
        shutil.copy2(OUT/'after-paint.json',old/'after-paint.json')
        runner=old/'verify-contrast.py';before=runner.read_bytes()
        result=subprocess.run(['python3',str(runner)],cwd=ROOT,capture_output=True,text=True)
        assert runner.read_bytes()==before
        (OUT/'contrast-check.txt').write_text(result.stdout+result.stderr+f'\nexit {result.returncode}\nrunner sha256 {hashlib.sha256(before).hexdigest()}\n')
        shutil.copy2(old/'contrast.json',OUT/'contrast.json')
        print(result.stdout,flush=True)
        assert result.returncode==0
    finally:shutil.copytree(saved,old,dirs_exist_ok=True)
