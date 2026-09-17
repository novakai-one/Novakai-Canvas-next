"""Run unchanged branch gates serially on 5191, retaining/restoring prior evidence bytes."""
import hashlib,json,re,shutil,subprocess,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).resolve().parent
SOURCE=OUT.parent/'m9a'
FOLDERS=[SOURCE,OUT.parent/'m9a-fix']
exits={}
with tempfile.TemporaryDirectory(prefix='m9c-gates-') as temp:
    for folder in FOLDERS:shutil.copytree(folder,Path(temp)/folder.name)
    try:
        for runner in ['verify-offline.py','verify-browser.py','verify-spotlight.py']:
            path=SOURCE/runner
            before=path.read_bytes()
            result=subprocess.run(['python3',str(path)],cwd=ROOT,capture_output=True,text=True)
            assert before==path.read_bytes()
            (OUT/(runner+'.txt')).write_text(result.stdout+result.stderr+f'\nexit {result.returncode}\n')
            exits[runner]={'exit':result.returncode,'sha256':hashlib.sha256(before).hexdigest()}
            if runner=='verify-offline.py':
                for name in re.findall(r'^([\w-]+): exit',result.stdout,re.M):
                    shutil.copy2(SOURCE/(name+'.txt'),OUT/(name+'.txt'))
                for name in ['nested','templates','scale']:
                    shutil.copy2(SOURCE/(name+'-operations.json'),OUT/(name+'-operations.json'))
            print(runner,'exit',result.returncode,flush=True)
            for folder in FOLDERS:
                saved=Path(temp)/folder.name
                for file in folder.iterdir():
                    if file.suffix not in ['.json','.txt','.png']:continue
                    if not (saved/file.name).exists() or file.read_bytes()!=(saved/file.name).read_bytes():
                        shutil.copy2(file,OUT/file.name)
            (OUT/'gate-exits.json').write_text(json.dumps(exits,indent=2)+'\n')
            if result.returncode:raise SystemExit(result.returncode)
    finally:
        for folder in FOLDERS:
            saved=Path(temp)/folder.name
            for target in folder.iterdir():
                if target.is_file() and not (saved/target.name).exists():target.unlink()
            shutil.copytree(saved,folder,dirs_exist_ok=True)
