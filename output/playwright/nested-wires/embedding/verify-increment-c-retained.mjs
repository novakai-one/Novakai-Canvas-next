import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {gunzipSync,gzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import * as api from '../../../../capability/layout/contract/index.ts';
const path='output/playwright/nested-wires/templates-scene/verify-templates-scene.mjs';
const source=readFileSync(path,'utf8').replace(/^import[\s\S]*?;\n/gm,'').replaceAll('import.meta.url','verifierUrl');
for(const name of ['templates','scale']) {
 const data=JSON.parse(gunzipSync(readFileSync(`output/playwright/nested-wires/embedding/increment-b-${name}-active.json.gz`)));
 const shape=s=>[s.number,s.nodes.map(n=>n.label),s.children.map(shape)];
 const config={directory:pathToFileURL(process.cwd()+`/output/playwright/nested-wires/${name}-scene/`).href,specFile:name==='scale'?'scale-scene-spec.json':'scene-spec.json',nodeCount:data.before.nodes.length,sectionCount:data.before.sections.length,wireCount:data.before.wiring.value.length,expectedShape:data.spec.sections.map(shape)};
 const messages=[], artifacts={};
 const candidate=api.createNestedRoadScene;
 const proc={argv:['node',path,JSON.stringify(config)],exitCode:0};
 const scope={assert,URL,verifierUrl:pathToFileURL(process.cwd()+'/'+path).href,process:proc,readFileSync,
  writeFileSync:(url,value)=>{artifacts[String(url).split('/').at(-1)]=JSON.parse(value);},
  console:{log:(...s)=>messages.push(s.join(' ')),error:(...s)=>messages.push(s.join(' '))},
  createNestedRoadScene:candidate,inspectNestedWires:api.inspectNestedWires,
 };
 new Function(...Object.keys(scope),source)(...Object.values(scope));
 const certificate=artifacts['crossing-certificates.json'];
 const baseline=JSON.parse(readFileSync(`output/playwright/nested-wires/${name}-scene/crossing-certificates.json`));
 const crossings=Object.values(certificate.counts).reduce((a,b)=>a+b,0);
 assert.equal(proc.exitCode,0,`${name}: independent verifier failure`);
 assert.equal(certificate.uncovered.length,0);
 assert.equal(crossings,certificate.lowerBound);
 assert.equal(crossings,name==='templates'?130:112);
 delete artifacts['scene.json'];
 writeFileSync(`output/playwright/nested-wires/embedding/increment-c-${name}-certificates.json.gz`,gzipSync(JSON.stringify(artifacts)));
 writeFileSync(`output/playwright/nested-wires/embedding/increment-c-${name}-verifier.json`,JSON.stringify({scope:'Unchanged independent verifier on complete active C builder. All assertions preserved.',exitCode:proc.exitCode,messages,crossings,lowerBound:certificate.lowerBound,uncertified:certificate.uncovered.length,baselineCrossings:Object.values(baseline.counts).reduce((a,b)=>a+b,0),certificateArtifact:`increment-c-${name}-certificates.json.gz`},null,2));
 console.log(name,proc.exitCode,messages.filter(s=>s.startsWith('FAIL')||s.includes('crossing')||s.includes('UNCERT')||s.includes('LOWER')));
}
