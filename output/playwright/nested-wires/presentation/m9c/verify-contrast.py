"""WCAG sRGB formula over browser-resolved colors, halo then stroke alpha compositing."""
import json,re
from pathlib import Path
OUT=Path(__file__).resolve().parent
report=json.loads((OUT/'after-paint.json').read_text())
def rgb(value):
    if isinstance(value,list):return value
    parts=[float(x) for x in re.findall(r'[\d.]+',value)]
    return parts[:3] if value.startswith('color(srgb ') else [x/255 for x in parts[:3]]
def lum(color):
    return sum(w*(c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4) for w,c in zip([.2126,.7152,.0722],color))
def ratio(a,b):return (max(lum(a),lum(b))+.05)/(min(lum(a),lum(b))+.05)
def composite(fg,bg,alpha):return [f*alpha+b*(1-alpha) for f,b in zip(fg,bg)]
results=[];text=[];tabs=[]
for scene,data in report.items():
    backgrounds={'canvas':data['canvas']['background']}
    backgrounds.update({s['id']+':'+s['label']:s['style']['background'] for s in data['sections']})
    backgrounds.update({n['id']:n['style']['background'] for n in data['nodes']})
    backgrounds.update({r['id']:r['style']['background'] for r in data['roads']})
    shadow=data['nodes'][0]['style']['shadow']
    shadow_color=re.search(r'rgba?\([^)]*\)',shadow).group(0)
    shadow_alpha=float(re.findall(r'[\d.]+',shadow_color)[3])
    for name,value in list(backgrounds.items()):
        backgrounds[name+':max-shadow-underlay']=composite(rgb(shadow_color),rgb(value),shadow_alpha)
    for converging in [False,True]:
        wire=next(w for w in data['wires'] if w['converging']==converging)
        assert all(w['path']==wire['path'] and w['halo']==wire['halo'] and float(w['group']['opacity'])==1 for w in data['wires'] if w['converging']==converging)
        for name,value in backgrounds.items():
            bg=rgb(value)
            halo=composite(rgb(wire['halo']['stroke']),bg,float(wire['halo']['opacity']))
            painted=composite(rgb(wire['path']['stroke']),halo,float(wire['path']['opacity']))
            results.append({'scene':scene,'background':name,'color':value,'converging':converging,'stroke':wire['path']['stroke'],'alpha':float(wire['path']['opacity']),'haloAlpha':float(wire['halo']['opacity']),'compositedSrgb255':[round(x*255,6) for x in painted],'ratio':ratio(painted,bg)})
    for obj in data['sections']+data['nodes']:
        text.append({'scene':scene,'id':obj['id'],'ratio':ratio(rgb(obj['style']['color']),rgb(obj['style']['background']))})
    for section in data['sections']:
        tab=section['tab']; assert float(tab['width'][:-2])==3
        # Existing border is 1px; derive zoom from the section's real box.
        scale=section['zoom']
        right=section['rect']['left']+(1+float(tab['left'][:-2])+float(tab['width'][:-2]))*scale
        assert right<section['text']['left'],section['id']+': tab overlaps label'
        assert int(section['parity'])==(1 if section.get('parent') else 0)
        tabs.append({'scene':scene,'id':section['id'],'width':tab['width'],'color':tab['color'],'labelGapScreenPx':section['text']['left']-right})
result={'method':__doc__,'wireMeasurements':results,'textMeasurements':text,'accentTabs':tabs,'minimumWireRatio':min(r['ratio'] for r in results),'minimumTextRatio':min(r['ratio'] for r in text)}
(OUT/'contrast.json').write_text(json.dumps(result,indent=2)+'\n')
print('Minimum idle/converging ratio:',result['minimumWireRatio'])
print('Minimum label ratio:',result['minimumTextRatio'])
assert all(r['ratio']>=3 for r in results),'wire contrast below 3:1'
assert all(r['ratio']>=4.5 for r in text),'text contrast below 4.5:1'
print('PASS all resolved canvas/section/node/road/junction backgrounds, labels and accent clearances')
