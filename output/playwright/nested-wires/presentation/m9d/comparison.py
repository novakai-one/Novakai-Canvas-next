"""Render an evidence comparison and actual native SVG without an additional server."""
import base64,json
from browser import OUT,command,run
images=[{'name':n,'url':'data:image/png;base64,'+base64.b64encode((OUT/('scale-'+n+'.png')).read_bytes()).decode()} for n in ['compact','expanded']]
svg='data:image/svg+xml;base64,'+base64.b64encode((OUT/'export-first.svg').read_bytes()).decode()
source=(OUT/'comparison.js').read_text().replace('IMAGES',json.dumps(images)).replace('const svg=SVG;', 'const svg='+json.dumps(svg)+';')
try:
    command('open','http://127.0.0.1:5191/roads-prototype.html?scale')
    command('snapshot')
    # Avoid argv limits for embedded screenshots by supplying JS through a temporary runner file.
    wrapped='async () => {\n'+source.replace('export async function','async function')+'\nreturn capture(page);\n}'
    (OUT/'comparison-input.js').write_text(wrapped)
    result=command('run-code','--filename='+str(OUT/'comparison-input.js'))
    report=json.loads(result.split('### Result\n',1)[1].split('\n###',1)[0])
    (OUT/'comparison.json').write_text(json.dumps(report,indent=2)+'\n')
    print('PASS comparison and native SVG preview')
finally:
    command('close')
    (OUT/'comparison-input.js').unlink(missing_ok=True)
